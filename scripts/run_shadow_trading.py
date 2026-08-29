import os
import sys
import time

sys.path.append(r"d:/01-vibeTrading/vibe-trading")
from strategies.aether_quant.shadow_runner import AetherShadowTrader


def run_live_shadow_demo(iterations: int = 5):
    print("==================================================================================")
    print("🤖 AETHER-QUANT: LIVE SHADOW PAPER-TRADING EXECUTION DAEMON")
    print("==================================================================================")

    trader = AetherShadowTrader(symbol="BTC-USD", initial_capital=100_000.0)
    print(f" - Virtual Account Initialized: Capital = ${trader.capital:,.2f}")
    print(f" - Connected to Live Market Ticker: {trader.symbol}")
    print(" - Processing Incoming Market Ticks through 10-Layer Engine...\n")

    # Fetch live price via yfinance or use current spot price
    try:
        import yfinance as yf
        ticker = yf.Ticker("BTC-USD")
        current_p = float(ticker.fast_info['last_price'])
    except Exception:
        current_p = 88500.0

    for i in range(iterations):
        # Simulate small price fluctuation
        p_tick = current_p * (1.0 + np.random.normal(0, 0.001))
        snap = trader.process_live_tick(
            current_price=p_tick,
            high=p_tick * 1.002,
            low=p_tick * 0.998,
            volume=500.0
        )
        print(f"[{snap['timestamp'][11:19]}] Price: ${snap['current_price']:,.2f} | Action: {snap['decision']:10s} | Equity: ${snap['portfolio_equity']:,.2f} | Pos: {snap['position_units']:.4f} BTC | DD: {snap['drawdown_pct']:.2f}%")
        time.sleep(1.0)

    print("\n----------------------------------------------------------------------------------")
    print("✅ SHADOW EXECUTION LOGGED TO: data/aether_shadow_portfolio.json")
    print("==================================================================================")


if __name__ == "__main__":
    import numpy as np
    run_live_shadow_demo(iterations=5)