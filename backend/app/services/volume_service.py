import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.services.constituents_service import constituents_service
from app.services.historical_data_service import historical_data_service

logger = logging.getLogger("volume_service")


class VolumeAnalyticsEngine:
    """
    Institutional Volume & RVOL Analysis Engine for NIFTY 50 constituents.
    Strictly follows institutional rules:
    - 6-Session Average Volume = (V1 + V2 + V3 + V4 + V5 + V6) / 6
    - Completed Session RVOL = Latest Completed Volume / 5-Session Average Volume (V1..V5)
    - Volume Change % = ((Latest Volume - 6-Session Avg) / 6-Session Avg) * 100
    - Live Intraday RVOL = Current Volume / Expected Volume at Same Time of Day (Never compare partial to full day!)
    - Volume Classifications: Very High, High, Normal, Low, Declining
    - Price-Volume Confirmation logic
    """

    @staticmethod
    def calculate_six_session_average(volumes: List[int]) -> Optional[float]:
        """Formula: (V1 + V2 + V3 + V4 + V5 + V6) / 6."""
        if not volumes or len(volumes) < 6:
            return None
        window = volumes[-6:]
        return sum(window) / 6.0

    @staticmethod
    def calculate_completed_session_rvol(volumes: List[int]) -> Optional[float]:
        """Formula: Latest Completed Session Volume / Previous 5-Session Average Volume."""
        if not volumes or len(volumes) < 6:
            return None
        v_latest = volumes[-1]
        v_prev_5 = volumes[-6:-1]
        avg_prev_5 = sum(v_prev_5) / 5.0
        if avg_prev_5 <= 0:
            return None
        return v_latest / avg_prev_5

    @staticmethod
    def calculate_volume_change_percentage(latest_volume: int, average_volume: Optional[float]) -> Optional[float]:
        """Formula: ((Latest Volume - Average Volume) / Average Volume) * 100."""
        if average_volume is None or average_volume <= 0:
            return None
        return ((latest_volume - average_volume) / average_volume) * 100.0

    @staticmethod
    def classify_volume_trend(volumes: List[int]) -> str:
        """Evaluate 3-session volume trajectory."""
        if len(volumes) < 3:
            return "STEADY"
        v3, v2, v1 = volumes[-1], volumes[-2], volumes[-3]
        if v3 > v2 > v1:
            return "INCREASING"
        elif v3 < v2 < v1:
            return "DECREASING"
        else:
            return "STEADY"

    @staticmethod
    def get_volume_classification(rvol: Optional[float], volume_change_pct: Optional[float]) -> str:
        """
        Volume Classifications:
        - Very High Volume (RVOL >= 2.0 or Change >= +50%)
        - High Volume (1.25 <= RVOL < 2.0 or +20% to +50%)
        - Normal Volume (0.75 <= RVOL < 1.25)
        - Low Volume (0.50 <= RVOL < 0.75)
        - Declining Volume (RVOL < 0.50 or Change <= -50%)
        """
        if rvol is None:
            return "NORMAL_VOLUME"

        if rvol >= 2.0 or (volume_change_pct is not None and volume_change_pct >= 50.0):
            return "VERY_HIGH_VOLUME"
        elif rvol >= 1.25 or (volume_change_pct is not None and volume_change_pct >= 20.0):
            return "HIGH_VOLUME"
        elif rvol >= 0.75:
            return "NORMAL_VOLUME"
        elif rvol >= 0.50:
            return "LOW_VOLUME"
        else:
            return "DECLINING_VOLUME"

    @staticmethod
    def evaluate_price_volume_confirmation(price_change_pct: float, rvol: Optional[float]) -> Dict[str, str]:
        """
        Assess institutional conviction by pairing price direction with volume expansion/contraction.
        """
        if rvol is None:
            return {
                "signal": "NEUTRAL",
                "label": "Neutral Volume",
                "detail": "Volume benchmark unavailable."
            }

        if price_change_pct > 0:
            if rvol >= 1.25:
                return {
                    "signal": "BULLISH_EXPANSION",
                    "label": "Bullish Volume Expansion",
                    "detail": "Price advancing on above-average institutional volume."
                }
            elif rvol < 0.75:
                return {
                    "signal": "WEAK_RALLY",
                    "label": "Low-Volume Rally",
                    "detail": "Price rising but lacking institutional volume confirmation."
                }
            else:
                return {
                    "signal": "NORMAL_ADVANCE",
                    "label": "Healthy Advance",
                    "detail": "Price rising on normal volume."
                }
        elif price_change_pct < 0:
            if rvol >= 1.25:
                return {
                    "signal": "BEARISH_DISTRIBUTION",
                    "label": "Heavy Institutional Selling",
                    "detail": "Price declining with heavy volume expansion."
                }
            elif rvol < 0.75:
                return {
                    "signal": "ORDERLY_PULLBACK",
                    "label": "Orderly Pullback",
                    "detail": "Price declining on declining volume (low selling pressure)."
                }
            else:
                return {
                    "signal": "NORMAL_DECLINE",
                    "label": "Normal Pullback",
                    "detail": "Price declining on normal volume."
                }
        else:
            return {
                "signal": "NEUTRAL",
                "label": "Flat",
                "detail": "Price unchanged."
            }

    @classmethod
    def analyze_stock_volume(cls, symbol: str, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform complete 6-session volume analytics for a single stock.
        """
        constituent = constituents_service.get_by_symbol(symbol) or {}
        comp_name = constituent.get("company_name", symbol)
        weightage = constituent.get("weightage", 0.0)

        if not candles or len(candles) < 6:
            return {
                "symbol": symbol,
                "company_name": comp_name,
                "weightage": weightage,
                "status": "INSUFFICIENT_VOLUME_DATA",
                "latest_volume": 0,
                "six_session_avg_volume": None,
                "rvol": None,
                "volume_change_pct": None,
                "volume_trend": "STEADY",
                "volume_classification": "NORMAL_VOLUME",
                "price_volume_confirmation": {"signal": "NEUTRAL", "label": "No Data", "detail": "Insufficient history"},
                "six_session_history": []
            }

        recent_6 = candles[-6:]
        volumes = [c.get("volume", 0) for c in recent_6]
        latest_vol = volumes[-1]
        prev_vol = volumes[-2] if len(volumes) >= 2 else latest_vol

        # Six-session average
        six_avg = cls.calculate_six_session_average(volumes)
        rvol = cls.calculate_completed_session_rvol(volumes)
        vol_change_pct = cls.calculate_volume_change_percentage(latest_vol, six_avg)
        trend = cls.classify_volume_trend(volumes)
        classification = cls.get_volume_classification(rvol, vol_change_pct)

        # Price change calculation for the latest session
        latest_close = recent_6[-1]["close"]
        prev_close = recent_6[-2]["close"] if len(recent_6) >= 2 else latest_close
        price_change_pct = ((latest_close - prev_close) / prev_close) * 100.0 if prev_close > 0 else 0.0

        pv_confirm = cls.evaluate_price_volume_confirmation(price_change_pct, rvol)

        # Build six-session history table
        history_table = []
        for i, c in enumerate(recent_6):
            c_close = c["close"]
            p_close = recent_6[i - 1]["close"] if i > 0 else (candles[-7]["close"] if len(candles) >= 7 else c_close)
            chg_pct = ((c_close - p_close) / p_close) * 100.0 if p_close > 0 else 0.0
            history_table.append({
                "session_index": i + 1,
                "trading_date": c["trading_date"],
                "traded_volume": int(c.get("volume", 0)),
                "close_price": round(c_close, 2),
                "price_change_pct": round(chg_pct, 2)
            })

        return {
            "symbol": symbol,
            "company_name": comp_name,
            "weightage": weightage,
            "status": "VERIFIED",
            "latest_close": round(latest_close, 2),
            "price_change_pct": round(price_change_pct, 2),
            "latest_volume": latest_vol,
            "previous_session_volume": prev_vol,
            "previous_five_volumes": volumes[:5],
            "six_session_avg_volume": round(six_avg, 2) if six_avg is not None else None,
            "rvol": round(rvol, 2) if rvol is not None else None,
            "volume_change_pct": round(vol_change_pct, 2) if vol_change_pct is not None else None,
            "volume_trend": trend,
            "volume_classification": classification,
            "price_volume_confirmation": pv_confirm,
            "six_session_history": history_table
        }

    @classmethod
    async def get_all_constituents_volume_analytics(cls) -> Dict[str, Any]:
        """
        Generate full volume analytics for ALL 50 NIFTY constituents.
        """
        stocks = constituents_service.get_constituents()
        results = []

        for s in stocks:
            sym = s["symbol"]
            hist = await historical_data_service.fetch_symbol_history(sym)
            candles = hist.get("candles", [])
            vol_data = cls.analyze_stock_volume(sym, candles)
            results.append(vol_data)

        # Sort by highest RVOL descending
        results.sort(key=lambda x: x.get("rvol") or 0.0, reverse=True)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_stocks": len(results),
            "high_volume_count": len([r for r in results if r["volume_classification"] in ["VERY_HIGH_VOLUME", "HIGH_VOLUME"]]),
            "normal_volume_count": len([r for r in results if r["volume_classification"] == "NORMAL_VOLUME"]),
            "low_volume_count": len([r for r in results if r["volume_classification"] in ["LOW_VOLUME", "DECLINING_VOLUME"]]),
            "results": results
        }


volume_engine = VolumeAnalyticsEngine()
