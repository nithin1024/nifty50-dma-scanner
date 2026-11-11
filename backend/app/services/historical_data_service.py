import httpx
import json
import logging
from datetime import datetime, timezone, date
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.services.constituents_service import constituents_service

logger = logging.getLogger("historical_data_service")

HISTORICAL_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "historical"
COVERAGE_REPORT_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "coverage_report.json"

MIN_REQUIRED_SESSIONS = 200


class HistoricalDataService:
    def __init__(self):
        HISTORICAL_DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, symbol: str) -> Path:
        return HISTORICAL_DATA_DIR / f"{symbol.upper()}.json"

    def validate_candle(self, c: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate candle OHLC integrity."""
        open_p = c.get("open")
        high_p = c.get("high")
        low_p = c.get("low")
        close_p = c.get("close")

        if any(v is None for v in [open_p, high_p, low_p, close_p]):
            return False, "Null price field"

        if open_p <= 0 or high_p <= 0 or low_p <= 0 or close_p <= 0:
            return False, "Non-positive price"

        if high_p < low_p:
            return False, f"High ({high_p}) < Low ({low_p})"

        if high_p < open_p or high_p < close_p:
            return False, f"High is less than Open or Close"

        if low_p > open_p or low_p > close_p:
            return False, f"Low is greater than Open or Close"

        return True, None

    async def fetch_symbol_history(self, symbol: str, range_period: str = "1y") -> Dict[str, Any]:
        """
        Fetch historical daily candles for an NSE constituent.
        Provider: Yahoo Finance NSE feed (.NS) with unadjusted close prices matching exchange Bhavcopy.
        """
        clean_symbol = symbol.strip().upper()
        # Symbol adjustments for Yahoo Finance (e.g., M&M -> M&M.NS)
        ticker = f"{clean_symbol}.NS"
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range={range_period}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    raise ValueError(f"Provider returned status {resp.status_code}")

                data = resp.json()
                result = data["chart"]["result"][0]
                timestamps = result.get("timestamp", [])
                indicators = result["indicators"]["quote"][0]

                opens = indicators.get("open", [])
                highs = indicators.get("high", [])
                lows = indicators.get("low", [])
                closes = indicators.get("close", [])
                volumes = indicators.get("volume", [])

                valid_candles: List[Dict[str, Any]] = []
                seen_dates = set()

                for i, ts in enumerate(timestamps):
                    dt = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
                    if dt in seen_dates:
                        continue
                    seen_dates.add(dt)

                    o = opens[i] if i < len(opens) else None
                    h = highs[i] if i < len(highs) else None
                    l = lows[i] if i < len(lows) else None
                    c = closes[i] if i < len(closes) else None
                    v = volumes[i] if i < len(volumes) and volumes[i] is not None else 0

                    if any(x is None for x in [o, h, l, c]):
                        continue

                    candle = {
                        "trading_date": dt,
                        "open": round(float(o), 2),
                        "high": round(float(h), 2),
                        "low": round(float(l), 2),
                        "close": round(float(c), 2),
                        "volume": int(v) if v else 0,
                    }

                    is_valid, reason = self.validate_candle(candle)
                    if is_valid:
                        valid_candles.append(candle)
                    else:
                        logger.warning(f"Discarding invalid candle for {symbol} on {dt}: {reason}")

                # Sort chronologically ascending
                valid_candles.sort(key=lambda x: x["trading_date"])

                # Determine provenance status
                if len(valid_candles) >= MIN_REQUIRED_SESSIONS:
                    quality_status = "VERIFIED"
                elif len(valid_candles) > 0:
                    quality_status = "INSUFFICIENT_HISTORY"
                else:
                    quality_status = "UNAVAILABLE"

                result_payload = {
                    "symbol": clean_symbol,
                    "provider": "YAHOO_FINANCE_NSE",
                    "price_adjustment": "UNADJUSTED_CLOSE",
                    "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
                    "total_sessions": len(valid_candles),
                    "min_required_sessions": MIN_REQUIRED_SESSIONS,
                    "quality_status": quality_status,
                    "first_trading_date": valid_candles[0]["trading_date"] if valid_candles else None,
                    "latest_trading_date": valid_candles[-1]["trading_date"] if valid_candles else None,
                    "candles": valid_candles
                }

                # Save to cache file
                cache_file = self._get_cache_path(clean_symbol)
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(result_payload, f, indent=2)

                return result_payload

        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            # Check if cached data exists
            cached = self.get_cached_history(clean_symbol)
            if cached:
                return cached
            return {
                "symbol": clean_symbol,
                "provider": "YAHOO_FINANCE_NSE",
                "price_adjustment": "UNADJUSTED_CLOSE",
                "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
                "total_sessions": 0,
                "min_required_sessions": MIN_REQUIRED_SESSIONS,
                "quality_status": "UNAVAILABLE",
                "error": str(e),
                "candles": []
            }

    def get_cached_history(self, symbol: str) -> Optional[Dict[str, Any]]:
        cache_file = self._get_cache_path(symbol)
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error reading cache for {symbol}: {e}")
        return None

    async def ingest_all_constituents(self) -> Dict[str, Any]:
        """Ingest all 50 current constituents."""
        stocks = constituents_service.get_constituents()
        report: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_constituents": len(stocks),
            "successfully_verified": 0,
            "insufficient_history": 0,
            "unavailable": 0,
            "validation_failed": 0,
            "constituent_summary": []
        }

        for stock in stocks:
            sym = stock["symbol"]
            res = await self.fetch_symbol_history(sym)
            status = res.get("quality_status", "UNAVAILABLE")

            if status == "VERIFIED":
                report["successfully_verified"] += 1
            elif status == "INSUFFICIENT_HISTORY":
                report["insufficient_history"] += 1
            elif status == "VALIDATION_FAILED":
                report["validation_failed"] += 1
            else:
                report["unavailable"] += 1

            report["constituent_summary"].append({
                "symbol": sym,
                "company_name": stock.get("company_name"),
                "status": status,
                "sessions": res.get("total_sessions", 0),
                "latest_date": res.get("latest_trading_date")
            })

        with open(COVERAGE_REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report

    def get_coverage_report(self) -> Optional[Dict[str, Any]]:
        if COVERAGE_REPORT_FILE.exists():
            try:
                with open(COVERAGE_REPORT_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading coverage report: {e}")
        return None


historical_data_service = HistoricalDataService()
