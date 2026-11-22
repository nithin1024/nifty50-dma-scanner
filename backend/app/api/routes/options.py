from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any
import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.config import get_settings

logger = logging.getLogger(__name__)

from app.services.options_universe_service import options_universe_service
from app.services.options_analytics_engine import (
    options_analytics_engine,
    classify_option_pattern_and_score,
    get_market_view
)
from app.services.alerts_and_monitoring_service import alerts_and_monitoring_service
from app.services import upstox_market_client as upstox
from app.services.upstox_feed_service import subscription_manager
from app.services.constituents_service import constituents_service
from app.services.upstox_market_client import UpstoxApiError

router = APIRouter(prefix="/options", tags=["Options Analytics & Universe"])
IST = ZoneInfo("Asia/Kolkata")


@router.get("/auth-status")
async def upstox_auth_status() -> Dict[str, Any]:
    """Verify Upstox Analytics Token credentials and market data feed connection."""
    settings = get_settings()
    has_token = bool((settings.UPSTOX_ACCESS_TOKEN or "").strip())
    if not has_token:
        return {
            "authenticated": False,
            "is_active": False,
            "broker": "UPSTOX",
            "status": "DISCONNECTED",
            "authentication": "MISSING_TOKEN",
            "feed_status": subscription_manager.get_status(),
        }

    # If already verified or authenticated by the feed manager, return live state
    if subscription_manager.authentication_status == "AUTHENTICATED":
        return {
            "authenticated": True,
            "is_active": True,
            "broker": "UPSTOX",
            "status": "CONNECTED",
            "profile_endpoint": "/v3/feed/market-data-feed/authorize",
            "feed_status": subscription_manager.get_status(),
            "is_analytics_token": True,
        }

    # Verify market data token against documented market feed / contracts endpoint
    verification = await upstox.verify_market_data_access()
    if verification.get("authenticated"):
        subscription_manager.authentication_status = "AUTHENTICATED"
        subscription_manager.start()
        return {
            "authenticated": True,
            "is_active": True,
            "broker": "UPSTOX",
            "status": "CONNECTED",
            "profile_endpoint": verification.get("feed_endpoint", "/v3/feed/market-data-feed/authorize"),
            "feed_status": subscription_manager.get_status(),
            "is_analytics_token": True,
        }

    # If token failed with 401/403
    subscription_manager.authentication_status = "FAILED" if verification.get("status") == "FAILED" else "UNAVAILABLE"
    subscription_manager.status = "DISCONNECTED" if verification.get("status") == "FAILED" else "WAITING"
    return {
        "authenticated": False,
        "is_active": False,
        "broker": "UPSTOX",
        "status": "DISCONNECTED",
        "error": verification.get("message", "Upstox market feed authentication failed"),
        "feed_status": subscription_manager.get_status(),
    }


@router.get("/feed-status")
async def upstox_feed_status() -> Dict[str, Any]:
    return subscription_manager.get_status()


