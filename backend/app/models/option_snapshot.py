from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, UniqueConstraint

from app.database.session import Base


class OptionOISnapshotModel(Base):
    __tablename__ = "option_oi_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    captured_at = Column(DateTime(timezone=True), nullable=False, index=True,
                          default=lambda: datetime.now(timezone.utc))
    underlying = Column(String(80), nullable=False, index=True)
    expiry = Column(String(10), nullable=False, index=True)
    instrument_key = Column(String(80), nullable=False, index=True)
    option_type = Column(String(2), nullable=False)
    strike_price = Column(Float, nullable=False)
    open_interest = Column(Float, nullable=False)
    ltp = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)

    __table_args__ = (UniqueConstraint("captured_at", "instrument_key", name="uq_oi_snapshot_instrument_time"),)
