# 📜 NHẬT KÝ PHÁT TRIỂN & LỊCH SỬ CÁC YÊU CẦU DỰ ÁN (DEVELOPMENT CHANGELOG)

> **Tài liệu lưu trữ toàn bộ lịch sử yêu cầu của người dùng và các đợt cập nhật tính năng/mã nguồn.**  
> **Vị trí lưu trữ:** `docs/process/01_DEVELOPMENT_CHANGELOG_&_HISTORY.md`

---

## 1. TỔNG QUAN HÀNH TRÌNH PHÁT TRIỂN

Dự án **Vibe-Trading** được phát triển theo định hướng là một nền tảng giao dịch định lượng hiện đại, kết hợp giữa tốc độ, độ chính xác của phân tích định lượng vi cấu trúc thị trường (Quantitative Microstructure) với khả năng suy luận logic của LLM và kết nối trực tiếp đến sàn giao dịch Binance Futures (cả môi trường Testnet Demo và Mainnet Live).

---

## 2. LỊCH SỬ CÁC ĐỢT PHÁT TRIỂN & YÊU CẦU CỤ THỂ

### Đợt 1: Khởi tạo Nền tảng & Kiến trúc Kết nối Binance Futures
* **Yêu cầu & Mục tiêu**:
  - Xây dựng hệ thống giao dịch phái sinh Crypto kết nối Binance USD-M Futures.
  - Hỗ trợ cả 2 chế độ: **Testnet (Demo)** và **Live Trading (Mainnet)**.
  - Tích hợp cơ chế ký số bảo mật WebCrypto HMAC-SHA256 trực tiếp trên trình duyệt cùng Backend Proxy fallback.
* **Kết quả thực hiện**:
  - Xây dựng `src/lib/futuresApi.ts` và `src/lib/binanceFuturesStore.ts` với đầy đủ tính năng xác thực API Key, kiểm tra số dư ví, lấy danh sách vị thế mở (`positionRisk`), đặt lệnh thị trường có kèm Stop Loss / Take Profit (`Bracket Order`), và đóng vị thế khẩn cấp.

---

### Đợt 2: Tái cấu trúc Dashboard Tracker sang Giao diện Terminal Cô đọng
* **Yêu cầu của User**:
  - Không dàn trải nội dung thừa thãi, tối ưu không gian màn hình để quan sát được toàn bộ thông tin quan trọng mà không cần cuộn trang.
* **Kết quả thực hiện**:
  - Chia bố cục Dashboard thành 2 nửa màn hình (Top Half 55% & Bottom Half 45%):
    - **Nửa trên**: Bên trái là thẻ đặt lệnh `NewOrderCard` kèm Radar; bên phải là 2 thẻ xếp chồng: `BotActivityLogCard` (Nhật ký bot) và `OrdersPositionsCard` (Vị thế mở).
    - **Nửa dưới**: Bên trái là biểu đồ đường cong vốn `EquityCurveCard`; bên phải là bảng lịch sử lệnh `TradeHistoryCard`.

---

### Đợt 3: Phát triển Thẻ Đặt Lệnh & Top Bullish Tokens Radar
* **Yêu cầu của User**:
  - *"Không cần quá nhiều thông tin như vậy, chỉ cần TOP BULLISH TOKENS RADAR (ví dụ: SOLUSDT [LONG], NEARUSDT [SHORT])"*.
  - *"Bỏ Cancel \| Place Order ở dưới cùng. Dời vị trí UI đặt lệnh, top bullish lên trên không để center. Cho top bullish token dài ra để hiển thị đủ 10 token vì là Top 10"*.
