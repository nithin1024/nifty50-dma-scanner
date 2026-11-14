import pytest
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient

from app.main import app
from app.services.timezone_service import (
    convert_local_to_utc_and_ist,
    compute_live_countdown,
    parse_numeric_value,
    calculate_surprise
)
from app.services.global_events_service import global_events_service


@pytest.fixture
def client():
    return TestClient(app)


def test_timezone_conversion_dst_accurate():
    """Verify UTC to IST and DST calculations for US and Europe."""
    # US Summer / Daylight Saving Time (e.g. July - EDT is UTC-4)
    summer_res = convert_local_to_utc_and_ist(
        year=2026, month=7, day=15, hour=8, minute=30, local_tz_name="America/New_York"
    )
    # 8:30 AM EDT -> 12:30 UTC -> 18:00 (06:00 PM) IST
    assert summer_res["utc_dt"].hour == 12
    assert summer_res["utc_dt"].minute == 30
    assert summer_res["ist_dt"].hour == 18
    assert summer_res["ist_dt"].minute == 0
    assert "06:00 PM IST" in summer_res["ist_str"]

    # US Winter / Standard Time (e.g. December - EST is UTC-5)
    winter_res = convert_local_to_utc_and_ist(
        year=2026, month=12, day=15, hour=8, minute=30, local_tz_name="America/New_York"
    )
    # 8:30 AM EST -> 13:30 UTC -> 19:00 (07:00 PM) IST
    assert winter_res["utc_dt"].hour == 13
    assert winter_res["utc_dt"].minute == 30
    assert winter_res["ist_dt"].hour == 19
    assert winter_res["ist_dt"].minute == 0
    assert "07:00 PM IST" in winter_res["ist_str"]


def test_countdown_computation():
    """Verify live countdown statuses (Upcoming, Ongoing, Released)."""
    now_utc = datetime.now(timezone.utc)

    # Future: 3 hours ahead
    future_dt = now_utc + timedelta(hours=3, minutes=15)
    future_res = compute_live_countdown(future_dt)
    assert future_res["status"] == "UPCOMING"
    assert "Starts in 3h" in future_res["countdown_label_en"]
    assert "ప్రారంభం" in future_res["countdown_label_te"]

    # Ongoing: started 30 mins ago
    ongoing_dt = now_utc - timedelta(minutes=30)
    ongoing_res = compute_live_countdown(ongoing_dt)
    assert ongoing_res["status"] == "ONGOING"
    assert "ongoing" in ongoing_res["countdown_label_en"].lower()

    # Past: released 3 days ago
    past_dt = now_utc - timedelta(days=3)
    past_res = compute_live_countdown(past_dt)
    assert past_res["status"] == "RELEASED"
    assert "Released 3 days ago" in past_res["countdown_label_en"]


def test_numeric_parsing_and_surprise_calculation():
    """Verify surprise calculation across %, K, M, B formats."""
    # Percentage test
    res1 = calculate_surprise("6.21%", "5.80%")
    assert res1["surprise_direction"] == "POSITIVE"
    assert res1["surprise_value"] == 0.41

    # In-line test
    res2 = calculate_surprise("2.6%", "2.6%")
    assert res2["surprise_direction"] == "IN_LINE"

    # Negative surprise test
    res3 = calculate_surprise("120K", "150K")
    assert res3["surprise_direction"] == "NEGATIVE"
    assert res3["surprise_value"] == -30000.0

    # Unreleased test
    res4 = calculate_surprise("Not yet released", "2.5%")
    assert res4["surprise_direction"] == "PENDING"
    assert res4["surprise_value"] is None


def test_global_events_api_list(client):
    """Verify GET /api/v1/global-events returns populated list with bilingual explanations."""
    response = client.get("/api/v1/global-events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 12

    # Check first event structure
    first = events[0]
    assert "id" in first
    assert "event_name" in first
    assert "event_name_te" in first
    assert "country" in first
    assert "country_flag" in first
    assert "start_time_ist_str" in first
    assert "description_en" in first
    assert "description_te" in first
    assert "india_market_impact_en" in first
    assert "india_market_impact_te" in first
    assert "key_terms" in first
    assert "countdown" in first


def test_global_events_filters(client):
    """Verify category and country filters."""
    # Filter by category CENTRAL_BANK
    res_cb = client.get("/api/v1/global-events?category=CENTRAL_BANK")
    assert res_cb.status_code == 200
    events_cb = res_cb.json()
    assert all(e["category"] == "CENTRAL_BANK" for e in events_cb)

    # Filter by country IN (India)
    res_in = client.get("/api/v1/global-events?country_code=IN")
    assert res_in.status_code == 200
    events_in = res_in.json()
    assert all(e["country_code"] == "IN" for e in events_in)

    # Search keyword
    res_search = client.get("/api/v1/global-events?search_query=CPI")
    assert res_search.status_code == 200
    events_search = res_search.json()
    assert len(events_search) >= 2


def test_global_events_summary(client):
    """Verify GET /api/v1/global-events/summary provides Section 1 overview telemetry."""
    response = client.get("/api/v1/global-events/summary")
    assert response.status_code == 200
    data = response.json()
    assert "current_ist_timestamp" in data
    assert "current_ist_formatted" in data
    assert "total_events_tracked" in data
    assert "high_impact_total" in data
    assert "categories_breakdown" in data
    assert data["total_events_tracked"] >= 12


def test_sub_calendars(client):
    """Verify sub-calendar endpoints."""
    # India focus sub-calendar
    res_in = client.get("/api/v1/global-events/india")
    assert res_in.status_code == 200
    events_in = res_in.json()
    assert len(events_in) >= 5
    assert all(e["country_code"] == "IN" for e in events_in)

    # Central banks
    res = client.get("/api/v1/global-events/central-banks")
    assert res.status_code == 200
    assert len(res.json()) >= 3

    # Inflation
    res_inf = client.get("/api/v1/global-events/inflation")
    assert res_inf.status_code == 200
    assert len(res_inf.json()) >= 2

    # Geopolitical
    res_geo = client.get("/api/v1/global-events/geopolitical")
    assert res_geo.status_code == 200
    assert len(res_geo.json()) >= 1

    # Commodities
    res_comm = client.get("/api/v1/global-events/commodities")
    assert res_comm.status_code == 200
    assert len(res_comm.json()) >= 1


def test_user_preferences_api(client):
    """Verify user alert preferences get & update."""
    get_res = client.get("/api/v1/global-events/preferences")
    assert get_res.status_code == 200
    pref = get_res.json()
    assert "alert_24h" in pref

    post_res = client.post("/api/v1/global-events/preferences", json={
        "alert_24h": False,
        "alert_1h": True,
        "preferred_countries": "IN,US"
    })
    assert post_res.status_code == 200
    updated = post_res.json()
    assert updated["alert_24h"] is False
    assert updated["preferred_countries"] == "IN,US"
