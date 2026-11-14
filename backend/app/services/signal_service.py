import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("signal_service")


class CombinedSignalEngine:
    """
    Synthesizes Technical Alignment, Price Direction, and Volume Confirmation.
    Standardized Categories:
    1. STRONG BULLISH: 6/6 DMA alignment + Price rising + Positive volume confirmation (RVOL >= 1.0)
    2. BULLISH WATCHLIST: Exactly 5/6 DMA alignment + Potential for improvement
    3. FRESH BREAKOUT: Confirmed fresh DMA crossover + Supporting volume expansion (RVOL >= 1.0)
    4. WEAKENING: Falling DMA alignment or negative price movement with declining alignment
    5. NO CONFIRMED SIGNAL: Insufficient data, unverified status, or neutral non-qualifying setups
    """

    @staticmethod
    def classify_combined_signal(
        score: int,
        is_6_6: bool,
        is_5_6: bool,
        price_change_pct: float,
        rvol: Optional[float],
        fresh_crossovers: List[Dict[str, Any]],
        transition_type: str = "STABLE",
        status: str = "VERIFIED"
    ) -> Dict[str, Any]:
        """
        Evaluate full quantitative signal combining moving averages and volume.
        """
        if status != "VERIFIED":
            return {
                "signal": "NO_CONFIRMED_SIGNAL",
                "label": "No Confirmed Signal",
                "badge_color": "gray",
                "description": f"Constituent data status is {status}. Verified completed history required.",
                "confidence": "NONE"
            }

        # 1. Fresh Breakout: Confirmed fresh crossover + supporting volume expansion
        if fresh_crossovers and len(fresh_crossovers) > 0 and (rvol is not None and rvol >= 1.0) and price_change_pct >= 0:
            crossover_labels = ", ".join(xo.get("label", "") for xo in fresh_crossovers)
            return {
                "signal": "FRESH_BREAKOUT",
                "label": "Fresh Breakout",
                "badge_color": "emerald",
                "description": f"Confirmed fresh crossover above {crossover_labels} with supporting volume expansion (RVOL {rvol:.2f}x).",
                "confidence": "HIGH"
            }

        # 2. Strong Bullish: 6/6 DMA + Price rising + positive volume confirmation
        if is_6_6 and price_change_pct > 0 and (rvol is not None and rvol >= 1.0):
            return {
                "signal": "STRONG_BULLISH",
                "label": "Strong Bullish",
                "badge_color": "green",
                "description": f"Perfect 6/6 DMA alignment with positive price action (+{price_change_pct:.2f}%) and above-average volume (RVOL {rvol:.2f}x).",
                "confidence": "VERY_HIGH"
            }

        # 3. Bullish Watchlist: Exactly 5/6 DMA alignment
        if is_5_6:
            return {
                "signal": "BULLISH_WATCHLIST",
                "label": "Bullish Watchlist",
                "badge_color": "amber",
                "description": "5/6 DMA alignment. Price is above 5 moving averages with 1 hurdle remaining.",
                "confidence": "MODERATE"
            }

        # 4. Weakening: Falling alignment or distribution
        if transition_type in ["DOWNGRADED_6_TO_5", "LOST_BULLISH_ALIGNMENT", "WEAKENING"] or (price_change_pct < -1.0 and score <= 4):
            return {
                "signal": "WEAKENING",
                "label": "Weakening",
                "badge_color": "rose",
                "description": f"Degrading technical structure ({transition_type}) with price at {score}/6 DMA alignment.",
                "confidence": "MODERATE"
            }

        # 5. No Confirmed Signal (Default neutral)
        return {
            "signal": "NO_CONFIRMED_SIGNAL",
            "label": "No Confirmed Signal",
            "badge_color": "slate",
            "description": f"Mixed technicals ({score}/6 DMA) without confirmed institutional volume expansion.",
            "confidence": "LOW"
        }


signal_engine = CombinedSignalEngine()
