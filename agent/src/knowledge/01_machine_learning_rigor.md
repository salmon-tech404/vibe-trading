# 🧠 Quant Knowledge Pillar 1: Machine Learning & Statistical Rigor in Finance
*Derived from: Marcos López de Prado ("Advances in Financial Machine Learning"), Stefan Jansen ("Machine Learning for Algorithmic Trading"), and "Probabilistic Machine Learning for Finance and Investing"*

---

## 1. The Core Dilemma: Standard ML Fails in Finance
In standard computer vision or NLP, samples are Independent and Identically Distributed (IID). 
In financial time series:
1. **Serial Correlation & Memory**: Price bars are not independent.
2. **Non-stationarity**: Distributions drift across regimes (structural breaks).
3. **Low Signal-to-Noise Ratio (SNR)**: Most price variations are microstructural noise or retail churn.
4. **Selection Bias & Multiple Testing**: Backtesting 1,000 random strategies will yield 50 "statistically significant" strategies by pure luck (false discovery).

---

## 2. Institutional Quant Rules (Must-Follow)

### A. Labeling: The Triple Barrier Method (de Prado, Ch. 3)
*Never use fixed-time horizon labeling (e.g. "return over next 5 bars").*
- **Upper Barrier**: Dynamic Take-Profit level based on volatility $\sigma_t \times \text{multiplier}$.
- **Lower Barrier**: Dynamic Stop-Loss level based on volatility $-\sigma_t \times \text{multiplier}$.
- **Vertical Barrier**: Maximum holding time $t + \Delta t$ to free up capital.
- **Label**:
  $$y_t = \begin{cases} +1 & \text{if Upper Barrier hit first (Take Profit)} \\ -1 & \text{if Lower Barrier hit first (Stop Loss)} \\ 0 & \text{if Vertical Barrier hit first (Timeout)} \end{cases}$$

### B. Meta-Labeling (de Prado, Ch. 3 & 5)
- **Primary Model**: Determines the **Side** of the trade (Long or Short) using leading signals / domain heuristics.
- **Secondary (Meta) Model**: Binary classification model predicting **Probability of Success** $P(\text{Trade is Profitable})$.
- **Sizing**: Position size is proportional to the predicted probability $2 \times P(\text{success}) - 1$, scaling into high-conviction trades and filtering out false positives.

### C. Validation: Purged & Embargoed K-Fold Cross Validation (de Prado, Ch. 7)
- Standard K-Fold leaks future information due to overlapping trade labels.
- **Purging**: Remove training samples whose labels overlap with the test set time window.
- **Embargoing**: Remove training samples immediately following the test set to eliminate autoregressive contamination.

### D. Stationarity: Fractional Differentiation (de Prado, Ch. 5)
- Integer differentiation ($d=1$, e.g. $\Delta P_t = P_t - P_{t-1}$) achieves stationarity but **destroys all long-term price memory**.
- Fractional differentiation ($0 < d < 1$) preserves maximum memory while achieving statistical stationarity (ADF test p-value < 0.05).

### E. Multiple Testing & Deflated Sharpe Ratio (DSR) (de Prado, Ch. 8)
- When evaluating $N$ strategy trials, the expected maximum Sharpe ratio under the null hypothesis increases with $\sqrt{2 \ln N}$.
- **Deflated Sharpe Ratio (DSR)** adjusts for trial count, sample length, skewness, and kurtosis to prevent overfitting.
