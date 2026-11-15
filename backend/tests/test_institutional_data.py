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
    assert latest["fii_net"] == 2410.0
    assert latest["fii_gross_buy"] == 14250.0
    assert latest["fii_gross_sell"] == 11840.0
    assert latest["fii_status"] == "NET_BUYER"

    assert latest["dii_net"] == -1350.0
    assert latest["dii_status"] == "NET_SELLER"

    # Aggregates
    aggs = report["aggregates"]
    assert "five_session_total" in aggs
    assert "twenty_session_total" in aggs
    assert "monthly_mtd_total" in aggs
    assert "ytd_total" in aggs
    assert aggs["five_session_total"]["fii_net"] == 25653.0  # 2410 + 1830 + 4600 + 12563 + 4250


def test_participant_derivatives_positioning():
    """Verify participant-wise futures open interest and FII short covering."""
    report = InstitutionalDataService.get_derivatives_positioning_report()
    assert report is not None
    assert "fii_derivatives" in report
    assert "dii_derivatives" in report
    assert "pro_derivatives" in report
    assert "client_derivatives" in report

    fii = report["fii_derivatives"]
    assert fii["long_contracts"] == 88450
    assert fii["short_contracts"] == 152100
    assert fii["net_contracts"] == -63650
    assert fii["peak_historical_shorts"] == 225000

    # Short covering reduction from 225k peak
    assert fii["deleveraging_pct"] == 71.7
    assert "FII net shorts" in fii["deleveraging_summary"]


@pytest.mark.asyncio
async def test_fii_dii_api_routes():
    """Upstox does not expose participant-wise FII/DII datasets."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        cash_resp = await client.get("/api/v1/market-intelligence/fii-dii/cash")
        deriv_resp = await client.get("/api/v1/market-intelligence/fii-dii/derivatives")
        assert cash_resp.status_code == deriv_resp.status_code == 503
        assert cash_resp.json()["detail"]["status"] == "UNAVAILABLE"
        assert deriv_resp.json()["detail"]["status"] == "UNAVAILABLE"
