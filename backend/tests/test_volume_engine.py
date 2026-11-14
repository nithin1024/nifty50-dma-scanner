import pytest
from app.services.volume_service import volume_engine


def test_six_session_average():
    """Verify formula: (V1 + V2 + V3 + V4 + V5 + V6) / 6."""
    volumes = [100, 200, 300, 400, 500, 600]
    expected_avg = (100 + 200 + 300 + 400 + 500 + 600) / 6.0  # 2100 / 6 = 350.0
    avg = volume_engine.calculate_six_session_average(volumes)
    assert avg == expected_avg
    assert avg == 350.0

    # Insufficient volumes (< 6)
    assert volume_engine.calculate_six_session_average([100, 200]) is None


def test_completed_session_rvol():
    """Verify formula: Latest Completed Volume / 5-Session Average Volume."""
    # V1..V5 = 100 each -> average = 100
    # V6 = 250 -> RVOL = 250 / 100 = 2.5
    volumes = [100, 100, 100, 100, 100, 250]
    rvol = volume_engine.calculate_completed_session_rvol(volumes)
    assert rvol == 2.5

    # V6 = 50 -> RVOL = 50 / 100 = 0.5
    volumes_low = [100, 100, 100, 100, 100, 50]
    rvol_low = volume_engine.calculate_completed_session_rvol(volumes_low)
    assert rvol_low == 0.5


def test_volume_change_percentage():
    """Verify formula: ((Latest Volume - Average Volume) / Average Volume) * 100."""
    # Latest = 150, Avg = 100 -> +50.0%
    chg = volume_engine.calculate_volume_change_percentage(150, 100.0)
    assert chg == 50.0

    # Latest = 80, Avg = 100 -> -20.0%
    chg_neg = volume_engine.calculate_volume_change_percentage(80, 100.0)
    assert chg_neg == -20.0


def test_volume_trend_and_classification():
    """Verify trajectory and standard volume classifications."""
    # Increasing
    assert volume_engine.classify_volume_trend([100, 200, 300]) == "INCREASING"
    # Decreasing
    assert volume_engine.classify_volume_trend([300, 200, 100]) == "DECREASING"
    # Steady
    assert volume_engine.classify_volume_trend([200, 150, 220]) == "STEADY"

    # Classifications
    assert volume_engine.get_volume_classification(2.2, 60.0) == "VERY_HIGH_VOLUME"
    assert volume_engine.get_volume_classification(1.4, 25.0) == "HIGH_VOLUME"
    assert volume_engine.get_volume_classification(1.0, 0.0) == "NORMAL_VOLUME"
    assert volume_engine.get_volume_classification(0.6, -30.0) == "LOW_VOLUME"
    assert volume_engine.get_volume_classification(0.4, -60.0) == "DECLINING_VOLUME"


def test_price_volume_confirmation():
    """Verify institutional price-volume confirmation rules."""
    # Price Up + High Volume = Bullish Expansion
    bullish = volume_engine.evaluate_price_volume_confirmation(2.5, 1.5)
    assert bullish["signal"] == "BULLISH_EXPANSION"

    # Price Up + Low Volume = Weak Rally
    weak = volume_engine.evaluate_price_volume_confirmation(2.5, 0.6)
    assert weak["signal"] == "WEAK_RALLY"

    # Price Down + High Volume = Distribution
    bearish = volume_engine.evaluate_price_volume_confirmation(-3.0, 1.6)
    assert bearish["signal"] == "BEARISH_DISTRIBUTION"

    # Price Down + Low Volume = Orderly Pullback
    pullback = volume_engine.evaluate_price_volume_confirmation(-1.5, 0.5)
    assert pullback["signal"] == "ORDERLY_PULLBACK"
