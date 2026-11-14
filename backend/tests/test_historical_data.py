import pytest
from app.services.historical_data_service import historical_data_service


def test_candle_validation_rules():
    """Verify strict OHLC mathematical sanity checks."""
    # Valid candle
    valid, err = historical_data_service.validate_candle({
        "open": 100.0,
        "high": 105.0,
        "low": 98.0,
        "close": 102.0
    })
    assert valid is True
    assert err is None

    # Invalid: High < Low
    invalid_1, err_1 = historical_data_service.validate_candle({
        "open": 100.0,
        "high": 95.0,
        "low": 98.0,
        "close": 96.0
    })
    assert invalid_1 is False
    assert "High (95.0) < Low (98.0)" in err_1

    # Invalid: High < Close
    invalid_2, err_2 = historical_data_service.validate_candle({
        "open": 100.0,
        "high": 101.0,
        "low": 98.0,
        "close": 104.0
    })
    assert invalid_2 is False

    # Invalid: Negative price
    invalid_3, err_3 = historical_data_service.validate_candle({
        "open": -10.0,
        "high": 10.0,
        "low": -15.0,
        "close": 5.0
    })
    assert invalid_3 is False


@pytest.mark.asyncio
async def test_fetch_reliance_history():
    """Verify fetching authentic historical records with >= 220 sessions."""
    res = await historical_data_service.fetch_symbol_history("RELIANCE")
    assert res["symbol"] == "RELIANCE"
    assert res["quality_status"] == "VERIFIED"
    assert res["total_sessions"] >= 220
    assert len(res["candles"]) >= 220
    assert res["price_adjustment"] == "UNADJUSTED_CLOSE"

    # Verify chronological ascending order
    dates = [c["trading_date"] for c in res["candles"]]
    assert dates == sorted(dates), "Candles are not sorted chronologically ascending"


def test_verification_log_and_min_sessions():
    """Verify source-level verification records and 220-session minimum."""
    vlog = historical_data_service.get_verification_log()
    assert vlog is not None, "Verification log was not created"
    assert vlog["min_required_sessions"] == 220
    assert vlog["total_constituents"] == 50
    assert vlog["verified_count"] == 50
    for record in vlog["records"]:
        assert record["status"] == "VERIFIED"
        assert record["sessions"] >= 220
        assert record["price_adjustment"] == "UNADJUSTED_CLOSE"
        assert record["provider"] == "YAHOO_FINANCE_NSE"
