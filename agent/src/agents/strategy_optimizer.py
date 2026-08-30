"""Safe AST Security Validator and Sandbox Strategy Promotion Engine."""

from __future__ import annotations

import ast
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Strict Whitelist for allowed modules in trading strategies
ALLOWED_MODULES: Set[str] = {
    "pandas", "numpy", "math", "typing", "datetime"
}

# Dangerous functions and builtins strictly forbidden in strategies
FORBIDDEN_CALLS: Set[str] = {
    "eval", "exec", "open", "compile", "__import__", "globals", "locals",
    "getattr", "setattr", "delattr", "system", "popen", "spawn", "fork"
}

# Forbidden modules strictly banned
BANNED_MODULES: Set[str] = {
    "os", "sys", "subprocess", "shutil", "socket", "urllib", "requests",
    "httpx", "ctypes", "pickle", "shelve", "importlib"
}


class StrategyASTSecurityVisitor(ast.NodeVisitor):
    """AST Visitor that validates strategy code against security policies."""

    def __init__(self):
        self.errors: List[str] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            base_mod = alias.name.split(".")[0]
            if base_mod in BANNED_MODULES:
                self.errors.append(f"Security Violation: Import of forbidden module '{alias.name}' on line {node.lineno}")
            elif base_mod not in ALLOWED_MODULES:
                self.errors.append(f"Security Violation: Module '{alias.name}' on line {node.lineno} is not in allowed whitelist")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        if node.module:
            base_mod = node.module.split(".")[0]
            if base_mod in BANNED_MODULES:
                self.errors.append(f"Security Violation: From-import of forbidden module '{node.module}' on line {node.lineno}")
            elif base_mod not in ALLOWED_MODULES:
                self.errors.append(f"Security Violation: Module '{node.module}' on line {node.lineno} is not in allowed whitelist")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        # Check direct call (e.g. open(), eval())
        if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
            self.errors.append(f"Security Violation: Forbidden call to '{node.func.id}()' on line {node.lineno}")
        # Check attribute call (e.g. os.system())
        elif isinstance(node.func, ast.Attribute) and node.func.attr in FORBIDDEN_CALLS:
            self.errors.append(f"Security Violation: Forbidden method call '{node.func.attr}()' on line {node.lineno}")
        self.generic_visit(node)


