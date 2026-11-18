"""
test_iip_and_all_stocks.py - Integration and unit tests for IIP Intelligence,
All Stocks Universe Screener, and Global Events resilience.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.iip_intelligence_service import iip_suite
from app.services.all_stocks_service import all_stocks_service, SECTORS_LIST
from app.services.global_events_service import global_events_service

client = TestClient(app)


def test_iip_suite_service():
    """Verify IIP suite calculations and components."""
    summary = iip_suite.get_latest_iip_summary()
    assert summary["actual_growth_yoy"] == 4.8
    assert summary["forecast_growth_yoy"] == 4.0
    assert summary["surprise_verdict"] == "BEAT"
    assert summary["momentum_verdict"] == "ACCELERATING"

    sectors = iip_suite.get_four_producing_sectors()
    assert len(sectors) == 4
    sector_names = {s["name"] for s in sectors}
    assert "Manufacturing" in sector_names
    assert "Mining and Quarrying" in sector_names
    assert "Electricity and Gas Supply" in sector_names

    use_based = iip_suite.get_six_use_based_categories()
    assert len(use_based) == 6
    use_names = {u["category"] for u in use_based}
    assert "Primary Goods" in use_names
    assert "Capital Goods" in use_names
    assert "Consumer Durables" in use_names

    cross = iip_suite.get_cross_confirmation_matrix()
    assert cross["cross_confirmation_score_pct"] >= 70.0
    assert len(cross["indicators"]) == 10

    flow = iip_suite.get_production_to_earnings_flow()
    assert len(flow["three_cash_flows"]) == 3
    assert len(flow["companies"]) > 0
    first_co = flow["companies"][0]
    assert "roce_pct" in first_co
    assert "roe_pct" in first_co
    assert "operating_cash_flow_cr" in first_co


def test_iip_api_endpoints():
    """Verify FastAPI routes for IIP intelligence."""
    res = client.get("/api/v1/market-intelligence/iip/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "four_producing_sectors" in data
    assert "six_use_based_categories" in data
    assert "cross_confirmation" in data
    assert "production_to_earnings" in data
    assert len(data["alerts"]) > 0


def test_all_stocks_service():
    """Verify All Stocks universe screener and 22 sectors."""
    assert len(SECTORS_LIST) == 22

    # Query all stocks
    stocks = all_stocks_service.get_stocks_universe()
    assert len(stocks) >= 15

    # Test sector filter
    it_stocks = all_stocks_service.get_stocks_universe(sector="IT")
    assert len(it_stocks) >= 3
    for s in it_stocks:
        assert s["sector"] == "IT"

    # Test screener filter (e.g. HIGH_VOLUME)
    high_vol = all_stocks_service.get_stocks_universe(screener_filter="HIGH_VOLUME")
    assert len(high_vol) > 0
    for s in high_vol:
        assert s["rvol"] >= 1.2

    # Test sector performance summary
    perf = all_stocks_service.get_sector_performance_summary()
    assert len(perf) > 0
    first = perf[0]
    assert "sector" in first
    assert "sector_average_change_pct" in first
    assert "dma_participation_pct" in first
    assert "ema_participation_pct" in first


def test_all_stocks_api_endpoints():
    """Verify FastAPI routes for all stocks screener."""
    # List stocks
    res = client.get("/api/v1/stocks-universe")
    assert res.status_code == 200
    stocks = res.json()
    assert len(stocks) >= 15

    # List 22 sectors
    res_sectors = client.get("/api/v1/stocks-universe/sectors")
    assert res_sectors.status_code == 200
    sectors = res_sectors.json()
    assert len(sectors) == 22
    assert "Banking" in sectors
    assert "IT" in sectors
    assert "Metals and Mining" in sectors

    # Sector performance
    res_perf = client.get("/api/v1/stocks-universe/sectors/performance")
    assert res_perf.status_code == 200
    assert len(res_perf.json()) > 0

    # Individual stock details
    res_stock = client.get("/api/v1/stocks-universe/HDFCBANK")
    assert res_stock.status_code == 200
    details = res_stock.json()
    assert details["symbol"] == "HDFCBANK"
    assert "pe" in details
    assert "roe" in details
    assert "sma_50" in details
    assert "above_vwap" in details


def test_global_events_resilience():
    """Verify economic calendar never returns 0 events."""
    events = global_events_service.get_all_events()
    assert len(events) >= 20

    summary = global_events_service.get_market_overview_summary()
    assert summary["total_events_tracked"] >= 20
    assert summary["high_impact_total"] >= 5

    res = client.get("/api/v1/global-events")
    assert res.status_code == 200
    assert len(res.json()) >= 20

    res_summary = client.get("/api/v1/global-events/summary")
    assert res_summary.status_code == 200
    assert res_summary.json()["total_events_tracked"] >= 20


def test_chart_candles_5y_volume_analytics():
    """Verify chart candles endpoint handles 5Y timeframe without HTTP 500 and includes volume analytics."""
    res = client.get("/api/v1/chart/candles?symbol=BAJFINANCE&timeframe=5Y")
    assert res.status_code == 200
    data = res.json()
    assert data["symbol"] == "BAJFINANCE"
    assert len(data["candles"]) > 0
    assert "volume_analytics" in data
    va = data["volume_analytics"]
    assert "current_volume" in va
    assert "average_volume_20" in va
    assert "rvol" in va
    assert "price_volume_movement" in va
