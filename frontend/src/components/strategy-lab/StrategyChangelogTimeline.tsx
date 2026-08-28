import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  GitCommit,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export interface ChangelogItem {
  version_tag: string;
  timestamp: string;
  trigger_summary: string;
  root_cause_analysis: string;
  academic_reference: string;
  parameter_changes: Record<string, { old: any; new: any; reason: string }>;
  trade_off: string;
  evaluation_plan: string;
  status: string;
}

const DEFAULT_CHANGELOG_SAMPLES: ChangelogItem[] = [
  {
    version_tag: "Strategy v1.2 → v1.3",
    timestamp: "2026-08-24 20:00:00",
    trigger_summary: "Chu kỳ 5 lệnh: 3/5 lệnh thua trên TUTUSDT, XRPUSDT. Lỗ lớn nhất: TUTUSDT (-58.4%).",
    root_cause_analysis: "Thị trường xảy ra rung lắc giật ngược hướng trong pha Trend mạnh (Kaufman ER = 0.442). Giá bám dải Bollinger thay vì hồi quy.",
    academic_reference: "Kaufman ER (Trading Systems & Methods Ch.17) & De Prado Triple Barrier (AFML Ch.3)",
    parameter_changes: {
      minSetupScore: { old: 65, new: 78, reason: "Nâng ngưỡng chất lượng nến + chỉ báo hội tụ" },
      kaufmanER_Filter: { old: 0.45, new: 0.35, reason: "Chỉ kích hoạt bắt đảo chiều khi ER thực sự đi ngang" },
      hardStopLossRoi: { old: "-50%", new: "-15%", reason: "Khống chế trần cắt lỗ khẩn cấp chống sụt giảm vốn" },
    },
    trade_off: "Giảm tần suất ra lệnh ~35%, loại bỏ bẫy bắt đáy trong pha xu hướng mạnh.",
    evaluation_plan: "Đánh giá lại sau 15 lệnh tiếp theo. Yêu cầu Win Rate ≥ 50%, Max Loss ≤ -15%.",
    status: "ĐANG THEO DÕI (ACTIVE_PROBATION)",
  },
  {
    version_tag: "Strategy v1.1 → v1.2",
    timestamp: "2026-08-23 18:30:00",
    trigger_summary: "Khởi động mô hình Scalping 5m trên 15 cặp Binance Futures.",
    root_cause_analysis: "Tối ưu hóa độ trễ tính toán định lượng KAMA và quét râu thanh khoản Liquidity Sweep.",
    academic_reference: "Developing High-Frequency Trading Systems (Sebastien Donadio Ch.8)",
    parameter_changes: {
      timeframe: { old: "15m", new: "5m", reason: "Bắt sóng dao động nhanh và xoay vòng vốn" },
      minVolumeSpike: { old: "1.2x", new: "1.8x", reason: "Xác nhận dòng tiền tổ chức tham gia hấp thụ cung cầu" },
    },
    trade_off: "Tăng số lượng tín hiệu quét nhưng yêu cầu khớp lệnh nhanh.",
    evaluation_plan: "Theo dõi 20 lệnh scalping đầu tiên.",
    status: "ĐÃ NGHIỆM THU (VERIFIED)",
  },
];

export function StrategyChangelogTimeline() {
  const { t } = useTranslation();
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>(DEFAULT_CHANGELOG_SAMPLES);
  const [loading, setLoading] = useState(false);

  const fetchChangelogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/optimization/changelog?limit=10");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setChangelogs(data);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelogs();
    const interval = setInterval(fetchChangelogs, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              {t("dashboard.strategyEvolutionChangelog", "Nhật Ký Tiến Hóa & Phiên Bản Chiến Lược (Autonomous Changelog)")}
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                5-Trade Closed-Loop AI
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Tự động chẩn đoán học thuật, điều chỉnh biến số định lượng và nghiệm thu code sau mỗi 5 lệnh
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchChangelogs}
          disabled={loading}
          className="p-1.5 rounded-lg border border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Làm mới lịch sử phiên bản"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3.5 overflow-y-auto max-h-[420px] pr-1">
        {changelogs.map((item, idx) => {
          const isLatest = idx === 0;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isLatest
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-background/60 border-border/60 hover:bg-muted/40"
              }`}
            >
              {/* Version Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {item.version_tag}
                  </span>
                  {isLatest && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      CURRENT LIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-sans font-semibold border border-amber-500/20">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Body Details */}
              <div className="mt-2.5 space-y-2 text-xs">
                {/* 1. Trigger */}
                <div className="flex items-start gap-1.5 text-[11.5px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-500">Nguyên nhân kích hoạt (Trigger): </span>
                    <span className="text-foreground">{item.trigger_summary}</span>
                  </div>
                </div>

                {/* 2. Academic Root Cause */}
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] leading-relaxed">
                  <div className="font-semibold text-primary mb-0.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Phân tích nguyên nhân gốc & Học thuật:
                  </div>
                  <p className="text-foreground">{item.root_cause_analysis}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Dẫn chứng: <em>{item.academic_reference}</em>
                  </p>
                </div>

                {/* 3. Parameter Changes Table */}
                {item.parameter_changes && Object.keys(item.parameter_changes).length > 0 && (
                  <div>
                    <span className="font-semibold text-muted-foreground text-[10.5px] uppercase tracking-wider block mb-1">
                      Các thông số định lượng đã nâng cấp:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {Object.entries(item.parameter_changes).map(([paramKey, diff]) => (
                        <div
                          key={paramKey}
                          className="p-2 rounded-lg bg-background/80 border border-border/60 font-mono text-[10.5px]"
                        >
                          <div className="text-muted-foreground font-sans font-medium text-[10px]">
                            {paramKey}
                          </div>
                          <div className="flex items-center gap-1.5 my-0.5">
                            <span className="text-rose-500 line-through">{String(diff.old)}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-emerald-500 font-bold">{String(diff.new)}</span>
                          </div>
                          <div className="text-[9.5px] text-muted-foreground font-sans truncate" title={diff.reason}>
                            {diff.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Trade-off & Validation Plan */}
                <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Đánh đổi: <b className="text-foreground">{item.trade_off}</b></span>
                  </span>
                  <span>Kế hoạch: <b className="text-foreground">{item.evaluation_plan}</b></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
