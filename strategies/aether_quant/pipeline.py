"""
AETHER-QUANT Architecture: Full End-to-End Orchestrator Pipeline
Unites all 10 Layers from Ingestion -> Microstructure -> Regime -> Alpha -> Meta-Labeling -> HRP -> Sizing -> Execution -> Risk -> Monitoring.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any

from .data_structures import find_optimal_d, frac_diff_ffd
from .microstructure_features import (
    compute_kaufman_er,
    compute_auction_value_area,
    compute_garman_klass_volatility,
    compute_parkinson_volatility
)
from .regime_engine import BayesianRegimeDetector
from .alpha_engine import (
    MicrostructureOFIDivergenceAlpha,
    KaufmanAdaptiveTrendAlpha,
    AuctionValueAreaRejectionAlpha,
    StatisticalArbitrageCointegrationAlpha,
    CompositeRegimeAlphaCombiner,
    symmetric_lowdin_orthogonalization
)
from .meta_labeling import apply_triple_barrier, BayesianConformalMetaLearner
from .portfolio_allocator import HierarchicalRiskParity
from .bet_sizing import UncertaintyPenalizedKellySizer
from .execution_engine import CarteaJaimungalExecutor, MicrostructureFrictionSimulator
from .risk_engine import ExtremeValueCVaR, TieredCircuitBreaker
from .online_monitor import SymmetricCUSUMDetector, AlphaDecayTracker
from .validation_framework import (
    compute_deflated_sharpe_ratio,
    compute_probabilistic_sharpe_ratio
)


class AetherQuantEngine:
    """
    The unified production engine implementing the 10-layer AETHER-QUANT architecture.
    """
    def __init__(
        self,
        assets: List[str],
        initial_capital: float = 1_000_000.0,
        n_regimes: int = 4
    ):
        self.assets = assets
        self.capital = initial_capital
        self.n_regimes = n_regimes

        # Layer 3: Regime Engine
        self.regime_detector = BayesianRegimeDetector(n_regimes=n_regimes)

        # Layer 4: Alpha Engine
        self.alpha_combiner = CompositeRegimeAlphaCombiner(n_regimes=n_regimes)

        # Layer 5: Meta-Labeler
        self.meta_learner = BayesianConformalMetaLearner(n_estimators=50, max_depth=4)

        # Layer 6: Portfolio Allocator
        self.hrp_allocator = HierarchicalRiskParity()

        # Layer 7: Bet Sizer
        self.bet_sizer = UncertaintyPenalizedKellySizer(payoff_ratio=1.5, max_leverage=1.5, epistemic_lambda=1.5)

        # Layer 8: Execution Engine
        self.executor = CarteaJaimungalExecutor()
        self.friction_sim = MicrostructureFrictionSimulator(fee_bps=2.5, impact_constant_y=0.3)

        # Layer 9: Risk Engine
        self.tail_risk = ExtremeValueCVaR(confidence_level=0.99, threshold_quantile=0.90)
        self.circuit_breaker = TieredCircuitBreaker(max_daily_drawdown=0.025, cvar_threshold_pct=0.035)

        # Layer 10: Online Monitor
        self.cusum_monitor = SymmetricCUSUMDetector(threshold_h=0.03)
        self.decay_tracker = AlphaDecayTracker()

    def run_backtest_simulation(
        self,
        market_data: Dict[str, pd.DataFrame],
        warmup_bars: int = 150
    ) -> Dict[str, Any]:
        """
        Executes a rigorous, multi-asset walk-forward backtest simulation across all 10 layers.
        """
        primary_asset = self.assets[0]
        df_p = market_data[primary_asset]
        N = len(df_p)

        # 1. Feature Engineering
        er = compute_kaufman_er(df_p['close'], period=14).fillna(0.3)
        gk_vol = compute_garman_klass_volatility(df_p['open'], df_p['high'], df_p['low'], df_p['close']).fillna(0.01)
        
        # OFI
        if 'ofi' not in df_p.columns:
            ofi = (df_p['close'].diff().fillna(0.0) * df_p['volume'])
        else:
            ofi = df_p['ofi'].fillna(0.0)

        # Auction Market POC / VAH / VAL
        rolling_val = df_p['low'].rolling(30, min_periods=5).min().bfill()
        rolling_vah = df_p['high'].rolling(30, min_periods=5).max().bfill()
        rolling_poc = df_p['close'].rolling(30, min_periods=5).mean().bfill()

        # 2. Alpha Generation
        a_ofi = MicrostructureOFIDivergenceAlpha().generate(df_p['close'], ofi).fillna(0.0)
        a_trend = KaufmanAdaptiveTrendAlpha().generate(df_p['close'], er).fillna(0.0)
        a_amt = AuctionValueAreaRejectionAlpha().generate(df_p['close'], rolling_val, rolling_vah, rolling_poc).fillna(0.0)
        
        # Cointegration alpha with secondary asset
        if len(self.assets) > 1:
            sec_asset = self.assets[1]
            a_arb = StatisticalArbitrageCointegrationAlpha().generate(
                df_p['close'], market_data[sec_asset]['close'], hedge_ratio=1.0, lookback=30
            ).fillna(0.0)
        else:
            a_arb = pd.Series(0.0, index=df_p.index, name="alpha_stat_arb_spread")

        raw_factors = pd.concat([a_ofi, a_trend, a_amt, a_arb], axis=1).fillna(0.0)
        ortho_factors = symmetric_lowdin_orthogonalization(raw_factors, warmup_bars=warmup_bars)

        # 3. Regime Detection Features
        regime_features = np.column_stack([
            df_p['close'].pct_change().fillna(0.0).values,
            gk_vol.values,
            er.values,
            (ofi.values / (df_p['volume'].mean() + 1e-8))
        ])
        regime_probs = self.regime_detector.fit(regime_features[:warmup_bars]).predict_proba(regime_features)

        # 4. Multi-Horizon Alpha Combination
        alpha_scores, primary_directions = self.alpha_combiner.combine(raw_factors, regime_probs, entry_threshold=0.15)

        # 5. Triple Barrier Labeling & Conformal Meta-Learner Fit
        tb_df = apply_triple_barrier(
            df_p['close'], primary_directions, pt_multiplier=2.0, sl_multiplier=1.5, volatility=gk_vol
        )
        
        # Fit meta-learner on warmup slice
        X_meta = ortho_factors.iloc[:warmup_bars].values
        y_meta = tb_df['meta_label'].iloc[:warmup_bars].values
        # Ensure binary classes exist in warmup
        if len(np.unique(y_meta)) < 2:
            y_meta[0] = 0
            y_meta[1] = 1

        self.meta_learner.fit(X_meta, y_meta)

        # Predict out-of-sample uncertainty
        prob_mean, epi_var, alea_var = self.meta_learner.predict_uncertainty(ortho_factors.values)
        baseline_epi_var = max(1e-3, float(np.percentile(epi_var[:warmup_bars], 90)))

        # 6. Multi-Asset HRP Allocation
        returns_dict = {a: market_data[a]['close'].pct_change().fillna(0.0) for a in self.assets}
        returns_df = pd.DataFrame(returns_dict).fillna(0.0)
        hrp_weights = self.hrp_allocator.allocate(returns_df.iloc[:warmup_bars])

        # 7. Simulation Loop with Dynamic Sizing, Friction, and Risk Controls (Zero Lookahead Bias)
        portfolio_equity = [self.capital]
        daily_returns = []
        positions = {a: 0.0 for a in self.assets}
        total_slippage_paid = 0.0
        total_fees_paid = 0.0
        trades_count = 0
        circuit_breaker_halts = 0

        for t in range(warmup_bars, N):
            p_curr = df_p['close'].iloc[t]
            p_prev = df_p['close'].iloc[t - 1]
            prev_equity = portfolio_equity[-1]

            # 1. Realize Mark-to-Market PnL on positions carried over from bar t-1 (NO LOOKAHEAD)
            held_position = positions[primary_asset]
            pos_pnl = held_position * (p_curr - p_prev)
            curr_equity = prev_equity + pos_pnl

            # 2. Risk check: Peak-to-trough intraday drawdown
            peak_equity = max(max(portfolio_equity), curr_equity)
            dd_pct = (peak_equity - curr_equity) / peak_equity

            # EVT Tail Risk check
            if len(daily_returns) >= 30:
                recent_rets = pd.Series(daily_returns[-60:])
                risk_metrics = self.tail_risk.estimate_tail_risk(recent_rets)
                cvar_val = risk_metrics['evt_cvar']
            else:
                cvar_val = 0.01

            # Circuit breaker evaluation
            cb_status = self.circuit_breaker.check_protective_action(
                current_daily_drawdown=dd_pct,
                current_cvar=cvar_val,
                current_epistemic_var=epi_var[t],
                baseline_epistemic_var=baseline_epi_var
            )

            if cb_status['halt_trading']:
                circuit_breaker_halts += 1
                # Liquidate existing position
                if abs(held_position) > 1e-4:
                    fill = self.friction_sim.simulate_fill(
                        side=int(-np.sign(held_position)),
                        order_size=abs(held_position),
                        mid_price=p_curr,
                        bid_ask_spread=0.0005 * p_curr,
                        daily_volume=float(df_p['volume'].iloc[t] * 24),
                        daily_volatility=float(gk_vol.iloc[t])
                    )
                    fee_paid = fill['fee_paid']
                    slip_paid = fill['slippage_per_unit'] * abs(held_position)
                    total_fees_paid += fee_paid
                    total_slippage_paid += slip_paid
                    curr_equity -= (fee_paid + slip_paid)
                    positions[primary_asset] = 0.0

                portfolio_equity.append(curr_equity)
                bar_pct_return = (curr_equity - prev_equity) / prev_equity
                daily_returns.append(bar_pct_return)
                continue

            # 3. Dynamic Bet Sizing & Target Rebalancing for bar t -> t+1
            conviction_size = self.bet_sizer.calculate_sizing(
                prob_success=prob_mean[t],
                epistemic_variance=epi_var[t],
                baseline_epistemic_var=baseline_epi_var,
                kaufman_er=er.iloc[t]
            ) * cb_status['size_multiplier']

            target_direction = primary_directions.iloc[t]
            target_dollar = target_direction * conviction_size * hrp_weights[primary_asset] * curr_equity
            target_units = target_dollar / p_curr

            # 4. Execution & Frictions on rebalancing orders
            order_units = target_units - held_position
            if abs(order_units) > 1e-4:
                fill = self.friction_sim.simulate_fill(
                    side=int(np.sign(order_units)),
                    order_size=abs(order_units),
                    mid_price=p_curr,
                    bid_ask_spread=0.0005 * p_curr,
                    daily_volume=float(df_p['volume'].iloc[t] * 24),
                    daily_volatility=float(gk_vol.iloc[t])
                )
                fee_paid = fill['fee_paid']
                slip_paid = fill['slippage_per_unit'] * abs(order_units)
                total_slippage_paid += slip_paid
                total_fees_paid += fee_paid
                curr_equity -= (fee_paid + slip_paid)
                positions[primary_asset] = target_units
                trades_count += 1

            bar_pct_return = (curr_equity - prev_equity) / prev_equity
            portfolio_equity.append(curr_equity)
            daily_returns.append(bar_pct_return)

            # Online Monitoring
            drift, _, _ = self.cusum_monitor.update(bar_pct_return)

        # Final Performance Metrics
        returns_series = pd.Series(daily_returns)
        cumulative_pnl = (portfolio_equity[-1] - self.capital) / self.capital
        ann_factor = np.sqrt(252 * 24 * 4) # 15-minute bars
        sharpe_ratio = float((returns_series.mean() / (returns_series.std() + 1e-8)) * ann_factor)
        
        # Anti-Overfitting Validation
        dsr = compute_deflated_sharpe_ratio(returns_series, num_trials=20)
        psr = compute_probabilistic_sharpe_ratio(returns_series, benchmark_sr=0.0)
        tail_metrics = self.tail_risk.estimate_tail_risk(returns_series)

        # Drawdown
        eq_arr = np.array(portfolio_equity)
        peak = np.maximum.accumulate(eq_arr)
        drawdowns = (eq_arr - peak) / peak
        max_drawdown = float(np.min(drawdowns))

        # Win rate of realized returns
        trade_rets = returns_series[returns_series != 0.0]
        realized_win_rate = float((trade_rets > 0).mean() * 100) if len(trade_rets) > 0 else 0.0

        return {
            'final_equity': float(portfolio_equity[-1]),
            'cumulative_return_pct': float(cumulative_pnl * 100),
            'annualized_sharpe_ratio': float(sharpe_ratio),
            'deflated_sharpe_ratio_dsr': float(dsr),
            'probabilistic_sharpe_ratio_psr': float(psr),
            'max_drawdown_pct': float(max_drawdown * 100),
            'realized_win_rate_pct': float(realized_win_rate),
            'total_trades_count': int(trades_count),
            'circuit_breaker_halts': int(circuit_breaker_halts),
            'total_fees_paid': float(total_fees_paid),
            'total_slippage_paid': float(total_slippage_paid),
            'evt_var_99': float(tail_metrics['evt_var']),
            'evt_cvar_99': float(tail_metrics['evt_cvar']),
            'tested_bars_count': N - warmup_bars
        }
