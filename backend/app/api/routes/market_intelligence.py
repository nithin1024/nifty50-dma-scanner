from fastapi import APIRouter
from typing import Dict, Any
from app.services.market_intelligence_service import market_intelligence_service

router = APIRouter(prefix="/market-intelligence", tags=["Institutional Market Intelligence"])


@router.get("", response_model=Dict[str, Any])
async def get_market_intelligence():
    """
    Retrieve comprehensive institutional market intelligence:
    - Confirmed market closing levels (Nifty, Sensex, USD/INR, Brent Crude Oil)
    - FII/DII cash-market institutional activity
    - FII index futures derivative positioning & short covering metrics
    - India CPI Inflation breakdown across all 12 categories with RBI ceiling benchmarking
    """
    return market_intelligence_service.get_market_intelligence()
