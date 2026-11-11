from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
from app.services.upstox_service import upstox_auth_service, live_feed_manager

router = APIRouter(prefix="/scanner/live", tags=["Live Intraday Scanner"])


@router.get("", response_model=Dict[str, Any])
async def get_live_scan():
    """Retrieve current live intraday scan comparing prices against completed daily SMAs."""
    return await live_feed_manager.compute_live_intraday_scan()


@router.get("/status", response_model=Dict[str, Any])
async def get_live_feed_status():
    """Retrieve Upstox V3 auth state, credentials check, and market data display notice."""
    return upstox_auth_service.get_connection_status()


@router.post("/refresh", response_model=Dict[str, Any])
async def trigger_live_scan_refresh():
    """Compute and broadcast latest provisional intraday comparisons."""
    payload = await live_feed_manager.compute_live_intraday_scan()
    await live_feed_manager.broadcast(payload)
    return payload
