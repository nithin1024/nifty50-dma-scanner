"""Authenticated Upstox Market Data Feed V3 client and subscription manager."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from uuid import uuid4
from zoneinfo import ZoneInfo

import websockets

from app.config import get_settings
from app.proto import MarketDataFeed_pb2
from app.services import upstox_market_client as rest

logger = logging.getLogger("upstox_feed")
IST = ZoneInfo("Asia/Kolkata")


def _iso_milliseconds(value: Any) -> Optional[str]:
    if value in (None, 0, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, timezone.utc).isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        return None


def decode_feed(payload: bytes) -> Dict[str, Any]:
    """Decode an official binary V3 FeedResponse into JSON-safe normalized ticks."""
    response = MarketDataFeed_pb2.FeedResponse()
    response.ParseFromString(payload)
    current_ms = int(response.currentTs)
    normalized: Dict[str, Any] = {}
    for instrument_key, feed in response.feeds.items():
        kind = feed.WhichOneof("FeedUnion")
        source = None
        if kind == "ltpc":
            source = feed.ltpc
        elif kind == "firstLevelWithGreeks":
            source = feed.firstLevelWithGreeks.ltpc
        elif kind == "fullFeed":
            full_kind = feed.fullFeed.WhichOneof("FullFeedUnion")
            if full_kind == "marketFF":
                source = feed.fullFeed.marketFF.ltpc
            elif full_kind == "indexFF":
                source = feed.fullFeed.indexFF.ltpc
        if source is None:
            continue
        tick: Dict[str, Any] = {
            "instrument_key": instrument_key,
            "ltp": source.ltp,
            "close_price": source.cp,
            "last_trade_time": int(source.ltt) if source.ltt else None,
            "last_trade_quantity": int(source.ltq) if source.ltq else None,
            "current_ts": current_ms,
            "exchange_timestamp": _iso_milliseconds(source.ltt),
            "server_timestamp": _iso_milliseconds(current_ms),
            "received_at": datetime.now(timezone.utc).isoformat(),
            "feed_type": MarketDataFeed_pb2.Type.Name(response.type),
            "request_mode": MarketDataFeed_pb2.RequestMode.Name(feed.requestMode),
        }
        full = None
        if kind == "fullFeed":
            ff = feed.fullFeed
            if ff.WhichOneof("FullFeedUnion") == "marketFF":
                full = ff.marketFF
            elif ff.WhichOneof("FullFeedUnion") == "indexFF":
                full = ff.indexFF
        elif kind == "firstLevelWithGreeks":
            full = feed.firstLevelWithGreeks
        if full is not None:
            present_fields = {field.name for field, _ in full.ListFields()}
            if "vtt" in present_fields:
                tick["volume"] = int(full.vtt)
            if "oi" in present_fields:
                tick["oi"] = float(full.oi)
            if "iv" in present_fields:
                tick["iv"] = float(full.iv)
            greeks = getattr(full, "optionGreeks", None)
            if greeks is not None and "optionGreeks" in present_fields:
                provided_greeks = {field.name for field, _ in greeks.ListFields()}
                tick["greeks"] = {name: getattr(greeks, name) for name in ("delta", "gamma", "theta", "vega", "rho")
                                   if name in provided_greeks}
            ohlc = getattr(full, "marketOHLC", None)
            if ohlc is not None:
                tick["ohlc"] = [{"interval": row.interval, "open": row.open, "high": row.high,
                                 "low": row.low, "close": row.close, "volume": int(row.vol), "timestamp": int(row.ts)}
                                for row in ohlc.ohlc]
            if kind == "firstLevelWithGreeks":
                quote = full.firstDepth
                tick["market_depth"] = [{"bid_quantity": int(quote.bidQ), "bid_price": quote.bidP,
                                         "ask_quantity": int(quote.askQ), "ask_price": quote.askP}]
            elif kind == "fullFeed" and feed.fullFeed.WhichOneof("FullFeedUnion") == "marketFF":
                tick["market_depth"] = [
                    {"bid_quantity": int(quote.bidQ), "bid_price": quote.bidP,
                     "ask_quantity": int(quote.askQ), "ask_price": quote.askP}
                    for quote in full.marketLevel.bidAskQuote
                ]
                market_fields = {field.name for field, _ in full.ListFields()}
                if "tbq" in market_fields:
                    tick["total_buy_quantity"] = int(full.tbq)
                if "tsq" in market_fields:
                    tick["total_sell_quantity"] = int(full.tsq)
        normalized[instrument_key] = tick
    return {"type": MarketDataFeed_pb2.Type.Name(response.type), "current_ts": current_ms,
            "market_info": dict(response.marketInfo.segmentStatus) if response.HasField("marketInfo") else {},
            "ticks": normalized}


def build_market_data_event(decoded: Dict[str, Any], accepted_ticks: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Keep the application event name distinct from the protobuf feed type."""
    return {**decoded, "type": "market_data", "feed_type": decoded.get("type"),
            "is_live_update": decoded.get("type") == "live_feed", "ticks": accepted_ticks}


