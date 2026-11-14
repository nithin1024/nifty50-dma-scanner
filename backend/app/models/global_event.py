from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base


class GlobalEventModel(Base):
    __tablename__ = "global_events"

    id = Column(String(80), primary_key=True, index=True)
    event_name = Column(String(250), nullable=False, index=True)
    event_name_te = Column(String(300), nullable=False)
    country = Column(String(100), nullable=False, index=True)
    country_code = Column(String(10), nullable=False, index=True)
    country_flag = Column(String(10), default="🌐")
    category = Column(String(50), nullable=False, index=True)

    start_time_utc = Column(DateTime, nullable=False, index=True)
    end_time_utc = Column(DateTime, nullable=True)
    original_timezone = Column(String(50), nullable=False)
    original_time_str = Column(String(100), nullable=False)
    start_time_ist = Column(DateTime, nullable=False, index=True)
    start_time_ist_str = Column(String(100), nullable=False)

    importance = Column(String(20), default="MEDIUM", index=True)  # HIGH, MEDIUM, LOW
    currency = Column(String(10), default="USD")
    previous_value = Column(String(50), nullable=True)
    forecast_value = Column(String(50), nullable=True)
    actual_value = Column(String(50), nullable=True)
    revision_value = Column(String(50), nullable=True)
    surprise_value = Column(Float, nullable=True)
    surprise_direction = Column(String(20), default="PENDING")  # POSITIVE, NEGATIVE, IN_LINE, PENDING
    status = Column(String(30), default="UPCOMING", index=True)  # UPCOMING, ONGOING, RELEASED, POSTPONED, CANCELLED

    source_name = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)

    description_en = Column(Text, nullable=False)
    description_te = Column(Text, nullable=False)
    why_it_matters_en = Column(Text, nullable=False)
    why_it_matters_te = Column(Text, nullable=False)
    india_market_impact_en = Column(Text, nullable=False)
    india_market_impact_te = Column(Text, nullable=False)
    key_terms = Column(Text, nullable=True)  # JSON-encoded array of key terms

    last_verified_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    history_records = relationship("EventUpdateHistoryModel", back_populates="event", cascade="all, delete-orphan")


class EventUpdateHistoryModel(Base):
    __tablename__ = "event_update_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(80), ForeignKey("global_events.id"), nullable=False, index=True)
    update_type = Column(String(50), nullable=False)  # RESCHEDULED, POSTPONED, CANCELLED, ACTUAL_RELEASED, FORECAST_UPDATED
    field_changed = Column(String(50), nullable=True)
    old_value = Column(String(200), nullable=True)
    new_value = Column(String(200), nullable=True)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    event = relationship("GlobalEventModel", back_populates="history_records")


class UserEventPreferenceModel(Base):
    __tablename__ = "user_event_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), default="default_user", unique=True)
    alert_24h = Column(Boolean, default=True)
    alert_1h = Column(Boolean, default=True)
    alert_15m = Column(Boolean, default=True)
    alert_results = Column(Boolean, default=True)
    alert_postponed = Column(Boolean, default=True)
    preferred_countries = Column(String(500), default="ALL")
    preferred_categories = Column(String(500), default="ALL")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
