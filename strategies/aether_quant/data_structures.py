"""
AETHER-QUANT Architecture - Layer 1 & Layer 2: Data Structures & Fractional Differencing
Grounding:
- Marcos Lopez de Prado: Advances in Financial Machine Learning (Chapters 2 & 5)
- Stefan Jansen: Machine Learning for Algorithmic Trading (Chapter 4)
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional


def create_dollar_bars(df: pd.DataFrame, dollar_threshold: float) -> pd.DataFrame:
    """
    Samples raw tick/trade data into Dollar Turnover Bars.
    Formula: T_k = inf { t > T_{k-1} : sum_{i=T_{k-1}+1}^t p_i * v_i >= D_threshold }
    """
    if df.empty or 'price' not in df.columns or 'volume' not in df.columns:
        raise ValueError("Input dataframe must contain 'price' and 'volume' columns.")

    prices = df['price'].values
    volumes = df['volume'].values
    timestamps = df.index if isinstance(df.index, pd.DatetimeIndex) else np.arange(len(df))

    bar_records = []
    cum_dollar = 0.0
    cum_vol = 0.0
    bar_open = prices[0]
    bar_high = prices[0]
    bar_low = prices[0]
    bar_start_idx = 0

    for i in range(len(prices)):
        p = prices[i]
        v = volumes[i]
        dollar_val = p * v
        cum_dollar += dollar_val
        cum_vol += v

        if p > bar_high:
            bar_high = p
        if p < bar_low:
            bar_low = p

        if cum_dollar >= dollar_threshold or i == len(prices) - 1:
            bar_close = p
            bar_records.append({
                'timestamp': timestamps[i],
                'open': bar_open,
                'high': bar_high,
                'low': bar_low,
                'close': bar_close,
                'volume': cum_vol,
                'dollar_volume': cum_dollar,
                'ticks_count': i - bar_start_idx + 1
            })
            cum_dollar = 0.0
            cum_vol = 0.0
            if i < len(prices) - 1:
                bar_open = prices[i + 1]
                bar_high = prices[i + 1]
                bar_low = prices[i + 1]
                bar_start_idx = i + 1

    res_df = pd.DataFrame(bar_records)
    if 'timestamp' in res_df.columns:
        res_df.set_index('timestamp', inplace=True)
    return res_df


def create_volume_bars(df: pd.DataFrame, volume_threshold: float) -> pd.DataFrame:
    """
    Samples raw tick data into Constant Volume Bars.
    """
    if df.empty or 'price' not in df.columns or 'volume' not in df.columns:
        raise ValueError("Input dataframe must contain 'price' and 'volume' columns.")

    prices = df['price'].values
    volumes = df['volume'].values
    timestamps = df.index if isinstance(df.index, pd.DatetimeIndex) else np.arange(len(df))

    bar_records = []
    cum_vol = 0.0
    cum_dollar = 0.0
    bar_open = prices[0]
    bar_high = prices[0]
    bar_low = prices[0]
    bar_start_idx = 0

    for i in range(len(prices)):
        p = prices[i]
        v = volumes[i]
        cum_vol += v
        cum_dollar += p * v

        if p > bar_high:
            bar_high = p
        if p < bar_low:
            bar_low = p

        if cum_vol >= volume_threshold or i == len(prices) - 1:
            bar_close = p
            bar_records.append({
                'timestamp': timestamps[i],
                'open': bar_open,
                'high': bar_high,
                'low': bar_low,
                'close': bar_close,
                'volume': cum_vol,
                'dollar_volume': cum_dollar,
                'ticks_count': i - bar_start_idx + 1
            })
            cum_vol = 0.0
            cum_dollar = 0.0
            if i < len(prices) - 1:
                bar_open = prices[i + 1]
                bar_high = prices[i + 1]
                bar_low = prices[i + 1]
                bar_start_idx = i + 1

    res_df = pd.DataFrame(bar_records)
    if 'timestamp' in res_df.columns:
        res_df.set_index('timestamp', inplace=True)
    return res_df


def create_tick_imbalance_bars(df: pd.DataFrame, expected_ticks: int = 100) -> pd.DataFrame:
    """
    Samples dynamic Tick Imbalance Bars (TIB).
    Theta_T = sum_{t=1}^T b_t where b_t = sign(Delta p_t).
    """
    prices = df['price'].values
    volumes = df['volume'].values if 'volume' in df.columns else np.ones(len(prices))
    timestamps = df.index if isinstance(df.index, pd.DatetimeIndex) else np.arange(len(prices))

    b = np.zeros(len(prices))
    b[0] = 1.0
    for t in range(1, len(prices)):
        dp = prices[t] - prices[t - 1]
        b[t] = b[t - 1] if dp == 0 else np.sign(dp)

    bar_records = []
    theta = 0.0
    cum_vol = 0.0
    cum_dollar = 0.0
    bar_open = prices[0]
    bar_high = prices[0]
    bar_low = prices[0]
    bar_start_idx = 0
    prob_buy = 0.5
    ewma_alpha = 0.05

    for i in range(len(prices)):
        p = prices[i]
        v = volumes[i]
        theta += b[i]
        cum_vol += v
        cum_dollar += p * v

        if p > bar_high:
            bar_high = p
        if p < bar_low:
            bar_low = p

        prob_buy = (1 - ewma_alpha) * prob_buy + ewma_alpha * (1.0 if b[i] > 0 else 0.0)
        imbalance_factor = max(0.1, abs(2 * prob_buy - 1))
        threshold = expected_ticks * imbalance_factor

        if abs(theta) >= threshold or i == len(prices) - 1:
            bar_close = p
            bar_records.append({
                'timestamp': timestamps[i],
                'open': bar_open,
                'high': bar_high,
                'low': bar_low,
                'close': bar_close,
                'volume': cum_vol,
                'dollar_volume': cum_dollar,
                'ticks_count': i - bar_start_idx + 1,
                'imbalance': theta
            })
            theta = 0.0
            cum_vol = 0.0
            cum_dollar = 0.0
            if i < len(prices) - 1:
                bar_open = prices[i + 1]
                bar_high = prices[i + 1]
                bar_low = prices[i + 1]
                bar_start_idx = i + 1

    res_df = pd.DataFrame(bar_records)
    if 'timestamp' in res_df.columns:
        res_df.set_index('timestamp', inplace=True)
    return res_df


def get_weights_ffd(d: float, threshold: float = 1e-4, max_l: int = 1000) -> np.ndarray:
    """
    Computes expanding fractional differentiation weights using memory threshold.
    w_0 = 1, w_k = -w_{k-1} * (d - k + 1) / k
    """
    weights = [1.0]
    k = 1
    while k < max_l:
        w_k = -weights[-1] / k * (d - k + 1)
        if abs(w_k) < threshold:
            break
        weights.append(w_k)
        k += 1
    return np.array(weights[::-1])


def frac_diff_ffd(series: pd.Series, d: float, threshold: float = 1e-4) -> pd.Series:
    """
    Applies Fast Fractional Differentiation (FFD) to a pandas Series.
    """
    weights = get_weights_ffd(d, threshold=threshold)
    width = len(weights) - 1
    res = {}
    values = series.values

    for i in range(width, len(values)):
        window = values[i - width: i + 1]
        res[series.index[i]] = np.dot(weights, window)

    name_str = series.name if series.name is not None else 'series'
    return pd.Series(res, name=f"{name_str}_ffd_{d:.2f}")


def find_optimal_d(series: pd.Series, p_val_threshold: float = 0.01) -> Tuple[float, pd.Series]:
    """
    Finds the minimum fractional differencing parameter d* in [0, 1]
    that satisfies the Augmented Dickey-Fuller (ADF) test for stationarity.
    """
    try:
        from statsmodels.tsa.stattools import adfuller
    except ImportError:
        d_best = 0.40
        return d_best, frac_diff_ffd(series, d_best)

    d_values = np.linspace(0.0, 1.0, 21)
    best_d = 1.0
    best_diff = series.diff().dropna()

    for d in d_values:
        if d == 0.0:
            diff_s = series
        else:
            diff_s = frac_diff_ffd(series, d)
        
        if len(diff_s) < 30:
            continue

        try:
            adf_res = adfuller(diff_s.dropna().values, maxlag=1, regression='c', autolag=None)
            p_value = adf_res[1]
            if p_value <= p_val_threshold:
                best_d = float(d)
                best_diff = diff_s
                break
        except Exception:
            continue

    return best_d, best_diff
