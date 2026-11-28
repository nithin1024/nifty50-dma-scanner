from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_PROJECT_DIR = _BACKEND_DIR.parent


class Settings(BaseSettings):
    APP_NAME: str = "NIFTY 50 DMA Scanner"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/nifty50_dma"
    NEON_DATABASE_URL: str = ""
    DATA_FRESHNESS_THRESHOLD_SECONDS: int = 60
    UPSTOX_API_KEY: str = ""
    UPSTOX_API_SECRET: str = ""
    UPSTOX_ACCESS_TOKEN: str = ""
    UPSTOX_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/upstox/callback"
    APP_MODE: str = "DEMO"
    REDIS_URL: str = "redis://localhost:6379/0"
    NSE_FO_SOURCE_URL: str = ""
    # Upstox V3 market-data modes. Counts are the published per-connection ceilings
    # used by the subscription manager; overflow stays in the waiting queue.
    UPSTOX_MAX_FULL_SUBSCRIPTIONS: int = 2000
    UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS: int = 1500
    UPSTOX_MAX_COMBINED_SUBSCRIPTIONS: int = 2000
    UPSTOX_MAX_LTPC_SUBSCRIPTIONS: int = 5000
    UPSTOX_MAX_OPTION_GREEKS_SUBSCRIPTIONS: int = 3000
    UPSTOX_MAX_D30_SUBSCRIPTIONS: int = 50
    UPSTOX_STALE_SECONDS: int = 20

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            str(_PROJECT_DIR / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def effective_database_url(self) -> str:
        url = (self.NEON_DATABASE_URL or self.DATABASE_URL).strip()
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
