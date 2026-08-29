"""Real Quantitative Engine: Live Binance OHLCV Feed, Dynamic Strategy Execution & DSR Overfitting Gates."""

from __future__ import annotations

import os
import sys
import logging
import importlib.util
import httpx
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

from src.agents.loss_collector import LossCollector, TradeContext
from src.quantlib.multipletesting import deflated_sharpe_ratio, DeflatedSharpeResult

logger = logging.getLogger(__name__)


def fetch_binance_ohlcv(symbol: str = "BTCUSDT", interval: str = "15m", limit: int = 500) -> pd.DataFrame:
    """Fetch real historical OHLCV data directly from Binance public API."""
    clean_sym = symbol.replace("/", "").replace("-", "").upper()
    url = f"https://api.binance.com/api/v3/klines?symbol={clean_sym}&interval={interval}&limit={limit}"
    
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url)
        resp.raise_for_status()
        raw = resp.json()

    cols = [
        "timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades", "taker_buy_base", "taker_buy_quote", "ignore"
    ]
    df = pd.DataFrame(raw, columns=cols)
    for c in ["open", "high", "low", "close", "volume"]:
        df[c] = df[c].astype(float)
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df.set_index("timestamp", inplace=True)
    return df


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)


def calculate_adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Average Directional Index (ADX)."""
    high = df["high"]
    low = df["low"]
    close = df["close"]

    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()

    up_move = high - high.shift(1)
    down_move = low.shift(1) - low

    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)

    plus_di = 100 * (pd.Series(plus_dm, index=df.index).rolling(window=period).mean() / atr.replace(0, np.nan))
    minus_di = 100 * (pd.Series(minus_dm, index=df.index).rolling(window=period).mean() / atr.replace(0, np.nan))

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
    adx = dx.rolling(window=period).mean()
    return adx.fillna(20.0)


def enrich_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Enrich DataFrame with comprehensive technical indicators."""
    df = df.copy()
    df["rsi"] = calculate_rsi(df["close"], period=14)
    df["ema20"] = df["close"].ewm(span=20, adjust=False).mean()
    df["ema50"] = df["close"].ewm(span=50, adjust=False).mean()
    df["ema200"] = df["close"].ewm(span=200, adjust=False).mean()
    df["adx"] = calculate_adx(df, period=14)
    df["vol_sma20"] = df["volume"].rolling(20).mean()
    df["volume_ratio"] = (df["volume"] / df["vol_sma20"]).fillna(1.0)
    
    # H4 Trend proxy (EMA50 >= EMA200)
    df["trend_h4"] = np.where(df["ema50"] >= df["ema200"], "Uptrend", "Downtrend")
    return df


