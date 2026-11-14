from fastapi import APIRouter
from typing import Dict, Any
from app.services.volume_service import volume_engine

router = APIRouter(prefix="/volume", tags=["Volume & RVOL Analytics"])


@router.get("/all-50", response_model=Dict[str, Any])
async def get_all_constituents_volume():
    """Retrieve full 6-session volume and RVOL analytics for all 50 NIFTY constituents."""
    return await volume_engine.get_all_constituents_volume_analytics()


@router.get("/{symbol}", response_model=Dict[str, Any])
async def get_stock_volume_analytics(symbol: str):
    """Retrieve detailed 6-session volume analytics for a single stock."""
    from app.services.historical_data_service import historical_data_service
    clean_sym = symbol.strip().upper()
    hist = await historical_data_service.fetch_symbol_history(clean_sym)
    candles = hist.get("candles", [])
    return volume_engine.analyze_stock_volume(clean_sym, candles)
