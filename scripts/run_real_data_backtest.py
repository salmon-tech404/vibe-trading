import os
import sys
import numpy as np
import pandas as pd

sys.path.append(r"d:/01-vibeTrading/vibe-trading")
import strategies.aether_quant as aq


def run_real_data_research():
    print("==================================================================================")
    print("🌍 AETHER-QUANT: REAL-WORLD MULTI-ASSET HISTORICAL BACKTEST & VALIDATION")
    print("==================================================================================")

    symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD']
    print(f"Fetching real-world historical data for universe: {symbols}...")
    import yfinance as yf
    raw_data = {}
    for s in symbols:
        df = yf.download(s, period="2y", interval="1d", progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.columns = [c.lower() for c in df.columns]
        df = df[['open', 'high', 'low', 'close', 'volume']].dropna()
        ret = df['close'].pct_change().fillna(0.0)
        vol_std = ret.rolling(20).std().fillna(0.01)
        df['ofi'] = (ret / (vol_std + 1e-8)) * df['volume'] * 0.5
        raw_data[s] = df

    # Find common date index
    common_idx = raw_data[symbols[0]].index
    for s in symbols[1:]:
        common_idx = common_idx.intersection(raw_data[s].index)
    
    aligned_data = {s: raw_data[s].loc[common_idx].copy() for s in symbols}
    primary_sym = symbols[0]
    df_p = aligned_data[primary_sym]

    print(f"\n[PHASE 1: MULTI-ASSET PORTFOLIO UNIVERSE]")
    for s, df in aligned_data.items():
        print(f" - {s:10s}: {len(df)} daily bars, Start: ${df['close'].iloc[0]:,.2f}, End: ${df['close'].iloc[-1]:,.2f}")

    # Initialize Engine
    engine = aq.AetherQuantEngine(assets=symbols, initial_capital=1_000_000.0, n_regimes=4)
    engine.alpha_combiner.entry_threshold = 0.05
    
    print("\n[PHASE 2: RUNNING 10-LAYER WALK-FORWARD SIMULATION]")
    results = engine.run_backtest_simulation(aligned_data, warmup_bars=60)

    print("\n----------------------------------------------------------------------------------")
    print("📊 REAL-DATA BACKTEST PERFORMANCE (WITH COMPLETE TRANSACTION FRICTIONS):")
    print(f" - Initial Portfolio Capital:    $1,000,000.00")
    print(f" - Final Portfolio Capital:      ${results['final_equity']:,.2f}")
    print(f" - Cumulative Return:            {results['cumulative_return_pct']:.2f}%")
    print(f" - Realized Win Rate:            {results['realized_win_rate_pct']:.2f}%")
    print(f" - Total Executed Orders:        {results['total_trades_count']}")
    print(f" - Annualized Sharpe Ratio:      {results['annualized_sharpe_ratio']:.3f}")
    print(f" - Maximum Drawdown (MDD):       {results['max_drawdown_pct']:.2f}%")
    print(f" - Circuit Breakers Triggered:   {results['circuit_breaker_halts']} times")
    print(f" - Total Fees Paid:              ${results['total_fees_paid']:,.2f}")
    print(f" - Total Slippage Impact Paid:   ${results['total_slippage_paid']:,.2f}")
    print(f" - EVT Value-at-Risk (99%):      {results['evt_var_99']*100:.3f}%")
    print(f" - EVT Expected Shortfall (CVaR):{results['evt_cvar_99']*100:.3f}%")
    print("----------------------------------------------------------------------------------")
    print("🛡️ STATISTICAL ANTI-OVERFITTING & MULTIPLE TESTING CORRECTION AUDIT:")
    print(f" - Deflated Sharpe Ratio (DSR):  {results['deflated_sharpe_ratio_dsr']:.4f} (Adjusted for 20 trials)")
    print(f" - Probabilistic Sharpe Ratio:   {results['probabilistic_sharpe_ratio_psr']:.4f} (Benchmark SR = 0.0)")
    print("==================================================================================")


if __name__ == "__main__":
    run_real_data_research()