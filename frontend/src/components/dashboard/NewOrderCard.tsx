import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Coins,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  HelpCircle,
  Radio,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { useTrackerStore } from "@/lib/trackerStore";
import { botLogger } from "@/lib/botLogger";
import { fetchAllUsdtTickers, fetchKlinesMultiTimeframe, computeQuantSignals } from "@/lib/binance";

const QUICK_TAGS = ["BTC", "ETH", "SOL", "NEAR", "FTM", "DOGE"];

interface RadarToken {
  symbol: string;
  direction: "LONG" | "SHORT";
  score?: number;
  price?: number;
}

const DEFAULT_TOP_10_RADAR_TOKENS: RadarToken[] = [
  { symbol: "BTCUSDT", direction: "LONG" },
  { symbol: "ETHUSDT", direction: "LONG" },
  { symbol: "SOLUSDT", direction: "LONG" },
  { symbol: "XRPUSDT", direction: "LONG" },
  { symbol: "BNBUSDT", direction: "LONG" },
  { symbol: "DOGEUSDT", direction: "LONG" },
  { symbol: "SUIUSDT", direction: "LONG" },
  { symbol: "NEARUSDT", direction: "LONG" },
  { symbol: "AVAXUSDT", direction: "LONG" },
  { symbol: "LINKUSDT", direction: "LONG" },
];

interface NewOrderCardProps {
  onOrderPlaced?: () => void;
}

