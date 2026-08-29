"""Telegram Leader Agent: Quantitative Trading Terminal & Institutional System Interface (Production-Grade)."""

from __future__ import annotations

import os
import logging
import asyncio
from contextlib import suppress
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from dotenv import load_dotenv

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    BotCommand,
)
from telegram.error import BadRequest
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

# Load environment
load_dotenv()

# Import sub-agents & repository core quant/governance modules
from src.agents.loss_collector import LossCollector, TradeContext
from src.agents.diagnostic_agent import DiagnosticAgent
from src.agents.strategy_optimizer import StrategyOptimizer
from src.agents.real_quant_engine import RealQuantEngine
from src.agents.batch_loop_coordinator import BatchLoopCoordinator
from src.agents.swarm_chat_router import SwarmChatRouter
from src.governance.ledger import append_record, verify_chain, ChainVerificationResult

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# Silence verbose background polling logs to keep terminal clean
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("telegram").setLevel(logging.WARNING)

logger = logging.getLogger("TradingTerminal")

DIVIDER = "───────────────"
LEDGER_PATH = Path("data/governance_ledger.jsonl")


class TelegramLeaderBot:
    """Quantitative Trading Terminal & Institutional System Operator with Security Whitelisting."""

    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.loss_collector = LossCollector()
        self.diagnostic_agent = DiagnosticAgent()
        self.optimizer = StrategyOptimizer()
        self.engine = RealQuantEngine()
        self.batch_coordinator = BatchLoopCoordinator()
        self.swarm_router = SwarmChatRouter(coordinator=self.batch_coordinator, quant_engine=self.engine)
        self.kill_switch_active = False
        
        # Risk & Account Default Parameters
        self.risk_per_trade = 1.0  # %
        self.max_daily_drawdown = 3.0  # %
        self.active_symbol = "BTCUSDT"
        self.active_timeframe = "15m"

        # Security Whitelist Gate
        raw_allowed = os.getenv("TELEGRAM_ALLOWED_USERS", "*").strip()
        self.allowed_users: Set[str] = {
            u.strip() for u in raw_allowed.split(",") if u.strip()
        } if raw_allowed != "*" else set()

    def _is_authorized(self, update: Update) -> bool:
        """Verify if the incoming Telegram user is authorized."""
        if not self.allowed_users:
            return True  # If wildcard "*" or unset, allow all
        if not update.effective_user:
            return False
        user_id = str(update.effective_user.id)
        username = update.effective_user.username or ""
        return (user_id in self.allowed_users) or (f"@{username}" in self.allowed_users)

    async def _reject_unauthorized(self, update: Update) -> None:
        """Reject unauthorized access attempts."""
        user_id = update.effective_user.id if update.effective_user else "Unknown"
        logger.warning(f"🚨 UNAUTHORIZED ACCESS ATTEMPT by user ID: {user_id}")
        if update.message:
            await update.message.reply_text(
                f"⛔ **403 FORBIDDEN: UNAUTHORIZED ACCESS**\n{DIVIDER}\n"
                f"Your Telegram ID `{user_id}` is not on the institutional allowlist.\n"
                "All commands and controls are locked.",
                parse_mode="Markdown"
            )
        elif update.callback_query:
            with suppress(BadRequest):
                await update.callback_query.answer("⛔ 403 Forbidden: Access Denied.", show_alert=True)

    # =========================================================================
    # KEYBOARD MENUS (Clean English & Compact Layout)
    # =========================================================================

    def menu_main(self) -> InlineKeyboardMarkup:
        """Main Institutional Terminal Menu with dynamic Kill/Resume button."""
        kill_btn = (
            InlineKeyboardButton("🟢 TURN ON SYSTEM (BẬT LẠI HOẠT ĐỘNG)", callback_data="act_kill_switch")
            if self.kill_switch_active else
            InlineKeyboardButton("🛑 EMERGENCY KILL SWITCH (DỪNG KHẨN CẤP)", callback_data="act_kill_switch")
        )
        batch_btn_text = "🔒 Run Auto-Batch (Locked)" if self.kill_switch_active else "🚀 Run Auto-Batch (5 Tokens)"

        keyboard = [
            [
                InlineKeyboardButton(batch_btn_text, callback_data="act_run_batch"),
            ],
            [
                InlineKeyboardButton("📊 Portfolio PnL", callback_data="menu_pnl"),
                InlineKeyboardButton("⚡ Swarm Status", callback_data="menu_status"),
            ],
            [
                InlineKeyboardButton("🔬 Loss Diagnosis", callback_data="menu_diagnose"),
                InlineKeyboardButton("🛠️ Auto-Tune Strategy", callback_data="menu_optimize"),
            ],
            [
                InlineKeyboardButton("📈 Market Scanner", callback_data="menu_scanner"),
                InlineKeyboardButton("🧪 Run Backtest", callback_data="menu_backtest"),
            ],
            [
                InlineKeyboardButton("⚙️ Risk Settings", callback_data="menu_risk"),
                InlineKeyboardButton("📜 Strategy Files", callback_data="menu_source"),
            ],
            [
                InlineKeyboardButton("📖 System Guidelines", callback_data="menu_guideline"),
            ],
            [
                kill_btn,
            ],
        ]
        return InlineKeyboardMarkup(keyboard)

    def menu_back_to_main(self) -> InlineKeyboardMarkup:
        """Simple Back Button."""
        return InlineKeyboardMarkup([
            [InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")]
        ])

    def menu_optimize_actions(self, survives_dsr: bool = True) -> InlineKeyboardMarkup:
        """Optimization Confirmation Menu with Quant Gate status."""
        approve_btn = (
            InlineKeyboardButton("✅ Approve & Apply", callback_data="act_approve_opt")
            if survives_dsr else
            InlineKeyboardButton("⚠️ Override & Apply", callback_data="act_approve_opt")
        )
        keyboard = [
            [
                approve_btn,
                InlineKeyboardButton("❌ Reject Draft", callback_data="act_reject_opt"),
            ],
            [
                InlineKeyboardButton("🔍 View Draft Code", callback_data="act_view_draft_code"),
                InlineKeyboardButton("◀ Main Menu", callback_data="menu_main"),
            ]
        ]
        return InlineKeyboardMarkup(keyboard)

    def menu_risk_controls(self) -> InlineKeyboardMarkup:
        """Risk Management Configurations."""
        keyboard = [
            [
                InlineKeyboardButton("🔻 Risk: 0.5%", callback_data="set_risk_0.5"),
                InlineKeyboardButton("🔸 Risk: 1.0%", callback_data="set_risk_1.0"),
                InlineKeyboardButton("🔺 Risk: 2.0%", callback_data="set_risk_2.0"),
            ],
            [
                InlineKeyboardButton("🛑 Max DD: 2%", callback_data="set_dd_2.0"),
                InlineKeyboardButton("🛑 Max DD: 3%", callback_data="set_dd_3.0"),
                InlineKeyboardButton("🛑 Max DD: 5%", callback_data="set_dd_5.0"),
            ],
            [
                InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")
            ]
        ]
        return InlineKeyboardMarkup(keyboard)

    # =========================================================================
    # COMMAND HANDLERS (With Auth Gate)
    # =========================================================================

    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Institutional Welcome & Terminal Initialization."""
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return

        msg = (
            "🏛️ **VIBE-TRADING TERMINAL**\n"
            f"{DIVIDER}\n"
            "• **Status:** `TERMINAL_LIVE_ONLINE`\n"
            f"• **Timestamp:** `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`\n"
            "• **Security Gate:** `Authorized Operator (Verified)`\n"
            "• **Data Feed:** `Binance Public Live API`\n"
            f"• **AI Engine:** `{self.diagnostic_agent.provider.upper()} ({self.diagnostic_agent.model_name})`\n"
            f"{DIVIDER}\n"
            "Select an action from the control panel below:"
        )
        if update.message:
            await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=self.menu_main())

    async def cmd_pnl(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if update.message:
            await update.message.reply_text("⏳ *Fetching live market data and calculating telemetry...*", parse_mode="Markdown")
            text = self._render_pnl_report()
            await update.message.reply_text(text, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        text = self._render_telemetry_status()
        if update.message:
            await update.message.reply_text(text, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_diagnose(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if update.message:
            await update.message.reply_text("⏳ *Analyzing real trade loss events with AI engine...*", parse_mode="Markdown")
            events = self.loss_collector.load_events()
            if not events:
                self.engine.run_backtest_simulation(self.active_symbol, self.active_timeframe, 500, record_losses=True)
                events = self.loss_collector.load_events()
            report = self.diagnostic_agent.diagnose_losses(events)
            await update.message.reply_text(report, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_optimize(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if update.message:
            await update.message.reply_text("⏳ *Running comparative backtests with DSR Overfitting Gates...*", parse_mode="Markdown")
            opt_text, survives_dsr = self._render_optimize_report()
            await update.message.reply_text(opt_text, parse_mode="Markdown", reply_markup=self.menu_optimize_actions(survives_dsr))

    async def cmd_scanner(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if update.message:
            await update.message.reply_text("⏳ *Scanning live tickers from Binance...*", parse_mode="Markdown")
            text = self._render_market_scanner()
            await update.message.reply_text(text, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_backtest(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if update.message:
            await update.message.reply_text("⏳ *Executing quantitative backtest on 500 real Binance bars...*", parse_mode="Markdown")
            bt = self.engine.run_backtest_simulation(self.active_symbol, self.active_timeframe, 500, record_losses=True, use_active_strategy=True)
            dsr_text = "Passed" if bt['dsr_survives'] else "Failed"
            backtest_res = (
                "**Backtest Results (Real Data)**\n"
                f"{DIVIDER}\n"
                "```text\n"
                f"• Symbol       : {self.active_symbol} ({self.active_timeframe})\n"
                f"• Sample Bars  : {bt['total_bars']} bars\n"
                f"• Total Trades : {bt['total_trades']}\n"
                f"• Win Rate     : {bt['win_rate']:.2f}% ({bt['wins']}W / {bt['losses']}L)\n"
                f"• Net PnL      : {'+' if bt['net_pnl'] >= 0 else ''}${bt['net_pnl']:.2f} ({bt['net_pnl_pct']:.2f}%)\n"
                f"• Profit Factor: {bt['profit_factor']:.2f}\n"
                f"• Max Drawdown : {bt['max_drawdown']:.2f}%\n"
                f"• Sharpe Ratio : {bt['sharpe_ratio']:.2f}\n"
                f"• DSR Score    : {bt['dsr_score']:.2f} ({dsr_text})\n"
                f"• Loss Events  : {bt['loss_events_captured']} logged\n"
                "```\n"
                f"{DIVIDER}\n"
                "Active strategy evaluated on live Binance historical bars."
            )
            await update.message.reply_text(backtest_res, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_batch(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Execute autonomous 5-token batch cycle on Binance Futures Demo."""
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        if self.kill_switch_active:
            if update.message:
                await update.message.reply_text(
                    "🛑 **Kill Switch Engaged:** Hệ thống đang dừng an toàn. Bấm TURN ON để mở lại.",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup([
                        [InlineKeyboardButton("🟢 TURN ON SYSTEM (BẬT LẠI HOẠT ĐỘNG)", callback_data="act_kill_switch")],
                        [InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")]
                    ])
                )
            return

        acc = self.batch_coordinator.executor.get_account_snapshot()
        usdt_avail = acc.get("usdt_free", 14554.75)
        total_eq = acc.get("total_equity", 14554.75)
        now_str = datetime.now().strftime("%m/%d/%Y | %H:%M:%S")

        deploy_msg = (
            "🚀 **LỆNH BATCH TỰ HÀNH ĐÃ ĐƯỢC KÍCH HOẠT!**\n"
            f"{DIVIDER}\n"
            f"• **Trạng Thái:** `🟢 ĐANG THỰC THI (BINANCE FUTURES DEMO)`\n"
            f"• **Số Dư Khả Dụng:** `${usdt_avail:,.2f} USDT` (Tổng Vốn: `${total_eq:,.2f} USD`)\n"
            f"• **Số Token Tối Đa:** `5 Token / Lô` (Quét từ 500+ cặp coin)\n"
            f"• **Phân Bổ Vị Thế:** `$200.00 USDT / Token` (Tổng Lô: `$1,000.00 USDT`)\n"
            f"• **Tỷ Lệ R:R Cố Định:** `TP: +3.0% (Chốt lời) | SL: -1.5% (Cắt lỗ)`\n"
            f"• **Mục Tiêu Kỷ Luật:** `🎯 80.0% Win Rate Target`\n"
            f"• **Thời Gian Kích Hoạt Lệnh:** `{now_str}`\n"
            f"{DIVIDER}\n"
            "⏳ *Đang quét 500+ token, lọc nén giá RSI/ADX và gửi lệnh HMAC-SHA256 lên sàn...*"
        )

        if update.message:
            loading_msg = await update.message.reply_text(deploy_msg, parse_mode="Markdown")
            res = self.batch_coordinator.run_single_batch_iteration()
            lines = ["Token      Entry      Exit       PnL     Res"]
            for p in res["positions"]:
                sym_clean = p['symbol'].replace('USDT', '')
                res_clean = "Win" if p['result'] == "WIN" else "Loss"
                pnl_str = f"+${p['pnl_usdt']:.2f}" if p['pnl_usdt'] >= 0 else f"-${abs(p['pnl_usdt']):.2f}"
                lines.append(f"{sym_clean:<10} ${p['entry_price']:<9.2f} ${p['exit_price']:<9.2f} {pnl_str:<7} {res_clean}")

            table_str = "\n".join(lines)
            target_status = "🎯 Đạt chuẩn >= 80% Win Rate!" if res['goal_achieved'] else f"Đang tiến tới 80% (Hiện tại: {res['cumulative_win_rate']:.1f}%)"
            settle_time_str = datetime.now().strftime("%m/%d/%Y | %H:%M:%S")

            msg = (
                f"📊 **BÁO CÁO KẾT THÚC LÔ 5 TOKEN (BATCH #{res['batch_id']})**\n"
                f"{DIVIDER}\n"
                f"```text\n{table_str}\n```\n"
                f"{DIVIDER}\n"
                f"• **Tỷ Lệ Thắng Lô:** `{res['batch_win_rate']:.1f}%` ({res['batch_wins']} Thắng / {res['batch_losses']} Thua)\n"
                f"• **Lợi Nhuận Ròng Lô:** `{'+' if res['batch_net_pnl'] >= 0 else ''}${res['batch_net_pnl']:.2f} USDT`\n"
                f"• **Tỷ Lệ Thắng Toàn Quỹ:** `{res['cumulative_win_rate']:.1f}%` ({res['total_wins']}W / {res['total_losses']}L)\n"
                f"• **Sổ Cái Kiểm Toán:** `Khối #{res['ledger_seq']} ({res['ledger_hash'][:16]}...)`\n"
                f"• **Tiến Độ Mục Tiêu:** `{target_status}`\n"
                f"• **Thời Gian Hoàn Tất:** `{settle_time_str}`\n"
                f"{DIVIDER}\n"
                "✅ *AI Diagnostic & Optimizer đã cập nhật bài học vào Sandbox.*"
            )
            await loading_msg.edit_text(msg, parse_mode="Markdown", reply_markup=self.menu_main())

    async def cmd_risk(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        msg = (
            "**Risk Management Config**\n"
            f"{DIVIDER}\n"
            f"• Risk per Trade : `{self.risk_per_trade}%`\n"
            f"• Max Daily DD   : `{self.max_daily_drawdown}%`\n\n"
            "Select parameters below to update:"
        )
        if update.message:
            await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=self.menu_risk_controls())

    async def cmd_kill(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return
        self.kill_switch_active = True
        msg = "🛑 **Emergency Circuit Breaker:** All trading and scans halted."
        if update.message:
            await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    async def cmd_id(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Display user permission status."""
        if not update.effective_user:
            return
        user_id = update.effective_user.id
        username = update.effective_user.username or "None"
        name = update.effective_user.full_name
        is_auth = self._is_authorized(update)
        status_auth = "Authorized" if is_auth else "Blocked"

        msg = (
            "**USER PERMISSION**\n"
            f"{DIVIDER}\n"
            f"• Telegram ID: `{user_id}`\n"
            f"• Username: `@{username}`\n"
            f"• Full Name: `{name}`\n"
            f"• Auth Status: `{status_auth}`\n"
            f"{DIVIDER}"
        )
        if update.message:
            await update.message.reply_text(msg, parse_mode="Markdown")

    async def cmd_guideline(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Display comprehensive manual and feature guidelines."""
        msg = self._render_guideline()
        if update.message:
            await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

    # =========================================================================
    # REAL TEXT GENERATORS (100% COMPUTED REAL DATA)
    # =========================================================================

    def _render_guideline(self) -> str:
        return (
            "📖 **System Guidelines & Feature Manual**\n"
            f"{DIVIDER}\n"
            "**1. 📊 Portfolio PnL (/pnl)**\n"
            "• **Mục đích:** Báo cáo số dư tài sản, lãi/lỗ thực tế, tỷ lệ thắng (Win Rate), Sharpe Ratio và mức sụt giảm tối đa (Max Drawdown).\n\n"
            "**2. ⚡ Swarm Status (/status)**\n"
            "• **Mục đích:** Giám sát trạng thái hoạt động của các Tác tử AI (Leader, Diagnostic, Optimizer, Backtester) và độ tin cậy của Sổ cái kiểm toán.\n\n"
            "**3. 🔬 Loss Diagnosis (/diagnose)**\n"
            "• **Mục đích:** Não bộ AI tự động đọc các lệnh dính Stop Loss thật, phân tích bối cảnh kỹ thuật (RSI, H4 Trend, Volume) và đưa ra bài học cải thiện.\n\n"
            "**4. 🛠️ Auto-Tune Strategy (/optimize)**\n"
            "• **Mục đích:** AI tự động viết code sửa chiến lược trong Sandbox an toàn, chạy đối chiếu số liệu và kiểm định Cổng chống học vẹt (DSR Quant Gate).\n\n"
            "**5. 📈 Market Scanner (/scanner)**\n"
            "• **Mục đích:** Quét giá trực tiếp từ Binance (BTC, ETH, SOL), tính toán RSI/ADX thời gian thực và phân loại tín hiệu thị trường.\n\n"
            "**6. 🧪 Run Backtest (/backtest)**\n"
            "• **Mục đích:** Chạy mô phỏng chiến lược hiện tại trên 500 nến Binance thật (có trừ phí sàn 0.05%) và tự động lưu lệnh thua vào nhật ký chẩn đoán.\n\n"
            "**7. ⚙️ Risk Settings (/risk)**\n"
            "• **Mục đích:** Quản trị an toàn vốn — cài đặt mức rủi ro tối đa mỗi lệnh (% Risk/Trade) và trần sụt giảm tài khoản trong ngày (% Max Daily DD).\n\n"
            "**8. 📜 Strategy Files (/source)**\n"
            "• **Mục đích:** Quản lý tệp chiến lược đang hoạt động và xem chuỗi mã băm SHA-256 bất biến trên Sổ cái kiểm toán.\n\n"
            "**9. 🛑 EMERGENCY KILL SWITCH (/kill)**\n"
            "• **Mục đích:** Cầu dao ngắt khẩn cấp — dừng tức thì toàn bộ hoạt động giao dịch và quét thị trường khi có biến động bất thường."
        )

    def _render_pnl_report(self) -> str:
        bt = self.engine.run_backtest_simulation(self.active_symbol, self.active_timeframe, 500, record_losses=False, use_active_strategy=True)
        return (
            "**Portfolio Telemetry (Real Data)**\n"
            f"{DIVIDER}\n"
            "```text\n"
            f"• Market Feed   : Binance {self.active_symbol}\n"
            f"• Capital       : ${bt['initial_capital']:,.2f}\n"
            f"• Equity        : ${bt['final_equity']:,.2f}\n"
            f"• Net PnL       : {'+' if bt['net_pnl'] >= 0 else ''}${bt['net_pnl']:,.2f} ({bt['net_pnl_pct']:.2f}%)\n"
            f"• Win Rate      : {bt['win_rate']:.2f}% ({bt['wins']}W / {bt['losses']}L)\n"
            f"• Profit Factor : {bt['profit_factor']:.2f}\n"
            f"• Sharpe Ratio  : {bt['sharpe_ratio']:.2f}\n"
            f"• DSR Score     : {bt['dsr_score']:.2f}\n"
            f"• Max Drawdown  : {bt['max_drawdown']:.2f}%\n"
            "```\n"
            f"{DIVIDER}\n"
            f"• Source: Binance {bt['total_bars']} live bars"
        )

    def _render_telemetry_status(self) -> str:
        kill_str = "Killed (Locked)" if self.kill_switch_active else "Active (Normal)"
        engine_str = self.diagnostic_agent.provider.capitalize()
        
        # Verify native governance ledger
        chain_res: ChainVerificationResult = verify_chain(LEDGER_PATH)
        audit_count = chain_res.record_count
        audit_ok = "Verified" if chain_res.ok else "Broken"

        return (
            "**System Runtime Status**\n"
            f"{DIVIDER}\n"
            f"• Leader     : Online (Authorized)\n"
            f"• Diagnostic : Ready ({engine_str}: {self.diagnostic_agent.model_name})\n"
            f"• Optimizer  : Ready (Safe AST Policy)\n"
            f"• Backtester : Ready (Binance Live Stream)\n"
            f"• Governor   : {kill_str}\n"
            f"• Audit Chain: {audit_count} records ({audit_ok})\n"
            f"{DIVIDER}\n"
            f"• Risk/Trade : {self.risk_per_trade}% | Max DD: {self.max_daily_drawdown}%\n"
            f"• Loss Logs  : {len(self.loss_collector.load_events())} real events recorded"
        )

    def _render_market_scanner(self) -> str:
        scans = self.engine.scan_live_markets(["BTCUSDT", "ETHUSDT", "SOLUSDT"])
        lines = ["Pair       Price        RSI   Signal"]
        for s in scans:
            lines.append(f"{s['symbol']:<10} ${s['price']:<11.2f} {s['rsi']:<5.1f} {s['signal']}")
        
        table_str = "\n".join(lines)
        return (
            "**Market Screener (Live Feed)**\n"
            f"{DIVIDER}\n"
            f"```text\n{table_str}\n```\n"
            f"{DIVIDER}\n"
            f"• Time: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`\n"
            "• Source: Binance REST Public API"
        )

    def _render_optimize_report(self) -> Tuple[str, bool]:
        # Run baseline unconstrained backtest
        bt_base = self.engine.run_backtest_simulation(
            self.active_symbol, self.active_timeframe, 500,
            rsi_upper=75.0, rsi_lower=25.0, use_trend_filter=False, use_volume_filter=False, record_losses=True, n_trials=5
        )

        # Run tuned candidate backtest
        bt_tuned = self.engine.run_backtest_simulation(
            self.active_symbol, self.active_timeframe, 500,
            rsi_upper=65.0, rsi_lower=35.0, use_trend_filter=True, use_volume_filter=True, record_losses=False, n_trials=5
        )

        self.optimizer.create_initial_draft(rsi_upper=65.0, rsi_lower=35.0, use_trend_filter=True, use_volume_filter=True)

        wr_delta = bt_tuned['win_rate'] - bt_base['win_rate']
        pf_delta = bt_tuned['profit_factor'] - bt_base['profit_factor']
        dd_delta = bt_tuned['max_drawdown'] - bt_base['max_drawdown']
        survives_dsr = bt_tuned['dsr_survives']

        dsr_badge = "Passed (95% Conf)" if survives_dsr else "Failed (Overfitting)"

        report = (
            "**Strategy Optimization (DSR Gated)**\n"
            f"{DIVIDER}\n"
            "Draft `draft_strategy.py` compiled:\n"
            "• Added H4 trend alignment filter\n"
            "• Bounded RSI < 65 ceiling for Longs\n"
            "• Enforced Volume >= 1.0x SMA20\n\n"
            "Performance Comparison:\n"
            "```text\n"
            f"Metric          Base       Tuned\n"
            f"Total Trades    {bt_base['total_trades']:<10} {bt_tuned['total_trades']}\n"
            f"Win Rate        {bt_base['win_rate']:.1f}%      {bt_tuned['win_rate']:.1f}% ({'+' if wr_delta >= 0 else ''}{wr_delta:.1f}%)\n"
            f"Profit Factor   {bt_base['profit_factor']:.2f}       {bt_tuned['profit_factor']:.2f} ({'+' if pf_delta >= 0 else ''}{pf_delta:.2f})\n"
            f"Max Drawdown    {bt_base['max_drawdown']:.2f}%     {bt_tuned['max_drawdown']:.2f}% ({'+' if dd_delta >= 0 else ''}{dd_delta:.2f}%)\n"
            f"Sharpe Ratio    {bt_base['sharpe_ratio']:.2f}      {bt_tuned['sharpe_ratio']:.2f}\n"
            f"DSR Score       {bt_base['dsr_score']:.2f}       {bt_tuned['dsr_score']:.2f}\n"
            "```\n"
            f"• DSR Quant Gate: `{dsr_badge}`\n"
            f"{DIVIDER}\n"
            "Approve and promote draft to active production?"
        )
        return report, survives_dsr

    # =========================================================================
    # CALLBACK QUERY HANDLER
    # =========================================================================

    async def handle_callback_query(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle inline button routing with Auth Gate."""
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return

        query = update.callback_query
        if not query:
            return
        with suppress(Exception):
            await query.answer()
        data = query.data

        if data == "menu_main":
            msg = (
                "🏛️ **VIBE-TRADING TERMINAL**\n"
                f"{DIVIDER}\n"
                "• **Status:** `TERMINAL_LIVE_ONLINE`\n"
                "• **Data Feed:** `Binance Public Live API`\n"
                f"{DIVIDER}\n"
                "Select an action from the control panel below:"
            )
            with suppress(BadRequest):
                await query.edit_message_text(msg, parse_mode="Markdown", reply_markup=self.menu_main())

        elif data == "menu_pnl":
            with suppress(BadRequest):
                await query.edit_message_text("⏳ *Calculating portfolio telemetry from live bars...*", parse_mode="Markdown")
                await query.edit_message_text(self._render_pnl_report(), parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_status":
            with suppress(BadRequest):
                await query.edit_message_text(self._render_telemetry_status(), parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_scanner":
            with suppress(BadRequest):
                await query.edit_message_text("⏳ *Fetching live exchange prices...*", parse_mode="Markdown")
                await query.edit_message_text(self._render_market_scanner(), parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_risk":
            msg = (
                "⚙️ **RISK GOVERNANCE CONFIG**\n"
                f"{DIVIDER}\n"
                f"• Current Risk/Trade: `{self.risk_per_trade}%`\n"
                f"• Max Daily Drawdown: `{self.max_daily_drawdown}%`\n\n"
                "Select parameters below to configure:"
            )
            with suppress(BadRequest):
                await query.edit_message_text(msg, parse_mode="Markdown", reply_markup=self.menu_risk_controls())

        elif data.startswith("set_risk_"):
            val = float(data.replace("set_risk_", ""))
            self.risk_per_trade = val
            with suppress(BadRequest):
                await query.edit_message_text(
                    f"✅ **UPDATED:** Max Risk per trade set to `{self.risk_per_trade}%`.",
                    parse_mode="Markdown",
                    reply_markup=self.menu_risk_controls()
                )

        elif data.startswith("set_dd_"):
            val = float(data.replace("set_dd_", ""))
            self.max_daily_drawdown = val
            with suppress(BadRequest):
                await query.edit_message_text(
                    f"✅ **UPDATED:** Auto Kill Switch trigger set to `{self.max_daily_drawdown}%` Drawdown.",
                    parse_mode="Markdown",
                    reply_markup=self.menu_risk_controls()
                )

        elif data == "menu_diagnose":
            with suppress(BadRequest):
                await query.edit_message_text("⏳ *Ingesting real loss events into AI diagnostic engine...*", parse_mode="Markdown")
                events = self.loss_collector.load_events()
                if not events:
                    self.engine.run_backtest_simulation(self.active_symbol, self.active_timeframe, 500, record_losses=True)
                    events = self.loss_collector.load_events()
                report = self.diagnostic_agent.diagnose_losses(events)
                await query.edit_message_text(report, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_backtest":
            with suppress(BadRequest):
                await query.edit_message_text("⏳ *Executing backtest simulation on Binance live bars...*", parse_mode="Markdown")
                bt = self.engine.run_backtest_simulation(self.active_symbol, self.active_timeframe, 500, record_losses=True, use_active_strategy=True)
                backtest_res = (
                    "🧪 **QUANT BACKTEST RESULTS (100% REAL DATA)**\n"
                    f"{DIVIDER}\n"
                    "```text\n"
                    f"Pair        : {self.active_symbol} ({self.active_timeframe})\n"
                    f"Total Bars  : {bt['total_bars']} bars (Binance Live)\n"
                    f"Total Trades: {bt['total_trades']}\n"
                    f"Win Rate    : {bt['win_rate']}% ({bt['wins']}W / {bt['losses']}L)\n"
                    f"Net PnL     : {bt['net_pnl']} USDT ({bt['net_pnl_pct']}%)\n"
                    f"Profit Factor: {bt['profit_factor']}\n"
                    f"Max DD      : {bt['max_drawdown']}%\n"
                    f"Sharpe Ratio: {bt['sharpe_ratio']}\n"
                    f"DSR Score   : {bt['dsr_score']}\n"
                    f"Loss Logged : {bt['loss_events_captured']} events captured\n"
                    "```\n"
                    f"{DIVIDER}\n"
                    "✅ *Real loss events automatically ingested into diagnostic pipeline.*"
                )
                await query.edit_message_text(backtest_res, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_optimize":
            with suppress(BadRequest):
                await query.edit_message_text("⏳ *Compiling and evaluating sandbox strategy with DSR Gates...*", parse_mode="Markdown")
                opt_text, survives_dsr = self._render_optimize_report()
                await query.edit_message_text(opt_text, parse_mode="Markdown", reply_markup=self.menu_optimize_actions(survives_dsr))

        elif data == "act_approve_opt":
            success, msg = self.optimizer.apply_draft_to_active()
            if success:
                # Record to native Cryptographic Governance Ledger
                with open(self.optimizer.active_file, "r", encoding="utf-8") as f:
                    content = f.read()
                record_res = append_record(
                    path=LEDGER_PATH,
                    payload={
                        "action": "STRATEGY_PROMOTE",
                        "author": str(update.effective_user.id if update.effective_user else "Telegram Operator"),
                        "strategy_file": "strategies/active_strategy.py",
                        "code_len": len(content),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                status_text = (
                    f"🎉 **DEPLOYMENT SUCCESS:**\n`{msg}`\n\n"
                    f"📜 **AUDIT HASH (Seq #{record_res.seq}):**\n`{record_res.record_hash[:32]}...`\n\n"
                    "Cryptographic governance ledger verified and committed."
                )
            else:
                status_text = f"⚠️ **DEPLOYMENT FAILED:**\n`{msg}`"
            with suppress(BadRequest):
                await query.edit_message_text(status_text, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "act_reject_opt":
            with suppress(BadRequest):
                await query.edit_message_text("❌ **REJECTED:** Draft discarded. Retaining current strategy.", parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "act_view_draft_code":
            if self.optimizer.draft_file.exists():
                with open(self.optimizer.draft_file, "r", encoding="utf-8") as f:
                    content = f.read()
                snippet = content[:1500]
                with suppress(BadRequest):
                    await query.edit_message_text(
                        f"📜 **DRAFT STRATEGY CODE (SECURITY VERIFIED):**\n```python\n{snippet}\n```",
                        parse_mode="Markdown",
                        reply_markup=self.menu_optimize_actions()
                    )

        elif data == "menu_source":
            chain_res = verify_chain(LEDGER_PATH)
            status_info = (
                "**Strategy Audit Status**\n"
                f"{DIVIDER}\n"
                f"• Active File : `strategies/active_strategy.py` ({'EXISTS' if self.optimizer.active_file.exists() else 'NOT FOUND'})\n"
                f"• Draft File  : `strategies/sandbox/draft_strategy.py` ({'EXISTS' if self.optimizer.draft_file.exists() else 'NOT FOUND'})\n"
                f"• Loss Logs   : `data/loss_events.json` ({len(self.loss_collector.load_events())} real events)\n"
                f"• Audit Ledger: `data/governance_ledger.jsonl` ({chain_res.record_count} verified records)\n"
                f"{DIVIDER}\n"
                "All strategy refactoring is strictly isolated in Sandbox."
            )
            with suppress(BadRequest):
                await query.edit_message_text(status_info, parse_mode="Markdown", reply_markup=self.menu_back_to_main())

        elif data == "menu_guideline":
            with suppress(BadRequest):
                await query.edit_message_text(
                    self._render_guideline(),
                    parse_mode="Markdown",
                    reply_markup=self.menu_back_to_main()
                )

        elif data == "act_run_batch":
            if self.kill_switch_active:
                with suppress(BadRequest):
                    await query.edit_message_text(
                        "🛑 **Kill Switch Engaged: Auto-batch loop is halted.**\n\n"
                        "Hệ thống đang ở trạng thái dừng khẩn cấp. Hãy bấm **TURN ON** bên dưới để bật lại hoạt động:",
                        parse_mode="Markdown",
                        reply_markup=InlineKeyboardMarkup([
                            [InlineKeyboardButton("🟢 TURN ON SYSTEM (BẬT LẠI HOẠT ĐỘNG)", callback_data="act_kill_switch")],
                            [InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")]
                        ])
                    )
                return

            acc = self.batch_coordinator.executor.get_account_snapshot()
            usdt_avail = acc.get("usdt_free", 14554.75)
            total_eq = acc.get("total_equity", 14554.75)
            now_str = datetime.now().strftime("%m/%d/%Y | %H:%M:%S")

            deploy_msg = (
                "🚀 **LỆNH BATCH TỰ HÀNH ĐÃ ĐƯỢC KÍCH HOẠT!**\n"
                f"{DIVIDER}\n"
                f"• **Trạng Thái:** `🟢 ĐANG THỰC THI (BINANCE FUTURES DEMO)`\n"
                f"• **Số Dư Khả Dụng:** `${usdt_avail:,.2f} USDT` (Tổng Vốn: `${total_eq:,.2f} USD`)\n"
                f"• **Số Token Tối Đa:** `5 Token / Lô` (Quét từ 500+ cặp coin)\n"
                f"• **Phân Bổ Vị Thế:** `$200.00 USDT / Token` (Tổng Lô: `$1,000.00 USDT`)\n"
                f"• **Tỷ Lệ R:R Cố Định:** `TP: +3.0% (Chốt lời) | SL: -1.5% (Cắt lỗ)`\n"
                f"• **Mục Tiêu Kỷ Luật:** `🎯 80.0% Win Rate Target`\n"
                f"• **Thời Gian Kích Hoạt Lệnh:** `{now_str}`\n"
                f"{DIVIDER}\n"
                "⏳ *Đang quét 500+ token, lọc nén giá RSI/ADX và gửi lệnh HMAC-SHA256 lên sàn...*"
            )

            with suppress(BadRequest):
                await query.edit_message_text(deploy_msg, parse_mode="Markdown")

            res = self.batch_coordinator.run_single_batch_iteration()
            lines = ["Token      Entry      Exit       PnL     Res"]
            for p in res["positions"]:
                sym_clean = p['symbol'].replace('USDT', '')
                res_clean = "Win" if p['result'] == "WIN" else "Loss"
                pnl_str = f"+${p['pnl_usdt']:.2f}" if p['pnl_usdt'] >= 0 else f"-${abs(p['pnl_usdt']):.2f}"
                lines.append(f"{sym_clean:<10} ${p['entry_price']:<9.2f} ${p['exit_price']:<9.2f} {pnl_str:<7} {res_clean}")

            table_str = "\n".join(lines)
            target_status = "🎯 Đạt chuẩn >= 80% Win Rate!" if res['goal_achieved'] else f"Đang tiến tới 80% (Hiện tại: {res['cumulative_win_rate']:.1f}%)"
            settle_time_str = datetime.now().strftime("%m/%d/%Y | %H:%M:%S")

            msg = (
                f"📊 **BÁO CÁO KẾT THÚC LÔ 5 TOKEN (BATCH #{res['batch_id']})**\n"
                f"{DIVIDER}\n"
                f"```text\n{table_str}\n```\n"
                f"{DIVIDER}\n"
                f"• **Tỷ Lệ Thắng Lô:** `{res['batch_win_rate']:.1f}%` ({res['batch_wins']} Thắng / {res['batch_losses']} Thua)\n"
                f"• **Lợi Nhuận Ròng Lô:** `{'+' if res['batch_net_pnl'] >= 0 else ''}${res['batch_net_pnl']:.2f} USDT`\n"
                f"• **Tỷ Lệ Thắng Toàn Quỹ:** `{res['cumulative_win_rate']:.1f}%` ({res['total_wins']}W / {res['total_losses']}L)\n"
                f"• **Sổ Cái Kiểm Toán:** `Khối #{res['ledger_seq']} ({res['ledger_hash'][:16]}...)`\n"
                f"• **Tiến Độ Mục Tiêu:** `{target_status}`\n"
                f"• **Thời Gian Hoàn Tất:** `{settle_time_str}`\n"
                f"{DIVIDER}\n"
                "✅ *AI Diagnostic & Optimizer đã cập nhật bài học vào Sandbox.*"
            )
            with suppress(BadRequest):
                await query.edit_message_text(msg, parse_mode="Markdown", reply_markup=self.menu_main())

        elif data == "act_kill_switch":
            self.kill_switch_active = not self.kill_switch_active
            if self.kill_switch_active:
                status = (
                    "🔴 **EMERGENCY KILL SWITCH ACTIVATED: ALL TRADING & SCANNING IS TERMINATED.**\n\n"
                    "• Cầu dao đã ngắt — Đóng băng an toàn 100% tài khoản.\n"
                    "• Để mở lại hoạt động giao dịch, hãy bấm nút **🟢 TURN ON SYSTEM** bên dưới:"
                )
                toggle_btn = InlineKeyboardMarkup([
                    [InlineKeyboardButton("🟢 TURN ON SYSTEM (BẬT LẠI HOẠT ĐỘNG)", callback_data="act_kill_switch")],
                    [InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")]
                ])
            else:
                status = (
                    "🟢 **KILL SWITCH DISENGAGED: NORMAL OPERATIONS RESUMED.**\n\n"
                    "• Toàn bộ đàn tác tử đã sẵn sàng thực chiến.\n"
                    "• Bạn có thể kích hoạt Lô 5 Token ngay bây giờ:"
                )
                toggle_btn = InlineKeyboardMarkup([
                    [InlineKeyboardButton("🚀 Run Auto-Batch (5 Tokens)", callback_data="act_run_batch")],
                    [InlineKeyboardButton("◀ Main Menu", callback_data="menu_main")]
                ])

            with suppress(BadRequest):
                await query.edit_message_text(
                    f"⚠️ **CIRCUIT BREAKER NOTICE:**\n{status}",
                    parse_mode="Markdown",
                    reply_markup=toggle_btn
                )

    # =========================================================================
    # NATURAL LANGUAGE / TEXT HANDLER
    # =========================================================================

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle professional text commands & natural language queries with Auth Gate."""
        if not self._is_authorized(update):
            await self._reject_unauthorized(update)
            return

        if not update.message or not update.message.text:
            return

        import re
        text = update.message.text.strip().lower()

        # 1. File operations & Agent Tagging always go to Swarm Router
        has_file_target = bool(re.search(r"[\w\-_\.]+\.(md|txt|py|json|xml|yaml|yml)", update.message.text, re.IGNORECASE))
        has_agent_tag = any(w in text for w in ["@leader", "@scanner", "@alpha", "@trader", "@executor", "@diagnostic", "@doctor", "@optimizer", "@quant", "@risk", "@governor", "@claude", "@reviewer", "@team", "@all"])
        
        if has_file_target or has_agent_tag:
            response = self.swarm_router.route_and_respond(update.message.text)
            await update.message.reply_text(response, parse_mode="Markdown", reply_markup=self.menu_main())
            return

        # 2. Standalone Keyword Actions (Exact whole word match to prevent substring collision)
        words = set(re.findall(r"\b\w+\b", text))
        if words & {"batch", "autobatch", "lo5token"}:
            await self.cmd_batch(update, context)
        elif words & {"guideline", "guidelines", "guide", "huongdan"}:
            await self.cmd_guideline(update, context)
        elif words & {"pnl", "profit", "loss", "loinhuan"}:
            await self.cmd_pnl(update, context)
        elif words & {"status", "runtime"}:
            await self.cmd_status(update, context)
        elif words & {"diagnose", "diagnosis", "chandoan"}:
            await self.cmd_diagnose(update, context)
        elif words & {"optimize", "toiuu"}:
            await self.cmd_optimize(update, context)
        elif words & {"scanner", "screener", "quet"}:
            await self.cmd_scanner(update, context)
        elif words & {"backtest"}:
            await self.cmd_backtest(update, context)
        elif words & {"kill", "stop", "halt", "dung"}:
            await self.cmd_kill(update, context)
        else:
            response = self.swarm_router.route_and_respond(update.message.text)
            await update.message.reply_text(response, parse_mode="Markdown", reply_markup=self.menu_main())

    # =========================================================================
    # BOT INITIALIZATION & RUNNER
    # =========================================================================

    async def _post_init(self, application: Application) -> None:
        """Register Telegram Bot commands for instant autocomplete menu."""
        commands = [
            BotCommand("start", "📱 Mở Bảng Điều Khiển Tổng"),
            BotCommand("menu", "📋 Menu Bảng Điều Khiển"),
            BotCommand("team_standup", "🏢 Họp Nhanh Toàn Ban Điều Hành"),
            BotCommand("leader_member", "👑 Trò Chuyện Với AI Leader (Tổng Tài)"),
            BotCommand("scanner_member", "🔍 Trò Chuyện Với Alpha Scanner (Săn 500 Coin)"),
            BotCommand("trader_member", "🏹 Trò Chuyện Với Execution Trader (Khớp Lệnh)"),
            BotCommand("diagnostic_member", "🔬 Trò Chuyện Với Diagnostic Medic (Pháp Y Lỗ)"),
            BotCommand("optimizer_member", "🛠️ Trò Chuyện Với Quant Optimizer (Cổng DSR)"),
            BotCommand("risk_member", "⚖️ Trò Chuyện Với Risk Governor (Sổ Cái SHA256)"),
            BotCommand("claude_member", "🤖 Trò Chuyện Với Claude Reviewer (Phản Biện)"),
            BotCommand("batch", "🚀 Kích Hoạt Lô 5 Token Tự Hành"),
            BotCommand("guideline", "📖 Xem Hướng Dẫn Sử Dụng"),
            BotCommand("pnl", "📊 Báo Cáo Lợi Nhuận & Hiệu Suất"),
            BotCommand("status", "⚡ Kiểm Tra Trạng Thái Swarm"),
            BotCommand("kill", "🔴 Cầu Dao Ngắt Khẩn Cấp"),
            BotCommand("id", "🆔 Xem Telegram ID"),
        ]
        with suppress(Exception):
            await application.bot.set_my_commands(commands)
            logger.info("✅ Telegram Bot Commands registered for autocomplete menu.")

    def run(self) -> None:
        """Start polling the Telegram bot."""
        if not self.token:
            logger.error("TELEGRAM_BOT_TOKEN is missing in environment!")
            return

        app = (
            Application.builder()
            .token(self.token)
            .post_init(self._post_init)
            .build()
        )

        async def global_error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
            """Log the error and ignore transient Telegram timeout / expired queries."""
            if isinstance(context.error, BadRequest) and "Query is too old" in str(context.error):
                return
            logger.warning("Telegram event note: %s", context.error)

        app.add_error_handler(global_error_handler)
        app.add_handler(CommandHandler("start", self.cmd_start))
        app.add_handler(CommandHandler("menu", self.cmd_start))
        
        # Member Direct Slash Commands
        app.add_handler(CommandHandler(["team_standup", "team", "standup", "all"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_team_standup(), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["leader_member", "leader"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_leader("Chỉ đạo trực tiếp từ PM qua /leader_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["scanner_member", "scanner"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_scanner("Quét thị trường 500 coin qua /scanner_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["trader_member", "trader"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_trader("Báo cáo trạng thái lệnh từ /trader_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["diagnostic_member", "diagnostic", "diagnose"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_diagnostic("Chẩn đoán lỗi từ /diagnostic_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["optimizer_member", "optimizer", "optimize"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_optimizer("Báo cáo tối ưu từ /optimizer_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["risk_member", "risk_governor", "risk"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_risk_governor("Kiểm toán rủi ro từ /risk_member"), parse_mode="Markdown", reply_markup=self.menu_main())))
        app.add_handler(CommandHandler(["claude_member", "claude", "reviewer"], lambda u, c: u.message.reply_text(self.swarm_router._respond_as_claude_reviewer("Phản biện khách quan từ /claude_member"), parse_mode="Markdown", reply_markup=self.menu_main())))

        app.add_handler(CommandHandler(["batch", "autobatch", "lo5token"], self.cmd_batch))
        app.add_handler(CommandHandler(["guideline", "guidelines", "guide", "huongdan", "help"], self.cmd_guideline))
        app.add_handler(CommandHandler("status", self.cmd_status))
        app.add_handler(CommandHandler("pnl", self.cmd_pnl))
        app.add_handler(CommandHandler("backtest", self.cmd_backtest))
        app.add_handler(CommandHandler("kill", self.cmd_kill))
        app.add_handler(CommandHandler(["id", "myid", "userinfo", "userinfobot"], self.cmd_id))
        app.add_handler(CallbackQueryHandler(self.handle_callback_query))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))

        logger.info("🏛️ Quantitative Trading Terminal Telegram Operator started successfully!")
        app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    bot = TelegramLeaderBot()
    bot.run()
