# 🏛️ TỔNG QUAN KIẾN TRÚC HỆ THỐNG & CÁC TÍNH NĂNG HIỆN TẠI (SYSTEM ARCHITECTURE & FEATURES)

> **Tài liệu đặc tả toàn bộ kiến trúc frontend, luồng dữ liệu, quản lý trạng thái và tính năng của nền tảng Vibe-Trading.**  
> **Vị trí lưu trữ:** `docs/process/02_SYSTEM_ARCHITECTURE_&_CURRENT_FEATURES.md`

---

## 1. CÁC MÀN HÌNH CHÍNH (UI PAGES & MODULES)

```
                                  VIBE-TRADING APPLICATION
  ┌──────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. TRACKER (DASHBOARD)     │ • Bot Monitor Header (Live/Demo, Balances, System ON/OFF)   │
  │                            │ • New Order Form + Top 10 Bullish Tokens Radar (1-Click)     │
  │                            │ • Bot Activity Monospace Terminal Log                       │
  │                            │ • Orders / Open Positions Card (Real-time PnL & Direct Close)│
  │                            │ • Win-Loss Equity Curve Area Chart & Trade History Stream    │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 2. LIVE CHARTS             │ • ECharts Interactive Candlesticks (5m/1h MTF)              │
  │                            │ • KAMA Adaptive Moving Average & Structure Trailing Stop    │
  │                            │ • Quick Token Chips + System ON/OFF Control                 │
  │                            │ • Sub-second Real-time WebSocket Kline Stream               │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 3. WATCHLIST (SCREENER)    │ • Multi-Timeframe Quant Scanner (6 Filter Modes)            │
  │                            │ • 0-100 Setup Scoring, Strategy Signals & Entry Reasons     │
  │                            │ • Quick Watchlist Toggles & Direct Chart Navigation         │
  ├────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ 4. SETTINGS & DOCS         │ • Binance Futures API Credentials Management (Test/Live)   │
  │                            │ • System Documentation & Quant Guides                       │
  └──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG MODULE TRỌNG YẾU

### 2.1. Module Dashboard Header (`src/components/dashboard/DashboardHeader.tsx`)
* **Branding & Master Killswitch**:
  - Tiêu đề `Bot Monitor (Bot Dashboard - Account Overview)`.
  - Nút **`System ON / System OFF`** đặt ngay cạnh tiêu đề với icon Power và tooltip giải thích đa ngôn ngữ.
* **Bộ điều khiển & Quản lý chế độ (Mode Switcher)**:
  - **`Bot Trading: ON / OFF`**: Bật/tắt tiến trình bot tự động quét và mở lệnh ngầm.
  - **`Testnet Mode` vs `Live Trading`**: Chuyển đổi môi trường Binance Testnet (Demo) và Binance Mainnet (Live).
* **Dải hiển thị số dư ví (Balance Strip)**:
  - Hiển thị nhãn động `Testnet Balance` hoặc `Live Balance` theo số dư thực tế từ Binance.
  - Hiển thị `Available Balance` (Số dư khả dụng để mở thêm vị thế).
* **Thanh cảnh báo trạng thái môi trường (Environment Status Banner)**:
  - Banner xanh cho Testnet và banner đỏ cảnh báo cho Live Trading kèm liên kết nhanh đến cài đặt API Keys.

---

### 2.2. Module Đặt Lệnh & Top Bullish Radar (`src/components/dashboard/NewOrderCard.tsx`)
* **Kiến trúc Lưới Grid 5 Hàng (Row-by-Row Alignment)**:
  - Phân chia cân xứng tuyệt đối giữa Form đặt lệnh bên trái và Bảng Radar bên phải.
* **Form Đặt Lệnh Trực Tiếp (Left Column)**:
  - Tìm kiếm và chọn nhanh các cặp coin chính (`BTC, ETH, SOL, NEAR, FTM, DOGE`).
  - Ô nhập Token, Giá Entry, Nút chọn `LONG` (xanh) / `SHORT` (đỏ).
  - Tự động tính toán mức **Stop Loss (SL)** và **3 mức Take Profit (TP1, TP2, TP3)** theo biên độ biến động ATR thực tế.
  - Bộ chọn quy mô vị thế (Preset: `TINY`, `SMALL`, `MEDIUM`, `LARGE`).
  - Thanh trượt điều chỉnh Đòn bẩy (`Leverage Slider` từ 1x đến 100x).
  - Nút **`Place Order`** nổi bật đặt ngay dưới thanh trượt đòn bẩy, cho phép gửi lệnh trực tiếp lên sàn Binance.
* **Top 10 Bullish Tokens Radar (Right Column)**:
  - Quét thời gian thực 10 đồng tiền có động lượng tăng trưởng mạnh nhất sàn.
  - Hiển thị Symbol và tag `[LONG]` / `[SHORT]`.
  - **Tính năng 1-Click Auto-Fill**: Bấm vào bất kỳ token nào trên Radar sẽ ngay lập tức tự động điền toàn bộ thông số (Tên token, Giá entry, SL, TP1, TP2, TP3 tính toán chuẩn ATR) vào Form đặt lệnh.

---

### 2.3. Module Bảng Vị Thế Mở (`src/components/dashboard/OrdersPositionsCard.tsx`)
* **Đồng bộ PnL Thời Gian Thực từ Binance (`livePositions`)**:
  - Đọc trực tiếp trường `unRealizedProfit` do Binance API `/fapi/v2/positionRisk` trả về sau mỗi 5 giây.
  - Hiển thị chính xác các con số lãi/lỗ thời gian thực (ví dụ: `+$0.28`, `+$1.25`, `-$1.08`) với màu xanh/đỏ chuẩn xác.
* **Thông tin chi tiết trên từng dòng**:
  - `Symbol`: Tên cặp giao dịch (ví dụ: `XRPUSDT`, `BTCUSDT`).
  - `Type`: Loại vị thế (`Long` xanh hoặc `Short` đỏ kèm icon xu hướng).
  - `Size`: Khối lượng vị thế thực tế theo coin.
  - `Entry`: Mức giá vào lệnh ban đầu.
  - `PnL`: Lãi/lỗ chưa thực hiện nhảy số thời gian thực.
  - **Nút Đóng Vị Thế Nhanh (`X`)**: Gửi lệnh Market đối ứng trực tiếp lên Binance để đóng vị thế và chốt lời/lỗ ngay lập tức.

---

### 2.4. Module Bot Trading Tự Động (`src/pages/Tracker.tsx`)
* **Bộ quét nền tự động (Background Scanner)**:
  - Chạy chu kỳ quét 10 giây/lần khi `autoTradingEnabled === true` và `isSystemActive === true`.
  - Quét 10 token có khối lượng giao dịch USDT lớn nhất.
  - Lấy nến đa khung thời gian (5m và 1h) để tính toán **Setup Score (0 - 100)**.
  - Khi Setup Score $\ge 80$ và có tín hiệu đồng pha xu hướng 1H (Bullish/Bearish Trend Confluence), bot sẽ tự động đặt lệnh `Bracket Order` với đòn bẩy và tỷ lệ vốn quy định, đồng thời ghi log chi tiết vào bảng nhật ký.

---

### 2.5. Cơ Chế Cổng Chặn Mạng Master Killswitch ("System ON / System OFF")
* **Vị trí tích hợp**: Xuất hiện đồng bộ trên cả 3 trang chính:
  1. **Dashboard Tracker**: Cạnh tiêu đề `Bot Monitor`.
  2. **Trang LiveChart**: Cạnh dải tag chọn nhanh token (`BTC, ETH, SOL...`).
  3. **Trang Watchlist / Screener**: Cạnh ô tìm kiếm và nút làm mới.
* **Cơ chế Cổng Chặn Mạng Trung Tâm (`futuresApi.ts` & `binance.ts`)**:
  - Khi chuyển sang **`System OFF` (Đỏ nhấp nháy)**:
    1. Chặn 100% mọi request `fetch` ký HMAC và public API gửi đến máy chủ Binance (`fapi.binance.com` & `testnet.binancefuture.com`).
    2. Ngắt kết nối `WebSocket` stream nến và dừng toàn bộ các vòng lặp polling quét giá ngầm.
    3. Khóa toàn bộ các nút đặt lệnh và ngắt tiến trình chạy ngầm của Bot Auto-Trading để bảo vệ an toàn tài khoản tuyệt đối.
  - Khi bật lại **`System ON` (Xanh)**: Hệ thống tái kích hoạt các dịch vụ kết nối bình thường.

---

## 3. QUẢN LÝ TRẠNG THÁI TOÀN CỤC (STATE MANAGEMENT)

| Store Zustand | File Định Nghĩa | Nhiệm vụ & Dữ liệu quản lý |
| :--- | :--- | :--- |
| **`useBinanceFuturesStore`** | `src/lib/binanceFuturesStore.ts` | Quản lý API Key/Secret (Testnet & Mainnet), chế độ `activeMode`, số dư `liveBalance` & `availableBalance`, danh sách vị thế mở `livePositions`, cờ Master Killswitch `isSystemActive`, cấu hình Bot Auto-Trading (`autoTradingEnabled`, `marginPerTradeUsd`, `defaultLeverage`, `minSetupScore`). |
| **`useTrackerStore`** | `src/lib/trackerStore.ts` | Quản lý danh sách các lệnh giao dịch nội bộ (`activeTrades`) và lịch sử các lệnh đã đóng (`tradeHistory`). |
| **`useWatchlistStore`** | `src/lib/watchlistStore.ts` | Quản lý danh sách các đồng coin yêu thích trong Watchlist. |
| **`useThemeDark`** | `src/lib/theme-store.ts` | Quản lý giao diện sáng/tối (Dark / Light mode). |
