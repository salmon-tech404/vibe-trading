# 🧠 MASTER QUANTITATIVE KNOWLEDGE CHAIN
## Tổng hợp Toàn diện Chuỗi Tri thức Định lượng từ 38 Sách & Tài liệu Chuyên sâu

> **Knowledge Base Source:** `D:\04-knowledge-base\Finance & Trading` (38 tác phẩm chuyên khảo)  
> **Mục tiêu:** Hệ thống hóa toàn bộ các nguyên lý, công thức toán học, mối liên hệ liên ngành, điểm mâu thuẫn, khoảng trống tri thức và quy chuẩn thực thi định lượng thành một **Chuỗi Tri thức Khép kín (End-to-End Knowledge Chain)**.

---

## 🗺️ BẢN ĐỒ CHUỖI GIÁ TRỊ ĐỊNH LƯỢNG (QUANT VALUE CHAIN)

Chuỗi tri thức được cấu trúc tuần tự qua 10 mắt xích logic không thể tách rời:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CHUYỂN ĐỘNG CỦA DÒNG TRI THỨC ĐỊNH LƯỢNG                      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
 [MẮT XÍCH 1: DATA STRUCTURES]    Tick / L2 Data ──► Information-Driven Bars (Dollar, Volume, TIB)
                                            │
 [MẮT XÍCH 2: REPRESENTATION]     Fractional Calculus (d*) ──► Stationarity + Memory Preservation
                                            │
 [MẮT XÍCH 3: MICROSTRUCTURE]     Order Flow Imbalance (OFI) + Kaufman ER + Auction Value Area (AMT)
                                            │
 [MẮT XÍCH 4: REGIME DETECTION]   Sticky Bayesian HDP-HMM ──► Dynamic State Posteriors P(S_k|X_t)
                                            │
 [MẮT XÍCH 5: ALPHA GENERATION]   Multi-Horizon Signals ──► Symmetric Löwdin Orthogonalization
                                            │
 [MẮT XÍCH 6: META-LABELING]      Triple Barrier Method ──► Bayesian Conformal Epistemic Decomposition
                                            │
 [MẮT XÍCH 7: PORTFOLIO ALLOC]    Ledoit-Wolf Shrinkage ──► Hierarchical Risk Parity (HRP)
                                            │
 [MẮT XÍCH 8: BET SIZING]         Fractional Kelly ──► Epistemic Uncertainty Penalization
                                            │
 [MẮT XÍCH 9: OPTIMAL EXECUTION]  Cartea-Jaimungal HJB Dynamic Control ──► Square-Root Impact Minimization
                                            │
 [MẮT XÍCH 10: RISK & MONITORING] Peaks-Over-Threshold EVT CVaR ──► CUSUM Concept Drift Filter
