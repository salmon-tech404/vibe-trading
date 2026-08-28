import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Search,
  ShieldCheck,
  Sparkles,
  Bot,
  AlertTriangle,
  BarChart2,
  Power,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

// Code block language tab types
type CodeLang = "typescript" | "python" | "curl";
type OsTab = "unix" | "windows";

interface NavSubItem {
  id: string;
  label: string;
}

interface NavCategory {
  id: string;
  title: string;
  items: NavSubItem[];
}

// 6 Main Categories in 100% Pure Vietnamese
const DOC_CATEGORIES: NavCategory[] = [
  {
    id: "getting-started",
    title: "Hướng dẫn bắt đầu",
    items: [
      { id: "quickstart", label: "Khởi động nhanh" },
      { id: "system-architecture", label: "Tổng quan hệ thống" },
      { id: "trading-lifecycle", label: "Chu trình vận hành chuẩn" },
    ],
  },
  {
    id: "technical-charts",
    title: "Sổ tay biểu đồ kỹ thuật",
    items: [
      { id: "chart-candlestick", label: "Cấu trúc nến và dữ liệu giá" },
      { id: "chart-indicators", label: "Chỉ báo KAMA và chặn lỗ cấu trúc" },
      { id: "chart-signals", label: "Ký hiệu tín hiệu mua bán và chốt lời" },
      { id: "chart-exit-tiers", label: "Đường mốc chốt lời và hòa vốn" },
      { id: "chart-controls", label: "Thanh công cụ và trạng thái hệ thống" },
    ],
  },
  {
    id: "radar-screener",
    title: "Danh sách theo dõi và radar tín hiệu",
    items: [
      { id: "screener-filters", label: "Bộ lọc phân loại thị trường" },
      { id: "screener-scoring", label: "Thang điểm chất lượng cơ hội" },
      { id: "screener-confluence", label: "Đồng thuận đa khung và chỉ số Kaufman" },
    ],
  },
  {
    id: "positions-tracker",
    title: "Quản lý vị thế và bảng điều khiển",
    items: [
      { id: "tracker-account", label: "Chỉ số tài khoản và dừng khẩn cấp" },
      { id: "tracker-order-placement", label: "Đặt lệnh một chạm kèm bảo vệ vốn" },
      { id: "tracker-active-positions", label: "Bảng quản lý vị thế đang mở" },
      { id: "tracker-bot-automation", label: "Vận hành bot tự động và tăng trưởng vốn" },
    ],
  },
  {
    id: "strategy-lab",
    title: "Phòng nghiên cứu chiến lược và nhật ký trí tuệ nhân tạo",
    items: [
      { id: "strategy-catalog", label: "Danh mục chiến lược định lượng" },
      { id: "strategy-live-reasoning", label: "Luận điểm phân tích thời gian thực" },
      { id: "strategy-reflections", label: "Nhật ký tự phản tư sau giao dịch" },
    ],
  },
  {
    id: "system-settings",
    title: "Cài đặt và quản trị hệ thống",
    items: [
      { id: "settings-binance-api", label: "Kết nối sàn giao dịch thử nghiệm và thực tế" },
      { id: "settings-llm-ai", label: "Cấu hình mô hình trí tuệ nhân tạo" },
      { id: "settings-risk-bot", label: "Tham số quản trị rủi ro và bot tự động" },
      { id: "settings-profile-theme", label: "Cá nhân hóa hồ sơ và giao diện" },
    ],
  },
];

// Table of contents for the right sidebar (On This Page)
const TABLE_OF_CONTENTS: Record<string, { id: string; label: string }[]> = {
  quickstart: [
    { id: "qs-intro", label: "1. Giới thiệu tổng quan" },
    { id: "qs-api-setup", label: "2. Cấu hình khóa kết nối API" },
    { id: "qs-demo-testnet", label: "3. Kiểm thử với môi trường thử nghiệm" },
    { id: "qs-code-sample", label: "4. Mẫu mã nguồn đặt lệnh đầu tiên" },
  ],
  "system-architecture": [
    { id: "sa-overview", label: "1. Kiến trúc phân hệ thiết bị đầu cuối" },
    { id: "sa-components", label: "2. Năm màn hình chức năng cốt lõi" },
    { id: "sa-security", label: "3. Cơ chế bảo mật lưu trữ cục bộ" },
  ],
  "trading-lifecycle": [
    { id: "tl-steps", label: "1. Quy trình giao dịch năm bước" },
    { id: "tl-confluence-rule", label: "2. Nguyên tắc đồng thuận bắt buộc" },
    { id: "tl-capital-protection", label: "3. Tự động hóa bảo vệ vốn" },
  ],
  "chart-candlestick": [
    { id: "cc-candlestick", label: "1. Biểu đồ nến Nhật và màu sắc" },
    { id: "cc-tooltip", label: "2. Hộp thông tin giá khi rê chuột" },
    { id: "cc-volume", label: "3. Cột khối lượng giao dịch bên dưới" },
  ],
  "chart-indicators": [
    { id: "ci-kama", label: "1. Đường trung bình động thích ứng KAMA" },
    { id: "ci-trailing", label: "2. Đường chặn lỗ cấu trúc động" },
    { id: "ci-synergy", label: "3. Phối hợp KAMA và chặn lỗ cấu trúc" },
  ],
  "chart-signals": [
    { id: "cs-buy-triangle", label: "1. Tam giác xanh hướng lên kèm điểm số" },
    { id: "cs-sell-triangle", label: "2. Tam giác đỏ hướng xuống" },
    { id: "cs-take-profit-diamond", label: "3. Hình thoi kim cương vàng" },
  ],
  "chart-exit-tiers": [
    { id: "ce-tp1", label: "1. Đường nét đứt xanh lá chốt lời 1.5R" },
    { id: "ce-be", label: "2. Đường nét đứt vàng cam hòa vốn" },
    { id: "ce-engine", label: "3. Cơ chế thoát lệnh bốn tầng tự động" },
  ],
  "chart-controls": [
    { id: "ct-power-button", label: "1. Nút bật tắt hệ thống" },
    { id: "ct-timeframes", label: "2. Bộ chọn khung thời gian" },
    { id: "ct-hud-metrics", label: "3. Thanh thông tin xu hướng và điểm số" },
    { id: "ct-history-pan", label: "4. Thanh trượt phóng to và tải thêm lịch sử" },
  ],
  "screener-filters": [
    { id: "sf-modes", label: "1. Các chế độ lọc thị trường" },
    { id: "sf-search-watchlist", label: "2. Tìm kiếm và quản lý danh sách yêu thích" },
    { id: "sf-realtime-scan", label: "3. Tần suất quét tín hiệu thời gian thực" },
  ],
  "screener-scoring": [
    { id: "ss-weights", label: "1. Bảng trọng số chấm điểm 0 đến 100" },
    { id: "ss-tiers", label: "2. Ba phân loại chất lượng cơ hội" },
    { id: "ss-exit-tier-column", label: "3. Cột tầng thoát lệnh của từng mã" },
  ],
  "screener-confluence": [
    { id: "sc-multi-tf", label: "1. Nguyên tắc đồng thuận khung 5 phút và 1 giờ" },
    { id: "sc-kaufman-er", label: "2. Chỉ số hiệu quả Kaufman và nhận diện vùng giá" },
    { id: "sc-filter-noise", label: "3. Cơ chế loại bỏ bẫy giá đi ngang" },
  ],
  "tracker-account": [
    { id: "ta-metrics", label: "1. Bốn chỉ số tài khoản quan trọng" },
    { id: "ta-kill-switch", label: "2. Nút dừng khẩn cấp toàn hệ thống" },
    { id: "ta-sync-status", label: "3. Đồng bộ dữ liệu tài khoản với sàn" },
  ],
  "tracker-order-placement": [
    { id: "to-bracket", label: "1. Cấu trúc lệnh một chạm kèm dừng lỗ chốt lời" },
    { id: "to-inputs", label: "2. Chọn đòn bẩy và nhập mức ký quỹ" },
    { id: "to-auto-calc", label: "3. Tự động tính toán điểm vào và thoát lệnh" },
  ],
  "tracker-active-positions": [
    { id: "tp-table-cols", label: "1. Các cột thông số trong bảng vị thế mở" },
    { id: "tp-close-position", label: "2. Nút đóng vị thế tức thì theo giá thị trường" },
    { id: "tp-risk-ratio", label: "3. Kiểm soát tỷ lệ ký quỹ và giá thanh lý" },
  ],
  "tracker-bot-automation": [
    { id: "tb-switch", label: "1. Công tắc kích hoạt bot tự động" },
    { id: "tb-rules", label: "2. Điều kiện mở vị thế và giới hạn an toàn" },
    { id: "tb-logs-equity", label: "3. Nhật ký hoạt động bot và biểu đồ tăng trưởng vốn" },
  ],
  "strategy-catalog": [
    { id: "st-core-strats", label: "1. Ba chiến lược định lượng cốt lõi" },
    { id: "st-kama-pullback", label: "2. Chiến lược hồi quy xu hướng KAMA" },
    { id: "st-liquidity-sweep", label: "3. Chiến lược quét thanh khoản đảo chiều" },
    { id: "st-mean-reversion", label: "4. Chiến lược hồi quy dải Bollinger và phân kỳ RSI" },
  ],
  "strategy-live-reasoning": [
    { id: "sr-ai-engine", label: "1. Cơ chế lập luận thời gian thực của AI" },
    { id: "sr-market-regime", label: "2. Phân loại trạng thái thị trường theo Kaufman" },
    { id: "sr-signals-stream", label: "3. Dòng suy luận trực tiếp theo từng cặp tiền" },
  ],
  "strategy-reflections": [
    { id: "sf-post-trade", label: "1. Quy trình tự phản tư sau khi đóng lệnh" },
    { id: "sf-disciplines", label: "2. Đánh giá tuân thủ quy tắc và bài học kinh nghiệm" },
    { id: "sf-filter-search", label: "3. Tra cứu lịch sử phản tư theo kết quả thắng thua" },
  ],
  "settings-binance-api": [
    { id: "sb-dual-env", label: "1. Hai môi trường thử nghiệm và thực tế độc lập" },
    { id: "sb-keys-input", label: "2. Nhập và kiểm tra kết nối API Key" },
    { id: "sb-no-withdraw", label: "3. Nguyên tắc an toàn không cấp quyền rút tiền" },
  ],
  "settings-llm-ai": [
    { id: "sl-providers", label: "1. Bốn nhà cung cấp mô hình trí tuệ nhân tạo" },
    { id: "sl-model-presets", label: "2. Danh sách mô hình gợi ý theo từng mục đích" },
    { id: "sl-params", label: "3. Tùy chỉnh nhiệt độ, thời gian chờ và độ sâu suy luận" },
  ],
  "settings-risk-bot": [
    { id: "srb-capital-trade", label: "1. Cấu hình số vốn ký quỹ trên mỗi lệnh" },
    { id: "srb-max-positions", label: "2. Giới hạn số vị thế mở đồng thời" },
    { id: "srb-min-score", label: "3. Ngưỡng điểm chất lượng tối thiểu cho bot" },
  ],
  "settings-profile-theme": [
    { id: "sp-name-sound", label: "1. Tên định danh và âm thanh cảnh báo tín hiệu" },
    { id: "sp-dark-light", label: "2. Chuyển đổi chế độ giao diện sáng tối" },
    { id: "sp-storage-sync", label: "3. Cơ chế lưu trữ cấu hình an toàn trên trình duyệt" },
  ],
};

