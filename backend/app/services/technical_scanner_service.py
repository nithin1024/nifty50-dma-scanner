"""
Technical Scanner Service: EMA 9 / EMA 21 & RSI 14 Quantitative Scanner
Implements pure Exponential Moving Average (EMA) and Wilder's RSI algorithms
across all 50 NIFTY constituents with configurable consolidation corridors (RSI 40-60)
and fresh crossover detection.
"""

from typing import List, Dict, Any, Optional
import math
import logging
from app.services.constituents_service import constituents_service
from app.services.historical_data_service import historical_data_service
from app.services.volume_service import volume_engine

logger = logging.getLogger("technical_scanner_service")


class TechnicalScannerService:
    """Quantitative EMA and RSI analytical engine."""

    @staticmethod
    def calculate_ema_series(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculates Exponential Moving Average (EMA) series.
        Formula:
            Multiplier k = 2 / (period + 1)
            EMA_0 = SMA_period
            EMA_t = (Price_t * k) + (EMA_{t-1} * (1 - k))
        """
        if not prices or len(prices) < period:
            return [None] * len(prices)

        ema_series: List[Optional[float]] = [None] * (period - 1)
        # Initial seed is the SMA of the first 'period' prices
        initial_sma = sum(prices[:period]) / period
        ema_series.append(initial_sma)

        k = 2.0 / (period + 1.0)
        current_ema = initial_sma

        for price in prices[period:]:
            current_ema = (price * k) + (current_ema * (1.0 - k))
            ema_series.append(current_ema)

        return ema_series

    @staticmethod
    def calculate_rsi_series(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        Calculates Wilder's Relative Strength Index (RSI 14) series.
        Uses exponential/Wilder's moving average smoothing.
        """
        if not prices or len(prices) <= period:
            return [None] * len(prices)

        rsi_series: List[Optional[float]] = [None] * period

        gains = []
        losses = []
        for i in range(1, period + 1):
            change = prices[i] - prices[i - 1]
            gains.append(max(change, 0.0))
            losses.append(max(-change, 0.0))

        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period

        if avg_loss == 0.0:
            rsi_series.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsi_series.append(100.0 - (100.0 / (1.0 + rs)))

        for i in range(period + 1, len(prices)):
            change = prices[i] - prices[i - 1]
            gain = max(change, 0.0)
            loss = max(-change, 0.0)

            # Wilder's smoothing
            avg_gain = ((avg_gain * (period - 1)) + gain) / period
            avg_loss = ((avg_loss * (period - 1)) + loss) / period

            if avg_loss == 0.0:
                rsi_series.append(100.0)
            else:
                rs = avg_gain / avg_loss
                rsi_series.append(100.0 - (100.0 / (1.0 + rs)))

        return rsi_series

    @staticmethod
    def calculate_wilder_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """Calculates single latest Wilder RSI 14 value."""
        series = TechnicalScannerService.calculate_rsi_series(prices, period)
        if not series or series[-1] is None:
            return None
        return series[-1]

    async def scan_all_constituents(
        self,
        rsi_min: float = 40.0,
        rsi_max: float = 60.0
    ) -> Dict[str, Any]:
        """Scans all 50 constituents for EMA 9, EMA 21, and RSI 14 conditions."""
        stocks = constituents_service.get_constituents()

        all_results = []
        group_bullish_corridor = []
        group_bearish_corridor = []
        group_fresh_bullish_cross = []
        group_fresh_bearish_cross = []
        group_rsi_outside = []
        group_watchlist_near_cross = []

        for stock in stocks:
            symbol = stock["symbol"]
            company_name = stock["company_name"]
            industry = stock["industry"]

            hist = await historical_data_service.fetch_symbol_history(symbol)
            candles = hist.get("candles", [])

            if not candles or len(candles) < 30:
                continue

            closes = [c["close"] for c in candles]
            volumes = [int(c["volume"]) for c in candles if c.get("volume") is not None]
            dates = [c["trading_date"] for c in candles]

            ema9_series = self.calculate_ema_series(closes, 9)
            ema21_series = self.calculate_ema_series(closes, 21)
            rsi14_series = self.calculate_rsi_series(closes, 14)

            latest_close = closes[-1]
            prev_close = closes[-2]

            latest_ema9 = ema9_series[-1]
            prev_ema9 = ema9_series[-2]

            latest_ema21 = ema21_series[-1]
            prev_ema21 = ema21_series[-2]

            latest_rsi = rsi14_series[-1]
            prev_rsi = rsi14_series[-2]

            if latest_ema9 is None or latest_ema21 is None or latest_rsi is None:
                continue

            # Alignment
            if latest_ema9 > latest_ema21:
                alignment = "BULLISH"
            elif latest_ema9 < latest_ema21:
                alignment = "BEARISH"
            else:
                alignment = "NEUTRAL"

            # Fresh Crossovers
            fresh_bullish = (prev_ema9 <= prev_ema21) and (latest_ema9 > latest_ema21)
            fresh_bearish = (prev_ema9 >= prev_ema21) and (latest_ema9 < latest_ema21)

            # Crossover distance %
            ema_distance_pct = ((latest_ema9 - latest_ema21) / latest_ema21) * 100.0

            # RSI Direction & Status
            rsi_diff = latest_rsi - (prev_rsi or latest_rsi)
            if rsi_diff > 0.5:
                rsi_direction = "RISING"
            elif rsi_diff < -0.5:
                rsi_direction = "FALLING"
            else:
                rsi_direction = "FLAT"

            if latest_rsi > 70.0:
                rsi_status = "OVERBOUGHT"
            elif latest_rsi < 30.0:
                rsi_status = "OVERSOLD"
            elif rsi_min <= latest_rsi <= rsi_max:
                rsi_status = "CONSOLIDATION_CORRIDOR"
            else:
                rsi_status = "TRANSITIONAL"

            is_in_corridor = (rsi_min <= latest_rsi <= rsi_max)

            # Volume Confirmation
            rvol = volume_engine.calculate_completed_session_rvol(volumes)
            six_avg = volume_engine.calculate_six_session_average(volumes)
            vol_chg = volume_engine.calculate_volume_change_percentage(volumes[-1], six_avg)
            vol_status = volume_engine.get_volume_classification(rvol, vol_chg)
            price_vol_conf = volume_engine.evaluate_price_volume_confirmation(
                ((latest_close - prev_close) / prev_close) * 100.0 if prev_close else 0.0,
                rvol
            )

            record = {
                "symbol": symbol,
                "company_name": company_name,
                "industry": industry,
                "close": round(latest_close, 2),
                "prev_close": round(prev_close, 2),
                "trading_date": dates[-1],
                "ema_9": round(latest_ema9, 2),
                "ema_21": round(latest_ema21, 2),
                "prev_ema_9": round(prev_ema9, 2) if prev_ema9 else None,
                "prev_ema_21": round(prev_ema21, 2) if prev_ema21 else None,
                "ema_distance_pct": round(ema_distance_pct, 2),
                "alignment": alignment,
                "fresh_bullish_crossover": fresh_bullish,
                "fresh_bearish_crossover": fresh_bearish,
                "rsi_14": round(latest_rsi, 2),
                "prev_rsi_14": round(prev_rsi, 2) if prev_rsi else None,
                "rsi_series": [
                    {"trading_date": day, "value": round(value, 2)}
                    for day, value in zip(dates, rsi14_series)
                    if value is not None
                ][-120:],
                "rsi_direction": rsi_direction,
                "rsi_status": rsi_status,
                "is_in_rsi_corridor": is_in_corridor,
                "satisfies_ema_and_rsi": (alignment == "BULLISH" and is_in_corridor),
                "volume": volumes[-1],
                "rvol": round(rvol, 2),
                "volume_status": vol_status,
                "institutional_bias": price_vol_conf["signal"]
            }

            all_results.append(record)

            # Categorize into groups
            if fresh_bullish:
                group_fresh_bullish_cross.append(record)
            elif fresh_bearish:
                group_fresh_bearish_cross.append(record)

            if alignment == "BULLISH" and is_in_corridor:
                group_bullish_corridor.append(record)
            elif alignment == "BEARISH" and is_in_corridor:
                group_bearish_corridor.append(record)

            if not is_in_corridor:
                group_rsi_outside.append(record)

            if abs(ema_distance_pct) <= 0.60:
                group_watchlist_near_cross.append(record)

        # Sort all results alphabetically
        all_results.sort(key=lambda x: x["symbol"])

        return {
            "total_constituents": len(all_results),
            "rsi_filter_config": {"min": rsi_min, "max": rsi_max},
            "summary_counts": {
                "bullish_alignment": len([r for r in all_results if r["alignment"] == "BULLISH"]),
                "bearish_alignment": len([r for r in all_results if r["alignment"] == "BEARISH"]),
                "fresh_bullish_crossovers": len(group_fresh_bullish_cross),
                "fresh_bearish_crossovers": len(group_fresh_bearish_cross),
                "in_rsi_corridor": len([r for r in all_results if r["is_in_rsi_corridor"]]),
                "bullish_and_rsi_satisfied": len(group_bullish_corridor)
            },
            "groups": {
                "bullish_ema_rsi_corridor": group_bullish_corridor,
                "bearish_ema_rsi_corridor": group_bearish_corridor,
                "fresh_bullish_crossovers": group_fresh_bullish_cross,
                "fresh_bearish_crossovers": group_fresh_bearish_cross,
                "rsi_outside_corridor": group_rsi_outside,
                "watchlist_near_crossover": group_watchlist_near_cross
            },
            "all_results": all_results
        }


technical_scanner_service = TechnicalScannerService()
