"""
AETHER-QUANT Architecture - Layer 10: Online Adaptation, Concept Drift & CUSUM Tracking
Grounding:
- Marcos Lopez de Prado: Advances in Financial Machine Learning (CUSUM filter)
- Stefan Jansen: Machine Learning for Algorithmic Trading (Concept Drift & IC Tracking)
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional, List, Union


class SymmetricCUSUMDetector:
    """
    Two-sided Symmetric Cumulative Sum (CUSUM) Filter.
    Detects mean and variance shifts in prediction errors or market dynamics.
    S_t^+ = max(0, S_{t-1}^+ + e_t - mu)
    S_t^- = min(0, S_{t-1}^- + e_t - mu)
    """
    def __init__(self, threshold_h: float = 0.05, target_drift: float = 0.0):
        self.h = threshold_h
        self.drift = target_drift
        self.s_pos = 0.0
        self.s_neg = 0.0

    def update(self, error_val: float) -> Tuple[bool, float, float]:
        """
        Updates CUSUM statistics with incoming observation.
        Returns (drift_detected, s_pos, s_neg).
        """
        self.s_pos = max(0.0, self.s_pos + error_val - self.drift)
        self.s_neg = min(0.0, self.s_neg + error_val - self.drift)

        drift_detected = (self.s_pos >= self.h) or (self.s_neg <= -self.h)
        if drift_detected:
            # Reset after break declaration
            self.s_pos = 0.0
            self.s_neg = 0.0

        return drift_detected, self.s_pos, self.s_neg


class AlphaDecayTracker:
    """
    Tracks rolling Information Coefficient (IC) and estimates alpha decay half-life.
    IC_t = corr(predicted_alpha_t, forward_realized_returns_t)
    """
    def __init__(self, lookback_window: int = 50, decay_alpha: float = 0.05):
        self.lookback = lookback_window
        self.decay_alpha = decay_alpha
        self.ic_history: List[float] = []

    def compute_rolling_ic(self, alpha_series: pd.Series, forward_returns: pd.Series) -> pd.Series:
        rolling_ic = alpha_series.rolling(window=self.lookback).corr(forward_returns)
        return rolling_ic.fillna(0.0).rename("rolling_information_coefficient")

    def estimate_half_life(self, rolling_ic: pd.Series) -> float:
        """
        Estimates alpha decay half-life in bars via Ornstein-Uhlenbeck autoregression on IC.
        """
        ic_clean = rolling_ic.dropna()
        if len(ic_clean) < 20:
            return 30.0

        y = ic_clean.diff().dropna().values
        x = ic_clean.shift(1).dropna().values
        
        # Fit OLS: Delta IC_t = - theta * IC_{t-1} + epsilon
        cov_xy = np.cov(x, y)[0, 1]
        var_x = np.var(x) + 1e-8
        theta = -cov_xy / var_x

        if theta <= 0:
            return 100.0  # Very persistent

        half_life = np.log(2.0) / theta
        return float(np.clip(half_life, 1.0, 500.0))
