"""FastAPI Routes for Binance USD-M Futures Execution & Auto-Trading."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.trading.connectors.binance.futures_client import BinanceFuturesClient

router = APIRouter(prefix="/api/futures", tags=["Binance Futures Live Execution"])


class TestKeysRequest(BaseModel):
    apiKey: str = Field(..., min_length=5)
    apiSecret: str = Field(..., min_length=5)
    isTestnet: bool = True


class PlaceOrderRequest(BaseModel):
    apiKey: str
    apiSecret: str
    isTestnet: bool = True
    symbol: str
    side: str  # "BUY" or "SELL"
    quantity: float
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    leverage: int = 10


class ClosePositionRequest(BaseModel):
    apiKey: str
    apiSecret: str
    isTestnet: bool = True
    symbol: str


class EmergencyHaltRequest(BaseModel):
    apiKey: str
    apiSecret: str
    isTestnet: bool = True


@router.post("/test-keys")
async def test_keys(req: TestKeysRequest) -> Dict[str, Any]:
    """Validate Binance Futures API Credentials and return account summary."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        res = client.test_connection()
        bal = client.get_account_balance()
        return {
            "status": "ok",
            "serverTime": res.get("serverTime"),
            "canTrade": res.get("canTrade", True),
            "totalBalance": bal.get("balance", 0.0),
            "availableBalance": bal.get("availableBalance", 0.0),
            "unrealizedPnl": bal.get("unrealizedProfit", 0.0),
            "isTestnet": req.isTestnet,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/balance")
async def get_balance(req: TestKeysRequest) -> Dict[str, Any]:
    """Fetch current USDT Wallet & Available Margin."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        return client.get_account_balance()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/positions")
async def get_positions(req: TestKeysRequest) -> List[Dict[str, Any]]:
    """Fetch currently active positions from Binance Futures."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        return client.get_open_positions()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/order")
async def place_order(req: PlaceOrderRequest) -> Dict[str, Any]:
    """Place a live Market Bracket Order (Entry + SL + TP) on Binance Futures."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        return client.place_bracket_order(
            symbol=req.symbol,
            side=req.side,
            quantity=req.quantity,
            stop_loss_price=req.stopLoss,
            take_profit_price=req.takeProfit,
            leverage=req.leverage,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/close-position")
async def close_position(req: ClosePositionRequest) -> Dict[str, Any]:
    """Close an active position at market and cancel pending orders."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        return client.close_position(req.symbol)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/emergency-halt")
async def emergency_halt(req: EmergencyHaltRequest) -> Dict[str, Any]:
    """EMERGENCY KILL SWITCH: Liquidate all open positions and cancel all open orders."""
    try:
        client = BinanceFuturesClient(req.apiKey, req.apiSecret, req.isTestnet)
        return client.emergency_halt_all()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def register_futures_routes(app: Any) -> None:
    """Register routes onto FastAPI app."""
    app.include_router(router)
