from fastapi import APIRouter

router = APIRouter(prefix="/stocks", tags=["NIFTY 50 Constituents"])


@router.get("")
async def get_constituents():
    """Level 2 stub: returns official NIFTY 50 constituents."""
    return {
        "status": "pending_level_2",
        "message": "NIFTY 50 constituents management will be activated in Level 2.",
        "count": 0,
        "constituents": []
    }
