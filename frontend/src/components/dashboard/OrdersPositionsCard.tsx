import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers, TrendingUp, TrendingDown, X, Loader2, Trash2 } from "lucide-react";
import { useTrackerStore } from "@/lib/trackerStore";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { toast } from "sonner";

interface UnifiedPosition {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  size: number | string;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  pnlPct: number;
  tpPrice?: number;
  tpPct?: number;
  leverage: number;
  isLive: boolean;
}

export function OrdersPositionsCard() {
  const { t } = useTranslation();
  const { activeTrades, closeTrade, closeAllActiveTrades } = useTrackerStore();
  const {
    livePositions,
    closeLivePosition,
    syncAccountData,
  } = useBinanceFuturesStore();

  const [closingSymbols, setClosingSymbols] = useState<Set<string>>(new Set());
  const [isClosingAll, setIsClosingAll] = useState(false);

  const handleClosePosition = async (pos: UnifiedPosition) => {
    if (closingSymbols.has(pos.symbol)) return;

    try {
      setClosingSymbols((prev) => new Set(prev).add(pos.symbol));
      toast.loading(`Đang đóng vị thế ${pos.symbol} trên Binance...`, { id: `close-${pos.symbol}` });

      await closeLivePosition(pos.symbol);

      const matchingTrade = activeTrades.find((t) => t.symbol === pos.symbol);
      const closePrice = pos.markPrice || pos.entryPrice;
      if (matchingTrade) {
        closeTrade(matchingTrade.id, closePrice, "MANUAL");
      }

      await syncAccountData();
      toast.success(
        `Đã đóng vị thế ${pos.symbol} thành công! (PnL: ${pos.pnlUsd >= 0 ? "+" : ""}$${pos.pnlUsd.toFixed(2)} / ${pos.pnlPct >= 0 ? "+" : ""}${pos.pnlPct.toFixed(2)}%)`,
        { id: `close-${pos.symbol}` }
      );
    } catch (err: any) {
      console.error(`Close position error for ${pos.symbol}:`, err);
      const matchingTrade = activeTrades.find((t) => t.symbol === pos.symbol);
      const closePrice = pos.markPrice || pos.entryPrice;
      if (matchingTrade) {
        closeTrade(matchingTrade.id, closePrice, "MANUAL");
      }
      toast.error(`Lỗi đóng vị thế ${pos.symbol}: ${err?.message || err}`, { id: `close-${pos.symbol}` });
    } finally {
      setClosingSymbols((prev) => {
        const next = new Set(prev);
        next.delete(pos.symbol);
        return next;
      });
    }
  };

  const handleCloseAllPositions = async () => {
    if (displayPositions.length === 0 || isClosingAll) return;

    try {
      setIsClosingAll(true);
      toast.loading("Đang đóng tất cả vị thế trên sàn Binance...", { id: "close-all" });

      for (const pos of displayPositions) {
        try {
          await closeLivePosition(pos.symbol);
          const matchingTrade = activeTrades.find((t) => t.symbol === pos.symbol);
          const closePrice = pos.markPrice || pos.entryPrice;
          if (matchingTrade) {
            closeTrade(matchingTrade.id, closePrice, "MANUAL_CLOSE_ALL");
          }
        } catch (err) {
          console.error(`Failed to close position ${pos.symbol}:`, err);
        }
      }

      closeAllActiveTrades();
      await syncAccountData();
      toast.success("Đã hoàn tất đóng toàn bộ vị thế!", { id: "close-all" });
    } catch (err: any) {
      toast.error(`Lỗi đóng tất cả vị thế: ${err?.message || err}`, { id: "close-all" });
    } finally {
      setIsClosingAll(false);
    }
  };

  // 1. Primary: Use real Binance livePositions
  let displayPositions: UnifiedPosition[] = [];

  if (livePositions && livePositions.length > 0) {
    displayPositions = livePositions.map((lp, idx) => {
      const isLong = lp.direction === "LONG" || Number(lp.positionAmt) > 0;
      const amt = Math.abs(Number(lp.positionAmt));
      const formattedSize = amt >= 10 ? amt.toFixed(1) : amt >= 1 ? amt.toFixed(2) : amt.toFixed(3);
      const entryP = Number(lp.entryPrice || 0);
      const markP = Number(lp.markPrice || entryP);
      const lev = Number(lp.leverage || 20);
      const pnlUsd = Number(lp.unRealizedProfit || 0);

      const matchingTrade = activeTrades.find((t) => t.symbol === lp.symbol);
      const tpPrice = matchingTrade?.tp1;

      // Calculate True ROI % exactly as Binance does
      const pnlPct = entryP > 0
        ? (isLong ? (markP - entryP) / entryP : (entryP - markP) / entryP) * lev * 100
        : 0;

      const tpPct = tpPrice && entryP > 0
        ? (isLong ? (tpPrice - entryP) / entryP : (entryP - tpPrice) / entryP) * lev * 100
        : undefined;

      return {
        id: `live-pos-${lp.symbol}-${idx}`,
        symbol: lp.symbol,
        direction: isLong ? "LONG" : "SHORT",
        size: formattedSize,
        entryPrice: entryP,
        markPrice: markP,
        pnlUsd,
        pnlPct,
        tpPrice,
        tpPct,
        leverage: lev,
        isLive: true,
      };
    });
  } else if (activeTrades && activeTrades.length > 0) {
    displayPositions = activeTrades.map((at) => {
      const matchingLive = livePositions?.find((lp) => lp.symbol === at.symbol);
      const isLong = at.direction === "LONG";
      const entryP = at.entryPrice;
      const lev = at.leverage || 20;
      let pnlUsd = 0;
      let markP = entryP;

      if (matchingLive) {
        pnlUsd = Number(matchingLive.unRealizedProfit || 0);
        markP = Number(matchingLive.markPrice || entryP);
      } else {
        markP = (at as any).currentPrice || at.entryPrice;
        const priceDiff = isLong ? markP - entryP : entryP - markP;
        const roi = (priceDiff / entryP) * lev * 100;
        pnlUsd = (at.marginUsd * roi) / 100;
      }

      const pnlPct = entryP > 0
        ? (isLong ? (markP - entryP) / entryP : (entryP - markP) / entryP) * lev * 100
        : 0;

      const tpPrice = at.tp1;
      const tpPct = tpPrice && entryP > 0
        ? (isLong ? (tpPrice - entryP) / entryP : (entryP - tpPrice) / entryP) * lev * 100
        : undefined;

      return {
        id: at.id,
        symbol: at.symbol,
        direction: at.direction,
        size: at.positionSizeCoins || at.marginUsd,
        entryPrice: entryP,
        markPrice: markP,
        pnlUsd,
        pnlPct,
        tpPrice,
        tpPct,
        leverage: lev,
        isLive: Boolean(matchingLive),
      };
    });
  }

  return (
    <div className="h-full bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-3 shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Header + Close All Button */}
      <div className="flex items-center justify-between shrink-0 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
            {t("dashboard.ordersPositions")}
            <span className="text-[10px] font-mono text-muted-foreground font-normal">
              ({displayPositions.length})
            </span>
          </h2>
        </div>

        {/* Close All Button */}
        {displayPositions.length > 0 && (
          <button
            type="button"
            onClick={handleCloseAllPositions}
            disabled={isClosingAll}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition cursor-pointer disabled:opacity-50"
            title="Đóng toàn bộ các vị thế đang mở trên Binance"
          >
            {isClosingAll ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            <span>{t("dashboard.closeAllPositions", "Đóng tất cả")}</span>
          </button>
        )}
      </div>

      {/* Flat Table Layout with flex scroll */}
      <div className="flex-1 min-h-[90px] overflow-y-auto scrollbar-thin">
        {displayPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[85px] text-center p-2 text-muted-foreground space-y-1">
            <Layers className="w-4 h-4 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">{t("dashboard.noActivePositions", "Không có vị thế mở")}</p>
            <p className="text-[10px] text-muted-foreground/80">{t("dashboard.noActivePositionsHint", "Các vị thế đang mở trên Binance Futures sẽ hiển thị tại đây theo thời gian thực.")}</p>
          </div>
        ) : (
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border/70 text-[10px] font-sans font-semibold text-muted-foreground">
                <th className="pb-1 font-medium">{t("dashboard.symbol", "Cặp giao dịch")}</th>
                <th className="pb-1 font-medium">{t("dashboard.type", "Loại")}</th>
                <th className="pb-1 text-right font-medium">{t("dashboard.size", "Quy mô")}</th>
                <th className="pb-1 text-right font-medium">{t("dashboard.entry", "Giá vào (Entry)")}</th>
                <th className="pb-1 text-right font-medium">{t("dashboard.takeProfit", "Chốt lời (TP)")}</th>
                <th className="pb-1 text-right font-medium">PNL (ROI %)</th>
                <th className="pb-1 text-right font-medium">{t("dashboard.action", "Thao tác")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayPositions.map((pos) => {
                const isLong = pos.direction === "LONG";
                const isProfit = pos.pnlUsd >= 0;
                const isClosing = closingSymbols.has(pos.symbol);

                return (
                  <tr key={pos.id} className="hover:bg-muted/40 transition">
                    <td className="py-1.5 font-bold text-foreground">
                      {pos.symbol}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-bold ${
                          isLong
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isLong ? "Long" : "Short"}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-medium text-muted-foreground">
                      {pos.size}
                    </td>
                    <td className="py-1.5 text-right text-foreground font-medium">
                      ${pos.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                    </td>
                    {/* Cột TP (Chốt Lời & Mục tiêu %) */}
                    <td className="py-1.5 text-right">
                      {pos.tpPrice ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground">
                            ${pos.tpPrice.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                          </div>
                          {pos.tpPct !== undefined && (
                            <div className="text-[9.5px] text-emerald-500 font-mono font-bold">
                              +{pos.tpPct.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    {/* Cột PnL (ROI %) Chuẩn Binance 2 Dòng */}
                    <td className="py-1.5 text-right">
                      <div className={`font-bold text-[11px] font-mono leading-tight ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                        {isProfit ? "+" : ""}${pos.pnlUsd.toFixed(2)} USDT
                      </div>
                      <div className={`text-[10px] font-mono font-bold leading-tight ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                        {isProfit ? "+" : ""}{pos.pnlPct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleClosePosition(pos)}
                        disabled={isClosing}
                        title={t("dashboard.closePosition", "Đóng vị thế")}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        {isClosing ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <X className="w-2.5 h-2.5" />
                        )}
                        <span>{t("dashboard.close", "Đóng")}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
