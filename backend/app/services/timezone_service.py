"""
Global Timezone & Economic Surprise Calculation Engine.
Accurately handles daylight-saving time (DST) shifts for US, Europe, UK, Japan, Australia,
and converts all global timestamps to Indian Standard Time (IST - Asia/Kolkata).
"""

from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from typing import Dict, Any, Optional
import re


IST_TZ = ZoneInfo("Asia/Kolkata")
UTC_TZ = ZoneInfo("UTC")


def convert_local_to_utc_and_ist(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    local_tz_name: str
) -> Dict[str, Any]:
    """
    Converts a local date & time from its native timezone (accounting for DST)
    into UTC and Indian Standard Time (IST).
    """
    local_tz = ZoneInfo(local_tz_name)
    local_dt = datetime(year, month, day, hour, minute, tzinfo=local_tz)

    utc_dt = local_dt.astimezone(UTC_TZ)
    ist_dt = local_dt.astimezone(IST_TZ)

    return {
        "local_dt": local_dt,
        "utc_dt": utc_dt,
        "ist_dt": ist_dt,
        "local_str": local_dt.strftime("%I:%M %p %Z"),
        "ist_str": ist_dt.strftime("%I:%M %p IST"),
        "date_ist_str": ist_dt.strftime("%d %b %Y"),
        "full_ist_str": ist_dt.strftime("%d %b %Y, %I:%M %p IST"),
    }


def compute_live_countdown(utc_dt: datetime) -> Dict[str, Any]:
    """
    Computes an exact human-readable countdown relative to the current UTC wall-clock time.
    Supports upcoming, ongoing, and completed/released timeframes.
    """
    now_utc = datetime.now(timezone.utc)
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)

    delta = utc_dt - now_utc
    total_seconds = int(delta.total_seconds())

    if total_seconds > 0:
        # Future event (Upcoming)
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60

        if days > 1:
            label = f"Starts in {days} days"
            label_te = f"{days} రోజుల్లో ప్రారంభం"
        elif days == 1:
            label = f"Starts in 1 day {hours}h"
            label_te = f"1 రోజు {hours} గంటల్లో ప్రారంభం"
        elif hours > 0:
            label = f"Starts in {hours}h {minutes}m"
            label_te = f"{hours} గం {minutes} నిమిషాల్లో ప్రారంభం"
        else:
            label = f"Starts in {minutes} minutes"
            label_te = f"{minutes} నిమిషాల్లో ప్రారంభం"

        return {
            "status": "UPCOMING",
            "countdown_label_en": label,
            "countdown_label_te": label_te,
            "is_imminent": total_seconds <= 3600,  # <= 1 hour
            "seconds_remaining": total_seconds,
            "hours_remaining": round(total_seconds / 3600, 1),
            "days_remaining": round(total_seconds / 86400, 1),
        }
    elif -7200 <= total_seconds <= 0:
        # Started within last 2 hours
        return {
            "status": "ONGOING",
            "countdown_label_en": "Event ongoing / In progress",
            "countdown_label_te": "ప్రస్తుతం కొనసాగుతోంది",
            "is_imminent": True,
            "seconds_remaining": 0,
            "hours_remaining": 0.0,
            "days_remaining": 0.0,
        }
    else:
        # Past event (Released)
        passed_seconds = abs(total_seconds)
        days = passed_seconds // 86400
        hours = (passed_seconds % 86400) // 3600
        minutes = (passed_seconds % 3600) // 60

        if days > 1:
            label = f"Released {days} days ago"
            label_te = f"{days} రోజుల క్రితం విడుదలైంది"
        elif days == 1:
            label = f"Released 1 day ago"
            label_te = "నిన్న విడుదలైంది"
        elif hours > 0:
            label = f"Released {hours}h {minutes}m ago"
            label_te = f"{hours} గంటల క్రితం విడుదలైంది"
        else:
            label = f"Released {minutes}m ago"
            label_te = f"{minutes} నిమిషాల క్రితం విడుదలైంది"

        return {
            "status": "RELEASED",
            "countdown_label_en": label,
            "countdown_label_te": label_te,
            "is_imminent": False,
            "seconds_remaining": total_seconds,
            "hours_remaining": round(total_seconds / 3600, 1),
            "days_remaining": round(total_seconds / 86400, 1),
        }


def parse_numeric_value(val_str: Optional[str]) -> Optional[float]:
    """Extracts numeric value from strings like '2.6%', '150K', '-$84.4B', '6.50%'."""
    if not val_str or val_str in ("-", "N/A", "Not yet released"):
        return None
    try:
        # Remove currency symbols and comma
        clean = val_str.replace("$", "").replace("₹", "").replace("€", "").replace("£", "").replace(",", "").strip()
        # Check multiplier
        multiplier = 1.0
        if clean.endswith("%"):
            clean = clean[:-1]
        elif clean.endswith("K") or clean.endswith("k"):
            multiplier = 1000.0
            clean = clean[:-1]
        elif clean.endswith("M") or clean.endswith("m"):
            multiplier = 1000000.0
            clean = clean[:-1]
        elif clean.endswith("B") or clean.endswith("b"):
            multiplier = 1000000000.0
            clean = clean[:-1]
        elif clean.endswith("Cr") or clean.endswith("cr"):
            multiplier = 10000000.0
            clean = clean[:-2]

        val = float(clean.strip()) * multiplier
        return val
    except Exception:
        return None


def calculate_surprise(actual_str: Optional[str], forecast_str: Optional[str]) -> Dict[str, Any]:
    """
    Computes Surprise = Actual - Forecast.
    Evaluates surprise direction and market implications.
    """
    actual = parse_numeric_value(actual_str)
    forecast = parse_numeric_value(forecast_str)

    if actual is None or forecast is None:
        return {
            "surprise_value": None,
            "surprise_pct": None,
            "surprise_direction": "PENDING",
            "label_en": "Not yet released",
            "label_te": "ఇంకా విడుదల కాలేదు"
        }

    diff = round(actual - forecast, 4)
    # Threshold for in-line (within 0.01 or 0.1%)
    tolerance = 0.01 if "%" in (actual_str or "") else 0.001

    if abs(diff) <= tolerance:
        direction = "IN_LINE"
        label_en = "In Line with Expectations"
        label_te = "అంచనాలకు అనుగుణంగా వచ్చింది"
    elif diff > 0:
        direction = "POSITIVE"  # Higher than expected
        label_en = f"Higher than Forecast (+{diff})"
        label_te = f"అంచనాల కంటే ఎక్కువ (+{diff})"
    else:
        direction = "NEGATIVE"  # Lower than expected
        label_en = f"Lower than Forecast ({diff})"
        label_te = f"అంచనాల కంటే తక్కువ ({diff})"

    return {
        "surprise_value": diff,
        "surprise_direction": direction,
        "label_en": label_en,
        "label_te": label_te
    }
