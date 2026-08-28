import { useTranslation } from "react-i18next";
import { History, Trash2 } from "lucide-react";
import { useTrackerStore, type TrackedTrade } from "@/lib/trackerStore";
import { toast } from "sonner";

export function TradeHistoryCard() {
  const { t } = useTranslation();
  const { closedTrades, clearHistory, deleteTrade } = useTrackerStore();

  const handleClear = () => {
    clearHistory();
    toast.info("Đã xóa toàn bộ lịch sử giao dịch");
  };

  const handleDelete = (id: string, symbol: string) => {
    deleteTrade(id);
    toast.info(`Đã xóa giao dịch ${symbol}`);
  };

  const displayTrades: TrackedTrade[] = closedTrades;

  return (
    <div className="h-full bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-3 shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <History className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
            {t("dashboard.tradeHistory")}
            <span className="text-[10px] font-mono text-muted-foreground font-normal">
              ({displayTrades.length})
            </span>
          </h2>
        </div>

        {displayTrades.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-0.5 rounded-md text-[10.5px] font-medium border border-border/80 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition cursor-pointer"
          >
            {t("dashboard.clearHistory")}
          </button>
        )}
      </div>

      {/* Compact Rows or Clean Empty State */}
      <div className="flex-1 min-h-[100px] overflow-y-auto space-y-1 pr-1 font-mono text-[11px] scrollbar-thin">
        {displayTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[90px] text-center p-3 text-muted-foreground space-y-1">
            <History className="w-4 h-4 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">{t("dashboard.noTradeHistory", "Chưa có lịch sử giao dịch")}</p>
            <p className="text-[10px] text-muted-foreground/80">{t("dashboard.noTradeHistoryHint", "Các vị thế sau khi đóng sẽ tự động lưu trữ tại đây.")}</p>
          </div>
        ) : (
          displayTrades.map((trade) => {
            const isWin = (trade.realizedPnlUsd ?? 0) >= 0;
            const pnlUsd = trade.realizedPnlUsd ?? 0;
            const pnlPct = trade.realizedPnlPct ?? 0;

            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition border border-border/50"
              >
                {/* Left Info */}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-foreground">{trade.symbol}</span>
                    <span
                      className={`text-[9.5px] font-bold px-1 py-0.2 rounded ${
                        trade.direction === "LONG"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {trade.direction === "LONG" ? "Long" : "Short"}
                    </span>
                    <span
                      className={`text-[9.5px] font-bold px-1 py-0.2 rounded ${
                        isWin
                          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      }`}
                    >
                      {isWin ? "Chốt Lời (Win)" : "Cắt Lỗ (Loss)"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Giá vào: <b className="text-foreground">${trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</b> → Giá đóng: <b className="text-foreground">${(trade.closePrice ?? trade.entryPrice).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 4 })}</b>
                    {trade.closeReason && <span className="ml-1 text-muted-foreground/80 font-mono">({trade.closeReason})</span>}
                  </div>
                </div>

                {/* Right PnL & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono">
                    <div className={`font-bold text-[11px] leading-tight ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                      {isWin ? "+" : "-"}${Math.abs(pnlUsd).toFixed(2)} USDT
                    </div>
                    <div className={`text-[10px] font-bold leading-tight ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                      {isWin ? "+" : ""}{pnlPct.toFixed(2)}%
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(trade.id, trade.symbol)}
                    title="Xóa bản ghi"
                    className="p-1 rounded text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
