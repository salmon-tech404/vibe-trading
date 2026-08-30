"""
AETHER-QUANT Architecture - Layer 4: Multi-Horizon Orthogonal Alpha Generators
Grounding:
- Michael Isichenko: Quantitative Portfolio Management (Symmetric Orthogonalization & Alpha Combinations)
- Ernie Chan: Algorithmic Trading (Statistical Arbitrage & Cointegration)
- James F. Dalton: Mind Over Markets (Auction Market Value Area Rejections)
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Union


def symmetric_lowdin_orthogonalization(factors_df: pd.DataFrame, warmup_bars: Optional[int] = None) -> pd.DataFrame:
    """
    Symmetric Lowdin Orthogonalization: F_perp = V * Lambda^(-1/2) * V^T * F
    Eliminates multicollinearity while minimizing distance to original factor definitions.
    Prevents whole-sample data leakage by fitting transformation on warmup/historical window.
    """
    if factors_df.empty or factors_df.shape[1] <= 1:
        return factors_df

    clean_df = factors_df.fillna(0.0)
    F = clean_df.values
    N, M = F.shape

    # Determine reference slice to compute covariance without future leakage
    ref_F = F[:warmup_bars] if (warmup_bars and warmup_bars >= M and warmup_bars < N) else F

    mean_vec = np.mean(ref_F, axis=0)
    std_vec = np.std(ref_F, axis=0) + 1e-8

    # Standardize factors using reference parameters
    ref_F_std = (ref_F - mean_vec) / std_vec
    F_std = (F - mean_vec) / std_vec

    # Factor covariance fit on reference window
    cov = np.cov(ref_F_std, rowvar=False)
    if M == 1:
        cov = np.array([[cov]])

    eig_vals, eig_vecs = np.linalg.eigh(cov)
    # Ensure numerical stability
    eig_vals = np.maximum(eig_vals, 1e-8)
    
    inv_sqrt_lambda = np.diag(1.0 / np.sqrt(eig_vals))
    lowdin_mat = eig_vecs @ inv_sqrt_lambda @ eig_vecs.T

    F_perp = F_std @ lowdin_mat
    return pd.DataFrame(F_perp, index=factors_df.index, columns=[f"{c}_perp" for c in factors_df.columns])


class MicrostructureOFIDivergenceAlpha:
    """
    Alpha 1: Divergence between Price Return Direction and Order Flow Imbalance.
    Institutional passive absorption hypothesis: Price higher + OFI negative => Mean reversion short.
    """
    def generate(self, prices: pd.Series, ofi: pd.Series, window: int = 10) -> pd.Series:
        p_ret = prices.pct_change(window)
        ofi_cum = ofi.rolling(window=window).sum()
        
        # Standardize
        p_z = (p_ret - p_ret.rolling(50).mean()) / (p_ret.rolling(50).std() + 1e-8)
        ofi_z = (ofi_cum - ofi_cum.rolling(50).mean()) / (ofi_cum.rolling(50).std() + 1e-8)

        # Divergence signal: High price expansion without OFI support => Short (-), Low price with positive OFI => Long (+)
        signal = ofi_z - p_z
        return signal.fillna(0.0).rename("alpha_ofi_divergence")


class KaufmanAdaptiveTrendAlpha:
    """
    Alpha 2: Kaufman ER-conditioned Adaptive Trend Momentum.
    Only takes trend positions when Efficiency Ratio > threshold (filters chop).
    """
    def generate(self, prices: pd.Series, er: pd.Series, fast_p: int = 5, slow_p: int = 20, er_thresh: float = 0.45) -> pd.Series:
        fast_ma = prices.ewm(span=fast_p).mean()
        slow_ma = prices.ewm(span=slow_p).mean()
        raw_trend = np.sign(fast_ma - slow_ma)
        
        # Condition trend signal on efficiency
        trend_signal = np.where(er >= er_thresh, raw_trend * er, 0.0)
        return pd.Series(trend_signal, index=prices.index, name="alpha_kaufman_trend")


class AuctionValueAreaRejectionAlpha:
    """
    Alpha 3: Auction Market Value Area Breakout Rejection (Mean-Reversion to POC).
    Price outside [VAL, VAH] reverting back to Point of Control.
    """
    def generate(
        self,
        prices: pd.Series,
        val: pd.Series,
        vah: pd.Series,
        poc: pd.Series
    ) -> pd.Series:
        signal = np.zeros(len(prices))
        p = prices.values
        v_low = val.values
        v_high = vah.values
        p_poc = poc.values

        for i in range(len(prices)):
            if p[i] < v_low[i]:
                # Price below Value Area Low -> Long back to POC
                signal[i] = (p_poc[i] - p[i]) / (p[i] + 1e-8)
            elif p[i] > v_high[i]:
                # Price above Value Area High -> Short back to POC
                signal[i] = (p_poc[i] - p[i]) / (p[i] + 1e-8)
            else:
                signal[i] = 0.0

        return pd.Series(signal, index=prices.index, name="alpha_amt_rejection")


class StatisticalArbitrageCointegrationAlpha:
    """
    Alpha 4: Cointegration Spread Mean-Reversion (Ornstein-Uhlenbeck z-score).
    """
    def generate(self, series_a: pd.Series, series_b: pd.Series, hedge_ratio: float = 1.0, lookback: int = 30) -> pd.Series:
        spread = series_a - hedge_ratio * series_b
        spread_mean = spread.rolling(window=lookback).mean()
        spread_std = spread.rolling(window=lookback).std() + 1e-8
        z_score = -(spread - spread_mean) / spread_std  # Mean-reversion: sell high spread, buy low spread
        return z_score.fillna(0.0).rename("alpha_stat_arb_spread")


class CompositeRegimeAlphaCombiner:
    """
    Combines orthogonalized alpha factors dynamically weighted by Bayesian regime probabilities.
    """
    def __init__(self, n_regimes: int = 4):
        self.n_regimes = n_regimes
        # Default regime weighting matrix: [Regime x Factor]
        # Regime 0 (Bull): Trend high weight
        # Regime 1 (HighVol Exp): OFI & Breakout high weight
        # Regime 2 (Chop): AMT Rejection & Stat-Arb high weight
        # Regime 3 (Stress): Liquidity / Mean Reversion
        self.regime_weights = np.array([
            [0.20, 0.50, 0.10, 0.20],  # LowVol Bull
            [0.40, 0.30, 0.10, 0.20],  # HighVol Expansion
            [0.10, 0.10, 0.40, 0.40],  # MeanReverting Chop
            [0.40, 0.00, 0.30, 0.30]   # Liquidity Stress
        ])

    def combine(
        self,
        factors_df: pd.DataFrame,
        regime_probs: np.ndarray,
        entry_threshold: float = 0.25
    ) -> Tuple[pd.Series, pd.Series]:
        """
        Returns (composite_continuous_score, discrete_trade_direction {-1, 0, +1}).
        """
        ortho_factors = symmetric_lowdin_orthogonalization(factors_df)
        F = ortho_factors.values
        N, M = F.shape
        K = regime_probs.shape[1]

        # Adjust weights dimension if factor count differs
        if self.regime_weights.shape[1] != M:
            W = np.ones((K, M)) / M
        else:
            W = self.regime_weights

        composite_score = np.zeros(N)
        for t in range(N):
            active_w = np.dot(regime_probs[t], W)  # 1 x M vector
            composite_score[t] = np.dot(active_w, F[t])

        score_series = pd.Series(composite_score, index=factors_df.index, name="composite_alpha_score")
        
        # Discrete directional signal
        direction = np.zeros(N)
        direction[composite_score > entry_threshold] = 1.0
        direction[composite_score < -entry_threshold] = -1.0
        direction_series = pd.Series(direction, index=factors_df.index, name="primary_signal_direction")

        return score_series, direction_series
