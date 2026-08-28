# ⚡ Quant Knowledge Pillar 2: Adaptive Trading Systems & Market Regimes
*Derived from: Perry Kaufman ("Trading Systems and Methods, 6th Edition"), Ernie Chan ("Quantitative Trading, 2nd Edition"), Yves Hilpisch ("Python for Algorithmic Trading")*

---

## 1. The Core Dilemma: Static Systems Break Down
- Financial markets operate in distinct **Regimes**:
  1. **Strong Trending Bull / Bear**: High directional autocorrelation, low noise. Trend-following thrives ($ER > 0.6$).
  2. **Range-Bound / Chop (70% of time)**: High noise, zero directional drift. Trend systems suffer severe whipsaws; Mean-reversion thrives ($ER < 0.3$).
  3. **High-Volatility Regime (Crisis / News Shocks)**: Extreme kurtosis, fat tails, standard indicators fail. Capital preservation is paramount.
- **Rule**: Never run a trend system in chop or a mean-reversion system in a runaway trend without a dynamic regime filter.

---

## 2. Quantitative Regime Detection & Adaptive Indicators

### A. Kaufman Efficiency Ratio (ER) & KAMA (Kaufman, Ch. 17)
The Efficiency Ratio measures the directional signal versus market noise over a window $n$ (typically $n=10$ or $14$):
$$\text{Direction} = |P_t - P_{t-n}|$$
$$\text{Volatility / Noise} = \sum_{i=0}^{n-1} |P_{t-i} - P_{t-i-1}|$$
$$ER_t = \frac{\text{Direction}}{\text{Volatility}} \in [0, 1]$$

- **$ER \to 1.0$**: Pure trend, zero noise. Accelerate indicator response (fast smoothing constant).
- **$ER \to 0.0$**: Pure chop / Brownian motion. Decelerate indicator response (slow smoothing constant) to filter out fake breakouts.

**Kaufman Adaptive Moving Average (KAMA)**:
$$SC_t = \left( ER_t \times (SC_{\text{fast}} - SC_{\text{slow}}) + SC_{\text{slow}} \right)^2$$
$$\text{KAMA}_t = \text{KAMA}_{t-1} + SC_t \times (P_t - \text{KAMA}_{t-1})$$

### B. Hurst Exponent ($H$) (Ernie Chan, Ch. 3 & Kaufman, Ch. 22)
Calculates the persistence of the time series via Rescaled Range ($R/S$) analysis:
- **$H > 0.5$**: Trending / Persistent (Past positive returns predict future positive returns).
- **$H = 0.5$**: Random Walk / Brownian motion (Zero statistical edge).
- **$H < 0.5$**: Mean-Reverting / Anti-persistent (Price oscillates around equilibrium).

### C. Statistical Arbitrage & Cointegration (Ernie Chan, Ch. 4)
- **Pair / Basket Mean Reversion**: Two non-stationary asset price series $P_1(t)$ and $P_2(t)$ are cointegrated if there exists a hedge ratio $\gamma$ such that the spread:
  $$S_t = P_1(t) - \gamma P_2(t)$$
  is strictly stationary (ADF p-value < 0.01).
- **Half-Life of Mean Reversion**: Fit Ornstein-Uhlenbeck (OU) process:
  $$\Delta S_t = -\theta (S_{t-1} - \mu)\Delta t + \sigma \epsilon_t$$
  $$\text{Half-Life} = \frac{\ln 2}{\theta}$$
  *Trade duration should be calibrated around 1 to 2 half-lives.*

### D. Leading Divergence Engine
- Price creates a Lower Low, but Volume-Weighted Momentum (OBV / Money Flow / KAMA Slope) creates a Higher Low $\implies$ **Leading Bullish Divergence** (Institutional accumulation).
- Price creates a Higher High, but Volume-Weighted Momentum creates a Lower High $\implies$ **Leading Bearish Divergence** (Institutional distribution).