@router.get("/universe")
async def get_fo_universe() -> Dict[str, Any]:
    """Verify NSE NIFTY constituents against real Upstox contracts and seed ATM±10 stock-option subscriptions."""
    async with subscription_manager.universe_refresh_lock:
        if (subscription_manager.universe_cache is not None
                and subscription_manager.universe_cache_at is not None
                and asyncio.get_running_loop().time() - subscription_manager.universe_cache_at < 900):
            return {"universe": subscription_manager.universe_cache,
                    "subscription_monitor": subscription_manager.get_status(),
                    "constituents_source": constituents_service.last_fetch_source,
                    "fo_eligibility_source": (subscription_manager.universe_cache[0].get("nse_fo_source")
                                               if subscription_manager.universe_cache else None),
                    "cached": True}

        try:
            # Ensure NIFTY spot & ATM option subscriptions are configured
            await subscription_manager.configure_nifty()
            subscription_manager.authentication_status = "AUTHENTICATED"
            subscription_manager.start()
        except UpstoxApiError as exc:
            if exc.status_code in (401, 403):
                subscription_manager.authentication_status = "FAILED"
                subscription_manager.status = "DISCONNECTED"
            logger.warning("F&O universe initial NIFTY configuration error: %s", exc)
        except Exception as exc:
            logger.warning("F&O universe initial NIFTY configuration warning: %s", exc)

        # Option Contracts returns each listed CE/PE contract, expiry and strike.
        # One request per underlying is sufficient: the underlying quote comes
        # from the already-running V3 feed. The chain endpoint remains reserved
        # for the selected symbol's actual option-chain view.
        semaphore = asyncio.Semaphore(5)
        current_constituents = await constituents_service.fetch_from_nse()
        try:
            nse_fo_symbols, nse_fo_source = await constituents_service.fetch_official_fo_eligible_symbols()
        except RuntimeError as exc:
            raise HTTPException(status_code=503,
                                detail={"message": "Cannot verify the current NSE F&O-eligible universe",
                                        "source": "NSE Permitted Lot Sizes CSV",
                                        "endpoint": "/content/fo/fo_mktlots.csv"}) from exc

        async def discover(stock: Dict[str, Any]) -> Dict[str, Any]:
            key = stock["upstox_instrument_key"]
            symbol = stock["symbol"]
            nse_eligible = symbol.upper() in nse_fo_symbols
            result = {"symbol": symbol, "company_name": stock.get("company_name"),
                      "instrument_key": key, "nse_fo_eligible": nse_eligible,
                      "nse_fo_source": nse_fo_source,
                      "is_fo_eligible": False,
                      "verified_contract_count": 0, "expiries": [],
                      "verification_source": "NSE Permitted Lot Sizes CSV + Upstox Option Contracts API",
                      "option_chain_source": None, "selected_contracts": 0, "subscribed_contracts": 0,
                      "selection_status": "NOT_NSE_FO_ELIGIBLE" if not nse_eligible else "WAITING_FOR_SPOT"}
            if not nse_eligible:
                return result
            async with semaphore:
                try:
                    contracts = await upstox.get_option_contracts(key)
                except UpstoxApiError as exc:
                    return {"symbol": stock["symbol"], "company_name": stock.get("company_name"),
                            **{field: value for field, value in result.items() if field not in ("symbol", "company_name", "instrument_key")},
                            "instrument_key": key, "is_fo_eligible": None,
                            "verification_error": f"Upstox HTTP {exc.status_code}", "endpoint": exc.endpoint}
                expiries = upstox.unique_expiries(contracts)
                result.update({"is_fo_eligible": bool(contracts),
                               "verified_contract_count": len(contracts), "expiries": expiries,
                               "verification_source": "NSE Permitted Lot Sizes CSV + /v2/option/contract",
                               "selection_status": "NO_UPSTOX_CONTRACTS" if not contracts else "WAITING_FOR_SPOT"})
                if not contracts:
                    return result
                if not expiries:
                    result["selection_status"] = "NO_VERIFIED_EXPIRY"
                    return result
                result["nearest_expiry"] = expiries[0]
                result["option_chain_source"] = "/v2/option/chain (on-demand for selected symbol)"
                subscription_manager.register_option_contracts(stock["symbol"], contracts)
                quote = subscription_manager.latest_ticks.get(key) or {}
                quote_age = None
                if quote.get("received_at"):
                    try:
                        quote_age = (datetime.now(timezone.utc) - datetime.fromisoformat(
                            quote["received_at"].replace("Z", "+00:00"))).total_seconds()
                    except (TypeError, ValueError):
                        quote_age = None
                try:
                    spot = float(quote.get("ltp"))
                except (TypeError, ValueError):
                    spot = 0.0
                if (spot <= 0 or quote.get("feed_type") not in ("initial_feed", "live_feed")
                        or quote_age is None or quote_age < 0 or quote_age > 120):
                    return result

                selected_expiry, selected_strikes, option_keys = subscription_manager.select_stock_option_contracts(
                    stock["symbol"], spot, expiries[0])
                result.update({"spot_reference": spot,
                               "spot_reference_source": "Upstox Market Data Feed V3",
                               "spot_reference_timestamp": quote.get("exchange_timestamp"),
                               "spot_reference_age_seconds": round(max(0.0, quote_age), 1),
                               "selected_strike_count": len(selected_strikes),
                               "selected_contracts": len(option_keys),
                               "subscribed_contracts": len(option_keys),
                               "selection_status": "SELECTED" if option_keys else "NO_MATCHING_CONTRACTS"})
                result["nearest_expiry"] = selected_expiry or expiries[0]
                result["_subscription_keys"] = option_keys
                return result

        results = await asyncio.gather(*(discover(stock) for stock in current_constituents))
        # When the socket has just connected, allow its actual initial_feed
        # snapshots a short opportunity to arrive. Do not invent an ATM from
        # historical or 15-minute snapshots if a fresh broker quote is absent.
        for _ in range(10):
            pending = [item for item in results if item.get("is_fo_eligible")
                       and item.get("selection_status") == "WAITING_FOR_SPOT"]
            if not pending:
                break
            await asyncio.sleep(0.5)
            for item in pending:
                quote = subscription_manager.latest_ticks.get(item["instrument_key"]) or {}
                received_at = quote.get("received_at")
                if quote.get("feed_type") not in ("initial_feed", "live_feed") or not received_at:
                    continue
                try:
                    spot = float(quote.get("ltp"))
                    age = (datetime.now(timezone.utc) - datetime.fromisoformat(
                        received_at.replace("Z", "+00:00"))).total_seconds()
                except (TypeError, ValueError):
                    continue
                if spot <= 0 or age < 0 or age > 120:
                    continue
                selected_expiry, selected_strikes, option_keys = subscription_manager.select_stock_option_contracts(
                    item["symbol"], spot, item.get("nearest_expiry"))
                item.update({"spot_reference": spot, "spot_reference_source": "Upstox Market Data Feed V3",
                             "spot_reference_timestamp": quote.get("exchange_timestamp"),
                             "spot_reference_age_seconds": round(max(0.0, age), 1),
                             "selected_strike_count": len(selected_strikes),
                             "selected_contracts": len(option_keys), "subscribed_contracts": len(option_keys),
                             "selection_status": "SELECTED" if option_keys else "NO_MATCHING_CONTRACTS"})
                item["nearest_expiry"] = selected_expiry or item.get("nearest_expiry")
                item["_subscription_keys"] = option_keys

        new_selections = {item["symbol"]: item.pop("_subscription_keys", []) for item in results}
        all_option_keys = [key for keys in new_selections.values() for key in keys]
        previous_stock_option_keys = {key for keys in subscription_manager.stock_option_selections.values() for key in keys}
        requested_stock_option_keys = set(all_option_keys)
        retired_stock_options = [key for key in previous_stock_option_keys
                                 if key not in requested_stock_option_keys and key not in subscription_manager.priority_keys]
        if retired_stock_options:
            await subscription_manager.unsubscribe(retired_stock_options)
        subscription_manager.stock_option_selections = new_selections
        subscription_manager.stock_option_feed_key_count = sum(len(keys) for keys in new_selections.values())
        await subscription_manager.set_subscriptions(all_option_keys, mode="full")
        subscription_manager.stock_option_contract_count = sum(item.get("verified_contract_count", 0) for item in results)
        subscription_manager.failed_option_underlyings = sum(
            1 for item in results if item.get("is_fo_eligible") is None
        )
        subscription_manager.last_universe_refresh = datetime.now(timezone.utc).isoformat()
        universe = [{"symbol": "NIFTY", "instrument_key": upstox.NIFTY_INSTRUMENT_KEY,
                     "is_index": True, "is_fo_eligible": True,
                     "verified_contract_count": subscription_manager.contract_count,
                     "nse_fo_eligible": True, "nse_fo_source": nse_fo_source,
                     "verification_source": "NSE Permitted Lot Sizes CSV + /v2/option/contract"}, *results]
        subscription_manager.universe_cache = universe
        subscription_manager.universe_cache_at = asyncio.get_running_loop().time()
        return {"universe": universe, "subscription_monitor": subscription_manager.get_status(),
                "constituents_source": constituents_service.last_fetch_source,
                "fo_eligibility_source": nse_fo_source, "cached": False}


