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


@router.get("/economic-indicators", response_model=Dict[str, Any])
async def get_core_economic_indicators() -> Dict[str, Any]:
    """Provides core 5 macroeconomic indicators (GDP, PMI, IIP, CPI, WPI) with Expected -> Previous -> Actual -> Surprise -> Market Impact."""
    return macro_analytics_suite.get_core_economic_indicators()


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
async def get_institutional_overview(response: Response = Response()) -> Dict[str, Any]:
    """Module 1: Comprehensive overview with indices, yields, commodities, currencies, FII/DII, and breadth."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return institutional_market_suite.get_institutional_overview()


@router.get("/live-overview", response_model=Dict[str, Any])
async def get_live_market_overview(
    force_refresh: bool = Query(False, description="Force live market recalculation"),
    response: Response = Response()
) -> Dict[str, Any]:
    """Live and verified session benchmark quotes, market breadth, and sector performance."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    from app.services.market_data_service import market_data_service
    return await market_data_service.get_live_market_overview(force_refresh=force_refresh)


@router.get("/global-markets", response_model=Dict[str, Any])
async def get_global_markets() -> Dict[str, Any]:
    """All 24 global benchmarks, currencies, sovereign yields, and commodities with market session awareness."""
    overview = institutional_market_suite.get_institutional_overview()
    return {
        "timestamp": overview.get("timestamp"),
        "indices": overview.get("indices", []),
        "currencies_and_yields": overview.get("currencies_and_yields", []),
        "commodities": overview.get("commodities", []),
        "source": "Official Exchange Benchmarks / ICE / LME / CCIL / RBI"
    }


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


# ---------------------------------------------------------
# PMI INTELLIGENCE SUITE (4 CASE SCENARIOS & 8 INDICATORS)
# ---------------------------------------------------------

@router.get("/pmi/dashboard", response_model=Dict[str, Any])
async def get_pmi_dashboard() -> Dict[str, Any]:
    """Complete Institutional PMI Intelligence Dashboard with 4 Case Scenarios & 8 Indicators."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_full_dashboard()


@router.get("/pmi/indicators", response_model=List[Dict[str, Any]])
async def get_pmi_indicators() -> List[Dict[str, Any]]:
    """8 Tracked PMI Indicators with Surprise, Monthly Change and Case Classification."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_pmi_indicators()


@router.get("/pmi/scenarios", response_model=Dict[str, Any])
async def get_pmi_scenarios() -> Dict[str, Any]:
    """Four Case Scenarios definitions and 11-column comparison table."""
    from app.services.pmi_intelligence_service import pmi_suite
    return {
        "cases": pmi_suite.get_four_case_definitions(),
        "comparison_table": pmi_suite.get_scenario_comparison_table()
    }


@router.get("/pmi/expectation-analysis", response_model=Dict[str, Any])
async def get_pmi_expectation_analysis() -> Dict[str, Any]:
    """Expectation vs Actual analysis distinguishing growth vs momentum."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_expectation_vs_actual_analysis()


@router.get("/pmi/companies", response_model=List[Dict[str, Any]])
async def get_pmi_companies(case: Optional[str] = None) -> List[Dict[str, Any]]:
    """Company-level fundamental metrics & earnings sensitivity for affected sectors."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_company_level_analysis(case_filter=case)


@router.get("/pmi/history", response_model=Dict[str, Any])
async def get_pmi_history() -> Dict[str, Any]:
    """5-year monthly historical PMI data (2021-2026) with NIFTY comparison."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_5year_monthly_history()


@router.get("/pmi/alerts", response_model=List[Dict[str, Any]])
async def get_pmi_alerts() -> List[Dict[str, Any]]:
    """Real-time rule-based PMI alerts for crossings, surprises, and divergences."""
    from app.services.pmi_intelligence_service import pmi_suite
    return pmi_suite.get_pmi_alerts()


# ---------------------------------------------------------
# IIP INTELLIGENCE SUITE (4 SECTORS & 6 USE-BASED CATEGORIES)
# ---------------------------------------------------------

@router.get("/iip/dashboard", response_model=Dict[str, Any])
async def get_iip_dashboard() -> Dict[str, Any]:
    """Complete Institutional IIP Intelligence Suite (4 Producing Sectors, 6 Use-Based Categories, Cross-Confirmation)."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_full_dashboard()


@router.get("/iip/sectors", response_model=List[Dict[str, Any]])
async def get_iip_producing_sectors() -> List[Dict[str, Any]]:
    """4 Officially defined producing sectors (Manufacturing, Mining, Electricity, Water/Waste)."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_four_producing_sectors()


@router.get("/iip/use-based", response_model=List[Dict[str, Any]])
async def get_iip_use_based_categories() -> List[Dict[str, Any]]:
    """6 Officially defined use-based categories (Primary, Capital, Intermediate, Infra, Durables, Non-Durables)."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_six_use_based_categories()


@router.get("/iip/educational", response_model=Dict[str, Any])
async def get_iip_educational_framework() -> Dict[str, Any]:
    """Educational & Analytical framework (Level, YoY, Base Effect, Revised, 3M/6M patterns, Breadth)."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_educational_framework()


@router.get("/iip/cross-confirmation", response_model=Dict[str, Any])
async def get_iip_cross_confirmation() -> Dict[str, Any]:
    """10-indicator cross-confirmation matrix with confidence score."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_cross_confirmation_matrix()


@router.get("/iip/production-to-earnings", response_model=Dict[str, Any])
async def get_iip_production_to_earnings() -> Dict[str, Any]:
    """Production-to-earnings flow covering all 3 cash flows (Operating, Investing, Financing), ROCE & ROE."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_production_to_earnings_flow()


@router.get("/iip/history", response_model=Dict[str, Any])
async def get_iip_history() -> Dict[str, Any]:
    """5-year historical IIP series with PMI and NIFTY 50 comparison."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_5year_historical_data()


@router.get("/iip/alerts", response_model=List[Dict[str, Any]])
async def get_iip_alerts() -> List[Dict[str, Any]]:
    """Official IIP release alerts, sector surges, and revisions."""
    from app.services.iip_intelligence_service import iip_suite
    return iip_suite.get_iip_alerts()


@router.get("/freshness", response_model=Dict[str, Any])
def get_data_freshness() -> Dict[str, Any]:
    """Centralized Data Freshness & Validation System covering all 25 modules."""
    from app.services.data_freshness_service import data_freshness_service
    return data_freshness_service.get_full_freshness_audit()


