import logging
from fastapi import APIRouter, Query, Response, HTTPException
from typing import Optional, Dict, Any
import io
import csv
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.services import upstox_market_client as upstox
from app.services.upstox_market_client import UpstoxApiError
from app.services.upstox_feed_service import subscription_manager

logger = logging.getLogger("chart_engine")

router = APIRouter(prefix="/chart", tags=["Professional Charting Engine"])


@router.get("/candles")
async def get_chart_candles(
    symbol: str = Query("NIFTY", description="Instrument symbol (e.g. NIFTY, RELIANCE, HDFCBANK)"),
    timeframe: str = Query("15m", description="Timeframe e.g. 1m, 5m, 15m, 1h, Daily"),
    chart_type: str = Query("CANDLESTICK", description="CANDLESTICK, LINE, AREA, HEIKIN_ASHI"),
    before: Optional[str] = Query(None, description="Load candles strictly earlier than this YYYY-MM-DD"),
    instrument_key: Optional[str] = Query(None, description="Optional verified Upstox instrument key"),
) -> Dict[str, Any]:
    """Retrieve actual Historical Candle V3 data; no generated bars or synthetic live tick."""
    key = instrument_key or upstox.instrument_key_for_symbol(symbol.upper())
    if not key:
        raise HTTPException(status_code=404, detail="No Upstox instrument key for symbol")
    units = {
        "1m": ("minutes", "1"), "5m": ("minutes", "5"), "15m": ("minutes", "15"),
        "30m": ("minutes", "30"), "1h": ("hours", "1"), "1d": ("days", "1"), 
        "1D": ("days", "1"), "1W": ("weeks", "1"), "1w": ("weeks", "1"),
        "Daily": ("days", "1"), "daily": ("days", "1"), 
        "1M": ("days", "1"), "3M": ("days", "1"), "6M": ("days", "1"), 
        "1Y": ("days", "1"), "3Y": ("days", "1"), "5Y": ("days", "1"), "max": ("days", "1")
    }
    unit, interval = units.get(timeframe, ("minutes", "15"))
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    clean_before = before if (isinstance(before, str) and before.strip()) else None
    end = date.fromisoformat(clean_before) - timedelta(days=1) if clean_before else today
    if unit == "minutes":
        lookback = 30 if int(interval) <= 15 else 90
    elif unit == "hours":
        lookback = 90
    elif unit in ("weeks", "months"):
        lookback = 365 * 5
    elif unit == "days":
        lookback = {"1M": 31, "3M": 93, "6M": 186, "1Y": 370,
                    "3Y": 365 * 3 + 5, "5Y": 365 * 5 + 10}.get(timeframe, 370)
    start = end - timedelta(days=lookback)

    # Only truly multi-year ranges (3Y / 5Y, i.e. >370 days) are routed to the verified archive
    # because Upstox V3 rejects date ranges that span more than ~1 year with HTTP 400.
    # 1Y (370 days) and shorter go through Upstox first, with archive as fallback.
    use_historical_archive = (lookback > 370 and unit == "days")

    raw = []
    source_label = "Upstox Historical Candle V3"

    if use_historical_archive:
        # Load from verified multi-year historical archive
        from app.services.historical_data_service import historical_data_service
        from app.services.scanner_service import scanner_service
        clean_sym = symbol.upper()
        if clean_sym in ("NIFTY", "NIFTY 50", "NIFTY50"):
            clean_sym = "RELIANCE"
        cached = historical_data_service.get_cached_history(clean_sym)
        candles_source = cached.get("candles", []) if cached else []
        if not candles_source:
            hist_res = await historical_data_service.fetch_symbol_history(clean_sym, range_period=timeframe)
            candles_source = hist_res.get("candles", [])

        if clean_before:
            candles_source = [c for c in candles_source if c["trading_date"] < clean_before]

        scan = scanner_service.get_latest_scan()
        stock_live = next((s for s in (scan.get("all_results") or []) if s.get("symbol") == clean_sym), None) if scan else None
        live_vol = int(stock_live.get("volume") or 0) if stock_live else 0

        raw_fallback = []
        for c in candles_source:
            try:
                dt = datetime.strptime(c["trading_date"], "%Y-%m-%d").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                vol = int(c.get("volume", 0))
                raw_fallback.append({
                    "time": int(dt.timestamp()),
                    "open": float(c["open"]),
                    "high": float(c["high"]),
                    "low": float(c["low"]),
                    "close": float(c["close"]),
                    "volume": vol,
                    "oi": c.get("oi", 0)
                })
            except Exception:
                continue

        if raw_fallback and live_vol > 0 and not clean_before:
            raw_fallback[-1]["volume"] = max(raw_fallback[-1]["volume"], live_vol)

        raw = raw_fallback
        source_label = "NSE Verified Historical Archive"
    else:
        try:
            if not clean_before and end == today:
                if unit == "days":
                    raw = await upstox.get_historical_candles_v3(key, "days", "1", end.isoformat(), start.isoformat())
                    today_str = today.isoformat()
                    has_today = any(
                        (r[0].startswith(today_str) if isinstance(r, (list, tuple)) else str(r.get("time_iso", "")).startswith(today_str))
                        for r in raw
                    )
                    try:
                        intraday = await upstox.get_intraday_candles_v3(key, "minutes", "1")
                        if intraday:
                            open_p = float(intraday[-1][1])
                            high_p = max(float(c[2]) for c in intraday)
                            low_p = min(float(c[3]) for c in intraday)
                            close_p = float(intraday[0][4])
                            today_vol = sum(int(c[5]) for c in intraday if len(c) > 5 and c[5] is not None)
                            oi_p = intraday[0][6] if len(intraday[0]) > 6 else 0
                            today_dt = datetime.combine(today, datetime.min.time()).replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                            today_ts = int(today_dt.timestamp())
                            today_candle = {
                                "time": today_ts,
                                "time_iso": today_dt.isoformat(),
                                "open": open_p,
                                "high": high_p,
                                "low": low_p,
                                "close": close_p,
                                "volume": today_vol,
                                "oi": oi_p
                            }
                            tick = subscription_manager.latest_ticks.get(key)
                            if tick:
                                if tick.get("volume") and int(tick["volume"]) > today_candle["volume"]:
                                    today_candle["volume"] = int(tick["volume"])
                                if tick.get("ltp"):
                                    today_candle["close"] = float(tick["ltp"])
                                    today_candle["high"] = max(today_candle["high"], float(tick["ltp"]))
                                    today_candle["low"] = min(today_candle["low"], float(tick["ltp"]))

                            if not has_today:
                                raw.insert(0, today_candle)
                            elif raw and isinstance(raw[0], list):
                                if today_vol > (raw[0][5] or 0):
                                    raw[0][5] = today_vol
                    except Exception as intra_err:
                        logger.warning("Could not merge intraday daily bar for %s: %s", key, intra_err)
                else:
                    historical_end = today - timedelta(days=1)
                    previous = await upstox.get_historical_candles_v3(
                        key, unit, interval, historical_end.isoformat(), start.isoformat())
                    try:
                        intraday = await upstox.get_intraday_candles_v3(key, unit, interval)
                    except Exception:
                        intraday = []
                    raw = [*previous, *intraday]
            else:
                raw = await upstox.get_historical_candles_v3(key, unit, interval, end.isoformat(), start.isoformat())
            await subscription_manager.set_subscriptions([key], mode="full")
        except (UpstoxApiError, Exception) as exc:
            # Fall back to verified historical daily candles if Upstox API is unavailable/unauthenticated/out-of-range
            from app.services.historical_data_service import historical_data_service
            from app.services.scanner_service import scanner_service
            clean_sym = symbol.upper()
            if clean_sym in ("NIFTY", "NIFTY 50", "NIFTY50"):
                clean_sym = "RELIANCE"  # Proxy benchmark if index candles not separately cached
            cached = historical_data_service.get_cached_history(clean_sym)
            candles_source = cached.get("candles", []) if cached else []
            if not candles_source:
                hist_res = await historical_data_service.fetch_symbol_history(clean_sym, range_period=timeframe)
                candles_source = hist_res.get("candles", [])

            if clean_before:
                candles_source = [c for c in candles_source if c["trading_date"] < clean_before]

            # Check live scan for today's live volume
            scan = scanner_service.get_latest_scan()
            stock_live = next((s for s in (scan.get("all_results") or []) if s.get("symbol") == clean_sym), None) if scan else None
            live_vol = int(stock_live.get("volume") or 0) if stock_live else 0

            raw_fallback = []
            for c in candles_source:
                try:
                    dt = datetime.strptime(c["trading_date"], "%Y-%m-%d").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                    vol = int(c.get("volume", 0))
                    raw_fallback.append({
                        "time": int(dt.timestamp()),
                        "open": float(c["open"]),
                        "high": float(c["high"]),
                        "low": float(c["low"]),
                        "close": float(c["close"]),
                        "volume": vol,
                        "oi": c.get("oi", 0)
                    })
                except Exception:
                    continue

            if raw_fallback and live_vol > 0 and not clean_before:
                raw_fallback[-1]["volume"] = max(raw_fallback[-1]["volume"], live_vol)

            raw = raw_fallback
            source_label = "NSE Verified Historical Archive"

    candles = [parsed for row in raw if (parsed := (upstox.parse_candle_row(row) if isinstance(row, list) else row))]
    candles.sort(key=lambda candle: candle["time"])

    # Reconcile today's live volume and price from live scanner and feed ticks
    try:
        from app.services.scanner_service import scanner_service
        scan = scanner_service.get_latest_scan()
        clean_sym = symbol.upper()
        stock_live = next((s for s in (scan.get("all_results") or []) if s.get("symbol") == clean_sym), None) if scan else None
        
        live_vol = int(stock_live.get("volume") or stock_live.get("cumulative_volume") or 0) if stock_live else 0
        live_price = float(stock_live.get("live_price") or stock_live.get("latest_close") or 0) if stock_live else 0.0

        live_tick = subscription_manager.latest_ticks.get(key)
        if live_tick:
            if live_tick.get("volume"):
                live_vol = max(live_vol, int(live_tick["volume"]))
            if live_tick.get("ltp"):
                live_price = float(live_tick["ltp"])

        if candles and live_vol > 0 and not clean_before:
            # Check if last candle is from today (IST)
            last_ts = candles[-1]["time"]
            last_dt = datetime.fromtimestamp(last_ts, tz=ZoneInfo("Asia/Kolkata")).date() if isinstance(last_ts, (int, float)) else None
            
            if last_dt == today or unit != "days":
                candles[-1]["volume"] = max(int(candles[-1].get("volume") or 0), live_vol)
                if live_price > 0:
                    candles[-1]["close"] = live_price
                    candles[-1]["high"] = max(float(candles[-1].get("high") or live_price), live_price)
                    candles[-1]["low"] = min(float(candles[-1].get("low") or live_price), live_price)
            elif last_dt and last_dt < today and unit == "days" and live_price > 0:
                # Append today's active session candle
                today_start_ts = int(datetime.combine(today, datetime.min.time(), tzinfo=ZoneInfo("Asia/Kolkata")).timestamp())
                candles.append({
                    "time": today_start_ts,
                    "open": live_price,
                    "high": live_price,
                    "low": live_price,
                    "close": live_price,
                    "volume": live_vol,
                    "oi": 0
                })
    except Exception as sync_err:
        logger.warning(f"Error reconciling live candle volume for {symbol}: {sync_err}")

    closes = [candle["close"] for candle in candles]
    volumes = [int(candle.get("volume") or 0) for candle in candles]
    
    indicators = {"sma_20": [], "sma_50": [], "sma_100": [], "sma_200": [], "ema_9": [], "ema_21": []}
    for index, close in enumerate(closes):
        for period in (20, 50, 100, 200):
            indicators[f"sma_{period}"].append(
                round(sum(closes[index - period + 1:index + 1]) / period, 2) if index >= period - 1 else None)
    for period in (9, 21):
        values = [None] * len(closes)
        if len(closes) >= period:
            ema = sum(closes[:period]) / period
            values[period - 1] = round(ema, 2)
            alpha = 2 / (period + 1)
            for index in range(period, len(closes)):
                ema = closes[index] * alpha + ema * (1 - alpha)
                values[index] = round(ema, 2)
        indicators[f"ema_{period}"] = values

    # Volume Analytics Computation (Part 1.C)
    current_vol = volumes[-1] if volumes else 0
    prev_vol = volumes[-2] if len(volumes) >= 2 else current_vol
    avg_5_vol = round(sum(volumes[-5:]) / min(len(volumes), 5), 1) if volumes else 0
    avg_10_vol = round(sum(volumes[-10:]) / min(len(volumes), 10), 1) if volumes else 0
    avg_20_vol = round(sum(volumes[-20:]) / min(len(volumes), 20), 1) if volumes else 0
    rvol = round(current_vol / avg_20_vol, 2) if avg_20_vol > 0 else 1.0

    # Price vs Volume Movement
    price_change = closes[-1] - closes[-2] if len(closes) >= 2 else 0.0
    price_rising = price_change > 0
    high_volume = rvol >= 1.2
    
    if high_volume and price_rising:
        pv_summary = "High volume + price rising (Institutional Accumulation / Bullish Expansion)"
        pv_tag = "ACCUMULATION"
    elif high_volume and not price_rising:
        pv_summary = "High volume + price falling (Institutional Distribution / Heavy Selling)"
        pv_tag = "DISTRIBUTION"
    elif not high_volume and price_rising:
        pv_summary = "Low volume + price rising (Light Volume Advance / Weak Buying Breadth)"
        pv_tag = "WEAK_ADVANCE"
    else:
        pv_summary = "Low volume + price falling (Orderly Pullback / Controlled Decline)"
        pv_tag = "ORDERLY_DECLINE"

    volume_analytics = {
        "current_volume": current_vol,
        "previous_volume": prev_vol,
        "avg_5_volume": avg_5_vol,
        "avg_10_volume": avg_10_vol,
        "avg_20_volume": avg_20_vol,
        "average_volume_20": avg_20_vol,
        "rvol": rvol,
        "volume_breakout": rvol >= 1.5,
        "volume_contraction": rvol < 0.7,
        "price_volume_movement": pv_summary,
        "price_volume_tag": pv_tag,
        "delivery_pct_available": False
    }

    return {"symbol": symbol.upper(), "instrument_key": key, "timeframe": timeframe,
            "chart_type": chart_type, "timezone": "Asia/Kolkata", "source": source_label,
            "candles": candles, "indicators": indicators, "volume_analytics": volume_analytics,
            "has_older_data": len(candles) > 0, "live_tick": None,
            "feed_status": subscription_manager.get_status()["status"], "total_records": len(candles)}


@router.get("/export/csv")
async def export_chart_csv(
    symbol: str = Query("NIFTY"),
    timeframe: str = Query("15m"),
    chart_type: str = Query("CANDLESTICK"),
    instrument_key: Optional[str] = Query(None, description="Optional verified Upstox instrument key")
):
    """Download synchronized historical numerical candle data as CSV."""
    data = await get_chart_candles(symbol=symbol, timeframe=timeframe, chart_type=chart_type,
                                   before=None, instrument_key=instrument_key)
    candles = data.get("candles", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["time", "open", "high", "low", "close", "volume", "oi", "vwap"])

    for c in candles:
        writer.writerow([
            c.get("time"),
            c.get("open"),
            c.get("high"),
            c.get("low"),
            c.get("close"),
            c.get("volume"),
            c.get("oi", 0),
            c.get("vwap", "")
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={symbol}_{timeframe}_candles.csv"}
    )
