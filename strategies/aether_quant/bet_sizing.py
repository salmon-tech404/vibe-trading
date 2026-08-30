"""
AETHER-QUANT Architecture - Layer 7: Microstructure-Aware Dynamic Bet Sizing
Grounding:
- Ernie Chan: Quantitative Trading (Fractional Kelly Criterion)
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Bet Sizing from Probabilities)
- Novel Hypothesis H2: Epistemic Uncertainty-Penalized Conviction Scaling
"""

import numpy as np
import pandas as pd
from typing import Union, Optional


class UncertaintyPenalizedKellySizer:
    """
    Computes continuous conviction bet size scaled by:
    1. Calibrated conviction fraction
    2. Epistemic Uncertainty Penalty: exp(-lambda_epi * (sigma^2_epi / sigma^2_base))
    3. Kaufman Efficiency Ratio scaling: min(2.0, ER / ER_baseline)
    """
    def __init__(
        self,
        payoff_ratio: float = 1.5,
        max_leverage: float = 1.0,
        epistemic_lambda: float = 1.5,
        baseline_er: float = 0.25
    ):
        self.b = payoff_ratio
        self.max_leverage = max_leverage
        self.epistemic_lambda = epistemic_lambda
        self.baseline_er = baseline_er

    def calculate_sizing(
        self,
        prob_success: Union[float, np.ndarray],
        epistemic_variance: Union[float, np.ndarray],
        baseline_epistemic_var: float = 0.05,
        kaufman_er: Optional[Union[float, np.ndarray]] = None
    ) -> Union[float, np.ndarray]:
        """
        Computes final bet sizing multiplier in [0, max_leverage].
        """
        p = np.array(prob_success)
        epi_var = np.array(epistemic_variance)

        # 1. Conviction calculation
        # When p > 0.45, scales linearly up to 1.0
        # If Kelly: (p*(b+1)-1)/b
        raw_kelly = (p * (self.b + 1.0) - 1.0) / self.b
        conviction = np.where(raw_kelly > 0, raw_kelly, 0.0)

        # 2. Epistemic uncertainty penalty
        norm_epi = np.maximum(0.0, epi_var / max(baseline_epistemic_var, 1e-6))
        epistemic_penalty = np.exp(-self.epistemic_lambda * (norm_epi - 1.0))
        epistemic_penalty = np.clip(epistemic_penalty, 0.05, 1.5)

        # 3. Efficiency ratio scaling
        if kaufman_er is not None:
            er = np.array(kaufman_er)
            er_scale = np.clip(er / max(self.baseline_er, 0.05), 0.3, 2.0)
        else:
            er_scale = 1.0

        final_sizing = conviction * epistemic_penalty * er_scale * 0.5
        final_sizing = np.clip(final_sizing, 0.0, self.max_leverage)

        if isinstance(prob_success, float):
            return float(final_sizing)
        return final_sizing
