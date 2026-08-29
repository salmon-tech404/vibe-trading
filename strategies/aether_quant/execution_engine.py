"""
AETHER-QUANT Architecture - Layer 8: Optimal Inventory Control & Execution
Grounding:
- Alvaro Cartea & Sebastian Jaimungal: Algorithmic and High-Frequency Trading
- Robert Almgren & Neil Chriss: Optimal Execution of Portfolio Transactions
- Sebastien Donadio & Sourav Ghosh: Developing High-Frequency Trading Systems
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional


class CarteaJaimungalExecutor:
    """
    Continuous optimal execution trajectory with inventory penalty.
    HJB Solution: nu_t* = - zeta * cosh(zeta * (T - t)) / sinh(zeta * (T - t)) * (q_t - Q)
    where zeta = sqrt(phi / kappa).
    """
    def __init__(
        self,
        inventory_risk_phi: float = 1e-3,
        temp_impact_kappa: float = 1e-4,
        execution_horizon_sec: float = 60.0
    ):
        self.phi = inventory_risk_phi
        self.kappa = temp_impact_kappa
        self.T = execution_horizon_sec
        self.zeta = np.sqrt(self.phi / max(self.kappa, 1e-8))

    def compute_optimal_trading_speed(
        self,
        current_inventory: float,
        target_inventory: float,
        time_elapsed_sec: float
    ) -> float:
        """
        Computes instantaneous trading rate nu_t* (shares per second).
        """
        tau = max(1.0, self.T - time_elapsed_sec)
        inv_diff = current_inventory - target_inventory

        # Hyperbolic ratio
        sinh_val = np.sinh(self.zeta * tau)
        cosh_val = np.cosh(self.zeta * tau)
        
        if abs(sinh_val) < 1e-8:
            ratio = 1.0 / tau
        else:
            ratio = self.zeta * (cosh_val / sinh_val)

        trading_speed = -ratio * inv_diff
        return float(trading_speed)

    def generate_execution_schedule(
        self,
        initial_inv: float,
        target_inv: float,
        num_steps: int = 10
    ) -> pd.DataFrame:
        """Generates scheduled execution trajectory."""
        dt = self.T / num_steps
        times = np.linspace(0, self.T, num_steps + 1)
        q_path = np.zeros(num_steps + 1)
        speed_path = np.zeros(num_steps + 1)
        
        q_path[0] = initial_inv
        
        for i in range(num_steps):
            t = times[i]
            speed = self.compute_optimal_trading_speed(q_path[i], target_inv, t)
            speed_path[i] = speed
            q_path[i + 1] = q_path[i] + speed * dt

        speed_path[-1] = 0.0
        q_path[-1] = target_inv

        df = pd.DataFrame({
            'time_sec': times,
            'inventory': q_path,
            'trading_speed': speed_path
        })
        return df


class MicrostructureFrictionSimulator:
    """
    Simulates realistic order execution frictions:
    1. Linear fee (bps)
    2. Half-spread cost
    3. Square-root market impact: Delta P = Y * sigma_daily * sqrt(V_order / V_daily)
    4. Execution latency delay (50ms)
    """
    def __init__(
        self,
        fee_bps: float = 2.5,
        impact_constant_y: float = 0.5,
        simulated_latency_ms: float = 50.0
    ):
        self.fee_bps = fee_bps
        self.Y = impact_constant_y
        self.latency_ms = simulated_latency_ms

    def simulate_fill(
        self,
        side: int, # +1 Buy, -1 Sell
        order_size: float,
        mid_price: float,
        bid_ask_spread: float,
        daily_volume: float,
        daily_volatility: float
    ) -> Dict[str, float]:
        """
        Returns executed fill price, fee paid, and market impact penalty.
        """
        # 1. Spread crossing cost
        half_spread = 0.5 * bid_ask_spread
        base_fill = mid_price + (half_spread if side > 0 else -half_spread)

        # 2. Square-Root Market Impact
        participation = max(1e-8, order_size / max(daily_volume, 1.0))
        impact_pct = self.Y * daily_volatility * np.sqrt(participation)
        impact_dollar = mid_price * impact_pct

        executed_price = base_fill + (impact_dollar if side > 0 else -impact_dollar)

        # 3. Exchange fee
        fee_paid = executed_price * order_size * (self.fee_bps / 10000.0)

        # 4. Total slippage vs mid price
        slippage = abs(executed_price - mid_price)

        return {
            'executed_price': float(executed_price),
            'slippage_per_unit': float(slippage),
            'fee_paid': float(fee_paid),
            'market_impact_pct': float(impact_pct),
            'latency_ms': self.latency_ms
        }
