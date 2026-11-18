from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
import logging
import json

from app.config import get_settings
from app.api.routes import health, stocks, daily_scanner, live_scanner, data_status, history, stock_details, volume_analytics, heavyweights, export, market_intelligence, global_events, ema_scanner, options, chart
from app.services.db_service import db_service
from app.services.global_events_service import global_events_service
from app import __version__
from app.services.upstox_feed_service import subscription_manager
from app.services.upstox_market_client import get_user_profile, UpstoxApiError
import asyncio

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nifty50_dma_scanner")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s v%s in %s mode", settings.APP_NAME, __version__, settings.APP_ENV)
    # Initialize database tables and sync constituents
    try:
        db_service.init_db()
        db_service.sync_constituents_to_db()
        global_events_service.init_database_events()
    except Exception as e:
        logger.warning(f"Database startup sync warning: {e}")
    settings = get_settings()
    snapshot_task = asyncio.create_task(_oi_snapshot_scheduler(), name="oi-snapshot-scheduler")
    if settings.UPSTOX_ACCESS_TOKEN.strip():
        # Start subscription manager directly with the configured Analytics Token.
        # Upstox Analytics Tokens support Market Data Feed V3 and Option Chain APIs without daily OAuth.
        logger.info("Initializing Upstox Market Data Feed V3 subscription manager with configured access token")
        subscription_manager.start()
    else:
        subscription_manager.status = "WAITING"
        subscription_manager.authentication_status = "WAITING"
    yield
    snapshot_task.cancel()
    await asyncio.gather(snapshot_task, return_exceptions=True)
    await subscription_manager.stop()
    logger.info("Shutting down %s", settings.APP_NAME)


async def _oi_snapshot_scheduler():
    """Take exchange OI snapshots on 15-minute boundaries after actual feed data arrives."""
    from datetime import datetime, timezone
    while True:
        now = datetime.now(timezone.utc).timestamp()
        wait = 900 - (now % 900)
        await asyncio.sleep(wait)
        if subscription_manager.get_status().get("status") == "LIVE":
            subscription_manager.capture_oi_snapshot()


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=__version__,
    description=(
        "Production-grade NIFTY 50 Daily and Live DMA (Simple Moving Average) Scanner API. "
        "Strict real market data provenance, 6/6 and 5/6 classifications, and fresh crossover detection."
    ),
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(daily_scanner.router, prefix="/api/v1")
app.include_router(live_scanner.router, prefix="/api/v1")
app.include_router(data_status.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(stock_details.router, prefix="/api/v1")
app.include_router(volume_analytics.router, prefix="/api/v1")
app.include_router(heavyweights.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(market_intelligence.router, prefix="/api/v1")
app.include_router(global_events.router, prefix="/api/v1")
app.include_router(ema_scanner.router, prefix="/api/v1")
app.include_router(options.router, prefix="/api/v1")
app.include_router(chart.router, prefix="/api/v1")


@app.websocket("/ws/options-feed")
async def options_feed_websocket(websocket: WebSocket):
    """Relay normalized exchange ticks from the authenticated Upstox V3 connection."""
    await websocket.accept()
    subscription_manager.clients.add(websocket)
    await websocket.send_json({"type": "status", **subscription_manager.get_status()})
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping": await websocket.send_text("pong")
            elif data:
                try: await subscription_manager.subscribe_client_request(json.loads(data))
                except (ValueError, TypeError): pass
    except WebSocketDisconnect:
        subscription_manager.clients.discard(websocket)
    except Exception:
        subscription_manager.clients.discard(websocket)


@app.websocket("/ws/chart-feed")
async def chart_feed_websocket(websocket: WebSocket):
    """Relay actual normalized Upstox feed ticks for chart instruments."""
    await websocket.accept()
    subscription_manager.clients.add(websocket)
    await websocket.send_json({"type": "status", **subscription_manager.get_status()})
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data:
                try: await subscription_manager.subscribe_client_request(json.loads(data))
                except (ValueError, TypeError): pass
    except WebSocketDisconnect:
        subscription_manager.clients.discard(websocket)
    except Exception:
        subscription_manager.clients.discard(websocket)


@app.websocket("/ws/live-scanner")
async def live_scanner_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time live intraday DMA scanner streaming."""
    from app.services.upstox_service import live_feed_manager
    await live_feed_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional client messages / pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        live_feed_manager.disconnect(websocket)
    except Exception:
        live_feed_manager.disconnect(websocket)


@app.get("/api")
async def api_root():
    return {
        "app": settings.APP_NAME,
        "version": __version__,
        "documentation": "/api/docs",
        "health": "/api/v1/health"
    }


# Mount compiled frontend if dist directory exists
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": __version__,
            "documentation": "/api/docs",
            "health": "/api/v1/health"
        }
