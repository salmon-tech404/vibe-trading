"""
AETHER-QUANT Architecture
Adaptive Epistemic-Theoretic Hierarchical Execution & Regime Quantitative System
Synthesized from 38 foundational quantitative finance, ML, and microstructure texts.
"""

__version__ = '1.0.0'
__author__ = 'Vibe-Trading Quant Research Lab'

from .data_structures import (
    create_dollar_bars,
    create_volume_bars,
    create_tick_imbalance_bars,
    get_weights_ffd,
    frac_diff_ffd,
    find_optimal_d
)
from .microstructure_features import (
    compute_order_flow_imbalance,
    compute_kaufman_er,
    compute_auction_value_area,
    compute_parkinson_volatility,
    compute_garman_klass_volatility,
    compute_vpin
)
from .regime_engine import (
    BayesianRegimeDetector,
    BayesianChangePointDetector
)
from .alpha_engine import (
    symmetric_lowdin_orthogonalization,
    MicrostructureOFIDivergenceAlpha,
    KaufmanAdaptiveTrendAlpha,
    AuctionValueAreaRejectionAlpha,
    StatisticalArbitrageCointegrationAlpha,
    CompositeRegimeAlphaCombiner
)
from .meta_labeling import (
    apply_triple_barrier,
    BayesianConformalMetaLearner
)
from .portfolio_allocator import (
    ledoit_wolf_shrinkage,
    HierarchicalRiskParity
)
from .bet_sizing import UncertaintyPenalizedKellySizer
from .execution_engine import (
    CarteaJaimungalExecutor,
    MicrostructureFrictionSimulator
)
from .risk_engine import (
    ExtremeValueCVaR,
    TieredCircuitBreaker
)
from .online_monitor import (
    SymmetricCUSUMDetector,
    AlphaDecayTracker
)
from .validation_framework import (
    PurgedKFold,
    CombinatorialPurgedCrossValidation,
    compute_deflated_sharpe_ratio,
    compute_probabilistic_sharpe_ratio,
    benjamini_hochberg_fdr
)
from .pipeline import AetherQuantEngine

__all__ = [
    'create_dollar_bars',
    'create_volume_bars',
    'create_tick_imbalance_bars',
    'get_weights_ffd',
    'frac_diff_ffd',
    'find_optimal_d',
    'compute_order_flow_imbalance',
    'compute_kaufman_er',
    'compute_auction_value_area',
    'compute_parkinson_volatility',
    'compute_garman_klass_volatility',
    'compute_vpin',
    'BayesianRegimeDetector',
    'BayesianChangePointDetector',
    'symmetric_lowdin_orthogonalization',
    'MicrostructureOFIDivergenceAlpha',
    'KaufmanAdaptiveTrendAlpha',
    'AuctionValueAreaRejectionAlpha',
    'StatisticalArbitrageCointegrationAlpha',
    'CompositeRegimeAlphaCombiner',
    'apply_triple_barrier',
    'BayesianConformalMetaLearner',
    'ledoit_wolf_shrinkage',
    'HierarchicalRiskParity',
    'UncertaintyPenalizedKellySizer',
    'CarteaJaimungalExecutor',
    'MicrostructureFrictionSimulator',
    'ExtremeValueCVaR',
    'TieredCircuitBreaker',
    'SymmetricCUSUMDetector',
    'AlphaDecayTracker',
    'PurgedKFold',
    'CombinatorialPurgedCrossValidation',
    'compute_deflated_sharpe_ratio',
    'compute_probabilistic_sharpe_ratio',
    'benjamini_hochberg_fdr',
    'AetherQuantEngine'
]
