from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/data-status", tags=["Data Provenance & Status"])


@router.get("")
async def get_data_status():
    """Returns data provider connectivity and verification status."""
    return {
        "provider": "NSE Bhavcopy (Historical) / Upstox V3 (Live)",
        "status": "INITIALIZING",
        "current_level": "Level 1 — Project Foundation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verified_stocks_count": 0,
        "notes": "No fake or sample data is loaded. Historical data ingestion will be activated in Level 3."
    }
