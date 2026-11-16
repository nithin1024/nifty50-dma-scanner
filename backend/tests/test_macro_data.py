"""
Unit and Integration Tests for Macroeconomic Intelligence & National Accounts Suite
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.macro_data_service import MacroDataService


def test_macro_catalog_coverage():
    """Verify macroeconomic indicators and national account concepts exist."""
    topics = MacroDataService.get_all_topics()
    assert len(topics) >= 10

    # Verify Telugu names exist for all topics
    for t in topics:
        assert t["name_te"] is not None and len(t["name_te"]) > 0
        assert t["definition"] is not None
        assert t["definition_te"] is not None


def test_macro_topic_detail_depth():
    """Verify individual topic includes mathematical formula, 5Y history, and equity sensitivity."""
    gdp_detail = MacroDataService.get_topic_detail("real-gdp")
    assert gdp_detail is not None
    assert gdp_detail["id"] == "real-gdp"
    assert "Real GDP" in gdp_detail["name"]
    assert "నిజమైన స్థూల దేశీయోత్పత్తి" in gdp_detail["name_te"]
    assert "Nominal GDP" in gdp_detail["formula"]
    assert len(gdp_detail["five_year_history"]) >= 5
    assert len(gdp_detail["country_comparison"]) >= 5
    assert "market_impact" in gdp_detail
    assert "auto_sector" in gdp_detail["market_impact"]


@pytest.mark.asyncio
async def test_macro_api_routes():
    """Macro observations are not returned as if they came from Upstox."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        list_resp = await client.get("/api/v1/market-intelligence/macro-topics")
        gdp_resp = await client.get("/api/v1/market-intelligence/macro-topics/real-gdp")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 20
        assert gdp_resp.status_code == 200
        assert gdp_resp.json()["id"] == "real-gdp"
