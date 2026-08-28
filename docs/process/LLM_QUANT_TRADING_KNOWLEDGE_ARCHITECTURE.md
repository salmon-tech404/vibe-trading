# KIẾN TRÚC KNOWLEDGE BASE ĐỊNH LƯỢNG & HỆ THỐNG RA QUYẾT ĐỊNH BOT TRADING BẰNG LLM

> **Tài liệu tham chiếu chuẩn hóa kiến thức từ 21 tài liệu Finance & Trading**  
> **Áp dụng cho:** Hệ thống Bot Trading Tự động (Vibe-Trading Hybrid Engine: LLM Reasoning + Deterministic Execution)  
> **Vị trí lưu trữ:** `docs/process/LLM_QUANT_TRADING_KNOWLEDGE_ARCHITECTURE.md`

---

## MỤC LỤC
1. [Tổng quan & Triết lý Thiết kế Hệ thống](#1-tổng-quan--triết-lý-thiết-kế-hệ-thống)
2. [Rà soát & Đánh giá Toàn bộ 21 Tài liệu Finance & Trading](#2-rà-soát--đánh-giá-toàn-bộ-21-tài-liệu-finance--trading)
3. [Chắt lọc 6 Trụ Cột Định Lượng Cốt Lõi (Quant Pillars)](#3-chắt-lọc-6-trụ-cột-định-lượng-cốt-lõi-quant-pillars)
4. [Cấu trúc Knowledge Base & Schema Chuẩn Hóa (Knowledge Item)](#4-cấu-trúc-knowledge-base--schema-chuẩn-hóa-knowledge-item)
5. [Cơ chế Retrieval & Hybrid Decision Engine (LLM + Deterministic Gates)](#5-cơ-chế-retrieval--hybrid-decision-engine-llm--deterministic-gates)
6. [Hệ thống Logging Chi Tiết & Root-Cause Diagnosis Engine](#6-hệ-thống-logging-chi-tiết--root-cause-diagnosis-engine)
7. [Cơ chế Thích Nghi & Học Hỏi Liên Tục (Active Learning Loop)](#7-cơ-chế-thích-nghi--học-hỏi-liên-tục-active-learning-loop)
8. [Sơ đồ Kiến Trúc Tổng Thể (End-to-End System)](#8-sơ-đồ-kiến-trúc-tổng-thể-end-to-end-system)
9. [Lộ Trình Triển Khai Thực Tế (Roadmap 4 Giai Đoạn)](#9-lộ-trình-triển-khai-thực-tế-roadmap-4-giai-đoạn)

---

## 1. TỔNG QUAN & TRIẾT LÝ THIẾT KẾ HỆ THỐNG

### 1.1. Vấn đề của các Hệ thống Trading LLM Thông thường
* **Ảo giác (Hallucination)**: LLM tự suy diễn các mức giá vào lệnh, cắt lỗ hoặc lý do phân tích cảm tính mà không có cơ sở toán học.
* **Loãng ngữ cảnh (Context Pollution)**: Nạp toàn bộ sách thô vào context window khiến LLM bị quá tải, nhầm lẫn các trường phái mâu thuẫn nhau (như Trend Following vs Mean Reversion).
* **Thiếu kỷ luật rủi ro**: Để LLM tự quyết định khối lượng lệnh (Position Size) và đòn bẩy dẫn đến rủi ro cháy tài khoản.

### 1.2. Triết lý Vibe-Trading Hybrid Architecture
1. **Kiến thức có chọn lọc và có cấu trúc**: Toàn bộ kiến thức từ 21 cuốn sách được chắt lọc thành các **Strategy Cards dạng JSON/Metadata** có định nghĩa toán học rõ ràng, gắn nhãn điều kiện thị trường (Market Regime) và rủi ro.
2. **Phân quyền rành mạch (LLM Reasoning vs Deterministic Execution)**:
   * **LLM**: Đóng vai trò **Hội đồng Phân tích Định lượng (Quant Committee)** — đọc dữ liệu thị trường đã chuẩn hóa, đối chiếu các Strategy Cards phù hợp với bối cảnh hiện tại, đánh giá sự đồng thuận (Confluence) và đưa ra luận điểm `LONG / SHORT / NO_TRADE`.
   * **Deterministic Code (Code Cứng)**: Quản lý 100% việc **tính toán chỉ báo (ER, ATR, RSI, OFI)**, **xác định Market Regime**, **tính mức Stop Loss / Take Profit theo ATR**, **định cỡ vị thế theo Fractional Kelly**, và **cầu chì ngắt mạch an toàn (Circuit Breaker)**.
3. **Vòng lặp học tập từ thực tế (Continuous Improvement Loop)**: Mọi lệnh thắng/thua đều được ghi log snapshot toàn diện và đưa qua module chẩn đoán nguyên nhân gốc rễ (Root Cause) để cập nhật độ tin cậy của từng chiến lược.

---

## 2. RÀ SOÁT & ĐÁNH GIÁ TOÀN BỘ 21 TÀI LIỆU FINANCE & TRADING

Chúng tôi chia 21 tài liệu thành **4 phân tầng giá trị (Tier 1 đến Tier 4)**:

### 2.1. TIER 1: Nền tảng Định lượng & Machine Learning Tối cao (4 Cuốn - Cốt lõi)
1. **Advances in Financial Machine Learning (Marcos López de Prado)**:
   * *Đóng góp*: **Triple-Barrier Method** (gắn nhãn động theo biến động), **Meta-Labeling** (mô hình cấp 1 chọn hướng, mô hình cấp 2 tính xác suất thành công), **Fractional Differentiation** (bảo toàn trí nhớ chuỗi thời gian), **Deflated Sharpe Ratio (DSR)** (chống overfitting).
   * *Đánh giá*: ⭐⭐⭐⭐⭐ Cung cấp nền tảng toán học chuẩn mực nhất để bot không bị ảo tưởng về tỷ lệ thắng.
2. **Trading Systems and Methods, 6th Edition (Perry J. Kaufman)**:
   * *Đóng góp*: **Kaufman Efficiency Ratio (ER)** phân tách rõ ràng thị trường có Xu hướng (Trend) hay Đi ngang (Chop/Noise), đường trung bình thích ứng **KAMA**, bộ lọc chống dính bẫy nến rút râu (Whipsaw filters).
   * *Đánh giá*: ⭐⭐⭐⭐⭐ Chìa khóa để bot nhận diện trạng thái thị trường (Market Regime) trước khi kích hoạt chiến lược.
3. **Machine Learning for Algorithmic Trading, 2nd Edition (Stefan Jansen)**:
   * *Đóng góp*: Pipeline định lượng hoàn chỉnh từ Data $\to$ Feature Engineering $\to$ Factor Alpha $\to$ Model $\to$ Backtest. Phân tích Sentiment NLP từ tin tức tài chính.
   * *Đánh giá*: ⭐⭐⭐⭐⭐ Framework chuẩn để kết nối dữ liệu thị trường với LLM.
4. **Quantitative Trading, 2nd Edition (Dr. Ernest P. Chan)**:
   * *Đóng góp*: **Hurst Exponent ($H$)** đo lường xu hướng tiếp diễn hay đảo chiều, **Cointegration & Pairs Trading**, mô hình hồi quy đảo chiều Ornstein-Uhlenbeck (Half-Life).
   * *Đánh giá*: ⭐⭐⭐⭐⭐ Xác định chính xác chu kỳ đảo chiều và thời gian giữ lệnh kỳ vọng.

### 2.2. TIER 2: Vi Cấu Trúc, Xác Suất & Quản Trị Rủi Ro (5 Cuốn - Trọng yếu)
5. **Developing High-Frequency Trading Systems, 2nd Edition (Sebastien Donadio)**:
   * *Đóng góp*: **Order Flow Imbalance (OFI)**, sự mất cân đối sổ lệnh Limit Order Book (LOB), cơ chế thanh khoản Maker vs Taker.
   * *Đánh giá*: ⭐⭐⭐⭐ Giúp bot hiểu bản chất giá dịch chuyển là do sự mất cân đối thanh khoản.
6. **Probabilistic Machine Learning for Finance and Investing (Deepak Kanungo)**:
   * *Đóng góp*: Suy luận Bayes cập nhật niềm tin (Prior $\to$ Evidence $\to$ Posterior), ước lượng độ bất định (Uncertainty Estimation) của tín hiệu.
   * *Đánh giá*: ⭐⭐⭐⭐ Cung cấp thuật toán tính `Confidence Score` động cho từng chiến lược.
7. **Risk Management and Financial Institutions, 4th Edition (John C. Hull)**:
   * *Đóng góp*: **Value at Risk (VaR)**, **Expected Shortfall (CVaR)**, Lý thuyết Giá trị Cực trị (EVT) phòng chống rủi ro sập sàn ("Thiên nga đen").
   * *Đánh giá*: ⭐⭐⭐⭐ Thiết lập Hard Risk Gates cho bot.
8. **Financial Markets and Trading (Anatoly B. Schmidt)**:
   * *Đóng góp*: Cơ chế khớp lệnh, chênh lệch Bid-Ask Spread, tác động thị trường (Market Impact) và độ trượt giá (Slippage).
   * *Đánh giá*: ⭐⭐⭐⭐ Ước lượng chi phí thực thi thực tế.
9. **Quantitative Portfolio Management (Michael Isichenko)**:
   * *Đóng góp*: Quản lý danh mục đa tài sản, tối ưu hóa phân bổ vốn và kiểm soát tương quan chéo giữa các coin.
   * *Đánh giá*: ⭐⭐⭐⭐ Áp dụng khi bot mở đồng thời nhiều vị thế khác nhau.

### 2.3. TIER 3: Phái Sinh, NLP & Lập Trình Thực Thi (4 Cuốn)
10. **Large Language Models in Finance**: Ứng dụng LLM trích xuất tin tức, tổng hợp lý do vào lệnh có dẫn chứng.
11. **Trading Options Greeks (Dan Passarelli)**: Delta, Gamma, Vega, Theta, Implied Volatility (IV) Rank & Percentile để dự báo biến động.
12. **Python for Algorithmic Trading (Yves Hilpisch)**: Kiến trúc lập trình Vectorized Backtesting và Event-driven Engine.
13. **Python for Finance, 3rd Edition (Yves Hilpisch)**: Thư viện tính toán định lượng Numpy/Pandas/Scipy.

### 2.4. TIER 4: Tài Liệu Tổng Quát & Không Nên Dùng Trực Tiếp (8 Cuốn)
* *Bao gồm*: `Accounting for Managers`, `Business Intelligence Strategy`, `Business Strategy (Brian Tracy)`, `How an Economy Grows and Why it Crashes (Peter Schiff)`, `Logistics and Supply Chain Management`, `Management of Banking & Financial Services`, cùng các bản trùng lặp cũ.
* *Lý do loại bỏ khỏi Prompt*: Đây là các tài liệu quản trị chung hoặc kinh tế học đại chúng, không có công thức toán học hoặc quy tắc vào lệnh cụ thể. Nếu đưa vào LLM sẽ gây loãng ngữ cảnh và tăng tỷ lệ nhận định sai lệch.

---

## 3. CHẮT LỌC 6 TRỤ CỘT ĐỊNH LƯỢNG CỐT LÕI (QUANT PILLARS)

### Trụ Cột 1: Phân Tầng Trạng Thái Thị Trường (Market Regime Detection)
* **Kaufman Efficiency Ratio (ER)**:
  $$\text{Direction} = |P_t - P_{t-n}|, \quad \text{Volatility} = \sum_{i=0}^{n-1} |P_{t-i} - P_{t-i-1}|, \quad ER_t = \frac{\text{Direction}}{\text{Volatility}} \in [0, 1]$$
  * **$ER > 0.60$ (Trend Regime)**: Bật chiến lược **Trend Pullback / Breakout (KAMA)**. Cấm Mean-Reversion.
  * **$ER < 0.35$ (Chop / Range Regime)**: Bật chiến lược **Mean-Reversion (Bollinger Bands, RSI Divergence)**. Cấm Breakout.
  * **$0.35 \le ER \le 0.60$ (Chuyển tiếp)**: Yêu cầu xác nhận đa khung thời gian hoặc giảm 50% khối lượng.
* **Hurst Exponent ($H$)**:
  * $H > 0.5 \implies$ Giá có quán tính tiếp diễn xu hướng.
  * $H < 0.5 \implies$ Giá có tính chất hồi quy về trung bình với chu kỳ $\text{Half-Life} = \frac{\ln 2}{\theta}$.

### Trụ Cột 2: Gắn Nhãn Động & Meta-Labeling
* **Triple-Barrier Method**:
  1. *Upper Barrier*: $P_{\text{entry}} + k_{\text{tp}} \cdot \text{ATR}_{14}$.
  2. *Lower Barrier*: $P_{\text{entry}} - k_{\text{sl}} \cdot \text{ATR}_{14}$.
  3. *Vertical Barrier*: Hết hạn sau tối đa 24 nến để thu hồi vốn.
* **Meta-Labeling**:
  * Mô hình sơ cấp (LLM / Trend Signal): Quyết định chọn phe `LONG` hoặc `SHORT`.
  * Mô hình thứ cấp (Quant Probability Gate): Tính xác suất thắng $P$. Chỉ cho phép đặt lệnh khi $P \ge 0.60$.

### Trụ Cột 3: Vi Cấu Trúc Thị Trường & Dòng Tiền Thông Minh (Smart Money & Order Flow)
* **Liquidity Sweep (Quét thanh khoản)**: Giá tạo đáy mới (Lower Low) quét sạch lệnh cắt lỗ của retail, nhưng ngay lập tức rút chân đóng nến bên trong đáy cũ kèm khối lượng lớn $\implies$ Kích hoạt điểm vào lệnh đảo chiều với tỷ lệ R:R cao.
* **Fair Value Gap (FVG / Imbalance)**: Vùng mất cân bằng giữa 3 nến. Giá có xác suất hơn 70% quay về kiểm tra (re-test) FVG trước khi tiếp diễn sóng.
* **Đồng pha Đa khung thời gian (MTF Confluence)**: Khung 1H làm kim chỉ nam xu hướng chính, khung 5m dùng để canh điểm kích hoạt vào lệnh tối ưu.

### Trụ Cột 4: Quản Trị Rủi Ro Toán Học & Bảo Toàn Vốn
* **Position Sizing (Fractional Kelly)**:
  $$f^* = p - \frac{1-p}{b} \quad \implies \quad \text{Áp dụng } \frac{1}{4} f^* \text{ hoặc } \frac{1}{2} f^*$$
  $$\text{Max Risk} \le 1.0\% - 2.0\% \text{ Tổng vốn tài khoản}$$
  $$\text{Position Size (Coins)} = \frac{\text{Equity} \times \text{Risk \%}}{|\text{Entry Price} - \text{Stop Loss Price}|}$$
* **Dynamic ATR Multi-Tier Exit Targets**:
  * $\text{SL} = \text{Entry} \pm 1.5 \times \text{ATR}_{14}$
  * $\text{TP}_1 = \text{Entry} \pm 1.5 \times R$ (Đóng 50% vị thế, dời SL về Hòa Vốn).
  * $\text{TP}_2 = \text{Entry} \pm 2.5 \times R$ (Đóng 30% vị thế, bật Trailing Stop KAMA).
  * $\text{TP}_3 = \text{Entry} \pm 4.0 \times R$ (Giữ 20% vị thế cho đến khi có tín hiệu đảo chiều 1H).

---

## 4. CẤU TRÚC KNOWLEDGE BASE & SCHEMA CHUẨN HÓA (KNOWLEDGE ITEM)

### 4.1. Cấu Trúc Thư Mục
```
📁 knowledge_base/
├── 📁 strategies/             # Thẻ chiến lược định lượng JSON
│   ├── STRAT_001_kama_trend_pullback.json
│   ├── STRAT_002_liquidity_sweep_reversal.json
│   ├── STRAT_003_bollinger_mean_reversion.json
│   └── STRAT_004_fvg_imbalance_continuation.json
├── 📁 market_regimes/         # Ma trận trạng thái thị trường
│   ├── REGIME_trending_bull.json
│   ├── REGIME_ranging_chop.json
│   └── REGIME_high_volatility_crisis.json
├── 📁 failure_patterns/       # Danh mục các bẫy nến và kịch bản thất bại
│   ├── FAIL_whipsaw_in_low_er.json
│   └── FAIL_fvg_breakdown_against_htf.json
└── 📁 risk_rules/             # Các quy tắc bảo vệ vốn bắt buộc
    ├── RULE_fractional_kelly_sizing.json
    └── RULE_circuit_breaker_max_drawdown.json
```

### 4.2. Schema Chuẩn Hóa cho Knowledge Item (`KnowledgeItemSchema`)
```typescript
interface KnowledgeItem {
  id: string;                          // Ví dụ: "STRAT_002_LIQUIDITY_SWEEP"
  name: string;                        // Tên chiến lược
  category: "trend" | "mean_reversion" | "breakout" | "volatility" | "risk_rule" | "failure_pattern";
  sourceDocument: {
    bookTitle: string;                 // "Developing High-Frequency Trading Systems, 2nd Ed"
    author: string;                    // "Sebastien Donadio"
    chapter: string;                   // "Chapter 4"
    pageOrSection: string;             // "Section 4.3"
  };

  coreHypothesis: string;              // Luận điểm cốt lõi
  theoreticalBasis: "mathematical" | "microstructural" | "statistical_anomaly" | "heuristic";

  applicableMarketRegimes: Array<"trending_bull" | "trending_bear" | "ranging_chop" | "high_volatility">;
  requiredPreconditions: {
    minEfficiencyRatio?: number;
    maxEfficiencyRatio?: number;
    htfTrendAlignment: "must_align" | "can_counter" | "neutral";
    minSetupScore: number;             // Ví dụ: >= 75/100
  };

  entryConditions: {
    primaryTrigger: string;            // Điều kiện kích hoạt nến
    indicatorFilters: string[];        // Danh sách bộ lọc chỉ báo
    orderType: "MARKET" | "LIMIT";
  };

  exitConditions: {
    stopLossRule: string;              // Quy tắc đặt SL (tính theo ATR)
    tp1Rule: string;                   // Quy tắc TP1 (1.5R)
    tp2Rule: string;                   // Quy tắc TP2 (2.5R)
    tp3Rule: string;                   // Quy tắc TP3 (Trailing KAMA)
    maxHoldingPeriodBars: number;      // Giới hạn thời gian tối đa
  };

  riskManagement: {
    maxCapitalAllocationPct: number;   // 1.5%
    maxLeverage: number;               // 10x - 20x
    invalidationTrigger: string;       // Điều kiện vô hiệu hóa kịch bản
  };

  evidenceLevel: "mathematically_proven" | "empirically_backtested" | "expert_opinion" | "unverified";
  verificationStatus: "unverified" | "backtesting" | "verified_live" | "deprecated";
  confidenceScore: number;             // Trọng số động 0.00 -> 1.00
  
  associatedFailurePatterns: string[]; // Các bẫy thất bại cần cảnh giác
  conflictingStrategies: string[];     // Các chiến lược xung đột
}
```

---

## 5. CƠ CHẾ RETRIEVAL & HYBRID DECISION ENGINE (LLM + DETERMINISTIC GATES)

### 5.1. Phân Định Quyền Hạn Kỹ Thuật
* **Code Cứng Đảm Nhận (100% Deterministic)**:
  - Tính toán số học: ER, Hurst, ATR, RSI, KAMA, Setup Score.
  - Phân loại Market Regime.
  - Tính toán chính xác giá Stop Loss, Take Profit và Số lượng coin (Size).
  - Cầu chì kiểm tra tài khoản (Max Daily Loss, System Killswitch).
* **LLM Đảm Nhận (Quant Reasoning)**:
  - Đọc bức tranh toàn cảnh: Cấu trúc sóng 1H, phản ứng tại vùng hỗ trợ/kháng cự, các yếu tố tin tức/sentiment.
  - Đánh giá sự đồng thuận giữa các chiến lược được trích xuất.
  - Đưa ra quyết định định hướng (`LONG`, `SHORT`, hoặc `NO_TRADE` khi dữ liệu xung đột) kèm lý do lập luận chi tiết.

---

## 6. HỆ THỐNG LOGGING CHI TIẾT & ROOT-CAUSE DIAGNOSIS ENGINE

Mọi quyết định đều được lưu vào cơ sở dữ liệu nhật ký giao dịch (`ComprehensiveTradeLog`):

```typescript
interface ComprehensiveTradeLog {
  tradeId: string;
  timestamp: string;
  symbol: string;
  action: "LONG" | "SHORT" | "NO_TRADE";

  // Snapshot toàn bộ trạng thái thị trường lúc vào lệnh
  marketContextSnapshot: {
    marketRegime: "trending_bull" | "trending_bear" | "ranging_chop" | "high_volatility";
    kaufmanER: number;
    hurstExponent: number;
    atr14: number;
    currentPrice: number;
    setupScore: number;
    htfTrend1h: "bullish" | "bearish" | "neutral";
  };

  // Dữ liệu LLM
  llmInputPrompt: string;
  retrievedKnowledgeItemIds: string[];
  llmDecision: {
    selectedStrategyId: string;
    rationale: string;
    confidenceScore: number;
  };

  // Thông số thực thi lệnh cứng
  executionDetails: {
    entryPrice: number;
    executedQuantity: number;
    stopLossPrice: number;
    tp1Price: number;
    tp2Price: number;
    leverage: number;
    marginUsd: number;
  };

  // Kết quả sau khi kết thúc lệnh
  postTradeOutcome: {
    exitTimestamp: string;
    exitPrice: number;
    exitReason: "TP1_HIT" | "TP2_HIT" | "TP3_HIT" | "SL_HIT" | "TRAILING_STOP" | "TIMEOUT" | "EMERGENCY_HALT";
    realizedPnLUsd: number;
    realizedRoiPct: number;
    tradeResult: "SUCCESS" | "FAILED" | "BREAK_EVEN";
    maxFavorableExcursionMFE: number; // Đỉnh lãi cao nhất trong phiên
    maxAdverseExcursionMAE: number;   // Đáy lỗ sâu nhất trước khi đảo chiều
  };

  // Chẩn đoán lỗi gốc rễ (Root Cause Analysis - khi FAILED)
  rootCauseAnalysis?: {
    failureCategory: 
      | "MARKET_UNCERTAINTY"          // Biến động ngẫu nhiên trong xác suất
      | "REGIME_MISMATCH"             // Áp dụng chiến lược sai bối cảnh thị trường
      | "LLM_REASONING_ERROR"         // LLM diễn giải sai tín hiệu hoặc bỏ qua bẫy nến
      | "STOP_LOSS_VOLATILITY_TRAP"   // Đặt SL quá sát biến động thực tế
      | "DATA_OR_EXECUTION_ERROR";    // Trượt giá lớn hoặc dữ liệu API trễ
    detailedExplanation: string;
    actionableFeedbackForKnowledgeBase: string;
    confidenceAdjustment: number;     // Điều chỉnh trọng số (Ví dụ: -0.05)
  };
}
```

---

## 7. CƠ CHẾ THÍCH NGHI & HỌC HỎI LIÊN TỤC (ACTIVE LEARNING LOOP)

### 7.1. Cập Nhật Trọng Số Tín Nhiệm (Confidence Score Adjustment)
Sau mỗi chu kỳ kiểm toán định kỳ ($N = 20$ lệnh):
$$\text{NewConfidence}(S_i | R_j) = \alpha \cdot \text{PriorConfidence} + (1 - \alpha) \cdot \left(\text{WinRate} \times \frac{\text{ProfitFactor}}{\text{TargetPF}}\right)$$
*(với $\alpha = 0.85$ là hệ số duy trì bộ nhớ dài hạn, tránh phản ứng thái quá trước một vài lệnh thua do biến động ngẫu nhiên).*

### 7.2. Vòng Đời Trạng Thái của Chiến Lược (Strategy Lifecycle)
* **Verified & Promoted ($\text{Confidence} \ge 0.80$)**: Chiến lược ưu tiên cao nhất, cấp 100% hạn mức vốn.
* **Under Review / Scaled Down ($0.60 \le \text{Confidence} < 0.80$)**: Giảm 50% khối lượng phân bổ vốn.
* **Paper-Trading Only ($0.45 \le \text{Confidence} < 0.60$)**: Tạm dừng tiền thật, chỉ chạy trên Testnet để thu thập thêm dữ liệu.
* **Deprecated / Quarantined ($\text{Confidence} < 0.45$)**: Loại khỏi Decision Pipeline, đưa vào kho lưu trữ để nghiên cứu lại điều kiện vào lệnh.

---

## 8. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ (END-TO-END SYSTEM)

```
                       KIẾN TRÚC TOÀN DIỆN VIBE-TRADING HYBRID SYSTEM
  ========================================================================================

  [ TẦNG DỮ LIỆU & TRI THỨC ]
  📚 21 Sách Finance & Trading ──> [ Quant Distillation ] ──> 💾 Structured Knowledge Base
                                                                    (JSON Strategy Cards)

  [ TẦNG XỬ LÝ THỜI GIAN THỰC ]
  📡 Live Binance Futures ──> ⚙️ Deterministic Quant Engine
                                  (ER, Hurst, ATR, Setup Score)
                                           │
                                           ▼
                                📊 Standardized Context State
                                           │
                                           ▼
                                🔍 Context-Aware Knowledge Retrieval ──< (Lọc theo Regime)
                                           │
                                           ▼
                                🧠 LLM Quant Analyst Committee
                                   (Đánh giá Confluence, chọn phe LONG/SHORT)
                                           │
                                           ▼
                                🛡️ Hard Safety Gates (Code Cứng: SL, Sizing, Max Loss)
                                           │
                                           ▼
                                ⚡ Binance Futures Order Execution

  [ TẦNG KIỂM TOÁN & HỌC HỎI ]
  📈 Trade Outcomes & PnL ──> 📜 Full Audit Trade Logger
                                           │
                                           ▼
                                🔬 Post-Mortem Root Cause Analyzer
                                           │
                                           ▼
                                ⚖️ Active Learning & Confidence Rebalancing
                                           │
                                           └──> [ Cập nhật lại Knowledge Base ]
```

---

## 9. LỘ TRÌNH TRIỂN KHAI THỰC TẾ (ROADMAP 4 GIAI ĐOẠN)

```
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ GIAI ĐOẠN 1: Chuẩn Hóa Knowledge Base & Bộ Lọc Context (Tuần 1)                        │
  │ • Chuyển đổi 6 Quant Pillars thành các file JSON Strategy Cards độc lập.              │
  │ • Tích hợp Kaufman ER, Hurst Exponent, ATR vào State Extractor của Bot.               │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ GIAI ĐOẠN 2: Tích hợp LLM Context Retrieval & Hybrid Decision Engine (Tuần 2)          │
  │ • Xây dựng bộ lọc nạp đúng 2-3 Strategy Cards phù hợp với Market Regime.              │
  │ • Kết nối LLM Reasoning với các Deterministic Safety Gates (Fractional Kelly, ATR SL).│
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ GIAI ĐOẠN 3: Triển Khai Comprehensive Trade Logging & Root Cause Analyzer (Tuần 3)     │
  │ • Ghi log toàn diện mọi quyết định giao dịch (Context, Prompt, Reasoning, PnL).        │
  │ • Viết module tự động phân loại nguyên nhân thất bại (Regime Mismatch vs Noise).      │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ GIAI ĐOẠN 4: Vòng Lặp Học Hỏi Thích Nghi & Tự Động Điều Chỉnh Trọng Số (Tuần 4)        │
  │ • Tự động tính toán lại Confidence Score theo chu kỳ 20 lệnh thực tế.                  │
  │ • Tự động nâng cấp / hạ cấp / cách ly các chiến lược dựa trên dữ liệu thật.           │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### TỔNG KẾT NGUYÊN TẮC BẤT BIẾN
1. **Không bao giờ tin tưởng mù quáng vào sách giáo khoa**: Mọi chiến lược đều phải trải qua kiểm chứng bằng dữ liệu thị trường thực tế.
2. **Không để LLM tự quyết định quản trị rủi ro**: Mọi phép tính về Stop Loss, Take Profit và Size lệnh bắt buộc phải thực thi bằng **Code Cứng Deterministic**.
3. **Mỗi thất bại là một bài học có cấu trúc**: Phân tích rõ ràng nguồn gốc sai lầm để tinh chỉnh bộ lọc ngữ cảnh, giúp Bot ngày càng hoàn thiện và bền vững trước mọi điều kiện thị trường.
