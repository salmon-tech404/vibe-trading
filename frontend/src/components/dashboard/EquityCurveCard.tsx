import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Bot } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTrackerStore } from "@/lib/trackerStore";
import { useBinanceFuturesStore } from "@/lib/binanceFuturesStore";
import { useThemeDark } from "@/lib/theme-store";

export function EquityCurveCard() {
  const { t } = useTranslation();
  const { closedTrades } = useTrackerStore();
  const { liveBalance, autoTradingEnabled } = useBinanceFuturesStore();
  const dark = useThemeDark();
  const stats = useMemo(() => {
    if (closedTrades.length === 0) {
      return {
        winRate: 0,
        totalPnl: 0,
        closedCount: 0,
        botTradesCount: 0,
        status: autoTradingEnabled ? "Bot" : "Stopped",
      };
    }

    let wins = 0;
    let losses = 0;
    let totalPnl = 0;
    closedTrades.forEach((t) => {
      const p = t.realizedPnlUsd ?? 0;
      if (p > 0.001) {
        wins++;
      } else if (p < -0.001) {
        losses++;
      }
      totalPnl += p;
    });

    const evaluatedTrades = wins + losses;
    const winRate = evaluatedTrades > 0 ? Math.round((wins / evaluatedTrades) * 100) : 100;
    return {
      winRate: winRate,
      totalPnl: totalPnl,
      closedCount: closedTrades.length,
      botTradesCount: closedTrades.length,
      status: autoTradingEnabled ? "Bot" : "Active",
    };
  }, [closedTrades, autoTradingEnabled]);

  // Real Chart series data built from actual closed trades history
  const chartData = useMemo(() => {
    const baseEquity = liveBalance > 0 ? liveBalance : 1000;
    if (closedTrades.length === 0) {
      return [
        { name: "Start", equity: Number(baseEquity.toFixed(2)), label: "Start" },
      ];
    }

    let cum = baseEquity;
    const points = [{ name: "Start", equity: Number(baseEquity.toFixed(2)), label: "Start" }];
    const reversed = [...closedTrades].reverse();

    reversed.forEach((t) => {
      cum += t.realizedPnlUsd ?? 0;
      const dateStr = new Date(t.closedAt || t.openedAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
      points.push({
        name: `${t.symbol} (${dateStr})`,
        equity: Number(cum.toFixed(2)),
        label: t.symbol,
      });
    });

    return points;
  }, [closedTrades, liveBalance]);

  return (
    <div className="h-full bg-card/80 backdrop-blur-md rounded-xl border border-border/70 p-3 sm:p-3.5 shadow-xs flex flex-col justify-between overflow-hidden space-y-2">
      {/* Header + Horizontal Key Stats Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 pb-1 border-b border-border/60">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold tracking-tight text-foreground">
            {t("dashboard.equityCurve")}
          </h2>
        </div>

        {/* 5 Stats Arranged Horizontally */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 items-center font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-medium text-muted-foreground text-[10.5px]">
              {t("dashboard.winRate")}:
            </span>
            <span className={`text-xs font-bold ${stats.winRate >= 50 ? "text-emerald-500" : "text-foreground"}`}>
              {stats.winRate}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-sans font-medium text-muted-foreground text-[10.5px]">
              {t("dashboard.totalPnl")}:
            </span>
            <span className={`text-xs font-bold ${stats.totalPnl > 0 ? "text-emerald-500" : stats.totalPnl < 0 ? "text-rose-500" : "text-foreground"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-sans font-medium text-muted-foreground text-[10.5px]">
              {t("dashboard.closedTrades")}:
            </span>
            <span className="font-bold text-foreground text-xs">
              {stats.closedCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-sans font-medium text-muted-foreground text-[10.5px]">
              {t("dashboard.botTrades")}:
            </span>
            <span className="font-bold text-foreground text-xs">
              {stats.botTradesCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-sans font-medium text-muted-foreground text-[10.5px]">
              {t("dashboard.botStatus")}:
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-sans font-bold text-[10px] ${
              autoTradingEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            }`}>
              <Bot className="w-2.5 h-2.5" />
              {autoTradingEnabled ? t("dashboard.statusRunning") : t("dashboard.statusStopped")}
            </span>
          </div>
        </div>
      </div>

      {/* Full-Width Recharts Area Chart (Nở Rộng 100% Toàn Bộ Bề Ngang) */}
      <div className="flex-1 min-h-[140px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradientFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? "#334155" : "#e2e8f0"} opacity={0.5} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: dark ? "#94a3b8" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
            />
            <YAxis
              domain={["dataMin - 20", "dataMax + 20"]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
              tick={{ fill: dark ? "#94a3b8" : "#64748b", fontSize: 10, fontFamily: "monospace" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? "#0f172a" : "#ffffff",
                borderColor: dark ? "#334155" : "#e2e8f0",
                borderRadius: "10px",
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "4px 8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Equity"]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#equityGradientFull)"
              dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 1.5, stroke: "#ffffff" }}
              activeDot={{ r: 5, fill: "#0284c7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
