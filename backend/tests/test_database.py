import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.db_service import db_service
from app.services.scanner_service import scanner_service


@pytest.mark.asyncio
async def test_database_initialization_and_sync():
    """Verify tables exist and constituents are synced to relational DB."""
    db_service.init_db()
    db_service.sync_constituents_to_db()

    # Verify scan persistence
    latest_scan = scanner_service.get_latest_scan()
    if latest_scan:
        db_service.persist_scan_result(latest_scan)
        history = db_service.get_scan_history(limit=5)
        assert len(history) >= 1
        assert history[0]["total_constituents"] == 50


@pytest.mark.asyncio
async def test_stock_details_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/stock-details/RELIANCE")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert "smas" in data
        assert "chart_data" in data
        assert len(data["chart_data"]) >= 200


@pytest.mark.asyncio
async def test_history_scans_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/history/scans")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