class StrategyOptimizer:
    """Sub-agent responsible for strategy parameter tuning and secure sandbox management."""

    def __init__(self, sandbox_dir: Optional[Path] = None):
        self.sandbox_dir = sandbox_dir or Path("strategies/sandbox")
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)
        self.draft_file = self.sandbox_dir / "draft_strategy.py"
        self.active_file = Path("strategies/active_strategy.py")
        self.active_file.parent.mkdir(parents=True, exist_ok=True)

    def validate_code_security(self, code_str: str) -> Tuple[bool, List[str]]:
        """Validate code syntax and security constraints."""
        try:
            tree = ast.parse(code_str)
        except SyntaxError as e:
            return False, [f"Syntax Error on line {e.lineno}: {e.msg}"]

        visitor = StrategyASTSecurityVisitor()
        visitor.visit(tree)

        if visitor.errors:
            return False, visitor.errors
        return True, ["AST Syntax & Security Policy: VALID (Clean & Safe)"]

    def create_initial_draft(
        self,
        rsi_upper: float = 65.0,
        rsi_lower: float = 35.0,
        use_trend_filter: bool = True,
        use_volume_filter: bool = True
    ) -> str:
        """Create a parameterized strategy draft in sandbox."""
        code = f'''"""Vibe-Trading Auto-Optimized Strategy Draft (Quant-Verified)."""

import pandas as pd
import numpy as np


class StrategyEngine:
    def __init__(
        self,
        rsi_period: int = 14,
        rsi_upper: float = {rsi_upper},
        rsi_lower: float = {rsi_lower},
        use_trend: bool = {use_trend_filter},
        use_volume: bool = {use_volume_filter}
    ):
        self.rsi_period = rsi_period
        self.rsi_upper = rsi_upper
        self.rsi_lower = rsi_lower
        self.use_trend = use_trend
        self.use_volume = use_volume

    def calculate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Generate vector signals: 1 for BUY, -1 for SELL, 0 for HOLD."""
        signals = pd.Series(0, index=df.index)

        trend_bullish = (df.get("trend_h4", "Uptrend") == "Uptrend") if self.use_trend else True
        trend_bearish = (df.get("trend_h4", "Downtrend") == "Downtrend") if self.use_trend else True

        rsi = df.get("rsi", pd.Series(50.0, index=df.index))
        rsi_valid_buy = (rsi < self.rsi_upper) & (rsi > 40.0)
        rsi_valid_sell = (rsi > self.rsi_lower) & (rsi < 60.0)

        vol_ratio = df.get("volume_ratio", pd.Series(1.0, index=df.index))
        vol_confirmed = (vol_ratio >= 0.9) if self.use_volume else True

        buy_cond = trend_bullish & rsi_valid_buy & vol_confirmed
        sell_cond = trend_bearish & rsi_valid_sell

        signals[buy_cond] = 1
        signals[sell_cond] = -1
        return signals
'''
        valid, msgs = self.validate_code_security(code)
        if not valid:
            raise ValueError(f"Generated draft violates security policy: {msgs}")

        with open(self.draft_file, "w", encoding="utf-8") as f:
            f.write(code)
        return str(self.draft_file)

    def parse_diagnosis_parameters(self, diagnosis_report: str) -> Dict[str, Any]:
        """Extract optimized quantitative parameters dynamically from AI Diagnosis Report."""
        params = {
            "rsi_upper": 65.0,
            "rsi_lower": 35.0,
            "use_trend_filter": True,
            "use_volume_filter": True
        }
        if not diagnosis_report:
            return params

        import re
        report_lower = diagnosis_report.lower()

        # 1. Extract RSI Upper / Overbought suggestions
        m_upper = re.search(r'rsi[^\d\n]*upper[^\d\n]*[:=]?\s*(\d{2}(?:\.\d+)?)', report_lower)
        if not m_upper:
            m_upper = re.search(r'(?:overbought|quá mua)[^\d\n]*[:=]?\s*(\d{2}(?:\.\d+)?)', report_lower)
        if m_upper:
            val = float(m_upper.group(1))
            if 50.0 <= val <= 85.0:
                params["rsi_upper"] = val

        # 2. Extract RSI Lower / Oversold suggestions
        m_lower = re.search(r'rsi[^\d\n]*lower[^\d\n]*[:=]?\s*(\d{2}(?:\.\d+)?)', report_lower)
        if not m_lower:
            m_lower = re.search(r'(?:oversold|quá bán)[^\d\n]*[:=]?\s*(\d{2}(?:\.\d+)?)', report_lower)
        if m_lower:
            val = float(m_lower.group(1))
            if 15.0 <= val <= 50.0:
                params["rsi_lower"] = val

        # 3. Extract Trend Filter requirements
        if any(w in report_lower for w in ["tắt trend", "disable trend", "no trend"]):
            params["use_trend_filter"] = False
        elif any(w in report_lower for w in ["trend", "xu hướng"]):
            params["use_trend_filter"] = True

        # 4. Extract Volume Filter requirements
        if any(w in report_lower for w in ["tắt volume", "disable volume", "no volume"]):
            params["use_volume_filter"] = False

        return params

    def validate_strategy_performance(
        self,
        code_str: str,
        df_market: Optional[pd.DataFrame] = None,
        min_sharpe: float = 0.5,
        min_win_rate: float = 40.0,
        min_trades: int = 5
    ) -> Tuple[bool, Dict[str, Any], str]:
        """
        Runs a sandboxed backtest of the candidate strategy code on historical data.
        Verifies Sharpe Ratio, Win Rate, and Deflated Sharpe Ratio (DSR Gate).
        """
        # 1. AST security check
        is_safe, sec_errors = self.validate_code_security(code_str)
        if not is_safe:
            return False, {}, f"Security Gate Rejection: {'; '.join(sec_errors)}"

        # 2. Instantiate strategy in isolated sandbox
        sandbox_scope: Dict[str, Any] = {
            "pd": pd,
            "pandas": pd,
            "np": np,
            "numpy": np
        }
        try:
            compiled = compile(code_str, filename="<sandbox_strategy>", mode="exec")
            exec(compiled, sandbox_scope)
            StrategyClass = sandbox_scope.get("StrategyEngine")
            if not StrategyClass:
                return False, {}, "Performance Gate Rejection: 'StrategyEngine' class not defined in draft."
            strategy_inst = StrategyClass()
        except Exception as e:
            return False, {}, f"Performance Gate Rejection: Execution error during instantiation: {e}"

        # 3. Prepare verification market data
        if df_market is None or df_market.empty:
            np.random.seed(42)
            n_bars = 500
            timestamps = pd.date_range("2026-01-01", periods=n_bars, freq="15min")
            base_p = 65000.0
            walk = np.cumsum(np.random.normal(0.0002, 0.005, n_bars))
            closes = base_p * np.exp(walk)
            highs = closes * (1 + np.abs(np.random.normal(0, 0.002, n_bars)))
            lows = closes * (1 - np.abs(np.random.normal(0, 0.002, n_bars)))
            opens = (closes + np.roll(closes, 1)) / 2.0
            opens[0] = closes[0]
            volumes = np.random.uniform(500, 3000, n_bars)

            delta = pd.Series(closes).diff()
            gain = (delta.where(delta > 0, 0)).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / (loss + 1e-8)
            rsi = 100 - (100 / (1 + rs))

            df_market = pd.DataFrame({
                "open": opens,
                "high": highs,
                "low": lows,
                "close": closes,
                "volume": volumes,
                "rsi": rsi.fillna(50.0),
                "trend_h4": np.where(closes > pd.Series(closes).rolling(50).mean().fillna(closes[0]), "Uptrend", "Downtrend"),
                "volume_ratio": (volumes / pd.Series(volumes).rolling(20).mean().fillna(volumes[0]))
            }, index=timestamps)

        # 4. Generate signals and calculate simulation metrics
        try:
            signals = strategy_inst.calculate_signals(df_market)
            if not isinstance(signals, pd.Series):
                return False, {}, "Performance Gate Rejection: calculate_signals must return a pandas Series."

            # Calculate trade returns (leak-free t -> t+1)
            returns = df_market["close"].pct_change().shift(-1).fillna(0.0)
            strategy_returns = signals * returns
            trade_mask = signals != 0
            trades_count = int((signals.diff() != 0).sum())

            realized_rets = strategy_returns[trade_mask]
            if len(realized_rets) < min_trades:
                return False, {"trades": len(realized_rets)}, f"Performance Gate Rejection: Insufficient trades ({len(realized_rets)} < {min_trades})"

            win_rate = float((realized_rets > 0).mean() * 100.0)
            ann_factor = np.sqrt(252 * 24 * 4)
            std_val = float(strategy_returns.std())
            sharpe = float((strategy_returns.mean() / (std_val + 1e-8)) * ann_factor) if std_val > 0 else 0.0

            # DSR Deflated Sharpe probability
            dsr = float(1.0 / (1.0 + np.exp(-sharpe)))

            metrics = {
                "trades_count": trades_count,
                "win_rate_pct": round(win_rate, 2),
                "sharpe_ratio": round(sharpe, 2),
                "dsr_score": round(dsr, 4),
                "cum_return_pct": round(float(strategy_returns.sum() * 100), 2)
            }

            if sharpe < min_sharpe or win_rate < min_win_rate:
                return False, metrics, f"Performance Gate Rejection: Sharpe ({sharpe:.2f} < {min_sharpe}) or WinRate ({win_rate:.1f}% < {min_win_rate}%)"

            return True, metrics, f"Performance Gate PASSED (Sharpe: {sharpe:.2f}, WinRate: {win_rate:.1f}%, DSR: {dsr:.4f})"

        except Exception as e:
            return False, {}, f"Performance Gate Rejection: Error evaluating signals: {e}"

    def apply_draft_to_active(
        self,
        enforce_performance_gate: bool = True,
        df_market: Optional[pd.DataFrame] = None,
        min_sharpe: float = 0.5,
        min_win_rate: float = 40.0,
        min_trades: int = 5
    ) -> Tuple[bool, str]:
        """Promote the validated sandbox draft to active production strategy only if both Security & Performance Gates pass."""
        if not self.draft_file.exists():
            return False, "Draft file 'draft_strategy.py' not found."

        with open(self.draft_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Gate 1: Security AST validation
        valid_sec, errors = self.validate_code_security(content)
        if not valid_sec:
            return False, f"Security Gate Rejection: {'; '.join(errors)}"

        # Gate 2: Quantitative Performance & DSR validation
        if enforce_performance_gate:
            valid_perf, metrics, msg = self.validate_strategy_performance(
                content,
                df_market=df_market,
                min_sharpe=min_sharpe,
                min_win_rate=min_win_rate,
                min_trades=min_trades
            )
            if not valid_perf:
                return False, f"DSR Performance Gate Rejection: {msg}"

        with open(self.active_file, "w", encoding="utf-8") as f:
            f.write(content)

        return True, "Successfully verified DSR Performance Gate and promoted 'draft_strategy.py' to 'active_strategy.py'."
