import pytest
from datetime import datetime, time, timedelta, timezone
from app.services.historical_data_service import historical_data_service
from app.services import upstox_market_client


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
async def test_fetch_reliance_history(monkeypatch, tmp_path):
    """Verify official Upstox candle arrays normalize into verified daily history."""
    days = []
    day = datetime.now().date() - timedelta(days=400)
    while len(days) < 250:
        if day.weekday() < 5:
            days.append(day)
        day += timedelta(days=1)
    rows = [[datetime.combine(d, time.min, timezone.utc).isoformat(), 100.0, 105.0, 98.0,
             102.0 + (i * 0.01), 100000 + i, None] for i, d in enumerate(days)]
    monkeypatch.setattr(upstox_market_client, "instrument_key_for_symbol", lambda _: "NSE_EQ|RELIANCE")

    async def fake_historical(key, unit, interval, to_date, from_date):
        assert key == "NSE_EQ|RELIANCE"
        assert (unit, interval) == ("days", "1")
        return list(reversed(rows))

    monkeypatch.setattr(upstox_market_client, "get_historical_candles_v3", fake_historical)
    monkeypatch.setattr(historical_data_service, "_get_cache_paths", lambda _: [tmp_path / "RELIANCE.json"])
    res = await historical_data_service.fetch_symbol_history("RELIANCE", force_refresh=True)
    assert res["symbol"] == "RELIANCE"
    assert res["quality_status"] == "VERIFIED"
    assert res["total_sessions"] >= 220
    assert len(res["candles"]) >= 220
    assert res["provider"] == "UPSTOX_HISTORICAL_CANDLE_V3"
    assert res["price_adjustment"] == "UPSTOX_EXCHANGE_CANDLES"

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
        assert record["price_adjustment"] in ("UNADJUSTED_CLOSE", "UPSTOX_EXCHANGE_CANDLES")
        assert record["provider"] in ("YAHOO_FINANCE_NSE", "UPSTOX_HISTORICAL_CANDLE_V3")


def test_multi_year_history_never_pads_missing_candles(monkeypatch, tmp_path):
    candles = [{"trading_date": f"2026-01-{day:02d}", "open": 100, "high": 101,
                "low": 99, "close": 100, "volume": 1000} for day in range(1, 11)]
    monkeypatch.setattr(historical_data_service, "_get_cache_paths", lambda _: [tmp_path / "short.json"])
    import json
    (tmp_path / "short.json").write_text(json.dumps({"provider": "UPSTOX_HISTORICAL_CANDLE_V3", "candles": candles}))
    assert historical_data_service.get_multi_year_candles("SHORT", years=5) == candles
