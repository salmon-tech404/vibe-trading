import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  FlaskConical,
  HelpCircle,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  Power,
  Info,
  Sliders,
} from "lucide-react";
import { useStrategyLabStore } from "@/lib/strategyLabStore";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { toast } from "sonner";
import { StrategyChangelogTimeline } from "@/components/strategy-lab/StrategyChangelogTimeline";

export function StrategyLab() {
  const { t } = useTranslation();
  const {
    activeMode,
    liveBalance,
    availableBalance,
    isSystemActive,
    toggleSystemActive,
  } = useBinanceFuturesStore();

  const {
    strategies,
    reflections,
    liveReasoning,
    selectedStrategyId,
    setSelectedStrategyId,
    searchQuery,
    setSearchQuery,
    filterOutcome,
    setFilterOutcome,
  } = useStrategyLabStore();

  const isTestnet = activeMode === "testnet";
  const displayBalance = liveBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayAvailable = availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleToggleSystem = () => {
    toggleSystemActive();
    if (isSystemActive) {
      toast.error("Hệ thống đã chuyển sang System OFF (Đã ngắt toàn bộ API kết nối đến Binance)");
    } else {
      toast.success("Hệ thống đã chuyển sang System ON (Đã kích hoạt lại kết nối API Binance)");
    }
  };

  const filteredReflections = reflections.filter((ref) => {
    const matchesSearch = ref.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.strategyName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterOutcome === "win") return ref.pnlUsd > 0;
    if (filterOutcome === "loss") return ref.pnlUsd < 0;
    return true;
  });

  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0];

  return (
    <div className="min-h-screen bg-background text-foreground select-none pb-8">
      {/* Constrained Centered Container */}
      <div className="max-w-[1600px] mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER STRIP */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/80 backdrop-blur-md px-4 py-3 rounded-xl border border-border/70 shadow-xs">
          {/* Title & Help Tooltip */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {t("dashboard.strategyLab", "Strategy Lab")}
                </h1>
                {/* Tooltip Icon */}
                <div className="relative group">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-2.5 bg-popover/95 backdrop-blur-md text-popover-foreground text-xs rounded-lg shadow-xl border border-border/80 pointer-events-none transition-all">
                    <p className="font-semibold text-primary mb-1">Strategy Lab & AI Intelligence</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t("dashboard.strategyLabTooltip")}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Quantitative intelligence, AI live reasoning & continuous strategy evolution
              </p>
            </div>

            {/* Master Killswitch Button */}
            <div className="relative group ml-2">
              <button
                type="button"
                onClick={handleToggleSystem}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border shadow-xs ${
                  isSystemActive
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 animate-pulse"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isSystemActive ? t("dashboard.systemOn", "System ON") : t("dashboard.systemOff", "System OFF")}</span>
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

          {/* Right: Balances Pill & Navigation Link */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-background/80 rounded-lg border border-border/80 text-xs font-mono shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-sans text-[11px]">
                  {isTestnet ? "Testnet Balance:" : "Live Balance:"}
                </span>
                <span className="font-bold text-emerald-500">
                  ${displayBalance}
                </span>
              </div>
              <div className="w-[1px] h-3 bg-border/80" />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-sans text-[11px]">
                  Available:
                </span>
                <span className="font-semibold text-foreground">
                  ${displayAvailable}
                </span>
              </div>
            </div>

            <Link
              to="/tracker"
              className="px-3 py-1.5 rounded-lg border bg-muted/50 hover:bg-muted text-xs font-medium transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Bot Monitor</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP SECTION: LIVE ANALYSIS STREAM & STRATEGY PERFORMANCE */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* 2A. Live Analysis Stream (5 cols) */}
          <div className="lg:col-span-5 bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-4 shadow-xs flex flex-col justify-between">
            {/* Card Header with Tooltip */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("dashboard.liveAnalysis", "Live Analysis")}
                </h2>
                
                {/* Tooltip Icon */}
                <div className="relative group">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
                    {t("dashboard.liveAnalysisTooltip")}
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-time Stream
              </span>
            </div>

            {/* Live Steps Stream */}
            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {liveReasoning.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-border/80 rounded-lg text-muted-foreground space-y-2">
                  <Activity className="w-6 h-6 text-muted-foreground/60 animate-pulse" />
                  <p className="text-xs font-medium text-foreground">Đang kết nối luồng quét thị trường thời gian thực...</p>
                  <p className="text-[11px] text-muted-foreground/80">Bật <strong className="text-primary">Bot Trading: ON</strong> trên Header để nhận dòng phân tích trực tiếp từ sàn Binance.</p>
                </div>
              ) : (
                liveReasoning.map((step) => {
                  const isLong = step.decision === "LONG";
                  const isShort = step.decision === "SHORT";

                  return (
                    <div
                      key={step.id}
                      className="p-3 rounded-lg bg-background/60 border border-border/60 text-xs space-y-1.5 hover:border-primary/40 transition"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{step.symbol}</span>
                          <span className="text-muted-foreground text-[10px]">{step.timestamp}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            isLong
                              ? "bg-emerald-500/15 text-emerald-500"
                              : isShort
                              ? "bg-rose-500/15 text-rose-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step.decision}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                        <span>Regime: <strong className="text-foreground">{step.marketRegime}</strong></span>
                        <span>ER: <strong className="text-foreground font-mono">{step.efficiencyRatio}</strong></span>
                        <span>Score: <strong className="text-foreground font-mono">{step.score}/100</strong></span>
                      </div>

                      <p className="text-[11.5px] leading-relaxed text-foreground font-sans">
                        {step.reasoning}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2B. Strategy Performance Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-4 shadow-xs flex flex-col justify-between">
            {/* Card Header with Tooltip */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("dashboard.strategyPerformance", "Strategy Performance")}
                </h2>
                
                {/* Tooltip Icon */}
                <div className="relative group">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
                    {t("dashboard.strategyPerformanceTooltip")}
                  </div>
                </div>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {strategies.length} active models
              </span>
            </div>

            {/* Strategy Table / Grid */}
            <div className="mt-3 overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] text-muted-foreground font-medium">
                    <th className="pb-2 font-medium">Strategy</th>
                    <th className="pb-2 font-medium">Regime</th>
                    <th className="pb-2 text-right font-medium">Win Rate</th>
                    <th className="pb-2 text-right font-medium">Profit Factor</th>
                    <th className="pb-2 text-right font-medium">Trades</th>
                    <th className="pb-2 text-center font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {strategies.map((strat) => {
                    const isSelected = strat.id === selectedStrategy.id;

                    return (
                      <tr
                        key={strat.id}
                        onClick={() => setSelectedStrategyId(strat.id)}
                        className={`hover:bg-muted/40 transition cursor-pointer ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-2.5 pr-2 font-sans font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            <span>{strat.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-[11px] text-muted-foreground font-sans">
                          {strat.category}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-500">
                          {strat.winRate}%
                        </td>
                        <td className="py-2.5 text-right font-bold text-foreground">
                          {strat.profitFactor}x
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {strat.totalTrades}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              strat.status === "Verified"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : strat.status === "Active"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {strat.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${strat.confidenceScore * 100}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px]">
                              {Math.round(strat.confidenceScore * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM SECTION: TRADE ANALYSIS & QUANT KNOWLEDGE CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* 3A. Trade Analysis & Post-Mortem (7 cols) */}
          <div className="lg:col-span-7 bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-4 shadow-xs flex flex-col justify-between">
            {/* Card Header with Filters & Tooltip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("dashboard.tradeAnalysis", "Trade Analysis")}
                </h2>
                
                {/* Tooltip Icon */}
                <div className="relative group">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
                    {t("dashboard.tradeAnalysisTooltip")}
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterOutcome("all")}
                    className={`px-2 py-0.5 rounded transition ${
                      filterOutcome === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({reflections.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOutcome("win")}
                    className={`px-2 py-0.5 rounded transition ${
                      filterOutcome === "win" ? "bg-emerald-500 text-white shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Wins
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOutcome("loss")}
                    className={`px-2 py-0.5 rounded transition ${
                      filterOutcome === "loss" ? "bg-rose-500 text-white shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Losses
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-6 pr-2 py-0.5 text-xs rounded-md border bg-background outline-none focus:ring-1 focus:ring-primary w-28 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* List of Reflections */}
            <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {filteredReflections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-center p-4 border border-dashed border-border/80 rounded-lg text-muted-foreground space-y-2">
                  <Sparkles className="w-6 h-6 text-muted-foreground/60" />
                  <p className="text-xs font-medium text-foreground">Chưa có dữ liệu đánh giá giao dịch hoàn tất</p>
                  <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                    Hệ thống sẽ tự động ghi nhận nhật ký chi tiết và phân tích chẩn đoán (Post-Mortem) ngay khi có vị thế đóng thực tế trên sàn Binance.
                  </p>
                </div>
              ) : (
                filteredReflections.map((ref) => {
                  const isWin = ref.pnlUsd >= 0;

                  return (
                    <div
                      key={ref.id}
                      className="p-3 rounded-lg bg-background/60 border border-border/60 text-xs space-y-2 hover:border-border transition"
                    >
                      {/* Header line */}
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{ref.symbol}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              ref.direction === "LONG" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {ref.direction}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{ref.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground font-sans">
                            {ref.strategyName}
                          </span>
                          <span className={`font-bold text-sm ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                            {isWin ? "+" : ""}${ref.pnlUsd.toFixed(2)} ({isWin ? "+" : ""}{ref.roiPct}%)
                          </span>
                        </div>
                      </div>

                      {/* Entry Reason */}
                      <div className="text-[11.5px] leading-relaxed">
                        <span className="text-muted-foreground font-medium">Entry Logic: </span>
                        <span className="text-foreground">{ref.entryReason}</span>
                      </div>

                      {/* Diagnosis Box */}
                      <div
                        className={`p-2 rounded-md text-[11px] leading-relaxed border ${
                          isWin
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-300"
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          {isWin ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-semibold text-foreground">
                              {isWin ? "Execution Outcome" : "AI Reflection & Diagnosis"}
                            </p>
                            <p>{ref.postMortemDiagnosis}</p>
                            <p className="mt-1 font-medium text-foreground">
                              Action: <span className="font-normal">{ref.actionTaken}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3B. Quant Knowledge Base Explorer (5 cols) */}
          <div className="lg:col-span-5 bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-4 shadow-xs flex flex-col justify-between">
            {/* Card Header with Tooltip */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("dashboard.knowledgeBase", "Knowledge Base")}
                </h2>
                
                {/* Tooltip Icon */}
                <div className="relative group">
                  <button type="button" className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
                    {t("dashboard.knowledgeBaseTooltip")}
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono text-primary font-bold">
                {selectedStrategy.id}
              </span>
            </div>

            {/* Selected Card Deep Dive */}
            <div className="mt-3 p-3.5 rounded-lg bg-background/60 border border-border/60 text-xs space-y-3 flex-1 overflow-y-auto max-h-[380px]">
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                  Strategy Name
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  {selectedStrategy.name}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Source: {selectedStrategy.author} — <em>{selectedStrategy.bookTitle}</em>
                </p>
              </div>

              <div className="p-2.5 rounded bg-muted/40 border border-border/40 text-[11px] leading-relaxed">
                <span className="font-semibold text-primary">Core Hypothesis: </span>
                <span className="text-foreground">{selectedStrategy.coreHypothesis}</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="font-semibold text-muted-foreground">Market Regime: </span>
                  <span className="font-mono text-foreground font-bold">{selectedStrategy.marketRegime}</span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground">Entry Rule: </span>
                  <span className="text-foreground">{selectedStrategy.entryRule}</span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground">Exit Rule: </span>
                  <span className="text-foreground">{selectedStrategy.exitRule}</span>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground">Risk Rule: </span>
                  <span className="text-foreground">{selectedStrategy.riskRule}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                <span>Confidence: <strong className="text-primary">{Math.round(selectedStrategy.confidenceScore * 100)}%</strong></span>
                <span>Win Rate: <strong className="text-emerald-500">{selectedStrategy.winRate}%</strong></span>
                <span>Profit Factor: <strong className="text-foreground">{selectedStrategy.profitFactor}x</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. AUTONOMOUS STRATEGY EVOLUTION & VERSION CHANGELOG TIMELINE             */}
        {/* ========================================================================= */}
        <StrategyChangelogTimeline />

      </div>
    </div>
  );
}
