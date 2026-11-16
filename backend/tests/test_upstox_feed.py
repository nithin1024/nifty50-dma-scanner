import pytest
from types import SimpleNamespace
from datetime import datetime, timezone

from app.api.routes.options import get_option_chain, get_technical_support_resistance
from app.api.routes.chart import get_chart_candles
from app.proto import MarketDataFeed_pb2 as proto
from app.services.upstox_feed_service import SubscriptionManager, build_market_data_event, decode_feed, subscription_manager
from app.services import upstox_market_client as upstox


def test_official_v3_protobuf_full_feed_decodes_without_schema_guessing():
    response = proto.FeedResponse(type=proto.live_feed, currentTs=1_700_000_000_000)
    feed = response.feeds["NSE_FO|123"]
    full = feed.fullFeed.marketFF
    full.ltpc.ltp = 101.25
    full.ltpc.ltt = 1_700_000_000_000
    full.ltpc.ltq = 25
    full.ltpc.cp = 99.75
    full.vtt = 3400
    full.oi = 8700
    full.iv = 0.18
    full.optionGreeks.delta = 0.51
    full.marketLevel.bidAskQuote.add(bidQ=12, bidP=101.2, askQ=14, askP=101.3)
    decoded = decode_feed(response.SerializeToString())
    tick = decoded["ticks"]["NSE_FO|123"]
    assert decoded["type"] == "live_feed"
    assert tick["ltp"] == 101.25
    assert tick["volume"] == 3400
    assert tick["oi"] == 8700
    assert tick["greeks"]["delta"] == 0.51
    assert tick["market_depth"][0] == {
        "bid_quantity": 12, "bid_price": 101.2, "ask_quantity": 14, "ask_price": 101.3
    }


@pytest.mark.asyncio
async def test_full_subscription_manager_obeys_combined_feed_limit():
    manager = SubscriptionManager()
    await manager.set_subscriptions([f"NSE_EQ|{i}" for i in range(1502)])
    assert len(manager.active) == 1500
    assert len(manager.waiting) == 2
    assert manager.get_status()["status"] == "DISCONNECTED"


def test_feed_manager_deduplicates_orders_and_calculates_volume_deltas():
    manager = SubscriptionManager()
    timestamp = 1_700_000_000_000
    tick = {"current_ts": timestamp, "last_trade_time": timestamp, "volume": 100,
            "ltp": 10.0, "received_at": "2023-11-14T22:13:20+00:00"}
    first = manager._accept_tick("NSE_EQ|1", tick)
    assert first["incremental_volume"] == 0  # Establish VTT baseline; never add the whole session volume.
    assert manager._accept_tick("NSE_EQ|1", tick) is None

    next_tick = {**tick, "current_ts": timestamp + 1000, "last_trade_time": timestamp + 1000,
                 "volume": 106, "received_at": "2023-11-14T22:13:21+00:00"}
    next_accepted = manager._accept_tick("NSE_EQ|1", next_tick)
    assert next_accepted["incremental_volume"] == 6

    out_of_order = {**next_tick, "current_ts": timestamp - 1000, "volume": 200}
    assert manager._accept_tick("NSE_EQ|1", out_of_order) is None

    reset = {**next_tick, "current_ts": timestamp + 2000, "last_trade_time": timestamp + 2000,
             "volume": 2, "received_at": "2023-11-14T22:13:22+00:00"}
    reset_accepted = manager._accept_tick("NSE_EQ|1", reset)
    assert reset_accepted["incremental_volume"] == 0
    assert reset_accepted["volume_counter_reset"] is True


def test_registered_option_contracts_reselect_atm_strikes_from_new_spot_ticks():
    manager = SubscriptionManager()
    contracts = [
        {"instrument_key": f"NSE_FO|ABC{expiry}{strike}{side}", "expiry": expiry,
         "instrument_type": side, "strike_price": strike}
        for expiry in ("2026-11-26", "2026-12-31")
        for strike in range(80, 380, 10)
        for side in ("CE", "PE")
    ]
    manager.register_option_contracts("ABC", contracts)
    expiry, first_strikes, first_keys = manager.select_stock_option_contracts("ABC", 101)
    manager.record_stock_option_selection("ABC", first_keys)
    next_expiry, next_strikes, next_keys = manager.select_stock_option_contracts("ABC", 350)

    assert expiry == next_expiry == "2026-11-26"
    assert first_strikes != next_strikes
    assert set(first_keys) != set(next_keys)
    assert len(first_strikes) == len(next_strikes) == 21
    assert manager.stock_option_feed_key_count == len(first_keys)


def test_frontend_relay_preserves_application_event_and_provider_feed_types():
    event = build_market_data_event(
        {"type": "live_feed", "current_ts": 123}, {"NSE_INDEX|Nifty 50": {"ltp": 100}}
    )
    assert event["type"] == "market_data"
    assert event["feed_type"] == "live_feed"
    assert event["is_live_update"] is True
    assert "NSE_INDEX|Nifty 50" in event["ticks"]


