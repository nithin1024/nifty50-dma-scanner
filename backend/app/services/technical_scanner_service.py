"""
Technical Scanner Service: EMA 9 / EMA 21 & RSI 14 Quantitative Scanner
Implements pure Exponential Moving Average (EMA) and Wilder's RSI algorithms
across all 50 NIFTY constituents with configurable consolidation corridors (RSI 40-60)
and fresh crossover detection.
"""

from typing import List, Dict, Any, Optional
import math
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.services.constituents_service import constituents_service
from app.services.historical_data_service import historical_data_service
from app.services.volume_service import volume_engine
from app.services.upstox_feed_service import subscription_manager

logger = logging.getLogger("technical_scanner_service")
IST = ZoneInfo("Asia/Kolkata")
DEFAULT_EMA_PERIODS = (5, 9, 10, 20, 21, 50, 100, 200)


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
        rsi_max: float = 60.0,
        ema_periods: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """Scan verified historical closes and overlay only actual received V3 ticks."""
        periods = sorted(set(ema_periods or DEFAULT_EMA_PERIODS))
        if not periods or any(period < 2 or period > 500 for period in periods):
            raise ValueError("EMA periods must be unique integers between 2 and 500")
        if 9 not in periods:
            periods.append(9)
        if 21 not in periods:
            periods.append(21)
        periods = sorted(set(periods))
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

            ema_series = {period: self.calculate_ema_series(closes, period) for period in periods}
            rsi14_series = self.calculate_rsi_series(closes, 14)
            instrument_key = stock.get("upstox_instrument_key")
            live_tick = subscription_manager.latest_ticks.get(instrument_key or "")
            tick_fresh = False
            if live_tick and live_tick.get("received_at"):
                try:
                    tick_age = (datetime.now(timezone.utc) - datetime.fromisoformat(
                        live_tick["received_at"].replace("Z", "+00:00"))).total_seconds()
                    tick_fresh = tick_age <= 20 and live_tick.get("ltp") is not None \
                        and live_tick.get("feed_type") == "live_feed"
                except (TypeError, ValueError):
                    tick_fresh = False

            historical_close = closes[-1]
            latest_close = float(live_tick["ltp"]) if tick_fresh else historical_close
            prev_close = closes[-2]
            latest_trading_day = str(dates[-1])
            today_ist = datetime.now(IST).date().isoformat()
            history_has_today = latest_trading_day[:10] == today_ist

            # During an open session, calculate a provisional current-bar EMA
            # from the prior completed EMA and the latest verified feed price.
            latest_ema_values: Dict[int, Optional[float]] = {}
            previous_ema_values: Dict[int, Optional[float]] = {}
            for period in periods:
                values = ema_series[period]
                latest_history_ema = values[-1]
                prior_bar_ema = values[-2] if len(values) > 1 else None
                base = prior_bar_ema if history_has_today and prior_bar_ema is not None else latest_history_ema
                previous_ema_values[period] = base
                if tick_fresh and base is not None:
                    alpha = 2.0 / (period + 1.0)
                    latest_ema_values[period] = latest_close * alpha + base * (1.0 - alpha)
                else:
                    latest_ema_values[period] = latest_history_ema

            latest_ema9 = latest_ema_values.get(9)
            prev_ema9 = previous_ema_values.get(9)
            latest_ema21 = latest_ema_values.get(21)
            prev_ema21 = previous_ema_values.get(21)

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

            valid_period_values = [(period, latest_ema_values[period]) for period in periods
                                   if latest_ema_values.get(period) is not None]
            price_vs_ema = {
                str(period): ("ABOVE" if latest_close > float(value) else "BELOW" if latest_close < float(value) else "AT")
                for period, value in valid_period_values
            }
            ema_values = {str(period): round(float(value), 4) if value is not None else None
                          for period, value in latest_ema_values.items()}
            prior_ema_values = {str(period): round(float(value), 4) if value is not None else None
                                for period, value in previous_ema_values.items()}
            alignment_periods = [value for _, value in valid_period_values]
            fully_aligned_bullish = len(alignment_periods) == len(periods) and all(
                alignment_periods[i] >= alignment_periods[i + 1] for i in range(len(alignment_periods) - 1))
            fully_aligned_bearish = len(alignment_periods) == len(periods) and all(
                alignment_periods[i] <= alignment_periods[i + 1] for i in range(len(alignment_periods) - 1))
            trend_direction = "BULLISH" if fully_aligned_bullish else "BEARISH" if fully_aligned_bearish else alignment
            ema_crossovers = []
            for fast, slow in zip(periods, periods[1:]):
                fast_now, slow_now = latest_ema_values.get(fast), latest_ema_values.get(slow)
                fast_before, slow_before = previous_ema_values.get(fast), previous_ema_values.get(slow)
                if None in (fast_now, slow_now, fast_before, slow_before):
                    continue
                bullish_cross = float(fast_before) <= float(slow_before) and float(fast_now) > float(slow_now)
                bearish_cross = float(fast_before) >= float(slow_before) and float(fast_now) < float(slow_now)
                ema_crossovers.append({"fast_period": fast, "slow_period": slow,
                                       "signal": "BULLISH" if bullish_cross else "BEARISH" if bearish_cross else "NONE",
                                       "bullish": bullish_cross, "bearish": bearish_cross})

            live_volume = live_tick.get("volume") if tick_fresh else None
            live_volume_increment = live_tick.get("incremental_volume") if tick_fresh else None

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
                "instrument_key": instrument_key,
                "historical_close": round(historical_close, 2),
                "price_source": "Upstox Market Data Feed V3" if tick_fresh else hist.get("provider", "historical candles"),
                "data_freshness": "LIVE" if tick_fresh else ("STALE" if live_tick else "HISTORICAL_ONLY"),
                "latest_update_timestamp": (live_tick.get("exchange_timestamp") or live_tick.get("received_at")) if tick_fresh else hist.get("retrieval_timestamp"),
                "data_age_seconds": max(0, round(tick_age, 1)) if tick_fresh else None,
                "volume_freshness": "LIVE" if live_volume is not None else "HISTORICAL_ONLY",
                "live_volume": live_volume,
                "live_volume_increment": live_volume_increment,
                "volume_counter_reset": bool(live_tick.get("volume_counter_reset")) if tick_fresh else False,
                "ema_9": round(latest_ema9, 2),
                "ema_21": round(latest_ema21, 2),
                "ema_periods": periods,
                "ema_values": ema_values,
                "previous_ema_values": prior_ema_values,
                "price_vs_ema": price_vs_ema,
                "ema_crossovers": ema_crossovers,
                "trend_direction": trend_direction,
                "multi_ema_aligned": fully_aligned_bullish or fully_aligned_bearish,
                "volume_confirmation": "INCREASING" if (live_volume_increment or 0) > 0 else "NO_NEW_LIVE_VOLUME" if tick_fresh else "UNAVAILABLE",
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
                "volume": live_volume if live_volume is not None else (volumes[-1] if volumes else 0),
                "historical_volume": volumes[-1] if volumes else None,
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
            "ema_periods_config": periods,
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
