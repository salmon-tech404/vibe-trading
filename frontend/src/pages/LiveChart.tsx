import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, RefreshCw, Star, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Power, Info } from "lucide-react";
import { echarts } from "@/lib/echarts";
import {
  fetchAllUsdtTickers,
  fetchKlines,
  fetchKlinesMultiTimeframe,
  subscribeKlineWebSocket,
  computeQuantSignals,
  type BinanceTicker,
  type QuantAnalysisResult,
  type KlineBar,
} from "@/lib/binance";
import { calculatePositionRisk, type PositionRiskPlan } from "@/lib/riskEngine";
import { useWatchlistStore } from "@/lib/watchlistStore";
import { useThemeDark } from "@/lib/theme-store";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { toast } from "sonner";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const QUICK_TOKENS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "PEPEUSDT", "NEARUSDT", "DOGEUSDT"];

export function LiveChart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = (searchParams.get("symbol") || "BTCUSDT").replace("/", "").toUpperCase();

  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState<Timeframe>("5m");
  const [tickers, setTickers] = useState<BinanceTicker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantData, setQuantData] = useState<QuantAnalysisResult | null>(null);
  const userEquity = 1000; // Default $1,000 capital
  const userRiskPct = 1.5; // Default 1.5% risk

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ReturnType<typeof echarts.init> | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<KlineBar[]>([]);
  const htfBarsRef = useRef<KlineBar[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const dark = useThemeDark();
  const { hasSymbol, addSymbol, removeSymbol } = useWatchlistStore();
  const isFavorite = hasSymbol(symbol);

  const { isSystemActive, toggleSystemActive } = useBinanceFuturesStore();

  const handleToggleSystem = () => {
    toggleSystemActive();
    if (isSystemActive) {
      toast.error("Hệ thống đã chuyển sang System OFF (Đã ngắt toàn bộ API kết nối đến Binance)");
    } else {
      toast.success("Hệ thống đã chuyển sang System ON (Đã kích hoạt lại kết nối API Binance)");
    }
  };

  // Sync URL search params
  const handleSelectSymbol = useCallback((newSym: string) => {
    const clean = newSym.replace("/", "").toUpperCase();
    setSymbol(clean);
    setSearchParams({ symbol: clean });
    setSearchQuery("");
    setIsSearching(false);
  }, [setSearchParams]);

  // Load all market tickers for search autocomplete & header metrics
  useEffect(() => {
    if (!isSystemActive) {
      setTickers([]);
      return;
    }
    fetchAllUsdtTickers().then(setTickers);
    const timer = window.setInterval(() => {
      fetchAllUsdtTickers().then(setTickers);
    }, 10000);
    return () => clearInterval(timer);
  }, [isSystemActive]);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Multi-Timeframe initial load & WebSocket real-time subscription
  useEffect(() => {
    if (!isSystemActive) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    let unsubscribeWs: (() => void) | null = null;

    setLoading(true);
    setHasMoreHistory(true);
    fetchKlinesMultiTimeframe(symbol, interval, "1h", 1000).then(({ primaryBars, htfBars }) => {
      if (!isMounted) return;
      if (primaryBars.length > 0) {
        barsRef.current = primaryBars;
        htfBarsRef.current = htfBars;
        setLivePrice(primaryBars[primaryBars.length - 1].close);
        const result = computeQuantSignals(primaryBars, htfBars);
        setQuantData(result);
      }
      setLoading(false);

      // Start Real-Time WebSocket stream
      unsubscribeWs = subscribeKlineWebSocket(symbol, interval, (liveBar) => {
        if (!isMounted || barsRef.current.length === 0) return;

        setLivePrice(liveBar.close);
        const currentBars = [...barsRef.current];
        const lastIdx = currentBars.length - 1;

        if (currentBars[lastIdx].timestamp === liveBar.timestamp) {
          currentBars[lastIdx] = liveBar;
        } else if (liveBar.timestamp > currentBars[lastIdx].timestamp) {
          currentBars.push(liveBar);
        }

        barsRef.current = currentBars;
        const quant = computeQuantSignals(currentBars, htfBarsRef.current);
        setQuantData(quant);
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribeWs) unsubscribeWs();
    };
  }, [symbol, interval]);

  // Infinite Historical Lazy-Loading when panning left
  const fetchOlderKlines = useCallback(async () => {
    if (loadingOlder || !hasMoreHistory || barsRef.current.length === 0) return;

    const oldestBar = barsRef.current[0];
    if (!oldestBar) return;

    setLoadingOlder(true);
    try {
      const olderBars = await fetchKlines(symbol, interval, 1000, oldestBar.timestamp - 1);
      if (!olderBars || olderBars.length === 0) {
        setHasMoreHistory(false);
        setLoadingOlder(false);
        return;
      }

      const existingTs = new Set(barsRef.current.map((b: KlineBar) => b.timestamp));
      const uniqueOlder = olderBars.filter((b: KlineBar) => !existingTs.has(b.timestamp));

      if (uniqueOlder.length === 0) {
        setHasMoreHistory(false);
        setLoadingOlder(false);
        return;
      }

      const addedCount = uniqueOlder.length;
      const merged = [...uniqueOlder, ...barsRef.current];
      barsRef.current = merged;

      const quant = computeQuantSignals(merged, htfBarsRef.current);
      setQuantData(quant);

      // Seamless scroll repositioning: Keep viewing window steady
      if (chartInstanceRef.current) {
        const chart = chartInstanceRef.current;
        const total = merged.length;
        const newStart = Math.max(0, (addedCount / total) * 100);
        const newEnd = Math.min(100, newStart + (100 * 80) / total);

        chart.dispatchAction({
          type: "dataZoom",
          start: newStart,
          end: newEnd,
        });
      }
    } catch (err) {
      console.error("Failed to load older candles:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [symbol, interval, loadingOlder, hasMoreHistory]);

  const handleManualRefresh = async () => {
    setLoading(true);
    setHasMoreHistory(true);
    const { primaryBars, htfBars } = await fetchKlinesMultiTimeframe(symbol, interval, "1h", 1000);
    if (primaryBars.length > 0) {
      barsRef.current = primaryBars;
      htfBarsRef.current = htfBars;
      setLivePrice(primaryBars[primaryBars.length - 1].close);
      const result = computeQuantSignals(primaryBars, htfBars);
      setQuantData(result);
    }
    setLoading(false);
  };

  // Active ticker and price info
  const currentTicker = useMemo(() => {
    return tickers.find((t) => t.symbol === symbol) ?? null;
  }, [tickers, symbol]);

  const displayPrice = livePrice ?? currentTicker?.lastPrice ?? 0;

  // Calculate Real-time Risk & Position Sizing Plan
  const riskPlan: PositionRiskPlan | null = useMemo(() => {
    if (!quantData || displayPrice <= 0) return null;
    const lastSig = quantData.signals.length > 0 ? quantData.signals[quantData.signals.length - 1] : null;
    const sl = lastSig?.stopLossPrice ?? (quantData.currentStop ?? displayPrice * 0.98);

    return calculatePositionRisk({
      equity: userEquity,
      riskPct: userRiskPct,
      entryPrice: displayPrice,
      stopLossPrice: sl,
      direction: 1,
      leverage: 10,
    });
  }, [quantData, displayPrice, userEquity, userRiskPct]);

  // Filtered search list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toUpperCase();
    return tickers.filter((t) => t.symbol.includes(q) || t.baseAsset.includes(q)).slice(0, 8);
  }, [tickers, searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ECharts Rendering with Dynamic 4-Tier Exit Lines
  useEffect(() => {
    if (!chartContainerRef.current || !quantData || quantData.bars.length === 0) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartContainerRef.current, dark ? "dark" : undefined, {
        renderer: "canvas",
      });
    }

    const chart = chartInstanceRef.current;
    const { bars, kama, trailingStop, signals, partialTpLevel, breakEvenLevel } = quantData;

    const dates = bars.map((b) => b.time);
    const candleData = bars.map((b) => [b.open, b.close, b.low, b.high]);
    const volumes = bars.map((b) => b.volume);

    // Generate Signal Markers
    const markPointData = signals.map((s) => {
      if (s.type === "buy") {
        return {
          name: `▲ MUA (${s.score}đ)`,
          coord: [s.time, s.price],
          value: `▲ ${s.score}đ`,
          symbol: "triangle",
          symbolSize: 18,
          symbolRotate: 0,
          itemStyle: { color: "#10b981", borderColor: "#059669", borderWidth: 2 },
          label: { show: true, position: "bottom", color: "#10b981", fontSize: 10, fontWeight: "bold" as const },
        };
      } else if (s.type === "take_profit") {
        return {
          name: "◆ CHỐT LỜI",
          coord: [s.time, s.price],
          value: "◆",
          symbol: "diamond",
          symbolSize: 20,
          itemStyle: { color: "#f59e0b", borderColor: "#d97706", borderWidth: 2 },
          label: { show: true, position: "top", color: "#f59e0b", fontSize: 11, fontWeight: "bold" as const },
        };
      } else {
        return {
          name: "▼ BÁN",
          coord: [s.time, s.price],
          value: "▼",
          symbol: "triangle",
          symbolSize: 18,
          symbolRotate: 180,
          itemStyle: { color: "#ef4444", borderColor: "#dc2626", borderWidth: 2 },
          label: { show: true, position: "top", color: "#ef4444", fontSize: 10, fontWeight: "bold" as const },
        };
      }
    });

    // Mark lines for 4-Tier Exit Engine (TP 1.5R, Break-Even, Current Trailing Stop)
    const markLineData: any[] = [];
    if (partialTpLevel && partialTpLevel > 0) {
      markLineData.push({
        yAxis: partialTpLevel,
        name: "TP 50% (1.5R)",
        lineStyle: { color: "#10b981", type: "dashed", width: 1.5 },
        label: { show: true, position: "end", formatter: "TP 50% (+1.5R)", color: "#10b981", fontSize: 10 },
      });
    }
    if (breakEvenLevel && breakEvenLevel > 0) {
      markLineData.push({
        yAxis: breakEvenLevel,
        name: "Break-Even",
        lineStyle: { color: "#f59e0b", type: "dashed", width: 1.5 },
        label: { show: true, position: "end", formatter: "Hòa Vốn (B.E)", color: "#f59e0b", fontSize: 10 },
      });
    }

    const option: any = {
      backgroundColor: "transparent",
      animation: false,
      grid: [
        { left: "3%", right: "4%", top: "4%", height: "72%" },
        { left: "3%", right: "4%", top: "80%", height: "14%" },
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        backgroundColor: dark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)",
        borderColor: dark ? "#334155" : "#e2e8f0",
        textStyle: { color: dark ? "#f8fafc" : "#0f172a", fontSize: 11 },
      },
      xAxis: [
        {
          type: "category",
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { lineStyle: { color: dark ? "#334155" : "#cbd5e1" } },
          splitLine: { show: false },
          axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
        },
        {
          type: "category",
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: { show: false },
          axisLine: { lineStyle: { color: dark ? "#334155" : "#cbd5e1" } },
          splitLine: { lineStyle: { color: dark ? "#1e293b" : "#f1f5f9" } },
          axisLabel: { color: dark ? "#94a3b8" : "#64748b", fontSize: 10 },
          position: "right",
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          position: "right",
        },
      ],
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0, 1],
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
          preventDefaultMouseMove: true,
          start: Math.max(0, 100 - (100 * 80) / bars.length),
          end: 100,
          minSpan: 0.2,
          maxSpan: 100,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: "slider",
          top: "94%",
          height: 14,
          start: Math.max(0, 100 - (100 * 80) / bars.length),
          end: 100,
          borderColor: "transparent",
          backgroundColor: dark ? "#1e293b" : "#f1f5f9",
          fillerColor: dark ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.25)",
          handleStyle: { color: "#3b82f6" },
          textStyle: { color: "transparent" },
        },
      ],
      series: [
        {
          name: "Candlestick",
          type: "candlestick",
          data: candleData,
          itemStyle: {
            color: "#10b981",
            color0: "#ef4444",
            borderColor: "#10b981",
            borderColor0: "#ef4444",
          },
          markPoint: { data: markPointData },
          markLine: markLineData.length > 0 ? { data: markLineData, symbol: "none" } : undefined,
        },
        {
          name: "KAMA Adaptive",
          type: "line",
          data: kama,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: "#0ea5e9" },
        },
        {
          name: "Structure Trailing Stop",
          type: "line",
          data: trailingStop,
          step: "end",
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#f97316", type: "dashed" },
        },
        {
          name: "Volume",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const i = params.dataIndex;
              return bars[i].close >= bars[i].open ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
            },
          },
        },
      ],
    };

    chart.setOption(option, true);

    // Auto-fetch older history when dragging/zooming near left boundary (start <= 2%)
    const onDataZoom = (evt: any) => {
      let start = 100;
      if (evt.batch && evt.batch[0] && evt.batch[0].start !== undefined) {
        start = evt.batch[0].start;
      } else if (evt.start !== undefined) {
        start = evt.start;
      }

      if (start <= 2 && !loadingOlder && hasMoreHistory) {
        fetchOlderKlines();
      }
    };

    chart.off("datazoom");
    chart.on("datazoom", onDataZoom);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.off("datazoom", onDataZoom);
    };
  }, [quantData, dark, loadingOlder, hasMoreHistory, fetchOlderKlines]);

  const { t } = useTranslation();
  const htf = quantData?.htfTrend;
  const setupScore = quantData?.currentSetupScore;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-background text-foreground overflow-hidden">
      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 sm:px-4 py-2 border-b bg-card/40 backdrop-blur">
        {/* Left: Search & Quick chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Autocomplete Search Bar */}
          <div className="relative" ref={searchDropdownRef}>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-background text-sm focus-within:ring-2 focus-within:ring-primary/30 w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("actions.searchPlaceholder")}
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-xs uppercase font-medium"
              />
            </div>

            {/* Dropdown list */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-1 max-h-60 overflow-y-auto">
                  {searchResults.map((tItem) => (
                    <button
                      key={tItem.symbol}
                      onClick={() => handleSelectSymbol(tItem.symbol)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-muted transition text-left cursor-pointer"
                    >
                      <span className="font-semibold">{tItem.baseAsset}</span>
                      <span className="font-mono text-muted-foreground">${tItem.lastPrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Token Switcher Chips */}
          <div className="hidden sm:flex items-center gap-1.5">
            {QUICK_TOKENS.map((tk) => (
              <button
                key={tk}
                onClick={() => handleSelectSymbol(tk)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition cursor-pointer ${
                  symbol === tk ? "bg-primary text-primary-foreground border-primary font-semibold" : "bg-card hover:bg-muted text-muted-foreground border-border/70"
                }`}
              >
                {tk.replace("USDT", "")}
              </button>
            ))}
          </div>

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
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-popover/95 backdrop-blur-md text-popover-foreground text-[10px] rounded-lg shadow-lg border border-border/80 pointer-events-none transition-all">
              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{t("dashboard.systemTooltip")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Timeframe & Actions */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setInterval(tf)}
                className={`px-2 py-1 text-xs rounded-md transition cursor-pointer ${
                  interval === tf ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={() => (isFavorite ? removeSymbol(symbol) : addSymbol(symbol))}
            title={isFavorite ? t("actions.removeWatchlist") : t("actions.addWatchlist")}
            aria-label={isFavorite ? t("actions.removeWatchlist") : t("actions.addWatchlist")}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isFavorite ? "bg-amber-500/10 border-amber-500/40 text-amber-500" : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-500" : ""}`} />
          </button>

          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            title={t("actions.refresh")}
            aria-label={t("actions.refresh")}
            className="p-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-muted-foreground transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. QUANT SENTINEL HUD BANNER */}
      <div className="px-3 sm:px-4 py-1.5 border-b bg-card/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {/* Symbol & Price */}
          <div className="flex items-center gap-2 font-mono">
            <span className="text-base font-semibold text-foreground font-sans">{currentTicker ? currentTicker.baseAsset : symbol.replace("USDT", "")}</span>
            <span className="text-xs text-muted-foreground font-normal">PERP</span>
            <span className="text-sm font-semibold text-foreground">
              ${displayPrice >= 1 ? displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : displayPrice}
            </span>
            {currentTicker && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${currentTicker.priceChangePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {currentTicker.priceChangePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(currentTicker.priceChangePercent).toFixed(2)}%
              </span>
            )}
          </div>

          {/* HTF Confluence Tag */}
          {htf && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${
                htf.trend === "bullish" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : htf.trend === "bearish" ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-muted text-muted-foreground"
              }`}
              title="Higher Timeframe 1-Hour Trend Direction"
            >
              {htf.trend === "bullish" ? (
                <span className="font-semibold flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />{t("signals.trendBullish")}</span>
              ) : htf.trend === "bearish" ? (
                <span className="font-semibold flex items-center gap-1"><ArrowDownRight className="w-3 h-3" />{t("signals.trendBearish")}</span>
              ) : (
                <span className="font-semibold flex items-center gap-1"><Minus className="w-3 h-3" />{t("signals.trendNeutral")}</span>
              )}
            </div>
          )}

          {/* Setup Score Badge */}
          {setupScore && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${
                setupScore.quality === "STRONG" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 font-semibold" : setupScore.quality === "WATCH" ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold" : "bg-muted text-muted-foreground"
              }`}
              title="Algorithmic Quantitative Setup Score"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t("signals.setupScore")}: {setupScore.totalScore}/100</span>
              <span>
                (
                {setupScore.quality === "STRONG"
                  ? t("signals.scoreHigh")
                  : setupScore.quality === "WATCH"
                  ? t("signals.scoreMedium")
                  : t("signals.scoreFiltered")}
                )
              </span>
            </div>
          )}
        </div>

        {/* 4-Tier Exit Status & Quick Risk Calculator */}
        {riskPlan && (
          <div className="hidden lg:flex items-center gap-3 font-mono text-[11px]">
            <span className="text-muted-foreground">{t("order.stopLoss")}: <b className="text-rose-500 font-semibold">${riskPlan.stopLossPrice >= 1 ? riskPlan.stopLossPrice.toFixed(2) : riskPlan.stopLossPrice} (-{riskPlan.stopLossDistancePct.toFixed(2)}%)</b></span>
            <span className="text-muted-foreground">{t("order.takeProfit")} 50%: <b className="text-emerald-500 font-semibold">${riskPlan.partialTpPrice >= 1 ? riskPlan.partialTpPrice.toFixed(2) : riskPlan.partialTpPrice} (+1.5R)</b></span>
            <span className="text-muted-foreground">R:R: <b className="text-foreground font-semibold">1 : {riskPlan.riskRewardRatio}</b></span>
            <span className="text-muted-foreground">{t("order.margin")}: <b className="text-primary font-semibold">${riskPlan.marginRequiredUsd.toFixed(1)}</b></span>
          </div>
        )}
      </div>

      {/* 3. CHART CANVAS CONTAINER WITH INFINITE PAN HUD */}
      <div className="flex-1 relative w-full h-full min-h-0 bg-background">
        {/* Floating Historical Info & Status */}
        <div className="absolute top-2.5 left-4 z-10 flex items-center gap-2 pointer-events-auto">
          {loadingOlder ? (
            <div className="px-2.5 py-1 rounded-lg bg-card/90 border border-primary/40 shadow-md text-[11px] font-mono flex items-center gap-1.5 text-primary backdrop-blur animate-in fade-in">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{t("actions.loadingHistory")}</span>
            </div>
          ) : hasMoreHistory ? (
            <button
              type="button"
              onClick={fetchOlderKlines}
              className="px-2 py-0.5 rounded-md bg-card/80 border border-border/80 hover:border-primary text-[10px] font-mono text-muted-foreground hover:text-foreground transition cursor-pointer backdrop-blur shadow-2xs"
            >
              + {t("actions.loadMoreHistory")} ({barsRef.current.length})
            </button>
          ) : (
            <div className="px-2 py-0.5 rounded-md bg-card/60 border text-[10px] font-mono text-muted-foreground">
              {t("actions.historyStart")} ({barsRef.current.length})
            </div>
          )}
        </div>

        <div ref={chartContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />
      </div>
    </div>
  );
}
