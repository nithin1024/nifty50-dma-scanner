import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.options_universe_service import options_universe_service
from app.services.options_analytics_engine import (
    options_analytics_engine,
    calculate_black_scholes_greeks
)
from app.services.chart_engine_service import chart_engine_service
from app.services.alerts_and_monitoring_service import alerts_and_monitoring_service

client = TestClient(app)


def test_fo_universe_and_eligibility():
    """Verify official NIFTY 50 constituent F&O intersection and specs."""
    universe = options_universe_service.get_fo_eligible_universe()
    assert len(universe) >= 50
    # First item must be NIFTY index contract
    nifty = universe[0]
    assert nifty["symbol"] == "NIFTY"
    assert nifty["lot_size"] == 25
    assert nifty["strike_step"] == 50

    # Stock contracts must include RELIANCE, HDFCBANK, INFY, TCS
    symbols = {item["symbol"] for item in universe}
    assert "RELIANCE" in symbols
    assert "HDFCBANK" in symbols
    assert "TCS" in symbols


def test_option_chain_atm_plus_minus_10():
    """Verify live/session Option Chain generation with ATM ±10 strikes."""
    chain = options_analytics_engine.get_option_chain(symbol="NIFTY", strike_range=10)
    assert chain["symbol"] == "NIFTY"
    assert "spot_price" in chain
    assert "atm_strike" in chain
    rows = chain["rows"]
    # 10 below + ATM + 10 above = 21 strikes
    assert len(rows) == 21

    # Verify CE and PE fields
    mid = rows[10]
    assert mid["is_atm"] is True
    assert "ltp" in mid["ce"]
    assert "iv" in mid["ce"]
    assert "delta" in mid["ce"]
    assert "gamma" in mid["ce"]
    assert "oi" in mid["ce"]
    assert "volume" in mid["ce"]
    assert "ltp" in mid["pe"]


def test_black_scholes_greeks_and_pcr():
    """Verify BSM theoretical pricing, Greeks transparency, and PCR metrics."""
    greeks_call = calculate_black_scholes_greeks(
        spot=23500.0, strike=23500.0, time_to_expiry_years=0.05, volatility=0.13, is_call=True
    )
    assert 0.40 <= greeks_call["delta"] <= 0.60
    assert greeks_call["gamma"] > 0
    assert greeks_call["vega"] > 0
    assert greeks_call["theta"] < 0

    greeks_put = calculate_black_scholes_greeks(
        spot=23500.0, strike=23500.0, time_to_expiry_years=0.05, volatility=0.13, is_call=False
    )
    assert -0.60 <= greeks_put["delta"] <= -0.40

    chain = options_analytics_engine.get_option_chain("NIFTY")
    totals = chain["totals"]
    assert totals["oi_pcr"] > 0
    assert totals["vol_pcr"] > 0


def test_max_pain_calculation():
    """Verify Max Pain strike payout minimization algorithm."""
    chain = options_analytics_engine.get_option_chain("NIFTY")
    mp = chain["max_pain"]
    assert "max_pain_strike" in mp
    assert "payout_table" in mp
    assert len(mp["payout_table"]) == len(chain["rows"])
    # Minimum payout must be positive
    assert mp["min_total_payout"] > 0


def test_support_resistance_zones():
    """Verify defensible support and resistance identification from OI concentration."""
    chain = options_analytics_engine.get_option_chain("NIFTY")
    sr = chain["support_resistance"]
    assert "strong_support" in sr
    assert "strong_resistance" in sr
    assert sr["strong_support"]["strike"] <= chain["spot_price"]
    assert sr["strong_resistance"]["strike"] >= chain["spot_price"]
    assert sr["strong_support"]["confidence_score"] >= 70


def test_strategy_payoff_calculator():
    """Verify 14 options strategy structures, net debit/credit, and payoff curve."""
    strategies = [
        "LONG_CALL", "SHORT_CALL", "LONG_PUT", "SHORT_PUT",
        "BULL_CALL_SPREAD", "BEAR_PUT_SPREAD", "BULL_PUT_SPREAD", "BEAR_CALL_SPREAD",
        "LONG_STRADDLE", "SHORT_STRADDLE", "LONG_STRANGLE", "SHORT_STRANGLE",
        "IRON_CONDOR", "BUTTERFLY"
    ]
    for strat in strategies:
        res = options_analytics_engine.calculate_strategy_payoff(strategy_name=strat)
        assert res["strategy"] == strat
        assert len(res["legs"]) >= 1
        assert len(res["payoff_curve"]) > 10
        assert "breakevens" in res


def test_market_regime_classification():
    """Verify quantitative market regime detection and VWAP CPR pivots."""
    regime = options_analytics_engine.detect_market_regime(spot=23532.70)
    assert regime["regime"] in ("BULLISH_TREND_REGIME", "BEARISH_TREND_REGIME", "RANGE_BOUND_MEAN_REVERTING")
    assert "pivots" in regime
    assert "cpr_pivot" in regime["pivots"]


def test_chart_candles_and_heikin_ashi():
    """Verify candlestick and Heikin-Ashi transformation."""
    chart_data = chart_engine_service.get_instrument_chart_data(symbol="NIFTY", timeframe="15m", chart_type="CANDLESTICK")
    assert chart_data["symbol"] == "NIFTY"
    assert len(chart_data["candles"]) > 0
    c0 = chart_data["candles"][0]
    assert "open" in c0 and "high" in c0 and "low" in c0 and "close" in c0 and "volume" in c0

    # Heikin-Ashi
    ha_data = chart_engine_service.get_instrument_chart_data(symbol="NIFTY", timeframe="15m", chart_type="HEIKIN_ASHI")
    assert ha_data["candles"][0]["is_transformed"] is True
    assert ha_data["candles"][0]["transformation_type"] == "HEIKIN_ASHI"


def test_alerts_and_data_quality_report():
    """Verify alert history and honest DEMO vs LIVE status report."""
    alerts = alerts_and_monitoring_service.get_active_alerts()
    assert len(alerts) >= 1

    dq = alerts_and_monitoring_service.get_data_quality_report()
    assert dq["app_mode"] in ("DEMO", "LIVE")
    assert "subscriptions" in dq
    assert "latency_ms" in dq
    assert "honest_data_policy" in dq


def test_options_api_endpoints():
    """Verify all REST endpoints for options, strategy payoff, regime, and chart candles."""
    # Universe
    r_uni = client.get("/api/v1/options/universe")
    assert r_uni.status_code == 200
    assert len(r_uni.json()["universe"]) >= 50

    # Option chain
    r_chain = client.get("/api/v1/options/chain?symbol=NIFTY&strike_range=10")
    assert r_chain.status_code == 200
    assert r_chain.json()["symbol"] == "NIFTY"

    # Strategy payoff
    r_strat = client.get("/api/v1/options/strategy-payoff?strategy=IRON_CONDOR")
    assert r_strat.status_code == 200
    assert r_strat.json()["strategy"] == "IRON_CONDOR"

    # Chart candles
    r_chart = client.get("/api/v1/chart/candles?symbol=NIFTY&timeframe=15m")
    assert r_chart.status_code == 200
    assert len(r_chart.json()["candles"]) > 0

    # Chart CSV export
    r_csv = client.get("/api/v1/chart/export/csv?symbol=NIFTY&timeframe=15m")
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers["content-type"]
