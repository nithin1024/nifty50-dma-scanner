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


def test_constituents_weightages_and_csv():
    """Verify weightages exist, sum to 100%, and CSV file is valid."""
    from pathlib import Path
    import csv

    stocks = constituents_service.get_constituents()
    assert len(stocks) == 50
    total_weight = sum(s["weightage"] for s in stocks)
    assert abs(total_weight - 100.0) < 0.05, f"Weights sum to {total_weight}, expected 100.0"

    for s in stocks:
        assert "weightage" in s and s["weightage"] > 0
        assert "effective_date" in s and len(s["effective_date"]) == 10
        assert "sector" in s and len(s["sector"]) > 0

    csv_path = Path("backend/data/nifty50_constituents.csv")
    assert csv_path.exists(), "Constituents CSV not found in backend/data"
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 50


def test_top_7_heavyweights_registry():
    """Verify top 7 heavyweights retrieval and combined dominance."""
    top7 = constituents_service.get_top_heavyweights(7)
    assert len(top7) == 7
    expected = {"HDFCBANK", "ICICIBANK", "RELIANCE", "BHARTIARTL", "LT", "SBIN", "INFY"}
    actual = {s["symbol"] for s in top7}
    assert expected == actual, f"Top 7 mismatch: {actual} vs {expected}"

    combined_weight = sum(s["weightage"] for s in top7)
    assert combined_weight > 40.0, f"Combined top 7 weight {combined_weight}% is below 40%"
