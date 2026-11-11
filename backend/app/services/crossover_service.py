from typing import List, Dict, Optional, Any
from app.services.dma_service import dma_engine, DMA_PERIODS


class CrossoverDetectionEngine:
    @staticmethod
    def detect_fresh_crossovers(
        closes: List[float], 
        trading_dates: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Detect completed daily bullish crossovers across all 6 periods.
        Rule:
        Previous completed daily close <= Previous session SMA
        AND
        Latest completed daily close > Latest session SMA.
        """
        crossovers: List[Dict[str, Any]] = []
        if len(closes) < 2 or len(trading_dates) < 2:
            return crossovers

        latest_close = closes[-1]
        prev_close = closes[-2]
        latest_date = trading_dates[-1]

        # Calculate previous session SMAs (excluding the latest candle)
        closes_prev_window = closes[:-1]

        for period in DMA_PERIODS:
            # Need at least period + 1 sessions to evaluate crossover
            if len(closes) < period + 1:
                continue

            prev_sma = dma_engine.calculate_sma(closes_prev_window, period)
            latest_sma = dma_engine.calculate_sma(closes, period)

            if prev_sma is None or latest_sma is None:
                continue

            # Strict crossover logic:
            # Previous close was AT OR BELOW previous SMA
            # AND
            # Latest close is STRICTLY ABOVE latest SMA
            was_below_or_equal = (prev_close <= prev_sma)
            is_now_above = (latest_close > latest_sma)

            if was_below_or_equal and is_now_above:
                crossovers.append({
                    "period": period,
                    "label": f"{period} DMA",
                    "crossover_date": latest_date,
                    "previous_close": round(prev_close, 2),
                    "previous_sma": round(prev_sma, 2),
                    "latest_close": round(latest_close, 2),
                    "latest_sma": round(latest_sma, 2),
                    "distance_pct": round(((latest_close - latest_sma) / latest_sma) * 100, 2),
                    "is_fresh": True
                })

        return crossovers

    @staticmethod
    def detect_intraday_provisional_crossing(
        live_price: float, 
        completed_closes: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Identify intraday price crossing an SMA.
        Rule:
        Last completed close <= completed SMA
        AND
        Current live intraday price > completed SMA.
        Labeled explicitly as PROVISIONAL INTRADAY EVENT.
        """
        crossings = []
        for period in DMA_PERIODS:
            completed_sma = dma_engine.calculate_sma(completed_closes, period)
            if completed_sma is None:
                continue

            last_completed_close = completed_closes[-1]
            if last_completed_close <= completed_sma and live_price > completed_sma:
                crossings.append({
                    "period": period,
                    "label": f"{period} DMA",
                    "type": "PROVISIONAL_INTRADAY_CROSSING",
                    "last_completed_close": round(last_completed_close, 2),
                    "completed_daily_sma": round(completed_sma, 2),
                    "live_price": round(live_price, 2),
                    "notes": "Provisional intraday price crossing. Not a confirmed daily close."
                })
        return crossings


crossover_engine = CrossoverDetectionEngine()
