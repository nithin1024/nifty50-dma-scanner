from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.constituents_service import constituents_service

router = APIRouter(prefix="/stocks", tags=["NIFTY 50 Constituents"])


@router.get("", response_model=Dict[str, Any])
async def list_constituents():
    """Retrieve all 50 official current NIFTY 50 constituents."""
    stocks = constituents_service.get_constituents()
    return {
        "index": "NIFTY 50",
        "total_count": len(stocks),
        "verified_count": len(stocks),
        "constituents": stocks
    }


@router.get("/{symbol}", response_model=Dict[str, Any])
async def get_constituent(symbol: str):
    """Retrieve details for a single NIFTY 50 constituent."""
    stock = constituents_service.get_by_symbol(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock symbol '{symbol}' is not a current NIFTY 50 constituent.")
    return stock


@router.post("/sync", response_model=Dict[str, Any])
async def sync_constituents():
    """Force synchronization with official NSE constituent registry."""
    return await constituents_service.sync_constituents()
