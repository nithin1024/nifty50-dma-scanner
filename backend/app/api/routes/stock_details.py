from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.historical_data_service import historical_data_service
from app.services.constituents_service import constituents_service
from app.services.dma_service import dma_engine
from app.services.crossover_service import crossover_engine

router = APIRouter(prefix="/stock-details", tags=["Stock DMA Details"])


@router.get("/{symbol}", response_model=Dict[str, Any])
async def get_stock_details(symbol: str):
    """Retrieve detailed DMA metrics, latest prices, and chart data for a stock."""
    constituent = constituents_service.get_by_symbol(symbol)
    if not constituent:
        raise HTTPException(status_code=404, detail=f"Stock symbol '{symbol}' not found in NIFTY 50.")

    hist = await historical_data_service.fetch_symbol_history(symbol)
    candles = hist.get("candles", [])

    if not candles:
        return {
            "symbol": constituent["symbol"],
            "company_name": constituent["company_name"],
            "industry": constituent["industry"],
            "isin": constituent["isin"],
            "status": "UNAVAILABLE",
            "message": "No historical data available.",
            "candles": [],
            "smas": {},
            "distances": {},
            "score": 0,
            "classification": "UNAVAILABLE",
            "fresh_crossovers": []
        }

    closes = [c["close"] for c in candles]
    dates = [c["trading_date"] for c in candles]
    latest_close = closes[-1]

    smas = dma_engine.calculate_all_smas(closes)
    classification = dma_engine.classify_stock(latest_close, smas)
    fresh_crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)
    rolling_smas = dma_engine.compute_rolling_smas(closes)

    # Format chart candles (date, open, high, low, close, volume) + rolling DMA overlays
    chart_candles = []
    for i, c in enumerate(candles):
        chart_candles.append({
            "time": c["trading_date"],
            "open": c["open"],
            "high": c["high"],
            "low": c["low"],
            "close": c["close"],
            "volume": c["volume"],
            "dma5": round(rolling_smas["dma5"][i], 2) if rolling_smas["dma5"][i] is not None else None,
            "dma10": round(rolling_smas["dma10"][i], 2) if rolling_smas["dma10"][i] is not None else None,
            "dma20": round(rolling_smas["dma20"][i], 2) if rolling_smas["dma20"][i] is not None else None,
            "dma50": round(rolling_smas["dma50"][i], 2) if rolling_smas["dma50"][i] is not None else None,
            "dma100": round(rolling_smas["dma100"][i], 2) if rolling_smas["dma100"][i] is not None else None,
            "dma200": round(rolling_smas["dma200"][i], 2) if rolling_smas["dma200"][i] is not None else None,
        })

    return {
        "symbol": constituent["symbol"],
        "company_name": constituent["company_name"],
        "industry": constituent["industry"],
        "isin": constituent["isin"],
        "upstox_instrument_key": constituent["upstox_instrument_key"],
        "status": hist.get("quality_status", "VERIFIED"),
        "latest_close": round(latest_close, 2),
        "latest_trading_date": dates[-1],
        "total_sessions": len(candles),
        "score": classification["score"],
        "classification": classification["classification"],
        "is_6_6": classification["is_6_6"],
        "is_5_6": classification["is_5_6"],
        "comparisons": classification["comparisons"],
        "smas": {k: round(v, 2) if v is not None else None for k, v in smas.items()},
        "distances": {k: round(v, 2) if v is not None else None for k, v in classification["distances"].items()},
        "fresh_crossovers": fresh_crossovers,
        "chart_data": chart_candles
    }
