from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any

from app.services.options_universe_service import options_universe_service
from app.services.options_analytics_engine import options_analytics_engine
from app.services.alerts_and_monitoring_service import alerts_and_monitoring_service

router = APIRouter(prefix="/options", tags=["Options Analytics & Universe"])


@router.get("/universe")
async def get_fo_universe() -> Dict[str, Any]:
    """Retrieve NIFTY 50 F&O eligible universe and subscription stats."""
    return {
        "universe": options_universe_service.get_fo_eligible_universe(),
        "subscription_monitor": options_universe_service.get_subscription_stats()
    }


@router.get("/expiries")
async def get_expiries(symbol: str = Query("NIFTY")) -> Dict[str, Any]:
    """Retrieve valid upcoming weekly and monthly expiries for symbol."""
    return {
        "symbol": symbol.upper(),
        "expiries": options_universe_service.get_upcoming_expiries(symbol)
    }


@router.get("/chain")
async def get_option_chain(
    symbol: str = Query("NIFTY", description="NIFTY, BANKNIFTY or F&O constituent stock"),
    strike_range: int = Query(10, ge=5, le=25, description="Number of strikes above and below ATM"),
    expiry: Optional[str] = Query(None, description="Target expiry date (e.g. 20-NOV-2026)")
) -> Dict[str, Any]:
    """Retrieve complete live/session Option Chain with Greeks, PCR, Max Pain and GEX."""
    return options_analytics_engine.get_option_chain(symbol=symbol.upper(), strike_range=strike_range, expiry=expiry)


@router.get("/strategy-payoff")
async def get_strategy_payoff(
    strategy: str = Query("BULL_CALL_SPREAD", description="Strategy name e.g. BULL_CALL_SPREAD, IRON_CONDOR, STRADDLE"),
    spot: float = Query(23532.70, description="Underlying reference spot price"),
    lot_size: int = Query(25, description="Contract lot size")
) -> Dict[str, Any]:
    """Evaluate options strategy payoff, breakevens, max profit, and max loss."""
    return options_analytics_engine.calculate_strategy_payoff(strategy_name=strategy, spot=spot, lot_size=lot_size)


@router.get("/market-regime")
async def get_market_regime(
    spot: float = Query(23532.70, description="Underlying spot price")
) -> Dict[str, Any]:
    """Classifies current market regime using VWAP and option flow."""
    return options_analytics_engine.detect_market_regime(spot=spot)


@router.get("/alerts")
async def get_options_alerts() -> Dict[str, Any]:
    """Retrieve active market and data quality alerts."""
    return {
        "alerts": alerts_and_monitoring_service.get_active_alerts()
    }


@router.get("/data-quality")
async def get_data_quality() -> Dict[str, Any]:
    """Retrieve live feed health, protobuf version, and honest DEMO vs LIVE status."""
    return alerts_and_monitoring_service.get_data_quality_report()