@router.get("/snapshots")
async def get_available_snapshots(symbol: str = Query("NIFTY")) -> Dict[str, Any]:
    """Return available historical option-chain snapshot timestamps."""
    from app.database.session import SessionLocal
    from app.models.option_snapshot import OptionOISnapshotModel
    from sqlalchemy import func

    db = SessionLocal()
    try:
        results = (
            db.query(
                OptionOISnapshotModel.captured_at,
                OptionOISnapshotModel.expiry,
                func.count(OptionOISnapshotModel.id).label("records_count")
            )
            .filter(OptionOISnapshotModel.underlying == symbol.upper())
            .group_by(OptionOISnapshotModel.captured_at, OptionOISnapshotModel.expiry)
            .order_by(OptionOISnapshotModel.captured_at.desc())
            .limit(50)
            .all()
        )
        snapshots = [
            {
                "captured_at": r[0].isoformat() if r[0] else None,
                "display_time": r[0].strftime("%d %b %Y, %I:%M %p") if r[0] else "",
                "expiry": r[1],
                "contracts": r[2]
            }
            for r in results
        ]
        return {
            "symbol": symbol.upper(),
            "total_snapshots": len(snapshots),
            "snapshots": snapshots
        }
    except Exception as exc:
        return {"symbol": symbol.upper(), "total_snapshots": 0, "snapshots": [], "error": str(exc)}
    finally:
        db.close()


@router.get("/expiries")
async def get_expiries(symbol: str = Query("NIFTY")) -> Dict[str, Any]:
    """Return expiries observed in actual Upstox option contracts with graceful demo fallback."""
    key = upstox.instrument_key_for_symbol(symbol.upper())
    try:
        if not key:
            raise UpstoxApiError(404, "No instrument key", "/expiries")
        contracts = await upstox.get_option_contracts(key)
        return {"symbol": symbol.upper(), "instrument_key": key,
                "expiries": upstox.unique_expiries(contracts),
                "verified_contract_count": len(contracts), "source": "/v2/option/contract"}
    except (UpstoxApiError, Exception):
        expiries = options_universe_service.get_upcoming_expiries(symbol.upper())
        return {"symbol": symbol.upper(), "instrument_key": key or "DEMO",
                "expiries": expiries,
                "verified_contract_count": len(expiries), "source": "DEMO_OPTIONS_ENGINE"}


