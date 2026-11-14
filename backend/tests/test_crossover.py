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


def test_alignment_transitions():
    """Verify detection of alignment transitions (5/6 to 6/6, maintaining 6/6, etc.)."""
    # 205 prices strictly ascending -> both sessions 6/6
    ascending_closes = [100.0 + (i * 0.5) for i in range(205)]
    transition = crossover_engine.detect_alignment_transition(ascending_closes)
    assert transition["transition_type"] == "MAINTAINED_6_6"
    assert transition["prev_score"] == 6
    assert transition["current_score"] == 6

    # 205 prices strictly descending -> weakening
    descending_closes = [200.0 - (i * 0.5) for i in range(205)]
    transition_down = crossover_engine.detect_alignment_transition(descending_closes)
    assert transition_down["current_score"] == 0
    assert transition_down["transition_type"] in ["WEAKENING", "LOST_BULLISH_ALIGNMENT", "STABLE"]


def test_approaching_crossovers():
    """Verify detection of stocks within 1.0% of an uncrossed DMA."""
    # Build 205 prices where price is just 0.5% below 5 DMA
    # SMA5 will be ~100.0, current close = 99.6 (0.4% below)
    closes = [100.0] * 200 + [100.0, 100.0, 100.0, 100.0, 99.6]
    approaching = crossover_engine.detect_approaching_crossovers(closes, proximity_pct=1.0)
    assert len(approaching) > 0
    periods = [a["period"] for a in approaching]
    assert 5 in periods
    match = next(a for a in approaching if a["period"] == 5)
    assert match["distance_to_dma_pct"] <= 1.0
    assert match["status"] == "APPROACHING_BREAKOUT"
