"""Official Upstox REST client.

Uses documented V2 profile / option-contract / option-chain endpoints and
Historical Candle Data V3. Tokens are never logged.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import httpx

from app.config import get_settings

logger = logging.getLogger("upstox_market_client")

API_V2 = "https://api.upstox.com/v2"
API_V3 = "https://api.upstox.com/v3"

NIFTY_INSTRUMENT_KEY = "NSE_INDEX|Nifty 50"
BANKNIFTY_INSTRUMENT_KEY = "NSE_INDEX|Nifty Bank"

INDEX_KEYS = {
    "NIFTY": NIFTY_INSTRUMENT_KEY,
    "NIFTY50": NIFTY_INSTRUMENT_KEY,
    "BANKNIFTY": BANKNIFTY_INSTRUMENT_KEY,
    "BANK NIFTY": BANKNIFTY_INSTRUMENT_KEY,
}


class UpstoxApiError(Exception):
    def __init__(self, status_code: int, message: str, endpoint: str):
        super().__init__(message)
        self.status_code = status_code
        self.endpoint = endpoint
        self.message = message


def _access_token() -> str:
    settings = get_settings()
    token = (settings.UPSTOX_ACCESS_TOKEN or "").strip()
    if token:
        return token
    from app.services.upstox_service import upstox_auth_service
    return (upstox_auth_service.access_token or "").strip()


def auth_headers() -> Dict[str, str]:
    token = _access_token()
    if not token:
        raise UpstoxApiError(401, "Upstox access token is not configured", "local-env")
    return {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }


def instrument_key_for_symbol(symbol: str) -> Optional[str]:
    key = INDEX_KEYS.get(symbol.upper())
    if key:
        return key
    from app.services.constituents_service import constituents_service
    symbol_upper = symbol.upper()
    for stock in constituents_service.get_constituents():
        if stock.get("symbol") == symbol_upper:
            return stock.get("upstox_instrument_key")
    return None


async def _get(url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    endpoint = url.split("upstox.com", 1)[-1]
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=auth_headers(), params=params)
    except httpx.HTTPError as exc:
        raise UpstoxApiError(0, f"Network error calling Upstox: {exc.__class__.__name__}", endpoint) from exc
    if response.status_code != 200:
        # Do not include remote response bodies in raised errors or logs.
        raise UpstoxApiError(response.status_code, f"Upstox request failed (HTTP {response.status_code})", endpoint)
    payload = response.json()
    if isinstance(payload, dict) and payload.get("status") not in (None, "success"):
        raise UpstoxApiError(response.status_code, str(payload.get("errors") or payload.get("status")), endpoint)
    return payload


async def get_user_profile() -> Dict[str, Any]:
    """GET /v2/user/profile. The raw token is never returned."""
    payload = await _get(f"{API_V2}/user/profile")
    data = payload.get("data") or {}
    return {
        "status": payload.get("status"),
        "authenticated": bool(data.get("user_id")),
        "user_id": data.get("user_id"),
        "user_name": data.get("user_name"),
        "is_active": data.get("is_active"),
        "exchanges": data.get("exchanges") or [],
        "products": data.get("products") or [],
        "broker": data.get("broker"),
        "endpoint": "/v2/user/profile",
    }


async def get_option_contracts(instrument_key: str) -> List[Dict[str, Any]]:
    """GET /v2/option/contract?instrument_key="""
    payload = await _get(f"{API_V2}/option/contract", params={"instrument_key": instrument_key})
    data = payload.get("data") or []
    if not isinstance(data, list):
        raise UpstoxApiError(200, "Option contract response data was not a list", "/v2/option/contract")
    return data


def unique_expiries(contracts: List[Dict[str, Any]]) -> List[str]:
    expiries = sorted({c.get("expiry") for c in contracts if c.get("expiry")})
    return [str(item) for item in expiries]


async def get_option_chain(instrument_key: str, expiry_date: str) -> List[Dict[str, Any]]:
    """GET /v2/option/chain?instrument_key=&expiry_date=YYYY-MM-DD"""
    payload = await _get(
        f"{API_V2}/option/chain",
        params={"instrument_key": instrument_key, "expiry_date": expiry_date},
    )
    data = payload.get("data") or []
    if not isinstance(data, list):
        raise UpstoxApiError(200, "Option chain response data was not a list", "/v2/option/chain")
    return data


def _encode_key(instrument_key: str) -> str:
    return quote(instrument_key, safe="")


async def get_historical_candles_v3(
    instrument_key: str,
    unit: str,
    interval: str,
    to_date: str,
    from_date: str,
) -> List[List[Any]]:
    """GET /v3/historical-candle/{key}/{unit}/{interval}/{to_date}/{from_date}"""
    url = (
        f"{API_V3}/historical-candle/{_encode_key(instrument_key)}"
        f"/{unit}/{interval}/{to_date}/{from_date}"
    )
    payload = await _get(url)
    candles = (payload.get("data") or {}).get("candles") or []
    return candles


async def get_intraday_candles_v3(instrument_key: str, unit: str, interval: str) -> List[List[Any]]:
    """GET /v3/historical-candle/intraday/{key}/{unit}/{interval}"""
    url = f"{API_V3}/historical-candle/intraday/{_encode_key(instrument_key)}/{unit}/{interval}"
    payload = await _get(url)
    return (payload.get("data") or {}).get("candles") or []


async def authorize_market_data_feed() -> str:
    """GET /v3/feed/market-data-feed/authorize -> one-time wss redirect URI."""
    payload = await _get(f"{API_V3}/feed/market-data-feed/authorize")
    uri = (payload.get("data") or {}).get("authorized_redirect_uri")
    if not uri or not str(uri).startswith("wss://"):
        raise UpstoxApiError(200, "Authorize response did not include a wss redirect URI", "/v3/feed/market-data-feed/authorize")
    return str(uri)


def default_history_window(unit: str) -> tuple[str, str]:
    today = date.today()
    if unit == "minutes":
        start = today - timedelta(days=7)
    elif unit == "hours":
        start = today - timedelta(days=90)
    elif unit == "weeks":
        start = today - timedelta(days=365 * 5)
    elif unit == "months":
        start = today - timedelta(days=365 * 10)
    else:
        start = today - timedelta(days=365 * 2)
    return start.isoformat(), today.isoformat()


def parse_candle_row(row: List[Any]) -> Optional[Dict[str, Any]]:
    """Official candle array: timestamp, open, high, low, close, volume, open interest."""
    if not isinstance(row, list) or len(row) < 6:
        return None
    timestamp = row[0]
    try:
        if isinstance(timestamp, str):
            parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            epoch = int(parsed.timestamp())
            iso = timestamp
        else:
            epoch = int(timestamp)
            iso = datetime.fromtimestamp(epoch).isoformat()
        candle = {
            "time": epoch,
            "time_iso": iso,
            "open": float(row[1]),
            "high": float(row[2]),
            "low": float(row[3]),
            "close": float(row[4]),
            "volume": int(row[5]) if row[5] is not None else None,
        }
        if len(row) > 6 and row[6] is not None:
            candle["oi"] = float(row[6])
        return candle
    except (TypeError, ValueError):
        return None
