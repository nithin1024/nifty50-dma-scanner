import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.constituents_service import constituents_service


@pytest.mark.asyncio
async def test_constituents_count_and_uniqueness():
    """Verify exactly 50 unique constituents with valid symbols, ISINs, and Upstox keys."""
    stocks = constituents_service.get_constituents()
    assert len(stocks) == 50, f"Expected 50 constituents, got {len(stocks)}"

    symbols = [s["symbol"] for s in stocks]
    assert len(set(symbols)) == 50, "Duplicate symbols found in constituent list"

    isins = [s["isin"] for s in stocks]
    assert len(set(isins)) == 50, "Duplicate ISINs found in constituent list"

    for s in stocks:
        assert s["symbol"].isalnum() or "-" in s["symbol"] or "&" in s["symbol"]
        assert s["isin"].startswith("INE")
        assert s["upstox_instrument_key"].startswith("NSE_EQ|INE")
        assert s["active"] is True


@pytest.mark.asyncio
async def test_get_stocks_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/stocks")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_count"] == 50
        assert len(data["constituents"]) == 50


@pytest.mark.asyncio
async def test_get_individual_stock():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/stocks/RELIANCE")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert data["isin"] == "INE002A01018"
        assert data["upstox_instrument_key"] == "NSE_EQ|INE002A01018"

        # Not found test
        resp_404 = await client.get("/api/v1/stocks/INVALIDXYZ")
        assert resp_404.status_code == 404
