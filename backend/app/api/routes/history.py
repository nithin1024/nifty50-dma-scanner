from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.db_service import db_service

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get("/scans", response_model=List[Dict[str, Any]])
async def get_historical_scans(limit: int = 30):
    """Retrieve historical scan records."""
    return db_service.get_scan_history(limit=limit)
