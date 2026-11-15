from fastapi import APIRouter, HTTPException, Query, Response
from typing import Dict, Any, List, Optional
from app.services.market_intelligence_service import market_intelligence_service
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_data_service import macro_data_service
from app.services.global_news_service import global_news_service
from app.services.macro_analytics_suite import macro_analytics_suite

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
    - Full Modules 32-37 analytics suites
    """
    return market_intelligence_service.get_market_intelligence()


@router.get("/fii-dii/cash", response_model=Dict[str, Any])
async def get_fii_dii_cash_report():
    """
    Retrieve comprehensive FII and DII cash market activity:
    - Latest session Gross Purchases, Gross Sales, Net Investment (Equity & Debt)
    - Previous session, 5-session, 10-session, 20-session, MTD, and YTD aggregates
    - 20-session historical daily series for dual-series graphical charting
    """
    return institutional_data_service.get_cash_market_report()


@router.get("/fii-dii/derivatives", response_model=Dict[str, Any])
async def get_fii_dii_derivatives_report():
    """
    Retrieve NSE participant-wise derivatives positioning:
    - FII, DII, Pro, Client Index Futures & Stock Futures Long, Short, Net open interest
    - FII Index Options positioning (Calls, Puts, PCR)
    - Long %, Short %, Long/Short ratio, and daily contract changes
    - Multi-session short-covering trajectory (225k peak shorts -> 63.6k current)
    """
    return institutional_data_service.get_derivatives_positioning_report()


@router.get("/inflation", response_model=Dict[str, Any])
async def get_inflation_analytics():
    """
    Module 33: Complete India Inflation Analytics
    - CPI Suite: Headline, Core, Food, Fuel, Housing
    - WPI Suite: Headline, Core, Food, Fuel, Manufactured Products
    - Inflation expectations & RBI 4% midpoint / 2-6% target comparison
    """
    return macro_analytics_suite.get_inflation_analytics()


@router.get("/gdp", response_model=Dict[str, Any])
async def get_gdp_analytics():
    """
    Module 34: GDP & National Accounts Analytics
    - Real GDP vs Nominal GDP vs GVA vs GDP Deflator
    - Expenditure components (PFCE, GFCE, GFCF, Net Exports)
    - Sector-wise GVA contributions & 6-year historical series
    """
    return macro_analytics_suite.get_gdp_national_accounts_analytics()


@router.get("/rbi-macro", response_model=Dict[str, Any])
async def get_rbi_macro_dashboard():
    """
    Module 35: RBI Policy & Macroeconomic Dashboard
    - Repo, SDF, MSF, Reverse Repo, CRR, SLR
    - 10-year G-Sec yield, USD/INR, Commodities (Crude, Gold, Silver, Gas, Aluminium)
    - PMI Manufacturing & Services, IIP, Fiscal Deficit, Capex, PLFS Unemployment, CAD
    """
    return macro_analytics_suite.get_rbi_macro_dashboard()


@router.get("/calendar", response_model=Dict[str, Any])
async def get_economic_calendar():
    """
    Module 36: Economic Calendar & Surprise Engine
    - Scheduled releases for CPI, WPI, GDP, RBI MPC, US CPI, Fed FOMC
    - Actual vs Forecast surprise calculations & revisions
    """
    return macro_analytics_suite.get_economic_calendar_and_surprises()


@router.get("/market-impact", response_model=Dict[str, Any])
async def get_market_impact_analysis():
    """
    Module 37: Macro-to-Market Impact Engine
    - Quantitative impact on NIFTY 50, BANK NIFTY, 8 key sectors, heavyweights
    - Option chain Max Pain, PCR, IV, Support/Resistance zones
    - Potential Bullish, Bearish, Neutral, and Conflicting factors
    """
    return macro_analytics_suite.get_macro_market_impact_engine()


@router.get("/export/csv/{section}")
async def export_macro_csv(section: str):
    """
    Module 38: CSV Export for Macroeconomic Intelligence
    - Downloads clean CSV representation for cash-flows, derivatives, inflation, gdp, or macro indicators
    """
    csv_content = macro_analytics_suite.export_section_csv(section)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=macro_{section.replace('/', '_')}.csv"
        }
    )


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
