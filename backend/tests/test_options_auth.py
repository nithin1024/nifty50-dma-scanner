import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.upstox_market_client import UpstoxApiError


@pytest.mark.asyncio
async def test_option_chain_auth_failure_is_reported_as_disconnected(monkeypatch):
    async def reject_contract_request(_instrument_key):
        raise UpstoxApiError(401, "Upstox request failed (HTTP 401)", "/v2/option/contract")

    monkeypatch.setattr("app.api.routes.options.upstox.get_option_contracts", reject_contract_request)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/options/chain?symbol=NIFTY&strike_range=5")
        status = await client.get("/api/v1/options/feed-status")

    assert response.status_code == 401
    assert status.json()["status"] == "DISCONNECTED"
    assert status.json()["authentication_status"] == "FAILED"


@pytest.mark.asyncio
async def test_profile_auth_failure_does_not_fail_market_data(monkeypatch):
    """Analytics Tokens have restricted /v2/user/profile access but valid market data."""
    async def reject_profile_request():
        raise UpstoxApiError(401, "Upstox request failed (HTTP 401)", "/v2/user/profile")

    async def accept_market_feed():
        return {
            "authenticated": True,
            "status": "AUTHENTICATED",
            "method": "market_feed_v3",
            "feed_endpoint": "/v3/feed/market-data-feed/authorize"
        }

    monkeypatch.setattr("app.api.routes.options.upstox.get_user_profile", reject_profile_request)
    monkeypatch.setattr("app.api.routes.options.upstox.verify_market_data_access", accept_market_feed)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/options/auth-status")
        status = await client.get("/api/v1/options/feed-status")

    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["is_analytics_token"] is True
    assert status.json()["upstox_auth_status"] == "AUTHENTICATED"
