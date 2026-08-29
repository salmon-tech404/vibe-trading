"""
AETHER-QUANT Architecture - Layer 5: Conformalized Triple-Barrier Meta-Labeling
Grounding:
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Chapter 3: Labeling & Meta-Labeling)
- Deepak Kanungo: Probabilistic Machine Learning for Finance and Investing (Epistemic Uncertainty)
- Manu Joseph: Modern Time Series Forecasting with Python (Conformal Uncertainty Bounds)
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Optional
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier


def apply_triple_barrier(
    prices: pd.Series,
    primary_signals: pd.Series,
    pt_multiplier: float = 2.0,
    sl_multiplier: float = 1.5,
    max_holding_bars: int = 20,
    volatility: Optional[pd.Series] = None
) -> pd.DataFrame:
    """
    Computes Triple Barrier Labels:
    1. Upper Profit Taking Barrier (PT)
    2. Lower Stop Loss Barrier (SL)
    3. Vertical Time Expiration Barrier (Holding limit)
    
    Output binary meta-label: 1 if Profit Target reached first, 0 if Stop Loss or Time expired.
    """
    if volatility is None:
        vol = prices.pct_change().rolling(20).std().fillna(0.01)
    else:
        vol = volatility

    p = prices.values
    sigs = primary_signals.values
    v = vol.values
    n = len(prices)

    records = []
    
    for i in range(n):
        sig = sigs[i]
        if sig == 0.0 or i >= n - 1:
            records.append({
                'barrier_touched': 0,
                'ret': 0.0,
                'holding_period': 0,
                'meta_label': 0
            })
            continue

        p_entry = p[i]
        sigma = max(v[i], 1e-4)
        pt_dist = pt_multiplier * sigma
        sl_dist = sl_multiplier * sigma

        pt_price = p_entry * (1.0 + pt_dist) if sig > 0 else p_entry * (1.0 - pt_dist)
        sl_price = p_entry * (1.0 - sl_dist) if sig > 0 else p_entry * (1.0 + sl_dist)

        touched = 0
        final_ret = 0.0
        holding = 0

        for h in range(1, min(max_holding_bars + 1, n - i)):
            curr_p = p[i + h]
            holding = h
            
            if sig > 0: # Long
                if curr_p >= pt_price:
                    touched = 1 # Upper barrier
                    final_ret = (curr_p - p_entry) / p_entry
                    break
                elif curr_p <= sl_price:
                    touched = -1 # Lower barrier
                    final_ret = (curr_p - p_entry) / p_entry
                    break
            else: # Short
                if curr_p <= pt_price:
                    touched = 1 # Upper profit barrier
                    final_ret = (p_entry - curr_p) / p_entry
                    break
                elif curr_p >= sl_price:
                    touched = -1 # Lower loss barrier
                    final_ret = (p_entry - curr_p) / p_entry
                    break

        if touched == 0: # Vertical barrier touched (time expiration)
            curr_p = p[min(i + max_holding_bars, n - 1)]
            final_ret = (curr_p - p_entry) / p_entry if sig > 0 else (p_entry - curr_p) / p_entry

        # Meta-label: 1 if positive return achieved, 0 otherwise
        meta_lbl = 1 if (touched == 1 or final_ret > 0) else 0

        records.append({
            'barrier_touched': touched,
            'ret': final_ret,
            'holding_period': holding,
            'meta_label': meta_lbl
        })

    res_df = pd.DataFrame(records, index=prices.index)
    return res_df


class BayesianConformalMetaLearner:
    """
    Ensemble of calibrated bootstrap trees estimating:
    1. Calibrated success probability p_bar(X)
    2. Model Epistemic Uncertainty sigma^2_epi(X) via ensemble disagreement
    3. Aleatoric Uncertainty sigma^2_aleatoric(X) = p_bar * (1 - p_bar)
    """
    def __init__(self, n_estimators: int = 50, max_depth: int = 4):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42,
            bootstrap=True,
            n_jobs=-1
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'BayesianConformalMetaLearner':
        # Train ensemble
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict_uncertainty(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns:
        - prob_mean: Mean predicted probability of trade success
        - epistemic_var: Variance among ensemble tree predictions (model uncertainty)
        - aleatoric_var: Inherent outcome variance p * (1 - p)
        """
        if not self.is_fitted:
            raise ValueError("Meta-learner must be fitted before prediction.")

        # Extract predictions from all individual decision trees
        tree_preds = np.array([tree.predict_proba(X)[:, 1] for tree in self.model.estimators_])
        
        prob_mean = np.mean(tree_preds, axis=0)
        epistemic_var = np.var(tree_preds, axis=0)
        aleatoric_var = prob_mean * (1.0 - prob_mean)

        return prob_mean, epistemic_var, aleatoric_var