* **Kết quả thực hiện**:
  - Loại bỏ các nút hủy và nút đặt lệnh nằm ở mép đáy gây lãng phí diện tích.
  - Tích hợp nút **`Place Order`** trực tiếp ngay dưới thanh trượt Đòn bẩy (Leverage Slider).
  - Tích hợp **Top Bullish Tokens Radar (Top 10)**: Tự động quét 10 token USDT-M có đà tăng trưởng và volume cao nhất sàn, hỗ trợ **1-Click Auto-Fill** (nhấn vào token là tự động điền Token, Giá hiện tại, Stop Loss, TP1, TP2, TP3 tính theo ATR và chọn phe LONG/SHORT).
  - Mở rộng khung chứa Radar thành `flex-1 min-h-0 overflow-y-auto` giúp hiển thị đầy đủ 10 token mượt mà không bị che khuất.

---

### Đợt 4: Căn chỉnh Lưới Grid 5 Hàng & Xóa bỏ Khoảng trống Thừa
* **Yêu cầu của User**:
  - *"Tại sao token vẫn bị che mất?"*
  - *"Tôi thấy khu vực màu đỏ UI có vấn đề bạn hãy xem lại và report cho tôi xem để tôi coi bạn có hiểu đúng ý tôi không"*.
  - *"Sửa lại"*.
* **Kết quả thực hiện**:
  - Phân tích nguyên nhân: Việc dùng `justify-between` khiến form bên trái và radar bên phải bị kéo giãn không đều, tạo khoảng trống rỗng ở giữa.
  - Chuyển đổi sang kiến trúc **Row-by-Row 5-Row Compact Grid**:
    - Hàng 1: Search Token Input $\leftrightarrow$ Top Bullish Radar Header.
    - Hàng 2: Token Name & Entry Price $\leftrightarrow$ Token 1 & 2.
    - Hàng 3: Direction Buttons & SL Price $\leftrightarrow$ Token 3 & 4.
    - Hàng 4: TP Targets & Position Size $\leftrightarrow$ Token 5 & 6.
    - Hàng 5: Leverage Slider, Margin Type & Place Order $\leftrightarrow$ Token 7 đến 10.
  - Xóa bỏ hoàn toàn khoảng trống tím/đỏ thừa, giao diện phẳng, khít và cực kỳ chuyên nghiệp.

---

### Đợt 5: Rà soát Toàn diện Chế độ LIVE / DEMO, Bot Trading & Số dư Ví
* **Yêu cầu của User**:
  - *"Hãy rà soát lại cho tôi 2 chế độ LIVE và DEMO này khi chuyển qua thì nó có thật mà dùng api đúng vị trí không? Rà soát xem coi còn tính năng Bot trading không? Xem balance và available balance có đúng không?"*
* **Kết quả thực hiện**:
  - Rà soát luồng API: Chế độ DEMO (Testnet) gọi chính xác đến `testnet.binancefuture.com` (proxy `/binance-testnet`), chế độ LIVE gọi chính xác đến `fapi.binance.com` (proxy `/binance-mainnet`).
  - Kiểm tra Bot Trading: Module quét tự động 10s/lần trong `Tracker.tsx` vẫn hoạt động tốt, tự động tính toán Setup Score (yêu cầu $\ge 80$), đồng pha xu hướng 1H và tự động mở lệnh.
  - Kiểm tra Số dư: Đồng bộ trực tiếp `walletBalance` và `availableBalance` từ API `/fapi/v2/account`, hiển thị dynamic label *"Testnet Balance"* vs *"Live Balance"*.

---

### Đợt 6: Phát triển Master Killswitch "System ON / System OFF"
* **Yêu cầu của User**:
  - *"Tôi muốn trong Position có thêm tính năng tắt api call từ phía bên Binance nữa coi như mọi thứ không còn hoạt động đặt tên là System OFF --> System ON. Tooltip giải thích sao cho User dễ hiểu và không quá dài, tuyệt đối không hard code"*.
