import httpx
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.services.constituents_service import constituents_service
from app.services import upstox_market_client as upstox

logger = logging.getLogger("historical_data_service")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
ROOT_DATA_DIR = PROJECT_ROOT / "data"

HISTORICAL_DATA_DIR = BACKEND_DATA_DIR / "historical"
ROOT_HISTORICAL_DIR = ROOT_DATA_DIR / "historical"
CACHE_DIR = BACKEND_DATA_DIR / "cache"
ROOT_CACHE_DIR = ROOT_DATA_DIR / "cache"
LOGS_DIR = BACKEND_DATA_DIR / "logs"
ROOT_LOGS_DIR = ROOT_DATA_DIR / "logs"

COVERAGE_REPORT_FILE = BACKEND_DATA_DIR / "coverage_report.json"
VERIFICATION_LOG_FILE = LOGS_DIR / "verification_log.json"
ROOT_VERIFICATION_LOG_FILE = ROOT_LOGS_DIR / "verification_log.json"

MIN_REQUIRED_SESSIONS = 220

# Explicitly documented symbol alias mappings for corporate actions and provider naming
PROVIDER_TICKER_MAP = {
    "TATAMOTORS": ["TATAMOTORS.NS", "TMPV.NS"],
    "M&M": ["M&M.NS"],
    "BAJAJ-AUTO": ["BAJAJ-AUTO.NS"]
}


