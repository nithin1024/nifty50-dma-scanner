from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import get_settings
from app.schemas.health import HealthResponse
from app import __version__

router = APIRouter(prefix="/health", tags=["System Health"])


@router.get("", response_model=HealthResponse)
async def check_health() -> HealthResponse:
    """Return backend health and environment information."""
    settings = get_settings()
    return HealthResponse(
        status="HEALTHY",
        app_name=settings.APP_NAME,
        app_env=settings.APP_ENV,
        version=__version__,
        timestamp=datetime.now(timezone.utc),
        data_provider_status="INITIALIZING (Level 1: Foundation)"
    )
