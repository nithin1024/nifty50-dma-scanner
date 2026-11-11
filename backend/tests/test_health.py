import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app import __version__


@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["app"] == "NIFTY 50 DMA Scanner"
        assert data["version"] == __version__
        assert data["health"] == "/api/v1/health"


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert data["app_name"] == "NIFTY 50 DMA Scanner"
        assert "timestamp" in data
        assert "data_provider_status" in data


@pytest.mark.asyncio
async def test_data_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/data-status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "INITIALIZING"
        assert "provider" in data
