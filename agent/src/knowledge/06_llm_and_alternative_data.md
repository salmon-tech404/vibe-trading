# 🌐 Quant Knowledge Pillar 6: LLMs in Finance, Market Sentiment & Macro Cycles
*Derived from: "Large Language Models in Finance", "How an Economy Grows and Why it Crashes", "Accounting for Managers"*

---

## 1. Transforming Unstructured Financial Text into Alpha
Over 80% of market-moving financial data is unstructured: earnings transcripts, SEC 10-K/10-Q filings, central bank statements, and social media sentiment.

---

## 2. Quantitative NLP & Sentiment Frameworks

### A. Financial Sentiment Extraction & Tone Dynamics
- Traditional word-count dictionaries (Loughran-McDonald) fail on modern nuanced discourse.
- **LLM / FinBERT Embedding & Aspect-Based Sentiment**:
  - Score specific aspects: *Guidance*, *Margin Pressure*, *Debt Refinancing*, *Supply Chain Constraints*.
  - **Tone Surprise Indicator**:
    $$\Delta \text{Tone} = \text{Sentiment}_{\text{Earnings Call, } t} - \text{RollingMean}(\text{Sentiment}_{t-4:t-1})$$
    *A large positive tone surprise leads to post-earnings announcement drift (PEAD).*

### B. Macroeconomic Cycles & Liquidity Waves
- Markets move in 4 macroeconomic quadrants (Bridgewater / Dalio style):
  1. **Reflation (Growth $\uparrow$, Inflation $\downarrow$)**: Equities & Tech outperform.
  2. **Overheating (Growth $\uparrow$, Inflation $\uparrow$)**: Commodities, Energy & Cyclicals outperform.
  3. **Stagflation (Growth $\downarrow$, Inflation $\uparrow$)**: Cash, Gold, Short-duration bonds.
  4. **Contraction / Deflation (Growth $\downarrow$, Inflation $\downarrow$)**: Long-term Government Bonds.

### C. Financial Statement Health (DuPont & F-Score)
- **Piotroski F-Score (0 to 9)**: Evaluates profitability, leverage/liquidity, and operating efficiency.
  - Avoid value traps: Only trade long setups on stocks with $F\text{-Score} \ge 7$.
- **Altman Z-Score**: Evaluates bankruptcy risk ($Z < 1.81 \implies$ Distressed zone, do not hold swing longs).
