from typing import List, Dict, Optional, Any, Tuple

DMA_PERIODS = [5, 10, 20, 50, 100, 200]


class DMACalculationEngine:
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Simple Moving Average (SMA) for a given period.
        Formula: Sum of last 'period' completed closing prices / period.
        Returns None if len(prices) < period.
        No intermediate rounding.
        """
        if period <= 0:
            raise ValueError(f"Period must be positive, got {period}")
        if not prices or len(prices) < period:
            return None

        # Take the exact last 'period' values
        window = prices[-period:]
        if any(p is None or p <= 0 for p in window):
            return None

        return sum(window) / period

    @classmethod
    def calculate_all_smas(cls, closes: List[float]) -> Dict[str, Optional[float]]:
        """Calculate all six standard DMAs (5, 10, 20, 50, 100, 200)."""
        return {
            f"dma{p}": cls.calculate_sma(closes, p)
            for p in DMA_PERIODS
        }

    @staticmethod
    def calculate_percentage_distance(price: float, sma: Optional[float]) -> Optional[float]:
        """
        Percentage distance from SMA:
        ((Price - SMA) / SMA) * 100
        Returns None if SMA is None or <= 0.
        """
        if sma is None or sma <= 0:
            return None
        return ((price - sma) / sma) * 100.0

    @classmethod
    def classify_stock(
        cls, 
        price: float, 
        smas: Dict[str, Optional[float]]
    ) -> Dict[str, Any]:
        """
        Classify stock against the six SMAs.
        Rule:
        - Price must be STRICTLY GREATER than SMA (P > SMA).
        - Price == SMA does NOT count as above.
        - 6/6: P > SMA5 AND P > SMA10 AND P > SMA20 AND P > SMA50 AND P > SMA100 AND P > SMA200.
        - Exactly 5/6: P > exactly 5 of the 6 SMAs.
        - 4/6 or lower: excluded from bullish classifications.
        """
        if price is None or price <= 0:
            return {
                "score": 0,
                "classification": "UNAVAILABLE",
                "is_6_6": False,
                "is_5_6": False,
                "comparisons": {},
                "distances": {}
            }

        # Check if all 6 SMAs are available
        all_smas_available = all(smas.get(f"dma{p}") is not None for p in DMA_PERIODS)
        if not all_smas_available:
            return {
                "score": 0,
                "classification": "INSUFFICIENT_HISTORY",
                "is_6_6": False,
                "is_5_6": False,
                "comparisons": {f"dma{p}": False for p in DMA_PERIODS},
                "distances": {f"dist{p}": None for p in DMA_PERIODS}
            }

        comparisons: Dict[str, bool] = {}
        distances: Dict[str, Optional[float]] = {}
        score = 0

        for p in DMA_PERIODS:
            sma_val = smas.get(f"dma{p}")
            # Strict greater-than comparison (no rounding before comparison)
            is_above = price > sma_val
            comparisons[f"above_dma{p}"] = is_above
            if is_above:
                score += 1
            distances[f"dist_dma{p}"] = cls.calculate_percentage_distance(price, sma_val)

        is_6_6 = (score == 6)
        is_5_6 = (score == 5)

        # Clearly identify the exact one DMA above which price has NOT moved
        failed_dma = None
        failed_dma_label = None
        failed_dma_value = None
        failed_dma_distance_pct = None

        if is_5_6:
            for p in DMA_PERIODS:
                if not comparisons.get(f"above_dma{p}"):
                    failed_dma = f"dma{p}"
                    failed_dma_label = f"{p} DMA"
                    failed_dma_value = smas.get(f"dma{p}")
                    failed_dma_distance_pct = distances.get(f"dist_dma{p}")
                    break

        # Identify closest support and resistance DMAs
        support_candidates = [(p, smas[f"dma{p}"]) for p in DMA_PERIODS if smas.get(f"dma{p}") is not None and price > smas[f"dma{p}"]]
        resistance_candidates = [(p, smas[f"dma{p}"]) for p in DMA_PERIODS if smas.get(f"dma{p}") is not None and price <= smas[f"dma{p}"]]

        closest_support = max(support_candidates, key=lambda x: x[1]) if support_candidates else None
        closest_resistance = min(resistance_candidates, key=lambda x: x[1]) if resistance_candidates else None

        if is_6_6:
            classification = "BULLISH_6_6"
        elif is_5_6:
            classification = "BULLISH_5_6"
        else:
            classification = "NEUTRAL_OR_BEARISH"

        return {
            "score": score,
            "classification": classification,
            "is_6_6": is_6_6,
            "is_5_6": is_5_6,
            "failed_dma": failed_dma,
            "failed_dma_label": failed_dma_label,
            "failed_dma_value": round(failed_dma_value, 2) if failed_dma_value is not None else None,
            "failed_dma_distance_pct": round(failed_dma_distance_pct, 2) if failed_dma_distance_pct is not None else None,
            "closest_support_dma": f"{closest_support[0]} DMA" if closest_support else None,
            "closest_support_value": round(closest_support[1], 2) if closest_support else None,
            "closest_resistance_dma": f"{closest_resistance[0]} DMA" if closest_resistance else None,
            "closest_resistance_value": round(closest_resistance[1], 2) if closest_resistance else None,
            "comparisons": comparisons,
            "distances": distances
        }

    @classmethod
    def compute_rolling_smas(cls, closes: List[float]) -> Dict[str, List[Optional[float]]]:
        """Compute rolling SMA series for all 6 periods over the entire close array."""
        n = len(closes)
        result: Dict[str, List[Optional[float]]] = {
            f"dma{p}": [None] * n for p in DMA_PERIODS
        }
        for p in DMA_PERIODS:
            if n < p:
                continue
            # Compute rolling sum with O(n) sliding window
            window_sum = sum(closes[:p])
            result[f"dma{p}"][p - 1] = window_sum / p
            for i in range(p, n):
                window_sum += closes[i] - closes[i - p]
                result[f"dma{p}"][i] = window_sum / p

        return result


dma_engine = DMACalculationEngine()
