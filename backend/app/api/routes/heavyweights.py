from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.heavyweight_service import heavyweight_engine

router = APIRouter(prefix="/heavyweights", tags=["Top 7 Heavyweight Tracking"])


@router.get("", response_model=Dict[str, Any])
async def get_all_heavyweights():
    """Retrieve dedicated tracking and index contribution analysis for the Top 7 NIFTY heavyweights."""
    return await heavyweight_engine.get_all_heavyweights_report()


@router.get("/{symbol}", response_model=Dict[str, Any])
async def get_heavyweight_details(symbol: str):
    """Retrieve individual card metrics, 6-session volume history, DMAs, and impact for a heavyweight."""
    detail = await heavyweight_engine.get_heavyweight_details(symbol)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Symbol '{symbol}' is not one of the Top 7 NIFTY 50 heavyweights."
        )
    return detail