class SubscriptionManager:
    """One feed socket; enforces the documented normal-account Full combined cap."""

    def __init__(self) -> None:
        self.status = "DISCONNECTED"
        self.authentication_status = "WAITING"
        self.last_message_at: Optional[float] = None
        self.last_error: Optional[str] = None
        self.contract_count = 0
        self._initialized = False
        self.active: OrderedDict[str, str] = OrderedDict()
        self.waiting: OrderedDict[str, str] = OrderedDict()
        self.latest_ticks: Dict[str, Dict[str, Any]] = {}
        self.instrument_metadata: Dict[str, Dict[str, Any]] = {}
        self.clients: set[Any] = set()
        self._task: Optional[asyncio.Task] = None
        self._socket: Any = None
        self._lock = asyncio.Lock()
        self._configure_lock = asyncio.Lock()
        self.last_exchange_ts: Optional[int] = None
        self.last_received_at: Optional[str] = None
        self.last_tick_current_ts: Dict[str, int] = {}
        self.last_tick_signature: Dict[str, str] = {}
        self.volume_counters: Dict[str, Dict[str, Any]] = {}
        self.instrument_received_at: Dict[str, str] = {}
        self.instrument_live_received_at: Dict[str, str] = {}
        self.instrument_exchange_ts: Dict[str, Optional[str]] = {}
        self.priority_keys: set[str] = set()
        self.last_universe_refresh: Optional[str] = None
        self.stock_option_contract_count = 0
        self.stock_option_feed_key_count = 0
        self.stock_option_selections: Dict[str, List[str]] = {}
        self.failed_option_underlyings = 0
        self.universe_cache_at: Optional[float] = None
        self.universe_cache: Optional[List[Dict[str, Any]]] = None
        self.universe_refresh_lock = asyncio.Lock()

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run(), name="upstox-market-feed-v3")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            await asyncio.gather(self._task, return_exceptions=True)
        self.status = "DISCONNECTED"

    async def configure_nifty(self) -> None:
        """Use real contract/chain data to seed spot plus nearest CE/PE instruments."""
        async with self._configure_lock:
            if self._initialized:
                return
            await self._configure_nifty_unlocked()

    async def _configure_nifty_unlocked(self) -> None:
        contracts = await rest.get_option_contracts(rest.NIFTY_INSTRUMENT_KEY)
        expiries = rest.unique_expiries(contracts)
        self.contract_count = len(contracts)
        if not expiries:
            raise ValueError("Upstox returned no NIFTY option expiries")
        chain = await rest.get_option_chain(rest.NIFTY_INSTRUMENT_KEY, expiries[0])
        if not chain:
            raise ValueError("Upstox returned an empty NIFTY option chain")
        spot = float(chain[0]["underlying_spot_price"])
        self.instrument_metadata[rest.NIFTY_INSTRUMENT_KEY] = {"underlying": "NIFTY", "expiry": expiries[0],
                                                                "option_type": "INDEX", "strike_price": spot}
        for item in chain:
            for side, option_type in (("call_options", "CE"), ("put_options", "PE")):
                option = item.get(side) or {}
                key = option.get("instrument_key")
                if key:
                    self.instrument_metadata[key] = {"underlying": "NIFTY", "expiry": item["expiry"],
                        "option_type": option_type, "strike_price": float(item["strike_price"])}
        nearest = sorted(chain, key=lambda row: abs(float(row["strike_price"]) - spot))[:3]
        keys = [rest.NIFTY_INSTRUMENT_KEY]
        for row in nearest:
            for side in ("call_options", "put_options"):
                key = (row.get(side) or {}).get("instrument_key")
                if key:
                    keys.append(key)
        self.priority_keys.update(keys)
        await self.set_subscriptions(keys, mode="full")
        from app.services.constituents_service import constituents_service
        equities = constituents_service.get_constituents()
        equity_keys = [item.get("upstox_instrument_key") for item in equities]
        for item in equities:
            equity_key = item.get("upstox_instrument_key")
            if equity_key:
                self.instrument_metadata[equity_key] = {
                    "underlying": item.get("symbol"), "option_type": "UNDERLYING"
                }
        # Full mode carries VTT (cumulative volume traded today); LTPC cannot
        # provide the volume field required by the stock and volume scanners.
        await self.set_subscriptions(equity_keys, mode="full")
        self._initialized = True

    def _accept_tick(self, key: str, source: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Reject stale/duplicate frames and attach safe cumulative-volume deltas."""
        tick = dict(source)
        current_ts = int(tick.get("current_ts") or 0)
        previous_ts = self.last_tick_current_ts.get(key, 0)
        if current_ts and previous_ts and current_ts < previous_ts:
            return None

        signature_data = {name: value for name, value in tick.items() if name != "received_at"}
        signature = json.dumps(signature_data, sort_keys=True, separators=(",", ":"), default=str)
        if self.last_tick_signature.get(key) == signature:
            return None
        self.last_tick_signature[key] = signature
        self.last_tick_current_ts[key] = max(previous_ts, current_ts)

        received_at = tick.get("received_at") or datetime.now(timezone.utc).isoformat()
        self.instrument_received_at[key] = received_at
        self.instrument_exchange_ts[key] = tick.get("exchange_timestamp")
        tick["is_live_feed_message"] = tick.get("feed_type") == "live_feed"
        if tick["is_live_feed_message"]:
            self.instrument_live_received_at[key] = received_at

        cumulative = tick.get("volume")
        tick["incremental_volume"] = None
        tick["volume_counter_reset"] = False
        if cumulative is not None:
            try:
                cumulative = max(0, int(cumulative))
                event_ms = int(tick.get("last_trade_time") or current_ts or 0)
                session_date = (
                    datetime.fromtimestamp(event_ms / 1000, timezone.utc).astimezone(IST).date().isoformat()
                    if event_ms else None
                )
                previous = self.volume_counters.get(key)
                if previous is None or (session_date and previous.get("session_date") != session_date):
                    # Establish a baseline. VTT is cumulative session volume,
                    # not the volume of the candle currently on screen.
                    increment = 0
                elif cumulative >= previous["cumulative"]:
                    increment = cumulative - previous["cumulative"]
                else:
                    # A same-session decrease is a provider counter reset or
                    # correction. Reset the baseline without adding old volume.
                    increment = 0
                    tick["volume_counter_reset"] = True
                tick["volume"] = cumulative
                tick["incremental_volume"] = increment
                self.volume_counters[key] = {"cumulative": cumulative, "session_date": session_date}
            except (TypeError, ValueError, OverflowError):
                tick["volume"] = None
                tick["incremental_volume"] = None
        return tick

    async def set_subscriptions(self, instrument_keys: Iterable[str], mode: str = "full") -> None:
        if mode not in ("full", "ltpc"):
            raise ValueError("Upstox V3 subscription mode must be full or ltpc")
        requested = list(dict.fromkeys(str(key) for key in instrument_keys if key))
        settings = get_settings()
        max_full = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                       settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
        max_total = settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS
        replaced_modes: Dict[str, str] = {}
        async with self._lock:
            for key in requested:
                if key in self.active:
                    current_mode = self.active[key]
                    if current_mode == mode or (current_mode == "full" and mode == "ltpc"):
                        continue
                    if mode == "full":
                        full_count = sum(1 for value in self.active.values() if value == "full")
                        if full_count >= max_full:
                            self.waiting[key] = mode
                            continue
                        replaced_modes[key] = current_mode
                        self.active[key] = mode
                    continue
                if key in self.waiting:
                    if mode == "full" and self.waiting[key] == "ltpc":
                        self.waiting[key] = mode
                    continue
                mode_count = sum(1 for value in self.active.values() if value == mode)
                capacity_available = len(self.active) < max_total and (mode != "full" or mode_count < max_full)
                (self.active if capacity_available else self.waiting)[key] = mode
            if self._socket is not None and requested:
                for old_mode in set(replaced_modes.values()):
                    old_keys = [key for key, previous in replaced_modes.items() if previous == old_mode]
                    await self._send_subscription("unsub", old_keys, old_mode)
                active_now = [key for key in requested if key in self.active and self.active[key] == mode]
                if active_now:
                    await self._send_subscription("sub", active_now, mode)

    def register_option_chain(self, underlying: str, rows: Iterable[Dict[str, Any]]) -> None:
        for item in rows:
            for side, option_type in (("call_options", "CE"), ("put_options", "PE")):
                option = item.get(side) or {}
                key = option.get("instrument_key")
                if key:
                    self.instrument_metadata[key] = {"underlying": underlying,
                        "expiry": item.get("expiry"), "option_type": option_type,
                        "strike_price": float(item["strike_price"])}

    def register_option_contracts(self, underlying: str, contracts: Iterable[Dict[str, Any]]) -> None:
        """Register exact option metadata returned by Upstox Option Contracts API."""
        for contract in contracts:
            key = contract.get("instrument_key")
            option_type = contract.get("instrument_type")
            strike = contract.get("strike_price")
            if not key or option_type not in ("CE", "PE") or strike is None:
                continue
            self.instrument_metadata[str(key)] = {
                "underlying": underlying,
                "expiry": contract.get("expiry"),
                "option_type": option_type,
                "strike_price": float(strike),
            }

    def select_stock_option_contracts(self, underlying: str, spot: float, expiry: Optional[str] = None) -> tuple[str, List[float], List[str]]:
        """Choose up to 21 strikes around a verified quote from registered Upstox contracts."""
        available = [(key, metadata) for key, metadata in self.instrument_metadata.items()
                     if metadata.get("underlying") == underlying
                     and metadata.get("option_type") in ("CE", "PE")
                     and metadata.get("expiry") and metadata.get("strike_price") is not None]
        expiries = sorted({str(metadata["expiry"]) for _, metadata in available})
        selected_expiry = expiry or (expiries[0] if expiries else None)
        if not selected_expiry:
            return "", [], []
        matching = [(key, metadata) for key, metadata in available
                    if str(metadata.get("expiry")) == selected_expiry]
        strikes = sorted({float(metadata["strike_price"]) for _, metadata in matching})
        selected_strikes = sorted(strikes, key=lambda strike: abs(strike - float(spot)))[:21]
        strike_set = set(selected_strikes)
        keys = [key for key, metadata in matching if float(metadata["strike_price"]) in strike_set]
        return selected_expiry, selected_strikes, keys

    def record_stock_option_selection(self, underlying: str, keys: Iterable[str]) -> None:
        self.stock_option_selections[underlying] = list(dict.fromkeys(str(key) for key in keys if key))
        self.stock_option_feed_key_count = sum(len(items) for items in self.stock_option_selections.values())

    def prioritize_instruments(self, instrument_keys: Iterable[str]) -> None:
        """Keep core index/equity feeds and the currently displayed contracts ahead of rotation."""
        self.priority_keys = {key for key in self.priority_keys
                              if key not in self.instrument_metadata
                              or self.instrument_metadata[key].get("option_type") == "INDEX"}
        self.priority_keys.update(str(key) for key in instrument_keys if key)

    async def subscribe_client_request(self, request: Dict[str, Any]) -> None:
        data = request.get("data") if isinstance(request.get("data"), dict) else request
        keys = data.get("instrumentKeys") or data.get("instrument_keys") or []
        mode = data.get("mode", "full")
        if isinstance(keys, list):
            if request.get("method") == "unsub":
                await self.unsubscribe(keys)
            else:
                await self.set_subscriptions(keys, mode)

    async def unsubscribe(self, instrument_keys: Iterable[str]) -> None:
        keys = list(dict.fromkeys(str(key) for key in instrument_keys if key))
        async with self._lock:
            active_removed = [(key, self.active.pop(key)) for key in keys if key in self.active]
            for key in keys:
                self.waiting.pop(key, None)
            if self._socket is not None:
                for mode in {mode for _, mode in active_removed}:
                    await self._send_subscription("unsub", [key for key, item_mode in active_removed if item_mode == mode], mode)
            settings = get_settings()
            max_full = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                           settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
            while self.waiting and len(self.active) < settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS:
                key, mode = self.waiting.popitem(last=False)
                if mode == "full" and sum(v == "full" for v in self.active.values()) >= max_full:
                    self.waiting[key] = mode
                    break
                old_mode = self.active.get(key)
                if old_mode and old_mode != mode and self._socket is not None:
                    await self._send_subscription("unsub", [key], old_mode)
                self.active[key] = mode
                if self._socket is not None:
                    await self._send_subscription("sub", [key], mode)

    async def rotate_waiting_subscriptions(self, batch_size: int = 100) -> int:
        """Rotate queued option keys through spare feed slots, preserving core/focused keys."""
        settings = get_settings()
        max_full = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                       settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
        rotated_in: List[str] = []
        rotated_out: List[str] = []
        async with self._lock:
            if not self.waiting:
                return 0
            waiting_order = list(self.waiting.keys())
            waiting_keys = [key for key in waiting_order if key in self.priority_keys]
            waiting_keys.extend(key for key in waiting_order if key not in self.priority_keys)
            for incoming in waiting_keys:
                if len(rotated_in) >= batch_size:
                    break
                incoming_mode = self.waiting.get(incoming)
                if incoming_mode != "full":
                    continue
                full_count = sum(mode == "full" for mode in self.active.values())
                if full_count < max_full and len(self.active) < settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS:
                    self.waiting.pop(incoming, None)
                    self.active[incoming] = "full"
                    rotated_in.append(incoming)
                    continue
                victim = next((key for key, mode in self.active.items()
                               if mode == "full" and key not in self.priority_keys
                               and self.instrument_metadata.get(key, {}).get("option_type") in ("CE", "PE")), None)
                if victim is None:
                    break
                self.active.pop(victim, None)
                self.waiting.pop(incoming, None)
                self.active[incoming] = "full"
                self.waiting[victim] = "full"
                rotated_out.append(victim)
                rotated_in.append(incoming)
            if self._socket is not None:
                if rotated_out:
                    await self._send_subscription("unsub", rotated_out, "full")
                if rotated_in:
                    await self._send_subscription("sub", rotated_in, "full")
        return len(rotated_in)

    async def _rotation_loop(self) -> None:
        while self._socket is not None:
            await asyncio.sleep(30)
            await self.rotate_waiting_subscriptions()

    async def _send_subscription(self, method: str, keys: List[str], mode: str) -> None:
        request = {"guid": str(uuid4()), "method": method,
                   "data": {"mode": mode, "instrumentKeys": keys}}
        # Upstox V3 requires the JSON request bytes in a binary WebSocket frame.
        await self._socket.send(json.dumps(request, separators=(",", ":")).encode("utf-8"))

    async def _run(self) -> None:
        settings = get_settings()
        if not (settings.UPSTOX_ACCESS_TOKEN or "").strip():
            self.status = "WAITING"
            return
        delay = 3
        while True:
            try:
                await self.configure_nifty()
                uri = await rest.authorize_market_data_feed()
                self.authentication_status = "AUTHENTICATED"
                async with websockets.connect(uri, ping_interval=20, ping_timeout=20, max_size=8 * 1024 * 1024) as socket:
                    self._socket = socket
                    self.status = "WAITING"
                    for mode in ("full", "ltpc"):
                        keys = [key for key, value in self.active.items() if value == mode]
                        if keys:
                            await self._send_subscription("sub", keys, mode)
                    delay = 3
                    rotation_task = asyncio.create_task(self._rotation_loop(), name="upstox-subscription-rotation")
                    try:
                        async for message in socket:
                            if not isinstance(message, (bytes, bytearray)):
                                continue
                            decoded = decode_feed(bytes(message))
                            frame_ts = decoded.get("current_ts")
                            if frame_ts and (self.last_exchange_ts is None or frame_ts > self.last_exchange_ts):
                                self.last_exchange_ts = frame_ts
                            accepted_ticks = {
                                key: tick for key, raw_tick in decoded["ticks"].items()
                                if (tick := self._accept_tick(key, raw_tick)) is not None
                            }
                            if accepted_ticks:
                                self.latest_ticks.update(accepted_ticks)
                                # Newly arriving equity snapshots can complete
                                # ATM selection for underlyings that were
                                # WAITING_FOR_SPOT during the REST universe scan.
                                for underlying_key, tick in accepted_ticks.items():
                                    underlying_meta = self.instrument_metadata.get(underlying_key, {})
                                    if underlying_meta.get("option_type") != "UNDERLYING":
                                        continue
                                    if tick.get("feed_type") not in ("initial_feed", "live_feed"):
                                        continue
                                    try:
                                        spot = float(tick.get("ltp"))
                                    except (TypeError, ValueError):
                                        continue
                                    if spot <= 0:
                                        continue
                                    symbol = str(underlying_meta.get("underlying") or "")
                                    expiry, _strikes, new_keys = self.select_stock_option_contracts(symbol, spot)
                                    if not expiry or not new_keys:
                                        continue
                                    old_keys = self.stock_option_selections.get(symbol, [])
                                    if set(old_keys) == set(new_keys):
                                        continue
                                    self.record_stock_option_selection(symbol, new_keys)
                                    retired = [key for key in old_keys
                                               if key not in new_keys and key not in self.priority_keys]
                                    if retired:
                                        await self.unsubscribe(retired)
                                    await self.set_subscriptions(new_keys, mode="full")
                                is_live = decoded["type"] == "live_feed"
                                if is_live:
                                    self.last_message_at = time.time()
                                    self.last_received_at = datetime.now(timezone.utc).isoformat()
                                    self.status = "LIVE"
                                await self.broadcast(build_market_data_event(decoded, accepted_ticks))
                                if is_live:
                                    # Keep the legacy scanner WebSocket connected to the
                                    # same accepted V3 feed, without doing REST polling.
                                    try:
                                        from app.services.upstox_service import live_feed_manager
                                        live_feed_manager.schedule_live_snapshot()
                                    except Exception:
                                        logger.exception("Unable to schedule live scanner update")
                            elif decoded["type"] == "market_info":
                                await self.broadcast(decoded)
                    finally:
                        rotation_task.cancel()
                        await asyncio.gather(rotation_task, return_exceptions=True)
            except asyncio.CancelledError:
                raise
            except rest.UpstoxApiError as exc:
                self.last_error = "UpstoxAuthenticationError" if exc.status_code in (401, 403) else "UpstoxApiError"
                self.authentication_status = "FAILED" if exc.status_code in (401, 403) else "UNAVAILABLE"
                self.status = "DISCONNECTED" if exc.status_code in (401, 403) else "WAITING"
                logger.warning("Upstox V3 feed authorization failed (HTTP %s)", exc.status_code)
                await asyncio.sleep(delay)
                delay = min(delay * 2, 60)
            except Exception as exc:
                self.last_error = type(exc).__name__
                self.status = "WAITING" if self.last_message_at is None else "DISCONNECTED"
                logger.warning("Upstox V3 feed connection failed (%s)", type(exc).__name__)
                await asyncio.sleep(delay)
                delay = min(delay * 2, 60)
            finally:
                self._socket = None

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        stale = set()
        for client in self.clients:
            try:
                await client.send_json(payload)
            except Exception:
                stale.add(client)
        self.clients.difference_update(stale)

    def get_status(self) -> Dict[str, Any]:
        settings = get_settings()
        age = time.time() - self.last_message_at if self.last_message_at else None
        max_active = min(settings.UPSTOX_MAX_FULL_SUBSCRIPTIONS,
                         settings.UPSTOX_MAX_FULL_COMBINED_SUBSCRIPTIONS)
        state = self.status
        if state == "LIVE" and age is not None and age > settings.UPSTOX_STALE_SECONDS:
            state = "STALE"
        return {"status": state, "websocket_connected": self._socket is not None,
                "active_subscriptions": len(self.active),
                "waiting_subscriptions": len(self.waiting), "verified_nifty_contracts": self.contract_count,
                "authentication_status": self.authentication_status,
                "subscription_limit": settings.UPSTOX_MAX_COMBINED_SUBSCRIPTIONS,
                "full_subscription_count": sum(mode == "full" for mode in self.active.values()),
                "ltpc_subscription_count": sum(mode == "ltpc" for mode in self.active.values()),
                "full_subscription_limit": max_active,
                "last_message_age_seconds": round(age, 1) if age is not None else None,
                "last_feed_received_at": self.last_received_at,
                "last_exchange_timestamp": _iso_milliseconds(self.last_exchange_ts),
                "live_instrument_count": sum(
                    1 for key in self.active if key in self.instrument_live_received_at
                    and time.time() - datetime.fromisoformat(self.instrument_live_received_at[key]).timestamp()
                    <= settings.UPSTOX_STALE_SECONDS
                ),
                "active_option_subscriptions": sum(
                    1 for key in self.active if self.instrument_metadata.get(key, {}).get("option_type") in ("CE", "PE")
                ),
                "waiting_option_subscriptions": sum(
                    1 for key in self.waiting if self.instrument_metadata.get(key, {}).get("option_type") in ("CE", "PE")
                ),
                "live_option_instrument_count": sum(
                    1 for key in self.active if self.instrument_metadata.get(key, {}).get("option_type") in ("CE", "PE")
                    and key in self.instrument_live_received_at
                    and time.time() - datetime.fromisoformat(self.instrument_live_received_at[key]).timestamp()
                    <= settings.UPSTOX_STALE_SECONDS
                ),
                "tracked_stock_option_contracts": self.stock_option_contract_count,
                "stock_option_feed_keys": self.stock_option_feed_key_count,
                "failed_option_underlyings": self.failed_option_underlyings,
                "last_subscription_refresh": self.last_universe_refresh,
                "option_live_coverage_percent": round(
                    100.0 * sum(1 for key in self.active if self.instrument_metadata.get(key, {}).get("option_type") in ("CE", "PE")
                                and self.instrument_metadata.get(key, {}).get("underlying") != "NIFTY"
                                and key in self.instrument_live_received_at
                                and time.time() - datetime.fromisoformat(self.instrument_live_received_at[key]).timestamp()
                                <= settings.UPSTOX_STALE_SECONDS)
                    / self.stock_option_feed_key_count, 1
                ) if self.stock_option_feed_key_count else 0.0,
                "last_error": self.last_error}

    def capture_oi_snapshot(self) -> int:
        """Persist latest exchange OI only; never creates placeholder rows."""
        from app.database.session import SessionLocal
        from app.models.option_snapshot import OptionOISnapshotModel

        captured_at = datetime.now(timezone.utc)
        db = SessionLocal()
        inserted = 0
        try:
            for key, tick in self.latest_ticks.items():
                meta = self.instrument_metadata.get(key)
                if not meta or meta["option_type"] not in ("CE", "PE") or tick.get("oi") is None:
                    continue
                db.add(OptionOISnapshotModel(captured_at=captured_at, underlying=meta["underlying"],
                    expiry=meta["expiry"], instrument_key=key, option_type=meta["option_type"],
                    strike_price=meta["strike_price"], open_interest=float(tick["oi"]),
                    ltp=tick.get("ltp"), volume=tick.get("volume")))
                inserted += 1
            if inserted:
                db.commit()
            return inserted
        except Exception:
            db.rollback()
            logger.exception("Unable to persist option OI snapshot")
            return 0
        finally:
            db.close()


subscription_manager = SubscriptionManager()
