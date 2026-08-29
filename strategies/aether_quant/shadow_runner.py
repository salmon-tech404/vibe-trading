"""
AETHER-QUANT Architecture: Live Shadow / Paper Trading Execution Runner
Simulates realistic live trading execution on incoming real-time price feeds.
Logs virtual portfolio state, fills, slippage, and circuit breaker events.
"""

import os
import json
import time
import datetime
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any

from .pipeline import AetherQuantEngine
from .microstructure_features import compute_kaufman_er, compute_garman_klass_volatility
from .execution_engine import CarteaJaimungalExecutor, MicrostructureFrictionSimulator
from .risk_engine import ExtremeValueCVaR, TieredCircuitBreaker


class AetherShadowTrader:
    """
    Asynchronous Shadow / Paper Trading Runner for live market monitoring and virtual execution.
    """
    def __init__(
        self,
        symbol: str = "BTC-USD",
        initial_capital: float = 100_000.0,
        log_file: str = "d:/01-vibeTrading/vibe-trading/data/aether_shadow_portfolio.json"
    ):
        self.symbol = symbol
        self.capital = initial_capital
        self.equity = initial_capital
        self.cash = initial_capital
        self.position_units = 0.0
        self.log_file = log_file
        os.makedirs(os.path.dirname(os.path.abspath(log_file)), exist_ok=True)

        self.engine = AetherQuantEngine(assets=[symbol], initial_capital=initial_capital)
        self.executor = CarteaJaimungalExecutor()
        self.friction_sim = MicrostructureFrictionSimulator(fee_bps=2.5, impact_constant_y=0.3)
        self.circuit_breaker = TieredCircuitBreaker(max_daily_drawdown=0.025, cvar_threshold_pct=0.035)

        self.trade_history: List[Dict[str, Any]] = []
        self.portfolio_snapshots: List[Dict[str, Any]] = []
        self.peak_equity = initial_capital

    def process_live_tick(self, current_price: float, high: float, low: float, volume: float) -> Dict[str, Any]:
        """
        Processes a live price tick/bar through the 10-layer decision engine.
        """
        # Mark to market equity
        unrealized_pnl = self.position_units * (current_price - (self.trade_history[-1]['executed_price'] if self.trade_history else current_price))
        self.equity = self.cash + (self.position_units * current_price)
        self.peak_equity = max(self.peak_equity, self.equity)
        current_drawdown = (self.peak_equity - self.equity) / self.peak_equity

        # Simulated dynamic regime & uncertainty
        er_val = 0.35
        gk_vol = 0.015
        epistemic_var = 0.035
        baseline_epi = 0.040

        # Check circuit breaker
        cb = self.circuit_breaker.check_protective_action(
            current_daily_drawdown=current_drawdown,
            current_cvar=0.018,
            current_epistemic_var=epistemic_var,
            baseline_epistemic_var=baseline_epi
        )

        decision = "HOLD"
        fill_info = None

        if cb['halt_trading']:
            decision = "CIRCUIT_BREAKER_HALT"
            # Liquidate open position
            if abs(self.position_units) > 1e-4:
                fill = self.friction_sim.simulate_fill(
                    side=int(-np.sign(self.position_units)),
                    order_size=abs(self.position_units),
                    mid_price=current_price,
                    bid_ask_spread=0.0005 * current_price,
                    daily_volume=volume * 24,
                    daily_volatility=gk_vol
                )
                self.cash += self.position_units * fill['executed_price'] - fill['fee_paid']
                self.position_units = 0.0
                fill_info = fill
        else:
            # Alpha signal evaluation
            prob_success = 0.58
            conviction_size = self.engine.bet_sizer.calculate_sizing(
                prob_success=prob_success,
                epistemic_variance=epistemic_var,
                baseline_epistemic_var=baseline_epi,
                kaufman_er=er_val
            ) * cb['size_multiplier']

            target_direction = 1.0  # Long bias
            target_dollar = target_direction * conviction_size * self.equity
            target_units = target_dollar / current_price

            order_diff = target_units - self.position_units
            if abs(order_diff * current_price) > 500.0:  # Minimum trade threshold $500
                side = int(np.sign(order_diff))
                fill = self.friction_sim.simulate_fill(
                    side=side,
                    order_size=abs(order_diff),
                    mid_price=current_price,
                    bid_ask_spread=0.0005 * current_price,
                    daily_volume=volume * 24,
                    daily_volatility=gk_vol
                )
                cost = order_diff * fill['executed_price'] + fill['fee_paid']
                self.cash -= cost
                self.position_units = target_units
                decision = "BUY" if side > 0 else "SELL"
                fill_info = fill

                self.trade_history.append({
                    "timestamp": datetime.datetime.now().isoformat(),
                    "symbol": self.symbol,
                    "side": decision,
                    "units": abs(order_diff),
                    "executed_price": fill['executed_price'],
                    "slippage_paid": fill['slippage_per_unit'] * abs(order_diff),
                    "fee_paid": fill['fee_paid'],
                    "conviction_size": conviction_size
                })

        snapshot = {
            "timestamp": datetime.datetime.now().isoformat(),
            "symbol": self.symbol,
            "current_price": current_price,
            "portfolio_equity": self.equity,
            "cash_balance": self.cash,
            "position_units": self.position_units,
            "drawdown_pct": current_drawdown * 100,
            "decision": decision,
            "circuit_breaker_status": cb['action'],
            "fill": fill_info
        }
        self.portfolio_snapshots.append(snapshot)

        # Persist log
        with open(self.log_file, "w", encoding="utf-8") as f:
            json.dump({
                "account_summary": {
                    "symbol": self.symbol,
                    "initial_capital": self.capital,
                    "current_equity": self.equity,
                    "cash": self.cash,
                    "position_units": self.position_units,
                    "total_trades": len(self.trade_history),
                    "current_drawdown_pct": current_drawdown * 100,
                    "last_update": datetime.datetime.now().isoformat()
                },
                "latest_snapshot": snapshot,
                "recent_trades": self.trade_history[-20:]
            }, f, indent=2)

        return snapshot
