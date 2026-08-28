# 🛡️ Quant Knowledge Pillar 4: Risk Management & Mathematical Money Sizing
*Derived from: John Hull ("Risk Management and Financial Institutions, 4th Edition"), "Quantitative Portfolio Management"*

---

## 1. The Mathematics of Capital Preservation
- A loss of $-50\%$ requires $+100\%$ gain just to break even.
- A loss of $-80\%$ requires $+400\%$ gain to break even.
- **Rule**: Survival is the prerequisite for compound growth. Edge without risk management is guaranteed long-term ruin.

---

## 2. Institutional Risk Frameworks

### A. Position Sizing: The Kelly Criterion & Fractional Kelly
For a strategy with win rate $p$, loss rate $q = 1-p$, and reward-to-risk ratio $b = \frac{\text{Avg Win}}{\text{Avg Loss}}$:
$$f^* = \frac{p \cdot b - q}{b} = p - \frac{q}{b}$$
- **Full Kelly ($f^*$)**: Maximizes expected log-wealth asymptotically, but produces massive drawdowns (>50%).
- **Fractional Kelly ($\frac{1}{2} f^*$ or $\frac{1}{4} f^*$)**: Institutional standard. Preserves 75-90% of geometric growth while reducing maximum drawdown and variance by more than 50%.
- **Fixed Fractional Risk**: Never risk more than $1\%$ to $2\%$ of total portfolio equity on any single trade:
  $$\text{Position Size} = \frac{\text{Portfolio Equity} \times \text{Risk \%}}{\text{Entry Price} - \text{Stop Loss Price}}$$

### B. Dynamic ATR Volatility Stop-Loss & Take-Profit Targets
- Static percentage stops (e.g. 2%) ignore changing market volatility.
- **ATR-Based Stop Loss**:
  $$\text{Stop Loss}_{\text{Long}} = \text{Entry Price} - k \cdot \text{ATR}_{14} \quad (k \in [1.5, 2.5])$$
- **Multiple Take-Profit Targets**:
  - $\text{TP}_1 = \text{Entry} + 1.5 \cdot (\text{Entry} - \text{SL})$ (Take 50% profit, move SL to Break-Even).
  - $\text{TP}_2 = \text{Entry} + 2.5 \cdot (\text{Entry} - \text{SL})$ (Take 30% profit, activate trailing stop).
  - $\text{TP}_3 = \text{Entry} + 4.0 \cdot (\text{Entry} - \text{SL})$ (Runner position closed on trend reversal).

### C. Value at Risk (VaR) & Expected Shortfall (CVaR) (Hull, Ch. 12-14)
- **$\text{VaR}_\alpha$**: The maximum dollar loss over horizon $T$ at confidence level $1-\alpha$ (e.g. 99% 1-day VaR).
- **$\text{CVaR}_\alpha$ (Expected Shortfall)**: The expected loss *conditional* on the loss exceeding $\text{VaR}_\alpha$ (captures tail risk / black swans that VaR ignores).
- **Extreme Value Theory (EVT)**: Generalized Pareto Distribution (GPD) modeling of the asymptotic tail distribution to prevent underestimating flash crash risk.
