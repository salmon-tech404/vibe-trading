"""
AETHER-QUANT Architecture: Anti-Overfitting & Statistical Validation Framework
Grounding:
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Purged CV, CPCV, DSR, PSR)
- David Bailey & Marcos Lopez de Prado (2014): The Deflated Sharpe Ratio
- Benjamini-Hochberg: False Discovery Rate (FDR) control for multiple hypothesis testing
"""

import numpy as np
import pandas as pd
from typing import List, Tuple, Generator, Optional
from itertools import combinations
from scipy.stats import norm, skew, kurtosis


class PurgedKFold:
    """
    Purged and Embargoed K-Fold Cross-Validation.
    Eliminates data leakage from overlapping event labels and serial correlation.
    """
    def __init__(self, n_splits: int = 5, pct_embargo: float = 0.01):
        self.n_splits = n_splits
        self.pct_embargo = pct_embargo

    def split(
        self,
        X: pd.DataFrame,
        event_end_times: Optional[pd.Series] = None
    ) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        N = len(X)
        indices = np.arange(N)
        embargo_len = int(N * self.pct_embargo)
        
        fold_bounds = np.linspace(0, N, self.n_splits + 1).astype(int)

        for i in range(self.n_splits):
            test_start, test_end = fold_bounds[i], fold_bounds[i + 1]
            test_idx = indices[test_start:test_end]

            # Purge training set of samples overlapping with test evaluation window
            train_mask = np.ones(N, dtype=bool)
            train_mask[test_start:test_end] = False

            # Embargo period immediately after test set
            embargo_end = min(N, test_end + embargo_len)
            train_mask[test_end:embargo_end] = False

            train_idx = indices[train_mask]
            yield train_idx, test_idx


class CombinatorialPurgedCrossValidation:
    """
    Combinatorial Purged Cross-Validation (CPCV).
    Generates all C(N, k) combinatorial splits to produce an empirical distribution of backtest paths.
    """
    def __init__(self, n_splits: int = 6, n_test_splits: int = 2, pct_embargo: float = 0.01):
        self.n_splits = n_splits
        self.n_test_splits = n_test_splits
        self.pct_embargo = pct_embargo

    def get_combinations_count(self) -> int:
        from math import comb
        return comb(self.n_splits, self.n_test_splits)

    def split(self, X: pd.DataFrame) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        N = len(X)
        indices = np.arange(N)
        embargo_len = int(N * self.pct_embargo)
        fold_bounds = np.linspace(0, N, self.n_splits + 1).astype(int)

        # All combinations of test splits
        test_combos = list(combinations(range(self.n_splits), self.n_test_splits))

        for combo in test_combos:
            test_mask = np.zeros(N, dtype=bool)
            for split_idx in combo:
                test_mask[fold_bounds[split_idx]:fold_bounds[split_idx + 1]] = True

            train_mask = ~test_mask

            # Apply embargo after each test chunk
            for split_idx in combo:
                end_pt = fold_bounds[split_idx + 1]
                embargo_pt = min(N, end_pt + embargo_len)
                train_mask[end_pt:embargo_pt] = False

            train_idx = indices[train_mask]
            test_idx = indices[test_mask]
            yield train_idx, test_idx


def compute_deflated_sharpe_ratio(
    returns: pd.Series,
    num_trials: int = 10,
    expected_max_sr_null: Optional[float] = None
) -> float:
    """
    Computes Deflated Sharpe Ratio (DSR) correcting for selection bias across multiple trials.
    Bailey & Lopez de Prado (2014).
    """
    rets = returns.dropna().values
    T = len(rets)
    if T < 10:
        return 0.50

    sr_hat = (np.mean(rets) / (np.std(rets) + 1e-8)) * np.sqrt(252)
    skew_hat = float(skew(rets))
    kurt_hat = float(kurtosis(rets, fisher=False)) # Pearson kurtosis

    if expected_max_sr_null is None:
        # Theoretical expected maximum SR under null hypothesis of 0 true alpha
        euler_mascheroni = 0.5772156649
        z_1 = norm.ppf(1.0 - 1.0 / num_trials)
        z_2 = norm.ppf(1.0 - 1.0 / (num_trials * np.e))
        expected_max_sr_null = (1.0 - euler_mascheroni) * z_1 + euler_mascheroni * z_2

    # Standard error under non-normality
    denom = np.sqrt(1.0 - skew_hat * (sr_hat / np.sqrt(252)) + ((kurt_hat - 1.0) / 4.0) * (sr_hat / np.sqrt(252)) ** 2)
    denom = max(denom, 1e-4)

    dsr_stat = (sr_hat - expected_max_sr_null) * np.sqrt(T - 1) / denom
    dsr_prob = norm.cdf(dsr_stat)
    return float(dsr_prob)


def compute_probabilistic_sharpe_ratio(returns: pd.Series, benchmark_sr: float = 0.0) -> float:
    """
    Computes Probabilistic Sharpe Ratio (PSR) accounting for non-normality (skewness and fat tails).
    """
    rets = returns.dropna().values
    T = len(rets)
    if T < 5:
        return 0.50

    sr_hat = (np.mean(rets) / (np.std(rets) + 1e-8)) * np.sqrt(252)
    skew_hat = float(skew(rets))
    kurt_hat = float(kurtosis(rets, fisher=False))

    denom = np.sqrt(1.0 - skew_hat * (sr_hat / np.sqrt(252)) + ((kurt_hat - 1.0) / 4.0) * (sr_hat / np.sqrt(252)) ** 2)
    denom = max(denom, 1e-4)

    psr_stat = (sr_hat - benchmark_sr) * np.sqrt(T - 1) / denom
    return float(norm.cdf(psr_stat))


def benjamini_hochberg_fdr(p_values: np.ndarray, alpha_fdr: float = 0.05) -> Tuple[np.ndarray, float]:
    """
    Controls False Discovery Rate (FDR) for multiple hypothesis testing.
    Returns (significant_mask, critical_p_value_threshold).
    """
    m = len(p_values)
    sorted_indices = np.argsort(p_values)
    sorted_p = p_values[sorted_indices]

    thresholds = (np.arange(1, m + 1) / m) * alpha_fdr
    significant = sorted_p <= thresholds

    if not np.any(significant):
        return np.zeros(m, dtype=bool), 0.0

    max_idx = np.max(np.where(significant)[0])
    cutoff_p = sorted_p[max_idx]

    sig_mask = np.zeros(m, dtype=bool)
    sig_mask[sorted_indices[:max_idx + 1]] = True
    return sig_mask, float(cutoff_p)
