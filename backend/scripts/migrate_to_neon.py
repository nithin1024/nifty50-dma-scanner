"""
Safe Database Migration & Verification Script (SQLite / Render PostgreSQL -> Neon PostgreSQL)
Usage:
  python backend/scripts/migrate_to_neon.py --source sqlite:///./backend/nifty50_dma.db --target "$NEON_DATABASE_URL"
  python backend/scripts/migrate_to_neon.py --verify-only --source sqlite:///./backend/nifty50_dma.db --target "$NEON_DATABASE_URL"
"""

from __future__ import annotations
import argparse
import os
import sys
from pathlib import Path
from typing import List

from sqlalchemy import create_engine, inspect, MetaData, text

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.models import Base  # noqa: E402


ORDERED_TABLES: List[str] = [
    "constituents",
    "historical_ohlc",
    "daily_dmas",
    "daily_scan_records",
    "crossover_events",
    "global_events",
    "event_update_history",
    "user_event_preferences",
    "option_oi_snapshots",
    "institutional_cash_flows",
]


def normalize_pg_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql") and "localhost" not in url and "127.0.0.1" not in url and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


def migrate(source_url: str, target_url: str, batch_size: int = 500) -> None:
    src_engine = create_engine(normalize_pg_url(source_url))
    tgt_engine = create_engine(
        normalize_pg_url(target_url),
        pool_pre_ping=True,
        pool_recycle=300,
    )

    # Create target schema from authoritative SQLAlchemy models
    Base.metadata.create_all(bind=tgt_engine)

    src_meta = MetaData()
    src_meta.reflect(bind=src_engine)
    tgt_meta = MetaData()
    tgt_meta.reflect(bind=tgt_engine)

    for table_name in ORDERED_TABLES:
        if table_name not in src_meta.tables:
            print(f"[SKIP] {table_name} not in source")
            continue
        src_tbl = src_meta.tables[table_name]
        tgt_tbl = tgt_meta.tables[table_name]

        with src_engine.connect() as s_conn:
            rows = [dict(r._mapping) for r in s_conn.execute(src_tbl.select()).fetchall()]

        if not rows:
            print(f"[OK]   {table_name}: 0 rows (empty)")
            continue

        with tgt_engine.begin() as t_conn:
            existing_count = t_conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar() or 0
            if existing_count > 0:
                print(f"[SKIP] {table_name}: target already has {existing_count} rows (preserving existing data)")
                continue
            for i in range(0, len(rows), batch_size):
                t_conn.execute(tgt_tbl.insert(), rows[i : i + batch_size])

            # Reset PostgreSQL serial sequence if table has an integer 'id' primary key
            if "id" in tgt_tbl.columns:
                t_conn.execute(
                    text(
                        f"SELECT setval(pg_get_serial_sequence('\"{table_name}\"', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM \"{table_name}\"), 1), true)"
                    )
                )
        print(f"[MIGRATED] {table_name}: {len(rows)} rows")


def verify(source_url: str, target_url: str) -> int:
    src_engine = create_engine(normalize_pg_url(source_url))
    tgt_engine = create_engine(normalize_pg_url(target_url), pool_pre_ping=True)

    src_insp = inspect(src_engine)
    tgt_insp = inspect(tgt_engine)
    src_tables = set(src_insp.get_table_names())
    tgt_tables = set(tgt_insp.get_table_names())

    failures = 0
    print("\n=== DATABASE MIGRATION VERIFICATION ===")
    for t in ORDERED_TABLES:
        if t not in tgt_tables:
            print(f"[FAIL] Missing table in target: {t}")
            failures += 1
            continue
        src_cols = {c["name"] for c in src_insp.get_columns(t)} if t in src_tables else set()
        tgt_cols = {c["name"] for c in tgt_insp.get_columns(t)}
        missing_cols = src_cols - tgt_cols
        if missing_cols:
            print(f"[FAIL] {t} missing columns: {sorted(missing_cols)}")
            failures += 1

        with src_engine.connect() as sc:
            s_cnt = sc.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar() if t in src_tables else 0
        with tgt_engine.connect() as tc:
            t_cnt = tc.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()

        status = "PASS" if s_cnt == t_cnt else "DIFF"
        if status != "PASS":
            failures += 1
        tgt_pks = tgt_insp.get_pk_constraint(t).get("constrained_columns", [])
        tgt_fks = len(tgt_insp.get_foreign_keys(t))
        tgt_idx = len(tgt_insp.get_indexes(t))
        print(f"[{status}] {t:26s} src={s_cnt:6d} tgt={t_cnt:6d} pk={tgt_pks} fk={tgt_fks} idx={tgt_idx}")

    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate and verify NIFTY 50 DMA Scanner DB to Neon PostgreSQL.")
    parser.add_argument("--source", default="sqlite:///./backend/nifty50_dma.db", help="Source DB URL")
    parser.add_argument("--target", default=os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL", ""), help="Target Neon PostgreSQL URL")
    parser.add_argument("--verify-only", action="store_true", help="Only run schema and row count verification")
    args = parser.parse_args()

    if not args.target or not args.target.startswith(("postgres://", "postgresql://")):
        print("ERROR: Target Neon PostgreSQL URL (--target or NEON_DATABASE_URL) is required.", file=sys.stderr)
        return 2

    if not args.verify_only:
        migrate(args.source, args.target)
    return verify(args.source, args.target)


if __name__ == "__main__":
    raise SystemExit(main())
