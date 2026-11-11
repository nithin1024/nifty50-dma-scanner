import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.scanner_service import scanner_service


@pytest.mark.asyncio
async def test_daily_scanner_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/scanner/daily")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_constituents" in data
        assert "count_6_6" in data
        assert "count_5_6" in data
        assert "all_results" in data


@pytest.mark.asyncio
async def test_crossovers_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/scanner/daily/crossovers")
        assert resp.status_code == 200
        data = resp.json()
        assert "crossovers" in data