class RealQuantEngine:
    """Executes real-time market scans and backtests with Deflated Sharpe Ratio validation."""

    def __init__(self, active_strategy_path: Optional[Path] = None):
        self.loss_collector = LossCollector()
        self.active_strategy_path = active_strategy_path or Path("strategies/active_strategy.py")

    def _load_active_strategy_signals(self, df: pd.DataFrame) -> Optional[pd.Series]:
        """Dynamically load and execute active strategy file if available."""
        if not self.active_strategy_path.exists():
            return None
        try:
            spec = importlib.util.spec_from_file_location("active_strategy", str(self.active_strategy_path))
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if hasattr(mod, "StrategyEngine"):
                    engine = mod.StrategyEngine()
                    return engine.calculate_signals(df)
        except Exception as e:
            logger.warning(f"Could not dynamically load active strategy: {e}")
        return None

    def scan_live_markets(self, symbols: List[str] = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]) -> List[Dict[str, Any]]:
        """Scan real live tickers from Binance and compute real indicators."""
        results = []
        for sym in symbols:
            try:
                df = fetch_binance_ohlcv(sym, interval="15m", limit=100)
                df = enrich_technical_indicators(df)
                latest = df.iloc[-1]
                prev = df.iloc[-2]

                price = latest["close"]
                rsi = round(latest["rsi"], 1)
                adx = round(latest["adx"], 1)
                trend = latest["trend_h4"]

                # Real Signal Decision Logic
                if rsi < 35 and trend == "Uptrend":
                    signal = "Buy Dip"
                elif rsi > 70 and trend == "Downtrend":
                    signal = "Sell High"
                elif price > latest["ema20"] and prev["close"] <= prev["ema20"]:
                    signal = "Cross Up"
                elif trend == "Uptrend":
                    signal = "Bullish"
                else:
                    signal = "Bearish"

                results.append({
                    "symbol": sym.replace("USDT", "/USDT"),
                    "price": price,
                    "trend": trend,
                    "rsi": rsi,
                    "adx": adx,
                    "signal": signal,
                    "vol_ratio": round(latest["volume_ratio"], 2)
                })
            except Exception as e:
                logger.error(f"Failed scanning {sym}: {e}")
        return results

    def run_backtest_simulation(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "15m",
        limit: int = 500,
        rsi_upper: float = 65.0,
        rsi_lower: float = 35.0,
        use_trend_filter: bool = True,
        use_volume_filter: bool = True,
        record_losses: bool = True,
        use_active_strategy: bool = False,
        n_trials: int = 5
    ) -> Dict[str, Any]:
        """Execute backtest on real Binance bars and compute DSR Overfitting Gates."""
        df = fetch_binance_ohlcv(symbol, interval=interval, limit=limit)
        df = enrich_technical_indicators(df)

        # Try executing active strategy signals if requested
        dynamic_signals = self._load_active_strategy_signals(df) if use_active_strategy else None

        initial_capital = 10000.0
        capital = initial_capital
        position: Optional[Dict[str, Any]] = None
        trades: List[Dict[str, Any]] = []
        equity_curve: List[float] = [initial_capital]

        if record_losses:
            self.loss_collector.clear_events()

        for idx, (ts, row) in enumerate(df.iterrows()):
            if idx < 50:  # Warmup for indicators
                continue

            price = row["close"]
            rsi = row["rsi"]
            trend = row["trend_h4"]
            vol_ratio = row["volume_ratio"]

            # Strategy Signal Conditions
            if dynamic_signals is not None:
                sig = dynamic_signals.iloc[idx]
                buy_signal = (sig == 1)
                sell_signal = (sig == -1)
            else:
                cond_trend_buy = (trend == "Uptrend") if use_trend_filter else True
                cond_rsi_buy = (rsi < rsi_upper) and (rsi > 40)
                cond_vol_buy = (vol_ratio >= 0.9) if use_volume_filter else True
                buy_signal = cond_trend_buy and cond_rsi_buy and cond_vol_buy

                cond_trend_sell = (trend == "Downtrend") if use_trend_filter else True
                cond_rsi_sell = (rsi > rsi_lower) and (rsi < 60)
                sell_signal = cond_trend_sell and cond_rsi_sell

            # Position Management (ATR-based SL / TP)
            if position is not None:
                entry_p = position["entry_price"]
                action = position["action"]
                sl = position["stop_loss"]
                tp = position["take_profit"]

                is_sl = (price <= sl) if action == "BUY" else (price >= sl)
                is_tp = (price >= tp) if action == "BUY" else (price <= tp)

                if is_sl or is_tp:
                    pnl_pct = ((price - entry_p) / entry_p) if action == "BUY" else ((entry_p - price) / entry_p)
                    # Deduct trading fee 0.05%
                    net_pnl_pct = pnl_pct - 0.0005
                    trade_pnl = position["size"] * net_pnl_pct
                    capital += trade_pnl
                    equity_curve.append(capital)

                    trade_record = {
                        "symbol": symbol,
                        "action": action,
                        "entry_price": entry_p,
                        "exit_price": price,
                        "pnl": round(trade_pnl, 2),
                        "pnl_percent": round(net_pnl_pct * 100, 2),
                        "result": "WIN" if trade_pnl > 0 else "LOSS",
                        "timestamp": str(ts),
                        "rsi": round(position["rsi"], 1),
                        "trend_h4": position["trend_h4"],
                        "volume_ratio": round(position["vol_ratio"], 2),
                        "adx": round(position["adx"], 1),
                    }
                    trades.append(trade_record)

                    # Capture real loss event telemetry
                    if trade_pnl < 0 and record_losses:
                        self.loss_collector.record_loss(TradeContext(
                            symbol=symbol,
                            timeframe=interval,
                            action=action,
                            entry_price=entry_p,
                            exit_price=price,
                            stop_loss=sl,
                            take_profit=tp,
                            pnl=round(trade_pnl, 2),
                            pnl_percent=round(net_pnl_pct * 100, 2),
                            timestamp=str(ts),
                            rsi=position["rsi"],
                            trend_h4=position["trend_h4"],
                            volume_ratio=position["vol_ratio"],
                            adx=position["adx"],
                            notes="Real backtest stop loss hit."
                        ))

                    position = None
                    continue

            # Entry Logic
            if position is None and buy_signal:
                pos_size = capital * 0.2  # 20% allocation per trade
                sl_dist = price * 0.012  # 1.2% SL
                tp_dist = price * 0.024  # 2.4% TP (1:2 RR)
                position = {
                    "action": "BUY",
                    "entry_price": price,
                    "stop_loss": price - sl_dist,
                    "take_profit": price + tp_dist,
                    "size": pos_size,
                    "rsi": rsi,
                    "trend_h4": trend,
                    "vol_ratio": vol_ratio,
                    "adx": row["adx"]
                }

        # Metrics Calculations
        total_trades = len(trades)
        wins = [t for t in trades if t["result"] == "WIN"]
        losses = [t for t in trades if t["result"] == "LOSS"]

        win_rate = (len(wins) / total_trades * 100) if total_trades > 0 else 0.0
        total_profit = sum(t["pnl"] for t in wins)
        total_loss = abs(sum(t["pnl"] for t in losses))
        profit_factor = (total_profit / total_loss) if total_loss > 0 else (2.0 if total_profit > 0 else 0.0)

        # Drawdown calculation
        eq_arr = np.array(equity_curve)
        peak = np.maximum.accumulate(eq_arr)
        drawdowns = (peak - eq_arr) / peak * 100
        max_drawdown = float(np.max(drawdowns)) if len(drawdowns) > 0 else 0.0

        # Sharpe ratio per observation
        returns_arr = np.array([t["pnl_percent"] / 100.0 for t in trades]) if trades else np.array([0.0])
        n_obs = len(returns_arr)
        ret_mean = float(np.mean(returns_arr))
        ret_std = float(np.std(returns_arr)) + 1e-6
        observed_sharpe = ret_mean / ret_std

        # Compute Deflated Sharpe Ratio (DSR) using quantlib
        try:
            dsr_res: DeflatedSharpeResult = deflated_sharpe_ratio(
                observed_sharpe=observed_sharpe,
                n_trials=max(n_trials, 2),
                n_observations=max(n_obs, 30),
                trial_sharpe_std=max(ret_std, 0.5),
                confidence=0.95
            )
            dsr_score = round(dsr_res.deflated_sharpe_ratio, 3)
            dsr_survives = bool(dsr_res.survives)
        except Exception as e:
            logger.warning(f"DSR calculation warning: {e}")
            dsr_score = 0.500
            dsr_survives = False

        annualized_sharpe = float(observed_sharpe * np.sqrt(252 * 4)) if n_obs > 1 else 0.0

        return {
            "symbol": symbol,
            "interval": interval,
            "total_bars": len(df),
            "initial_capital": initial_capital,
            "final_equity": round(capital, 2),
            "net_pnl": round(capital - initial_capital, 2),
            "net_pnl_pct": round(((capital - initial_capital) / initial_capital) * 100, 2),
            "total_trades": total_trades,
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "max_drawdown": round(max_drawdown, 2),
            "sharpe_ratio": round(annualized_sharpe, 2),
            "dsr_score": dsr_score,
            "dsr_survives": dsr_survives,
            "loss_events_captured": len(losses)
        }
