import pytest
from app.services.heavyweight_service import heavyweight_engine
from app.services.constituents_service import TOP_7_HEAVYWEIGHT_SYMBOLS


@pytest.mark.asyncio
async def test_top_7_heavyweights_report():
    """Verify aggregation of all 7 designated heavyweights with full metrics."""
    report = await heavyweight_engine.get_all_heavyweights_report()
    assert report["heavyweight_count"] == 7
    symbols_in_report = [hw["symbol"] for hw in report["heavyweights"]]
    assert set(symbols_in_report) == set(TOP_7_HEAVYWEIGHT_SYMBOLS)

    # Combined weightage check
    assert report["combined_weightage_pct"] > 40.0

    # Impact metrics check
    assert "combined_estimated_contribution_pts" in report
    assert "concentration_analysis" in report

    for hw in report["heavyweights"]:
        assert "market_data" in hw
        assert "six_session_history" in hw
        assert len(hw["six_session_history"]) == 6
        assert "volume_analytics" in hw
        assert "technical_analytics" in hw
        assert "weightage_impact" in hw

        # Verify contribution formula: weightage * price_change_pct / 100
        w = hw["weightage"]
        chg = hw["market_data"]["price_change_pct"]
        expected_contrib = round((w * chg) / 100.0, 4)
        actual_contrib = hw["weightage_impact"]["approx_index_contribution_pts"]
        assert actual_contrib == expected_contrib


@pytest.mark.asyncio
async def test_individual_heavyweight_details():
    """Verify detailed lookup for individual heavyweight."""
    reliance = await heavyweight_engine.get_heavyweight_details("RELIANCE")
    assert reliance is not None
    assert reliance["symbol"] == "RELIANCE"
    assert reliance["weightage"] > 7.0
    assert len(reliance["six_session_history"]) == 6

    # Technical analytics presence
    smas = reliance["technical_analytics"]["smas"]
    for p in [5, 10, 20, 50, 100, 200]:
        assert f"dma{p}" in smas and smas[f"dma{p}"] is not None

    # Invalid symbol lookup should return None
    invalid = await heavyweight_engine.get_heavyweight_details("INVALID_SYM")
    assert invalid is None
