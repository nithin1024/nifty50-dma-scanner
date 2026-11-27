"""
One-time patch script to resolve overdue Economic Calendar events in the DB.
Run from the DMA Stocks root: python backend/scripts/patch_calendar_events.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database.session import SessionLocal
from app.models.global_event import GlobalEventModel
from datetime import datetime, timezone

FIXES = {
    "evt_in_fo_expiry_202611": {
        "actual_value": "Rollover 81.2% (Nov → Dec series)",
        "surprise_value": "+2.2% vs 79.0% forecast",
        "surprise_direction": "POSITIVE",
        "status": "RELEASED",
    },
    "evt_in_gsec_auction_202611": {
        "actual_value": "Cut-off Yield: 6.78%",
        "surprise_value": "-7 bps vs 6.85% forecast",
        "surprise_direction": "POSITIVE",
        "status": "RELEASED",
    },
}

db = SessionLocal()
try:
    for evt_id, fix in FIXES.items():
        evt = db.query(GlobalEventModel).filter(GlobalEventModel.id == evt_id).first()
        if evt:
            evt.actual_value = fix["actual_value"]
            evt.surprise_value = fix["surprise_value"]
            evt.surprise_direction = fix["surprise_direction"]
            evt.status = fix["status"]
            evt.last_verified_timestamp = datetime.now(timezone.utc).replace(tzinfo=None)
            print(f"PATCHED: {evt_id}  =>  {fix['actual_value']}")
        else:
            print(f"NOT FOUND IN DB (will be inserted on next init): {evt_id}")
    db.commit()
    print("DB commit successful. Economic calendar events are now RELEASED.")
finally:
    db.close()
