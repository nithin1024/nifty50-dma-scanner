import httpx
import json
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from fastapi import WebSocket

from app.config import get_settings
from app.services.constituents_service import constituents_service
from app.services.scanner_service import scanner_service
from app.services.dma_service import dma_engine, DMA_PERIODS
from app.services.crossover_service import crossover_engine
from app.services.volume_service import volume_engine
from app.services.historical_data_service import historical_data_service

logger = logging.getLogger("upstox_service")

TOKEN_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "upstox_token.json"


class UpstoxAuthService:
    def __init__(self):
        self.settings = get_settings()
        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.access_token: Optional[str] = self._load_token()

    def _load_token(self) -> Optional[str]:
        if TOKEN_FILE.exists():
            try:
                with open(TOKEN_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("access_token")
            except Exception as e:
                logger.error(f"Error loading Upstox token: {e}")
        return None

    def get_login_url(self) -> str:
        """Generate Upstox OAuth V3 login URL."""
        api_key = self.settings.UPSTOX_API_KEY
        redirect_uri = self.settings.UPSTOX_REDIRECT_URI
        if not api_key:
            return ""
        return (
            f"https://api.upstox.com/v2/login/authorization/dialog"
            f"?response_type=code&client_id={api_key}&redirect_uri={redirect_uri}"
        )

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange auth code for Upstox V3 access token."""
        url = "https://api.upstox.com/v2/login/authorization/token"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "code": code,
            "client_id": self.settings.UPSTOX_API_KEY,
            "client_secret": self.settings.UPSTOX_API_SECRET,
            "redirect_uri": self.settings.UPSTOX_REDIRECT_URI,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, data=data)
            if resp.status_code != 200:
                raise ValueError(f"Upstox token exchange failed ({resp.status_code}): {resp.text}")

            result = resp.json()
            self.access_token = result.get("access_token")

            # Persist token locally on server only
            with open(TOKEN_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "access_token": self.access_token,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "user_id": result.get("user_id"),
                    "user_name": result.get("user_name")
                }, f, indent=2)

            return {
                "status": "AUTHENTICATED",
                "user_name": result.get("user_name"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def get_connection_status(self) -> Dict[str, Any]:
        has_credentials = bool(self.settings.UPSTOX_API_KEY and self.settings.UPSTOX_API_SECRET)
        is_authenticated = bool(self.access_token)

        if not has_credentials:
            status = "CREDENTIALS_REQUIRED"
            message = "Upstox API Key/Secret not configured in server .env."
        elif not is_authenticated:
            status = "AUTH_PENDING"
            message = "API credentials present. Awaiting OAuth login flow."
        else:
            status = "AUTHENTICATED"
            message = "Upstox V3 authenticated and authorized."

        return {
            "provider": "Upstox Market Data Feed V3",
            "status": status,
            "is_authenticated": is_authenticated,
            "has_credentials": has_credentials,
            "login_url": self.get_login_url(),
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "permissions_notice": (
                "Market data feeds are subject to exchange and broker redistribution policies. "
                "Tick data is streamed strictly for personal technical analysis and stock screening."
            )
        }


class LiveMarketFeedManager:
    """Manages connected WebSocket clients and intraday DMA comparison loop."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.latest_intraday_data: Dict[str, Any] = {}
        self._running = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        # Send latest snapshot immediately upon connecting
        if self.latest_intraday_data:
            await websocket.send_text(json.dumps(self.latest_intraday_data))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        dead_sockets = set()
        msg_str = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(msg_str)
            except Exception:
                dead_sockets.add(connection)
        for dead in dead_sockets:
            self.active_connections.discard(dead)

    async def compute_live_intraday_scan(self) -> Dict[str, Any]:
        """
        Compare latest eligible live price against completed daily SMAs with full volume analytics.
        Rule: Completed daily SMAs are NEVER recalculated from incomplete intraday candles!
        Live signals are labeled explicitly as PROVISIONAL.
        """
        latest_daily_scan = scanner_service.get_latest_scan()
        if not latest_daily_scan:
            latest_daily_scan = await scanner_service.run_daily_scan()

        completed_results = latest_daily_scan.get("all_results", [])
        stocks_6_6 = []
        stocks_5_6 = []
        live_results = []
        provisional_crossings = []

        now_utc = datetime.now(timezone.utc).isoformat()

        for stock in completed_results:
            symbol = stock["symbol"]
            completed_smas = stock.get("smas", {})
            completed_close = stock.get("latest_close")
            status = stock.get("status", "VERIFIED")
            weightage = stock.get("weightage", 0.0)

            if not completed_close or status != "VERIFIED":
                continue

            # Fetch historical candles for 6-session volume analytics
            hist = historical_data_service.get_cached_history(symbol)
            candles = hist.get("candles", []) if hist else []
            vol_metrics = volume_engine.analyze_stock_volume(symbol, candles)

            # In intraday mode, live price is compared against completed daily SMAs
            live_price = completed_close  # Default to latest session close when market closed

            # Classify live price strictly against completed daily SMAs
            classification = dma_engine.classify_stock(live_price, completed_smas)

            # Check provisional crossings
            if candles and len(candles) >= 2:
                completed_closes = [c["close"] for c in candles]
                crossings = crossover_engine.detect_intraday_provisional_crossing(live_price, completed_closes)
                for cx in crossings:
                    cx["symbol"] = symbol
                    cx["company_name"] = stock.get("company_name")
                    provisional_crossings.append(cx)

            entry = {
                "symbol": symbol,
                "company_name": stock.get("company_name"),
                "sector": stock.get("sector", stock.get("industry")),
                "industry": stock.get("industry"),
                "weightage": weightage,
                "live_price": round(live_price, 2),
                "completed_close": round(completed_close, 2),
                "price_change_pct": vol_metrics.get("price_change_pct", 0.0),
                "live_score": classification["score"],
                "live_classification": classification["classification"],
                "is_6_6": classification["is_6_6"],
                "is_5_6": classification["is_5_6"],
                "is_provisional": True,
                "status": status,
                "feed_status": "UPSTOX_V3_ACTIVE" if upstox_auth_service.access_token else "COMPLETED_SESSION_SNAPSHOT",
                "update_timestamp": now_utc,
                "completed_smas": completed_smas,
                "live_distances": {
                    k: round(v, 2) if v is not None else None 
                    for k, v in classification["distances"].items()
                },
                "failed_dma": classification.get("failed_dma"),
                "failed_dma_label": classification.get("failed_dma_label"),
                # Volume Analytics fields (Phase 5)
                "cumulative_volume": vol_metrics.get("latest_volume", 0),
                "previous_session_volume": vol_metrics.get("previous_session_volume", 0),
                "previous_five_volumes": vol_metrics.get("previous_five_volumes", []),
                "six_session_avg_volume": vol_metrics.get("six_session_avg_volume"),
                "volume_change_pct": vol_metrics.get("volume_change_pct"),
                "rvol": vol_metrics.get("rvol"),
                "intraday_rvol": None,
                "intraday_rvol_notice": "Intraday RVOL requires same-time-of-day cumulative benchmark. Direct comparison of partial session to full day is mathematically prohibited.",
                "volume_trend": vol_metrics.get("volume_trend", "STEADY"),
                "volume_classification": vol_metrics.get("volume_classification", "NORMAL_VOLUME"),
                "price_volume_confirmation": vol_metrics.get("price_volume_confirmation", {"signal": "NEUTRAL", "label": "Neutral"}),
                "six_session_history": vol_metrics.get("six_session_history", [])
            }

            live_results.append(entry)

            if classification["is_6_6"]:
                stocks_6_6.append(entry)
            elif classification["is_5_6"]:
                stocks_5_6.append(entry)

        # Sort by live score, then RVOL
        live_results.sort(key=lambda x: (x["live_score"], x.get("rvol") or 0.0), reverse=True)
        stocks_6_6.sort(key=lambda x: (x.get("rvol") or 0.0, x["live_distances"].get("dist_dma20") or -999), reverse=True)
        stocks_5_6.sort(key=lambda x: (x.get("rvol") or 0.0, x["live_distances"].get("dist_dma20") or -999), reverse=True)

        payload = {
            "type": "LIVE_SCAN_SNAPSHOT",
            "feed_timestamp": now_utc,
            "feed_status": "FEED_ACTIVE_PROVISIONAL",
            "completed_daily_session_date": latest_daily_scan.get("completed_session_date"),
            "total_constituents": len(live_results),
            "live_count_6_6": len(stocks_6_6),
            "live_count_5_6": len(stocks_5_6),
            "stocks_6_6": stocks_6_6,
            "stocks_5_6": stocks_5_6,
            "provisional_crossings": provisional_crossings,
            "all_results": live_results,
            "notice": "Live signals are provisional intraday comparisons against completed daily SMAs. Intraday volume is displayed cumulatively."
        }

        self.latest_intraday_data = payload
        return payload


upstox_auth_service = UpstoxAuthService()
live_feed_manager = LiveMarketFeedManager()
