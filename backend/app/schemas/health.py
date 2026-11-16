from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    app_name: str
    app_env: str
    version: str
    timestamp: datetime
    data_provider_status: Optional[str] = "INITIALIZING"
    upstox_authentication_status: Optional[str] = None
    rest_connectivity_status: Optional[str] = None
    websocket_feed_status: Optional[str] = None
    database_status: Optional[str] = None
    active_subscriptions: Optional[int] = None
    waiting_subscriptions: Optional[int] = None
    live_instrument_count: Optional[int] = None
    last_feed_received_at: Optional[datetime] = None
