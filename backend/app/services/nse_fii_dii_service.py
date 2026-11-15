"""Fetch verified daily FII/DII cash activity from Upstox, with NSE fallback."""

import asyncio
import logging
import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import SessionLocal
from app.models.institutional_flow import InstitutionalCashFlowSnapshot
from app.services import upstox_market_client as upstox
from app.services.upstox_market_client import UpstoxApiError

logger = logging.getLogger("institutional_cash_flow_service")

NSE_REPORT_URL = "https://www.nseindia.com/reports/fii-dii"
NSE_DATA_URL = "https://www.nseindia.com/api/fiidiiTradeReact"
NSE_SOURCE_NAME = "NSE FII/FPI & DII cash-market report"
NSE_SOURCE = "NSE_FII_DII_REPORT"
UPSTOX_SOURCE_NAME = "Upstox Market Information API (NSE equity cash)"
UPSTOX_SOURCE = "UPSTOX_MARKET_INFO"
UPSTOX_FII_URL = "https://upstox.com/developer/api-documentation/get-fii-data/"
UPSTOX_DII_URL = "https://upstox.com/developer/api-documentation/get-dii-data/"
CACHE_SECONDS = 300
INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


class NseFiiDiiService:
    """Prefer Upstox's daily cash reports, falling back to NSE's official report."""

    def __init__(self) -> None:
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_time: Optional[datetime] = None
        self._lock = asyncio.Lock()

    @staticmethod
    def _parse_rows(rows: Any) -> tuple[date, Dict[str, Dict[str, float]]]:
        """Parse the documented NSE fiidiiTradeReact response fields."""
        if not isinstance(rows, list) or not rows:
            raise ValueError("NSE returned no FII/DII report rows")

        parsed: Dict[str, Dict[str, float]] = {}
        trade_dates: set[date] = set()
        for row in rows:
            if not isinstance(row, dict):
                continue
            category = row.get("category")
            raw_date = row.get("date")
            if category not in {"FII/FPI", "DII"} or not isinstance(raw_date, str):
                continue
            try:
                trading_date = datetime.strptime(raw_date, "%d-%b-%Y").date()
                buy = float(row["buyValue"])
                sell = float(row["sellValue"])
                net = float(row["netValue"])
            except (KeyError, TypeError, ValueError) as exc:
                raise ValueError("NSE returned an invalid FII/DII report row") from exc
            if not all(math.isfinite(value) for value in (buy, sell, net)):
                raise ValueError("NSE returned a non-finite FII/DII value")
            if buy < 0 or sell < 0 or abs((buy - sell) - net) > 0.03:
                raise ValueError("NSE FII/DII values failed the buy-minus-sell check")
            trade_dates.add(trading_date)
            parsed[category] = {"buy": buy, "sell": sell, "net": net}

        if len(trade_dates) != 1 or set(parsed) != {"FII/FPI", "DII"}:
            raise ValueError("NSE did not return both FII/FPI and DII for one trading date")
        return next(iter(trade_dates)), parsed

    async def _fetch_nse(self) -> tuple[date, Dict[str, Dict[str, float]]]:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": NSE_REPORT_URL,
        }
        timeout = httpx.Timeout(15.0, connect=7.0)
        async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
            # NSE issues session cookies from the report page.
            page = await client.get(NSE_REPORT_URL)
            page.raise_for_status()
            response = await client.get(NSE_DATA_URL)
            response.raise_for_status()
            return self._parse_rows(response.json())

    @staticmethod
    def _parse_upstox_rows(payload: Any) -> Dict[date, Dict[str, float]]:
        """Parse documented Upstox Market Information daily activity rows.

        Upstox reports amounts in INR. The website displays INR crore, so the
        conversion is explicit and applied only after validating the source row.
        """
        if not isinstance(payload, dict):
            raise ValueError("Upstox activity data was not an object")
        rows = payload.get("NSE_EQ|CASH")
        if not isinstance(rows, list) or not rows:
            raise ValueError("Upstox returned no NSE equity cash activity rows")

        parsed: Dict[date, Dict[str, float]] = {}
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError("Upstox returned an invalid cash activity row")
            try:
                timestamp_ms = int(row["time_stamp"])
                buy_inr = float(row["buy_amount"])
                sell_inr = float(row["sell_amount"])
            except (KeyError, TypeError, ValueError) as exc:
                raise ValueError("Upstox cash activity row did not match its documented fields") from exc
            if not all(math.isfinite(value) for value in (timestamp_ms, buy_inr, sell_inr)):
                raise ValueError("Upstox returned a non-finite cash activity value")
            if timestamp_ms <= 0 or buy_inr < 0 or sell_inr < 0:
                raise ValueError("Upstox returned an invalid cash activity value")

            trading_date = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).astimezone(INDIA_TIMEZONE).date()
            buy_crores = round(buy_inr / 10_000_000, 2)
            sell_crores = round(sell_inr / 10_000_000, 2)
            parsed[trading_date] = {
                "buy": buy_crores,
                "sell": sell_crores,
                "net": round(buy_crores - sell_crores, 2),
            }
        if not parsed:
            raise ValueError("Upstox returned no parseable daily cash activity rows")
        return parsed

    async def _fetch_upstox(self) -> List[Dict[str, Any]]:
        fii_payload, dii_payload = await asyncio.gather(
            upstox.get_fii_activity(data_type="NSE_EQ|CASH", interval="1D"),
            upstox.get_dii_activity(data_type="NSE_EQ|CASH", interval="1D"),
        )
        fii_by_date = self._parse_upstox_rows(fii_payload)
        dii_by_date = self._parse_upstox_rows(dii_payload)
        shared_dates = sorted(set(fii_by_date) & set(dii_by_date), reverse=True)
        if not shared_dates:
            raise ValueError("Upstox FII and DII reports have no shared trading dates")
        return [
            {
                "date": trading_date.isoformat(),
                "fii_fpi": fii_by_date[trading_date],
                "dii": dii_by_date[trading_date],
            }
            for trading_date in shared_dates[:30]
        ]

    @staticmethod
    def _to_history_row(trading_date: date, categories: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
        return {
            "date": trading_date.isoformat(),
            "fii_fpi": categories["FII/FPI"],
            "dii": categories["DII"],
        }

    @staticmethod
    def _save_history(history: List[Dict[str, Any]], observed_at: datetime, provider: str) -> None:
        db = SessionLocal()
        try:
            for session in history:
                trading_date = date.fromisoformat(session["date"])
                for category in ("fii_fpi", "dii"):
                    values = session[category]
                    row = (
                        db.query(InstitutionalCashFlowSnapshot)
                        .filter(
                            InstitutionalCashFlowSnapshot.trading_date == trading_date,
                            InstitutionalCashFlowSnapshot.category == category,
                        )
                        .first()
                    )
                    if row is None:
                        row = InstitutionalCashFlowSnapshot(
                            trading_date=trading_date,
                            category=category,
                            source=provider,
                        )
                        db.add(row)
                    row.buy_value_crores = values["buy"]
                    row.sell_value_crores = values["sell"]
                    row.net_value_crores = values["net"]
                    row.observed_at = observed_at
                    row.source = provider
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            logger.warning("Could not persist institutional cash-flow snapshots", exc_info=True)
        finally:
            db.close()

    @staticmethod
    def _read_history(limit: int = 30) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            rows = (
                db.query(InstitutionalCashFlowSnapshot)
                .order_by(InstitutionalCashFlowSnapshot.trading_date.desc())
                .limit(limit * 2)
                .all()
            )
        except SQLAlchemyError:
            logger.warning("Could not load archived institutional cash-flow snapshots", exc_info=True)
            return []
        finally:
            db.close()

        paired: Dict[tuple[date, str], Dict[str, Any]] = {}
        for row in rows:
            item = paired.setdefault(
                (row.trading_date, row.source),
                {"date": row.trading_date.isoformat(), "source_provider": row.source},
            )
            prefix = "fii" if row.category == "fii_fpi" else "dii"
            item[f"{prefix}_buy"] = row.buy_value_crores
            item[f"{prefix}_sell"] = row.sell_value_crores
            item[f"{prefix}_net"] = row.net_value_crores
        history = [
            item for item in paired.values()
            if "fii_net" in item and "dii_net" in item
        ]
        return sorted(history, key=lambda item: item["date"], reverse=True)[:limit]

    @staticmethod
    def _format_report(
        history: List[Dict[str, Any]], provider: str, observed_at: Optional[datetime], status: str = "CURRENT",
        detail: Optional[str] = None,
    ) -> Dict[str, Any]:
        latest = history[0]
        is_upstox = provider == UPSTOX_SOURCE
        source_url = UPSTOX_FII_URL if is_upstox else NSE_REPORT_URL
        provider_name = UPSTOX_SOURCE_NAME if is_upstox else NSE_SOURCE_NAME
        return {
            "status": status,
            "source": provider_name,
            "source_provider": provider,
            "source_url": source_url,
            "data_date": latest["date"],
            "fetched_at": observed_at.isoformat() if observed_at else None,
            "provisional": not is_upstox,
            "unit": "INR_CRORE",
            "update_frequency": "DAILY",
            "latest": {
                "fii_fpi": {
                    "buy": latest["fii_buy"],
                    "sell": latest["fii_sell"],
                    "net": latest["fii_net"],
                },
                "dii": {
                    "buy": latest["dii_buy"],
                    "sell": latest["dii_sell"],
                    "net": latest["dii_net"],
                },
            },
            "history": history,
            "history_sessions": len(history),
            "detail": detail,
        }

    async def _fetch_provider(self) -> tuple[List[Dict[str, Any]], str]:
        try:
            history = await self._fetch_upstox()
            return history, UPSTOX_SOURCE
        except (UpstoxApiError, httpx.HTTPError, ValueError, TypeError) as exc:
            # Only exception class/status is logged; never include auth headers or tokens.
            status = getattr(exc, "status_code", None)
            logger.info("Upstox FII/DII unavailable (status=%s, error=%s); trying NSE", status, type(exc).__name__)

        try:
            trading_date, categories = await self._fetch_nse()
            return [self._to_history_row(trading_date, categories)], NSE_SOURCE
        except (httpx.HTTPError, ValueError, TypeError) as exc:
            logger.warning("NSE FII/DII fallback unavailable (%s)", type(exc).__name__)
            raise

    async def get_report(self) -> Dict[str, Any]:
        async with self._lock:
            now = datetime.now(timezone.utc)
            if self._cache is not None and self._cache_time is not None:
                if (now - self._cache_time).total_seconds() < CACHE_SECONDS:
                    return self._cache

            try:
                fetched, provider = await self._fetch_provider()
                observed_at = datetime.now(timezone.utc)
                self._save_history(fetched, observed_at, provider)
                history = self._read_history()
                if not history:
                    # Persistence may be unavailable; return this verified response in memory.
                    history = []
                    for session in fetched:
                        history.append({
                            "date": session["date"],
                            "source_provider": provider,
                            "fii_buy": session["fii_fpi"]["buy"],
                            "fii_sell": session["fii_fpi"]["sell"],
                            "fii_net": session["fii_fpi"]["net"],
                            "dii_buy": session["dii"]["buy"],
                            "dii_sell": session["dii"]["sell"],
                            "dii_net": session["dii"]["net"],
                        })
                report = self._format_report(history, provider, observed_at)
                self._cache, self._cache_time = report, observed_at
                return report
            except (UpstoxApiError, httpx.HTTPError, ValueError, TypeError) as exc:
                logger.warning("Institutional cash-flow providers unavailable (%s)", type(exc).__name__)

            if self._cache is not None:
                return {
                    **self._cache,
                    "status": "STALE",
                    "detail": "Providers could not refresh; showing the last verified response.",
                }

            history = self._read_history()
            if history:
                latest = history[0]
                return self._format_report(
                    history,
                    latest.get("source_provider", NSE_SOURCE),
                    None,
                    status="STALE",
                    detail="Providers could not refresh; showing the last archived verified values.",
                )

            return {
                "status": "WAITING",
                "source": "Upstox Market Information API with NSE fallback",
                "source_provider": None,
                "source_url": UPSTOX_FII_URL,
                "data_date": None,
                "fetched_at": None,
                "provisional": None,
                "unit": "INR_CRORE",
                "update_frequency": "DAILY",
                "latest": None,
                "history": [],
                "history_sessions": 0,
                "detail": "Verified daily FII/DII data is temporarily unavailable; no values are being estimated.",
            }


nse_fii_dii_service = NseFiiDiiService()
