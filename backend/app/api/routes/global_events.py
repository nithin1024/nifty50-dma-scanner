"""
FastAPI Routes for Global Economic & Worldwide Events Calendar.
Provides endpoints for filtering events, retrieving telemetry summaries,
dedicated sub-calendars (Central Banks, Inflation, GDP/PMI, Geopolitics, Commodities),
and user notification preferences.
"""

from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, Dict, Any, List
from app.services.global_events_service import global_events_service

router = APIRouter(prefix="/global-events", tags=["Global Events Calendar"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_global_events(
    category: Optional[str] = Query(None, description="Event category: ECONOMIC_DATA, CENTRAL_BANK, GOVERNMENT_FISCAL, GEOPOLITICAL, COMMODITIES_ENERGY, FINANCIAL_MARKETS, CORPORATE_TECH"),
    country_code: Optional[str] = Query(None, description="Country code: US, IN, EU, GB, JP, CN, AU, CA, GLOBAL"),
    importance: Optional[str] = Query(None, description="Event importance: HIGH, MEDIUM, LOW"),
    search_query: Optional[str] = Query(None, description="Search keyword in event title, country, or description"),
    timeframe: Optional[str] = Query(None, description="Timeframe filter: TODAY, 7_DAYS, 30_DAYS, 90_DAYS")
):
    """Retrieve filtered global economic events with live countdown and bilingual descriptions."""
    return global_events_service.get_all_events(
        category=category,
        country_code=country_code,
        importance=importance,
        search_query=search_query,
        timeframe=timeframe
    )


@router.get("/summary", response_model=Dict[str, Any])
async def get_events_summary():
    """Retrieve top-level market telemetry overview: IST live clock, high-impact counts, next countdown."""
    return global_events_service.get_market_overview_summary()


@router.get("/today", response_model=List[Dict[str, Any]])
async def get_today_events():
    """Retrieve today's scheduled events in chronological order."""
    return global_events_service.get_all_events(timeframe="TODAY")


@router.get("/india", response_model=List[Dict[str, Any]])
async def get_india_events():
    """Retrieve dedicated Indian macroeconomic, policy, fiscal, and market events calendar."""
    return global_events_service.get_all_events(country_code="IN")


@router.get("/central-banks", response_model=List[Dict[str, Any]])
async def get_central_bank_calendar():
    """Retrieve dedicated Central Bank interest rate and MPC calendar."""
    return global_events_service.get_all_events(category="CENTRAL_BANK")


@router.get("/inflation", response_model=List[Dict[str, Any]])
async def get_inflation_calendar():
    """Retrieve dedicated CPI and PPI inflation calendar."""
    all_events = global_events_service.get_all_events()
    return [e for e in all_events if "CPI" in e["event_name"] or "Inflation" in e["event_name"] or "WPI" in e["event_name"]]


@router.get("/gdp-pmi", response_model=List[Dict[str, Any]])
async def get_gdp_pmi_calendar():
    """Retrieve dedicated GDP growth and PMI releases."""
    all_events = global_events_service.get_all_events()
    return [e for e in all_events if "GDP" in e["event_name"] or "PMI" in e["event_name"]]


@router.get("/geopolitical", response_model=List[Dict[str, Any]])
async def get_geopolitical_calendar():
    """Retrieve verified global geopolitical and trade review events."""
    return global_events_service.get_all_events(category="GEOPOLITICAL")


@router.get("/commodities", response_model=List[Dict[str, Any]])
async def get_commodities_calendar():
    """Retrieve commodities, crude oil inventories, and energy releases."""
    return global_events_service.get_all_events(category="COMMODITIES_ENERGY")


@router.get("/holidays", response_model=List[Dict[str, Any]])
async def get_market_holidays_calendar():
    """Retrieve global exchange holidays and expiry events."""
    return global_events_service.get_all_events(category="FINANCIAL_MARKETS")


@router.get("/preferences", response_model=Dict[str, Any])
async def get_user_preferences():
    """Get user alert preferences."""
    return global_events_service.get_preferences()


@router.post("/preferences", response_model=Dict[str, Any])
async def update_user_preferences(prefs: Dict[str, Any] = Body(...)):
    """Save user alert preferences."""
    return global_events_service.update_preferences(prefs)


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_global_events():
    """Trigger manual verification and refresh of global events data."""
    global_events_service.init_database_events()
    return {
        "status": "SUCCESS",
        "message": "Global events calendar verified and re-synced successfully.",
        "summary": global_events_service.get_market_overview_summary()
    }


@router.get("/{event_id}", response_model=Dict[str, Any])
async def get_event_detail(event_id: str):
    """Retrieve detailed single event card information."""
    evt = global_events_service.get_event_by_id(event_id)
    if not evt:
        raise HTTPException(status_code=404, detail=f"Global event '{event_id}' not found.")
    return evt
