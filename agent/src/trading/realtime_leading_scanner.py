"""
Real-time Leading Multi-Asset Market Scanner
Implements Kaufman Adaptive Efficiency, Smart Money Liquidity Sweeps, and Leading Divergences
to detect high-probability trading opportunities across Crypto, Stocks, and Forex.
"""

import sys
import os
import time
from typing import List, Dict, Any
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import yfinance as yf
except ImportError:
    yf = None

class RealtimeLeadingScanner:
    def __init__(self, kama_period: int = 10, er_threshold: float = 0.40, atr_period: int = 14):
        self.kama_period = kama_period
        self.er_threshold = er_threshold
        self.atr_period = atr_period

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Computes Kaufman Efficiency Ratio, KAMA, ATR, and Leading Confluence Signals."""
        df = df.copy()
        
        # Ensure column names are lower-case
        df.columns = [c.lower() for c in df.columns]
        
        # 1. Kaufman Efficiency Ratio (ER)
        change = (df['close'] - df['close'].shift(self.kama_period)).abs()
        volatility = (df['close'] - df['close'].shift(1)).abs().rolling(self.kama_period).sum()
        df['er'] = np.where(volatility > 0, change / volatility, 0.0)
        
        # Fast & Slow Smoothing Constants
        fast_sc = 2.0 / (2.0 + 1.0)
        slow_sc = 2.0 / (30.0 + 1.0)
        sc = (df['er'] * (fast_sc - slow_sc) + slow_sc) ** 2
        
        # KAMA
        kama = np.zeros(len(df))
        close_vals = df['close'].values
        sc_vals = sc.values
        kama[0] = close_vals[0]
        for i in range(1, len(df)):
            if np.isnan(sc_vals[i]):
                kama[i] = close_vals[i]
            else:
                kama[i] = kama[i-1] + sc_vals[i] * (close_vals[i] - kama[i-1])
        df['kama'] = kama
        
        # 2. ATR
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift(1)).abs()
        low_close = (df['low'] - df['close'].shift(1)).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr'] = tr.rolling(self.atr_period).mean()
        
        # 3. Momentum RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / (loss + 1e-9)
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # 4. Smart Money Liquidity Sweep & Signals
        df['is_trending'] = df['er'] >= self.er_threshold
        df['bullish_trend'] = (df['close'] > df['kama']) & df['is_trending']
        df['bearish_trend'] = (df['close'] < df['kama']) & df['is_trending']
        
        # Swing Low / High
        swing_lookback = 5
        df['swing_high'] = df['high'].rolling(swing_lookback).max().shift(1)
        df['swing_low'] = df['low'].rolling(swing_lookback).min().shift(1)
        
        # Liquidity Sweep
        df['bullish_sweep'] = (df['low'] < df['swing_low']) & (df['close'] > df['swing_low']) & (df['close'] > df['open'])
        df['bearish_sweep'] = (df['high'] > df['swing_high']) & (df['close'] < df['swing_high']) & (df['close'] < df['open'])
        
        # Confluence Signals
        df['buy_signal'] = (
            ((df['close'] > df['kama']) & (df['close'].shift(1) <= df['kama'].shift(1)) & df['is_trending'] & (df['rsi'] > 48)) |
            (df['bullish_sweep'] & (df['close'] > df['kama'])) |
            (df['bullish_sweep'] & (df['rsi'] < 35))
        )
        
        df['sell_signal'] = (
            ((df['close'] < df['kama']) & (df['close'].shift(1) >= df['kama'].shift(1)) & df['is_trending'] & (df['rsi'] < 52)) |
            (df['bearish_sweep'] & (df['close'] < df['kama'])) |
            (df['bearish_sweep'] & (df['rsi'] > 65))
        )
        
        return df

    def scan_ticker(self, ticker: str, period: str = "1mo", interval: str = "1h") -> Dict[str, Any]:
        """Fetch data and evaluate real-time signals for a single ticker."""
        if yf is None:
            return {"ticker": ticker, "status": "ERROR", "message": "yfinance not installed"}
            
        try:
            data = yf.download(ticker, period=period, interval=interval, progress=False)
            if data is None or len(data) < 30:
                return {"ticker": ticker, "status": "NO_DATA", "message": "Insufficient bars"}
                
            # Flatten multi-level columns if any
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = [c[0] for c in data.columns]
                
            df = self.calculate_indicators(data)
            last = df.iloc[-1]
            prev = df.iloc[-2]
            
            price = float(last['close'])
            atr = float(last['atr']) if not np.isnan(last['atr']) else price * 0.02
            er = float(last['er'])
            rsi = float(last['rsi'])
            kama = float(last['kama'])
            
            regime = "BULLISH TREND" if last['bullish_trend'] else "BEARISH TREND" if last['bearish_trend'] else "CHOPPY / RANGE"
            
            signal = "NEUTRAL"
            sl, tp1, tp2 = None, None, None
            
            if last['buy_signal'] or (prev['buy_signal'] and price >= prev['close']):
                signal = "BUY / LONG"
                sl = round(price - 1.8 * atr, 4)
                tp1 = round(price + 2.7 * atr, 4)
                tp2 = round(price + 4.5 * atr, 4)
            elif last['sell_signal'] or (prev['sell_signal'] and price <= prev['close']):
                signal = "SELL / SHORT"
                sl = round(price + 1.8 * atr, 4)
                tp1 = round(price - 2.7 * atr, 4)
                tp2 = round(price - 4.5 * atr, 4)
                
            return {
                "ticker": ticker,
                "status": "OK",
                "price": round(price, 4),
                "kama": round(kama, 4),
                "er": round(er, 3),
                "rsi": round(rsi, 1),
                "regime": regime,
                "signal": signal,
                "stop_loss": sl,
                "tp1": tp1,
                "tp2": tp2,
                "liquidity_sweep": bool(last['bullish_sweep'] or last['bearish_sweep']),
                "timestamp": str(df.index[-1])
            }
        except Exception as e:
            return {"ticker": ticker, "status": "ERROR", "message": str(e)}

    def scan_watchlist(self, tickers: List[str], interval: str = "1h") -> List[Dict[str, Any]]:
        """Scans an entire watchlist and outputs structured signal table."""
        results = []
        for t in tickers:
            res = self.scan_ticker(t, interval=interval)
            results.append(res)
        return results

def main():
    default_watchlist = [
        "BTC-USD", "ETH-USD", "SOL-USD",   # Crypto
        "SPY", "QQQ", "NVDA", "AAPL",      # US Equities
        "GC=F", "EURUSD=X"                 # Commodities & Forex (Gold, EUR)
    ]
    
    scanner = RealtimeLeadingScanner()
    print("================================================================================")
    print("🚀 VIBE ALPHA REALTIME LEADING SCANNER — MULTI-ASSET CONFLUENCE RADAR")
    print("================================================================================")
    print(f"Scanning watchlist ({len(default_watchlist)} assets)...")
    
    results = scanner.scan_watchlist(default_watchlist, interval="1h")
    
    print("\n{:<10} {:<10} {:<16} {:<8} {:<8} {:<12} {:<10} {:<10}".format(
        "TICKER", "PRICE", "REGIME", "ER", "RSI", "SIGNAL", "STOP LOSS", "TP1"
    ))
    print("-" * 90)
    
    for r in results:
        if r["status"] == "OK":
            sl_str = str(r["stop_loss"]) if r["stop_loss"] else "-"
            tp_str = str(r["tp1"]) if r["tp1"] else "-"
            sig_fmt = f"🟢 {r['signal']}" if "BUY" in r['signal'] else f"🔴 {r['signal']}" if "SELL" in r['signal'] else r['signal']
            print("{:<10} {:<10} {:<16} {:<8} {:<8} {:<12} {:<10} {:<10}".format(
                r["ticker"], r["price"], r["regime"], r["er"], r["rsi"], sig_fmt, sl_str, tp_str
            ))
        else:
            print("{:<10} ERROR: {}".format(r["ticker"], r.get("message", "unknown")))
    print("================================================================================")

if __name__ == "__main__":
    main()