```

---

## 📚 CHI TIẾT TỪNG MẮT XÍCH TRI THỨC (THEORETICAL MODULES)

### MẮT XÍCH 1: CẤU TRÚC DỮ LIỆU & LẤY MẪU THÔNG TIN (DATA STRUCTURES & SAMPLING)
* **Tác phẩm tham chiếu:**
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - Ch. 2
  - *Developing High-Frequency Trading Systems* (Donadio & Ghosh)
  - *Designing Financial Data Architectures* (Fabrizio Pastore)
* **Nguyên lý nền tảng:**
  - **Hạn chế của Calendar-Time Bars (1m, 1h, 1d):** Thị trường tài chính không tiếp nhận thông tin đồng đều theo thời gian lịch. Vào giờ mở/đóng cửa, tốc độ khớp lệnh gấp 100 lần giờ trưa. Lấy mẫu theo nến thời gian tạo ra phân phối biến động dị phương sai (heteroskedastic) và đuôi cực béo (fat tails).
  - **Information-Driven Bars:**
    1. *Volume Bars:* Cắt nến mỗi khi tích lũy đủ $V_{\text{threshold}}$ khối lượng.
    2. *Dollar Turnover Bars:* $T_k = \inf \{ t : \sum_{i} p_i v_i \ge D_{\text{threshold}} \}$. Chuẩn hóa phân phối lợi suất về dạng chuẩn Gaussian, loại bỏ hiện tượng biến động dồn cụm.
    3. *Tick Imbalance Bars (TIB):* $\theta_T = \sum_{t=1}^T b_t$ với $b_t = \text{sign}(\Delta p_t)$. Cắt nến khi mất cân bằng tích lũy vượt kỳ vọng động $E[T]|2P(b=1)-1|$, bắt trọn các pha tích tụ thông tin của phe mua/bán.
* **Cạm bẫy & Giải pháp:**
  - *Cạm bẫy:* Giữ nguyên nến thời gian lịch khiến các mô hình ML bị đánh lừa bởi dữ liệu có mật độ thông tin thấp (low information density).
  - *Quy chuẩn:* 100% pipeline phải chuyển đổi dòng tick thành Information Bars trước khi tính toán đặc trưng.

---

### MẮT XÍCH 2: TÍNH DỪNG BẢO TOÀN BỘ NHỚ (FRACTIONAL CALCULUS & STATIONARITY)
* **Tác phẩm tham chiếu:**
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - Ch. 5
  - *Modern Time Series Forecasting with Python* (Manu Joseph)
  - *Financial Theory with Python* (Yves Hilpisch)
* **Nguyên lý nền tảng:**
  - **Nghịch lý Stationarity vs. Memory:** Sai phân nguyên bậc $d=1$ khử toàn bộ nghiệm đơn vị nhưng xóa sạch bộ nhớ dài hạn (long memory) và các mức cân bằng giá vĩ mô. Giá gốc $d=0$ giữ nguyên bộ nhớ nhưng không dừng, gây hiện tượng tương quan giả (spurious correlation).
  - **Toán học Vi phân Bậc phân số (Fractional Differencing):**
    $$(1-B)^d = \sum_{k=0}^\infty \omega_k B^k, \quad \omega_0 = 1, \quad \omega_k = -\omega_{k-1} \frac{d - k + 1}{k}$$
  - **Bài toán tối ưu tìm $d^*$:**
    $$d^* = \arg\min_{d \in [0, 1]} \left\{ d : \text{ADF}_{\text{stat}}\left( (1-B)^d \log(P) \right) \le \tau_{1\%} \right\}$$
* **Trích xuất cốt lõi:**
  - Với đa số tài sản tài chính (Crypto, Equities, FX), $d^* \approx 0.35 - 0.45$.
  - Chuỗi $(1-B)^{d^*} P$ vừa đạt tính dừng hoàn toàn ($p \le 0.01$), vừa bảo tồn **$>75\%$** tương quan với giá gốc.

---

### MẮT XÍCH 3: VI CẤU TRÚC THỊ TRƯỜNG & LÝ THUYẾT ĐẤU GIÁ (MICROSTRUCTURE & AUCTION THEORY)
* **Tác phẩm tham chiếu:**
  - *Financial Markets and Trading* (Peter Harris & Anatoly Schmidt)
  - *Mind Over Markets* (James F. Dalton) - Auction Market Theory
  - *Trading Systems and Methods* (Perry J. Kaufman) - Efficiency Ratio
  - *Trading Options Greeks* (Dan Passarelli) - Volatility Skew & Smile
* **Nguyên lý nền tảng:**
  - **Order Flow Imbalance (OFI):** Biến động lượng đặt mua/bán ở Best Bid / Best Ask:
    $$\text{OFI}_t = I_{\{p_t^b \ge p_{t-1}^b\}} q_t^b - I_{\{p_t^b \le p_{t-1}^b\}} q_{t-1}^b - I_{\{p_t^a \le p_{t-1}^a\}} q_t^a + I_{\{p_t^a \ge p_{t-1}^a\}} q_{t-1}^a$$
  - **Kaufman Efficiency Ratio (ER):** Đo lường tỷ số giữa khoảng cách dịch chuyển thẳng và tổng quãng đường nhiễu động:
    $$\text{ER}_t = \frac{|P_t - P_{t-N}|}{\sum_{i=0}^{N-1} |P_{t-i} - P_{t-i-1}|} \in [0, 1]$$
    $ER \to 1$: Xu hướng siêu mượt; $ER \to 0$: Thị trường nhiễu loạn đi ngang (Chop).
  - **Auction Market Theory (AMT):**
    - *POC (Point of Control):* Mức giá có khối lượng giao dịch tích lũy lớn nhất.
    - *Value Area [VAL, VAH]:* Vùng giá chứa 70% tổng khối lượng phiên.
    - *Hành vi:* Khi giá thoát khỏi Value Area nhưng không có khối lượng chủ động (Initiating Volume) ủng hộ, giá có xác suất đảo chiều về POC $>68\%$.

---

### MẮT XÍCH 4: NHẬN DIỆN CHẾ ĐỘ THỊ TRƯỜNG BAYESIAN (REGIME DETECTION)
* **Tác phẩm tham chiếu:**
  - *Probabilistic Machine Learning for Finance and Investing* (Deepak Kanungo)
  - *Machine Learning for Trading* (Stefan Jansen) - Causal & Regime Conditioning
  - *Pattern Recognition and Machine Learning* (Christopher Bishop)
* **Nguyên lý nền tảng:**
  - **Sticky Hierarchical Dirichlet Process HMM (HDP-HMM):**
    Thị trường luân chuyển giữa các trạng thái ngầm (Latent Regimes): *LowVol Bull, HighVol Expansion, MeanReverting Chop, Liquidity Stress*.
    Tham số bám dính $\kappa > 0$ trong phân phối Dirichlet tiên nghiệm $\pi_i \sim \text{Dirichlet}(\alpha_0 \beta + \kappa \delta_i)$ ngăn chặn hiện tượng nhảy trạng thái liên tục (regime chattering).
  - **Entropy Trạng thái ($\mathcal{H}_{\text{regime}}$):**
    $$\mathcal{H}_t = -\sum_{k=1}^K \gamma_t(k) \log_2 \gamma_t(k)$$
    Khi Entropy cao ($\mathcal{H}_t > 0.85$), mô hình đang đối mặt với sự nhập nhằng trạng thái $\implies$ Lập tức giảm quy mô vị thế.

---

### MẮT XÍCH 5: TẠO VÀ TRỰC GIAO HÓA TÍN HIỆU ALPHA (ALPHA ORTHOGONALIZATION)
* **Tác phẩm tham chiếu:**
  - *Quantitative Portfolio Management* (Michael Isichenko) - Factor Models & Orthogonalization
  - *Algorithmic Trading* (Ernie Chan) - Statistical Arbitrage & Cointegration
  - *Machine Learning and Data Science Blueprints for Finance* (Hariom Tatsat)
* **Nguyên lý nền tảng:**
  - **Hiện tượng Đa cộng tuyến (Multicollinearity) làm sụp đổ Alpha:** Khi đưa nhiều chỉ báo/tín hiệu có tương quan cao vào mô hình, trọng số hồi quy bị mất ổn định và khuếch đại sai số ngoài mẫu.
  - **Symmetric Löwdin Orthogonalization:**
    Biến đổi tập tín hiệu $\mathbf{F} \in \mathbb{R}^{N \times M}$ thành $\mathbf{F}^\perp$:
    $$\mathbf{F}^\perp = \mathbf{V} \mathbf{\Lambda}^{-\frac{1}{2}} \mathbf{V}^T \mathbf{F}$$
    Triệt tiêu 100% tương quan chéo giữa các alpha factor ($\text{Cov}(\mathbf{F}^\perp) = \mathbf{I}_M$) nhưng giữ khoảng cách biến dạng Frobenius nhỏ nhất so với định nghĩa ban đầu của từng factor.

---

### MẮT XÍCH 6: GẮN NHÃN TRIPLE BARRIER & CONFORMAL META-LABELING
* **Tác phẩm tham chiếu:**
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - Ch. 3
  - *Probabilistic Machine Learning for Finance* (Deepak Kanungo) - Uncertainty Quantification
  - *Modern Time Series Forecasting with Python* (Manu Joseph) - Conformal Prediction
* **Nguyên lý nền tảng:**
  - **Triple Barrier Labeling:** Thay vì cố định khung thời gian (Fixed-time horizon) làm biến dạng kết quả do biến động thay đổi, đặt 3 rào cản động:
    1. Rào cản chốt lời: $P_0 (1 + u \cdot \sigma_t)$
    2. Rào cản cắt lỗ: $P_0 (1 - l \cdot \sigma_t)$
    3. Rào cản thời gian: $t_0 + H$ bars.
  - **Phân tách Độ bất định (Uncertainty Decomposition):**
    Meta-Learner ước lượng:
    - *Aleatoric Uncertainty:* $\sigma^2_{\text{alea}} = \bar{p}(1 - \bar{p})$ (nhiễu thị trường ngẫu nhiên).
    - *Epistemic Uncertainty:* $\sigma^2_{\text{epi}} = \frac{1}{B} \sum_{b=1}^B (p_b - \bar{p})^2$ (độ bất đồng giữa các cây/mô hình ensemble do thiếu dữ liệu ở vùng thị trường lạ).

---

### MẮT XÍCH 7: TỐI ƯU HÓA DANH MỤC HIERARCHICAL RISK PARITY (HRP)
* **Tác phẩm tham chiếu:**
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - Ch. 16
  - *Quantitative Portfolio Management* (Michael Isichenko) - Covariance Shrinkage
  - *Risk Management and Financial Institutions* (John C. Hull)
* **Nguyên lý nền tảng:**
  - **Thất bại của Markowitz Mean-Variance Optimization:** Phép nghịch đảo ma trận hiệp phương sai $\Sigma^{-1}$ cực kỳ nhạy cảm với sai số ước lượng (ill-conditioned matrix), dẫn đến danh mục tập trung quá mức và sụp đổ khi ma trận tương quan thay đổi.
  - **Hierarchical Risk Parity (HRP) 3 bước:**
    1. *Tree Clustering:* Dùng ma trận khoảng cách tương quan $d_{ij} = \sqrt{\frac{1}{2}(1 - \rho_{ij})}$ để lập cây phân cụm (Dendrogram).
    2. *Quasi-Diagonalization:* Sắp xếp lại các hàng/cột của ma trận hiệp phương sai Ledoit-Wolf thu nhỏ sao cho các tài sản có liên hệ chặt chẽ nằm liền kề nhau.
    3. *Recursive Bisection:* Phân bổ tỷ trọng đệ quy theo nghịch đảo phương sai cụm $V_k = \mathbf{w}_k^T \hat{\Sigma}_k \mathbf{w}_k$, hoàn toàn không cần đảo ma trận hiệp phương sai.

---

### MẮT XÍCH 8: ĐỊNH CỠ VỊ THẾ CHIẾT KHẤU ĐỘ BẤT ĐỊNH (BET SIZING)
* **Tác phẩm tham chiếu:**
  - *Quantitative Trading* (Ernie Chan) - Kelly Criterion
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - Bet Sizing
  - *Novel Hypothesis H2* (AETHER-QUANT)
* **Nguyên lý nền tảng:**
  - **Epistemic-Penalized Kelly Formulation:**
    $$s_t = \text{sign}(\alpha_t) \cdot w_{i, \text{HRP}}^* \cdot \max\left(0, \frac{\bar{p}_t (b+1) - 1}{b}\right) \cdot \exp\left(-\lambda_{epi} \frac{\sigma^2_{epi}(X_t)}{\bar{\sigma}^2_{epi}}\right) \cdot \min\left(2.0, \frac{\text{ER}_t}{\overline{\text{ER}}}\right)$$
  - *Cơ chế tự vệ:* Nếu mô hình dự báo xác suất thắng cao ($\bar{p} = 0.75$) nhưng độ bất định Epistemic tăng vọt do thị trường rơi vào khủng hoảng thanh khoản chưa từng có tiền lệ, hệ số $e^{-\lambda \sigma^2_{epi}}$ sẽ ép quy mô lệnh về 0, bảo vệ tài khoản khỏi các cú sập bất ngờ.

---

### MẮT XÍCH 9: THI CÔNG KHỚP LỆNH TỐI ƯU & QUẢN TRỊ TỒN KHO (OPTIMAL EXECUTION)
* **Tác phẩm tham chiếu:**
  - *Algorithmic and High-Frequency Trading* (Álvaro Cartea & Sebastian Jaimungal)
  - *Optimal Execution of Portfolio Transactions* (Robert Almgren & Neil Chriss)
  - *Developing High-Frequency Trading Systems* (Donadio & Ghosh)
* **Nguyên lý nền tảng:**
  - **Hệ phương trình Hamilton-Jacobi-Bellman (HJB):**
    Tốc độ giao dịch tối ưu liên tục $\nu_t^* = \dot{q}_t$ thỏa mãn:
    $$\nu_t^* = -\zeta \frac{\cosh(\zeta(T-t))}{\sinh(\zeta(T-t))} (q_t - Q^*), \quad \text{với } \zeta = \sqrt{\frac{\phi}{\kappa}}$$
    trong đó $\phi$ là hệ số sợ rủi ro nắm giữ tồn kho (inventory risk aversion) và $\kappa$ là hệ số tác động giá tạm thời.
  - **Mô hình Ma sát Vi mô:**
    $$\text{Slippage} = \frac{1}{2}\text{Spread} + Y \cdot \sigma_{\text{daily}} \sqrt{\frac{V_{\text{order}}}{V_{\text{daily}}}} + \text{Exchange Fee} + \text{Latency Delay (50ms)}$$

---

### MẮT XÍCH 10: QUẢN TRỊ RỦI RO ĐUÔI BÉO & GIÁM SÁT THÍCH ỨNG (RISK & MONITORING)
* **Tác phẩm tham chiếu:**
  - *Risk Management and Financial Institutions* (John C. Hull) - Extreme Value Theory (EVT)
  - *Machine Learning for Financial Risk Management* (Abdullah Karasan) - ML VaR/CVaR
  - *Advances in Financial Machine Learning* (Marcos López de Prado) - CUSUM Drift & DSR
* **Nguyên lý nền tảng:**
  - **Peaks-Over-Threshold (POT) Generalized Pareto Distribution (GPD):**
    Mô hình hóa các khoản lỗ vượt ngưỡng $u$ để ước tính đuôi phân phối thực tế:
    $$\text{VaR}_\alpha = u + \frac{\beta}{\xi} \left( \left( \frac{N}{N_u}(1-\alpha) \right)^{-\xi} - 1 \right), \quad \text{CVaR}_\alpha = \frac{\text{VaR}_\alpha + \beta - \xi u}{1 - \xi}$$
  - **Bộ lọc CUSUM hai phía đối xứng (Concept Drift Monitor):**
    $$S_t^+ = \max(0, S_{t-1}^+ + e_t - \bar{e}), \quad S_t^- = \min(0, S_{t-1}^- + e_t - \bar{e})$$
    Khi $\max(S_t^+, -S_t^-) \ge h_{\text{drift}}$, hệ thống phát hiện cấu trúc thị trường bị bẻ gãy $\implies$ Kích hoạt tái huấn luyện tham số Bayesian HMM và Meta-Learner theo cơ chế Online Learning.

---

## 🛡️ MA TRẬN PHÒNG CHỐNG OVERFITTING & KIỂM CHỨNG KHÔNG RÒ RỈ DỮ LIỆU

| Rủi ro / Định kiến (Bias) | Cơ chế Gây sai lệch | Giải pháp Khắc phục Triệt để của AETHER-QUANT |
| :--- | :--- | :--- |
| **Look-Ahead Bias** | Dùng thông tin tương lai trong tính toán | Lấy mẫu Fractional Diff có cửa sổ cố định; chuẩn hóa z-score chỉ dùng dữ liệu quá khứ. |
| **Data Leakage in CV** | Nhãn Triple Barrier vắt qua các Fold thử nghiệm | **Purged & Embargoed Cross-Validation (PE-CV)**: Xóa toàn bộ mẫu train giao thoa và thêm vùng cấm Embargo $1.5\times$ thời gian nắm giữ. |
| **Selection Bias / Multiple Testing** | Chạy 1,000 backtest rồi chỉ chọn đường đẹp nhất | **Deflated Sharpe Ratio (DSR)**: Trừ đi kỳ vọng cực đại của Sharpe Ratio dưới giả thuyết vô hiệu $\mathbb{E}[\max \text{SR}]$ dựa trên số lần thử nghiệm $N$. |
| **Data Snooping / Path Dependency** | Chiến lược chỉ ăn khớp trên một đường lịch sử duy nhất | **Combinatorial Purged Cross-Validation (CPCV)**: Đánh giá phân phối Sharpe Ratio trên tất cả $\binom{N}{k}$ tổ hợp đường đi Out-of-Sample. |
| **Execution Idealization** | Giả định khớp lệnh 0 phí, 0 trượt giá | Tích hợp **Mô hình tác động căn bậc hai (Square-root law)**, phí sàn $2.5\text{ bps}$, trượt giá nửa spread và độ trễ khớp lệnh $50\text{ms}$. |

---

## 🔗 ÁNH XẠ TỪ TRI THỨC SÁCH ĐẾN GÓI MÃ NGUỒN (CODEBASE MAPPING)

| Mắt xích Tri thức | Tác phẩm Nền tảng | Tệp Triển khai trong `strategies/aether_quant/` | Lớp / Hàm Cốt lõi |
| :--- | :--- | :--- | :--- |
| **Lấy mẫu nến thông tin** | de Prado (AFML Ch. 2) | [`data_structures.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/data_structures.py) | `create_dollar_bars`, `create_tick_imbalance_bars` |
| **Vi phân bậc phân số** | de Prado (AFML Ch. 5) | [`data_structures.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/data_structures.py) | `find_optimal_d`, `frac_diff_ffd` |
| **Đặc trưng vi cấu trúc** | Harris, Dalton, Kaufman | [`microstructure_features.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/microstructure_features.py) | `compute_order_flow_imbalance`, `compute_kaufman_er`, `compute_auction_value_area` |
| **Nhận diện Regime** | Kanungo, Murphy, Bishop | [`regime_engine.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/regime_engine.py) | `BayesianRegimeDetector`, `BayesianChangePointDetector` |
| **Trực giao hóa Alpha** | Isichenko (QPM Ch. 3), Chan | [`alpha_engine.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/alpha_engine.py) | `symmetric_lowdin_orthogonalization`, `CompositeRegimeAlphaCombiner` |
| **Conformal Meta-Labeling** | de Prado (AFML Ch. 3), Kanungo | [`meta_labeling.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/meta_labeling.py) | `apply_triple_barrier`, `BayesianConformalMetaLearner` |
| **Phân bổ danh mục HRP** | de Prado (AFML Ch. 16), Hull | [`portfolio_allocator.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/portfolio_allocator.py) | `HierarchicalRiskParity`, `ledoit_wolf_shrinkage` |
| **Định cỡ vị thế Epistemic** | Chan, de Prado, Hypothesis H2 | [`bet_sizing.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/bet_sizing.py) | `UncertaintyPenalizedKellySizer` |
| **Thi công khớp lệnh HJB** | Cartea & Jaimungal, Almgren | [`execution_engine.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/execution_engine.py) | `CarteaJaimungalExecutor`, `MicrostructureFrictionSimulator` |
| **Quản trị rủi ro đuôi béo** | Hull, Karasan | [`risk_engine.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/risk_engine.py) | `ExtremeValueCVaR`, `TieredCircuitBreaker` |
| **Giám sát thích ứng Online** | de Prado, Jansen | [`online_monitor.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/online_monitor.py) | `SymmetricCUSUMDetector`, `AlphaDecayTracker` |
| **Khung kiểm chứng CPCV** | de Prado, Bailey, Benjamini | [`validation_framework.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/validation_framework.py) | `CombinatorialPurgedCrossValidation`, `compute_deflated_sharpe_ratio` |
| **Hệ thống điều phối tích hợp** | Tổng hợp 10 Tầng | [`pipeline.py`](file:///d:/01-vibeTrading/vibe-trading/strategies/aether_quant/pipeline.py) | `AetherQuantEngine` |
