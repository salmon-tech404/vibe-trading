import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, ExternalLink, Info, AlertTriangle, ShieldCheck, Zap, Power } from "lucide-react";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { botLogger } from "@/lib/botLogger";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onToggleMode?: (mode: "testnet" | "mainnet") => void;
}

export function DashboardHeader({ onToggleMode }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const {
    activeMode,
    setActiveMode,
    liveBalance,
    availableBalance,
    autoTradingEnabled,
    setAutoTradingConfig,
    isSystemActive,
    toggleSystemActive,
  } = useBinanceFuturesStore();

  const handleModeChange = (mode: "testnet" | "mainnet") => {
    setActiveMode(mode);
    onToggleMode?.(mode);
    toast.info(`Đã chuyển sang môi trường ${mode === "testnet" ? "Testnet (Demo)" : "Live Trading (Mainnet)"}`);
  };

  const handleToggleAutoBot = () => {
    const nextState = !autoTradingEnabled;
    setAutoTradingConfig({ enabled: nextState });
    if (nextState) {
      botLogger.info("SYSTEM", "Bot Auto-Trading AI Scanner đã BẬT — Đang bắt đầu chu kỳ quét thị trường định lượng thời gian thực trên sàn Binance.");
      toast.success("Đã BẬT Bot Auto-Trading AI Scanner!");
    } else {
      botLogger.info("SYSTEM", "Bot Auto-Trading đã TẮT — Đã tạm dừng các chu kỳ quét và vào lệnh tự động.");
      toast.info("Đã TẮT Bot Auto-Trading.");
    }
  };

  const handleToggleSystem = () => {
    toggleSystemActive();
    if (isSystemActive) {
      toast.error("Hệ thống đã chuyển sang System OFF (Đã ngắt toàn bộ API kết nối đến Binance)");
    } else {
      toast.success("Hệ thống đã chuyển sang System ON (Đã kích hoạt lại kết nối API Binance)");
    }
  };

  const isTestnet = activeMode === "testnet";

  // Real balance formatting from Binance API
  const displayBalance = liveBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayAvailable = availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-2 shrink-0">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/70 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-border/70 shadow-xs">
        {/* Left Branding & System ON/OFF Switch */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                {t("dashboard.title")}
              </h1>
            </div>
            <p className="text-[10.5px] text-muted-foreground font-medium">
              {t("dashboard.subtitle")}
            </p>
          </div>

          {/* Master API Killswitch: System ON / System OFF with Tooltip right in the top left */}
          <div className="relative group ml-1">
            <button
              type="button"
              onClick={handleToggleSystem}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border shadow-xs ${
                isSystemActive
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 animate-pulse"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isSystemActive ? t("dashboard.systemOn") : t("dashboard.systemOff")}</span>
            </button>

            {/* Tooltip on hover */}
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{t("dashboard.systemTooltip")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls: Auto-Bot Toggle + Mode Switcher + Balances Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Bot Auto-Trading Switch Button (Always 1 single line) */}
          <button
            type="button"
            onClick={handleToggleAutoBot}
            className={`whitespace-nowrap flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border select-none ${
              autoTradingEnabled
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "bg-muted/60 border-border/70 text-muted-foreground hover:text-foreground"
            }`}
            title="Bật/Tắt Bot Tự động quét & vào lệnh"
          >
            <Power className={`w-3.5 h-3.5 shrink-0 ${autoTradingEnabled ? "animate-pulse" : ""}`} />
            <span className="whitespace-nowrap">Bot Trading: {autoTradingEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Mode Switcher Badges (Testnet vs Live) with comfortable width and no truncation */}
          <div className="grid grid-cols-2 w-[304px] p-0.5 bg-muted/60 rounded-lg border border-border/70 shadow-inner">
            <button
              type="button"
              onClick={() => handleModeChange("testnet")}
              title={t("order.testnetTooltip")}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
                isTestnet
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span className="flex items-center justify-center w-2 h-2 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${isTestnet ? "bg-white animate-pulse" : "bg-muted-foreground/40"}`} />
              </span>
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t("dashboard.testnetMode")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("mainnet")}
              title={t("order.mainnetTooltip")}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
                !isTestnet
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span className="flex items-center justify-center w-2 h-2 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${!isTestnet ? "bg-white animate-pulse" : "bg-muted-foreground/40"}`} />
              </span>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t("dashboard.liveTrading")}</span>
            </button>
          </div>

          {/* Balances Pill with stable layout and tabular figures */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-background/80 rounded-lg border border-border/80 text-xs font-mono shadow-xs shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-muted-foreground font-sans font-medium text-[10.5px] whitespace-nowrap">
                {isTestnet ? "Ví Demo:" : "Ví Thật:"}
              </span>
              <span className="font-bold text-emerald-500 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                ${displayBalance}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-border/80 shrink-0" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-muted-foreground font-sans font-medium text-[10.5px] whitespace-nowrap">
                Khả dụng:
              </span>
              <span className="font-semibold text-foreground tabular-nums whitespace-nowrap">
                ${displayAvailable}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Status Banner */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          isTestnet
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
            : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
        }`}
      >
        <div className="flex items-center gap-2">
          {isTestnet ? (
            <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          )}
          <span className="text-[11px] sm:text-xs">
            {isTestnet
              ? t("dashboard.testnetBanner")
              : t("dashboard.liveBanner")}
          </span>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 hover:opacity-80 transition cursor-pointer shrink-0"
        >
          {t("dashboard.apiKeys")}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
