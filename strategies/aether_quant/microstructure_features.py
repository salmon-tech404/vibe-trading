"""
AETHER-QUANT Architecture - Layer 2: Microstructure & Auction Market Features
Grounding:
- Peter Harris & Anatoly Schmidt: Financial Markets and Trading (Microstructure, OFI, PIN)
- James F. Dalton: Mind Over Markets (Auction Market Theory & Value Areas)
- Perry J. Kaufman: Trading Systems and Methods (Kaufman Efficiency Ratio)
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional


def compute_order_flow_imbalance(l2_df: pd.DataFrame) -> pd.Series:
    """
    Computes Level 2 Order Flow Imbalance (OFI).
    Formula: OFI_t = I_{p_t^b >= p_{t-1}^b} * q_t^b - I_{p_t^b <= p_{t-1}^b} * q_{t-1}^b
                   - I_{p_t^a <= p_{t-1}^a} * q_t^a + I_{p_t^a >= p_{t-1}^a} * q_{t-1}^a
    """
    required = ['bid_price', 'bid_size', 'ask_price', 'ask_size']
    if not all(c in l2_df.columns for c in required):
        raise ValueError(f"L2 dataframe must contain columns: {required}")

    bp = l2_df['bid_price'].values
    bs = l2_df['bid_size'].values
    ap = l2_df['ask_price'].values
    as_ = l2_df['ask_size'].values

    n = len(l2_df)
    ofi = np.zeros(n)

    for t in range(1, n):
        if bp[t] > bp[t - 1]:
            delta_b = bs[t]
        elif bp[t] == bp[t - 1]:
            delta_b = bs[t] - bs[t - 1]
        else:
            delta_b = -bs[t - 1]

        if ap[t] < ap[t - 1]:
            delta_a = as_[t]
        elif ap[t] == ap[t - 1]:
            delta_a = as_[t] - as_[t - 1]
        else:
            delta_a = -as_[t - 1]

        ofi[t] = delta_b - delta_a

    return pd.Series(ofi, index=l2_df.index, name='order_flow_imbalance')


def compute_kaufman_er(prices: pd.Series, period: int = 14) -> pd.Series:
    """
    Computes Kaufman Efficiency Ratio (ER).
    Formula: ER_t = |P_t - P_{t-N}| / sum_{i=0}^{N-1} |P_{t-i} - P_{t-i-1}|
    Ranges from 0 (pure noise/chop) to 1 (pure directional trend).
    """
    direction = (prices - prices.shift(period)).abs()
    volatility = (prices - prices.shift(1)).abs().rolling(window=period).sum()
    er = direction / volatility.replace(0, np.nan)
    return er.fillna(0.0).rename('kaufman_er')


def compute_auction_value_area(
    prices: pd.Series,
    volumes: pd.Series,
    value_area_pct: float = 0.70,
    num_bins: int = 50
) -> Dict[str, float]:
    """
    Computes Auction Market Theory Volume Profile metrics:
    - POC: Point of Control (Highest traded volume price)
    - VAH: Value Area High (Upper bound of 70% volume)
    - VAL: Value Area Low (Lower bound of 70% volume)
    - Total Volume & Value Area Width
    """
    if len(prices) < 5:
        mid = float(prices.mean()) if len(prices) > 0 else 0.0
        return {'poc': mid, 'vah': mid, 'val': mid, 'width': 0.0, 'total_volume': 0.0}

    min_p, max_p = prices.min(), prices.max()
    if min_p == max_p:
        return {'poc': min_p, 'vah': min_p, 'val': min_p, 'width': 0.0, 'total_volume': float(volumes.sum())}

    bins = np.linspace(min_p, max_p, num_bins + 1)
    bin_centers = 0.5 * (bins[:-1] + bins[1:])
    digitized = np.digitize(prices.values, bins) - 1
    digitized = np.clip(digitized, 0, num_bins - 1)

    vol_profile = np.zeros(num_bins)
    for i, b_idx in enumerate(digitized):
        vol_profile[b_idx] += volumes.iloc[i]

    total_vol = vol_profile.sum()
    if total_vol == 0:
        mid = 0.5 * (min_p + max_p)
        return {'poc': mid, 'vah': mid, 'val': mid, 'width': 0.0, 'total_volume': 0.0}

    poc_idx = int(np.argmax(vol_profile))
    poc_price = bin_centers[poc_idx]

    target_vol = total_vol * value_area_pct
    current_vol = vol_profile[poc_idx]
    low_idx = poc_idx
    high_idx = poc_idx

    while current_vol < target_vol and (low_idx > 0 or high_idx < num_bins - 1):
        next_low_vol = vol_profile[low_idx - 1] if low_idx > 0 else -1
        next_high_vol = vol_profile[high_idx + 1] if high_idx < num_bins - 1 else -1

        if next_low_vol >= next_high_vol:
            low_idx -= 1
            current_vol += vol_profile[low_idx]
        else:
            high_idx += 1
            current_vol += vol_profile[high_idx]

    val_price = bin_centers[low_idx]
    vah_price = bin_centers[high_idx]

    return {
        'poc': float(poc_price),
        'vah': float(vah_price),
        'val': float(val_price),
        'width': float(vah_price - val_price),
        'total_volume': float(total_vol)
    }


def compute_parkinson_volatility(high: pd.Series, low: pd.Series, window: int = 14) -> pd.Series:
    """
    Extreme-value Parkinson Volatility (5x more statistically efficient than close-to-close).
    """
    log_hl = np.log(high / low.replace(0, np.nan)) ** 2
    factor = 1.0 / (4.0 * np.log(2.0))
    parkinson = np.sqrt(factor * log_hl.rolling(window=window).mean())
    return parkinson.fillna(0.0).rename('parkinson_vol')


def compute_garman_klass_volatility(
    open_: pd.Series,
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    window: int = 14
) -> pd.Series:
    """
    Garman-Klass Volatility: Includes Open, High, Low, and Close.
    """
    log_hl = np.log(high / low.replace(0, np.nan)) ** 2
    log_co = np.log(close / open_.replace(0, np.nan)) ** 2
    gk_term = 0.5 * log_hl - (2 * np.log(2) - 1) * log_co
    gk_vol = np.sqrt(np.maximum(0, gk_term.rolling(window=window).mean()))
    return gk_vol.fillna(0.0).rename('garman_klass_vol')


def compute_vpin(
    volume_df: pd.DataFrame,
    bucket_volume: float,
    n_buckets: int = 50
) -> pd.Series:
    """
    Volume-Synchronized Probability of Toxicity (VPIN).
    """
    if 'volume' not in volume_df.columns or 'price' not in volume_df.columns:
        return pd.Series(dtype=float)

    prices = volume_df['price'].values
    volumes = volume_df['volume'].values
    
    dp = np.diff(prices, prepend=prices[0])
    b = np.where(dp >= 0, 1.0, -1.0)
    
    buy_vols = []
    sell_vols = []
    cur_v_buy = 0.0
    cur_v_sell = 0.0
    cur_v_total = 0.0
    bucket_indices = []

    for i in range(len(prices)):
        v = volumes[i]
        if b[i] > 0:
            cur_v_buy += v
        else:
            cur_v_sell += v
        cur_v_total += v

        if cur_v_total >= bucket_volume:
            buy_vols.append(cur_v_buy)
            sell_vols.append(cur_v_sell)
            bucket_indices.append(volume_df.index[i])
            cur_v_buy = 0.0
            cur_v_sell = 0.0
            cur_v_total = 0.0

    if len(buy_vols) < n_buckets:
        return pd.Series(0.0, index=volume_df.index, name='vpin')

    imbalances = np.abs(np.array(buy_vols) - np.array(sell_vols))
    vpin_values = pd.Series(imbalances, index=bucket_indices).rolling(window=n_buckets).mean() / bucket_volume
    return vpin_values.reindex(volume_df.index, method='ffill').fillna(0.0).rename('vpin')
