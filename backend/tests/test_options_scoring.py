import pytest
from app.services.options_analytics_engine import (
    classify_option_pattern_and_score,
    get_market_view,
    options_analytics_engine
)


def test_mandatory_scoring_cases():
    """
    Verify the 5 mandatory scoring cases from master prompt:
    1. CE LB (+2) + PE SB (+2) = +4 -> Strong Bullish
    2. CE SB (-2) + PE SC (-2) = -4 -> Strong Bearish
    3. CE LW (-1) + PE LW (+1) = 0 -> Sideways / Confusion
    4. CE SC (+2) + PE LB (-2) = 0 -> Sideways / Confusion
    5. CE LB (+2) + PE LB (-2) = 0 -> Sideways / Confusion
    """
    # 1. CE LB (Price UP, OI UP) + PE SB (Price DOWN, OI UP)
    ce1_name, ce1_code, ce1_score = classify_option_pattern_and_score(price_change=10.0, oi_change=5000.0, is_call=True)
    pe1_name, pe1_code, pe1_score = classify_option_pattern_and_score(price_change=-10.0, oi_change=5000.0, is_call=False)
    assert (ce1_code, ce1_score) == ("LB", 2)
    assert (pe1_code, pe1_score) == ("SB", 2)
    total1 = ce1_score + pe1_score
    assert total1 == 4
    assert get_market_view(total1) == "Strong Bullish"

    # 2. CE SB (Price DOWN, OI UP) + PE SC (Price UP, OI DOWN)
    ce2_name, ce2_code, ce2_score = classify_option_pattern_and_score(price_change=-10.0, oi_change=5000.0, is_call=True)
    pe2_name, pe2_code, pe2_score = classify_option_pattern_and_score(price_change=10.0, oi_change=-5000.0, is_call=False)
    assert (ce2_code, ce2_score) == ("SB", -2)
    assert (pe2_code, pe2_score) == ("SC", -2)
    total2 = ce2_score + pe2_score
    assert total2 == -4
    assert get_market_view(total2) == "Strong Bearish"

    # 3. CE LW (Price DOWN, OI DOWN) + PE LW (Price DOWN, OI DOWN)
    ce3_name, ce3_code, ce3_score = classify_option_pattern_and_score(price_change=-10.0, oi_change=-5000.0, is_call=True)
    pe3_name, pe3_code, pe3_score = classify_option_pattern_and_score(price_change=-10.0, oi_change=-5000.0, is_call=False)
    assert (ce3_code, ce3_score) == ("LW", -1)
    assert (pe3_code, pe3_score) == ("LW", 1)
    total3 = ce3_score + pe3_score
    assert total3 == 0
    assert get_market_view(total3) == "Sideways / Confusion"

    # 4. CE SC (Price UP, OI DOWN) + PE LB (Price UP, OI UP)
    ce4_name, ce4_code, ce4_score = classify_option_pattern_and_score(price_change=10.0, oi_change=-5000.0, is_call=True)
    pe4_name, pe4_code, pe4_score = classify_option_pattern_and_score(price_change=10.0, oi_change=5000.0, is_call=False)
    assert (ce4_code, ce4_score) == ("SC", 2)
    assert (pe4_code, pe4_score) == ("LB", -2)
    total4 = ce4_score + pe4_score
    assert total4 == 0
    assert get_market_view(total4) == "Sideways / Confusion"

    # 5. CE LB (Price UP, OI UP) + PE LB (Price UP, OI UP)
    ce5_name, ce5_code, ce5_score = classify_option_pattern_and_score(price_change=10.0, oi_change=5000.0, is_call=True)
    pe5_name, pe5_code, pe5_score = classify_option_pattern_and_score(price_change=10.0, oi_change=5000.0, is_call=False)
    assert (ce5_code, ce5_score) == ("LB", 2)
    assert (pe5_code, pe5_score) == ("LB", -2)
    total5 = ce5_score + pe5_score
    assert total5 == 0
    assert get_market_view(total5) == "Sideways / Confusion"


def test_option_chain_quant_score_fields():
    """Verify that every row in generated option chain contains required 20-column scoring fields."""
    chain = options_analytics_engine.get_option_chain("NIFTY", strike_range=5)
    rows = chain["rows"]
    assert len(rows) > 0
    for r in rows:
        assert "quant_score" in r
        assert "total_score" in r
        assert -4 <= r["quant_score"] <= 4
        assert r["market_view"] in [
            "Strong Bullish", "Bullish", "Sideways / Confusion", "Bearish", "Strong Bearish"
        ]
        assert r["ce_pattern_code"] in ["LB", "SC", "LW", "SB"]
        assert r["ce_score"] in [2, -1, -2]
        assert r["pe_pattern_code"] in ["SB", "LW", "LB", "SC"]
        assert r["pe_score"] in [2, 1, -2]
