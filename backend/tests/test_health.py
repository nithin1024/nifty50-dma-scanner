import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, inspect, text
from app.main import app
from app import __version__
from app.services.db_service import DatabaseService


@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test API root metadata
        api_res = await client.get("/api")
        assert api_res.status_code == 200
        data = api_res.json()
        assert data["app"] == "NIFTY 50 DMA Scanner"
        assert data["version"] == __version__
        assert data["health"] == "/api/v1/health"

        # Test root endpoint (returns 200, serving either frontend SPA or fallback JSON)
        root_res = await client.get("/")
        assert root_res.status_code == 200


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
        assert "upstox_authentication_status" in data
        assert "websocket_feed_status" in data
        assert "database_status" in data
        assert "access_token" not in str(data).lower()


@pytest.mark.asyncio
async def test_data_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/data-status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["INITIALIZING", "VERIFIED"]
        assert "provider" in data


def test_legacy_constituents_migration_adds_weightage_and_preserves_rows():
    test_engine = create_engine("sqlite://")
    with test_engine.begin() as connection:
        connection.execute(text("CREATE TABLE constituents (symbol TEXT PRIMARY KEY, company_name TEXT NOT NULL)"))
        connection.execute(text("INSERT INTO constituents (symbol, company_name) VALUES ('ABC', 'ABC Ltd')"))

    DatabaseService._migrate_existing_schema(test_engine)
    DatabaseService._migrate_existing_schema(test_engine)  # Migration is safe to repeat.
    columns = {column["name"] for column in inspect(test_engine).get_columns("constituents")}
    with test_engine.connect() as connection:
        row = connection.execute(text("SELECT symbol, company_name, weightage FROM constituents WHERE symbol='ABC'")).one()

    assert "weightage" in columns
    assert row == ("ABC", "ABC Ltd", 0.0)
    test_engine.dispose()
