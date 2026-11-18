"""
FastAPI Routes for Institutional NSE All Stocks Universe & Technical Screener.
Provides endpoints for:
1. Multi-factor technical screener across 22 sectors.
2. Sector taxonomies and sector performance comparison dashboard.
3. Individual stock detailed fundamentals, valuation metrics, and moving averages.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.all_stocks_service import all_stocks_service, SECTORS_LIST

router = APIRouter(prefix="/stocks-universe", tags=["All Stocks Screener"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_stocks(
    sector: Optional[str] = Query(None, description="Filter by sector name"),
    search: Optional[str] = Query(None, description="Search ticker symbol or company name"),
    mcap_category: Optional[str] = Query(None, description="Filter: Large Cap, Mid Cap, Small Cap"),
    screener_filter: Optional[str] = Query(
        None,
        description="Filter type: HIGH_VOLUME, LOW_VOLUME, RVOL_BREAKOUT, ABOVE_VWAP, BELOW_VWAP, ABOVE_SMA20, ABOVE_SMA50, ABOVE_SMA100, ABOVE_SMA200, ABOVE_ALL_4_SMAS, BULLISH_EMA_CROSSOVER, BEARISH_EMA_CROSSOVER, RSI_ABOVE_70, RSI_BELOW_30, 52W_HIGH_BREAKOUT"
    )
):
    """Retrieve filtered stocks universe with technical indicators and real volume metrics."""
    return all_stocks_service.get_stocks_universe(
        sector=sector,
        search_query=search,
        mcap_category=mcap_category,
        screener_filter=screener_filter
    )


@router.get("/sectors", response_model=List[str])
async def get_all_sectors() -> List[str]:
    """Retrieve the official list of 22 sectors."""
    return SECTORS_LIST


@router.get("/sectors/performance", response_model=List[Dict[str, Any]])
async def get_sector_performance() -> List[Dict[str, Any]]:
    """Sector Performance Comparison Dashboard with breadth, RVOL, top movers, and DMA/EMA participation."""
    return all_stocks_service.get_sector_performance_summary()


@router.get("/{symbol}", response_model=Dict[str, Any])
async def get_stock_details(symbol: str) -> Dict[str, Any]:
    """Retrieve single stock comprehensive overview including all fundamental metrics and moving averages."""
    all_stocks = all_stocks_service.get_stocks_universe(search_query=symbol)
    matched = [s for s in all_stocks if s["symbol"].upper() == symbol.upper()]
    if not matched:
        raise HTTPException(status_code=404, detail=f"Stock with symbol {symbol} not found in verified universe.")
    return matched[0]
