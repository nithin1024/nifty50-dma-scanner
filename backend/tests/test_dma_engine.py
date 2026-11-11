import pytest
from app.services.dma_service import dma_engine, DMA_PERIODS


def test_sma_manual_calculations():
    """Validate SMA formula against manually calculated test datasets."""
    # 5 numbers: [10, 20, 30, 40, 50] -> sum = 150, SMA5 = 30.0
    prices = [10.0, 20.0, 30.0, 40.0, 50.0]
    sma5 = dma_engine.calculate_sma(prices, 5)
    assert sma5 == 30.0

    # 10 numbers: 1 to 10 -> sum = 55, SMA10 = 5.5
    prices_10 = [float(i) for i in range(1, 11)]
    sma10 = dma_engine.calculate_sma(prices_10, 10)
    assert sma10 == 5.5

    # Insufficient history test: 4 numbers for period 5
    assert dma_engine.calculate_sma([10.0, 20.0, 30.0, 40.0], 5) is None


def test_200_dma_and_all_periods():
    """Test generating 200 numbers where all 6 DMAs are calculated."""
    # 200 numbers with price = 100.0 everywhere
    prices = [100.0] * 200
    smas = dma_engine.calculate_all_smas(prices)
    for p in DMA_PERIODS:
        assert smas[f"dma{p}"] == 100.0

    # Only 199 numbers -> 200 DMA must be None
    prices_199 = [100.0] * 199
    smas_199 = dma_engine.calculate_all_smas(prices_199)
    assert smas_199["dma200"] is None
    assert smas_199["dma100"] == 100.0


def test_percentage_distance():
    """Verify formula: ((Price - SMA) / SMA) * 100."""
    # Price = 110, SMA = 100 -> +10.0%
    dist_plus = dma_engine.calculate_percentage_distance(110.0, 100.0)
    assert dist_plus == 10.0

    # Price = 90, SMA = 100 -> -10.0%
    dist_minus = dma_engine.calculate_percentage_distance(90.0, 100.0)
    assert dist_minus == -10.0

    # Price = 100, SMA = 100 -> 0.0%
    assert dma_engine.calculate_percentage_distance(100.0, 100.0) == 0.0


def test_6_of_6_bullish_classification():
    """Verify stock is 6/6 when price is strictly greater than all 6 SMAs."""
    smas = {
        "dma5": 100.0,
        "dma10": 102.0,
        "dma20": 104.0,
        "dma50": 106.0,
        "dma100": 108.0,
        "dma200": 110.0
    }
    # Price = 115 > all SMAs
    res = dma_engine.classify_stock(115.0, smas)
    assert res["score"] == 6
    assert res["is_6_6"] is True
    assert res["is_5_6"] is False
    assert res["classification"] == "BULLISH_6_6"


def test_exactly_5_of_6_bullish_classification():
    """Verify stock is 5/6 when price is strictly greater than exactly 5 SMAs."""
    smas = {
        "dma5": 100.0,
        "dma10": 102.0,
        "dma20": 104.0,
        "dma50": 106.0,
        "dma100": 108.0,
        "dma200": 120.0  # Above price
    }
    # Price = 110.0 -> above 5, 10, 20, 50, 100, but below 200
    res = dma_engine.classify_stock(110.0, smas)
    assert res["score"] == 5
    assert res["is_6_6"] is False
    assert res["is_5_6"] is True
    assert res["classification"] == "BULLISH_5_6"
    assert res["comparisons"]["above_dma200"] is False
    assert res["comparisons"]["above_dma100"] is True


def test_equality_does_not_count_as_above():
    """Rule: If price equals an SMA, it is NOT counted as above that SMA."""
    smas = {
        "dma5": 100.0,
        "dma10": 100.0,  # Equal
        "dma20": 90.0,
        "dma50": 90.0,
        "dma100": 90.0,
        "dma200": 90.0
    }
    # Price = 100.0: equal to dma5 and dma10 -> only above 4 SMAs (score 4)
    res = dma_engine.classify_stock(100.0, smas)
    assert res["comparisons"]["above_dma5"] is False
    assert res["comparisons"]["above_dma10"] is False
    assert res["score"] == 4
    assert res["is_6_6"] is False
    assert res["is_5_6"] is False


def test_4_of_6_exclusion():
    """4/6 or lower must not be classified as bullish."""
    smas = {f"dma{p}": 100.0 for p in DMA_PERIODS}
    # Price = 90 -> 0/6
    res_0 = dma_engine.classify_stock(90.0, smas)
    assert res_0["score"] == 0
    assert res_0["classification"] == "NEUTRAL_OR_BEARISH"


def test_insufficient_history_classification():
    """Missing 200 DMA must return INSUFFICIENT_HISTORY, never treated as 0/6."""
    smas = {
        "dma5": 100.0,
        "dma10": 100.0,
        "dma20": 100.0,
        "dma50": 100.0,
        "dma100": 100.0,
        "dma200": None
    }
    res = dma_engine.classify_stock(120.0, smas)
    assert res["classification"] == "INSUFFICIENT_HISTORY"
    assert res["is_6_6"] is False
    assert res["is_5_6"] is False


def test_rolling_smas():
    """Verify rolling SMA vector computation."""
    closes = [10.0] * 300
    rolling = dma_engine.compute_rolling_smas(closes)
    assert len(rolling["dma5"]) == 300
    assert rolling["dma5"][3] is None
    assert rolling["dma5"][4] == 10.0
    assert rolling["dma200"][198] is None
    assert rolling["dma200"][199] == 10.0
    assert rolling["dma200"][299] == 10.0
