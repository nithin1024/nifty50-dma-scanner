import pytest
from app.services.crossover_service import crossover_engine


def test_fresh_crossover_from_below():
    """Verify fresh crossover when previous close < previous SMA and latest close > latest SMA."""
    # Build 201 prices where prices were around 100, then dropped, then crossed
    # Period 5:
    # Day -2: close 90 (below SMA)
    # Day -1: close 110 (above SMA)
    closes = [100.0] * 199 + [90.0, 110.0]
    dates = [f"2026-01-{i:02d}" for i in range(1, 202)]

    crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)
    periods_crossed = [c["period"] for c in crossovers]
    assert 5 in periods_crossed
    xo_5 = next(c for c in crossovers if c["period"] == 5)
    assert xo_5["previous_close"] == 90.0
    assert xo_5["latest_close"] == 110.0
    assert xo_5["is_fresh"] is True


def test_fresh_crossover_from_equality():
    """Rule: Previous close == previous SMA and latest close > latest SMA is a fresh crossover."""
    # 5-day SMA window ending at prev day: [100, 100, 100, 100, 100] -> SMA5 = 100.0
    # prev close is 100.0 (equal to SMA5)
    # latest close is 105.0 -> SMA5 becomes (100+100+100+100+105)/5 = 101.0 -> 105 > 101.0 -> Crossover!
    closes = [100.0] * 5 + [105.0]
    dates = [f"2026-02-{i:02d}" for i in range(1, 7)]

    crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)
    periods_crossed = [c["period"] for c in crossovers]
    assert 5 in periods_crossed


def test_no_crossover_when_already_above():
    """Rule: Do not confuse a stock simply remaining above an SMA with a fresh crossover."""
    # Prices always at 120.0, SMA5 = 120.0, then day -2 = 130, day -1 = 135
    # Both prev and latest are above SMA -> NOT a fresh crossover!
    closes = [100.0] * 5 + [130.0, 135.0]
    dates = [f"2026-03-{i:02d}" for i in range(1, 8)]

    crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)
    # Day -2 close (130) was already above SMA (~106), so Day -1 (135) is NOT a fresh crossover
    assert 5 not in [c["period"] for c in crossovers]


def test_intraday_crossing_labeled_provisional():
    """Verify intraday crossings are explicitly labeled PROVISIONAL."""
    completed_closes = [100.0] * 10
    # SMA5 = 100.0, last close = 100.0. Live price = 105.0
    crossings = crossover_engine.detect_intraday_provisional_crossing(105.0, completed_closes)
    assert len(crossings) > 0
    assert crossings[0]["type"] == "PROVISIONAL_INTRADAY_CROSSING"
    assert "Provisional" in crossings[0]["notes"]