@router.get("/technical-levels")
async def get_technical_support_resistance(symbol: str = Query("NIFTY")) -> Dict[str, Any]:
    """Build historical price levels independently of option-chain availability."""
    key = upstox.instrument_key_for_symbol(symbol.upper())
    if not key:
        raise HTTPException(status_code=404, detail="No verified Upstox instrument key for this symbol")
    await subscription_manager.set_subscriptions([key], mode="full")
    today = datetime.now(IST).date()
    try:
        intraday_rows = await upstox.get_intraday_candles_v3(key, "minutes", "1")
        previous_rows = await upstox.get_historical_candles_v3(
            key, "days", "1", (today - timedelta(days=1)).isoformat(),
            (today - timedelta(days=10)).isoformat())
    except UpstoxApiError as exc:
        raise HTTPException(status_code=exc.status_code or 503,
                            detail={"message": exc.message, "endpoint": exc.endpoint})

    intraday = [candle for row in intraday_rows if (candle := upstox.parse_candle_row(row))]
    previous = [candle for row in previous_rows if (candle := upstox.parse_candle_row(row))]
    if not previous and not intraday:
        raise HTTPException(status_code=503, detail="Upstox returned no candles for technical support/resistance")
    prior = previous[-1] if previous else None
    tick = subscription_manager.latest_ticks.get(key)
    tick_age = None
    if tick and tick.get("received_at"):
        try:
            tick_age = (datetime.now(timezone.utc) - datetime.fromisoformat(
                tick["received_at"].replace("Z", "+00:00"))).total_seconds()
        except (TypeError, ValueError):
            tick_age = None
    live = bool(tick and tick.get("feed_type") == "live_feed" and tick.get("ltp") is not None and tick_age is not None
                and tick_age <= get_settings().UPSTOX_STALE_SECONDS)
    spot = float(tick["ltp"]) if live else (intraday[-1]["close"] if intraday else previous[-1]["close"])
    levels = []
    if prior:
        high, low, close = float(prior["high"]), float(prior["low"]), float(prior["close"])
        pivot = (high + low + close) / 3.0
        levels.extend([
            {"kind": "PREVIOUS_DAY_LOW", "value": low, "source": "Upstox Historical Candle V3", "timestamp": prior["time_iso"]},
            {"kind": "PREVIOUS_DAY_HIGH", "value": high, "source": "Upstox Historical Candle V3", "timestamp": prior["time_iso"]},
            {"kind": "PIVOT_S1", "value": 2.0 * pivot - high, "source": "Classic pivot from previous daily OHLC", "timestamp": prior["time_iso"]},
            {"kind": "PIVOT_R1", "value": 2.0 * pivot - low, "source": "Classic pivot from previous daily OHLC", "timestamp": prior["time_iso"]},
        ])
    if intraday:
        intraday_low = min(candle["low"] for candle in intraday)
        intraday_high = max(candle["high"] for candle in intraday)
        levels.extend([
            {"kind": "INTRADAY_LOW", "value": intraday_low, "source": "Upstox Intraday Candle V3", "timestamp": intraday[-1]["time_iso"]},
            {"kind": "INTRADAY_HIGH", "value": intraday_high, "source": "Upstox Intraday Candle V3", "timestamp": intraday[-1]["time_iso"]},
        ])
    supports = sorted((item for item in levels if item["value"] <= spot), key=lambda item: item["value"], reverse=True)[:3]
    resistances = sorted((item for item in levels if item["value"] >= spot), key=lambda item: item["value"])[:3]
    return {"symbol": symbol.upper(), "instrument_key": key, "spot_price": spot,
            "status": "LIVE" if live else "STALE" if tick else "WAITING",
            "source": "Upstox Historical Candle V3 and live V3 when received",
            "exchange_timestamp": tick.get("exchange_timestamp") if live else None,
            "server_received_timestamp": tick.get("received_at") if live else None,
            "data_age_seconds": max(0, round(tick_age, 1)) if live and tick_age is not None else None,
            "all_levels": levels, "supports": supports, "resistances": resistances,
            "note": "Price levels are historical/pivot references; live status describes the underlying quote, not a guaranteed support or resistance."}


