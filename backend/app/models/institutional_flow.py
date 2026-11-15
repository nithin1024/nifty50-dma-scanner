from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, Integer, String, UniqueConstraint

from app.database.session import Base


class InstitutionalCashFlowSnapshot(Base):
    """Daily provisional FII/FPI and DII cash market values published by NSE."""

    __tablename__ = "institutional_cash_flows"

    id = Column(Integer, primary_key=True, index=True)
    trading_date = Column(Date, nullable=False, index=True)
    category = Column(String(20), nullable=False, index=True)
    buy_value_crores = Column(Float, nullable=False)
    sell_value_crores = Column(Float, nullable=False)
    net_value_crores = Column(Float, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    source = Column(String(40), nullable=False, default="NSE_FII_DII_REPORT")

    __table_args__ = (
        UniqueConstraint("trading_date", "category", name="uq_institutional_cash_flow_date_category"),
    )
