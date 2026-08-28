"""Loss Collector Module: Captures and structures trading loss events with full market context."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TradeContext(BaseModel):
    symbol: str = "BTC/USDT"
    timeframe: str = "15m"
    action: str = "BUY"  # BUY or SELL
    entry_price: float = 0.0
    exit_price: float = 0.0
    stop_loss: float = 0.0
    take_profit: float = 0.0
    pnl: float = 0.0
    pnl_percent: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    # Technical Context at entry
    rsi: Optional[float] = None
    ema_fast: Optional[float] = None
    ema_slow: Optional[float] = None
    trend_h4: Optional[str] = None  # UPTREND, DOWNTREND, SIDEWAY
    adx: Optional[float] = None
    volume_ratio: Optional[float] = None  # Current Vol / 20-period Avg Vol
    session: Optional[str] = None  # Asian, London, New York
    notes: Optional[str] = None


class LossCollector:
    """Collects and stores trade loss context for AI diagnosis."""

    def __init__(self, storage_path: Optional[Path] = None):
        if storage_path is None:
            self.storage_path = Path("data/loss_events.json")
        else:
            self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

    def record_loss(self, trade: TradeContext) -> None:
        """Record a single loss event."""
        events = self.load_events()
        events.append(trade.model_dump())
        self.save_events(events)

    def load_events(self) -> List[Dict[str, Any]]:
        """Load all recorded loss events."""
        if not self.storage_path.exists():
            return []
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save_events(self, events: List[Dict[str, Any]]) -> None:
        """Save loss events to disk."""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=2, ensure_ascii=False)

    def clear_events(self) -> None:
        """Clear the loss events cache."""
        if self.storage_path.exists():
            self.save_events([])

    def generate_mock_loss_data(self, count: int = 10) -> List[Dict[str, Any]]:
        """Generate realistic mock loss data for testing the diagnostic agent."""
        mock_trades = [
            TradeContext(
                symbol="BTC/USDT",
                timeframe="15m",
                action="BUY",
                entry_price=64200.0,
                exit_price=63800.0,
                stop_loss=63800.0,
                take_profit=65000.0,
                pnl=-40.0,
                pnl_percent=-0.62,
                rsi=76.5,
                ema_fast=64100.0,
                ema_slow=64350.0,
                trend_h4="DOWNTREND",
                adx=14.2,
                volume_ratio=0.8,
                session="Asian",
                notes="Bought into overbought RSI while H4 trend is bearish and market is sideway."
            ),
            TradeContext(
                symbol="BTC/USDT",
                timeframe="15m",
                action="BUY",
                entry_price=64500.0,
                exit_price=64100.0,
                stop_loss=64100.0,
                take_profit=65300.0,
                pnl=-40.0,
                pnl_percent=-0.62,
                rsi=71.2,
                ema_fast=64400.0,
                ema_slow=64700.0,
                trend_h4="DOWNTREND",
                adx=12.5,
                volume_ratio=0.6,
                session="Asian",
                notes="Fake breakout during low volume Asian session."
            ),
            TradeContext(
                symbol="ETH/USDT",
                timeframe="15m",
                action="SELL",
                entry_price=3450.0,
                exit_price=3485.0,
                stop_loss=3485.0,
                take_profit=3380.0,
                pnl=-35.0,
                pnl_percent=-1.01,
                rsi=28.0,
                ema_fast=3460.0,
                ema_slow=3420.0,
                trend_h4="UPTREND",
                adx=32.0,
                volume_ratio=2.4,
                session="New York",
                notes="Sold into oversold RSI against strong H4 bullish trend during high volume NY session."
            ),
            TradeContext(
                symbol="BTC/USDT",
                timeframe="15m",
                action="BUY",
                entry_price=63900.0,
                exit_price=63500.0,
                stop_loss=63500.0,
                take_profit=64700.0,
                pnl=-40.0,
                pnl_percent=-0.63,
                rsi=73.0,
                ema_fast=63850.0,
                ema_slow=64100.0,
                trend_h4="DOWNTREND",
                adx=15.0,
                volume_ratio=0.7,
                session="Asian",
                notes="Counter-trend buy in Asian session."
            ),
            TradeContext(
                symbol="SOL/USDT",
                timeframe="15m",
                action="BUY",
                entry_price=145.0,
                exit_price=141.5,
                stop_loss=141.5,
                take_profit=152.0,
                pnl=-35.0,
                pnl_percent=-2.41,
                rsi=78.2,
                ema_fast=144.0,
                ema_slow=147.0,
                trend_h4="DOWNTREND",
                adx=13.0,
                volume_ratio=0.5,
                session="Asian",
                notes="Low volume overbought buy."
            )
        ]
        self.save_events([t.model_dump() for t in mock_trades])
        return self.load_events()
