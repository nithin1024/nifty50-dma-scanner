from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.global_news_service import global_news_service
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
    """Return verified Upstox option-chain data and declare independently sourced gaps."""
    chain = await _nifty_option_chain()
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_source": "UPSTOX",
        "source_endpoint": "/v2/option/chain",
        "feed_status": chain.get("data_status", "WAITING"),
        "option_chain": chain,
        "unavailable_sections": [
            "Participant-wise derivatives positioning",
            "CPI/WPI, GDP, RBI policy, and economic calendar",
            "India VIX and cross-asset macro prices",
        ],
    }


@router.get("/market-impact", response_model=Dict[str, Any])
async def get_market_impact_analysis() -> Dict[str, Any]:
    """Return actual chain-derived NIFTY analytics, without fabricated macro claims."""
    return await get_market_intelligence()


@router.get("/fii-dii/cash", response_model=Dict[str, Any])
async def get_fii_dii_cash_report() -> Dict[str, Any]:
    """Return daily FII/FPI and DII cash activity from Upstox or NSE fallback."""
    return await nse_fii_dii_service.get_report()


@router.get("/fii-dii/derivatives", response_model=Dict[str, Any])
async def get_fii_dii_derivatives_report() -> Dict[str, Any]:
    _unsupported("Upstox does not expose participant-wise derivatives positioning")


@router.get("/inflation", response_model=Dict[str, Any])
async def get_inflation_analytics() -> Dict[str, Any]:
    _unsupported("Inflation statistics are not available through Upstox market-data APIs")


@router.get("/gdp", response_model=Dict[str, Any])
async def get_gdp_analytics() -> Dict[str, Any]:
    _unsupported("GDP statistics are not available through Upstox market-data APIs")


@router.get("/rbi-macro", response_model=Dict[str, Any])
async def get_rbi_macro_dashboard() -> Dict[str, Any]:
    _unsupported("RBI policy and macroeconomic series are not available through Upstox market-data APIs")


@router.get("/calendar", response_model=Dict[str, Any])
async def get_economic_calendar() -> Dict[str, Any]:
    _unsupported("Economic-calendar releases and forecasts are not available through Upstox market-data APIs")


@router.get("/export/csv/{section}")
async def export_macro_csv(section: str):
    _unsupported(f"CSV export for {section} is unavailable because its source data is not provided by Upstox")


@router.get("/macro-topics", response_model=List[Dict[str, Any]])
async def get_macro_topics() -> List[Dict[str, Any]]:
    _unsupported("Macro indicator observations are not available through Upstox market-data APIs")


@router.get("/macro-topics/{topic_id}", response_model=Dict[str, Any])
async def get_macro_topic_detail(topic_id: str) -> Dict[str, Any]:
    _unsupported("Macro indicator observations are not available through Upstox market-data APIs")


@router.get("/news", response_model=List[Dict[str, Any]])
async def get_global_news(category: Optional[str] = Query(None, description="Optional news category filter")) -> List[Dict[str, Any]]:
    """Return the separately sourced news feed; it is not represented as Upstox data."""
    return global_news_service.get_latest_news(category=category)