@pytest.mark.asyncio
async def test_waiting_options_rotate_without_exceeding_full_limit(monkeypatch):
    import app.services.upstox_feed_service as feed_service

    manager = SubscriptionManager()
    manager.active["NSE_FO|OLD"] = "full"
    manager.waiting["NSE_FO|NEW"] = "full"
    manager.instrument_metadata["NSE_FO|OLD"] = {"underlying": "ABC", "option_type": "CE"}
    manager.instrument_metadata["NSE_FO|NEW"] = {"underlying": "ABC", "option_type": "PE"}
    monkeypatch.setattr(feed_service, "get_settings", lambda: SimpleNamespace(
        UPSTOX_MAX_FULL_SUBSCRIPTIONS=1,
        UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS=1,
        UPSTOX_MAX_COMBINED_SUBSCRIPTIONS=1,
    ))

    rotated = await manager.rotate_waiting_subscriptions(batch_size=1)
    assert rotated == 1
    assert list(manager.active) == ["NSE_FO|NEW"]
    assert list(manager.waiting) == ["NSE_FO|OLD"]


@pytest.mark.asyncio
async def test_stock_option_universe_uses_contracts_and_live_spot_without_chain_n_plus_one(monkeypatch):
    import app.api.routes.options as options_route

    manager = options_route.subscription_manager
    monkeypatch.setattr(manager, "universe_cache", None)
    monkeypatch.setattr(manager, "universe_cache_at", None)
    monkeypatch.setattr(manager, "universe_refresh_lock", __import__("asyncio").Lock())
    monkeypatch.setattr(manager, "instrument_metadata", {})
    monkeypatch.setattr(manager, "latest_ticks", {
        "NSE_EQ|ABC": {"ltp": 105.0, "feed_type": "live_feed",
                       "received_at": datetime.now(timezone.utc).isoformat(),
                       "exchange_timestamp": "2026-11-16T05:00:00+00:00"},
        "NSE_EQ|XYZ": {"ltp": 210.0, "feed_type": "initial_feed",
                       "received_at": datetime.now(timezone.utc).isoformat(),
                       "exchange_timestamp": "2026-11-16T05:00:00+00:00"},
    })
    monkeypatch.setattr(manager, "stock_option_contract_count", 0)
    monkeypatch.setattr(manager, "stock_option_feed_key_count", 0)
    monkeypatch.setattr(manager, "stock_option_selections", {})
    monkeypatch.setattr(manager, "failed_option_underlyings", 0)
    constituents = [
        {"symbol": "ABC", "company_name": "ABC Ltd", "upstox_instrument_key": "NSE_EQ|ABC"},
        {"symbol": "XYZ", "company_name": "XYZ Ltd", "upstox_instrument_key": "NSE_EQ|XYZ"},
    ]
    calls = []
    subscriptions = []
    contracts_by_key = {
        "NSE_EQ|ABC": [
            {"instrument_key": f"NSE_FO|ABC{strike}{side}", "expiry": "2026-11-26",
             "instrument_type": side, "strike_price": strike}
            for strike in (95, 100, 105, 110, 115) for side in ("CE", "PE")
        ],
        "NSE_EQ|XYZ": [
            {"instrument_key": f"NSE_FO|XYZ{strike}{side}", "expiry": "2026-11-26",
             "instrument_type": side, "strike_price": strike}
            for strike in (200, 205, 210, 215, 220) for side in ("CE", "PE")
        ],
    }

    async def profile():
        return {"authenticated": True}

    async def configure_nifty():
        return None

    async def get_contracts(key):
        calls.append(key)
        return contracts_by_key[key]

    async def set_subscriptions(keys, mode="full"):
        subscriptions.extend(keys)

    async def fail_if_chain_requested(*_args, **_kwargs):
        raise AssertionError("universe discovery must not call Option Chain once per stock")

    monkeypatch.setattr(options_route.upstox, "get_user_profile", profile)
    monkeypatch.setattr(options_route.upstox, "get_option_contracts", get_contracts)
    monkeypatch.setattr(options_route.upstox, "get_option_chain", fail_if_chain_requested)
    monkeypatch.setattr(options_route.constituents_service, "fetch_from_nse", lambda: _async_value(constituents))
    monkeypatch.setattr(manager, "configure_nifty", configure_nifty)
    monkeypatch.setattr(manager, "start", lambda: None)
    monkeypatch.setattr(manager, "set_subscriptions", set_subscriptions)

    result = await options_route.get_fo_universe()
    stock_rows = [row for row in result["universe"] if row["symbol"] != "NIFTY"]
    assert calls == ["NSE_EQ|ABC", "NSE_EQ|XYZ"]
    assert all(row["selection_status"] == "SELECTED" for row in stock_rows)
    assert all(row["selected_strike_count"] == 5 for row in stock_rows)
    assert len(subscriptions) == 20
    assert result["subscription_monitor"]["tracked_stock_option_contracts"] == 20


async def _async_value(value):
    return value