* **Kết quả thực hiện**:
  - Bổ sung `isSystemActive: boolean`, `toggleSystemActive()` trong `binanceFuturesStore.ts`.
  - Thêm các key dịch thuật đa ngôn ngữ (`systemOn`, `systemOff`, `systemTooltip`) vào toàn bộ 8 file ngôn ngữ (`en`, `vi`, `zh-CN`, `ja`, `ko`, `ar`, `es`, `de`), cam kết không hardcode.
  - Khi tắt sang `System OFF`, hệ thống ngắt toàn bộ interval gọi ngầm, chặn các cuộc gọi đặt lệnh và đóng vị thế.

---

### Đợt 7: Khắc phục PnL Real-time & Thu gọn Chiều rộng Layout (Constrained Width)
* **Yêu cầu của User**:
  - *"Tại sao Order Position đang trade bên binance demo có thấy nhưng bên hệ thống chúng ta không có thấy PnL là sao?"*
  - *"Hiện tại UI đang sử dụng full-width nên nội dung trải dài toàn bộ viewport. Tôi muốn đưa layout về trạng thái constrained width như lúc trước: nội dung chỉ nằm trong một container có max-width, được căn giữa màn hình và có khoảng cách hai bên"*.
* **Kết quả thực hiện**:
  - **Khắc phục PnL**: Kết nối trực tiếp `OrdersPositionsCard` với `useBinanceFuturesStore.livePositions`, map trường `unRealizedProfit` được trả về từ Binance API sau mỗi 5s. Các con số PnL (+0.28 USDT, +1.25 USDT, -1.08 USDT) nhảy real-time màu xanh/đỏ chính xác 100% như trên sàn.
  - **Khắc phục Chiều rộng**: Bọc `Tracker.tsx` trong `max-w-[1600px] mx-auto w-full px-3 sm:px-5 lg:px-6`, đưa giao diện về trạng thái căn giữa cân đối, thanh lịch.

---

### Đợt 8: Di chuyển "System ON / OFF" lên Header Cạnh Tiêu Đề Bot Monitor
* **Yêu cầu của User**:
  - *"Cho System On qua phía như trong hình cho tôi"* (kèm ảnh chỉ mũi tên đỏ từ Positions Card lên Header góc trái).
* **Kết quả thực hiện**:
  - Di chuyển nút `System ON / System OFF` lên `DashboardHeader.tsx` ngay cạnh tiêu đề `Bot Monitor (Bot Dashboard - Account Overview)`.
  - Gỡ bỏ nút thừa khỏi `OrdersPositionsCard.tsx` để bảng vị thế hoàn toàn tinh gọn.

---

### Đợt 9: Đồng bộ "System ON / OFF" trên Trang Chart & Watchlist và Thiết lập Cổng Chặn Mạng
* **Yêu cầu của User**:
  - *"Tôi muốn thêm system on vào vị trí như trong hình ở page Chart và Page Watch List. Tính năng System ON/OFF này khi click vào thì toàn bộ hệ thống ở mọi nơi có liên quan đến binance api đều bị ngắt"*.
* **Kết quả thực hiện**:
  - Đặt nút `System ON/OFF` ở thanh công cụ trên cùng trang `LiveChart.tsx` (cạnh dải quick tags) và trang `Screener.tsx` (cạnh ô tìm kiếm / filter).
  - Tích hợp **Central Network Gate Interceptor** (`isSystemKilled()`) trong `futuresApi.ts` và `binance.ts`: Khi `System OFF`, 100% request HTTP `fetch`, kết nối WebSocket, và các vòng lặp polling quét giá đều bị chặn ngay tại cửa ra trình duyệt.

---

### Đợt 10: Nghiên cứu, Hệ thống hóa 21 Sách Finance & Trading cho Bot LLM
* **Yêu cầu của User**:
  - Rà soát toàn bộ 21 sách trong `KnowledgeBase/Finance & Trading`, trích xuất kiến trúc định lượng, schema dữ liệu, cơ chế logging và active learning loop cho Bot Trading LLM.
* **Kết quả thực hiện**:
  - Hoàn thành bản thiết kế chi tiết tại `docs/process/LLM_QUANT_TRADING_KNOWLEDGE_ARCHITECTURE.md`.
