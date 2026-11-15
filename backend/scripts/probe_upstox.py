"""Probe official Upstox endpoints. Never prints the access token."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import upstox_market_client as client


def summarize_contract(item: dict) -> dict:
    keys = sorted(item.keys())
    return {
        "keys": keys,
        "expiry": item.get("expiry"),
        "instrument_type": item.get("instrument_type"),
        "strike_price": item.get("strike_price"),
        "lot_size": item.get("lot_size"),
        "weekly": item.get("weekly"),
        "has_instrument_key": bool(item.get("instrument_key")),
        "underlying_symbol": item.get("underlying_symbol"),
    }


def summarize_chain_row(item: dict) -> dict:
    call = item.get("call_options") or {}
    market = call.get("market_data") or {}
    greeks = call.get("option_greeks") or {}
    return {
        "row_keys": sorted(item.keys()),
        "call_keys": sorted(call.keys()),
        "market_data_keys": sorted(market.keys()),
        "greeks_keys": sorted(greeks.keys()),
        "strike_price": item.get("strike_price"),
        "underlying_spot_price": item.get("underlying_spot_price"),
        "expiry": item.get("expiry"),
    }


async def main() -> None:
    report = {"steps": []}
    try:
        profile = await client.get_user_profile()
        report["steps"].append({
            "endpoint": "/v2/user/profile",
            "ok": True,
            "authenticated": profile.get("authenticated"),
            "is_active": profile.get("is_active"),
            "user_id_present": bool(profile.get("user_id")),
            "exchange_count": len(profile.get("exchanges") or []),
        })
    except Exception as exc:
        report["steps"].append({"endpoint": "/v2/user/profile", "ok": False, "error": str(exc)[:300]})
        print(json.dumps(report, indent=2))
        return

    try:
        contracts = await client.get_option_contracts(client.NIFTY_INSTRUMENT_KEY)
        expiries = client.unique_expiries(contracts)
        report["steps"].append({
            "endpoint": "/v2/option/contract",
            "ok": True,
            "instrument_key": client.NIFTY_INSTRUMENT_KEY,
            "contract_count": len(contracts),
            "expiry_count": len(expiries),
            "first_expiries": expiries[:6],
            "sample": summarize_contract(contracts[0]) if contracts else None,
        })
    except Exception as exc:
        report["steps"].append({"endpoint": "/v2/option/contract", "ok": False, "error": str(exc)[:400]})
        print(json.dumps(report, indent=2))
        return

    expiry = expiries[0]
    try:
        chain = await client.get_option_chain(client.NIFTY_INSTRUMENT_KEY, expiry)
        report["steps"].append({
            "endpoint": "/v2/option/chain",
            "ok": True,
            "expiry": expiry,
            "strike_count": len(chain),
            "sample": summarize_chain_row(chain[len(chain) // 2]) if chain else None,
        })
    except Exception as exc:
        report["steps"].append({"endpoint": "/v2/option/chain", "ok": False, "error": str(exc)[:400]})

    from datetime import date, timedelta
    today = date.today().isoformat()
    start = (date.today() - timedelta(days=30)).isoformat()
    try:
        candles = await client.get_historical_candles_v3(
            client.NIFTY_INSTRUMENT_KEY, "days", "1", today, start
        )
        parsed = client.parse_candle_row(candles[0]) if candles else None
        report["steps"].append({
            "endpoint": "/v3/historical-candle",
            "ok": True,
            "candle_count": len(candles),
            "row_length": len(candles[0]) if candles else 0,
            "parsed_keys": sorted(parsed.keys()) if parsed else [],
        })
    except Exception as exc:
        report["steps"].append({"endpoint": "/v3/historical-candle", "ok": False, "error": str(exc)[:400]})

    try:
        uri = await client.authorize_market_data_feed()
        report["steps"].append({
            "endpoint": "/v3/feed/market-data-feed/authorize",
            "ok": True,
            "redirect_is_wss": uri.startswith("wss://"),
            "redirect_host": uri.split("/")[2] if uri.startswith("wss://") else None,
        })
    except Exception as exc:
        report["steps"].append({"endpoint": "/v3/feed/market-data-feed/authorize", "ok": False, "error": str(exc)[:400]})

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
