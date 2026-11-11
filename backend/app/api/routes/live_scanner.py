from fastapi import APIRouter

router = APIRouter(prefix="/scanner/live", tags=["Live Scanner"])


@router.get("")
async def get_live_scan():
    """Level 9 stub: returns live intraday DMA comparisons."""
    return {
        "status": "pending_level_9",
        "message": "Live intraday scanner will be activated in Level 9.",
        "results": []
    }
