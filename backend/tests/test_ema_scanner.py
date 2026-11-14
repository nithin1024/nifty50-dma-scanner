"""
Unit and Integration Tests for NIFTY 50 EMA 9 / 21 + RSI 14 Scanner
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.technical_scanner_service import TechnicalScannerService, technical_scanner_service


def test_pure_ema_calculation():
    """Verify Exponential Moving Average calculation."""
    # Test values with known series
    prices = [100.0, 102.0, 101.0, 103.0, 104.0, 106.0, 108.0, 107.0, 109.0, 111.0]
    ema_series = TechnicalScannerService.calculate_ema_series(prices, period=5)
    assert len(ema_series) == len(prices)
    # First 4 periods are None
    assert ema_series[0] is None
    assert ema_series[3] is None
    # 5th period is simple SMA seed
    expected_seed = sum(prices[:5]) / 5
    assert ema_series[4] == pytest.approx(expected_seed, 0.01)
    # Subsequent values follow EMA formula
    multiplier = 2.0 / (5 + 1)
    expected_6th = (prices[5] * multiplier) + (ema_series[4] * (1.0 - multiplier))
    assert ema_series[5] == pytest.approx(expected_6th, 0.01)


def test_wilder_rsi_calculation():
    """Verify Wilder's Smoothed RSI 14 calculation."""
    # Constant rising prices should give RSI = 100
    rising = [float(100 + i) for i in range(25)]
    rsi_rising = TechnicalScannerService.calculate_wilder_rsi(rising, period=14)
    assert rsi_rising == 100.0

    # Constant falling prices should give RSI = 0
    falling = [float(100 - i) for i in range(25)]
    rsi_falling = TechnicalScannerService.calculate_wilder_rsi(falling, period=14)
    assert rsi_falling == 0.0

    # Oscillating series should give bounded RSI between 0 and 100
    oscillating = [100.0, 102.0, 101.0, 103.0, 102.0, 104.0, 103.0, 105.0, 104.0, 106.0, 105.0, 107.0, 106.0, 108.0, 107.0, 109.0]
    rsi_osc = TechnicalScannerService.calculate_wilder_rsi(oscillating, period=14)
    assert 0.0 <= rsi_osc <= 100.0


@pytest.mark.asyncio
async def test_ema_scanner_service_run():
    """Verify EMA 9/21 scanner execution across 50 constituents with 40-60 RSI filter."""
    result = await technical_scanner_service.scan_all_constituents(rsi_min=40.0, rsi_max=60.0)
    assert result is not None
    assert result["total_constituents"] == 50
    assert len(result["all_results"]) == 50

    # Verify telemetry counts
    counts = result["summary_counts"]
    assert counts["bullish_alignment"] + counts["bearish_alignment"] <= 50
    assert counts["in_rsi_corridor"] <= 50

    # Verify each stock has all required quant metrics
    for stock in result["all_results"]:
        assert "symbol" in stock
        assert "ema_9" in stock
        assert "ema_21" in stock
        assert "rsi_14" in stock
        assert stock["alignment"] in ("BULLISH", "BEARISH", "NEUTRAL")
        assert isinstance(stock["is_in_rsi_corridor"], bool)
        assert isinstance(stock["satisfies_ema_and_rsi"], bool)


@pytest.mark.asyncio
async def test_ema_scanner_api_endpoint():
    """Verify /api/v1/scanner/ema HTTP GET endpoint with query parameters."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/scanner/ema?rsi_min=35.0&rsi_max=65.0")
        assert resp.status_code == 200
        json_data = resp.json()
        assert json_data["total_constituents"] == 50
        assert json_data["rsi_filter_config"]["min"] == 35.0
        assert json_data["rsi_filter_config"]["max"] == 65.0
        assert len(json_data["all_results"]) == 50
