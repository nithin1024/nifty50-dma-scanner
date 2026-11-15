import pytest

from app.api.routes.options import get_option_chain
from app.api.routes.chart import get_chart_candles
from app.proto import MarketDataFeed_pb2 as proto
from app.services.upstox_feed_service import SubscriptionManager, decode_feed
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
    decoded = decode_feed(response.SerializeToString())
    tick = decoded["ticks"]["NSE_FO|123"]
    assert decoded["type"] == "live_feed"
    assert tick["ltp"] == 101.25
    assert tick["volume"] == 3400
    assert tick["oi"] == 8700
    assert tick["greeks"]["delta"] == 0.51


@pytest.mark.asyncio
async def test_full_subscription_manager_obeys_combined_feed_limit():
    manager = SubscriptionManager()
    await manager.set_subscriptions([f"NSE_EQ|{i}" for i in range(1502)])
    assert len(manager.active) == 1500
    assert len(manager.waiting) == 2
    assert manager.get_status()["status"] == "DISCONNECTED"


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