@pytest.mark.asyncio
async def test_option_chain_uses_official_response_fields(monkeypatch):
    async def contracts(_key):
        return [{"expiry": "2026-11-20", "lot_size": 65}]

    async def chain(_key, _expiry):
        return [
            {"expiry": "2026-11-20", "strike_price": 100, "underlying_key": "NSE_INDEX|Nifty 50",
             "underlying_spot_price": 101, "call_options": {
                 "instrument_key": "NSE_FO|CE100", "market_data": {"ltp": 4, "close_price": 3,
                 "volume": 20, "oi": 120, "prev_oi": 100, "bid_price": 3.9, "ask_price": 4.1},
                 "option_greeks": {"delta": 0.6, "iv": 20}}, "put_options": {
                 "instrument_key": "NSE_FO|PE100", "market_data": {"ltp": 3, "close_price": 3,
                 "volume": 10, "oi": 80, "prev_oi": 100}, "option_greeks": {"delta": -0.4}}},
            {"expiry": "2026-11-20", "strike_price": 105, "underlying_key": "NSE_INDEX|Nifty 50",
             "underlying_spot_price": 101, "call_options": {"instrument_key": "NSE_FO|CE105",
                 "market_data": {"ltp": 1, "close_price": 1, "volume": 5, "oi": 50, "prev_oi": 45}},
             "put_options": {"instrument_key": "NSE_FO|PE105",
                 "market_data": {"ltp": 5, "close_price": 4, "volume": 15, "oi": 90, "prev_oi": 70}}},
        ]

    monkeypatch.setattr(upstox, "get_option_contracts", contracts)
    monkeypatch.setattr(upstox, "get_option_chain", chain)
    result = await get_option_chain(symbol="NIFTY", strike_range=5, expiry="2026-11-20")
    assert result["source"] == "/v2/option/chain"
    assert result["spot_price"] == 101
    assert result["totals"]["total_call_oi"] == 170
    assert result["totals"]["total_put_oi"] == 170
    assert result["rows"][0]["ce"]["oi_change"] == 20
    assert result["rows"][0]["ce"]["previous_close"] == 3
    assert result["rows"][0]["ce"]["previous_oi"] == 100
    assert result["rows"][0]["pe"]["previous_close"] == 3
    assert result["rows"][0]["pe"]["previous_oi"] == 100
    assert result["rows"][0]["ce"]["delta"] == 0.6
    payouts = result["max_pain"]["payout_table"]
    assert len(payouts) == 2
    assert all({"ce_payout", "pe_payout", "total_payout"} <= payout.keys() for payout in payouts)
    assert payouts[0]["total_payout"] == payouts[0]["ce_payout"] + payouts[0]["pe_payout"]


@pytest.mark.asyncio
async def test_candle_support_resistance_works_without_option_chain(monkeypatch):
    from datetime import datetime, timezone

    async def intraday(_key, _unit, _interval):
        return [["2026-11-16T10:00:00+05:30", 105, 108, 104, 107, 500]]

    async def historical(_key, _unit, _interval, _end, _start):
        return [["2026-11-13T00:00:00+05:30", 100, 110, 90, 105, 1000]]

    async def no_subscriptions(_keys, mode="full"):
        return None

    monkeypatch.setattr(upstox, "instrument_key_for_symbol", lambda _symbol: "NSE_INDEX|Nifty 50")
    monkeypatch.setattr(upstox, "get_intraday_candles_v3", intraday)
    monkeypatch.setattr(upstox, "get_historical_candles_v3", historical)
    monkeypatch.setattr(subscription_manager, "set_subscriptions", no_subscriptions)
    monkeypatch.setattr(subscription_manager, "latest_ticks", {"NSE_INDEX|Nifty 50": {
        "ltp": 107, "feed_type": "live_feed", "received_at": datetime.now(timezone.utc).isoformat(),
        "exchange_timestamp": datetime.now(timezone.utc).isoformat()
    }})

    result = await get_technical_support_resistance("NIFTY")
    assert result["status"] == "LIVE"
    assert result["supports"][0]["kind"] == "INTRADAY_LOW"
    assert result["resistances"][0]["kind"] == "INTRADAY_HIGH"
    assert result["source"].startswith("Upstox Historical Candle V3")


@pytest.mark.asyncio
async def test_historical_chart_returns_ema_9_and_ema_21_from_candles(monkeypatch):
    rows = [[f"2026-01-{day:02d}T00:00:00Z", day, day, day, day, 100] for day in range(1, 23)]

    async def historical(_key, _unit, _interval, _end, _start):
        return rows

    async def no_subscriptions(_keys, mode="full"):
        return None

    monkeypatch.setattr(upstox, "instrument_key_for_symbol", lambda _symbol: "NSE_INDEX|Nifty 50")
    monkeypatch.setattr(upstox, "get_historical_candles_v3", historical)
    monkeypatch.setattr("app.api.routes.chart.subscription_manager.set_subscriptions", no_subscriptions)

    result = await get_chart_candles(symbol="NIFTY", timeframe="1D", chart_type="CANDLESTICK",
                                    before=None, instrument_key=None)
    assert result["source"] == "Upstox Historical Candle V3"
    assert result["indicators"]["ema_9"][8] == 5.0
    assert result["indicators"]["ema_21"][20] == 11.0
    assert result["indicators"]["ema_21"][21] == 12.0
