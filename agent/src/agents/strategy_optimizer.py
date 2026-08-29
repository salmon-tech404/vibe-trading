"""Safe AST Security Validator and Sandbox Strategy Promotion Engine."""

from __future__ import annotations

import ast
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

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

    def apply_draft_to_active(self) -> Tuple[bool, str]:
        """Promote the validated sandbox draft to active production strategy."""
        if not self.draft_file.exists():
            return False, "Draft file 'draft_strategy.py' not found."

        with open(self.draft_file, "r", encoding="utf-8") as f:
            content = f.read()

        valid, errors = self.validate_code_security(content)
        if not valid:
            return False, f"Security Gate Rejection: {'; '.join(errors)}"

        with open(self.active_file, "w", encoding="utf-8") as f:
            f.write(content)

        return True, "Successfully promoted 'draft_strategy.py' to 'active_strategy.py'."
