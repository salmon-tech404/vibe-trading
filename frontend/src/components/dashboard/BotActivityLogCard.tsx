import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Download, Trash2, Bot, Zap } from "lucide-react";
import { botLogger, type BotLogEntry } from "@/lib/botLogger";
import { safeGet } from "@/lib/storage";
import { toast } from "sonner";

const MODEL_NAMES: Record<string, string> = {
  "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet",
  "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
  "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
  "claude-3-opus-latest": "Claude 3 Opus",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "o3-mini": "o3-mini (Reasoning)",
  "o1": "o1 (Reasoning)",
  "o1-mini": "o1-mini",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
  "deepseek-chat": "DeepSeek V3",
  "deepseek-reasoner": "DeepSeek R1",
};

export function BotActivityLogCard() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<BotLogEntry[]>(() => botLogger.getLogs());
  const logContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);

  // Active Bot LLM Model & Strategy State
  const [activeModel, setActiveModel] = useState<string>(() => safeGet("qa-bot-llm-model") || "claude-3-7-sonnet-latest");
  const [activeStrategy, setActiveStrategy] = useState<string>(() => safeGet("qa-bot-strategy-mode") || "scalping");

  useEffect(() => {
    const handleUpdate = () => {
      setActiveModel(safeGet("qa-bot-llm-model") || "claude-3-7-sonnet-latest");
      setActiveStrategy(safeGet("qa-bot-strategy-mode") || "scalping");
    };

    window.addEventListener("qa-bot-llm-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("qa-bot-llm-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    return botLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
  }, []);

  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (isNearBottom || !userScrolledUpRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledUpRef.current = !isNearBottom;
  };

  const handleExportCsv = () => {
    if (logs.length === 0) {
      toast.info("Không có dữ liệu log để xuất.");
      return;
    }
    const headers = ["Timestamp", "Level", "Category", "Message"];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.level}"`,
      `"${l.category}"`,
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bot_activity_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file log CSV thành công!");
  };

  const handleExportTxt = () => {
    if (logs.length === 0) {
      toast.info("Không có dữ liệu log để xuất.");
      return;
    }
    const txtContent = logs
      .map((l) => `${formatLogTime(l.timestamp)} [${l.level.toUpperCase()}] [${l.category}] ${l.message}`)
      .join("\n");
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bot_activity_logs_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file log TXT thành công!");
  };

  const handleClearLogs = () => {
    botLogger.clear();
    setLogs([]);
    toast.info("Đã xóa nhật ký hoạt động.");
  };

  const formatLogTime = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `[${hh}:${mm}:${ss}]`;
    } catch {
      return `[${ts}]`;
    }
  };

  const friendlyModelName = MODEL_NAMES[activeModel] || activeModel;

  return (
    <div className="h-full bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-3 shadow-xs flex flex-col justify-between overflow-hidden space-y-1.5">
      {/* Header + Active Model Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shrink-0 border-b border-border/60 pb-1.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
              {t("dashboard.botActivityLog")}
              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                ({logs.length})
              </span>
            </h2>
          </div>

          {/* Active AI Model & Strategy Badge Strip Under Title */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground pl-0.5 pt-0.5">
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold truncate max-w-[220px]">
              <Bot className="w-2.5 h-2.5 shrink-0" />
              {friendlyModelName}
            </span>

            <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded font-bold border ${
              activeStrategy === "scalping"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
            }`}>
              <Zap className="w-2.5 h-2.5 shrink-0" />
              {activeStrategy === "scalping" ? "Scalping (1 Target Exit)" : "Multi-TP Trend (Trailing)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-medium border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center gap-1 cursor-pointer"
            title="Xuất file nhật ký định dạng CSV"
          >
            <Download className="w-2.5 h-2.5" />
            <span>Xuất CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportTxt}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-medium border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center gap-1 cursor-pointer"
            title="Xuất file nhật ký định dạng văn bản TXT"
          >
            <Download className="w-2.5 h-2.5" />
            <span>Xuất TXT</span>
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            title="Xóa nhật ký"
            className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-[100px] overflow-y-auto bg-black/90 dark:bg-black/80 rounded-lg p-2 font-mono text-[10px] leading-relaxed border border-border/60 text-slate-300 space-y-0.5 select-text scrollbar-thin"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-[11px]">
            No activity logs recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            let levelColor = "text-cyan-400";
            if (log.level === "WARN") levelColor = "text-amber-400";
            if (log.level === "ERROR") levelColor = "text-rose-400";
            if (log.level === "TRADE") levelColor = "text-emerald-400";

            return (
              <div key={log.id} className="flex items-start gap-1 hover:bg-white/5 px-1 py-0.5 rounded transition">
                <span className="text-slate-500 shrink-0 select-none">
                  {formatLogTime(log.timestamp)}
                </span>
                <span className={`font-bold shrink-0 ${levelColor}`}>
                  {log.level}
                </span>
                <span className="text-slate-400 shrink-0">
                  [{log.category}]
                </span>
                <span className="text-slate-200 break-all">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
