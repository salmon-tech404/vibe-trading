import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  Flame,
  Zap,
  Star,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Radio,
  Sparkles,
  ShieldCheck,
  Target,
  Power,
  Info,
} from "lucide-react";
import { fetchAllUsdtTickers, fetchKlinesMultiTimeframe, computeQuantSignals, type BinanceTicker } from "@/lib/binance";
import { useWatchlistStore } from "@/lib/watchlistStore";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { toast } from "sonner";

type FilterMode = "high_score" | "buy_signals" | "tp_signals" | "gainers" | "volume" | "all";

interface TokenSignalState {
  symbol: string;
  signal: "buy" | "sell" | "take_profit" | "neutral";
  score: number;
  quality: "STRONG" | "WATCH" | "IGNORE";
  reason: string;
  exitTier: 0 | 1 | 2 | 3 | 4;
  lastPrice: number;
}

export function Screener() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tickers, setTickers] = useState<BinanceTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("high_score");
  const [searchFilter, setSearchFilter] = useState("");
  const [newSymbolInput, setNewSymbolInput] = useState("");
  const [signalsMap, setSignalsMap] = useState<Record<string, TokenSignalState>>({});
  const [isScanning, setIsScanning] = useState(false);

  const { symbols: watchlist, addSymbol, removeSymbol, hasSymbol } = useWatchlistStore();
  const { isSystemActive, toggleSystemActive } = useBinanceFuturesStore();

  const handleToggleSystem = () => {
    toggleSystemActive();
    if (isSystemActive) {
      toast.error("Hệ thống đã chuyển sang System OFF (Đã ngắt toàn bộ API kết nối đến Binance)");
    } else {
      toast.success("Hệ thống đã chuyển sang System ON (Đã kích hoạt lại kết nối API Binance)");
    }
  };

  // 1. Fetch Market 24hr Tickers
  const loadMarket = useCallback(async () => {
    if (!isSystemActive) {
      setTickers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchAllUsdtTickers();
    setTickers(data);
    setLoading(false);
  }, [isSystemActive]);

  useEffect(() => {
    if (!isSystemActive) {
      setTickers([]);
      return;
    }
    loadMarket();
    const timer = window.setInterval(loadMarket, 10000);
    return () => clearInterval(timer);
  }, [isSystemActive, loadMarket]);

  // 2. Multi-Timeframe Quant Scanner (5m + 1h)
  const scanAllSignals = useCallback(async () => {
    if (tickers.length === 0) return;
    setIsScanning(true);

    const topGainers = [...tickers].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 25).map((t) => t.symbol);
    const topVolume = [...tickers].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 15).map((t) => t.symbol);
    const uniqueSymbols = Array.from(new Set([...topGainers, ...topVolume, ...watchlist])).slice(0, 40);

    const results: Record<string, TokenSignalState> = {};
    const batchSize = 6;

    for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
      const batch = uniqueSymbols.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (sym) => {
          try {
            const { primaryBars, htfBars } = await fetchKlinesMultiTimeframe(sym, "5m", "1h", 60);
            if (primaryBars.length >= 20) {
              const quant = computeQuantSignals(primaryBars, htfBars);
              const lastSig = quant.signals.length > 0 ? quant.signals[quant.signals.length - 1] : null;
              results[sym] = {
                symbol: sym,
                signal: quant.currentSignal,
                score: quant.currentSetupScore.totalScore,
                quality: quant.currentSetupScore.quality,
                reason: lastSig?.reason || (quant.efficiencyRatio > 0.35 ? "1H Trend + Volume Inflow" : "Range Accumulation"),
                exitTier: quant.exitTier,
                lastPrice: primaryBars[primaryBars.length - 1].close,
              };
            }
          } catch {
            // ignore error
          }
        })
      );
    }

    setSignalsMap((prev) => ({ ...prev, ...results }));
    setIsScanning(false);
  }, [tickers, watchlist]);

  useEffect(() => {
    if (tickers.length > 0) {
      scanAllSignals();
      const scanTimer = window.setInterval(scanAllSignals, 12000);
      return () => clearInterval(scanTimer);
    }
  }, [tickers.length, scanAllSignals]);

  // 3. Filter and Sort Market Data
  const displayedTickers = useMemo(() => {
    let list = [...tickers];

    if (searchFilter.trim()) {
      const q = searchFilter.toUpperCase();
      list = list.filter((t) => t.symbol.includes(q) || t.baseAsset.includes(q));
    }

    if (filterMode === "high_score") {
      // Prioritize tokens with Setup Score >= 65
      list.sort((a, b) => {
        const scoreA = signalsMap[a.symbol]?.score ?? (a.priceChangePercent > 10 ? 70 : 40);
        const scoreB = signalsMap[b.symbol]?.score ?? (b.priceChangePercent > 10 ? 70 : 40);
        return scoreB - scoreA;
      });
    } else if (filterMode === "buy_signals") {
      list = list.filter((t) => signalsMap[t.symbol]?.signal === "buy" || t.priceChangePercent > 10);
      list.sort((a, b) => {
        const scoreA = signalsMap[a.symbol]?.score ?? 50;
        const scoreB = signalsMap[b.symbol]?.score ?? 50;
        return scoreB - scoreA;
      });
    } else if (filterMode === "tp_signals") {
      list = list.filter((t) => signalsMap[t.symbol]?.signal === "take_profit" || (signalsMap[t.symbol]?.exitTier ?? 0) >= 1 || t.priceChangePercent > 20);
      list.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    } else if (filterMode === "gainers") {
      list.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    } else if (filterMode === "volume") {
      list.sort((a, b) => b.quoteVolume - a.quoteVolume);
    }

    return list.slice(0, 50);
  }, [tickers, filterMode, searchFilter, signalsMap]);

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbolInput.trim()) return;
    let s = newSymbolInput.trim().toUpperCase();
    if (!s.endsWith("USDT")) s += "USDT";
    addSymbol(s);
    setNewSymbolInput("");
  };

  const handleOpenChart = (sym: string) => {
    navigate(`/?symbol=${sym}`);
  };

  const totalHighScoreCount = useMemo(() => {
    return Object.values(signalsMap).filter((s) => s.score >= 75).length;
  }, [signalsMap]);

  const totalBuyCount = useMemo(() => {
    return Object.values(signalsMap).filter((s) => s.signal === "buy").length;
  }, [signalsMap]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] bg-background text-foreground overflow-hidden">
      {/* ========================================================================= */}
      {/* LEFT SECTION: LIVE QUANT RADAR */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col border-r overflow-hidden min-w-0">
        {/* Screener Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b bg-card/40 backdrop-blur">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>{t("screener.title")}</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border text-xs flex-wrap gap-0.5">
              <button
                onClick={() => setFilterMode("high_score")}
                className={`flex items-center gap-1 px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "high_score" ? "bg-primary text-primary-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("screener.highScore")} (≥75)</span>
                {totalHighScoreCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                    {totalHighScoreCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterMode("buy_signals")}
                className={`flex items-center gap-1 px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "buy_signals" ? "bg-emerald-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t("screener.buySignals")}</span>
                {totalBuyCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                    {totalBuyCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterMode("tp_signals")}
                className={`flex items-center gap-1 px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "tp_signals" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t("screener.takeProfit")}</span>
              </button>

              <button
                onClick={() => setFilterMode("gainers")}
                className={`flex items-center gap-1 px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "gainers" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {t("screener.gainers")}
              </button>

              <button
                onClick={() => setFilterMode("volume")}
                className={`flex items-center gap-1 px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "volume" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                {t("screener.volume")}
              </button>

              <button
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  filterMode === "all" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("screener.all")}
              </button>
            </div>
          </div>

          {/* Search Filter & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("actions.searchPlaceholder")}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none w-32 sm:w-40 uppercase font-medium"
              />
            </div>

            <button
              onClick={() => {
                loadMarket();
                scanAllSignals();
              }}
              title={t("actions.refresh")}
              aria-label={t("actions.refresh")}
              className="p-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-muted-foreground transition flex items-center gap-1 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning || loading ? "animate-spin text-primary" : ""}`} />
            </button>

            {/* Master API Killswitch: System ON / System OFF with Tooltip */}
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
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-snug">{t("dashboard.systemTooltip")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screener Table */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px] sm:min-w-full">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur border-b text-muted-foreground uppercase text-[11px] font-mono z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t("screener.symbol")}</th>
                <th className="py-2.5 px-3 text-right font-semibold">{t("screener.price")}</th>
                <th className="py-2.5 px-3 text-right font-semibold">{t("screener.change24h")}</th>
                <th className="py-2.5 px-3 text-center font-semibold">{t("signals.setupScore")}</th>
                <th className="py-2.5 px-4 text-left font-semibold">{t("signals.strategySignal")}</th>
                <th className="py-2.5 px-3 text-left hidden md:table-cell font-semibold">{t("runDashboard.colReason")}</th>
                <th className="py-2.5 px-3 text-center font-semibold">{t("nav.watchlist")}</th>
                <th className="py-2.5 px-4 text-right font-semibold">{t("nav.charts")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {displayedTickers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground font-sans font-normal">
                    {isScanning ? t("screener.scanInProgress") : t("charts.noPriceData")}
                  </td>
                </tr>
              ) : (
                displayedTickers.map((tItem) => {
                  const isPos = tItem.priceChangePercent >= 0;
                  const isFav = hasSymbol(tItem.symbol);
                  const sigInfo = signalsMap[tItem.symbol];
                  const curScore = sigInfo?.score ?? (tItem.priceChangePercent > 12 ? 75 : 45);
                  const curSig = sigInfo?.signal || (tItem.priceChangePercent > 12 ? "buy" : "neutral");
                  const curTier = sigInfo?.exitTier ?? 0;
                  const reason = sigInfo?.reason || (tItem.priceChangePercent > 15 ? "Strong Flow Breakout" : "Consolidation");

                  return (
                    <tr
                      key={tItem.symbol}
                      onClick={() => handleOpenChart(tItem.symbol)}
                      className="hover:bg-muted/40 transition cursor-pointer group"
                    >
                      {/* 1. Symbol */}
                      <td className="py-2.5 px-4 flex items-center gap-2">
                        <span className="text-foreground text-sm font-sans font-semibold">{tItem.baseAsset}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">PERP</span>
                      </td>

                      {/* 2. Price */}
                      <td className="py-2.5 px-3 text-right font-medium">
                        ${tItem.lastPrice >= 1 ? tItem.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : tItem.lastPrice}
                      </td>

                      {/* 3. 24h Change */}
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-flex items-center font-medium px-2 py-0.5 rounded ${isPos ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                          {isPos ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                          {Math.abs(tItem.priceChangePercent).toFixed(2)}%
                        </span>
                      </td>

                      {/* 4. Setup Score (0 - 100) */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          curScore >= 75 ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40" : curScore >= 60 ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-muted text-muted-foreground"
                        }`}>
                          {curScore >= 75 && <Sparkles className="w-3 h-3 text-emerald-500" />}
                          {curScore}
                        </span>
                      </td>

                      {/* 5. POSITION & EXIT STATUS BADGE */}
                      <td className="py-2.5 px-4">
                        {curTier >= 2 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-500 shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Breakeven Active</span>
                          </span>
                        ) : curTier === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 shadow-xs">
                            <Target className="w-3.5 h-3.5" />
                            <span>TP 1 (1.5R)</span>
                          </span>
                        ) : curSig === "buy" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 shadow-xs">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>{t("signals.longSignal")}</span>
                          </span>
                        ) : curSig === "take_profit" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-500 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t("screener.takeProfit")}</span>
                          </span>
                        ) : curSig === "sell" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-500 shadow-xs">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>{t("signals.shortSignal")}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-sans font-normal">—</span>
                        )}
                      </td>

                      {/* 6. QUANT REASON */}
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] font-sans hidden md:table-cell font-normal">
                        {reason}
                      </td>

                      {/* 7. Watchlist Toggle */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => (isFav ? removeSymbol(tItem.symbol) : addSymbol(tItem.symbol))}
                          title={isFav ? t("actions.removeWatchlist") : t("actions.addWatchlist")}
                          aria-label={isFav ? t("actions.removeWatchlist") : t("actions.addWatchlist")}
                          className={`p-1 rounded transition cursor-pointer ${
                            isFav ? "text-amber-500 hover:bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-500" : ""}`} />
                        </button>
                      </td>

                      {/* 8. Action Button */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChart(tItem.symbol);
                          }}
                          className="p-1 px-2.5 rounded-md border bg-card hover:bg-primary hover:text-primary-foreground text-muted-foreground transition inline-flex items-center gap-1 text-[11px] font-sans font-medium shadow-xs cursor-pointer"
                        >
                          <BarChart2 className="w-3 h-3" />
                          <span>{t("nav.charts")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: USER CUSTOM WATCHLIST & LIVE SCANNER */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-96 flex flex-col bg-card/10 overflow-hidden">
        {/* Watchlist Header */}
        <div className="p-3.5 border-b bg-card/40 backdrop-blur">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-sm tracking-tight">{t("nav.watchlist")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-primary animate-ping" : "bg-emerald-500"}`} />
              <span>{isScanning ? t("screener.scanInProgress") : t("bot.connected")}</span>
            </div>
          </div>

          {/* Quick Add Symbol Input */}
          <form onSubmit={handleAddWatchlist} className="flex gap-2">
            <input
              type="text"
              placeholder={t("screener.addCustomSymbol")}
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none uppercase font-semibold"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("common.add") || "Add"}
            </button>
          </form>
        </div>

        {/* Watchlist Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground font-sans">
              {t("charts.noPriceData")}
            </div>
          ) : (
            watchlist.map((sym) => {
              const ticker = tickers.find((tItem) => tItem.symbol === sym);
              const sigState = signalsMap[sym];
              const price = ticker?.lastPrice ?? sigState?.lastPrice ?? 0;
              const change = ticker?.priceChangePercent ?? 0;
              const isPos = change >= 0;
              const curSig = sigState?.signal ?? (change > 10 ? "buy" : "neutral");
              const score = sigState?.score ?? (change > 10 ? 75 : 45);

              return (
                <div
                  key={sym}
                  onClick={() => handleOpenChart(sym)}
                  className="p-3 rounded-xl border bg-card/60 hover:border-primary/50 transition cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{sym.replace("USDT", "")}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono">PERP</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold">{score}</span>
                    </div>

                    {/* Signal Status Badge */}
                    <div className="flex items-center">
                      {curSig === "buy" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          <span>{t("signals.longSignal")}</span>
                        </span>
                      )}
                      {curSig === "take_profit" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{t("screener.takeProfit")}</span>
                        </span>
                      )}
                      {curSig === "sell" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-rose-500" />
                          <span>{t("signals.shortSignal")}</span>
                        </span>
                      )}
                      {curSig === "neutral" && (
                        <span className="text-[10px] text-muted-foreground font-mono font-normal">—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-foreground">
                      ${price >= 1 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : price}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className={`font-semibold flex items-center gap-0.5 ${isPos ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(change).toFixed(2)}%
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSymbol(sym);
                        }}
                        title={t("actions.removeWatchlist")}
                        aria-label={t("actions.removeWatchlist")}
                        className="text-muted-foreground hover:text-rose-500 transition p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
