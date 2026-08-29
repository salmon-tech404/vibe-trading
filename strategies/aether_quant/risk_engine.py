"""
AETHER-QUANT Architecture - Layer 9: Multi-Tier Tail Risk & EVT CVaR Engine
Grounding:
- John C. Hull: Risk Management and Financial Institutions (EVT, POT, VaR/CVaR)
- Abdullah Karasan: Machine Learning for Financial Risk Management with Python
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional, Union, List
from scipy.stats import genpareto


class ExtremeValueCVaR:
    """
    Peaks-Over-Threshold (POT) Extreme Value Theory Estimator.
    Fits Generalized Pareto Distribution (GPD) to tail losses exceeding threshold u.
    CVaR_alpha = (VaR_alpha + beta - xi * u) / (1 - xi)
    """
    def __init__(self, confidence_level: float = 0.99, threshold_quantile: float = 0.90):
        self.alpha = confidence_level
        self.quantile = threshold_quantile

    def estimate_tail_risk(self, returns: pd.Series) -> Dict[str, float]:
        """
        Returns empirical and EVT-fitted VaR and CVaR (Expected Shortfall).
        """
        losses = -returns.dropna().values
        N = len(losses)
        if N < 50:
            # Fallback for short sample
            std_l = np.std(losses) if N > 0 else 0.01
            return {
                'evt_var': float(2.33 * std_l),
                'evt_cvar': float(2.66 * std_l),
                'historical_var': float(2.33 * std_l),
                'historical_cvar': float(2.66 * std_l)
            }

        # Threshold u
        u = float(np.percentile(losses, self.quantile * 100))
        exceedances = losses[losses > u] - u
        N_u = len(exceedances)

        if N_u < 5:
            hist_var = float(np.percentile(losses, self.alpha * 100))
            hist_cvar = float(losses[losses >= hist_var].mean()) if len(losses[losses >= hist_var]) > 0 else hist_var
            return {
                'evt_var': hist_var,
                'evt_cvar': hist_cvar,
                'historical_var': hist_var,
                'historical_cvar': hist_cvar
            }

        # Fit Generalized Pareto Distribution (GPD)
        try:
            shape_xi, _, scale_beta = genpareto.fit(exceedances, floc=0)
            # Ensure shape stability
            shape_xi = np.clip(shape_xi, -0.5, 0.5)
            
            # EVT VaR formula
            term = (N / N_u) * (1.0 - self.alpha)
            if term <= 0:
                term = 1e-6
            
            if abs(shape_xi) < 1e-4:
                evt_var = u - scale_beta * np.log(term)
                evt_cvar = evt_var + scale_beta
            else:
                evt_var = u + (scale_beta / shape_xi) * (term ** (-shape_xi) - 1.0)
                evt_cvar = (evt_var + scale_beta - shape_xi * u) / (1.0 - shape_xi)
        except Exception:
            evt_var = float(np.percentile(losses, self.alpha * 100))
            evt_cvar = float(losses[losses >= evt_var].mean()) if len(losses[losses >= evt_var]) > 0 else evt_var

        hist_var = float(np.percentile(losses, self.alpha * 100))
        hist_cvar = float(losses[losses >= hist_var].mean()) if len(losses[losses >= hist_var]) > 0 else hist_var

        return {
            'evt_var': float(evt_var),
            'evt_cvar': float(evt_cvar),
            'historical_var': float(hist_var),
            'historical_cvar': float(hist_cvar),
            'threshold_u': u,
            'exceedances_count': N_u
        }


class TieredCircuitBreaker:
    """
    Tiered Emergency Risk Protective Controls:
    Tier 1 (Soft Risk Curtailment): CVaR > threshold -> 50% bet size reduction
    Tier 2 (Hard Neutralization): Daily Drawdown > 2.5% -> Liquidate positions & halt 2h
    Tier 3 (Regime Anomaly Flash Halt): Epistemic Uncertainty > 4.0x baseline -> Emergency freeze
    """
    def __init__(
        self,
        max_daily_drawdown: float = 0.025,
        cvar_threshold_pct: float = 0.035,
        epistemic_spike_mult: float = 3.5
    ):
        self.max_daily_dd = max_daily_drawdown
        self.cvar_thresh = cvar_threshold_pct
        self.epi_mult = epistemic_spike_mult

    def check_protective_action(
        self,
        current_daily_drawdown: float,
        current_cvar: float,
        current_epistemic_var: float,
        baseline_epistemic_var: float
    ) -> Dict[str, Union[str, float, bool]]:
        # Tier 2 Check (Hard Stop)
        if current_daily_drawdown >= self.max_daily_dd:
            return {
                'action': 'HARD_NEUTRALIZE',
                'description': f'Daily drawdown {current_daily_drawdown*100:.2f}% breached limit {self.max_daily_dd*100:.2f}%',
                'size_multiplier': 0.0,
                'halt_trading': True
            }

        # Tier 3 Check (Anomaly Freeze)
        if current_epistemic_var >= self.epi_mult * max(baseline_epistemic_var, 1e-6):
            return {
                'action': 'ANOMALY_HALT',
                'description': f'Epistemic uncertainty {current_epistemic_var:.4f} is {current_epistemic_var/baseline_epistemic_var:.1f}x baseline',
                'size_multiplier': 0.0,
                'halt_trading': True
            }

        # Tier 1 Check (Soft Curtailment)
        if current_cvar >= self.cvar_thresh:
            return {
                'action': 'SOFT_CURTAILMENT',
                'description': f'EVT CVaR {current_cvar*100:.2f}% breached risk threshold {self.cvar_thresh*100:.2f}%',
                'size_multiplier': 0.5,
                'halt_trading': False
            }

        return {
            'action': 'NORMAL',
            'description': 'All risk limits within nominal parameters',
            'size_multiplier': 1.0,
            'halt_trading': False
        }
