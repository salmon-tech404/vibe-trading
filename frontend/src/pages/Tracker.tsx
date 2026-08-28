import { useEffect, useRef } from "react";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { useTrackerStore } from "@/lib/trackerStore";
import { useStrategyLabStore } from "@/lib/strategyLabStore";
import { botLogger } from "@/lib/botLogger";
import { safeGet } from "@/lib/storage";
import { api, type InFlightPositionItem } from "@/lib/api";
import { fetchAllUsdtTickers, fetchKlinesMultiTimeframe } from "@/lib/binance";
import { evaluateMarketMultiStrategy } from "@/lib/quantEngine";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewOrderCard } from "@/components/dashboard/NewOrderCard";
import { BotActivityLogCard } from "@/components/dashboard/BotActivityLogCard";
import { OrdersPositionsCard } from "@/components/dashboard/OrdersPositionsCard";
import { EquityCurveCard } from "@/components/dashboard/EquityCurveCard";
import { TradeHistoryCard } from "@/components/dashboard/TradeHistoryCard";

export function Tracker() {
  const {
    isConfigured,
    apiKey,
    apiSecret,
    testnet,
    mainnet,
    autoTradingEnabled,
    marginPerTradeUsd,
    maxOpenPositions,
    defaultLeverage,
    minSetupScore,
    isSystemActive,
    livePositions,
    syncAccountData,
    placeLiveOrder,
    closeLivePosition,
  } = useBinanceFuturesStore();

  const { activeTrades, addTrade, closeTrade } = useTrackerStore();

  const isScanningRef = useRef(false);
  const pendingOrdersRef = useRef<Set<string>>(new Set());
  const hasLoggedMaxSlotsRef = useRef(false);

  const isBinanceConfigured = Boolean(
    isConfigured ||
    (apiKey && apiSecret) ||
    (testnet?.apiKey && testnet?.apiSecret) ||
    (mainnet?.apiKey && mainnet?.apiSecret)
  );

  // Synchronize account balance and live positions every 4 seconds
  useEffect(() => {
    if (!isBinanceConfigured || !isSystemActive) return;

    syncAccountData().catch((err) => {
      console.warn("Auto sync failed:", err);
    });

    const interval = setInterval(() => {
      syncAccountData().catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [isBinanceConfigured, isSystemActive, syncAccountData]);

  // Real-time Market Scanner & Order Dispatcher (Modular & DRY)
  useEffect(() => {
    if (!autoTradingEnabled || !isBinanceConfigured || !isSystemActive) {
      hasLoggedMaxSlotsRef.current = false;
      return;
    }

    const runScan = async () => {
      if (isScanningRef.current) return;
      isScanningRef.current = true;

      try {
        const tickers = await fetchAllUsdtTickers();
        const STABLE_AND_SYNTHETIC_EXCLUDES = new Set([
          "USDCUSDT", "FDUSDUSDT", "TUSDUSDT", "BUSDUSDT", "EURUSDT", 
          "XAUUSDT", "XAGUSDT", "SOXLUSDT", "KORUUSDT", "MUUSDT", "SKHYNIXUSDT", "SPCXUSDT"
        ]);

        const topSymbols = tickers
          .filter((t) => 
            t.symbol &&
            t.symbol.endsWith("USDT") &&
            !t.symbol.includes("_") &&
            !t.symbol.includes("UP") &&
            !t.symbol.includes("DOWN") &&
            !STABLE_AND_SYNTHETIC_EXCLUDES.has(t.symbol) &&
            t.quoteVolume > 500000 &&
            t.lastPrice > 0
          )
          .sort((a, b) => b.quoteVolume - a.quoteVolume)
          .slice(0, 100);
        if (!topSymbols || topSymbols.length === 0) return;

        const maxSlots = maxOpenPositions || 5;
        const currentLivePositions = useBinanceFuturesStore.getState().livePositions || [];
        const activeSymbols = new Set(currentLivePositions.map((p) => p.symbol));

        // When positions reach max slots limit, gracefully suppress scanning
        if (activeSymbols.size >= maxSlots) {
          if (!hasLoggedMaxSlotsRef.current) {
            hasLoggedMaxSlotsRef.current = true;
            botLogger.info(
              "CAPITAL_GUARD",
              `[QUẢN LÝ VỐN] Đã đạt giới hạn tối đa ${activeSymbols.size}/${maxSlots} vị thế đang mở. Tạm dừng quét lệnh mới để bảo vệ ký quỹ.`
            );
          }
          return;
        }

        hasLoggedMaxSlotsRef.current = false;

        const strategyMode = (safeGet("qa-bot-strategy-mode") as "scalping" | "trend_swing") || "scalping";
        const isScalping = strategyMode === "scalping";
        const minScore = minSetupScore || (isScalping ? 65 : 70);
        const marginUsd = marginPerTradeUsd || 50;
        const lev = defaultLeverage || 20;
        const scanTf = isScalping ? "5m" : "15m";

        botLogger.scan(
          "SCANNER",
          `[${isScalping ? "SCALPING LƯỚT SÓNG (5m)" : "MULTI-TP XU HƯỚNG (15m)"}] Đang quét TOP ${topSymbols.length} cặp coin thanh khoản lớn nhất Binance (Yêu cầu Score >= ${minScore})...`
        );

        for (let i = 0; i < topSymbols.length; i++) {
          const token = topSymbols[i];
          if (activeSymbols.size >= maxSlots) break;
          if (activeSymbols.has(token.symbol) || pendingOrdersRef.current.has(token.symbol)) continue;

          // Gentle 120ms rate-limiting delay between tokens to keep network smooth & prevent freezing
          if (i > 0) {
            await new Promise((r) => setTimeout(r, 120));
          }

          try {
            const { primaryBars, htfBars } = await fetchKlinesMultiTimeframe(token.symbol, scanTf, "1h", 100);
            if (primaryBars.length < 20) continue;

            // Modular Evaluation using Clean Quant Strategy Engine
            const evalResult = evaluateMarketMultiStrategy(primaryBars, htfBars, strategyMode);
            const { strategyId, strategyName, signal, score, reason, entryPrice: curP, stopLoss: sl, tp1, tp2, tp3, regime, efficiencyRatio: er } = evalResult;
            const isBuy = signal === "BUY";
            const isSell = signal === "SELL";

            // Push Live Reasoning to Strategy Lab Store in real-time
            useStrategyLabStore.getState().addLiveReasoning({
              id: `LR-${Date.now()}-${token.symbol}`,
              timestamp: new Date().toLocaleTimeString(),
              symbol: token.symbol,
              phase: isBuy || isSell ? "Decision" : "Scanning",
              marketRegime: regime,
              efficiencyRatio: er,
              score,
              decision: isBuy ? "LONG" : isSell ? "SHORT" : "NO TRADE",
              reasoning: reason,
              confidence: Number((score / 100).toFixed(2)),
            });

            // Log detailed analysis for significant setups
            if (i < 3 || score >= (isScalping ? 65 : 70)) {
              botLogger.info(
                "ANALYSIS",
                `[${token.symbol}] ${strategyName} (${score}/100) | ${regime} | ${
                  isBuy ? "Tín hiệu MUA" : isSell ? "Tín hiệu BÁN" : `Chờ điều kiện (>= ${minScore})`
                }`
              );
            }

            // Execute order if score meets threshold
            if (score >= minScore && (isBuy || isSell)) {
              const dir: "LONG" | "SHORT" = isBuy ? "LONG" : "SHORT";
              const notional = marginUsd * lev;
              let qty = notional / curP;
              if (curP > 1000) qty = Number(qty.toFixed(3));
              else if (curP > 10) qty = Number(qty.toFixed(2));
              else qty = Number(qty.toFixed(1));

              if (qty > 0) {
                activeSymbols.add(token.symbol);
                pendingOrdersRef.current.add(token.symbol);

                await placeLiveOrder({
                  symbol: token.symbol,
                  side: dir === "LONG" ? "BUY" : "SELL",
                  quantity: qty,
                  stopLoss: Number(sl.toFixed(4)),
                  takeProfit: Number(tp1.toFixed(4)),
                  leverage: lev,
                });

                addTrade({
                  symbol: token.symbol,
                  direction: dir,
                  entryPrice: curP,
                  stopLoss: Number(sl.toFixed(4)),
                  tp1: Number(tp1.toFixed(4)),
                  tp2: Number(tp2.toFixed(4)),
                  tp3: Number(tp3.toFixed(4)),
                  marginUsd: marginUsd,
                  leverage: lev,
                  positionSizeCoins: qty,
                  notes: `[${strategyMode.toUpperCase()}] ${strategyName} | Score: ${score}`,
                });

                botLogger.trade(
                  "BOT_ORDER",
                  `[${strategyMode.toUpperCase()}] [${strategyName}] Mở lệnh ${dir} ${token.symbol} @ $${curP} | SL: $${sl.toFixed(4)} | TP1: $${tp1.toFixed(4)} | Đòn bẩy: ${lev}x | Vốn: $${marginUsd}`,
                  { symbol: token.symbol, direction: dir, entryPrice: curP, stopLoss: sl, tp1, leverage: lev, marginUsd, qty, strategyId }
                );
              }
            }
          } catch (itemErr: any) {
            botLogger.error("BOT_ERROR", `Lỗi phân tích ${token.symbol}: ${itemErr?.message || itemErr}`);
          }
        }
      } catch (err: any) {
        botLogger.error("SCAN_ERROR", `Lỗi quét thị trường: ${err?.message || err}`);
      } finally {
        isScanningRef.current = false;
      }
    };

    runScan();
    const interval = setInterval(runScan, 10000);
    return () => clearInterval(interval);
  }, [autoTradingEnabled, isBinanceConfigured, isSystemActive, maxOpenPositions, minSetupScore, marginPerTradeUsd, defaultLeverage, placeLiveOrder, addTrade, activeTrades]);

  // --------------------------------------------------------------------------
  // 3-LAYER POSITION DEFENSE: HARD CIRCUIT BREAKER (3s) & LLM XML MONITOR (15s)
  // --------------------------------------------------------------------------
  const isEvaluatingRef = useRef(false);
  const lastLlmEvalTimeRef = useRef(0);

  useEffect(() => {
    if (!isBinanceConfigured || !isSystemActive) return;

    const monitorPositions = async () => {
      if (!livePositions || livePositions.length === 0 || isEvaluatingRef.current) return;
      isEvaluatingRef.current = true;

      try {
        const strategyMode = (safeGet("qa-bot-strategy-mode") as "scalping" | "trend_swing") || "scalping";
        const isScalping = strategyMode === "scalping";

        // ====================================================================
        // LỚP 2: HARD CIRCUIT BREAKER BẰNG CODE (Quét & Ngắt Mạch Tức Thì)
        // ====================================================================
        for (const lp of livePositions) {
          const isLong = lp.direction === "LONG" || Number(lp.positionAmt) > 0;
          const curP = Number(lp.markPrice);
          const entryP = Number(lp.entryPrice);
          const lev = Number(lp.leverage) || 20;
          if (!entryP || entryP <= 0) continue;

          const pnlPct = isLong
            ? ((curP - entryP) / entryP) * lev * 100
            : ((entryP - curP) / entryP) * lev * 100;

          const matchingTrade = activeTrades.find((t) => t.symbol === lp.symbol);
          const holdMinutes = matchingTrade?.openedAt
            ? (Date.now() - matchingTrade.openedAt) / 60000
            : 0;

          const slPrice = matchingTrade?.stopLoss;
          const tpPrice = matchingTrade?.tp1;

          let shouldClose = false;
          let closeReason = "";
          let outcome: "Target Hit" | "Stop Loss Hit" | "Timeout Exit" = "Stop Loss Hit";

          // 1. Check Take Profit target hit
          if (tpPrice && ((isLong && curP >= tpPrice) || (!isLong && curP <= tpPrice))) {
            shouldClose = true;
            closeReason = "TAKE_PROFIT_HIT";
            outcome = "Target Hit";
          }
          // 2. Check Stop Loss breach
          else if (slPrice && ((isLong && curP <= slPrice) || (!isLong && curP >= slPrice))) {
            shouldClose = true;
            closeReason = "STOP_LOSS_HIT";
            outcome = "Stop Loss Hit";
          }
          // 3. Check Hard Circuit Breaker (Safety Parachute)
          else if (isScalping && pnlPct <= -22.0) {
            shouldClose = true;
            closeReason = "CIRCUIT_BREAKER_SL";
            outcome = "Stop Loss Hit";
          }
          else if (!isScalping && pnlPct <= -30.0) {
            shouldClose = true;
            closeReason = "CIRCUIT_BREAKER_SL";
            outcome = "Stop Loss Hit";
          }
          // 4. Check Time-Stop for Scalping
          else if (isScalping && holdMinutes >= 25.0 && pnlPct <= 0.5) {
            shouldClose = true;
            closeReason = "TIME_STOP_EXIT";
            outcome = "Timeout Exit";
          }

          if (shouldClose) {
            const isWin = outcome === "Target Hit" || pnlPct >= 0;
            const pnlUsd = Number(((marginPerTradeUsd * pnlPct) / 100).toFixed(2));

            botLogger.warn(
              "POSITION_CLOSE",
              `[TẤT TOÁN VỊ THẾ] ${lp.symbol} @ $${curP} | PnL: ${isWin ? "+" : ""}$${pnlUsd} (${pnlPct.toFixed(1)}%) | Lý do: ${closeReason}`
            );

            await closeLivePosition(lp.symbol);
            if (matchingTrade) closeTrade(matchingTrade.id, curP, closeReason);

            // Record TRUE Reflection into Strategy Lab & Physical Storage on Disk
            const realReflection = {
              id: `REF-${Date.now()}-${lp.symbol}`,
              symbol: lp.symbol,
              direction: isLong ? "LONG" as const : "SHORT" as const,
              entryPrice: entryP,
              exitPrice: curP,
              pnlUsd: pnlUsd,
              roiPct: Number(pnlPct.toFixed(2)),
              outcome: outcome,
              strategyName: isScalping ? "Bollinger Mean Reversion & Scalping" : "KAMA Adaptive Trend Swing",
              strategyId: isScalping ? "STRAT-004" : "STRAT-001",
              timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
              marketRegime: isScalping ? "Đi Ngang Tích Lũy" : "Xu Hướng Mạnh 1H",
              setupScore: 75,
              entryReason: `Mở ${isLong ? "LONG" : "SHORT"} ${lp.symbol} @ $${entryP} (Đòn bẩy ${lev}x).`,
              postMortemDiagnosis: isWin
                ? `Khớp mục tiêu thành công tại $${curP} (+${pnlPct.toFixed(1)}%). Động lượng tiếp diễn tốt.`
                : `Vị thế đóng tại $${curP} (${pnlPct.toFixed(1)}%). Thị trường rung lắc ngược hướng hoặc quá thời gian giữ lệnh.`,
              actionTaken: isWin
                ? "Duy trì nguyên tắc chốt lời dứt khoát 1.0x ATR bảo toàn lợi nhuận."
                : "Rút kinh nghiệm: Siết chặt bộ lọc Kaufman ER > 0.40 và chỉ vào lệnh khi Setup Score >= 75.",
              strategyMode: strategyMode,
            };

            useStrategyLabStore.getState().addReflection(realReflection);
            api.appendReflection(strategyMode, realReflection).catch(() => {});
            continue;
          }
        }

        // ====================================================================
        // LỚP 3: BỘ NÃO LLM ĐÁNH GIÁ THÔNG MINH QUA PROMPT XML (Chạy mỗi 15s)
        // ====================================================================
        const now = Date.now();
        if (now - lastLlmEvalTimeRef.current >= 15000) {
          lastLlmEvalTimeRef.current = now;

          const evalPayload: InFlightPositionItem[] = livePositions.map((lp) => {
            const isLong = lp.direction === "LONG" || Number(lp.positionAmt) > 0;
            const curP = Number(lp.markPrice);
            const entryP = Number(lp.entryPrice);
            const lev = Number(lp.leverage) || 20;
            const pnlPct = isLong
              ? ((curP - entryP) / entryP) * lev * 100
              : ((entryP - curP) / entryP) * lev * 100;
            const matchingTrade = activeTrades.find((t) => t.symbol === lp.symbol);
            const holdMinutes = matchingTrade?.openedAt
              ? (Date.now() - matchingTrade.openedAt) / 60000
              : 0;

            return {
              symbol: lp.symbol,
              direction: isLong ? "LONG" : "SHORT",
              entryPrice: entryP,
              currentPrice: curP,
              pnlPct: Number(pnlPct.toFixed(2)),
              holdingMinutes: Number(holdMinutes.toFixed(1)),
              stopLoss: matchingTrade?.stopLoss,
              tp1: matchingTrade?.tp1,
            };
          });

          const res = await api.evaluateInFlightPositions({
            strategyMode,
            positions: evalPayload,
          });

          for (const ev of res.evaluations) {
            if (ev.action === "EMERGENCY_CLOSE" || ev.action === "TIMEOUT_CLOSE") {
              botLogger.warn(
                "LLM_ACTION",
                `[LLM PHÁN ĐOÁN ĐÓNG] ${ev.symbol} (${ev.healthStatus}): ${ev.diagnosis}`
              );
              await closeLivePosition(ev.symbol);
              const matchingTrade = activeTrades.find((t) => t.symbol === ev.symbol);
              if (matchingTrade) {
                closeTrade(matchingTrade.id, matchingTrade.entryPrice, ev.action);
              }
            } else if (ev.urgency === "HIGH" || ev.healthStatus === "WARNING") {
              botLogger.info(
                "LLM_ASSESS",
                `[LLM ĐÁNH GIÁ VỊ THẾ] ${ev.symbol} (${ev.action}): ${ev.diagnosis}`
              );
            }
          }
        }
      } catch (evalErr) {
        // Fallback gracefully without breaking UI
      } finally {
        isEvaluatingRef.current = false;
      }
    };

    const interval = setInterval(monitorPositions, 4000);
    return () => clearInterval(interval);
  }, [isBinanceConfigured, isSystemActive, livePositions, activeTrades, closeLivePosition, closeTrade, marginPerTradeUsd]);

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
      {/* Constrained Max-Width Centered Container */}
      <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col p-2.5 sm:p-3.5 space-y-2.5 min-h-0 overflow-hidden">
        {/* 1. Top Fixed Header: Title + Mode Switch + Live & Available Balance + Status Banner */}
        <DashboardHeader />

        {/* 2. Main Dashboard Area: 2-Row Compact Information-Dense Terminal Layout */}
        <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
          {/* Top Half: Left New Order (2-col form + Quick Tags) & Right Stacked Bot Log + Open Positions */}
          <div className="h-[55%] min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
            {/* Left: New Order Card (7 cols) */}
            <div className="lg:col-span-7 h-full min-h-0">
              <NewOrderCard />
            </div>

            {/* Right: Stacked Bot Activity Log & Orders/Positions (5 cols) */}
            <div className="lg:col-span-5 h-full min-h-0 grid grid-rows-2 gap-2.5">
              {/* Top Right: Monospace Bot Activity Log */}
              <div className="h-full min-h-0">
                <BotActivityLogCard />
              </div>

              {/* Bottom Right: Flat Compact Orders & Open Positions Table */}
              <div className="h-full min-h-0">
                <OrdersPositionsCard />
              </div>
            </div>
          </div>

          {/* Bottom Half: Left Equity Curve Area Chart (100% width) & Right Trade History Stream */}
          <div className="h-[45%] min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
            {/* Left: Full-Width Win-Loss Equity Curve with top metrics header strip (7 cols) */}
            <div className="lg:col-span-7 h-full min-h-0">
              <EquityCurveCard />
            </div>

            {/* Right: Trade History Stream with Quick Delete Actions (5 cols) */}
            <div className="lg:col-span-5 h-full min-h-0">
              <TradeHistoryCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
