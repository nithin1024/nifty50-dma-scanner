from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import get_settings
from app.schemas.health import HealthResponse
from app import __version__
from app.services.upstox_feed_service import subscription_manager

router = APIRouter(prefix="/health", tags=["System Health"])


@router.get("", response_model=HealthResponse)
async def check_health() -> HealthResponse:
    """Return service health without returning credentials or account identifiers."""
    settings = get_settings()
    feed = subscription_manager.get_status()
    try:
        from sqlalchemy import text
        from app.database.session import SessionLocal
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            database_status = "HEALTHY"
        finally:
            db.close()
    except Exception:
        database_status = "UNAVAILABLE"
    auth_status = subscription_manager.authentication_status
    rest_status = "AVAILABLE" if auth_status == "AUTHENTICATED" else "NOT_VERIFIED"
    return HealthResponse(
        status="HEALTHY" if database_status == "HEALTHY" else "DEGRADED",
        app_name=settings.APP_NAME,
        app_env=settings.APP_ENV,
        version=__version__,
        timestamp=datetime.now(timezone.utc),
        data_provider_status=feed["status"],
        upstox_authentication_status=auth_status,
        rest_connectivity_status=rest_status,
        websocket_feed_status=feed["status"],
        database_status=database_status,
        active_subscriptions=feed["active_subscriptions"],
        waiting_subscriptions=feed["waiting_subscriptions"],
        live_instrument_count=feed["live_instrument_count"],
        last_feed_received_at=feed["last_feed_received_at"],
    )
