import pytest
from app.services.signal_service import signal_engine


def test_strong_bullish_signal():
    """Verify 6/6 + price up + RVOL >= 1.0 yields STRONG_BULLISH."""
    sig = signal_engine.classify_combined_signal(
        score=6,
        is_6_6=True,
        is_5_6=False,
        price_change_pct=1.5,
        rvol=1.4,
        fresh_crossovers=[],
        transition_type="MAINTAINED_6_6",
        status="VERIFIED"
    )
    assert sig["signal"] == "STRONG_BULLISH"
    assert sig["confidence"] == "VERY_HIGH"


def test_bullish_watchlist_signal():
    """Verify 5/6 alignment yields BULLISH_WATCHLIST."""
    sig = signal_engine.classify_combined_signal(
        score=5,
        is_6_6=False,
        is_5_6=True,
        price_change_pct=0.8,
        rvol=1.1,
        fresh_crossovers=[],
        transition_type="STABLE",
        status="VERIFIED"
    )
    assert sig["signal"] == "BULLISH_WATCHLIST"


def test_fresh_breakout_signal():
    """Verify fresh crossover + supporting volume expansion yields FRESH_BREAKOUT."""
    crossovers = [{
        "period": 50,
        "label": "50 DMA",
        "latest_close": 500.0,
        "latest_sma": 495.0
    }]
    sig = signal_engine.classify_combined_signal(
        score=4,
        is_6_6=False,
        is_5_6=False,
        price_change_pct=1.2,
        rvol=1.3,
        fresh_crossovers=crossovers,
        transition_type="IMPROVING",
        status="VERIFIED"
    )
    assert sig["signal"] == "FRESH_BREAKOUT"


def test_weakening_signal():
    """Verify falling alignment yields WEAKENING."""
    sig = signal_engine.classify_combined_signal(
        score=4,
        is_6_6=False,
        is_5_6=False,
        price_change_pct=-1.5,
        rvol=0.7,
        fresh_crossovers=[],
        transition_type="DOWNGRADED_6_TO_5",
        status="VERIFIED"
    )
    assert sig["signal"] == "WEAKENING"


def test_no_bullish_signal_from_volume_alone():
    """Rule: Never generate a bullish signal from volume alone without DMA confirmation."""
    # Massive volume (RVOL = 5.0), but poor DMA alignment (score = 2/6)
    sig = signal_engine.classify_combined_signal(
        score=2,
        is_6_6=False,
        is_5_6=False,
        price_change_pct=3.0,
        rvol=5.0,
        fresh_crossovers=[],
        transition_type="STABLE",
        status="VERIFIED"
    )
    assert sig["signal"] != "STRONG_BULLISH"
    assert sig["signal"] != "BULLISH_WATCHLIST"
    assert sig["signal"] != "FRESH_BREAKOUT"
    assert sig["signal"] == "NO_CONFIRMED_SIGNAL"
