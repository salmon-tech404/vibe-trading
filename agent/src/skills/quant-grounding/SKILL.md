---
name: quant-grounding
description: Institutional Quantitative Rigor & Knowledge Grounding Skill derived from the 21-volume Finance & Quantitative Trading Knowledge Base. Enforces regime adaptability, leading indicators, microstructure rules, and risk management.
category: discipline
---

# 🏛️ Institutional Quant Grounding & Verification Skill

## Overview
This skill provides systematic quantitative grounding for all strategy development, factor research, indicator design, and backtesting within Vibe-Trading. It draws directly from the 21 classic quantitative finance volumes located in the KnowledgeBase (`Finance & Trading`).

---

## 🎯 The 5 Non-Negotiable Institutional Rules

### Rule 1: Dynamic Market Regime Filtering (Perry Kaufman & Ernie Chan)
- **Law**: Never trade a pure trend strategy in chop or a mean-reversion strategy in a runaway trend.
- **Implementation**:
  - Calculate Kaufman Efficiency Ratio $ER = \frac{|\Delta P|}{\sum |\Delta P_i|}$.
  - If $ER > 0.4$, enable trend-following modules (KAMA, breakout, trailing stop).
  - If $ER < 0.3$, disable breakout signals to prevent whipsaws; activate mean-reversion (VWAP/Bollinger reclaim).
  - Verify persistence using the Hurst Exponent ($H > 0.5 \implies$ Trending, $H < 0.5 \implies$ Mean-Reverting).

### Rule 2: Prioritize Leading Microstructure over Lagging Math (HFT & Order Flow)
- **Law**: Traditional indicators (MA, MACD) are lagging derivations of past prices ($N$-bar lag).
- **Implementation**:
  - Detect **Liquidity Sweeps**: Price breaches swing highs/lows to harvest retail stop losses and immediately rejects back inside the range.
  - Detect **Fair Value Gaps (FVG)**: Imbalance zones where rapid institutional movement left unfilled orders.
  - Detect **Volume-Weighted Divergence**: Price makes a lower low but Money Flow / OBV makes a higher low.

### Rule 3: Triple-Barrier Labeling & Meta-Labeling (Marcos López de Prado)
- **Law**: Fixed-time horizon labels produce misleading Sharpe ratios.
- **Implementation**:
  - Always set 3 barriers: Dynamic ATR Take-Profit, Dynamic ATR Stop-Loss, and Time Horizon Timeout.
  - Separate trade direction (Primary Model) from trade sizing & conviction (Secondary Meta-Model).

### Rule 4: Rigorous Fractional Kelly Risk Sizing (John Hull)
- **Law**: Ruin probability must asymptotically equal zero.
- **Implementation**:
  - Single trade risk capped at $1.0\% - 2.0\%$ of total portfolio equity.
  - Stop loss must be dynamic: $\text{SL} = \text{Entry} \pm (k \times \text{ATR}_{14})$ with $k \in [1.5, 2.5]$.
  - Risk-to-Reward ratio ($R:R$) must be $\ge 1 : 1.5$ for TP1, $\ge 1 : 2.5$ for TP2.

### Rule 5: Deflated Sharpe Ratio & Overfitting Defense
- **Law**: Multiple backtest trials inflate expected performance by $\approx \sqrt{2 \ln N}$.
- **Implementation**:
  - Always check Deflated Sharpe Ratio (DSR).
  - Use Purged & Embargoed Cross-Validation to eliminate serial correlation leakage.

---

## 🛠️ Usage in Agent Workflows

Whenever designing or auditing a strategy:
1. `from src.knowledge.knowledge_hub import KnowledgeHub`
2. Cross-reference `KnowledgeHub.get_strategy_grounding_checklist()`.
3. Check the relevant Knowledge Card (`01_machine_learning_rigor.md` to `06_llm_and_alternative_data.md`).
4. Generate production-ready Pine Script v6 via `agent/src/skills/pine-script/vibe_alpha_leading_indicator.pine`.
