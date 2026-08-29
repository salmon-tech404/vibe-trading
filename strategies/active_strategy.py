"""Vibe-Trading Auto-Optimized Strategy Draft (Quant-Verified)."""

import pandas as pd
import numpy as np


class StrategyEngine:
    def __init__(
        self,
        rsi_period: int = 14,
        rsi_upper: float = 65.0,
        rsi_lower: float = 35.0,
        use_trend: bool = True,
        use_volume: bool = True
    ):
        self.rsi_period = rsi_period
        self.rsi_upper = rsi_upper
        self.rsi_lower = rsi_lower
        self.use_trend = use_trend
        self.use_volume = use_volume

    def calculate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Generate vector signals: 1 for BUY, -1 for SELL, 0 for HOLD."""
        signals = pd.Series(0, index=df.index)

        trend_bullish = (df.get("trend_h4", "Uptrend") == "Uptrend") if self.use_trend else True
        trend_bearish = (df.get("trend_h4", "Downtrend") == "Downtrend") if self.use_trend else True

        rsi = df.get("rsi", pd.Series(50.0, index=df.index))
        rsi_valid_buy = (rsi < self.rsi_upper) & (rsi > 40.0)
        rsi_valid_sell = (rsi > self.rsi_lower) & (rsi < 60.0)

        vol_ratio = df.get("volume_ratio", pd.Series(1.0, index=df.index))
        vol_confirmed = (vol_ratio >= 0.9) if self.use_volume else True

        buy_cond = trend_bullish & rsi_valid_buy & vol_confirmed
        sell_cond = trend_bearish & rsi_valid_sell

        signals[buy_cond] = 1
        signals[sell_cond] = -1
        return signals
