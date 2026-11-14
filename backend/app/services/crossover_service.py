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
    def detect_alignment_transition(
        closes: List[float]
    ) -> Dict[str, Any]:
        """
        Evaluate alignment transitions across the two most recent completed sessions:
        - Maintains 6/6 bullish alignment
        - Moves from 5/6 to 6/6
        - Falls from 6/6 to 5/6
        - Loses bullish alignment (< 5/6)
        """
        if len(closes) < 201:  # Need at least 200 + 1 sessions for 200 DMA comparison
            return {
                "transition_type": "INSUFFICIENT_DATA",
                "prev_score": 0,
                "current_score": 0,
                "description": "Insufficient history for transition evaluation."
            }

        prev_closes = closes[:-1]
        current_closes = closes

        prev_smas = dma_engine.calculate_all_smas(prev_closes)
        current_smas = dma_engine.calculate_all_smas(current_closes)

        prev_class = dma_engine.classify_stock(prev_closes[-1], prev_smas)
        current_class = dma_engine.classify_stock(current_closes[-1], current_smas)

        prev_score = prev_class["score"]
        curr_score = current_class["score"]

        if prev_class["is_6_6"] and current_class["is_6_6"]:
            transition_type = "MAINTAINED_6_6"
            desc = "Maintained perfect 6/6 bullish DMA alignment across sessions."
        elif prev_class["is_5_6"] and current_class["is_6_6"]:
            transition_type = "UPGRADED_5_TO_6"
            desc = "Upgraded from 5/6 to 6/6 bullish DMA alignment."
        elif prev_class["is_6_6"] and current_class["is_5_6"]:
            transition_type = "DOWNGRADED_6_TO_5"
            desc = "Fell from 6/6 to 5/6 bullish DMA alignment."
        elif (prev_class["is_6_6"] or prev_class["is_5_6"]) and curr_score < 5:
            transition_type = "LOST_BULLISH_ALIGNMENT"
            desc = f"Lost bullish alignment (score dropped from {prev_score} to {curr_score})."
        elif curr_score > prev_score:
            transition_type = "IMPROVING"
            desc = f"Alignment improving from {prev_score}/6 to {curr_score}/6."
        elif curr_score < prev_score:
            transition_type = "WEAKENING"
            desc = f"Alignment weakening from {prev_score}/6 to {curr_score}/6."
        else:
            transition_type = "STABLE"
            desc = f"DMA alignment unchanged at {curr_score}/6."

        return {
            "transition_type": transition_type,
            "prev_score": prev_score,
            "current_score": curr_score,
            "prev_classification": prev_class["classification"],
            "current_classification": current_class["classification"],
            "description": desc
        }

    @staticmethod
    def detect_approaching_crossovers(
        closes: List[float], 
        proximity_pct: float = 1.0
    ) -> List[Dict[str, Any]]:
        """
        Identify stocks approaching a potential bullish crossover.
        Rule: Latest close is below or equal to the DMA, but within proximity_pct (default <= 1.0%).
        """
        approaching = []
        if len(closes) < 200:
            return approaching

        latest_close = closes[-1]
        smas = dma_engine.calculate_all_smas(closes)

        for period in DMA_PERIODS:
            sma_val = smas.get(f"dma{period}")
            if sma_val is None:
                continue

            # Price is below or equal to DMA, but within proximity threshold
            if latest_close <= sma_val:
                distance_to_dma = ((sma_val - latest_close) / sma_val) * 100.0
                if distance_to_dma <= proximity_pct:
                    approaching.append({
                        "period": period,
                        "label": f"{period} DMA",
                        "dma_value": round(sma_val, 2),
                        "latest_close": round(latest_close, 2),
                        "distance_to_dma_pct": round(distance_to_dma, 2),
                        "status": "APPROACHING_BREAKOUT"
                    })

        return approaching

    @classmethod
    def detect_historical_crossovers(
        cls, 
        closes: List[float], 
        trading_dates: List[str], 
        lookback_sessions: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Build a chronological timeline of crossovers detected over the last N sessions.
        """
        history = []
        n = len(closes)
        if n < 202:
            return history

        start_idx = max(201, n - lookback_sessions)
        for i in range(start_idx, n):
            sub_closes = closes[:i + 1]
            sub_dates = trading_dates[:i + 1]
            session_crossovers = cls.detect_fresh_crossovers(sub_closes, sub_dates)
            for xo in session_crossovers:
                history.append(xo)

        history.sort(key=lambda x: x["crossover_date"], reverse=True)
        return history

    @staticmethod
    def detect_intraday_provisional_crossing(
        live_price: float, 
        completed_closes: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Identify intraday price crossing an SMA.
        Rule: Last completed close <= completed SMA AND Current live intraday price > completed SMA.
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