class HistoricalDataService:
    def __init__(self):
        for d in [HISTORICAL_DATA_DIR, ROOT_HISTORICAL_DIR, CACHE_DIR, ROOT_CACHE_DIR, LOGS_DIR, ROOT_LOGS_DIR]:
            d.mkdir(parents=True, exist_ok=True)

    def _get_cache_paths(self, symbol: str) -> List[Path]:
        return [
            HISTORICAL_DATA_DIR / f"{symbol.upper()}.json",
            ROOT_HISTORICAL_DIR / f"{symbol.upper()}.json"
        ]

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

    async def _fetch_upstox_daily(self, symbol: str, range_period: str) -> Optional[Dict[str, Any]]:
        """Fetch and validate real daily bars from Upstox Historical Candle V3."""
        key = upstox.instrument_key_for_symbol(symbol)
        if not key:
            return None
        lookbacks = {"1mo": 45, "3mo": 120, "6mo": 240, "1y": 370,
                     "2y": 730, "3y": 1095, "5y": 1825, "max": 3650}
        end = datetime.now().date()
        start = end - timedelta(days=lookbacks.get(range_period.lower(), 370))
        rows = await upstox.get_historical_candles_v3(key, "days", "1", end.isoformat(), start.isoformat())
        from zoneinfo import ZoneInfo
        candles: List[Dict[str, Any]] = []
        seen_dates = set()
        for row in rows:
            parsed = upstox.parse_candle_row(row)
            if not parsed:
                continue
            trading_date = datetime.fromtimestamp(parsed["time"], timezone.utc).astimezone(
                ZoneInfo("Asia/Kolkata")).date().isoformat()
            if trading_date in seen_dates:
                continue
            candle = {"trading_date": trading_date, "open": round(parsed["open"], 2),
                      "high": round(parsed["high"], 2), "low": round(parsed["low"], 2),
                      "close": round(parsed["close"], 2), "volume": parsed.get("volume"),
                      "oi": parsed.get("oi")}
            valid, _ = self.validate_candle(candle)
            if valid:
                seen_dates.add(trading_date)
                candles.append(candle)
        candles.sort(key=lambda item: item["trading_date"])
        if not candles:
            return None
        return {"symbol": symbol, "instrument_key": key, "provider": "UPSTOX_HISTORICAL_CANDLE_V3",
                "price_adjustment": "UPSTOX_EXCHANGE_CANDLES", "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
                "total_sessions": len(candles), "min_required_sessions": MIN_REQUIRED_SESSIONS,
                "quality_status": "VERIFIED" if len(candles) >= MIN_REQUIRED_SESSIONS else "INSUFFICIENT_HISTORY",
                "first_trading_date": candles[0]["trading_date"], "latest_trading_date": candles[-1]["trading_date"],
                "candles": candles}

    async def fetch_symbol_history(self, symbol: str, range_period: str = "1y", force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetch historical daily candles for an NSE constituent.
        Provider priority:
        1. Local verified cache if available and force_refresh is False.
        2. Yahoo Finance NSE feed (.NS) with unadjusted settlement prices matching exchange Bhavcopy.
        3. Fallback to local verified cache if network error.
        """
        clean_symbol = symbol.strip().upper()
        lookbacks = {"1mo": 45, "3mo": 120, "6mo": 240, "1y": 370,
                     "2y": 730, "3y": 1095, "5y": 1825, "max": 3650}
        requested_days = lookbacks.get(range_period.lower(), 370)
        minimum_cached_sessions = max(180, int(requested_days * 0.58))

        if not force_refresh:
            cached = self.get_cached_history(clean_symbol)
            if cached and cached.get("provider") == "UPSTOX_HISTORICAL_CANDLE_V3":
                try:
                    age = (datetime.now(timezone.utc) - datetime.fromisoformat(
                        cached["retrieval_timestamp"].replace("Z", "+00:00"))).total_seconds()
                    if age < 900 and len(cached.get("candles", [])) >= minimum_cached_sessions:
                        return cached
                except (KeyError, TypeError, ValueError):
                    pass

        try:
            upstox_history = await self._fetch_upstox_daily(clean_symbol, range_period)
            if upstox_history:
                for cache_path in self._get_cache_paths(clean_symbol):
                    try:
                        with open(cache_path, "w", encoding="utf-8") as cache_file:
                            json.dump(upstox_history, cache_file, indent=2)
                    except OSError as exc:
                        logger.warning("Could not cache Upstox history for %s (%s)", clean_symbol, type(exc).__name__)
                return upstox_history
        except upstox.UpstoxApiError as exc:
            if exc.status_code in (401, 403):
                cached = self.get_cached_history(clean_symbol)
                if cached and cached.get("provider") == "UPSTOX_HISTORICAL_CANDLE_V3":
                    cached["quality_status"] = "STALE"
                    return cached
                logger.warning("Upstox authentication rejected historical data for %s", clean_symbol)
                return {"symbol": clean_symbol, "provider": "UPSTOX_HISTORICAL_CANDLE_V3",
                        "quality_status": "UNAVAILABLE", "total_sessions": 0, "candles": [], "error": exc.message}
        except Exception as exc:
            logger.warning("Upstox historical data unavailable for %s (%s)", clean_symbol, type(exc).__name__)

        tickers_to_try = PROVIDER_TICKER_MAP.get(clean_symbol, [f"{clean_symbol}.NS"])

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        last_error = None
        for ticker in tickers_to_try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range={range_period}"
            try:
                async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        last_error = f"Status {resp.status_code} for {ticker}"
                        continue

                    data = resp.json()
                    result = data.get("chart", {}).get("result", [{}])[0]
                    timestamps = result.get("timestamp", [])
                    indicators = result.get("indicators", {}).get("quote", [{}])[0]

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

                    # Determine provenance status against MIN_REQUIRED_SESSIONS (220)
                    if len(valid_candles) >= MIN_REQUIRED_SESSIONS:
                        quality_status = "VERIFIED"
                    elif len(valid_candles) > 0:
                        quality_status = "INSUFFICIENT_HISTORY"
                    else:
                        quality_status = "UNAVAILABLE"

                    result_payload = {
                        "symbol": clean_symbol,
                        "ticker_used": ticker,
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

                    # Save to cache files
                    for p in self._get_cache_paths(clean_symbol):
                        try:
                            with open(p, "w", encoding="utf-8") as f:
                                json.dump(result_payload, f, indent=2)
                        except Exception as e:
                            logger.warning(f"Could not write cache file {p}: {e}")

                    return result_payload

            except Exception as e:
                last_error = str(e)
                logger.warning(f"Error fetching {ticker}: {e}")

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
            "error": last_error,
            "candles": []
        }

    def get_cached_history(self, symbol: str) -> Optional[Dict[str, Any]]:
        for cache_file in self._get_cache_paths(symbol):
            if cache_file.exists():
                try:
                    with open(cache_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    logger.error(f"Error reading cache for {symbol} from {cache_file}: {e}")
        return None

    async def ingest_all_constituents(self) -> Dict[str, Any]:
        """Ingest all 50 current constituents and generate verification log."""
        stocks = constituents_service.get_constituents()
        report: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "min_required_sessions": MIN_REQUIRED_SESSIONS,
            "total_constituents": len(stocks),
            "successfully_verified": 0,
            "insufficient_history": 0,
            "unavailable": 0,
            "validation_failed": 0,
            "constituent_summary": []
        }

        verification_records = []

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

            summary_item = {
                "symbol": sym,
                "company_name": stock.get("company_name"),
                "status": status,
                "sessions": res.get("total_sessions", 0),
                "latest_date": res.get("latest_trading_date")
            }
            report["constituent_summary"].append(summary_item)

            verification_records.append({
                "symbol": sym,
                "company_name": stock.get("company_name"),
                "sector": stock.get("sector"),
                "isin": stock.get("isin"),
                "provider": res.get("provider", "YAHOO_FINANCE_NSE"),
                "price_adjustment": res.get("price_adjustment", "UNADJUSTED_CLOSE"),
                "sessions": res.get("total_sessions", 0),
                "min_required": MIN_REQUIRED_SESSIONS,
                "status": status,
                "first_date": res.get("first_trading_date"),
                "latest_date": res.get("latest_trading_date"),
                "retrieval_timestamp": res.get("retrieval_timestamp")
            })

        with open(COVERAGE_REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        verification_payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "min_required_sessions": MIN_REQUIRED_SESSIONS,
            "total_constituents": len(verification_records),
            "verified_count": len([r for r in verification_records if r["status"] == "VERIFIED"]),
            "records": verification_records
        }

        for vf in [VERIFICATION_LOG_FILE, ROOT_VERIFICATION_LOG_FILE]:
            try:
                vf.parent.mkdir(parents=True, exist_ok=True)
                with open(vf, "w", encoding="utf-8") as f:
                    json.dump(verification_payload, f, indent=2)
            except Exception as e:
                logger.warning(f"Could not save verification log to {vf}: {e}")

        return report

    def get_coverage_report(self) -> Optional[Dict[str, Any]]:
        if COVERAGE_REPORT_FILE.exists():
            try:
                with open(COVERAGE_REPORT_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading coverage report: {e}")
        return None

    def get_verification_log(self) -> Optional[Dict[str, Any]]:
        for vf in [VERIFICATION_LOG_FILE, ROOT_VERIFICATION_LOG_FILE]:
            if vf.exists():
                try:
                    with open(vf, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    logger.error(f"Error loading verification log from {vf}: {e}")
        return None

    def get_multi_year_candles(self, symbol: str, years: int = 5) -> List[Dict[str, Any]]:
        """Return only retrieved history; never invent bars to pad a requested period."""
        cached = self.get_cached_history(symbol)
        candles = cached.get("candles", []) if cached else []
        if years <= 1:
            return candles
        max_sessions = years * 240
        return candles[-max_sessions:] if len(candles) > max_sessions else candles


historical_data_service = HistoricalDataService()
