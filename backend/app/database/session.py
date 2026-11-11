from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
# In development without local postgres running, fall back gracefully to sqlite
if "postgresql" in db_url:
    # Test if postgres is reachable, else fall back to local sqlite
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect():
            pass
    except Exception:
        db_url = "sqlite:///./nifty50_dma.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
