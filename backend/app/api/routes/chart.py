from fastapi import APIRouter, Query, Response
from typing import Optional, Dict, Any
import io
import csv

from app.services.chart_engine_service import chart_engine_service

router = APIRouter(prefix="/chart", tags=["Professional Charting Engine"])


@router.get("/candles")
async def get_chart_candles(
    symbol: str = Query("NIFTY", description="Instrument symbol (e.g. NIFTY, RELIANCE, HDFCBANK)"),
    timeframe: str = Query("15m", description="Timeframe e.g. 1m, 5m, 15m, 1h, Daily"),
    chart_type: str = Query("CANDLESTICK", description="CANDLESTICK, LINE, AREA, HEIKIN_ASHI")
) -> Dict[str, Any]:
    """Retrieve normalized OHLCV candles, indicators, and live tick for TradingView Lightweight Charts."""
    return chart_engine_service.get_instrument_chart_data(
        symbol=symbol,
        timeframe=timeframe,
        chart_type=chart_type
    )


@router.get("/export/csv")
async def export_chart_csv(
    symbol: str = Query("NIFTY"),
    timeframe: str = Query("15m"),
    chart_type: str = Query("CANDLESTICK")
):
    """Download synchronized historical numerical candle data as CSV."""
    data = chart_engine_service.get_instrument_chart_data(symbol=symbol, timeframe=timeframe, chart_type=chart_type)
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
