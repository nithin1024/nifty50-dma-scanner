import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

logger = logging.getLogger("database.session")
settings = get_settings()


def _prepare_postgres_url(raw_url: str) -> str:
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    is_local = "localhost" in url or "127.0.0.1" in url
    if not is_local and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


def _build_engine():
    raw_url = settings.effective_database_url
    is_production = settings.APP_ENV.lower() == "production"

    if raw_url.startswith("postgresql"):
        pg_url = _prepare_postgres_url(raw_url)
        try:
            pg_engine = create_engine(
                pg_url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=5,
                pool_timeout=30,
            )
            with pg_engine.connect():
                pass
            return pg_url, pg_engine
        except Exception as exc:
            if is_production:
                logger.error("Production PostgreSQL connection failed: %s", exc)
                raise
            logger.warning("Local PostgreSQL unreachable (%s); falling back to SQLite for development.", exc)
            sqlite_url = "sqlite:///./nifty50_dma.db"
            return sqlite_url, create_engine(sqlite_url, connect_args={"check_same_thread": False})

    sqlite_url = raw_url or "sqlite:///./nifty50_dma.db"
    return sqlite_url, create_engine(sqlite_url, connect_args={"check_same_thread": False})


db_url, engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
