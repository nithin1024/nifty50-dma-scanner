from fastapi import APIRouter
from typing import Dict, Any
from app.services.scanner_service import scanner_service

router = APIRouter(prefix="/scanner/daily", tags=["Daily Scanner"])


@router.get("", response_model=Dict[str, Any])
async def get_daily_scan():
    """Retrieve the latest completed daily session DMA scan."""
    latest = scanner_service.get_latest_scan()
    if not latest:
        # Run scan if not yet executed
        latest = await scanner_service.run_daily_scan()
    return latest


@router.post("/run", response_model=Dict[str, Any])
async def trigger_daily_scan():
    """Trigger a fresh daily DMA scan across all 50 constituents."""
    return await scanner_service.run_daily_scan()


@router.get("/crossovers", response_model=Dict[str, Any])
async def get_fresh_crossovers():
    """Retrieve all fresh bullish crossovers detected in the latest session."""
    latest = scanner_service.get_latest_scan()
    if not latest:
        latest = await scanner_service.run_daily_scan()
    return {
        "completed_session_date": latest.get("completed_session_date"),
        "total_crossovers": len(latest.get("fresh_crossovers", [])),
        "crossovers": latest.get("fresh_crossovers", [])
    }