export function NewOrderCard({ onOrderPlaced }: NewOrderCardProps) {
  const { t } = useTranslation();
  const {
    marginPerTradeUsd,
    defaultLeverage,
    placeLiveOrder,
  } = useBinanceFuturesStore();

  const { addTrade } = useTrackerStore();

  // Search & Token
  const [searchToken, setSearchToken] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("BTCUSDT");

  // Form Fields
  const [marginType, setMarginType] = useState<"Cross" | "Isolated">("Cross");
  const [leverage, setLeverage] = useState<number>(defaultLeverage || 10);
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [tp1, setTp1] = useState<number>(0);
  const [tp2, setTp2] = useState<number>(0);
  const [tp3, setTp3] = useState<number>(0);
  const [positionSizePreset, setPositionSizePreset] = useState<string>("LARGE");
  const [marginUsd, setMarginUsd] = useState<number>(marginPerTradeUsd || 50);

  // Analysis & Scanner State
  const [setupScore, setSetupScore] = useState<number>(85);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [placing, setPlacing] = useState<boolean>(false);
  const [radarTokens, setRadarTokens] = useState<RadarToken[]>(DEFAULT_TOP_10_RADAR_TOKENS);
  const [scanningRadar, setScanningRadar] = useState<boolean>(false);

  // Background Radar Scanner to dynamically rank Top 10 tradeable tokens
  useEffect(() => {
    let isCancelled = false;

    const runRadarScan = async () => {
      setScanningRadar(true);
      try {
        const tickers = await fetchAllUsdtTickers();
        if (isCancelled || !tickers || tickers.length === 0) return;

        const candidates = tickers
          .filter((t) => !t.symbol.includes("UP") && !t.symbol.includes("DOWN"))
          .sort((a, b) => b.quoteVolume - a.quoteVolume)
          .slice(0, 15);

        const scannedResults: RadarToken[] = [];
        for (const item of candidates) {
          try {
            const { primaryBars, htfBars } = await fetchKlinesMultiTimeframe(item.symbol, "5m", "1h", 60);
            if (primaryBars && primaryBars.length >= 20) {
              const quant = computeQuantSignals(primaryBars, htfBars);
              const isBull = quant.htfTrend.trend === "bullish" || quant.currentSignal === "buy";
              scannedResults.push({
                symbol: item.symbol,
                direction: isBull ? "LONG" : "SHORT",
                score: quant.currentSetupScore.totalScore,
                price: primaryBars[primaryBars.length - 1].close,
              });
            }
          } catch {
            // Skip candidate
          }
        }

        if (!isCancelled && scannedResults.length >= 5) {
          scannedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
          setRadarTokens(scannedResults.slice(0, 10));
        }
      } catch {
        // Fallback to default top 10
      } finally {
        if (!isCancelled) setScanningRadar(false);
      }
    };

    runRadarScan();
    const interval = setInterval(runRadarScan, 60000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Auto-analysis when token changes
  const runAnalysis = async (sym: string, forcedDirection?: "LONG" | "SHORT") => {
    setAnalyzing(true);
    try {
      const { primaryBars, htfBars } = await fetchKlinesMultiTimeframe(sym, "5m", "1h", 100);
      if (primaryBars && primaryBars.length >= 20) {
        const quant = computeQuantSignals(primaryBars, htfBars);
        const curP = primaryBars[primaryBars.length - 1].close;
        const atr = quant.atr || curP * 0.015;
        const isBull = forcedDirection ? forcedDirection === "LONG" : (quant.htfTrend.trend === "bullish" || quant.currentSignal === "buy");

        const dir: "LONG" | "SHORT" = isBull ? "LONG" : "SHORT";
        setDirection(dir);
        setEntryPrice(curP);

        const riskDist = atr * 1.3;
        if (dir === "LONG") {
          setStopLoss(Number(Math.max(0.0001, curP - riskDist).toFixed(4)));
          setTp1(Number((curP + riskDist * 1.5).toFixed(4)));
          setTp2(Number((curP + riskDist * 2.6).toFixed(4)));
          setTp3(Number((curP + riskDist * 4.2).toFixed(4)));
        } else {
          setStopLoss(Number((curP + riskDist).toFixed(4)));
          setTp1(Number(Math.max(0.0001, curP - riskDist * 1.5).toFixed(4)));
          setTp2(Number(Math.max(0.0001, curP - riskDist * 2.6).toFixed(4)));
          setTp3(Number(Math.max(0.0001, curP - riskDist * 4.2).toFixed(4)));
        }

        setSetupScore(quant.currentSetupScore.totalScore);
      }
    } catch {
      // Fallback
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis(tokenSymbol);
  }, [tokenSymbol]);

  const handleSelectQuickTag = (tag: string) => {
    const fullSym = `${tag}USDT`;
    setTokenSymbol(fullSym);
    setSearchToken("");
  };

  const handleSelectRadarToken = (item: RadarToken) => {
    setTokenSymbol(item.symbol);
    setDirection(item.direction);
    runAnalysis(item.symbol, item.direction);
    toast.success(`Đã chọn ${item.symbol} [${item.direction}] và tính toán điểm vào lệnh tự động!`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;
    let sym = searchToken.trim().toUpperCase();
    if (!sym.endsWith("USDT")) {
      sym = `${sym}USDT`;
    }
    setTokenSymbol(sym);
  };

  const handlePlaceOrder = async () => {
    if (!entryPrice || entryPrice <= 0) {
      toast.error("Vui lòng nhập giá vào lệnh hợp lệ");
      return;
    }

    setPlacing(true);
    try {
      const notional = marginUsd * leverage;
      let qty = notional / entryPrice;
      if (entryPrice > 1000) qty = Number(qty.toFixed(3));
      else if (entryPrice > 10) qty = Number(qty.toFixed(2));
      else qty = Number(qty.toFixed(1));

      if (qty <= 0) qty = 0.01;

      // Send to Binance API
      await placeLiveOrder({
        symbol: tokenSymbol,
        side: direction === "LONG" ? "BUY" : "SELL",
        quantity: qty,
        stopLoss: stopLoss > 0 ? stopLoss : undefined,
        takeProfit: tp1 > 0 ? tp1 : undefined,
        leverage: leverage,
      });

      // Register into local tracker
      addTrade({
        symbol: tokenSymbol,
        direction: direction,
        entryPrice: entryPrice,
        stopLoss: stopLoss,
        tp1: tp1,
        tp2: tp2,
        tp3: tp3,
        marginUsd: marginUsd,
        leverage: leverage,
        positionSizeCoins: qty,
        notes: `MANUAL 1-CLICK ${direction} @ $${entryPrice} | Score: ${setupScore}`,
      });

      botLogger.trade(
        "MANUAL_ORDER",
        `[ĐẶT LỆNH] ${direction} ${tokenSymbol} | Entry: $${entryPrice} | SL: $${stopLoss} | TP1: $${tp1} | Vốn: $${marginUsd} | Đòn bẩy: ${leverage}x | Qty: ${qty}`,
        { symbol: tokenSymbol, direction, entryPrice, stopLoss, tp1, leverage, marginUsd, qty }
      );

      toast.success(`Đã mở lệnh ${direction} ${tokenSymbol} thành công!`);
      onOrderPlaced?.();
    } catch (err: any) {
      toast.error(`Lỗi đặt lệnh: ${err?.message || err}`);
    } finally {
      setPlacing(false);
    }
  };

  const positionNotional = (marginUsd * leverage).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="h-full bg-card/80 backdrop-blur-md rounded-2xl border border-border/70 p-3.5 sm:p-4 shadow-xs flex flex-col justify-start overflow-hidden space-y-2.5">
      {/* 1. Header & Full-Width Search & Quick Tags */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold tracking-tight text-foreground">
              {t("dashboard.newOrder")}
            </h2>
          </div>
          {analyzing && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse font-mono">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
              <span>Scanning...</span>
            </div>
          )}
        </div>

        {/* Full-width Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            placeholder={t("dashboard.searchToken")}
            className="w-full bg-background/90 border border-border/80 rounded-xl pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition font-medium"
          />
        </form>

        {/* Quick Token Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {QUICK_TAGS.map((tag) => {
            const isSelected = tokenSymbol.startsWith(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectQuickTag(tag)}
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-black shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Body Grid: Left Form (8 cols) + Right Top 10 Bullish Radar (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start flex-1 min-h-0">
        {/* Form Area: 8 Columns with Row-by-Row perfect alignment and compact spacing */}
        <div className="md:col-span-8 space-y-2">
          {/* Row 1: Token (Left) ⟷ Direction (Right) */}
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.token")}
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                className="w-full bg-background/90 border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.direction")}
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setDirection("LONG")}
                  className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    direction === "LONG"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {t("dashboard.long")}
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("SHORT")}
                  className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    direction === "SHORT"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  {t("dashboard.short")}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Entry Price (Left) ⟷ Position Size (Right) */}
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.entry")}
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice || ""}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-background/90 border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono font-medium text-foreground outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.positionSize")}
              </label>
              <input
                type="text"
                value={positionSizePreset}
                onChange={(e) => {
                  setPositionSizePreset(e.target.value.toUpperCase());
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num > 0) setMarginUsd(num);
                }}
                className="w-full bg-background/90 border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Row 3: Stop Loss (Left) ⟷ Leverage Slider (Right) */}
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.sl")}
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss || ""}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-background/90 border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono text-rose-500 font-semibold outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold mb-0.5">
                <span className="flex items-center gap-1">
                  {t("dashboard.leverage")}
                  <HelpCircle className="w-2.5 h-2.5 text-muted-foreground/70" />
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  20x - 100x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-1 bg-muted rounded appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-0.5">
                <span>1x</span>
                <span>20x</span>
                <span>50x</span>
                <span>100x</span>
              </div>
            </div>
          </div>

          {/* Row 4: Take Profit TP1-2-3 (Left) ⟷ Cross/Isolated & Leverage (Right) */}
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                {t("dashboard.tp")}
              </label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  step="any"
                  placeholder={t("dashboard.tp1")}
                  value={tp1 || ""}
                  onChange={(e) => setTp1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background/90 border border-border/80 rounded-md px-1.5 py-1 text-[10px] font-mono text-emerald-500 font-medium outline-none focus:border-emerald-500 transition"
                />
                <input
                  type="number"
                  step="any"
                  placeholder={t("dashboard.tp2")}
                  value={tp2 || ""}
                  onChange={(e) => setTp2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background/90 border border-border/80 rounded-md px-1.5 py-1 text-[10px] font-mono text-emerald-500 font-medium outline-none focus:border-emerald-500 transition"
                />
                <input
                  type="number"
                  step="any"
                  placeholder={t("dashboard.tp3")}
                  value={tp3 || ""}
                  onChange={(e) => setTp3(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background/90 border border-border/80 rounded-md px-1.5 py-1 text-[10px] font-mono text-emerald-500 font-medium outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                  {t("dashboard.crossIsolated")}
                </label>
                <select
                  value={marginType}
                  onChange={(e) => setMarginType(e.target.value as any)}
                  className="w-full bg-background/90 border border-border/80 rounded-lg px-2 py-1 text-xs text-foreground font-medium outline-none focus:border-primary transition"
                >
                  <option value="Cross">{t("dashboard.cross")}</option>
                  <option value="Isolated">{t("dashboard.isolated")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground font-semibold mb-0.5">
                  {t("dashboard.leverage")}
                </label>
                <input
                  type="text"
                  value={`${leverage}x`}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, "")) || 1;
                    setLeverage(Math.min(125, Math.max(1, val)));
                  }}
                  className="w-full bg-background/90 border border-border/80 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Calculated Margin Summary (Left) ⟷ Place Order Button (Right) */}
          <div className="grid grid-cols-2 gap-2.5 items-center pt-1">
            <div className="bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border/60 flex items-center justify-between text-[10.5px] font-mono text-muted-foreground">
              <span>Score: <b className="text-emerald-500 font-sans">{setupScore}/100</b></span>
              <span>•</span>
              <span>Margin: <b className="text-foreground">${marginUsd}</b></span>
              <span>•</span>
              <span>Notional: <b className="text-foreground">${positionNotional}</b></span>
            </div>

            <div>
              <button
                type="button"
                disabled={placing}
                onClick={handlePlaceOrder}
                className="w-full py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Placing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{t("dashboard.placeOrder")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): TOP 10 BULLISH TOKENS RADAR */}
        <div className="md:col-span-4 bg-muted/40 rounded-xl p-2.5 border border-border/70 flex flex-col h-full min-h-[260px]">
          {/* Radar Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-1">
              <Radio className={`w-3 h-3 ${scanningRadar ? "text-amber-500 animate-spin" : "text-emerald-500"}`} />
              <span className="text-[10.5px] font-bold tracking-tight text-foreground font-mono">
                {t("dashboard.topTokensRadar")}
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-muted-foreground">
              (10)
            </span>
          </div>

          {/* Clean Top 10 Token Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 font-mono text-xs pt-1.5 pr-0.5 scrollbar-thin">
            {radarTokens.map((item) => {
              const isSelected = tokenSymbol === item.symbol;
              const isLong = item.direction === "LONG";

              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelectRadarToken(item)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground shadow-xs"
                      : "bg-background/70 border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="font-bold text-[11px] font-mono tracking-tight">
                    {item.symbol}
                  </span>

                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 ${
                      isLong
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    }`}
                  >
                    {isLong ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    [{item.direction}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Footer Information Badges */}
      <div className="pt-1.5 border-t border-border/70 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {t("dashboard.protectedMargin")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
            {t("dashboard.maxLoss")}: <span className="font-mono text-rose-500">${(marginUsd * 0.5).toFixed(2)}</span>
          </span>
          <span className="inline-flex items-center gap-0.5 text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
            {t("dashboard.takeProfits")}: <span className="font-mono text-emerald-500">3 Targets</span>
          </span>
        </div>
      </div>
    </div>
  );
}