export function Docs() {
  const [activeSection, setActiveSection] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("getting-started");

  // Code Block interactive tabs
  const [codeLang, setCodeLang] = useState<CodeLang>("typescript");
  const [osTab, setOsTab] = useState<OsTab>("unix");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    toast.success("Đã sao chép vào bộ nhớ tạm");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const currentToc = useMemo(() => {
    return TABLE_OF_CONTENTS[activeSection] || TABLE_OF_CONTENTS["quickstart"];
  }, [activeSection]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return DOC_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => item.label.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  // Sync active category tab when clicking sub-items
  const handleSelectSection = (itemId: string) => {
    setActiveSection(itemId);
    const parentCat = DOC_CATEGORIES.find((cat) => cat.items.some((it) => it.id === itemId));
    if (parentCat) {
      setActiveCategoryTab(parentCat.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP SUB-HEADER (OpenAI Platform Style Minimalist Bar) */}
      {/* ========================================================================= */}
      <div className="border-b border-border/60 bg-card/60 backdrop-blur shrink-0 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          {/* Breadcrumb title */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono shrink-0">
            <span className="text-foreground font-semibold">Tài liệu</span>
            <span>/</span>
            <span className="text-primary font-medium">Hệ thống và kiến trúc</span>
          </div>

          {/* Category Navigation Quick Buttons */}
          <div className="flex items-center gap-1 text-xs">
            {DOC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryTab(cat.id);
                  if (cat.items.length > 0) {
                    setActiveSection(cat.items[0].id);
                  }
                }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  activeCategoryTab === cat.id
                    ? "bg-muted text-foreground font-semibold border border-border/60"
                    : "text-muted-foreground hover:text-foreground font-normal"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar with Quick Filter */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1 text-xs rounded-lg border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-border"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/60">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE-COLUMN DOCUMENTATION VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
        {/* ======================================================================= */}
        <aside className="w-72 border-e border-border/60 bg-card/30 overflow-y-auto shrink-0 p-3 space-y-6 hidden md:block">
          {filteredCategories.map((category) => (
            <div key={category.id} className="space-y-1.5">
              <div className="text-xs font-semibold text-foreground px-2.5 py-1">
                {category.title}
              </div>

              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSection(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                        isActive
                          ? "bg-muted text-foreground font-semibold border border-border/60 shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-normal"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ======================================================================= */}
        {/* MIDDLE COLUMN: MAIN DOCUMENTATION CONTENT */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-10 max-w-4xl mx-auto text-foreground/90">
          
          {/* ===================================================================== */}
          {/* SECTION 1: KHỞI ĐỘNG NHANH */}
          {/* ===================================================================== */}
          {activeSection === "quickstart" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Hướng dẫn bắt đầu</span>
                  <span>/</span>
                  <span className="text-foreground">Khởi động nhanh</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Hướng dẫn bắt đầu nhanh
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Thiết lập hệ thống, kết nối sàn giao dịch thử nghiệm và thực thi chu trình phân tích định lượng đầu tiên.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card/60 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Môi trường thử nghiệm an toàn</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hệ thống tích hợp sẵn chế độ thử nghiệm với số dư ảo để kiểm tra tính năng đặt lệnh và bot tự động mà không ảnh hưởng vốn thật.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectSection("settings-binance-api")}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition cursor-pointer shrink-0"
                >
                  Xem cài đặt kết nối
                </button>
              </div>

              <div id="qs-intro" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Giới thiệu tổng quan</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Alpha Terminal là hệ thống giao dịch định lượng thế hệ mới tích hợp thuật toán phân tích đa khung thời gian 5 phút và 1 giờ, tự động tính toán điểm vào lệnh tối ưu, thiết lập cơ cấu dừng lỗ chốt lời bốn tầng và hỗ trợ bot tự động vận hành liên tục.
                </p>
              </div>

              <div id="qs-api-setup" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Cấu hình khóa kết nối API</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Để lấy khóa kết nối thử nghiệm miễn phí từ sàn: đăng nhập vào sàn giao dịch, chọn mục giao dịch thử nghiệm, tạo khóa kết nối mới và sao chép khóa định danh cùng khóa bí mật vào màn hình Cài đặt.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1 border-b border-border/60 pb-1">
                    <button
                      type="button"
                      onClick={() => setOsTab("unix")}
                      className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                        osTab === "unix" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      Hệ điều hành macOS hoặc Linux
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsTab("windows")}
                      className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                        osTab === "windows" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      Hệ điều hành Windows
                    </button>
                  </div>

                  <div className="relative rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          osTab === "unix"
                            ? 'export BINANCE_API_KEY="khoa_api_cua_ban"\nexport BINANCE_API_SECRET="khoa_bi_mat_cua_ban"'
                            : '$env:BINANCE_API_KEY="khoa_api_cua_ban"\n$env:BINANCE_API_SECRET="khoa_bi_mat_cua_ban"',
                          "env-copy"
                        )
                      }
                      className="absolute top-2.5 right-2.5 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedCodeId === "env-copy" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-foreground leading-relaxed">
                      {osTab === "unix" ? (
                        <>
                          <span className="text-muted-foreground">1</span>  export BINANCE_API_KEY=<span className="text-emerald-500">"khoa_api_cua_ban"</span>
                          {"\n"}
                          <span className="text-muted-foreground">2</span>  export BINANCE_API_SECRET=<span className="text-emerald-500">"khoa_bi_mat_cua_ban"</span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">1</span>  $env:BINANCE_API_KEY = <span className="text-emerald-500">"khoa_api_cua_ban"</span>
                          {"\n"}
                          <span className="text-muted-foreground">2</span>  $env:BINANCE_API_SECRET = <span className="text-emerald-500">"khoa_bi_mat_cua_ban"</span>
                        </>
                      )}
                    </pre>
                  </div>
                </div>
              </div>

              <div id="qs-demo-testnet" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Kiểm thử với môi trường thử nghiệm</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tại màn hình Cài đặt, bạn có thể chuyển đổi linh hoạt giữa chế độ thử nghiệm và chế độ thực tế. Hệ thống quản lý cấu hình và trạng thái kết nối độc lập giữa hai môi trường để đảm bảo độ an toàn cao nhất.
                </p>
              </div>

              <div id="qs-code-sample" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">4. Mẫu mã nguồn đặt lệnh đầu tiên</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Đoạn mã mẫu minh họa việc khởi tạo lệnh mua kèm dừng lỗ và chốt lời tự động qua giao diện lập trình:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1 border-b border-border/60 pb-1">
                    <button
                      type="button"
                      onClick={() => setCodeLang("typescript")}
                      className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                        codeLang === "typescript" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      TypeScript
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeLang("python")}
                      className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                        codeLang === "python" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      Python
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeLang("curl")}
                      className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                        codeLang === "curl" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      cURL
                    </button>
                  </div>

                  <div className="relative rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          codeLang === "typescript"
                            ? `import { placeLiveOrder } from "@/lib/binanceFuturesStore";\n\nconst order = await placeLiveOrder({\n  symbol: "BTCUSDT",\n  side: "BUY",\n  quantity: 0.05,\n  stopLoss: 94200,\n  takeProfit: 98500,\n  leverage: 10,\n});`
                            : codeLang === "python"
                            ? `import requests\n\nresponse = requests.post(\n    "https://fapi.binance.com/fapi/v1/order",\n    json={"symbol": "BTCUSDT", "side": "BUY", "type": "MARKET", "quantity": 0.05},\n    headers={"X-MBX-APIKEY": api_key}\n)`
                            : `curl -X POST "https://fapi.binance.com/fapi/v1/order" \\\n  -H "X-MBX-APIKEY: $BINANCE_API_KEY" \\\n  -d "symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.05"`,
                          "qs-sdk-copy"
                        )
                      }
                      className="absolute top-2.5 right-2.5 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                      title="Sao chép"
                    >
                      {copiedCodeId === "qs-sdk-copy" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <pre className="text-foreground leading-relaxed">
                      {codeLang === "typescript" && (
                        <>
                          <span className="text-muted-foreground">1</span>  <span className="text-purple-400">import</span> {"{ placeLiveOrder }"} <span className="text-purple-400">from</span> <span className="text-emerald-500">"@/lib/binanceFuturesStore"</span>;{"\n"}
                          <span className="text-muted-foreground">2</span>  {"\n"}
                          <span className="text-muted-foreground">3</span>  <span className="text-blue-400">const</span> ketQua = <span className="text-purple-400">await</span> <span className="text-amber-400">placeLiveOrder</span>({"{\n"}
                          <span className="text-muted-foreground">4</span>    symbol: <span className="text-emerald-500">"BTCUSDT"</span>,{"\n"}
                          <span className="text-muted-foreground">5</span>    side: <span className="text-emerald-500">"BUY"</span>,{"\n"}
                          <span className="text-muted-foreground">6</span>    quantity: <span className="text-cyan-400">0.05</span>,{"\n"}
                          <span className="text-muted-foreground">7</span>    stopLoss: <span className="text-rose-400">94200</span>,{"\n"}
                          <span className="text-muted-foreground">8</span>    takeProfit: <span className="text-emerald-400">98500</span>,{"\n"}
                          <span className="text-muted-foreground">9</span>    leverage: <span className="text-cyan-400">10</span>,{"\n"}
                          <span className="text-muted-foreground">10</span> {"}"});
                        </>
                      )}
                      {codeLang === "python" && (
                        <>
                          <span className="text-muted-foreground">1</span>  <span className="text-purple-400">import</span> requests{"\n"}
                          <span className="text-muted-foreground">2</span>  {"\n"}
                          <span className="text-muted-foreground">3</span>  phan_hoi = requests.<span className="text-amber-400">post</span>({" \n"}
                          <span className="text-muted-foreground">4</span>      <span className="text-emerald-500">"https://fapi.binance.com/fapi/v1/order"</span>,{"\n"}
                          <span className="text-muted-foreground">5</span>      json={"{"}<span className="text-emerald-500">"symbol"</span>: <span className="text-emerald-500">"BTCUSDT"</span>, <span className="text-emerald-500">"side"</span>: <span className="text-emerald-500">"BUY"</span>, <span className="text-emerald-500">"quantity"</span>: <span className="text-cyan-400">0.05</span>{"}"},{"\n"}
                          <span className="text-muted-foreground">6</span>      headers={"{"}<span className="text-emerald-500">"X-MBX-APIKEY"</span>: api_key{"}"}{"\n"}
                          <span className="text-muted-foreground">7</span>  )
                        </>
                      )}
                      {codeLang === "curl" && (
                        <>
                          <span className="text-muted-foreground">1</span>  curl -X POST <span className="text-emerald-500">"https://fapi.binance.com/fapi/v1/order"</span> \{"\n"}
                          <span className="text-muted-foreground">2</span>    -H <span className="text-cyan-400">"X-MBX-APIKEY: $BINANCE_API_KEY"</span> \{"\n"}
                          <span className="text-muted-foreground">3</span>    -d <span className="text-emerald-500">"symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.05"</span>
                        </>
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 2: TỔNG QUAN HỆ THỐNG */}
          {/* ===================================================================== */}
          {activeSection === "system-architecture" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Hướng dẫn bắt đầu</span>
                  <span>/</span>
                  <span className="text-foreground">Tổng quan hệ thống</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Tổng quan hệ thống
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cấu trúc các phân hệ chức năng và nguyên tắc vận hành an toàn của Alpha Terminal.
                </p>
              </div>

              <div id="sa-overview" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Kiến trúc phân hệ thiết bị đầu cuối</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Alpha Terminal được thiết kế dạng mô-đun hóa, phân tách rõ ràng giữa lớp giao diện trực quan, lớp thuật toán tính toán định lượng phía máy khách, lớp lưu trữ cấu hình trình duyệt và lớp kết nối dữ liệu thời gian thực qua giao thức mạng trực tiếp.
                </p>
              </div>

              <div id="sa-components" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Năm màn hình chức năng cốt lõi</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Biểu đồ</span>
                    <p className="text-xs text-muted-foreground">
                      Không gian phân tích kỹ thuật với nến trực tiếp, chỉ báo thích ứng KAMA, đường chặn lỗ cấu trúc và các điểm tín hiệu mua bán định lượng.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Danh sách theo dõi</span>
                    <p className="text-xs text-muted-foreground">
                      Hệ thống radar quét liên tục toàn thị trường, xếp hạng điểm chất lượng cơ hội và phân loại trạng thái xu hướng.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Vị thế</span>
                    <p className="text-xs text-muted-foreground">
                      Bảng điều khiển lệnh mở, cơ chế đặt lệnh một chạm, công tắc bot tự động và nút dừng khẩn cấp toàn hệ thống.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Phòng nghiên cứu chiến lược</span>
                    <p className="text-xs text-muted-foreground">
                      Thống kê hiệu suất thuật toán, hiển thị dòng suy luận trực tiếp của trí tuệ nhân tạo và nhật ký tự phản tư sau từng giao dịch.
                    </p>
                  </div>
                </div>
              </div>

              <div id="sa-security" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cơ chế bảo mật lưu trữ cục bộ</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Toàn bộ thông tin khóa kết nối API được lưu trữ mã hóa trực tiếp trong bộ nhớ cục bộ của trình duyệt người dùng. Hệ thống không lưu trữ khóa trên bất kỳ máy chủ trung gian nào và khuyến nghị chỉ cấp quyền đọc dữ liệu cùng quyền giao dịch hợp đồng tương lai, tuyệt đối không cấp quyền rút tiền.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 3: CHU TRÌNH VẬN HÀNH CHUẨN */}
          {/* ===================================================================== */}
          {activeSection === "trading-lifecycle" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Hướng dẫn bắt đầu</span>
                  <span>/</span>
                  <span className="text-foreground">Chu trình vận hành chuẩn</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Chu trình vận hành chuẩn
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Các bước thực hiện một chu kỳ giao dịch định lượng hoàn chỉnh từ quét tín hiệu đến phản tư sau lệnh.
                </p>
              </div>

              <div id="tl-steps" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Quy trình giao dịch năm bước</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Bước 1: Quét cơ hội tại Danh sách theo dõi</span>
                    <p className="text-muted-foreground mt-0.5">Sử dụng bộ lọc điểm cao để tìm các mã có điểm chất lượng từ 80 điểm trở lên và đang có xu hướng đồng thuận.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Bước 2: Kiểm chứng trên Biểu đồ</span>
                    <p className="text-muted-foreground mt-0.5">Quan sát vị trí giá so với đường KAMA, xác nhận tín hiệu tam giác xanh và kiểm tra khoảng cách đường chặn lỗ cấu trúc.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Bước 3: Thực thi lệnh tại mục Vị thế</span>
                    <p className="text-muted-foreground mt-0.5">Chọn mức đòn bẩy và nhập số tiền ký quỹ, hệ thống sẽ tự động tính toán điểm dừng lỗ và các mốc chốt lời tương ứng.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Bước 4: Quản trị vị thế theo bốn tầng thoát lệnh</span>
                    <p className="text-muted-foreground mt-0.5">Hệ thống tự động thực hiện chốt lời một phần tại mức 1.5R, dời dừng lỗ về hòa vốn và kéo trailing stop để tối ưu lợi nhuận.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Bước 5: Đọc đúc kết tại Phòng nghiên cứu chiến lược</span>
                    <p className="text-muted-foreground mt-0.5">Sau khi đóng vị thế, kiểm tra phần tự phản tư của trí tuệ nhân tạo để ghi nhận bài học kinh nghiệm và đánh giá mức độ tuân thủ kỷ luật.</p>
                  </div>
                </div>
              </div>

              <div id="tl-confluence-rule" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Nguyên tắc đồng thuận bắt buộc</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hệ thống chỉ kích hoạt tín hiệu vào lệnh khi có sự đồng thuận giữa khung thời gian lớn 1 giờ và khung thời gian vào lệnh 5 phút. Khi khung lớn đang giảm, các tín hiệu mua ngắn hạn sẽ tự động bị đánh giá ở mức lọc bỏ để bảo vệ tài khoản khỏi các bẫy giá hồi phục tạm thời.
                </p>
              </div>

              <div id="tl-capital-protection" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Tự động hóa bảo vệ vốn</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mỗi lệnh gửi lên sàn luôn đi kèm giá cắt lỗ dựa trên biến động thực tế của thị trường. Nhờ vậy, ngay cả trong trường hợp mất kết nối mạng hoặc thiết bị tắt đột ngột, tài khoản của bạn vẫn được bảo vệ 24/7 trên máy chủ của sàn giao dịch.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 4: CẤU TRÚC NẾN VÀ DỮ LIỆU GIÁ */}
          {/* ===================================================================== */}
          {activeSection === "chart-candlestick" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Sổ tay biểu đồ kỹ thuật</span>
                  <span>/</span>
                  <span className="text-foreground">Cấu trúc nến và dữ liệu giá</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cấu trúc nến và dữ liệu giá
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Giải nghĩa toàn bộ các thành phần hiển thị nến, hộp thông tin chi tiết và khối lượng giao dịch.
                </p>
              </div>

              <div id="cc-candlestick" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Biểu đồ nến Nhật và màu sắc</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Biểu đồ sử dụng mô hình nến chuẩn để thể hiện hành vi giá trong từng khoảng thời gian:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                    <span className="text-xs font-semibold text-emerald-500">Nến xanh lá cây (Nến tăng)</span>
                    <p className="text-xs text-muted-foreground">
                      Xuất hiện khi giá đóng cửa cao hơn giá mở cửa, thể hiện ưu thế của phe mua trong phiên giao dịch đó.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
                    <span className="text-xs font-semibold text-rose-500">Nến đỏ (Nến giảm)</span>
                    <p className="text-xs text-muted-foreground">
                      Xuất hiện khi giá đóng cửa thấp hơn giá mở cửa, thể hiện ưu thế của phe bán trong phiên giao dịch đó.
                    </p>
                  </div>
                </div>
              </div>

              <div id="cc-tooltip" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Hộp thông tin giá khi rê chuột</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Khi rê chuột qua bất kỳ vị trí nào trên biểu đồ, hộp thông tin sẽ hiển thị các chỉ số chi tiết của cây nến tại mốc thời gian đó:
                </p>

                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/80 text-muted-foreground font-mono">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Tên mục</th>
                        <th className="py-2.5 px-3.5 font-semibold">Ý nghĩa chi tiết</th>
                        <th className="py-2.5 px-3.5 font-semibold">Mục đích sử dụng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-muted-foreground">
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">open</td>
                        <td className="py-2.5 px-3.5">Giá mở cửa của phiên nến</td>
                        <td className="py-2.5 px-3.5">Xác định điểm khởi đầu chu kỳ</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">close</td>
                        <td className="py-2.5 px-3.5">Giá đóng cửa của phiên nến</td>
                        <td className="py-2.5 px-3.5">Xác định mức giá thanh toán cuối phiên</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">highest</td>
                        <td className="py-2.5 px-3.5">Mức giá cao nhất đạt được trong phiên</td>
                        <td className="py-2.5 px-3.5">Nhận diện đỉnh ngắn hạn và vùng cản</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">lowest</td>
                        <td className="py-2.5 px-3.5">Mức giá thấp nhất chạm tới trong phiên</td>
                        <td className="py-2.5 px-3.5">Nhận diện đáy ngắn hạn và hỗ trợ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="cc-volume" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cột khối lượng giao dịch bên dưới</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Phần biểu đồ phụ phía dưới hiển thị khối lượng khớp lệnh thực tế của từng cây nến. Cột màu xanh đại diện cho khối lượng trong phiên tăng giá, cột màu đỏ đại diện cho khối lượng trong phiên giảm giá. Khi cột khối lượng tăng vọt gấp nhiều lần mức trung bình, đó là dấu hiệu của dòng tiền lớn tham gia thị trường.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 5: CHỈ BÁO KAMA VÀ CHẶN LỖ CẤU TRÚC */}
          {/* ===================================================================== */}
          {activeSection === "chart-indicators" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Sổ tay biểu đồ kỹ thuật</span>
                  <span>/</span>
                  <span className="text-foreground">Chỉ báo KAMA và chặn lỗ cấu trúc</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Chỉ báo KAMA và chặn lỗ cấu trúc
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tìm hiểu nguyên lý vận hành của đường trung bình động thích ứng và đường chặn lỗ động bám theo cấu trúc đỉnh đáy.
                </p>
              </div>

              <div id="ci-kama" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Đường trung bình động thích ứng KAMA</h2>
                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-sky-500 rounded-full" />
                    <span className="text-xs font-semibold text-sky-500">Đường KAMA Adaptive (Đường xanh dương lượn sóng)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Đây là chỉ báo trung bình động thích ứng do Perry Kaufman phát minh. Điểm đặc biệt của KAMA là khả năng tự điều chỉnh tốc độ theo độ biến động của thị trường: khi thị trường đi ngang có nhiều nhiễu giá, đường KAMA sẽ tự động đi ngang phẳng để tránh tạo tín hiệu giả; khi thị trường bứt phá hình thành xu hướng mạnh mẽ, đường KAMA sẽ dốc nhanh theo giá để người dùng không bỏ lỡ điểm bám xu hướng.
                  </p>
                </div>
              </div>

              <div id="ci-trailing" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Đường chặn lỗ cấu trúc động</h2>
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-orange-500" />
                    <span className="text-xs font-semibold text-orange-500">Đường Structure Trailing Stop (Đường cam nét đứt giật cấp)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Đường chặn lỗ này được thuật toán tính toán tự động dựa trên các đáy hoặc đỉnh cấu trúc gần nhất kết hợp biên độ dao động thực tế. Khi giá di chuyển theo hướng có lợi và tạo các đỉnh đáy mới cao hơn, đường chặn lỗ sẽ tự động nhảy giật cấp nâng lên mốc bảo vệ mới nhằm khóa chặt phần lợi nhuận đã đạt được.
                  </p>
                </div>
              </div>

              <div id="ci-synergy" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Phối hợp KAMA và chặn lỗ cấu trúc</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Khi giá nằm trên đường KAMA xanh dương và đường chặn lỗ cam nằm ngay dưới hỗ trợ cấu trúc, đó là trạng thái xu hướng tăng lành mạnh. Nếu nến giá quay đầu phá vỡ xuống dưới đường chặn lỗ cam, thuật toán sẽ tự động phát tín hiệu thoát vị thế để tránh việc mất mát lợi nhuận.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 6: KÝ HIỆU TÍN HIỆU MUA BÁN VÀ CHỐT LỜI */}
          {/* ===================================================================== */}
          {activeSection === "chart-signals" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Sổ tay biểu đồ kỹ thuật</span>
                  <span>/</span>
                  <span className="text-foreground">Ký hiệu tín hiệu mua bán và chốt lời</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Ký hiệu tín hiệu mua bán và chốt lời
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Bảng tra cứu đầy đủ các ký hiệu hình học và chỉ số xuất hiện trực tiếp trên thân nến biểu đồ.
                </p>
              </div>

              <div id="cs-buy-triangle" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Tam giác xanh hướng lên kèm điểm số</h2>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold text-base">▲ 80đ</span>
                    <span className="text-xs font-semibold text-emerald-500">Tín hiệu mở vị thế mua</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hình tam giác màu xanh lá cây chỉ lên phía trên biểu thị một tín hiệu vào lệnh mua đã được thuật toán xác nhận. Con số đi kèm (ví dụ 80đ hoặc 65đ) chính là điểm chất lượng cơ hội từ 0 đến 100 điểm của cây nến đó. Điểm càng cao chứng tỏ cơ hội có xác suất thành công càng lớn.
                  </p>
                </div>
              </div>

              <div id="cs-sell-triangle" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Tam giác đỏ hướng xuống</h2>
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold text-base">▼</span>
                    <span className="text-xs font-semibold text-rose-500">Tín hiệu bán hoặc thoát lệnh</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hình tam giác màu đỏ chỉ xuống dưới cảnh báo xu hướng tăng đã bị phá vỡ hoặc có tín hiệu mở vị thế bán trong một xu hướng giảm rõ rệt. Người dùng nên cân nhắc đóng các vị thế mua đang nắm giữ khi thấy biểu tượng này.
                  </p>
                </div>
              </div>

              <div id="cs-take-profit-diamond" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Hình thoi kim cương vàng</h2>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold text-base">◆</span>
                    <span className="text-xs font-semibold text-amber-500">Tín hiệu chốt lời từng phần</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Biểu tượng hình thoi màu vàng cam xuất hiện tại các điểm giá đạt mục tiêu lợi nhuận ngắn hạn hoặc chạm vùng cản động. Đây là thời điểm thích hợp để thực hiện chốt 50% khối lượng lệnh nhằm bảo vệ thành quả.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 7: ĐƯỜNG MỐC CHỐT LỜI VÀ HÒA VỐN */}
          {/* ===================================================================== */}
          {activeSection === "chart-exit-tiers" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Sổ tay biểu đồ kỹ thuật</span>
                  <span>/</span>
                  <span className="text-foreground">Đường mốc chốt lời và hòa vốn</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Đường mốc chốt lời và hòa vốn
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Quy chuẩn các đường kẻ ngang hỗ trợ quản trị rủi ro và cơ cấu thoát lệnh tự động bốn tầng.
                </p>
              </div>

              <div id="ce-tp1" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Đường nét đứt xanh lá chốt lời 1.5R</h2>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-500">TP 50% (+1.5R)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Đường ngang màu xanh lá cây nét đứt hiển thị mốc giá mà tại đó lợi nhuận đạt gấp 1.5 lần mức rủi ro ban đầu (1.5R). Khi giá chạm mốc này, thuật toán khuyến nghị hoặc tự động chốt một nửa vị thế để thu hồi vốn và tạo tâm lý an tâm cho nhà giao dịch.
                  </p>
                </div>
              </div>

              <div id="ce-be" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Đường nét đứt vàng cam hòa vốn</h2>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-500" />
                    <span className="text-xs font-semibold text-amber-500">Hòa vốn (B.E)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Đường ngang màu vàng cam nét đứt biểu thị mức giá hòa vốn (bao gồm cả ước tính phí giao dịch). Sau khi mốc chốt lời tầng một được kích hoạt, điểm dừng lỗ của phần vị thế còn lại sẽ tự động được kéo về đường này để đảm bảo rằng lệnh giao dịch không thể bị lỗ trong bất kỳ tình huống nào.
                  </p>
                </div>
              </div>

              <div id="ce-engine" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cơ chế thoát lệnh bốn tầng tự động</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Tầng 1: Chốt 50% tại mốc 1.5R</span>
                    <p className="text-muted-foreground mt-0.5">Thu về lợi nhuận tiền mặt ngay khi đạt tỷ lệ kỳ vọng cơ bản.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Tầng 2: Dời dừng lỗ về hòa vốn</span>
                    <p className="text-muted-foreground mt-0.5">Xóa bỏ hoàn toàn nguy cơ thua lỗ cho 50% khối lượng còn lại.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Tầng 3: Chốt tiếp 30% tại mốc 2.6R</span>
                    <p className="text-muted-foreground mt-0.5">Hiện thực hóa phần lớn lợi nhuận khi thị trường kéo dài sóng tăng.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Tầng 4: Duy trì 20% gồng lãi theo cấu trúc</span>
                    <p className="text-muted-foreground mt-0.5">Để phần vị thế cuối cùng tự do tăng trưởng bám theo đường chặn lỗ cấu trúc đến khi xu hướng đảo chiều hoàn toàn.</p>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 8: THANH CÔNG CỤ VÀ TRẠNG THÁI HỆ THỐNG */}
          {/* ===================================================================== */}
          {activeSection === "chart-controls" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Sổ tay biểu đồ kỹ thuật</span>
                  <span>/</span>
                  <span className="text-foreground">Thanh công cụ và trạng thái hệ thống</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Thanh công cụ và trạng thái hệ thống
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Hướng dẫn chi tiết các nút điều khiển, bộ chuyển đổi khung thời gian, thanh trạng thái và tính năng tải lịch sử nến.
                </p>
              </div>

              <div id="ct-power-button" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Nút bật tắt hệ thống</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-foreground">Công tắc nguồn hệ thống</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nút bấm này cho phép người dùng ngắt hoặc tái kích hoạt toàn bộ luồng kết nối API và truyền dữ liệu trực tiếp với sàn. Khi chuyển sang trạng thái tắt, hệ thống sẽ ngừng gửi các yêu cầu nền để tiết kiệm tài nguyên mạng và bảo đảm an toàn khi bạn không muốn thực hiện giao dịch.
                  </p>
                </div>
              </div>

              <div id="ct-timeframes" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Bộ chọn khung thời gian</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hệ thống hỗ trợ 6 khung thời gian tiêu chuẩn gồm 1 phút, 5 phút, 15 phút, 1 giờ, 4 giờ và 1 ngày. Khung thời gian mặc định cho việc tìm điểm vào lệnh định lượng là 5 phút kết hợp tham chiếu xu hướng khung 1 giờ.
                </p>
              </div>

              <div id="ct-hud-metrics" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Thanh thông tin xu hướng và điểm số</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground">Chỉ báo xu hướng khung 1 giờ</span>
                    <p className="text-xs text-muted-foreground">Hiển thị thẻ màu xanh lá với mũi tên hướng lên khi khung lớn tăng giá, màu đỏ khi giảm giá và màu xám khi thị trường đi ngang.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground">Huy hiệu điểm Setup</span>
                    <p className="text-xs text-muted-foreground">Hiển thị tổng điểm chất lượng cơ hội hiện tại trên thang 100 điểm cùng đánh giá phân loại (Mạnh, Trung bình hoặc Đã lọc bỏ).</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground">Kế hoạch rủi ro thời gian thực</span>
                    <p className="text-xs text-muted-foreground">Tự động tính toán mức giá cắt lỗ, giá chốt lời 50%, tỷ lệ rủi ro trên lợi nhuận và số tiền ký quỹ cần thiết cho vị thế dự kiến.</p>
                  </div>
                </div>
              </div>

              <div id="ct-history-pan" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">4. Thanh trượt phóng to và tải thêm lịch sử</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ở góc trên bên trái biểu đồ có nút tải thêm lịch sử nến. Khi bạn cuộn hoặc kéo biểu đồ về phía bên trái, hệ thống sẽ tự động tải các cụm 1000 cây nến quá khứ tiếp theo mà không làm gián đoạn vị trí quan sát của bạn. Thanh trượt phía dưới cùng cho phép bạn thu phóng khoảng thời gian xem từ vài giờ tới nhiều tháng dữ liệu.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 9: BỘ LỌC PHÂN LOẠI THỊ TRƯỜNG */}
          {/* ===================================================================== */}
          {activeSection === "screener-filters" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Danh sách theo dõi và radar tín hiệu</span>
                  <span>/</span>
                  <span className="text-foreground">Bộ lọc phân loại thị trường</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Bộ lọc phân loại thị trường
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Hướng dẫn sử dụng radar tín hiệu để phát hiện sớm các cơ hội giao dịch có chất lượng cao nhất.
                </p>
              </div>

              <div id="sf-modes" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Các chế độ lọc thị trường</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Điểm cao</span>
                    <p className="text-xs text-muted-foreground">Ưu tiên hiển thị các đồng tiền có điểm Setup từ 65 điểm trở lên.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Tín hiệu mua</span>
                    <p className="text-xs text-muted-foreground">Lọc riêng các mã đang xuất hiện tín hiệu mua ở khung thời gian hiện tại.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Tín hiệu chốt lời</span>
                    <p className="text-xs text-muted-foreground">Hiển thị các mã đã chạm vùng chốt lời từng phần hoặc chạm cản động.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Tăng mạnh nhất và Khối lượng</span>
                    <p className="text-xs text-muted-foreground">Sắp xếp danh sách theo phần trăm tăng giá trong 24 giờ hoặc tổng giá trị giao dịch cao nhất.</p>
                  </div>
                </div>
              </div>

              <div id="sf-search-watchlist" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Tìm kiếm và quản lý danh sách yêu thích</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Người dùng có thể nhập trực tiếp tên mã vào ô tìm kiếm hoặc bấm biểu tượng ngôi sao để đưa các mã trọng tâm vào danh sách theo dõi riêng biệt. Danh sách này được lưu tự động trên trình duyệt.
                </p>
              </div>

              <div id="sf-realtime-scan" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Tần suất quét tín hiệu thời gian thực</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Radar tự động quét lại dữ liệu nến đa khung thời gian sau mỗi chu kỳ 10 đến 12 giây cho các mã hàng đầu, đảm bảo bạn luôn nhận được thông tin về tín hiệu mới nhất mà không cần bấm tải lại trang.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 10: THANG ĐIỂM CHẤT LƯỢNG CƠ HỘI */}
          {/* ===================================================================== */}
          {activeSection === "screener-scoring" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Danh sách theo dõi và radar tín hiệu</span>
                  <span>/</span>
                  <span className="text-foreground">Thang điểm chất lượng cơ hội</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Thang điểm chất lượng cơ hội
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Công thức lượng hóa chất lượng một cơ hội giao dịch dựa trên các trụ cột toán học độc lập.
                </p>
              </div>

              <div id="ss-weights" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Bảng trọng số chấm điểm 0 đến 100</h2>
                
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/80 text-muted-foreground font-mono">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Thành phần đánh giá</th>
                        <th className="py-2.5 px-3.5 font-semibold">Điểm tối đa</th>
                        <th className="py-2.5 px-3.5 font-semibold">Tiêu chuẩn đạt điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-muted-foreground">
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Đồng thuận khung 1 giờ</td>
                        <td className="py-2.5 px-3.5 text-emerald-500 font-bold">35 điểm</td>
                        <td className="py-2.5 px-3.5">Đường trung bình khung lớn xác nhận xu hướng tăng rõ ràng</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Vị trí giá so với KAMA</td>
                        <td className="py-2.5 px-3.5 text-emerald-500 font-bold">25 điểm</td>
                        <td className="py-2.5 px-3.5">Giá hoàn tất sóng hồi về chạm hỗ trợ KAMA thích ứng</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Động lượng RSI và phân kỳ</td>
                        <td className="py-2.5 px-3.5 text-emerald-500 font-bold">20 điểm</td>
                        <td className="py-2.5 px-3.5">Chỉ số động lượng thoát khỏi vùng quá bán và quay đầu tăng</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Hiệu quả Kaufman và dòng tiền</td>
                        <td className="py-2.5 px-3.5 text-emerald-500 font-bold">20 điểm</td>
                        <td className="py-2.5 px-3.5">Chỉ số Kaufman ER đạt trên 0.35 kèm khối lượng mua tăng</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="ss-tiers" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Ba phân loại chất lượng cơ hội</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs">
                    <span className="font-semibold text-emerald-500">Mạnh (80 đến 100 điểm)</span>
                    <p className="text-muted-foreground mt-0.5">Hội tụ đầy đủ mọi điều kiện tối ưu, phù hợp để bot tự động hoặc người dùng mở vị thế.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs">
                    <span className="font-semibold text-amber-500">Theo dõi (65 đến 79 điểm)</span>
                    <p className="text-muted-foreground mt-0.5">Cơ hội tiềm năng đang hình thành cấu trúc, nên quan sát thêm nến xác nhận.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-muted-foreground">Bỏ qua (Dưới 65 điểm)</span>
                    <p className="text-muted-foreground mt-0.5">Thị trường nhiễu hoặc đi ngang không rõ xu hướng, thuật toán khuyến nghị đứng ngoài.</p>
                  </div>
                </div>
              </div>

              <div id="ss-exit-tier-column" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cột tầng thoát lệnh của từng mã</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Trong bảng danh sách theo dõi, mỗi mã còn hiển thị trạng thái tầng thoát lệnh từ 0 đến 4. Chỉ số này giúp bạn biết nhanh mã đó đang ở giai đoạn mở mới (Tầng 0), đã chốt lời một phần (Tầng 1), đã dời dừng lỗ hòa vốn (Tầng 2) hay đang trong giai đoạn gồng lãi bám theo cấu trúc (Tầng 3 và 4).
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 11: ĐỒNG THUẬN ĐA KHUNG VÀ CHỈ SỐ KAUFMAN */}
          {/* ===================================================================== */}
          {activeSection === "screener-confluence" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Danh sách theo dõi và radar tín hiệu</span>
                  <span>/</span>
                  <span className="text-foreground">Đồng thuận đa khung và chỉ số Kaufman</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Đồng thuận đa khung và chỉ số Kaufman
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nguyên lý lọc nhiễu sóng ngắn và đo lường độ tinh khiết của xu hướng giá bằng toán học.
                </p>
              </div>

              <div id="sc-multi-tf" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Nguyên tắc đồng thuận khung 5 phút và 1 giờ</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Thuật toán sử dụng khung thời gian 1 giờ để định hình xu hướng chủ đạo và khung thời gian 5 phút để xác định thời điểm vào lệnh chính xác. Giao dịch thuận theo xu hướng lớn giúp tăng đáng kể tỷ lệ thành công của các lệnh mua bán.
                </p>
              </div>

              <div id="sc-kaufman-er" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Chỉ số hiệu quả Kaufman và nhận diện vùng giá</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Chỉ số hiệu quả Kaufman (Efficiency Ratio - ER) đo lường tỷ số giữa mức thay đổi giá thuần túy so với tổng quãng đường di chuyển của giá trong chu kỳ. Giá trị ER dao động từ 0 đến 1:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-emerald-500">ER từ 0.60 trở lên</span>
                    <p className="text-xs text-muted-foreground">Thị trường có xu hướng rất mạnh và rõ ràng, độ nhiễu cực thấp.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-amber-500">ER dưới 0.35</span>
                    <p className="text-xs text-muted-foreground">Thị trường đi ngang tích lũy hoặc có nhiều dao động giằng co không định hướng.</p>
                  </div>
                </div>
              </div>

              <div id="sc-filter-noise" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cơ chế loại bỏ bẫy giá đi ngang</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Nhờ kết hợp chỉ số Kaufman ER vào công thức chấm điểm, hệ thống sẽ tự động hạ điểm các đợt tăng giá giả trong vùng đi ngang, ngăn chặn tình trạng mua đuổi đỉnh ngắn hạn.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 12: CHỈ SỐ TÀI KHOẢN VÀ DỪNG KHẨN CẤP */}
          {/* ===================================================================== */}
          {activeSection === "tracker-account" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Quản lý vị thế và bảng điều khiển</span>
                  <span>/</span>
                  <span className="text-foreground">Chỉ số tài khoản và dừng khẩn cấp</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Chỉ số tài khoản và dừng khẩn cấp
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Quản lý số dư, theo dõi lãi lỗ chưa chốt và thao tác bảo vệ tài khoản trong các tình huống biến động mạnh.
                </p>
              </div>

              <div id="ta-metrics" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Bốn chỉ số tài khoản quan trọng</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Số dư ví (Wallet Balance)</span>
                    <p className="text-xs text-muted-foreground">Tổng số vốn thực tế có trong tài khoản hợp đồng tương lai của bạn.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Số dư khả dụng (Available Margin)</span>
                    <p className="text-xs text-muted-foreground">Số tiền nhàn rỗi có thể sử dụng để mở các vị thế mới.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Lãi lỗ chưa thực hiện (PnL)</span>
                    <p className="text-xs text-muted-foreground">Tổng mức lãi hoặc lỗ tạm tính của toàn bộ các lệnh đang mở theo giá thị trường.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Tỷ lệ thắng (Win Rate)</span>
                    <p className="text-xs text-muted-foreground">Phần trăm các lệnh đóng có kết quả sinh lời trên tổng số giao dịch đã thực hiện.</p>
                  </div>
                </div>
              </div>

              <div id="ta-kill-switch" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Nút dừng khẩn cấp toàn hệ thống</h2>
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-rose-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Nút dừng khẩn cấp (Kill Switch)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Khi thị trường xảy ra sự kiện thiên nga đen hoặc tin tức biến động bất thường ngoài tầm kiểm soát, người dùng có thể bấm nút Dừng khẩn cấp. Hệ thống sẽ ngay lập tức gửi lệnh thanh lý toàn bộ các vị thế đang mở theo giá thị trường và hủy toàn bộ các lệnh chờ trên sàn trong vòng chưa đầy một giây.
                  </p>
                </div>
              </div>

              <div id="ta-sync-status" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Đồng bộ dữ liệu tài khoản với sàn</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hệ thống tự động đồng bộ số dư và trạng thái vị thế với sàn sau mỗi 5 giây khi công tắc nguồn đang bật, đảm bảo số liệu trên màn hình luôn khớp chính xác với số dư thực tế.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 13: ĐẶT LỆNH MỘT CHẠM KÈM BẢO VỆ VỐN */}
          {/* ===================================================================== */}
          {activeSection === "tracker-order-placement" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Quản lý vị thế và bảng điều khiển</span>
                  <span>/</span>
                  <span className="text-foreground">Đặt lệnh một chạm kèm bảo vệ vốn</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Đặt lệnh một chạm kèm bảo vệ vốn
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cơ chế thiết lập lệnh hợp đồng tương lai thông minh với các mốc thoát lệnh được tính toán trước.
                </p>
              </div>

              <div id="to-bracket" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Cấu trúc lệnh một chạm kèm dừng lỗ chốt lời</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Thay vì phải đặt lệnh thị trường rồi mới đặt lệnh dừng lỗ thủ công, hệ thống hỗ trợ cấu trúc lệnh trọn gói: một cú bấm chuột sẽ gửi đồng thời lệnh vào vị thế, lệnh cắt lỗ bảo vệ và các mốc chốt lời mục tiêu lên sàn giao dịch.
                </p>
              </div>

              <div id="to-inputs" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Chọn đòn bẩy và nhập mức ký quỹ</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-foreground font-semibold">Mức đòn bẩy (Leverage)</span>
                    <span className="font-mono text-muted-foreground">Từ 1x đến 50x (Khuyến nghị 5x đến 15x)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-foreground font-semibold">Tiền ký quỹ (Margin)</span>
                    <span className="font-mono text-muted-foreground">Số tiền USDT cụ thể phân bổ cho lệnh này</span>
                  </div>
                </div>
              </div>

              <div id="to-auto-calc" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Tự động tính toán điểm vào và thoát lệnh</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Dựa trên giá hiện tại và biên độ dao động thực tế của nến, hệ thống sẽ tự động đề xuất mốc dừng lỗ tối ưu tại đáy cấu trúc gần nhất và tính toán mốc chốt lời 1.5R tương ứng, giúp bạn loại bỏ hoàn toàn cảm tính khi giao dịch.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 14: BẢNG QUẢN LÝ VỊ THẾ ĐANG MỞ */}
          {/* ===================================================================== */}
          {activeSection === "tracker-active-positions" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Quản lý vị thế và bảng điều khiển</span>
                  <span>/</span>
                  <span className="text-foreground">Bảng quản lý vị thế đang mở</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Bảng quản lý vị thế đang mở
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ý nghĩa chi tiết các cột thông số trong bảng vị thế và cách kiểm soát giá thanh lý.
                </p>
              </div>

              <div id="tp-table-cols" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Các cột thông số trong bảng vị thế mở</h2>
                
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/80 text-muted-foreground font-mono">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Tên cột</th>
                        <th className="py-2.5 px-3.5 font-semibold">Ý nghĩa</th>
                        <th className="py-2.5 px-3.5 font-semibold">Ghi chú an toàn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-muted-foreground">
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Mã và Chiều</td>
                        <td className="py-2.5 px-3.5">Tên cặp tiền và hướng Mua (Long) hoặc Bán (Short)</td>
                        <td className="py-2.5 px-3.5">Màu xanh cho Long, màu đỏ cho Short</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Khối lượng</td>
                        <td className="py-2.5 px-3.5">Số lượng hợp đồng đang nắm giữ</td>
                        <td className="py-2.5 px-3.5">Đã nhân theo hệ số đòn bẩy</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Giá vào lệnh (Entry)</td>
                        <td className="py-2.5 px-3.5">Mức giá khớp trung bình của vị thế</td>
                        <td className="py-2.5 px-3.5">Cơ sở tính toán lãi lỗ</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Giá đánh dấu (Mark)</td>
                        <td className="py-2.5 px-3.5">Giá tham chiếu công bằng của sàn</td>
                        <td className="py-2.5 px-3.5">Dùng để kích hoạt lệnh dừng lỗ</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Giá thanh lý (Liq)</td>
                        <td className="py-2.5 px-3.5">Mốc giá mà tài khoản sẽ bị đóng bắt buộc</td>
                        <td className="py-2.5 px-3.5 text-rose-500">Luôn giữ khoảng cách an toàn</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-foreground">Lãi lỗ và Tỷ suất (ROE)</td>
                        <td className="py-2.5 px-3.5">Lợi nhuận theo USD và phần trăm trên tiền ký quỹ</td>
                        <td className="py-2.5 px-3.5">Cập nhật trực tiếp theo thời gian thực</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="tp-close-position" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Nút đóng vị thế tức thì theo giá thị trường</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ở cuối mỗi dòng vị thế có nút đóng lệnh nhanh. Khi bấm nút này, hệ thống sẽ gửi lệnh đối ứng ngay lập tức để tất toán toàn bộ khối lượng của vị thế theo giá thị trường hiện tại.
                </p>
              </div>

              <div id="tp-risk-ratio" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Kiểm soát tỷ lệ ký quỹ và giá thanh lý</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Nhờ việc luôn cài đặt mốc dừng lỗ theo cấu trúc nến, vị thế của bạn sẽ luôn được cắt lỗ chủ động trước khi giá có thể tiếp cận tới mức giá thanh lý, đảm bảo an toàn tuyệt đối cho số dư tài khoản.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 15: VẬN HÀNH BOT TỰ ĐỘNG VÀ TĂNG TRƯỞNG VỐN */}
          {/* ===================================================================== */}
          {activeSection === "tracker-bot-automation" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Quản lý vị thế và bảng điều khiển</span>
                  <span>/</span>
                  <span className="text-foreground">Vận hành bot tự động và tăng trưởng vốn</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Vận hành bot tự động và tăng trưởng vốn
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Thiết lập bot tự động quét và vào lệnh 24/7 theo kỷ luật định lượng nghiêm ngặt.
                </p>
              </div>

              <div id="tb-switch" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Công tắc kích hoạt bot tự động</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-foreground">Chế độ tự động hóa hoàn toàn</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Khi bật công tắc bot tự động tại góc trên bảng điều khiển, bot sẽ chạy ngầm liên tục để quét các cặp tiền hàng đầu. Bot chỉ thực hiện mở lệnh khi tất cả các tiêu chí khắt khe được thỏa mãn đồng thời.
                  </p>
                </div>
              </div>

              <div id="tb-rules" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Điều kiện mở vị thế và giới hạn an toàn</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Điều kiện 1: Điểm Setup đạt chuẩn</span>
                    <p className="text-muted-foreground mt-0.5">Điểm chất lượng của mã phải lớn hơn hoặc bằng ngưỡng cài đặt (mặc định từ 80 điểm trở lên).</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Điều kiện 2: Giới hạn số vị thế mở</span>
                    <p className="text-muted-foreground mt-0.5">Tổng số vị thế đang mở chưa vượt quá số lượng tối đa cho phép (mặc định tối đa 3 vị thế).</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Điều kiện 3: Không mở trùng lặp</span>
                    <p className="text-muted-foreground mt-0.5">Không mở thêm vị thế mới cho một mã đang có lệnh mở hoặc đang có lệnh chờ xử lý.</p>
                  </div>
                </div>
              </div>

              <div id="tb-logs-equity" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Nhật ký hoạt động bot và biểu đồ tăng trưởng vốn</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mọi hành động quét mã, kiểm tra điều kiện, tính toán điểm số và gửi lệnh đều được ghi nhận trực quan trong thẻ Nhật ký hoạt động của bot. Thẻ Biểu đồ tăng trưởng vốn phản ánh đường cong tài sản theo thời gian thực để bạn đánh giá hiệu quả chiến lược.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 16: DANH MỤC CHIẾN LƯỢC ĐỊNH LƯỢNG */}
          {/* ===================================================================== */}
          {activeSection === "strategy-catalog" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Phòng nghiên cứu chiến lược và nhật ký trí tuệ nhân tạo</span>
                  <span>/</span>
                  <span className="text-foreground">Danh mục chiến lược định lượng</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Danh mục chiến lược định lượng
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Khám phá bộ ba chiến lược cốt lõi được lập trình sẵn trong hệ thống phòng nghiên cứu.
                </p>
              </div>

              <div id="st-core-strats" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Ba chiến lược định lượng cốt lõi</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mỗi chiến lược được thiết kế để khai thác một trạng thái cụ thể của thị trường dựa trên chỉ số hiệu quả Kaufman ER và cấu trúc sóng nến.
                </p>
              </div>

              <div id="st-kama-pullback" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Chiến lược hồi quy xu hướng KAMA</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Điều kiện kích hoạt: Kaufman ER từ 0.60 trở lên</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Áp dụng khi thị trường đang có xu hướng rất mạnh. Chiến lược chờ đợi nhịp điều chỉnh nhẹ về chạm đường KAMA thích ứng rồi mở vị thế thuận theo xu hướng chủ đạo với tỷ lệ lợi nhuận kỳ vọng cao.
                  </p>
                </div>
              </div>

              <div id="st-liquidity-sweep" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Chiến lược quét thanh khoản đảo chiều</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Điều kiện kích hoạt: Phát hiện bẫy thanh khoản quét đỉnh hoặc đáy</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Khai thác các pha quét cắt lỗ của thị trường. Khi giá vượt qua đỉnh hoặc đáy cũ nhưng nhanh chóng rút chân đóng nến quay lại kèm khối lượng lớn, chiến lược sẽ mở vị thế đón đầu nhịp đảo chiều dòng tiền.
                  </p>
                </div>
              </div>

              <div id="st-mean-reversion" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">4. Chiến lược hồi quy dải Bollinger và phân kỳ RSI</h2>
                <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Điều kiện kích hoạt: Kaufman ER dưới 0.35</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Áp dụng trong giai đoạn thị trường đi ngang tích lũy. Chiến lược tìm kiếm các điểm giá chạm dải biên Bollinger kết hợp phân kỳ động lượng RSI để ăn các nhịp dao động hồi quy về đường trung bình.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 17: LUẬN ĐIỂM PHÂN TÍCH THỜI GIAN THỰC */}
          {/* ===================================================================== */}
          {activeSection === "strategy-live-reasoning" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Phòng nghiên cứu chiến lược và nhật ký trí tuệ nhân tạo</span>
                  <span>/</span>
                  <span className="text-foreground">Luận điểm phân tích thời gian thực</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Luận điểm phân tích thời gian thực
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Theo dõi trực tiếp dòng suy luận và phân loại trạng thái thị trường của trí tuệ nhân tạo.
                </p>
              </div>

              <div id="sr-ai-engine" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Cơ chế lập luận thời gian thực của AI</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Trí tuệ nhân tạo liên tục nhận luồng dữ liệu nến trực tiếp, đo lường các tham số định lượng và sinh ra các đoạn phân tích giải thích rõ tại sao một mã tiền mã hóa lại đạt hoặc không đạt điều kiện vào lệnh.
                </p>
              </div>

              <div id="sr-market-regime" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Phân loại trạng thái thị trường theo Kaufman</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Trạng thái Xu hướng mạnh (ER cao)</span>
                    <p className="text-muted-foreground mt-0.5">Khớp với chiến lược bám xu hướng KAMA.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Trạng thái Quét thanh khoản</span>
                    <p className="text-muted-foreground mt-0.5">Khớp với chiến lược bẫy thanh khoản và đảo chiều dòng tiền.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Trạng thái Đi ngang tích lũy (ER thấp)</span>
                    <p className="text-muted-foreground mt-0.5">Khớp với chiến lược hồi quy dải Bollinger.</p>
                  </div>
                </div>
              </div>

              <div id="sr-signals-stream" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Dòng suy luận trực tiếp theo từng cặp tiền</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tại khung Luận điểm trực tiếp trong màn hình Phòng nghiên cứu chiến lược, bạn sẽ thấy thông báo cập nhật liên tục từng giây, thể hiện rõ mức độ đồng thuận khung 1 giờ, điểm số và lý do mở hoặc từ chối lệnh.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 18: NHẬT KÝ TỰ PHẢN TƯ SAU GIAO DỊCH */}
          {/* ===================================================================== */}
          {activeSection === "strategy-reflections" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Phòng nghiên cứu chiến lược và nhật ký trí tuệ nhân tạo</span>
                  <span>/</span>
                  <span className="text-foreground">Nhật ký tự phản tư sau giao dịch</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Nhật ký tự phản tư sau giao dịch
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cơ chế tự đánh giá và đúc kết bài học tự động của trí tuệ nhân tạo sau mỗi lệnh đóng.
                </p>
              </div>

              <div id="sf-post-trade" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Quy trình tự phản tư sau khi đóng lệnh</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Ngay sau khi một vị thế được đóng (dù có kết quả lãi hay lỗ), trí tuệ nhân tạo sẽ tự động phân tích diễn biến của lệnh đó: từ điểm vào, mức độ giữ kỷ luật dừng lỗ, tỷ lệ lợi nhuận đạt được đến các yếu tố bất ngờ từ thị trường.
                </p>
              </div>

              <div id="sf-disciplines" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Đánh giá tuân thủ quy tắc và bài học kinh nghiệm</h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs">
                    <span className="font-semibold text-emerald-500">Đối với lệnh thắng</span>
                    <p className="text-muted-foreground mt-0.5">Xác nhận việc tuân thủ đúng tỷ lệ chốt lời bốn tầng và khả năng gồng lãi bám theo cấu trúc.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs">
                    <span className="font-semibold text-rose-500">Đối với lệnh thua</span>
                    <p className="text-muted-foreground mt-0.5">Phân tích xem thị trường có biến động tin tức hay xuất hiện tín hiệu phân kỳ đối nghịch để rút kinh nghiệm cải thiện bộ lọc.</p>
                  </div>
                </div>
              </div>

              <div id="sf-filter-search" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Tra cứu lịch sử phản tư theo kết quả thắng thua</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Người dùng có thể sử dụng thanh tìm kiếm và bộ lọc kết quả (Tất cả, Thắng, Thua) để xem lại toàn bộ kho dữ liệu đúc kết, giúp nâng cao kỹ năng và sự thấu hiểu thị trường qua từng ngày.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 19: KẾT NỐI SÀN GIAO DỊCH THỬ NGHIỆM VÀ THỰC TẾ */}
          {/* ===================================================================== */}
          {activeSection === "settings-binance-api" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Cài đặt và quản trị hệ thống</span>
                  <span>/</span>
                  <span className="text-foreground">Kết nối sàn giao dịch thử nghiệm và thực tế</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Kết nối sàn giao dịch thử nghiệm và thực tế
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cấu hình khóa kết nối API độc lập cho môi trường thử nghiệm và môi trường thực tế tiền thật.
                </p>
              </div>

              <div id="sb-dual-env" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Hai môi trường thử nghiệm và thực tế độc lập</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Môi trường thử nghiệm (Testnet)</span>
                    <p className="text-xs text-muted-foreground">Dành riêng cho việc học tập, thử nghiệm tính năng và kiểm tra bot mà không lo rủi ro mất tiền.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Môi trường thực tế (Mainnet)</span>
                    <p className="text-xs text-muted-foreground">Kết nối trực tiếp với ví thực tế trên sàn để thực hiện các giao dịch thật.</p>
                  </div>
                </div>
              </div>

              <div id="sb-keys-input" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Nhập và kiểm tra kết nối API Key</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tại màn hình Cài đặt, bạn dán khóa API Key và Secret Key vào ô tương ứng, sau đó bấm nút Kiểm tra kết nối. Hệ thống sẽ gửi một truy vấn kiểm tra quyền hạn lên máy chủ của sàn và hiển thị thông báo trạng thái kết nối thành công.
                </p>
              </div>

              <div id="sb-no-withdraw" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Nguyên tắc an toàn không cấp quyền rút tiền</h2>
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bảo vệ tài sản tuyệt đối</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Khi tạo khóa API trên sàn, bạn chỉ cần tích chọn quyền Đọc dữ liệu và quyền Giao dịch hợp đồng tương lai. Tuyệt đối không tích chọn quyền Rút tiền hoặc quyền Chuyển khoản nội bộ.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 20: CẤU HÌNH MÔ HÌNH TRÍ TUỆ NHÂN TẠO */}
          {/* ===================================================================== */}
          {activeSection === "settings-llm-ai" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Cài đặt và quản trị hệ thống</span>
                  <span>/</span>
                  <span className="text-foreground">Cấu hình mô hình trí tuệ nhân tạo</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cấu hình mô hình trí tuệ nhân tạo
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tùy chỉnh nhà cung cấp mô hình ngôn ngữ lớn để phục vụ việc phân tích và tự phản tư.
                </p>
              </div>

              <div id="sl-providers" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Bốn nhà cung cấp mô hình trí tuệ nhân tạo</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Google Gemini</span>
                    <p className="text-xs text-muted-foreground">Tốc độ xử lý siêu nhanh, tối ưu cho phân tích luồng dữ liệu liên tục.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">OpenAI</span>
                    <p className="text-xs text-muted-foreground">Các dòng mô hình hàng đầu với khả năng lập luận đa chiều chuẩn xác.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">DeepSeek AI</span>
                    <p className="text-xs text-muted-foreground">Mô hình lập luận chuyên sâu về toán học và suy luận định lượng chi phí tối ưu.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60 space-y-1">
                    <span className="text-xs font-semibold text-foreground">Anthropic Claude</span>
                    <p className="text-xs text-muted-foreground">Chất lượng văn phong phân tích sắc bén, logic và tự nhiên.</p>
                  </div>
                </div>
              </div>

              <div id="sl-model-presets" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Danh sách mô hình gợi ý theo từng mục đích</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hệ thống cung cấp sẵn các mẫu cấu hình gợi ý sẵn có giúp người dùng chỉ cần một cú nhấp chuột là có thể chọn đúng dòng mô hình phù hợp nhất với nhu cầu của mình.
                </p>
              </div>

              <div id="sl-params" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Tùy chỉnh nhiệt độ, thời gian chờ và độ sâu suy luận</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Người dùng có thể điều chỉnh tham số nhiệt độ (Temperature, khuyến nghị 0.2 để có kết quả phân tích ổn định và chính xác), thời gian chờ tối đa (Timeout) và mức độ suy luận (Low, Medium, High).
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 21: THAM SỐ QUẢN TRỊ RỦI RO VÀ BOT TỰ ĐỘNG */}
          {/* ===================================================================== */}
          {activeSection === "settings-risk-bot" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Cài đặt và quản trị hệ thống</span>
                  <span>/</span>
                  <span className="text-foreground">Tham số quản trị rủi ro và bot tự động</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Tham số quản trị rủi ro và bot tự động
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cài đặt các hạn mức ký quỹ, số vị thế tối đa và ngưỡng điểm chất lượng để kiểm soát rủi ro.
                </p>
              </div>

              <div id="srb-capital-trade" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Cấu hình số vốn ký quỹ trên mỗi lệnh</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Thiết lập số tiền USDT tối đa mà bot được phép sử dụng để ký quỹ cho mỗi lần mở vị thế (ví dụ: 50 USD mỗi lệnh). Việc cố định mức vốn này giúp bạn kiểm soát rủi ro độc lập cho từng giao dịch.
                </p>
              </div>

              <div id="srb-max-positions" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Giới hạn số vị thế mở đồng thời</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Quy định số lượng tối đa các cặp tiền có thể mở lệnh cùng một lúc (ví dụ: tối đa 3 vị thế). Khi đã đạt tới giới hạn này, bot sẽ tự động tạm dừng mở thêm lệnh mới cho đến khi có ít nhất một vị thế cũ được tất toán.
                </p>
              </div>

              <div id="srb-min-score" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Ngưỡng điểm chất lượng tối thiểu cho bot</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cài đặt mức điểm Setup sàn lọc (mặc định 80 điểm). Chỉ những cơ hội có số điểm bằng hoặc vượt qua ngưỡng này mới được bot kích hoạt lệnh tự động.
                </p>
              </div>
            </article>
          )}

          {/* ===================================================================== */}
          {/* SECTION 22: CÁ NHÂN HÓA HỒ SƠ VÀ GIAO DIỆN */}
          {/* ===================================================================== */}
          {activeSection === "settings-profile-theme" && (
            <article className="space-y-6">
              <div className="space-y-1.5 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>Cài đặt và quản trị hệ thống</span>
                  <span>/</span>
                  <span className="text-foreground">Cá nhân hóa hồ sơ và giao diện</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cá nhân hóa hồ sơ và giao diện
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tùy chỉnh tên định danh, âm thanh thông báo và chế độ hiển thị sáng tối.
                </p>
              </div>

              <div id="sp-name-sound" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">1. Tên định danh và âm thanh cảnh báo tín hiệu</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bạn có thể đặt tên định danh cho phiên làm việc của mình và bật tính năng âm thanh thông báo để nhận được chuông cảnh báo tức thì mỗi khi có tín hiệu mua bán mới xuất hiện.
                </p>
              </div>

              <div id="sp-dark-light" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">2. Chuyển đổi chế độ giao diện sáng tối</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hệ thống hỗ trợ cả hai chế độ giao diện tối giản hiện đại: chế độ tối giúp giảm mỏi mắt khi quan sát biểu đồ lâu trong đêm và chế độ sáng tạo cảm giác tinh tế, sắc nét vào ban ngày.
                </p>
              </div>

              <div id="sp-storage-sync" className="space-y-3">
                <h2 className="text-base font-bold text-foreground">3. Cơ chế lưu trữ cấu hình an toàn trên trình duyệt</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mọi tùy chọn cài đặt cá nhân đều được lưu trữ trực tiếp trên thiết bị của bạn thông qua bộ nhớ trình duyệt, đảm bảo giữ nguyên trạng thái làm việc mỗi khi bạn mở lại terminal.
                </p>
              </div>
            </article>
          )}

        </main>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: TABLE OF CONTENTS (On This Page - OpenAI Style) */}
        {/* ======================================================================= */}
        <aside className="w-64 border-s border-border/60 bg-card/10 p-4 space-y-4 shrink-0 hidden lg:block overflow-y-auto">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-foreground uppercase font-mono tracking-wider block">
              Mục lục bài viết
            </span>

            <div className="space-y-1 border-s border-border/60 ps-2.5">
              {currentToc.map((toc) => (
                <a
                  key={toc.id}
                  href={`#${toc.id}`}
                  className="block text-xs text-muted-foreground hover:text-foreground transition py-1 leading-snug"
                >
                  {toc.label}
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 space-y-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Đã sao chép liên kết tài liệu");
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition cursor-pointer font-medium"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép trang</span>
            </button>

            <Link
              to="/live"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs text-primary transition cursor-pointer font-medium"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Đến Biểu đồ</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
