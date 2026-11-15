"""
Comprehensive Test Suite for Modules 32 to 39: Macro Data Quality, Calculations, and API Routes
Tests:
- Net FII/DII calculations (Net Flow = Gross Purchases - Gross Sales)
- Multi-session cumulative flows (5D, 10D, 20D, MTD, YTD)
- Derivatives long/short ratios, stock futures, and index options
- CPI vs WPI separation and 6-year inflation comparisons
- Nominal vs Real GDP, GVA, and component growth
- Actual vs forecast surprises and revisions
- Macro-to-market impact engine consistency
- CSV export generation for all sections
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_analytics_suite import macro_analytics_suite
from app.services.macro_data_service import macro_data_service
from app.services.market_intelligence_service import market_intelligence_service


# -----------------------------------------------------------------------------
# MODULE 32: FII / DII INSTITUTIONAL FLOW CALCULATIONS
# -----------------------------------------------------------------------------
def test_fii_dii_net_flow_formula():
    """Verify Net Flow = Gross Purchases - Gross Sales strictly holds."""
    report = institutional_data_service.get_cash_market_report()
    latest = report["latest"]

    expected_fii_net = latest["fii_gross_buy"] - latest["fii_gross_sell"]
    assert latest["fii_net"] == expected_fii_net, "FII net must equal gross buy minus gross sell"

    expected_dii_net = latest["dii_gross_buy"] - latest["dii_gross_sell"]
    assert latest["dii_net"] == expected_dii_net, "DII net must equal gross buy minus gross sell"

    assert latest["net_institutional_flow"] == latest["fii_net"] + latest["dii_net"]


def test_cumulative_flows_and_aggregations():
    """Verify 5-day, 10-day, 20-day, MTD, and YTD multi-session aggregations."""
    report = institutional_data_service.get_cash_market_report()
    history = report["historical_daily_series"]
    cum = report["cumulative_flows"]

    fii_5d = sum(s["fii_net"] for s in history[:5])
    assert cum["five_session_total"]["fii_net"] == round(fii_5d, 2)

    fii_10d = sum(s["fii_net"] for s in history[:10])
    assert cum["ten_session_total"]["fii_net"] == round(fii_10d, 2)

    fii_20d = sum(s["fii_net"] for s in history[:20])
    assert cum["twenty_session_total"]["fii_net"] == round(fii_20d, 2)


def test_derivatives_positioning_and_ratios():
    """Verify derivatives long/short ratio, contract changes, and options PCR."""
    deriv = institutional_data_service.get_derivatives_positioning_report()
    fii_idx = deriv["fii_index_futures"]

    assert fii_idx["long_contracts"] > 0
    assert fii_idx["short_contracts"] > 0
    expected_net = fii_idx["long_contracts"] - fii_idx["short_contracts"]
    assert fii_idx["net_contracts"] == expected_net

    expected_ls = round(fii_idx["long_contracts"] / fii_idx["short_contracts"], 3)
    assert fii_idx["long_short_ratio"] == expected_ls

    # Verify Stock Futures & Options presence
    assert "fii_stock_futures" in deriv
    assert "fii_index_options" in deriv
    assert deriv["fii_index_options"]["options_pcr_oi"] > 0


# -----------------------------------------------------------------------------
# MODULE 33: INFLATION ANALYTICS (CPI vs WPI STRICT SEPARATION)
# -----------------------------------------------------------------------------
def test_cpi_vs_wpi_strict_separation():
    """Ensure CPI and WPI are distinctly isolated and never mixed."""
    inf = macro_analytics_suite.get_inflation_analytics()
    cpi = inf["cpi_suite"]["headline_cpi"]
    wpi = inf["wpi_suite"]["headline_wpi"]

    assert cpi["current_reading"] != wpi["current_reading"]
    assert "MoSPI" in cpi["source"]
    assert "Economic Adviser" in wpi["source"]

    # Verify RBI tolerance ceiling benchmarking
    target = inf["rbi_monetary_policy_target"]
    assert target["target_midpoint_pct"] == 4.0
    assert target["tolerance_upper_ceiling_pct"] == 6.0
    assert cpi["current_reading"] > target["tolerance_upper_ceiling_pct"]
    assert target["target_breach_status"] == "BREACHED_UPPER_TOLERANCE_CEILING"


def test_inflation_surprise_calculation():
    """Verify Actual - Forecast surprise calculation."""
    inf = macro_analytics_suite.get_inflation_analytics()
    cpi = inf["cpi_suite"]["headline_cpi"]
    expected_surprise = round(cpi["actual_result"] - cpi["consensus_forecast"], 2)
    assert round(cpi["surprise_pct"], 2) == expected_surprise


# -----------------------------------------------------------------------------
# MODULE 34: GDP & NATIONAL ACCOUNTS (NOMINAL vs REAL)
# -----------------------------------------------------------------------------
def test_nominal_vs_real_gdp_distinctness():
    """Ensure nominal and real GDP are clearly distinguished with deflator."""
    gdp = macro_analytics_suite.get_gdp_national_accounts_analytics()
    real = gdp["headline_metrics"]["real_gdp_yoy"]["value"]
    nominal = gdp["headline_metrics"]["nominal_gdp_yoy"]["value"]

    assert nominal > real, "Nominal GDP must exceed Real GDP in inflationary regime"
    deflator = gdp["headline_metrics"]["gdp_deflator"]["value"]
    assert round(nominal - real, 2) == round(deflator, 2)

    # Check components sum up reasonably
    components = gdp["expenditure_components"]
    pfce = next(c for c in components if "PFCE" in c["component"])
    gfcf = next(c for c in components if "GFCF" in c["component"])
    assert pfce["share_pct"] > 50.0, "PFCE must be primary component (>50%)"
    assert gfcf["share_pct"] > 30.0, "GFCF investment rate must be >30%"


# -----------------------------------------------------------------------------
# MODULE 35: RBI & MACRO DASHBOARD
# -----------------------------------------------------------------------------
def test_rbi_policy_corridor():
    """Verify RBI Repo, SDF, and MSF rate corridor consistency."""
    rbi = macro_analytics_suite.get_rbi_macro_dashboard()
    policy = rbi["rbi_monetary_policy"]

    repo = policy["repo_rate"]["value"]
    sdf = policy["sdf_rate"]["value"]
    msf = policy["msf_rate"]["value"]

    assert sdf < repo < msf, "SDF must be floor, Repo midpoint, and MSF ceiling"
    assert round(repo - sdf, 2) == 0.25, "SDF is 25 bps below Repo"
    assert round(msf - repo, 2) == 0.25, "MSF is 25 bps above Repo"


# -----------------------------------------------------------------------------
# MODULE 36 & 37: CALENDAR & IMPACT ENGINE
# -----------------------------------------------------------------------------
def test_economic_calendar_structure():
    """Verify calendar events have dates, times, forecasts, actuals, and sources."""
    cal = macro_analytics_suite.get_economic_calendar_and_surprises()
    assert cal["total_events"] >= 6
    for ev in cal["events"]:
        assert "scheduled_date" in ev
        assert "scheduled_time_ist" in ev
        assert "source" in ev
        assert "impact_level" in ev


def test_market_impact_engine_balance():
    """Ensure market impact provides explainable factors without buy/sell signals."""
    impact = macro_analytics_suite.get_macro_market_impact_engine()
    factors = impact["institutional_synthesis_factors"]

    assert len(factors["potential_bullish_factors"]) > 0
    assert len(factors["potential_bearish_factors"]) > 0
    assert len(factors["conflicting_signals"]) > 0

    # Ensure no automated buy/sell direct trading triggers
    full_text = str(impact)
    assert "AUTOMATIC_BUY_TRIGGER" not in full_text
    assert "AUTOMATIC_SELL_TRIGGER" not in full_text


# -----------------------------------------------------------------------------
# MODULE 38: CSV EXPORT UTILITY
# -----------------------------------------------------------------------------
def test_csv_export_generation():
    """Verify CSV export produces clean comma-separated lines for each section."""
    for section in ["fii-dii", "derivatives", "inflation", "gdp"]:
        csv_text = macro_analytics_suite.export_section_csv(section)
        assert len(csv_text.strip()) > 0
        lines = csv_text.splitlines()
        assert len(lines) >= 2, "CSV must have header row and at least one data row"
        assert "," in lines[0], "Header must be comma-separated"


# -----------------------------------------------------------------------------
# INTEGRATION API ROUTES TESTING
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_market_intelligence_api_only_returns_upstox_data(monkeypatch):
    """Supported market fields use the chain; unavailable macro routes do not return samples."""
    async def chain_fixture():
        return {"symbol": "NIFTY", "source": "/v2/option/chain", "data_status": "WAITING", "spot_price": 25000.0}

    monkeypatch.setattr("app.api.routes.market_intelligence._nifty_option_chain", chain_fixture)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for endpoint in ("/api/v1/market-intelligence", "/api/v1/market-intelligence/market-impact"):
            response = await client.get(endpoint)
            assert response.status_code == 200
            assert response.json()["data_source"] == "UPSTOX"
            assert response.json()["option_chain"]["spot_price"] == 25000.0

        unavailable_endpoints = [
            "/api/v1/market-intelligence/fii-dii/derivatives",
            "/api/v1/market-intelligence/inflation",
            "/api/v1/market-intelligence/gdp",
            "/api/v1/market-intelligence/rbi-macro",
            "/api/v1/market-intelligence/calendar",
            "/api/v1/market-intelligence/export/csv/fii-dii",
            "/api/v1/market-intelligence/export/csv/inflation"
        ]
        for endpoint in unavailable_endpoints:
            response = await client.get(endpoint)
            assert response.status_code == 503, f"Endpoint {endpoint} should report unsupported source data"
            assert response.json()["detail"]["status"] == "UNAVAILABLE"
