import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.services.constituents_service import constituents_service, TOP_7_HEAVYWEIGHT_SYMBOLS

ALL_BANKING_SYMBOLS = ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK", "INDUSINDBK"]
ALL_TRACKED_SYMBOLS = list(set(TOP_7_HEAVYWEIGHT_SYMBOLS + ALL_BANKING_SYMBOLS))
from app.services.historical_data_service import historical_data_service
from app.services.dma_service import dma_engine
from app.services.crossover_service import crossover_engine
from app.services.volume_service import volume_engine
from app.services import upstox_market_client as upstox

logger = logging.getLogger("heavyweight_service")


class HeavyweightAnalyticsEngine:
    """
    Dedicated analytics engine for the Top 7 NIFTY 50 heavyweight stocks:
    HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, INFY.
    Features:
    - Real-time market metrics
    - 6-Session volume history table
    - Volume trend & RVOL analytics
    - Six DMA technical alignment & support levels
    - Approximate NIFTY contribution (Weightage % * Price Change % / 100)
    - Concentration and breadths analysis (Supporters vs Draggers)
    """

    @classmethod
    async def get_heavyweight_details(cls, symbol: str) -> Optional[Dict[str, Any]]:
        clean_sym = symbol.strip().upper()
        if clean_sym not in ALL_TRACKED_SYMBOLS:
            return None

        constituent = constituents_service.get_by_symbol(clean_sym)
        if not constituent:
            return None

        hist = await historical_data_service.fetch_symbol_history(clean_sym)
        candles = hist.get("candles", [])

        if not candles or len(candles) < 6:
            return None

        # Check if live intraday 1-minute candles are available from Upstox
        intra = []
        try:
            key = upstox.instrument_key_for_symbol(clean_sym)
            if key:
                intra = await upstox.get_intraday_candles_v3(key, "minutes", "1")
        except Exception as e:
            logger.debug("Could not fetch intraday candles for %s: %s", clean_sym, e)

        if intra and len(intra) >= 1:
            recent_candle = candles[-1]
            prev_close = recent_candle["close"]
            ltp = float(intra[0][4])
            open_p = float(intra[-1][1])
            high_p = max(float(c[2]) for c in intra)
            low_p = min(float(c[3]) for c in intra)
            cumulative_volume = int(sum(c[5] for c in intra))
            price_change = round(ltp - prev_close, 2)
            price_change_pct = round(((ltp - prev_close) / prev_close) * 100.0, 2) if prev_close > 0 else 0.0
            traded_value = round(cumulative_volume * ltp, 2)
            today_date = str(intra[0][0])[:10]

            combined_candles = candles[-5:] + [{
                "trading_date": today_date,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": ltp,
                "volume": cumulative_volume
            }]
            closes = [c["close"] for c in candles[:-1]] + [ltp]
            dates = [c["trading_date"] for c in candles[:-1]] + [today_date]
            vol_data = volume_engine.analyze_stock_volume(clean_sym, combined_candles)
        else:
            # Check if historical archive is behind latest trading session; if so, pull live/latest session from Yahoo Finance
            from zoneinfo import ZoneInfo
            from app.services.market_data_service import get_latest_trading_session_iso
            latest_session_iso = get_latest_trading_session_iso()
            if candles[-1].get("trading_date", "") < latest_session_iso:
                try:
                    import httpx
                    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{clean_sym}.NS?interval=1d&range=5d"
                    async with httpx.AsyncClient(timeout=5.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
                        resp = await client.get(url)
                        if resp.status_code == 200:
                            res = (resp.json().get("chart", {}).get("result") or [{}])[0]
                            meta = res.get("meta", {})
                            ts_list = res.get("timestamp") or []
                            q = (res.get("indicators", {}).get("quote") or [{}])[0]
                            reg_price = meta.get("regularMarketPrice")
                            for idx, ts in enumerate(ts_list):
                                dt_str = datetime.fromtimestamp(ts, tz=ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
                                if dt_str > candles[-1].get("trading_date", ""):
                                    o = q.get("open", [None])[idx]
                                    h = q.get("high", [None])[idx]
                                    l = q.get("low", [None])[idx]
                                    c = q.get("close", [None])[idx]
                                    v = q.get("volume", [None])[idx]
                                    if idx == len(ts_list) - 1 and c is None and reg_price is not None:
                                        c = reg_price
                                    if c is not None and v is not None:
                                        candles.append({
                                            "trading_date": dt_str,
                                            "open": round(float(o or c), 2),
                                            "high": round(float(h or c), 2),
                                            "low": round(float(l or c), 2),
                                            "close": round(float(c), 2),
                                            "volume": int(v),
                                        })
                except Exception as y_err:
                    logger.debug("Yahoo fallback failed for %s: %s", clean_sym, y_err)

            recent_candle = candles[-1]
            prev_candle = candles[-2] if len(candles) >= 2 else recent_candle
            closes = [c["close"] for c in candles]
            dates = [c["trading_date"] for c in candles]

            # A. Live Market Data
            ltp = recent_candle["close"]
            open_p = recent_candle["open"]
            high_p = recent_candle["high"]
            low_p = recent_candle["low"]
            prev_close = prev_candle["close"]
            price_change = round(ltp - prev_close, 2)
            price_change_pct = round(((ltp - prev_close) / prev_close) * 100.0, 2) if prev_close > 0 else 0.0
            cumulative_volume = int(recent_candle["volume"]) if recent_candle.get("volume") is not None else None
            traded_value = round(cumulative_volume * ltp, 2) if cumulative_volume is not None else None
            vol_data = volume_engine.analyze_stock_volume(clean_sym, candles)

        # D. Technical DMA Analytics
        smas = dma_engine.calculate_all_smas(closes)
        classification = dma_engine.classify_stock(ltp, smas)
        fresh_crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)

        # E. Weightage Impact
        weightage = constituent.get("weightage", 0.0)
        # Approximate Stock Contribution (percentage points) = Stock Index Weightage (%) * Stock Price Change (%) / 100
        approx_contribution = round((weightage * price_change_pct) / 100.0, 4)

        return {
            "symbol": clean_sym,
            "company_name": constituent.get("company_name"),
            "sector": constituent.get("sector"),
            "industry": constituent.get("industry"),
            "isin": constituent.get("isin"),
            "weightage": weightage,
            # A. Live Market Data
            "market_data": {
                "ltp": round(ltp, 2),
                "current_price": round(ltp, 2),
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "previous_close": round(prev_close, 2),
                "price_change": round(price_change, 2),
                "price_change_pct": round(price_change_pct, 2),
                "cumulative_volume": cumulative_volume,
                "traded_value_rupees": traded_value,
                "update_timestamp": hist.get("retrieval_timestamp") or datetime.now(timezone.utc).isoformat()
            },
            # B. 6-Session Volume History Table
            "six_session_history": vol_data.get("six_session_history", []),
            # C. Volume Analytics
            "volume_analytics": {
                "six_session_avg_volume": vol_data.get("six_session_avg_volume"),
                "latest_volume": cumulative_volume,
                "rvol": vol_data.get("rvol"),
                "volume_change_pct": vol_data.get("volume_change_pct"),
                "volume_trend": vol_data.get("volume_trend"),
                "volume_classification": vol_data.get("volume_classification"),
                "price_volume_confirmation": vol_data.get("price_volume_confirmation"),
                "historical_volumes": [s.get("traded_volume", 0) for s in vol_data.get("six_session_history", [])]
            },
            # D. Technical Analytics
            "technical_analytics": {
                "smas": {k: round(v, 2) if v is not None else None for k, v in smas.items()},
                "distances": {k: round(v, 2) if v is not None else None for k, v in classification["distances"].items()},
                "score": classification["score"],
                "classification": classification["classification"],
                "is_6_6": classification["is_6_6"],
                "is_5_6": classification["is_5_6"],
                "failed_dma": classification.get("failed_dma"),
                "failed_dma_label": classification.get("failed_dma_label"),
                "closest_support_dma": classification.get("closest_support_dma"),
                "closest_support_value": classification.get("closest_support_value"),
                "fresh_crossovers": fresh_crossovers
            },
            # E. Weightage Impact
            "contribution_pts": approx_contribution,
            "weightage_impact": {
                "index_weightage_pct": weightage,
                "stock_price_change_pct": round(price_change_pct, 2),
                "approx_index_contribution_pts": approx_contribution,
                "estimated_nifty_points_contribution": approx_contribution,
                "label": "Approximation based on index weightage (not official index-point contribution)",
                "impact_status": "SUPPORTING" if approx_contribution > 0 else ("DRAGGING" if approx_contribution < 0 else "NEUTRAL")
            }
        }

    @classmethod
    async def get_all_heavyweights_report(cls) -> Dict[str, Any]:
        """
        Aggregate detailed tracking and impact analytics for all Top 7 heavyweights.
        """
        items = []
        for sym in TOP_7_HEAVYWEIGHT_SYMBOLS:
            detail = await cls.get_heavyweight_details(sym)
            if detail:
                items.append(detail)

        # Sort by weightage descending
        items.sort(key=lambda x: x["weightage"], reverse=True)

        combined_weight = round(sum(item["weightage"] for item in items), 2)
        combined_contribution = round(sum(item["weightage_impact"]["approx_index_contribution_pts"] for item in items), 4)

        supporters = [item for item in items if item["weightage_impact"]["approx_index_contribution_pts"] > 0]
        draggers = [item for item in items if item["weightage_impact"]["approx_index_contribution_pts"] < 0]

        top_supporter = max(items, key=lambda x: x["weightage_impact"]["approx_index_contribution_pts"]) if items else None
        top_dragger = min(items, key=lambda x: x["weightage_impact"]["approx_index_contribution_pts"]) if items else None

        # Concentration Analysis
        sorted_by_abs_contrib = sorted(items, key=lambda x: abs(x["weightage_impact"]["approx_index_contribution_pts"]), reverse=True)
        top2_contrib = sum(abs(x["weightage_impact"]["approx_index_contribution_pts"]) for x in sorted_by_abs_contrib[:2])
        total_abs_contrib = sum(abs(x["weightage_impact"]["approx_index_contribution_pts"]) for x in items)

        concentration_pct = round((top2_contrib / total_abs_contrib) * 100.0, 1) if total_abs_contrib > 0 else 0.0
        if concentration_pct >= 60.0:
            concentration_desc = f"Highly concentrated: Top 2 heavyweights ({sorted_by_abs_contrib[0]['symbol']}, {sorted_by_abs_contrib[1]['symbol']}) drive {concentration_pct}% of heavyweight movement."
        else:
            concentration_desc = f"Broad-based: Heavyweight contribution is distributed across multiple stocks."

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "heavyweight_count": len(items),
            "combined_weightage_pct": combined_weight,
            "combined_estimated_contribution_pts": combined_contribution,
            "top_supporter": {
                "symbol": top_supporter["symbol"],
                "company_name": top_supporter["company_name"],
                "contribution_pts": top_supporter["weightage_impact"]["approx_index_contribution_pts"],
                "price_change_pct": top_supporter["market_data"]["price_change_pct"]
            } if top_supporter else None,
            "top_dragger": {
                "symbol": top_dragger["symbol"],
                "company_name": top_dragger["company_name"],
                "contribution_pts": top_dragger["weightage_impact"]["approx_index_contribution_pts"],
                "price_change_pct": top_dragger["market_data"]["price_change_pct"]
            } if top_dragger else None,
            "concentration_ratio_top2_pct": concentration_pct,
            "concentration_analysis": concentration_desc,
            "supporters_count": len(supporters),
            "draggers_count": len(draggers),
            "heavyweights": items
        }

    @classmethod
    async def get_banking_sector_report(cls) -> Dict[str, Any]:
        """
        Dedicated volume analytics and tracking suite for all NIFTY 50 Banking sector constituents.
        """
        items = []
        for sym in ALL_BANKING_SYMBOLS:
            detail = await cls.get_heavyweight_details(sym)
            if detail:
                items.append(detail)

        items.sort(key=lambda x: x["weightage"], reverse=True)
        combined_weight = round(sum(item["weightage"] for item in items), 2)
        combined_contribution = round(sum(item["weightage_impact"]["approx_index_contribution_pts"] for item in items), 4)

        supporters = [item for item in items if item["weightage_impact"]["approx_index_contribution_pts"] > 0]
        draggers = [item for item in items if item["weightage_impact"]["approx_index_contribution_pts"] < 0]

        top_supporter = max(items, key=lambda x: x["weightage_impact"]["approx_index_contribution_pts"]) if items else None
        top_dragger = min(items, key=lambda x: x["weightage_impact"]["approx_index_contribution_pts"]) if items else None

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sector": "Banking",
            "stock_count": len(items),
            "combined_weightage_pct": combined_weight,
            "combined_estimated_contribution_pts": combined_contribution,
            "top_supporter": {
                "symbol": top_supporter["symbol"],
                "company_name": top_supporter["company_name"],
                "contribution_pts": top_supporter["weightage_impact"]["approx_index_contribution_pts"],
                "price_change_pct": top_supporter["market_data"]["price_change_pct"]
            } if top_supporter else None,
            "top_dragger": {
                "symbol": top_dragger["symbol"],
                "company_name": top_dragger["company_name"],
                "contribution_pts": top_dragger["weightage_impact"]["approx_index_contribution_pts"],
                "price_change_pct": top_dragger["market_data"]["price_change_pct"]
            } if top_dragger else None,
            "supporters_count": len(supporters),
            "draggers_count": len(draggers),
            "stocks": items
        }


heavyweight_engine = HeavyweightAnalyticsEngine()
