from fastapi import APIRouter, Query, Response, HTTPException
from typing import Optional, Dict, Any
import io
import csv
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.services import upstox_market_client as upstox
from app.services.upstox_market_client import UpstoxApiError
from app.services.upstox_feed_service import subscription_manager

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
    units = {"1m": ("minutes", "1"), "5m": ("minutes", "5"), "15m": ("minutes", "15"),
             "1h": ("hours", "1"), "1d": ("days", "1"), "1D": ("days", "1"),
             "Daily": ("days", "1"), "daily": ("days", "1"), "1M": ("days", "1"), "3M": ("days", "1"),
             "6M": ("days", "1"), "1Y": ("days", "1"), "3Y": ("days", "1"),
             "5Y": ("days", "1")}
    unit, interval = units.get(timeframe, ("minutes", "15"))
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    end = date.fromisoformat(before) - timedelta(days=1) if before else today
    if unit == "minutes":
        lookback = 30 if int(interval) <= 15 else 90
    elif unit == "hours":
        lookback = 90
    elif unit == "days":
        lookback = {"1M": 31, "3M": 93, "6M": 186, "1Y": 370,
                    "3Y": 365 * 3 + 5, "5Y": 365 * 5 + 10}.get(timeframe, 370)
    start = end - timedelta(days=lookback)
    try:
        if unit in ("minutes", "hours") and not before and end == today:
            historical_end = today - timedelta(days=1)
            previous = await upstox.get_historical_candles_v3(
                key, unit, interval, historical_end.isoformat(), start.isoformat())
            intraday = await upstox.get_intraday_candles_v3(key, unit, interval)
            raw = [*previous, *intraday]
        else:
            raw = await upstox.get_historical_candles_v3(key, unit, interval, end.isoformat(), start.isoformat())
    except UpstoxApiError as exc:
        raise HTTPException(status_code=exc.status_code or 503, detail=exc.message)
    await subscription_manager.set_subscriptions([key], mode="full")
    candles = [parsed for row in raw if (parsed := upstox.parse_candle_row(row))]
    candles.sort(key=lambda candle: candle["time"])
    closes = [candle["close"] for candle in candles]
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
    return {"symbol": symbol.upper(), "instrument_key": key, "timeframe": timeframe,
            "chart_type": chart_type, "timezone": "Asia/Kolkata", "source": "Upstox Historical Candle V3",
            "candles": candles, "indicators": indicators,
            "has_older_data": len(candles) > 0, "live_tick": None,
            "feed_status": subscription_manager.get_status()["status"], "total_records": len(candles)}


@router.get("/export/csv")
async def export_chart_csv(
    symbol: str = Query("NIFTY"),
    timeframe: str = Query("15m"),
    chart_type: str = Query("CANDLESTICK")
):
    """Download synchronized historical numerical candle data as CSV."""
    data = await get_chart_candles(symbol=symbol, timeframe=timeframe, chart_type=chart_type,
                                   before=None, instrument_key=None)
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
