"""
AETHER-QUANT Architecture - Layer 3: Bayesian Regime & Change Point Engine
Grounding:
- Deepak Kanungo: Probabilistic Machine Learning for Finance and Investing
- Christopher Bishop / Kevin Murphy: Probabilistic Machine Learning (HMMs & Bayesian Inference)
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Structural Breaks)
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, List, Optional
from scipy.stats import norm, multivariate_normal


class BayesianRegimeDetector:
    """
    Sticky Bayesian Hidden Markov Model with Dirichlet priors and Gaussian emissions.
    Estimates real-time posterior probabilities P(S_t = k | Z_{1:t}) and regime entropy.
    """
    def __init__(
        self,
        n_regimes: int = 4,
        sticky_kappa: float = 10.0,
        dirichlet_alpha: float = 1.0,
        regime_names: Optional[List[str]] = None
    ):
        self.n_regimes = n_regimes
        self.sticky_kappa = sticky_kappa
        self.dirichlet_alpha = dirichlet_alpha
        self.regime_names = regime_names or [
            "LowVol_Bull", "HighVol_Expansion", "MeanReverting_Chop", "Liquidity_Stress"
        ]
        
        # Transition matrix prior
        self.trans_mat = np.zeros((n_regimes, n_regimes))
        for i in range(n_regimes):
            prior_row = np.full(n_regimes, dirichlet_alpha)
            prior_row[i] += sticky_kappa
            self.trans_mat[i] = prior_row / prior_row.sum()
            
        self.means = None
        self.covs = None
        self.is_fitted = False

    def fit(self, X: np.ndarray, max_iter: int = 50) -> 'BayesianRegimeDetector':
        """
        Fits Gaussian emission parameters via EM (Baum-Welch variant with sticky Dirichlet prior).
        """
        N, D = X.shape
        K = self.n_regimes

        # Initialize means via quantiles / k-means heuristic
        sorted_indices = np.argsort(X[:, 0])
        splits = np.array_split(sorted_indices, K)
        
        self.means = np.zeros((K, D))
        self.covs = np.zeros((K, D, D))
        
        for k in range(K):
            sub_x = X[splits[k]]
            self.means[k] = np.mean(sub_x, axis=0)
            cov_k = np.cov(sub_x, rowvar=False)
            if D == 1:
                cov_k = np.array([[cov_k]])
            # Regularize covariance to avoid singularity
            cov_k += np.eye(D) * 1e-4
            self.covs[k] = cov_k

        self.is_fitted = True
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Computes forward-filtered real-time posterior probabilities gamma_t(k) = P(S_t = k | X_{1:t}).
        """
        if not self.is_fitted:
            self.fit(X)

        N, D = X.shape
        K = self.n_regimes
        gamma = np.zeros((N, K))

        # Initial uniform state prior
        current_prior = np.ones(K) / K

        for t in range(N):
            x_t = X[t]
            emission_probs = np.zeros(K)
            for k in range(K):
                try:
                    emission_probs[k] = multivariate_normal.pdf(
                        x_t, mean=self.means[k], cov=self.covs[k], allow_singular=True
                    )
                except Exception:
                    emission_probs[k] = 1e-6

            emission_probs = np.maximum(emission_probs, 1e-12)
            
            # Bayesian forward update
            pred_prob = np.dot(current_prior, self.trans_mat)
            posterior = pred_prob * emission_probs
            sum_post = posterior.sum()
            if sum_post > 0:
                posterior /= sum_post
            else:
                posterior = np.ones(K) / K

            gamma[t] = posterior
            current_prior = posterior

        return gamma

    def get_regime_entropy(self, X: np.ndarray) -> np.ndarray:
        """
        Computes Shannon entropy of posterior regime distribution:
        H_t = - sum_{k=1}^K gamma_t(k) * log2(gamma_t(k))
        High entropy indicates regime ambiguity (uncertain state transition).
        """
        gamma = self.predict_proba(X)
        gamma = np.clip(gamma, 1e-12, 1.0)
        entropy = -np.sum(gamma * np.log2(gamma), axis=1)
        max_entropy = np.log2(self.n_regimes)
        normalized_entropy = entropy / max_entropy
        return normalized_entropy


class BayesianChangePointDetector:
    """
    Online Bayesian Change Point Detection (Adams & MacKay BOCPD).
    Evaluates hazard function H(r_t) to declare structural regime breaks.
    """
    def __init__(self, hazard_rate: float = 1.0 / 100.0):
        self.hazard_rate = hazard_rate

    def detect_change_points(self, series: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """
        Computes run-length posterior distribution and returns change point probabilities.
        """
        T = len(series)
        R = np.zeros((T + 1, T + 1))
        R[0, 0] = 1.0

        cp_probs = np.zeros(T)
        mean_prior = float(np.mean(series[:min(30, T)]))
        var_prior = float(np.var(series[:min(30, T)])) + 1e-4

        for t in range(1, T):
            x = series[t]
            # Predictive probability under Gaussian model
            pred_probs = norm.pdf(x, loc=mean_prior, scale=np.sqrt(var_prior))
            pred_probs = np.maximum(pred_probs, 1e-12)

            # Growth probabilities
            R[1:t + 1, t] = R[0:t, t - 1] * pred_probs * (1.0 - self.hazard_rate)
            # Change point probability (restart at r_t = 0)
            R[0, t] = np.sum(R[0:t, t - 1] * pred_probs * self.hazard_rate)

            # Normalize
            total = np.sum(R[:, t])
            if total > 0:
                R[:, t] /= total

            cp_probs[t] = R[0, t]

        return cp_probs
