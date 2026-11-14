from fastapi import APIRouter, Query
from typing import Dict, Any
from app.services.technical_scanner_service import technical_scanner_service

router = APIRouter(prefix="/scanner/ema", tags=["EMA Technical Scanner"])


@router.get("", response_model=Dict[str, Any])
async def get_ema_scanner_results(
    rsi_min: float = Query(40.0, description="Minimum RSI threshold for consolidation corridor"),
    rsi_max: float = Query(60.0, description="Maximum RSI threshold for consolidation corridor")
):
    """
    Run quantitative EMA 9, EMA 21, and RSI 14 scanner across all 50 current NIFTY constituents:
    - Bullish alignment: EMA 9 > EMA 21
    - Bearish alignment: EMA 9 < EMA 21
    - Fresh Bullish Crossover: Prev EMA 9 <= Prev EMA 21 AND Latest EMA 9 > Latest EMA 21
    - Fresh Bearish Crossover: Prev EMA 9 >= Prev EMA 21 AND Latest EMA 9 < Latest EMA 21
    - Configurable RSI 40-60 Momentum Corridor
    - 6 distinct institutional classification groups
    - Volume confirmation & institutional bias
    """
    return await technical_scanner_service.scan_all_constituents(
        rsi_min=rsi_min,
        rsi_max=rsi_max
    )
