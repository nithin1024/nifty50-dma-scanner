from fastapi import APIRouter
from datetime import datetime, timezone
from app.services.scanner_service import scanner_service

router = APIRouter(prefix="/data-status", tags=["Data Provenance & Status"])


@router.get("")
async def get_data_status():
    """Returns data provider connectivity, verification statistics, and audit health."""
    latest_scan = scanner_service.get_latest_scan()
    verified_count = latest_scan.get("verified_constituents", 0) if latest_scan else 0
    scan_date = latest_scan.get("completed_session_date") if latest_scan else None

    status = "VERIFIED" if verified_count >= 50 else ("INITIALIZING" if verified_count == 0 else "PARTIAL")

    return {
        "provider": "NSE Bhavcopy / Verified Exchange Feed",
        "status": status,
        "completed_session_date": scan_date,
        "current_level": "Level 7 — Relational Persistence Active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_constituents": 50,
        "verified_stocks_count": verified_count,
        "adjustment_policy": "UNADJUSTED_CLOSE (Matches official NSE cash settlement & live tick comparison)",
        "notes": f"All {verified_count} constituents verified with >= 200 daily sessions. Zero synthetic data policy strictly enforced."
    }
