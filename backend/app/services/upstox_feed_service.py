"""Authenticated Upstox Market Data Feed V3 client and subscription manager."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4

import websockets

from app.config import get_settings
from app.proto import MarketDataFeed_pb2
from app.services import upstox_market_client as rest

logger = logging.getLogger("upstox_feed")


def decode_feed(payload: bytes) -> Dict[str, Any]:
    """Decode an official binary V3 FeedResponse into JSON-safe normalized ticks."""
    response = MarketDataFeed_pb2.FeedResponse()
    response.ParseFromString(payload)
    current_ms = int(response.currentTs)
    normalized: Dict[str, Any] = {}
    for instrument_key, feed in response.feeds.items():
        kind = feed.WhichOneof("FeedUnion")
        source = None
        if kind == "ltpc":
            source = feed.ltpc
        elif kind == "firstLevelWithGreeks":
            source = feed.firstLevelWithGreeks.ltpc
        elif kind == "fullFeed":
            full_kind = feed.fullFeed.WhichOneof("FullFeedUnion")
            if full_kind == "marketFF":
                source = feed.fullFeed.marketFF.ltpc
            elif full_kind == "indexFF":
                source = feed.fullFeed.indexFF.ltpc
        if source is None:
            continue
        tick: Dict[str, Any] = {
            "instrument_key": instrument_key,
            "ltp": source.ltp,
            "close_price": source.cp,
            "last_trade_time": int(source.ltt) if source.ltt else None,
            "last_trade_quantity": int(source.ltq) if source.ltq else None,
            "current_ts": current_ms,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "feed_type": MarketDataFeed_pb2.Type.Name(response.type),
            "request_mode": MarketDataFeed_pb2.RequestMode.Name(feed.requestMode),
        }
        full = None
        if kind == "fullFeed":
            ff = feed.fullFeed
            if ff.WhichOneof("FullFeedUnion") == "marketFF":
                full = ff.marketFF
            elif ff.WhichOneof("FullFeedUnion") == "indexFF":
                full = ff.indexFF
        elif kind == "firstLevelWithGreeks":
            full = feed.firstLevelWithGreeks
        if full is not None:
            if hasattr(full, "vtt"):
                tick["volume"] = int(full.vtt)
            if hasattr(full, "oi"):
                tick["oi"] = float(full.oi)
            if hasattr(full, "iv"):
                tick["iv"] = float(full.iv)
            greeks = getattr(full, "optionGreeks", None)
            if greeks is not None:
                tick["greeks"] = {name: getattr(greeks, name) for name in ("delta", "gamma", "theta", "vega", "rho")}
            ohlc = getattr(full, "marketOHLC", None)
            if ohlc is not None:
                tick["ohlc"] = [{"interval": row.interval, "open": row.open, "high": row.high,
                                 "low": row.low, "close": row.close, "volume": int(row.vol), "timestamp": int(row.ts)}
                                for row in ohlc.ohlc]
        normalized[instrument_key] = tick
    return {"type": MarketDataFeed_pb2.Type.Name(response.type), "current_ts": current_ms,
            "market_info": dict(response.marketInfo.segmentStatus) if response.HasField("marketInfo") else {},
            "ticks": normalized}


class SubscriptionManager:
    """One feed socket; enforces the documented normal-account Full combined cap."""

    def __init__(self) -> None:
        self.status = "DISCONNECTED"
        self.authentication_status = "WAITING"
        self.last_message_at: Optional[float] = None
        self.last_error: Optional[str] = None
        self.contract_count = 0
        self._initialized = False
        self.active: OrderedDict[str, str] = OrderedDict()
        self.waiting: OrderedDict[str, str] = OrderedDict()
        self.latest_ticks: Dict[str, Dict[str, Any]] = {}
        self.instrument_metadata: Dict[str, Dict[str, Any]] = {}
        self.clients: set[Any] = set()
        self._task: Optional[asyncio.Task] = None
        self._socket: Any = None
        self._lock = asyncio.Lock()
        self.last_exchange_ts: Optional[int] = None

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run(), name="upstox-market-feed-v3")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            await asyncio.gather(self._task, return_exceptions=True)
        self.status = "DISCONNECTED"

    async def configure_nifty(self) -> None:
        """Use real contract/chain data to seed spot plus nearest CE/PE instruments."""
        if self._initialized:
            return
        contracts = await rest.get_option_contracts(rest.NIFTY_INSTRUMENT_KEY)
        expiries = rest.unique_expiries(contracts)
        self.contract_count = len(contracts)
        if not expiries:
            raise ValueError("Upstox returned no NIFTY option expiries")
        chain = await rest.get_option_chain(rest.NIFTY_INSTRUMENT_KEY, expiries[0])
        if not chain:
            raise ValueError("Upstox returned an empty NIFTY option chain")
        spot = float(chain[0]["underlying_spot_price"])
        self.instrument_metadata[rest.NIFTY_INSTRUMENT_KEY] = {"underlying": "NIFTY", "expiry": expiries[0],
                                                                "option_type": "INDEX", "strike_price": spot}
        for item in chain:
            for side, option_type in (("call_options", "CE"), ("put_options", "PE")):
                option = item.get(side) or {}
                key = option.get("instrument_key")
                if key:
                    self.instrument_metadata[key] = {"underlying": "NIFTY", "expiry": item["expiry"],
                        "option_type": option_type, "strike_price": float(item["strike_price"])}
        nearest = sorted(chain, key=lambda row: abs(float(row["strike_price"]) - spot))[:3]
        keys = [rest.NIFTY_INSTRUMENT_KEY]
        for row in nearest:
            for side in ("call_options", "put_options"):
                key = (row.get(side) or {}).get("instrument_key")
                if key:
                    keys.append(key)
        await self.set_subscriptions(keys, mode="full")
        from app.services.constituents_service import constituents_service
        equity_keys = [item.get("upstox_instrument_key") for item in constituents_service.get_constituents()]
        await self.set_subscriptions(equity_keys, mode="ltpc")
        self._initialized = True

    async def set_subscriptions(self, instrument_keys: Iterable[str], mode: str = "full") -> None:
        if mode not in ("full", "ltpc"):
            raise ValueError("Upstox V3 subscription mode must be full or ltpc")
        requested = list(dict.fromkeys(str(key) for key in instrument_keys if key))
        settings = get_settings()
        max_full = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                       settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
        max_total = settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS
        replaced_modes: Dict[str, str] = {}
        async with self._lock:
            for key in requested:
                if key in self.active:
                    current_mode = self.active[key]
                    if current_mode == mode or (current_mode == "full" and mode == "ltpc"):
                        continue
                    if mode == "full":
                        full_count = sum(1 for value in self.active.values() if value == "full")
                        if full_count >= max_full:
                            self.waiting[key] = mode
                            continue
                        replaced_modes[key] = current_mode
                        self.active[key] = mode
                    continue
                if key in self.waiting:
                    if mode == "full" and self.waiting[key] == "ltpc":
                        self.waiting[key] = mode
                    continue
                mode_count = sum(1 for value in self.active.values() if value == mode)
                capacity_available = len(self.active) < max_total and (mode != "full" or mode_count < max_full)
                (self.active if capacity_available else self.waiting)[key] = mode
            if self._socket is not None and requested:
                for old_mode in set(replaced_modes.values()):
                    old_keys = [key for key, previous in replaced_modes.items() if previous == old_mode]
                    await self._send_subscription("unsub", old_keys, old_mode)
                active_now = [key for key in requested if key in self.active and self.active[key] == mode]
                if active_now:
                    await self._send_subscription("sub", active_now, mode)

    def register_option_chain(self, underlying: str, rows: Iterable[Dict[str, Any]]) -> None:
        for item in rows:
            for side, option_type in (("call_options", "CE"), ("put_options", "PE")):
                option = item.get(side) or {}
                key = option.get("instrument_key")
                if key:
                    self.instrument_metadata[key] = {"underlying": underlying,
                        "expiry": item.get("expiry"), "option_type": option_type,
                        "strike_price": float(item["strike_price"])}

    async def subscribe_client_request(self, request: Dict[str, Any]) -> None:
        data = request.get("data") if isinstance(request.get("data"), dict) else request
        keys = data.get("instrumentKeys") or data.get("instrument_keys") or []
        mode = data.get("mode", "full")
        if isinstance(keys, list):
            if request.get("method") == "unsub":
                await self.unsubscribe(keys)
            else:
                await self.set_subscriptions(keys, mode)

    async def unsubscribe(self, instrument_keys: Iterable[str]) -> None:
        keys = list(dict.fromkeys(str(key) for key in instrument_keys if key))
        async with self._lock:
            active_removed = [(key, self.active.pop(key)) for key in keys if key in self.active]
            for key in keys:
                self.waiting.pop(key, None)
            if self._socket is not None:
                for mode in {mode for _, mode in active_removed}:
                    await self._send_subscription("unsub", [key for key, item_mode in active_removed if item_mode == mode], mode)
            settings = get_settings()
            max_full = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                           settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
            while self.waiting and len(self.active) < settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS:
                key, mode = self.waiting.popitem(last=False)
                if mode == "full" and sum(v == "full" for v in self.active.values()) >= max_full:
                    self.waiting[key] = mode
                    break
                old_mode = self.active.get(key)
                if old_mode and old_mode != mode and self._socket is not None:
                    await self._send_subscription("unsub", [key], old_mode)
                self.active[key] = mode
                if self._socket is not None:
                    await self._send_subscription("sub", [key], mode)

    async def _send_subscription(self, method: str, keys: List[str], mode: str) -> None:
        request = {"guid": str(uuid4()), "method": method,
                   "data": {"mode": mode, "instrumentKeys": keys}}
        # Upstox V3 requires the JSON request bytes in a binary WebSocket frame.
        await self._socket.send(json.dumps(request, separators=(",", ":")).encode("utf-8"))

    async def _run(self) -> None:
        settings = get_settings()
        if not (settings.UPSTOX_ACCESS_TOKEN or "").strip():
            self.status = "WAITING"
            return
        delay = 3
        while True:
            try:
                await self.configure_nifty()
                uri = await rest.authorize_market_data_feed()
                self.authentication_status = "AUTHENTICATED"
                async with websockets.connect(uri, ping_interval=20, ping_timeout=20, max_size=8 * 1024 * 1024) as socket:
                    self._socket = socket
                    self.status = "WAITING"
                    for mode in ("full", "ltpc"):
                        keys = [key for key, value in self.active.items() if value == mode]
                        if keys:
                            await self._send_subscription("sub", keys, mode)
                    delay = 3
                    async for message in socket:
                        if not isinstance(message, (bytes, bytearray)):
                            continue
                        decoded = decode_feed(bytes(message))
                        self.last_exchange_ts = decoded.get("current_ts") or self.last_exchange_ts
                        if decoded["ticks"]:
                            self.latest_ticks.update(decoded["ticks"])
                            is_live = decoded["type"] == "live_feed"
                            if is_live:
                                self.last_message_at = time.time()
                                self.status = "LIVE"
                            await self.broadcast({"type": "market_data", "is_live_update": is_live, **decoded})
                        elif decoded["type"] == "market_info":
                            await self.broadcast(decoded)
            except asyncio.CancelledError:
                raise
            except rest.UpstoxApiError as exc:
                self.last_error = "UpstoxAuthenticationError" if exc.status_code in (401, 403) else "UpstoxApiError"
                self.authentication_status = "FAILED" if exc.status_code in (401, 403) else "UNAVAILABLE"
                self.status = "DISCONNECTED" if exc.status_code in (401, 403) else "WAITING"
                logger.warning("Upstox V3 feed authorization failed (HTTP %s)", exc.status_code)
                await asyncio.sleep(delay)
                delay = min(delay * 2, 60)
            except Exception as exc:
                self.last_error = type(exc).__name__
                self.status = "WAITING" if self.last_message_at is None else "DISCONNECTED"
                logger.warning("Upstox V3 feed connection failed (%s)", type(exc).__name__)
                await asyncio.sleep(delay)
                delay = min(delay * 2, 60)
            finally:
                self._socket = None

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        stale = set()
        for client in self.clients:
            try:
                await client.send_json(payload)
            except Exception:
                stale.add(client)
        self.clients.difference_update(stale)

    def get_status(self) -> Dict[str, Any]:
        settings = get_settings()
        age = time.time() - self.last_message_at if self.last_message_at else None
        max_active = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                         settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
        state = self.status
        if state == "LIVE" and age is not None and age > settings.UPSTOX_STALE_SECONDS:
            state = "STALE"
        return {"status": state, "active_subscriptions": len(self.active),
                "waiting_subscriptions": len(self.waiting), "verified_nifty_contracts": self.contract_count,
                "authentication_status": self.authentication_status,
                "subscription_limit": settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS,
                "full_subscription_count": sum(mode == "full" for mode in self.active.values()),
                "ltpc_subscription_count": sum(mode == "ltpc" for mode in self.active.values()),
                "full_subscription_limit": max_active,
                "last_message_age_seconds": round(age, 1) if age is not None else None,
                "last_error": self.last_error}

    def capture_oi_snapshot(self) -> int:
        """Persist latest exchange OI only; never creates placeholder rows."""
        from app.database.session import SessionLocal
        from app.models.option_snapshot import OptionOISnapshotModel

        captured_at = datetime.now(timezone.utc)
        db = SessionLocal()
        inserted = 0
        try:
            for key, tick in self.latest_ticks.items():
                meta = self.instrument_metadata.get(key)
                if not meta or meta["option_type"] not in ("CE", "PE") or tick.get("oi") is None:
                    continue
                db.add(OptionOISnapshotModel(captured_at=captured_at, underlying=meta["underlying"],
                    expiry=meta["expiry"], instrument_key=key, option_type=meta["option_type"],
                    strike_price=meta["strike_price"], open_interest=float(tick["oi"]),
                    ltp=tick.get("ltp"), volume=tick.get("volume")))
                inserted += 1
            if inserted:
                db.commit()
            return inserted
        except Exception:
            db.rollback()
            logger.exception("Unable to persist option OI snapshot")
            return 0
        finally:
            db.close()


subscription_manager = SubscriptionManager()
