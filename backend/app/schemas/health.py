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
