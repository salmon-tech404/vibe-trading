# 📐 QUY CHUẨN THIẾT KẾ & TIÊU CHUẨN KỸ THUẬT DỰ ÁN (DESIGN RULES & STANDARDS)

> **Tài liệu quy định các nguyên tắc thiết kế giao diện, quy chuẩn đa ngôn ngữ và tiêu chuẩn lập trình bắt buộc phải tuân thủ trong dự án Vibe-Trading.**  
> **Vị trí lưu trữ:** `docs/process/03_DESIGN_RULES_&_TECHNICAL_STANDARDS.md`

---

## 1. NGUYÊN TẮC THIẾT KẾ GIAO DIỆN (UI/UX DESIGN RULES)

### 1.1. Bố Cục Căn Giữa Giới Hạn Chiều Rộng (Constrained Width Layout)
* **Quy tắc**: Tuyệt đối **không để giao diện trải dài 100% full-width** trên các màn hình máy tính kích thước lớn (gây loãng mắt, khó quan sát tổng thể).
* **Quy chuẩn Tailwind**:
  ```tsx
  <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
    {/* Khung container giới hạn độ rộng căn giữa */}
    <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col p-2.5 sm:p-3.5 space-y-2.5 min-h-0 overflow-hidden">
      {/* Nội dung Dashboard */}
    </div>
  </div>
  ```
* **Lợi ích**: Tạo ra 2 khoảng đệm lề (margins) cân xứng, giúp toàn bộ nội dung terminal được gom gọn gàng vào vùng tập trung tầm nhìn của trader.

---

### 1.2. Căn Chỉnh Lưới Lệnh Grid 5 Hàng (Row-by-Row Alignment)
* **Quy tắc**: Không sử dụng `justify-between` hoặc các lớp CSS tạo khoảng giãn cách tự do khi kết hợp Form đặt lệnh với Bảng Top Bullish Radar.
* **Cấu trúc 5 Hàng Cân Xứng**:
  - Hàng 1: Search Token Input $\longleftrightarrow$ Tiêu đề Top Bullish Tokens Radar.
  - Hàng 2: Token Symbol & Entry Price $\longleftrightarrow$ Token 1 & Token 2.
  - Hàng 3: Direction (Long/Short) & Stop Loss $\longleftrightarrow$ Token 3 & Token 4.
  - Hàng 4: TP Targets & Position Size Presets $\longleftrightarrow$ Token 5 & Token 6.
  - Hàng 5: Leverage Slider, Margin Type & Place Order Button $\longleftrightarrow$ Token 7, 8, 9, 10.
* **Xử lý Cuộn & Tràn Chiều Cao**:
  - Khung Radar phải dùng `flex-1 min-h-0 overflow-y-auto` để hiển thị đủ 10 token mà không bị che khuất hay tạo khoảng trống thừa ở chân thẻ.

---

### 1.3. Bảng Màu Tiêu Chuẩn Trong Giao Dịch
* **Xanh lá (`emerald-500` / `emerald-600`)**: Dành cho vị thế `LONG`, trạng thái có lãi (`+PnL`), chế độ `Testnet Mode`, và trạng thái kích hoạt `System ON`.
* **Đỏ (`rose-500` / `rose-600`)**: Dành cho vị thế `SHORT`, trạng thái thua lỗ (`-PnL`), chế độ `Live Trading`, và trạng thái ngắt kết nối `System OFF` (kèm hiệu ứng nhấp nháy `animate-pulse`).
* **Vàng/Cam (`amber-500` / `orange-500`)**: Dành cho các mức `Take Profit`, cảnh báo rủi ro, và các vị thế Hòa vốn (`Break-Even`).

---

## 2. QUY CHUẨN ĐA NGÔN NGỮ & VĂN BẢN (i18n RULES)

### 2.1. Nghiêm Cấm Hardcode Text
* **Quy tắc bất biến**: **Tuyệt đối không viết text cứng (tiếng Anh hoặc tiếng Việt) trực tiếp trong các file component JSX/TSX**.
* **Cơ chế**: Mọi nhãn, tiêu đề, tooltip, thông báo lỗi, văn bản giải thích đều phải được định nghĩa thông qua hook `useTranslation()`:
  ```tsx
  // ĐÚNG:
  <span>{isSystemActive ? t("dashboard.systemOn") : t("dashboard.systemOff")}</span>
  
  // SAI:
  <span>{isSystemActive ? "System ON" : "System OFF"}</span>
  ```

### 2.2. Đồng Bộ Đầy Đủ 8 Ngôn Ngữ
Mọi key mới bổ sung phải được cập nhật đồng thời trong toàn bộ 8 file dịch thuật tại `src/i18n/locales/`:
1. `en.json` (Tiếng Anh)
2. `vi.json` (Tiếng Việt)
3. `zh-CN.json` (Tiếng Trung giản thể)
4. `ja.json` (Tiếng Nhật)
5. `ko.json` (Tiếng Hàn)
6. `ar.json` (Tiếng Ả Rập)
7. `es.json` (Tiếng Tây Ban Nha)
8. `de.json` (Tiếng Đức)

---

## 3. TIÊU CHUẨN KỸ THUẬT & AN TOÀN HỆ THỐNG (SECURITY & TECHNICAL STANDARDS)

### 3.1. Bảo Mật API Keys & Ký Số Trực Tiếp
* **Lưu trữ bảo mật**: API Key và Secret Key được lưu trữ cục bộ trong LocalStorage của trình duyệt (`vibe-binance-futures-v2`), tuyệt đối không gửi lên bất kỳ server bên thứ ba nào.
* **Ký số WebCrypto HMAC-SHA256**: Sử dụng API mã hóa WebCrypto gốc của trình duyệt (`crypto.subtle`) để ký chuỗi truy vấn với độ trễ cực thấp và độ an toàn tuyệt đối.

### 3.2. Cổng Chặn Mạng Trung Tâm (Network Interceptor Gate)
* Khi `isSystemActive === false` (`System OFF`):
  - Hàm kiểm tra `isSystemKilled()` chặn ngay từ cửa ra của `fetch` và `WebSocket`.
  - Không có bất kỳ gói tin mạng nào được gửi ra ngoài internet đến máy chủ Binance, đảm bảo an toàn tuyệt đối khi người dùng muốn ngắt kết nối hệ thống tạm thời.

---

## 4. QUY TRÌNH KIỂM THỬ VÀ ĐÓNG GÓI (CI/CD STANDARDS)
* Sau mỗi lần chỉnh sửa mã nguồn, bắt buộc phải vượt qua:
  1. **TypeScript Typecheck**: `tsc -b` không phát sinh bất kỳ lỗi kiểu dữ liệu nào.
  2. **Vite Build**: `npm run build` hoàn thành đóng gói thành công 100%.
  3. **Vitest Suite**: `npx vitest run` kiểm tra và duy trì tỷ lệ vượt qua toàn bộ 58 file test của dự án.
