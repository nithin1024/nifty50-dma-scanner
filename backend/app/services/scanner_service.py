import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.services.constituents_service import constituents_service
from app.services.historical_data_service import historical_data_service
from app.services.dma_service import dma_engine, DMA_PERIODS
from app.services.crossover_service import crossover_engine

logger = logging.getLogger("scanner_service")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DAILY_SCAN_FILE = DATA_DIR / "daily_scan_latest.json"


class DailyScannerService:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    async def run_daily_scan(self) -> Dict[str, Any]:
        """
        Run scan across all 50 NIFTY 50 constituents using genuine completed daily sessions.
        """
        stocks = constituents_service.get_constituents()
        scan_time = datetime.now(timezone.utc).isoformat()
        
        all_results = []
        stocks_6_6 = []
        stocks_5_6 = []
        all_fresh_crossovers = []
        latest_session_dates = set()

        for stock in stocks:
            symbol = stock["symbol"]
            company_name = stock["company_name"]
            industry = stock["industry"]

            # Retrieve genuine historical daily session candles
            hist = await historical_data_service.fetch_symbol_history(symbol)
            candles = hist.get("candles", [])

            if not candles or len(candles) < 200:
                # Mark as insufficient history or unavailable (Never fake 0/6)
                status = hist.get("quality_status", "INSUFFICIENT_HISTORY")
                entry = {
                    "symbol": symbol,
                    "company_name": company_name,
                    "industry": industry,
                    "status": status,
                    "latest_close": candles[-1]["close"] if candles else None,
                    "latest_trading_date": candles[-1]["trading_date"] if candles else None,
                    "score": 0,
                    "is_6_6": False,
                    "is_5_6": False,
                    "smas": {f"dma{p}": None for p in DMA_PERIODS},
                    "distances": {f"dist_dma{p}": None for p in DMA_PERIODS},
                    "fresh_crossovers": []
                }
                all_results.append(entry)
                continue

            closes = [c["close"] for c in candles]
            dates = [c["trading_date"] for c in candles]
            latest_close = closes[-1]
            latest_date = dates[-1]
            latest_session_dates.add(latest_date)

            # 1. Calculate the 6 DMAs
            smas = dma_engine.calculate_all_smas(closes)

            # 2. Classify stock (6/6 vs 5/6)
            classification = dma_engine.classify_stock(latest_close, smas)

            # 3. Detect fresh bullish crossovers
            fresh_crossovers = crossover_engine.detect_fresh_crossovers(closes, dates)
            for xo in fresh_crossovers:
                xo["symbol"] = symbol
                xo["company_name"] = company_name
                all_fresh_crossovers.append(xo)

            # Build enriched constituent result
            entry = {
                "symbol": symbol,
                "company_name": company_name,
                "industry": industry,
                "status": "VERIFIED",
                "latest_close": round(latest_close, 2),
                "latest_trading_date": latest_date,
                "score": classification["score"],
                "classification": classification["classification"],
                "is_6_6": classification["is_6_6"],
                "is_5_6": classification["is_5_6"],
                "comparisons": classification["comparisons"],
                "smas": {k: round(v, 2) if v is not None else None for k, v in smas.items()},
                "distances": {k: round(v, 2) if v is not None else None for k, v in classification["distances"].items()},
                "fresh_crossovers": fresh_crossovers
            }

            all_results.append(entry)

            if classification["is_6_6"]:
                stocks_6_6.append(entry)
            elif classification["is_5_6"]:
                stocks_5_6.append(entry)

        # Sort results: highest DMA score first, then percentage distance
        all_results.sort(key=lambda x: (x["score"], x.get("distances", {}).get("dist_dma20") or -999), reverse=True)
        stocks_6_6.sort(key=lambda x: x.get("distances", {}).get("dist_dma20") or -999, reverse=True)
        stocks_5_6.sort(key=lambda x: x.get("distances", {}).get("dist_dma20") or -999, reverse=True)

        completed_session_date = max(latest_session_dates) if latest_session_dates else None

        scan_payload = {
            "scan_timestamp": scan_time,
            "completed_session_date": completed_session_date,
            "total_constituents": len(stocks),
            "verified_constituents": len([r for r in all_results if r["status"] == "VERIFIED"]),
            "count_6_6": len(stocks_6_6),
            "count_5_6": len(stocks_5_6),
            "stocks_6_6": stocks_6_6,
            "stocks_5_6": stocks_5_6,
            "fresh_crossovers": all_fresh_crossovers,
            "all_results": all_results
        }

        # Save to disk
        with open(DAILY_SCAN_FILE, "w", encoding="utf-8") as f:
            json.dump(scan_payload, f, indent=2)

        return scan_payload

    def get_latest_scan(self) -> Optional[Dict[str, Any]]:
        if DAILY_SCAN_FILE.exists():
            try:
                with open(DAILY_SCAN_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading daily scan: {e}")
        return None


scanner_service = DailyScannerService()
