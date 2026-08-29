"""
AETHER-QUANT Architecture - Layer 6: Hierarchical Bayesian Risk Parity (H-BRP)
Grounding:
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Chapter 16: Machine Learning Asset Allocation)
- Michael Isichenko: Quantitative Portfolio Management (Covariance Shrinkage & Transaction Costs)
- John C. Hull: Risk Management and Financial Institutions (Portfolio Risk Diversification)
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple
from scipy.cluster.hierarchy import linkage, dendrogram


def ledoit_wolf_shrinkage(returns_df: pd.DataFrame) -> np.ndarray:
    """
    Computes well-conditioned Ledoit-Wolf Shrunk Covariance Matrix.
    Shrinks sample covariance toward constant correlation target matrix.
    """
    X = returns_df.dropna().values
    N, P = X.shape
    if N <= 1 or P <= 1:
        return np.eye(P)

    # Sample covariance
    sample_cov = np.cov(X, rowvar=False)
    
    # Target: Constant correlation matrix
    var = np.diag(sample_cov)
    sqrt_var = np.sqrt(np.maximum(1e-8, var))
    corr = sample_cov / np.outer(sqrt_var, sqrt_var)
    np.fill_diagonal(corr, 1.0)
    
    mean_corr = (corr.sum() - P) / (P * (P - 1)) if P > 1 else 0.0
    target_corr = np.full((P, P), mean_corr)
    np.fill_diagonal(target_corr, 1.0)
    target_cov = target_corr * np.outer(sqrt_var, sqrt_var)

    # Analytical shrinkage intensity delta*
    # Formula from Ledoit & Wolf (2004)
    y = X - np.mean(X, axis=0)
    phi_mat = np.zeros((P, P))
    for t in range(N):
        yt = y[t]
        phi_mat += (np.outer(yt, yt) - sample_cov) ** 2
    phi = phi_mat.sum()

    gamma = np.linalg.norm(sample_cov - target_cov, 'fro') ** 2
    kappa = phi / (gamma + 1e-8)
    delta = max(0.0, min(1.0, kappa / N))

    shrunk_cov = delta * target_cov + (1.0 - delta) * sample_cov
    return shrunk_cov


class HierarchicalRiskParity:
    """
    Hierarchical Risk Parity (HRP) Portfolio Allocator.
    Step 1: Tree Clustering via Correlation Distance d_ij = sqrt((1 - rho_ij)/2)
    Step 2: Quasi-Diagonalization (Dendrogram leaf ordering)
    Step 3: Recursive Bisection allocation using cluster variance
    """
    def __init__(self, method: str = 'single'):
        self.method = method

    def _get_cluster_var(self, cov: np.ndarray, cluster_items: List[int]) -> float:
        """Computes variance of inverse-variance allocation inside cluster."""
        sub_cov = cov[np.ix_(cluster_items, cluster_items)]
        ivp = 1.0 / np.diag(sub_cov)
        ivp /= ivp.sum()
        cluster_var = float(ivp @ sub_cov @ ivp)
        return cluster_var

    def _quasi_diagonalize(self, link: np.ndarray) -> List[int]:
        """Reorders covariance matrix based on dendrogram leaf adjacency."""
        link = link.astype(int)
        sort_ix = pd.Series([link[-1, 0], link[-1, 1]])
        num_items = link[-1, 3]
        while sort_ix.max() >= num_items:
            sort_ix.index = range(0, sort_ix.shape[0] * 2, 2)
            df0 = sort_ix[sort_ix >= num_items]
            i = df0.index
            j = df0.values - num_items
            sort_ix[i] = link[j, 0]
            df0 = pd.Series(link[j, 1], index=i + 1)
            sort_ix = pd.concat([sort_ix, df0]).sort_index()
            sort_ix.index = range(sort_ix.shape[0])
        return sort_ix.tolist()

    def _recursive_bisection(self, cov: np.ndarray, sorted_items: List[int]) -> np.ndarray:
        """Recursively bisects clusters to assign HRP weights."""
        w = pd.Series(1.0, index=sorted_items)
        clusters = [sorted_items]
        
        while len(clusters) > 0:
            new_clusters = []
            for c in clusters:
                if len(c) > 1:
                    mid = len(c) // 2
                    c1 = c[:mid]
                    c2 = c[mid:]
                    var1 = self._get_cluster_var(cov, c1)
                    var2 = self._get_cluster_var(cov, c2)
                    
                    alpha = 1.0 - var1 / (var1 + var2)
                    w[c1] *= alpha
                    w[c2] *= (1.0 - alpha)
                    
                    new_clusters.append(c1)
                    new_clusters.append(c2)
            clusters = new_clusters
        
        return w.sort_index().values

    def allocate(
        self,
        returns_df: pd.DataFrame,
        turnover_penalty: float = 0.0,
        current_weights: Optional[np.ndarray] = None
    ) -> pd.Series:
        """
        Computes optimal HRP portfolio weights.
        """
        assets = returns_df.columns.tolist()
        P = len(assets)
        if P == 1:
            return pd.Series([1.0], index=assets)

        shrunk_cov = ledoit_wolf_shrinkage(returns_df)
        var = np.diag(shrunk_cov)
        sqrt_var = np.sqrt(np.maximum(1e-8, var))
        corr = shrunk_cov / np.outer(sqrt_var, sqrt_var)
        np.fill_diagonal(corr, 1.0)
        
        # Distance matrix
        dist = np.sqrt(np.maximum(0.0, 0.5 * (1.0 - corr)))
        # Condense distance matrix for scipy linkage
        condensed_dist = dist[np.triu_indices(P, k=1)]

        link_mat = linkage(condensed_dist, method=self.method)
        sorted_items = self._quasi_diagonalize(link_mat)
        raw_weights = self._recursive_bisection(shrunk_cov, sorted_items)

        # Turnover penalty regularizer
        if turnover_penalty > 0.0 and current_weights is not None:
            # Smooth weight transition
            final_w = (1.0 - turnover_penalty) * raw_weights + turnover_penalty * current_weights
            final_w /= final_w.sum()
        else:
            final_w = raw_weights

        return pd.Series(final_w, index=assets, name='hrp_weights')
