import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_volume_all_50_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/volume/all-50")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_stocks"] == 50
        assert len(data["results"]) == 50
        # Check first constituent has volume fields
        item = data["results"][0]
        assert "symbol" in item
        assert "six_session_avg_volume" in item
        assert "rvol" in item
        assert "volume_classification" in item


@pytest.mark.asyncio
async def test_volume_individual_stock_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/volume/RELIANCE")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "RELIANCE"
        assert "six_session_avg_volume" in data
        assert "rvol" in data
        assert "volume_classification" in data
        assert len(data["six_session_history"]) == 6


@pytest.mark.asyncio
async def test_heavyweights_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/heavyweights")
        assert resp.status_code == 200
        data = resp.json()
        assert data["heavyweight_count"] == 7
        assert len(data["heavyweights"]) == 7
        assert "combined_weightage_pct" in data
        assert "combined_estimated_contribution_pts" in data


@pytest.mark.asyncio
async def test_export_generate_and_download_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Generate export
        gen_resp = await client.post("/api/v1/export/generate")
        assert gen_resp.status_code == 200
        gen_data = gen_resp.json()
        assert gen_data["status"] == "SUCCESS"
        assert gen_data["total_sheets"] == 12

        # Download latest export
        dl_resp = await client.get("/api/v1/export/download/latest")
        assert dl_resp.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in dl_resp.headers["content-type"]
        assert len(dl_resp.content) > 5000


@pytest.mark.asyncio
async def test_market_intelligence_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/market-intelligence")
        assert resp.status_code == 200
        data = resp.json()
        assert "market_closing_levels" in data
        assert data["market_closing_levels"]["nifty_50"]["level"] == 25255.05
        assert data["market_closing_levels"]["sensex"]["level"] == 81879.40

        # Check FII/DII cash
        assert "fii_dii_cash_activity" in data
        assert data["fii_dii_cash_activity"]["fii_net_crores"] == 12563.0
        assert data["fii_dii_cash_activity"]["dii_net_crores"] == -8435.0

        # Check FII derivatives short covering
        assert "fii_derivatives_positioning" in data
        assert data["fii_derivatives_positioning"]["net_index_futures_contracts"] == -70413

        # Check CPI inflation 12 categories
        assert "cpi_inflation_breakdown" in data
        assert len(data["cpi_inflation_breakdown"]["categories"]) == 12
        assert data["cpi_inflation_breakdown"]["categories"][0]["category"] == "Personal care, social protection & miscellaneous"
        assert data["cpi_inflation_breakdown"]["categories"][0]["yoy_inflation_pct"] == 10.14

        # Check Macroeconomic Glossary (all 21 terms from official cheat sheet)
        assert "macro_glossary" in data
        assert len(data["macro_glossary"]) == 21
        terms = [t["term"] for t in data["macro_glossary"]]
        assert "GDP" in terms
        assert "GVA" in terms
        assert "PFCE" in terms
        assert "GFCF" in terms
        assert "GDP Surprise" in terms


