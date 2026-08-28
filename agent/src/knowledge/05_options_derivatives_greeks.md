# 📈 Quant Knowledge Pillar 5: Derivatives, Options Greeks & Volatility Surface
*Derived from: "Trading Options Greeks", John Hull ("Risk Management and Financial Institutions"), Vibe-Trading QuantLib*

---

## 1. The Multi-Dimensional Geometry of Options
Unlike linear spot/futures instruments ($P\&L \propto \Delta \text{Spot}$), option pricing is non-linear and governed by the Black-Scholes-Merton partial differential equation and the Volatility Surface $\sigma(K, T)$.

---

## 2. Core Greeks & Practical Edge

### A. Delta ($\Delta$) & Gamma ($\Gamma$)
- **Delta ($\Delta = \frac{\partial V}{\partial S}$)**: Directional sensitivity. For calls $\Delta \in [0, 1]$, for puts $\Delta \in [-1, 0]$.
- **Gamma ($\Gamma = \frac{\partial^2 V}{\partial S^2}$)**: Rate of change of Delta. High near ATM options close to expiration ("Gamma risk").
- **Delta-Neutral Trading**: Neutralizing directional exposure ($\sum w_i \Delta_i = 0$) to trade pure volatility mispricing or time decay.

### B. Theta ($\Theta$) & Vega ($\mathcal{V}$)
- **Theta ($\Theta = \frac{\partial V}{\partial t}$)**: Time decay. Option sellers harvest positive Theta $\Theta > 0$ daily, especially in the last 30-45 days before expiration.
- **Vega ($\mathcal{V} = \frac{\partial V}{\partial \sigma}$)**: Sensitivity to Implied Volatility (IV).
  - Buy Options / Spreads when IV Percentile $< 20\%$ (Cheap Volatility).
  - Sell Credit Spreads / Iron Condors when IV Percentile $> 80\%$ (Overpriced Volatility Mean Reversion).

### C. Implied Volatility (IV) Rank & Percentile
$$\text{IV Rank} = \frac{\text{IV}_{\text{current}} - \text{IV}_{\text{min}, 52w}}{\text{IV}_{\text{max}, 52w} - \text{IV}_{\text{min}, 52w}} \times 100\%$$
- **Rule**: High IV Rank (>50) indicates premium selling opportunities; Low IV Rank (<20) favors directional debit spreads or long gamma strategies.
