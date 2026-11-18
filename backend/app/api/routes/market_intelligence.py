from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Response

from app.services.institutional_market_suite import institutional_market_suite
from app.services.global_news_service import global_news_service
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_analytics_suite import macro_analytics_suite
from app.services.macro_data_service import macro_data_service
from app.services.market_intelligence_service import market_intelligence_service
from app.services.nse_fii_dii_service import nse_fii_dii_service

router = APIRouter(prefix="/market-intelligence", tags=["Market Intelligence"])

UNSUPPORTED_MESSAGE = (
    "This data is not provided by the connected Upstox API. No substitute or generated values are returned."
)


async def _nifty_option_chain() -> Dict[str, Any]:
    # Import lazily so this router can share the existing verified chain pipeline
    # without creating a route-import cycle during application startup.
    from app.api.routes.options import get_option_chain

    return await get_option_chain(symbol="NIFTY", strike_range=10, expiry=None)


def _unsupported(source: str) -> None:
    raise HTTPException(
        status_code=503,
        detail={
            "status": "UNAVAILABLE",
            "source": source,
            "message": UNSUPPORTED_MESSAGE,
        },
    )


@router.get("", response_model=Dict[str, Any])
async def get_market_intelligence() -> Dict[str, Any]:
    """Return comprehensive institutional market intelligence, macro surveillance, and option chain."""
    data = market_intelligence_service.get_market_intelligence()
    try:
        chain = await _nifty_option_chain()
        data["option_chain"] = chain
        data["feed_status"] = chain.get("data_status", "WAITING")
        data["data_source"] = "UPSTOX"
    except Exception:
        pass
    return data


@router.get("/market-impact", response_model=Dict[str, Any])
async def get_market_impact_analysis() -> Dict[str, Any]:
    """Return macro-to-market impact analytics."""
    return macro_analytics_suite.get_macro_market_impact_engine()


@router.get("/fii-dii/cash", response_model=Dict[str, Any])
async def get_fii_dii_cash_report() -> Dict[str, Any]:
    """Return daily FII/FPI and DII cash activity from Upstox or NSE fallback."""
    return await nse_fii_dii_service.get_report()


@router.get("/fii-dii/derivatives", response_model=Dict[str, Any])
async def get_fii_dii_derivatives_report() -> Dict[str, Any]:
    """Participant-wise derivatives positioning across Index Futures, Stock Futures, and Index Options."""
    return institutional_data_service.get_derivatives_positioning_report()


@router.get("/inflation", response_model=Dict[str, Any])
async def get_inflation_analytics() -> Dict[str, Any]:
    """CPI Inflation breakdown across all 12 categories with RBI ceiling benchmarking."""
    return macro_analytics_suite.get_inflation_analytics()


@router.get("/gdp", response_model=Dict[str, Any])
async def get_gdp_analytics() -> Dict[str, Any]:
    """GDP & National Accounts Analytics."""
    return macro_analytics_suite.get_gdp_national_accounts_analytics()


@router.get("/rbi-macro", response_model=Dict[str, Any])
async def get_rbi_macro_dashboard() -> Dict[str, Any]:
    """RBI Policy & Macroeconomic Dashboard."""
    return macro_analytics_suite.get_rbi_macro_dashboard()


@router.get("/calendar", response_model=Dict[str, Any])
async def get_economic_calendar() -> Dict[str, Any]:
    """Economic Calendar & Surprise Engine."""
    return macro_analytics_suite.get_economic_calendar_and_surprises()


@router.get("/export/csv/{section}")
async def export_macro_csv(section: str):
    """CSV Export for Macroeconomic Intelligence."""
    csv_content = macro_analytics_suite.export_section_csv(section)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=macro_{section.replace('/', '_')}.csv"
        },
    )


@router.get("/macro-topics", response_model=List[Dict[str, Any]])
async def get_macro_topics() -> List[Dict[str, Any]]:
    """Retrieve all 41 National Accounts topics and macroeconomic indicators."""
    return macro_data_service.get_all_topics()


@router.get("/macro-topics/{topic_id}", response_model=Dict[str, Any])
async def get_macro_topic_detail(topic_id: str) -> Dict[str, Any]:
    """Retrieve full quantitative deep dive for a selected macroeconomic topic."""
    detail = macro_data_service.get_topic_detail(topic_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Macro indicator topic '{topic_id}' not found.")
    return detail


@router.get("/news", response_model=List[Dict[str, Any]])
async def get_global_news(category: Optional[str] = Query(None, description="Optional news category filter")) -> List[Dict[str, Any]]:
    """Return the separately sourced news feed; it is not represented as Upstox data."""
    return global_news_service.get_latest_news(category=category)


@router.get("/overview", response_model=Dict[str, Any])
async def get_institutional_overview() -> Dict[str, Any]:
    """Module 1: Comprehensive overview with indices, yields, commodities, currencies, FII/DII, and breadth."""
    return institutional_market_suite.get_institutional_overview()


@router.get("/premarket", response_model=Dict[str, Any])
async def get_premarket_intelligence() -> Dict[str, Any]:
    """Module 2: Premarket intelligence with global indices, GIFT Nifty gap, and 3 opening scenarios."""
    return institutional_market_suite.get_premarket_intelligence()


@router.get("/sectors", response_model=Dict[str, Any])
async def get_sector_fundamentals() -> Dict[str, Any]:
    """Module 9: Sector & Company Fundamentals across 15 key Indian sectors."""
    return institutional_market_suite.get_sector_and_company_fundamentals()


@router.get("/monitoring/{timeframe}", response_model=Dict[str, Any])
async def get_monitoring_dashboard(timeframe: str) -> Dict[str, Any]:
    """Module 10: Multi-timeframe monitoring dashboards (Daily, Weekly, Monthly with 5-year series)."""
    return institutional_market_suite.get_monitoring_dashboard(timeframe=timeframe)


@router.get("/nifty-trading", response_model=Dict[str, Any])
async def get_nifty_trading_intelligence() -> Dict[str, Any]:
    """Module 13: NIFTY Daily Trading Intelligence with VWAP, pivot levels, and action blueprint."""
    return institutional_market_suite.get_nifty_trading_intelligence()


@router.get("/alerts", response_model=List[Dict[str, Any]])
async def get_market_alerts() -> List[Dict[str, Any]]:
    """Module 14: Macroeconomic, technical, and institutional flow alerts."""
    return institutional_market_suite.get_realtime_alerts()