@router.get("/chain")
async def get_option_chain(
    symbol: str = Query("NIFTY", description="NIFTY, BANKNIFTY or F&O constituent stock"),
    strike_range: int = Query(5, ge=5, le=25, description="Number of strikes above and below ATM"),
    expiry: Optional[str] = Query(None, description="Target expiry date (e.g. 20-NOV-2026)"),
    snapshot_time: Optional[str] = Query(None, description="Optional ISO timestamp of a past snapshot")
) -> Dict[str, Any]:
    """Return a chain built from Upstox's official option-chain response or historical snapshot."""
    if snapshot_time and isinstance(snapshot_time, str):
        from app.database.session import SessionLocal
        from app.models.option_snapshot import OptionOISnapshotModel
        db = SessionLocal()
        try:
            snap_dt = datetime.fromisoformat(snapshot_time.replace("Z", "+00:00"))
            records = (
                db.query(OptionOISnapshotModel)
                .filter(
                    OptionOISnapshotModel.underlying == symbol.upper(),
                    OptionOISnapshotModel.captured_at == snap_dt
                )
                .all()
            )
            if records:
                by_strike: Dict[float, Dict[str, Any]] = {}
                for r in records:
                    s = float(r.strike_price)
                    if s not in by_strike:
                        by_strike[s] = {"strike_price": s, "ce": {}, "pe": {}}
                    side = "ce" if r.option_type == "CE" else "pe"
                    by_strike[s][side] = {
                        "instrument_key": r.instrument_key,
                        "oi": r.open_interest,
                        "ltp": r.ltp,
                        "volume": r.volume,
                        "classification": "OTM",
                        "buildup": "Historical Snapshot"
                    }
                sorted_strikes = sorted(by_strike.keys())
                rows = [by_strike[s] for s in sorted_strikes]
                total_ce_oi = sum(r["ce"].get("oi", 0) for r in rows)
                total_pe_oi = sum(r["pe"].get("oi", 0) for r in rows)
                return {
                    "symbol": symbol.upper(),
                    "instrument_key": upstox.instrument_key_for_symbol(symbol.upper()) or "HISTORICAL",
                    "expiry": records[0].expiry if records else expiry,
                    "source": "DATABASE_SNAPSHOT_ARCHIVE",
                    "spot_price": sorted_strikes[len(sorted_strikes) // 2] if sorted_strikes else 25000.0,
                    "atm_strike": sorted_strikes[len(sorted_strikes) // 2] if sorted_strikes else 25000.0,
                    "rows": rows,
                    "totals": {
                        "total_call_oi": total_ce_oi,
                        "total_put_oi": total_pe_oi,
                        "oi_pcr": round(total_pe_oi / total_ce_oi, 3) if total_ce_oi else 1.0,
                    },
                    "data_status": "HISTORICAL_SNAPSHOT",
                    "snapshot_time": snapshot_time
                }
        except Exception as snap_err:
            logger.warning("Failed to load snapshot %s: %s", snapshot_time, snap_err)
        finally:
            db.close()
    key = upstox.instrument_key_for_symbol(symbol.upper())
    if not key:
        raise HTTPException(status_code=404, detail="No Upstox underlying instrument key for symbol")
    try:
        contracts = await upstox.get_option_contracts(key)
        # A successful authenticated contracts response is enough to start the
        # shared feed manager when the overview or chain page is opened directly.
        subscription_manager.authentication_status = "AUTHENTICATED"
        subscription_manager.start()
        expiries = upstox.unique_expiries(contracts)
        selected = expiry or (expiries[0] if expiries else None)
        if not selected or selected not in expiries:
            raise HTTPException(status_code=400, detail="Expiry is not present in Upstox option contracts")
        raw = await upstox.get_option_chain(key, selected)
        if not raw:
            raise HTTPException(status_code=404, detail="Upstox returned no option-chain rows")
        subscription_manager.register_option_chain(symbol.upper(), raw)
        spot = float(raw[0]["underlying_spot_price"])
        total_call_oi = total_put_oi = total_call_vol = total_put_vol = 0
        total_call_change = total_put_change = 0
        for item in raw:
            for side, is_call in (("call_options", True), ("put_options", False)):
                market = (item.get(side) or {}).get("market_data") or {}
                oi, previous_oi, volume = market.get("oi"), market.get("prev_oi"), market.get("volume")
                if oi is not None:
                    if is_call: total_call_oi += float(oi)
                    else: total_put_oi += float(oi)
                if volume is not None:
                    if is_call: total_call_vol += int(volume)
                    else: total_put_vol += int(volume)
                if oi is not None and previous_oi is not None:
                    change = float(oi) - float(previous_oi)
                    if is_call: total_call_change += change
                    else: total_put_change += change
        strikes = sorted({float(row["strike_price"]) for row in raw})
        contract = next((item for item in contracts if item.get("expiry") == selected), {})
        atm_index = min(range(len(strikes)), key=lambda i: abs(strikes[i] - spot))
        lower, upper = max(0, atm_index - strike_range), min(len(strikes), atm_index + strike_range + 1)
        kept_strikes = set(strikes[lower:upper])
        rows = []
        for item in raw:
            strike = float(item["strike_price"])
            if strike not in kept_strikes:
                continue
            row = {"strike_price": strike, "is_atm": strike == strikes[atm_index]}
            ce_score = 0
            pe_score = 0
            ce_code = "N/A"
            pe_code = "N/A"

            for name, side, is_call in (("ce", "call_options", True), ("pe", "put_options", False)):
                option = item.get(side) or {}
                market = option.get("market_data") or {}
                greeks = option.get("option_greeks") or {}
                oi, prev_oi = market.get("oi"), market.get("prev_oi")
                oi_change = (float(oi) - float(prev_oi)) if oi is not None and prev_oi is not None else None
                ltp, close = market.get("ltp"), market.get("close_price")
                price_change = float(ltp) - float(close) if ltp is not None and close is not None else None
                volume = market.get("volume")

                buildup, code, leg_score = classify_option_pattern_and_score(price_change, oi_change, is_call=is_call)
                if is_call:
                    ce_score = leg_score
                    ce_code = code
                else:
                    pe_score = leg_score
                    pe_code = code

                row[name] = {"instrument_key": option.get("instrument_key"), "ltp": ltp,
                    "change": price_change,
                    "change_pct": (price_change / float(close) * 100) if close not in (None, 0) and price_change is not None else None,
                    "previous_close": close, "oi": oi, "previous_oi": prev_oi,
                    "oi_change": oi_change, "volume": volume,
                    "iv": greeks.get("iv"), "delta": greeks.get("delta"), "gamma": greeks.get("gamma"),
                    "theta": greeks.get("theta"), "vega": greeks.get("vega"),
                    "bid_price": market.get("bid_price"), "ask_price": market.get("ask_price"),
                    "bid_qty": market.get("bid_qty"), "ask_qty": market.get("ask_qty"),
                    "classification": ("ITM" if (strike < spot if is_call else strike > spot) else "OTM" if (strike > spot if is_call else strike < spot) else "ATM"),
                    "buildup": buildup,
                    "pattern_code": code,
                    "score": leg_score}

            row["quant_score"] = ce_score + pe_score
            row["total_score"] = ce_score + pe_score
            row["market_view"] = get_market_view(ce_score + pe_score)
            row["ce_pattern_code"] = ce_code
            row["ce_score"] = ce_score
            row["pe_pattern_code"] = pe_code
            row["pe_score"] = pe_score
            rows.append(row)
        requested_keys = [leg.get("instrument_key") for row in rows for leg in (row.get("ce"), row.get("pe")) if leg and leg.get("instrument_key")]
        subscription_manager.prioritize_instruments([key, *requested_keys])
        await subscription_manager.set_subscriptions([key, *requested_keys], mode="full")
        max_pain_rows = []
        observed_oi = 0.0
        for item in raw:
            for side in ("call_options", "put_options"):
                market = (item.get(side) or {}).get("market_data") or {}
                if market.get("oi") is not None:
                    observed_oi += float(market["oi"])
        for settle in strikes:
            call_payout = sum(float((r.get("call_options") or {}).get("market_data", {}).get("oi") or 0) * max(0, settle - float(r["strike_price"])) for r in raw)
            put_payout = sum(float((r.get("put_options") or {}).get("market_data", {}).get("oi") or 0) * max(0, float(r["strike_price"]) - settle) for r in raw)
            max_pain_rows.append({"hypothetical_expiry_price": settle, "ce_payout": call_payout,
                                  "pe_payout": put_payout, "total_payout": call_payout + put_payout})
        max_pain = min(max_pain_rows, key=lambda x: x["total_payout"])["hypothetical_expiry_price"] if observed_oi > 0 and max_pain_rows else None
        put_candidates = [r for r in rows if r["strike_price"] <= spot and (r["pe"].get("oi") or 0) > 0]
        call_candidates = [r for r in rows if r["strike_price"] >= spot and (r["ce"].get("oi") or 0) > 0]
        support = max(put_candidates, key=lambda r: r["pe"]["oi"]) if put_candidates else None
        resistance = max(call_candidates, key=lambda r: r["ce"]["oi"]) if call_candidates else None

        # S2: Next eligible put OI concentration below S1 (or next highest put candidate)
        s2_candidates = [r for r in put_candidates if support and r["strike_price"] < support["strike_price"]]
        if not s2_candidates and put_candidates:
            s2_candidates = [r for r in put_candidates if r["strike_price"] != support["strike_price"]]
        secondary_support = max(s2_candidates, key=lambda r: r["pe"]["oi"]) if s2_candidates else None

        # R2: Next eligible call OI concentration above R1 (or next highest call candidate)
        r2_candidates = [r for r in call_candidates if resistance and r["strike_price"] > resistance["strike_price"]]
        if not r2_candidates and call_candidates:
            r2_candidates = [r for r in call_candidates if r["strike_price"] != resistance["strike_price"]]
        secondary_resistance = max(r2_candidates, key=lambda r: r["ce"]["oi"]) if r2_candidates else None

        # Build formal S1/S2/R1/R2 levels table
        levels_table = []
        if support:
            levels_table.append({
                "level": "S1",
                "strike": support["strike_price"],
                "total_oi": support["pe"].get("oi", 0),
                "oi_change": support["pe"].get("oi_change", 0),
                "volume": support["pe"].get("volume", 0),
                "strength": "Strong Institutional Floor",
                "reason": "Highest observed put OI concentration at or below spot"
            })
        if secondary_support:
            levels_table.append({
                "level": "S2",
                "strike": secondary_support["strike_price"],
                "total_oi": secondary_support["pe"].get("oi", 0),
                "oi_change": secondary_support["pe"].get("oi_change", 0),
                "volume": secondary_support["pe"].get("volume", 0),
                "strength": "Secondary Support Cushion",
                "reason": "Next eligible put OI concentration below S1"
            })
        if resistance:
            levels_table.append({
                "level": "R1",
                "strike": resistance["strike_price"],
                "total_oi": resistance["ce"].get("oi", 0),
                "oi_change": resistance["ce"].get("oi_change", 0),
                "volume": resistance["ce"].get("volume", 0),
                "strength": "Primary Overhead Supply Barrier",
                "reason": "Highest observed call OI concentration at or above spot"
            })
        if secondary_resistance:
            levels_table.append({
                "level": "R2",
                "strike": secondary_resistance["strike_price"],
                "total_oi": secondary_resistance["ce"].get("oi", 0),
                "oi_change": secondary_resistance["ce"].get("oi_change", 0),
                "volume": secondary_resistance["ce"].get("volume", 0),
                "strength": "Secondary Resistance Ceiling",
                "reason": "Next eligible call OI concentration above R1"
            })

        atm_row = next((item for item in raw if float(item["strike_price"]) == strikes[atm_index]), {})
        atm_ivs = [float((atm_row.get(side) or {}).get("option_greeks", {}).get("iv"))
                   for side in ("call_options", "put_options")
                   if (atm_row.get(side) or {}).get("option_greeks", {}).get("iv") is not None]
        atm_chain_row = next((r for r in rows if r.get("is_atm")), rows[len(rows)//2] if rows else {})
        totals_dict = {
            "total_call_oi": total_call_oi, "total_put_oi": total_put_oi,
            "total_call_volume": total_call_vol, "total_put_volume": total_put_vol,
            "oi_pcr": total_put_oi / total_call_oi if total_call_oi else None,
            "vol_pcr": total_put_vol / total_call_vol if total_call_vol else None,
            "oi_change_pcr": total_put_change / total_call_change if total_call_change else None,
            "total_call_oi_change": total_call_change, "total_put_oi_change": total_put_change,
            "total_score": atm_chain_row.get("total_score", 0),
            "market_view": atm_chain_row.get("market_view", "Sideways / Confusion"),
            "ce_score": atm_chain_row.get("ce_score", 0),
            "pe_score": atm_chain_row.get("pe_score", 0),
        }
        return {"symbol": symbol.upper(), "instrument_key": key, "expiry": selected,
            "source": "/v2/option/chain", "spot_price": spot, "atm_strike": strikes[atm_index],
            "lot_size": contract.get("lot_size"),
            "strike_step": min((b - a for a, b in zip(strikes, strikes[1:])), default=None), "rows": rows,
            "totals": totals_dict,
            "exposures": {"atm_iv_pct": round(sum(atm_ivs) / len(atm_ivs), 2) if atm_ivs else None},
            "max_pain": {"max_pain_strike": max_pain, "payout_table": max_pain_rows if observed_oi > 0 else [],
                         "observed_oi": observed_oi},
            "support_resistance": {
                "strong_support": {"strike": support["strike_price"], "reason": "Highest observed put OI at or below spot"} if support else None,
                "strong_resistance": {"strike": resistance["strike_price"], "reason": "Highest observed call OI at or above spot"} if resistance else None,
                "s1": {"strike": support["strike_price"], "total_oi": support["pe"].get("oi", 0), "oi_change": support["pe"].get("oi_change", 0), "volume": support["pe"].get("volume", 0), "strength": "Strong Institutional Floor", "reason": "Highest observed put OI at or below spot"} if support else None,
                "s2": {"strike": secondary_support["strike_price"], "total_oi": secondary_support["pe"].get("oi", 0), "oi_change": secondary_support["pe"].get("oi_change", 0), "volume": secondary_support["pe"].get("volume", 0), "strength": "Secondary Support Cushion", "reason": "Next eligible put OI below S1"} if secondary_support else None,
                "r1": {"strike": resistance["strike_price"], "total_oi": resistance["ce"].get("oi", 0), "oi_change": resistance["ce"].get("oi_change", 0), "volume": resistance["ce"].get("volume", 0), "strength": "Primary Overhead Supply Barrier", "reason": "Highest observed call OI at or above spot"} if resistance else None,
                "r2": {"strike": secondary_resistance["strike_price"], "total_oi": secondary_resistance["ce"].get("oi", 0), "oi_change": secondary_resistance["ce"].get("oi_change", 0), "volume": secondary_resistance["ce"].get("volume", 0), "strength": "Secondary Resistance Ceiling", "reason": "Next eligible call OI above R1"} if secondary_resistance else None,
                "levels_table": levels_table
            },
            "data_status": subscription_manager.get_status()["status"]}
    except UpstoxApiError as exc:
        if exc.status_code in (401, 403):
            subscription_manager.authentication_status = "FAILED"
            subscription_manager.status = "DISCONNECTED"
        raise HTTPException(status_code=exc.status_code or 503, detail=exc.message)
    except Exception as exc:
        return options_analytics_engine.get_option_chain(symbol=symbol.upper(), strike_range=strike_range, expiry=expiry)


@router.get("/strategy-payoff")
async def get_strategy_payoff(
    strategy: str = Query("BULL_CALL_SPREAD", description="Strategy name e.g. BULL_CALL_SPREAD, IRON_CONDOR, STRADDLE"),
    symbol: str = Query("NIFTY"),
    expiry: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Calculate hypothetical expiry payoff from actual Upstox option-chain premiums with demo fallback."""
    key = upstox.instrument_key_for_symbol(symbol.upper())
    try:
        if not key:
            raise UpstoxApiError(404, "No key", "/payoff")
        contracts = await upstox.get_option_contracts(key)
        expiries = upstox.unique_expiries(contracts)
        selected = expiry or (expiries[0] if expiries else None)
        if not selected or selected not in expiries:
            raise HTTPException(status_code=400, detail="Expiry is not present in Upstox option contracts")
        raw = await upstox.get_option_chain(key, selected)
        if not raw:
            raise HTTPException(status_code=404, detail="Upstox returned no option-chain rows")
    except (UpstoxApiError, Exception):
        return options_analytics_engine.calculate_strategy_payoff(strategy_name=strategy, spot=24000.0, lot_size=25)

    spot = float(raw[0]["underlying_spot_price"])
    strikes = sorted({float(row["strike_price"]) for row in raw})
    atm_idx = min(range(len(strikes)), key=lambda index: abs(strikes[index] - spot))
    step = min((b - a for a, b in zip(strikes, strikes[1:])), default=50.0)
    strategy_key = strategy.upper().replace(" ", "_")
    structures = {
        "LONG_CALL": [("CE", 0, "BUY", 1)], "SHORT_CALL": [("CE", 1, "SELL", 1)],
        "LONG_PUT": [("PE", 0, "BUY", 1)], "SHORT_PUT": [("PE", -1, "SELL", 1)],
        "BULL_CALL_SPREAD": [("CE", 0, "BUY", 1), ("CE", 4, "SELL", 1)],
        "BEAR_PUT_SPREAD": [("PE", 0, "BUY", 1), ("PE", -4, "SELL", 1)],
        "BULL_PUT_SPREAD": [("PE", 0, "SELL", 1), ("PE", -4, "BUY", 1)],
        "BEAR_CALL_SPREAD": [("CE", 0, "SELL", 1), ("CE", 4, "BUY", 1)],
        "LONG_STRADDLE": [("CE", 0, "BUY", 1), ("PE", 0, "BUY", 1)],
        "SHORT_STRADDLE": [("CE", 0, "SELL", 1), ("PE", 0, "SELL", 1)],
        "LONG_STRANGLE": [("CE", 3, "BUY", 1), ("PE", -3, "BUY", 1)],
        "SHORT_STRANGLE": [("CE", 3, "SELL", 1), ("PE", -3, "SELL", 1)],
        "IRON_CONDOR": [("PE", -6, "BUY", 1), ("PE", -3, "SELL", 1),
                        ("CE", 3, "SELL", 1), ("CE", 6, "BUY", 1)],
        "BUTTERFLY": [("CE", -3, "BUY", 1), ("CE", 0, "SELL", 2), ("CE", 3, "BUY", 1)],
    }
    structure = structures.get(strategy_key)
    if not structure:
        raise HTTPException(status_code=400, detail="Unsupported strategy")

    lot_size = next((int(item["lot_size"]) for item in contracts if item.get("expiry") == selected and item.get("lot_size")), None)
    if not lot_size:
        raise HTTPException(status_code=503, detail="Upstox did not return a lot size for the selected expiry")
    market_legs = []
    for option_type, offset, action, quantity_multiplier in structure:
        strike_idx = atm_idx + offset
        if strike_idx < 0 or strike_idx >= len(strikes):
            raise HTTPException(status_code=422, detail="Selected expiry does not provide enough strikes for this strategy")
        strike = strikes[strike_idx]
        row = next((item for item in raw if float(item["strike_price"]) == strike), None)
        side = "call_options" if option_type == "CE" else "put_options"
        option = (row or {}).get(side) or {}
        market = option.get("market_data") or {}
        premium = market.get("ltp")
        if premium is None or float(premium) <= 0:
            raise HTTPException(status_code=503, detail=f"No current Upstox premium is available for {option_type} {strike:g}")
        market_legs.append({"type": option_type, "action": action, "strike": strike,
                            "premium": float(premium), "qty": lot_size * quantity_multiplier,
                            "instrument_key": option.get("instrument_key")})
    try:
        result = options_analytics_engine.calculate_strategy_payoff(
            strategy_name=strategy_key, spot=spot, lot_size=lot_size,
            params={"center": strikes[atm_idx], "price_step": step, "range_steps": max(25, int(1500 / step))},
            market_legs=market_legs)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    result.update({"symbol": symbol.upper(), "expiry": selected, "instrument_key": key,
                   "premium_source": "/v2/option/chain", "is_market_quote": True,
                   "observed_at": datetime.now(timezone.utc).isoformat()})
    return result


@router.get("/market-regime")
async def get_market_regime(
    spot: float = Query(23532.70, description="Underlying spot price")
) -> Dict[str, Any]:
    """Regime analysis needs verified intraday anchors not supplied by option-chain snapshots."""
    raise HTTPException(status_code=503, detail="Market regime is unavailable until verified intraday VWAP data is available")


@router.get("/alerts")
async def get_options_alerts() -> Dict[str, Any]:
    """Retrieve active market and data quality alerts."""
    return {
        "alerts": alerts_and_monitoring_service.get_active_alerts()
    }


@router.get("/data-quality")
async def get_data_quality() -> Dict[str, Any]:
    """Retrieve live feed health, protobuf version, and honest DEMO vs LIVE status."""
    return alerts_and_monitoring_service.get_data_quality_report()
