# 🚀 HƯỚNG DẪN THỰC CHIẾN GIAO DỊCH VÀ KHAI THÁC HỆ THỐNG
*Cẩm nang vận hành Tín hiệu Sớm, Chỉ báo TradingView và Khai thác Kho Tri thức Định lượng*

---

## 🎯 PHẦN 1: CÀI ĐẶT CHỈ BÁO VÀO TRADINGVIEW (CHỈ 10 GIÂY)

Chỉ báo **`Vibe Alpha Leading Edge` (Pine Script v6)** đã được lập trình sẵn và lưu tại:
📁 `agent/src/skills/pine-script/vibe_alpha_leading_indicator.pine`

### 📌 Các bước thực hiện:
1. **Mở TradingView**: Truy cập [tradingview.com](https://www.tradingview.com) và mở biểu đồ của bất kỳ cặp tiền, coin hoặc cổ phiếu nào (ví dụ: `BTCUSDT`, `ETHUSDT`, `SPY`, `NVDA`, `XAUUSD`, `EURUSD`).
2. **Mở Pine Editor**: Ở thanh công cụ dưới cùng của màn hình TradingView, click vào tab **`Pine Editor`**.
3. **Copy Code**: Mở file [`vibe_alpha_leading_indicator.pine`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/skills/pine-script/vibe_alpha_leading_indicator.pine), copy toàn bộ nội dung và dán vào Pine Editor (thay thế mã mẫu mặc định).
4. **Lưu & Thêm vào biểu đồ**:
   - Click nút **`Save`** (đặt tên: `Vibe Alpha Leading`).
   - Click nút **`Add to chart`** (Thêm vào biểu đồ).

---

## 📊 PHẦN 2: CÁCH ĐỌC TÍN HIỆU VÀ GIAO DỊCH TRỰC TIẾP TRÊN BIỂU ĐỒ

Khi chỉ báo được thêm vào biểu đồ, bạn sẽ thấy toàn bộ thông tin xuất hiện trực quan:

```
                  ┌──────────────────────────────────────────────┐
                  │ 🚀 VIBE ALPHA HUD                 STATUS     │
                  ├──────────────────────────────────────────────┤
                  │ Market Regime                BULLISH TREND   │
                  │ Efficiency (ER)              0.68 (Clean)    │
                  │ Momentum (RSI/MFI)           58.4            │
                  │ Volatility (ATR)             42.50           │
                  │ Active Signal                🟢 LONG / BUY   │
                  └──────────────────────────────────────────────┘

        [Candlestick Chart]
              │
          ┌───┴───┐
          │  BAR  │
          └───┬───┘
              │
      🟢 BUY / LONG
      Entry: 65,420.00
      SL: 64,800.00
      (Trailing Stop Line ───────────)
```

### 1. Ý nghĩa các Icon và Badge trên biểu đồ:
* 🟢 **Badge `BUY / LONG` (Màu xanh lá)**: Tín hiệu Mua đảo chiều hoặc Breakout sớm kèm theo mức giá **Entry** và mức **Stop Loss (SL)** tính toán tự động theo độ biến động ATR.
* 🔴 **Badge `SELL / SHORT` (Màu đỏ)**: Tín hiệu Bán/Short kèm theo mức giá **Entry** và **Stop Loss (SL)**.
* 🔹 **Tam giác Cyan/Cam**: Đánh dấu hiện tượng **Liquidity Sweep (Quét thanh khoản)** của các tổ chức tài chính trước khi giá đảo chiều mạnh.
* 🟩/🟥 **Hộp Vùng Fair Value Gap (FVG)**: Các vùng mất cân bằng cung cầu của Big Boys.
* 📈 **Đường KAMA Adaptive Trend**: Đổi màu xanh lá khi thị trường có xu hướng tăng mạnh, màu đỏ khi có xu hướng giảm mạnh, và màu xám/hổ phách khi thị trường đi ngang hỗn loạn (Chop).
* 📋 **Bảng HUD Dashboard ở góc trên bên phải**: Cập nhật trạng thái thị trường Real-time từng giây.

### 2. Chiến lược Quản lý vốn theo Chuẩn Tổ chức (Money Management):
* **Stop Loss (SL)**: Luôn đặt lệnh SL theo đúng mức hiển thị trên nhãn tín hiệu.
* **Take Profit 1 (TP1)**: Chốt lời $50\%$ khối lượng khi đạt $1.5 \times R$ (sau đó dời SL về điểm hòa vốn Break-Even).
* **Take Profit 2 (TP2)**: Chốt lời $30\%$ khối lượng tiếp theo khi đạt $2.5 \times R$.
* **Phần còn lại (20%)**: Thả trôi theo đường **Dynamic Trailing Stop** đến khi có tín hiệu đảo chiều.

---

## 🔔 PHẦN 3: CÀI ĐẶT THÔNG BÁO TỰ ĐỘNG (WEBHOOK / TELEGRAM / DISCORD)

Không cần phải ngồi canh màn hình hay mở Web App liên tục:
1. Trên TradingView, click chuột phải vào biểu đồ $\to$ chọn **`Add Alert`** (Thêm cảnh báo).
2. Tại mục **Condition** (Điều kiện), chọn **`Vibe Alpha Leading`**.
3. Chọn điều kiện:
   - `🟢 Vibe Alpha BUY Signal` (cho cảnh báo Mua).
   - `🔴 Vibe Alpha SELL Signal` (cho cảnh báo Bán).
4. Tại tab **Notifications**, bạn có thể:
   - Bật thông báo đẩy về ứng dụng điện thoại TradingView (Send to app).
   - Bật Webhook URL (bắn JSON payload về máy chủ Vibe-Trading hoặc Telegram Bot để tự động khớp lệnh).

---

## 📡 PHẦN 4: CHẠY BỘ QUÉT THỊ TRƯỜNG REAL-TIME TRÊN MÁY TÍNH

Bạn có thể kích hoạt bộ quét đa tài sản tự động bằng lệnh:

```powershell
python scripts/run_scanner.py
```

Bộ scanner sẽ rà soát đồng thời hàng loạt tài sản (Crypto, US Stocks, Vàng, Ngoại hối), tính toán Kaufman ER, Phân kỳ động lượng, và in ra bảng tổng hợp tín hiệu tức thì.

---

## 🧠 PHẦN 5: CÁCH KHAI THÁC KHO TRI THỨC 21 CUỐN SÁCH KHI LÀM VIỆC & CODE

Khi bạn muốn kiểm tra kiến thức lý thuyết, nghiên cứu ý tưởng chiến lược mới, hoặc đảm bảo code tuân thủ các quy tắc định lượng:

1. **Xem Mục lục toàn bộ 21 cuốn sách**:
   - File: [`agent/src/knowledge/KNOWLEDGE_BASE_CATALOG.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/KNOWLEDGE_BASE_CATALOG.md)
2. **Đọc 6 Thẻ Tri thức Cốt lõi (Quant Knowledge Cards)**:
   - 🧠 [`01_machine_learning_rigor.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/01_machine_learning_rigor.md): Triple Barrier, Meta-labeling, Purged CV (de Prado).
   - ⚡ [`02_adaptive_trading_systems.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/02_adaptive_trading_systems.md): Kaufman ER, KAMA, Cointegration Stat-Arb (Kaufman, Ernie Chan).
   - 🔬 [`03_microstructure_and_orderflow.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/03_microstructure_and_orderflow.md): Sổ lệnh Limit Order Book, Liquidity Sweeps, FVG, VPIN.
   - 🛡️ [`04_risk_and_money_management.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/04_risk_and_money_management.md): Kelly Criterion, VaR/CVaR, Dynamic ATR Sizing (John Hull).
   - 📈 [`05_options_derivatives_greeks.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/05_options_derivatives_greeks.md): Options Greeks, Delta Neutral, Implied Volatility Surface.
   - 🌐 [`06_llm_and_alternative_data.md`](file:///c:/Users/TMS/Desktop/Workspace/04_Coding/vibe-coding/Vibe-Trading/agent/src/knowledge/06_llm_and_alternative_data.md): Financial NLP, Tone Surprise, Macro Quadrants.
3. **Sử dụng Công cụ Tra cứu Tự động (`KnowledgeHub`)**:
   ```python
   from src.knowledge.knowledge_hub import KnowledgeHub

   hub = KnowledgeHub()
   # Tra cứu bất kỳ khái niệm nào:
   results = hub.search("Kaufman Efficiency Ratio")
   # Lấy checklist kiểm tra tính chặt chẽ của chiến lược:
   checklist = hub.get_strategy_grounding_checklist()
   ```
