"""
Unit and Integration Tests for Institutional Data Service (FII & DII Cash and Derivatives)
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.institutional_data_service import InstitutionalDataService


def test_fii_dii_cash_service():
    """Verify daily cash series, 5-day, 20-day, MTD, and gross metrics."""
    report = InstitutionalDataService.get_cash_market_report()
    assert report is not None
    assert "latest" in report
    assert "aggregates" in report
    assert "historical_daily_series" in report

    latest = report["latest"]
    assert round(latest["fii_net"], 2) == 10308.42
    assert latest["fii_gross_buy"] == 23596.4
    assert latest["fii_gross_sell"] == 13287.98
    assert latest["fii_status"] == "NET_BUYER"

    assert round(latest["dii_net"], 2) == -4859.8
    assert latest["dii_status"] == "NET_SELLER"

    # Aggregates
    aggs = report["aggregates"]
    assert "five_session_total" in aggs
    assert "twenty_session_total" in aggs
    assert "monthly_mtd_total" in aggs
    assert "ytd_total" in aggs
    assert aggs["five_session_total"]["fii_net"] == 19498.42


def test_participant_derivatives_positioning():
    """Verify participant-wise futures open interest and FII short covering."""
    report = InstitutionalDataService.get_derivatives_positioning_report()
    assert report is not None
    assert "fii_derivatives" in report
    assert "dii_derivatives" in report
    assert "pro_derivatives" in report
    assert "client_derivatives" in report

    fii = report["fii_derivatives"]
    assert fii["long_contracts"] == 104800
    assert fii["short_contracts"] == 142500
    assert fii["net_contracts"] == -37700
    assert fii["peak_historical_shorts"] == 225000

    # Short covering reduction from 225k peak
    assert fii["deleveraging_pct"] == 83.2
    assert "FII net shorts" in fii["deleveraging_summary"]


@pytest.mark.asyncio
async def test_fii_dii_api_routes(monkeypatch):
    """Cash flows use NSE's independently sourced report; derivatives remain unavailable."""
    async def cash_report_fixture():
        return {
            "status": "CURRENT",
            "source": "NSE FII/FPI & DII cash-market report",
            "data_date": "2026-11-13",
            "provisional": True,
            "unit": "INR_CRORE",
            "latest": {
                "fii_fpi": {"buy": 100.0, "sell": 75.0, "net": 25.0},
                "dii": {"buy": 50.0, "sell": 60.0, "net": -10.0},
            },
            "history": [],
            "history_sessions": 0,
        }

    monkeypatch.setattr(
        "app.api.routes.market_intelligence.nse_fii_dii_service.get_report",
        cash_report_fixture,
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        cash_resp = await client.get("/api/v1/market-intelligence/fii-dii/cash")
        deriv_resp = await client.get("/api/v1/market-intelligence/fii-dii/derivatives")
        assert cash_resp.status_code == 200
        assert cash_resp.json()["source"].startswith("NSE")
        assert cash_resp.json()["latest"]["fii_fpi"]["net"] == 25.0
        assert cash_resp.json()["latest"]["dii"]["net"] == -10.0
        assert deriv_resp.status_code == 200
        assert "fii_derivatives" in deriv_resp.json()
