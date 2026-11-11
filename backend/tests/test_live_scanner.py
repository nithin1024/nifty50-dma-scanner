import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.upstox_service import upstox_auth_service, live_feed_manager


@pytest.mark.asyncio
async def test_upstox_connection_status():
    """Verify Upstox status reporting and permissions disclosure."""
    status = upstox_auth_service.get_connection_status()
    assert "provider" in status
    assert "status" in status
    assert "permissions_notice" in status


@pytest.mark.asyncio
async def test_live_scanner_endpoint():
    """Verify live intraday scan endpoint returns provisional signals comparing with daily SMAs."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/scanner/live")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "LIVE_SCAN_SNAPSHOT"
        assert "live_count_6_6" in data
        assert "live_count_5_6" in data
        assert "all_results" in data
        assert data["total_constituents"] == 50
        for stock in data["all_results"]:
            assert stock["is_provisional"] is True
            assert "live_score" in stock
            assert "completed_smas" in stock


@pytest.mark.asyncio
async def test_live_feed_refresh_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/scanner/live/refresh")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "LIVE_SCAN_SNAPSHOT"
