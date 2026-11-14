import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.database.session import engine, SessionLocal
from app.models.stock import (
    Base,
    ConstituentModel,
    HistoricalOHLCModel,
    DailyDMAModel,
    DailyScanRecordModel,
    CrossoverEventModel
)
from app.services.constituents_service import constituents_service

logger = logging.getLogger("db_service")


class DatabaseService:
    def __init__(self):
        self.init_db()

    def init_db(self):
        """Create all tables if they don't exist."""
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database schema initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing database schema: {e}")

    def sync_constituents_to_db(self):
        """Seed or update constituents in relational database."""
        db = SessionLocal()
        try:
            stocks = constituents_service.get_constituents()
            for s in stocks:
                existing = db.query(ConstituentModel).filter(ConstituentModel.symbol == s["symbol"]).first()
                if not existing:
                    item = ConstituentModel(
                        symbol=s["symbol"],
                        company_name=s["company_name"],
                        industry=s["industry"],
                        isin=s["isin"],
                        series=s.get("series", "EQ"),
                        weightage=s.get("weightage", 0.0),
                        upstox_instrument_key=s["upstox_instrument_key"],
                        active=True
                    )
                    db.add(item)
                else:
                    existing.weightage = s.get("weightage", existing.weightage)
                    existing.company_name = s["company_name"]
                    existing.industry = s["industry"]
            db.commit()
            logger.info("Constituents synchronized with database.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing constituents to DB: {e}")
        finally:
            db.close()

    def persist_scan_result(self, scan_data: Dict[str, Any]):
        """Persist daily scan payload to DB."""
        db = SessionLocal()
        try:
            record = DailyScanRecordModel(
                completed_session_date=scan_data["completed_session_date"] or "UNKNOWN",
                total_constituents=scan_data.get("total_constituents", 50),
                verified_count=scan_data.get("verified_constituents", 50),
                count_6_6=scan_data.get("count_6_6", 0),
                count_5_6=scan_data.get("count_5_6", 0),
                results_json=json.dumps(scan_data)
            )
            db.add(record)

            # Persist individual DMAs
            session_date = scan_data.get("completed_session_date")
            for res in scan_data.get("all_results", []):
                sym = res["symbol"]
                smas = res.get("smas", {})
                dma_entry = DailyDMAModel(
                    symbol=sym,
                    trading_date=session_date or datetime.now(timezone.utc).date().isoformat(),
                    dma5=smas.get("dma5"),
                    dma10=smas.get("dma10"),
                    dma20=smas.get("dma20"),
                    dma50=smas.get("dma50"),
                    dma100=smas.get("dma100"),
                    dma200=smas.get("dma200"),
                    score=res.get("score", 0),
                    classification=res.get("classification", "NEUTRAL_OR_BEARISH")
                )
                db.merge(dma_entry)

            # Persist fresh crossovers
            for xo in scan_data.get("fresh_crossovers", []):
                event = CrossoverEventModel(
                    symbol=xo["symbol"],
                    crossover_date=xo["crossover_date"],
                    period=xo["period"],
                    previous_close=xo["previous_close"],
                    previous_sma=xo["previous_sma"],
                    latest_close=xo["latest_close"],
                    latest_sma=xo["latest_sma"],
                    distance_pct=xo["distance_pct"]
                )
                db.add(event)

            db.commit()
            logger.info(f"Scan for session {session_date} persisted successfully.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting scan: {e}")
        finally:
            db.close()

    def get_scan_history(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Retrieve recent scan records."""
        db = SessionLocal()
        try:
            records = (
                db.query(DailyScanRecordModel)
                .order_by(DailyScanRecordModel.scan_timestamp.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id,
                    "scan_timestamp": r.scan_timestamp.isoformat(),
                    "completed_session_date": r.completed_session_date,
                    "total_constituents": r.total_constituents,
                    "verified_count": r.verified_count,
                    "count_6_6": r.count_6_6,
                    "count_5_6": r.count_5_6
                }
                for r in records
            ]
        finally:
            db.close()


db_service = DatabaseService()
