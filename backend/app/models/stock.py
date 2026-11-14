from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base


class ConstituentModel(Base):
    __tablename__ = "constituents"

    symbol = Column(String(20), primary_key=True, index=True)
    company_name = Column(String(200), nullable=False)
    industry = Column(String(100), nullable=False)
    isin = Column(String(20), nullable=False, unique=True, index=True)
    series = Column(String(10), default="EQ")
    weightage = Column(Float, default=0.0)
    upstox_instrument_key = Column(String(50), nullable=False, unique=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    ohlc_records = relationship("HistoricalOHLCModel", back_populates="constituent", cascade="all, delete-orphan")
    dma_records = relationship("DailyDMAModel", back_populates="constituent", cascade="all, delete-orphan")


class HistoricalOHLCModel(Base):
    __tablename__ = "historical_ohlc"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), ForeignKey("constituents.symbol"), nullable=False, index=True)
    trading_date = Column(String(20), nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, default=0)
    provider = Column(String(50), default="YAHOO_FINANCE_NSE")
    quality_status = Column(String(30), default="VERIFIED")
    retrieval_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("symbol", "trading_date", name="uq_symbol_date"),
    )

    constituent = relationship("ConstituentModel", back_populates="ohlc_records")


class DailyDMAModel(Base):
    __tablename__ = "daily_dmas"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), ForeignKey("constituents.symbol"), nullable=False, index=True)
    trading_date = Column(String(20), nullable=False, index=True)
    dma5 = Column(Float, nullable=True)
    dma10 = Column(Float, nullable=True)
    dma20 = Column(Float, nullable=True)
    dma50 = Column(Float, nullable=True)
    dma100 = Column(Float, nullable=True)
    dma200 = Column(Float, nullable=True)
    score = Column(Integer, default=0)
    classification = Column(String(50), default="NEUTRAL_OR_BEARISH")

    __table_args__ = (
        UniqueConstraint("symbol", "trading_date", name="uq_dma_symbol_date"),
    )

    constituent = relationship("ConstituentModel", back_populates="dma_records")


class DailyScanRecordModel(Base):
    __tablename__ = "daily_scan_records"

    id = Column(Integer, primary_key=True, index=True)
    scan_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    completed_session_date = Column(String(20), nullable=False, index=True)
    total_constituents = Column(Integer, default=50)
    verified_count = Column(Integer, default=50)
    count_6_6 = Column(Integer, default=0)
    count_5_6 = Column(Integer, default=0)
    results_json = Column(Text, nullable=False)


class CrossoverEventModel(Base):
    __tablename__ = "crossover_events"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), ForeignKey("constituents.symbol"), nullable=False, index=True)
    crossover_date = Column(String(20), nullable=False, index=True)
    period = Column(Integer, nullable=False)
    previous_close = Column(Float, nullable=False)
    previous_sma = Column(Float, nullable=False)
    latest_close = Column(Float, nullable=False)
    latest_sma = Column(Float, nullable=False)
    distance_pct = Column(Float, nullable=False)
