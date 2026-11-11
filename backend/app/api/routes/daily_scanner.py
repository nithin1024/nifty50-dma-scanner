from fastapi import APIRouter

router = APIRouter(prefix="/scanner/daily", tags=["Daily Scanner"])


@router.get("")
async def get_daily_scan():
    """Level 5 stub: returns latest completed daily DMA scan."""
    return {
        "status": "pending_level_5",
        "message": "Daily DMA scanner will be activated in Level 5.",
        "results": []
    }
