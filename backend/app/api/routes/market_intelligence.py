from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.services.market_intelligence_service import market_intelligence_service
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_data_service import macro_data_service
from app.services.global_news_service import global_news_service

router = APIRouter(prefix="/market-intelligence", tags=["Institutional Market Intelligence"])


@router.get("", response_model=Dict[str, Any])
async def get_market_intelligence():
    """
    Retrieve comprehensive institutional market intelligence:
    - Confirmed market closing levels (Nifty, Sensex, USD/INR, Brent Crude Oil)
    - FII/DII cash-market institutional activity with multi-session aggregates
    - FII index futures derivative positioning & short covering metrics
    - India CPI Inflation breakdown across all 12 categories with RBI ceiling benchmarking
    - National Accounts & Macroeconomic glossary
    """
    return market_intelligence_service.get_market_intelligence()


@router.get("/fii-dii/cash", response_model=Dict[str, Any])
async def get_fii_dii_cash_report():
    """
    Retrieve comprehensive FII and DII cash market activity:
    - Latest session Gross Purchases, Gross Sales, Net Investment
    - Previous session, 5-session, 20-session, MTD, and YTD aggregates
    - 20-session historical daily series for dual-series graphical charting
    """
    return institutional_data_service.get_cash_market_report()


@router.get("/fii-dii/derivatives", response_model=Dict[str, Any])
async def get_fii_dii_derivatives_report():
    """
    Retrieve NSE participant-wise derivatives positioning:
    - FII, DII, Pro, Client Index Futures Long & Short open interest
    - Daily contract changes & percentage shifts
    - Multi-session short-covering trajectory (225k peak shorts -> 70k current)
    - Automated institutional interpretation synthesis
    """
    return institutional_data_service.get_derivatives_positioning_report()


@router.get("/macro-topics", response_model=List[Dict[str, Any]])
async def get_macro_topics():
    """
    Retrieve list of all 41 National Accounts topics and macroeconomic indicators
    for the interactive cheat sheet overview.
    """
    return macro_data_service.get_all_topics()


@router.get("/macro-topics/{topic_id}", response_model=Dict[str, Any])
async def get_macro_topic_detail(topic_id: str):
    """
    Retrieve full quantitative deep dive for a selected macroeconomic topic:
    - Bilingual English & Telugu definitions and formulas
    - 5-year historical observation table (Period, Actual, Previous, Change %)
    - Historical chart timeseries
    - Cross-country comparisons
    - Indian stock-market impact across Nifty 50, Bank Nifty, and major sectors
    """
    detail = macro_data_service.get_topic_detail(topic_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Macro indicator topic '{topic_id}' not found.")
    return detail


@router.get("/news", response_model=List[Dict[str, Any]])
async def get_global_news(category: Optional[str] = Query(None, description="Optional news category filter")):
    """
    Retrieve verified real global and domestic financial news wire:
    - English & Telugu headlines and summaries
    - Why the news matters & Indian stock market impact
    - Sectors & stocks affected
    - 3-Way Scenario Analysis (Positive, Neutral, Negative)
    """
    return global_news_service.get_latest_news(category=category)
