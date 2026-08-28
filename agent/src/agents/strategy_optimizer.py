"""Strategy Optimizer: Generates and tests strategy refinements inside a safe sandbox."""

from __future__ import annotations

import ast
import os
import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


class StrategyOptimizer:
    """Sub-agent responsible for strategy parameter tuning and sandbox logic refinement."""

    def __init__(self, sandbox_dir: Optional[Path] = None):
        self.sandbox_dir = sandbox_dir or Path("strategies/sandbox")
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)
        self.draft_file = self.sandbox_dir / "draft_strategy.py"
        self.active_file = Path("strategies/active_strategy.py")
        self.active_file.parent.mkdir(parents=True, exist_ok=True)

    def validate_code_syntax(self, code_str: str) -> Tuple[bool, str]:
        """Validate Python code AST syntax."""
        try:
            ast.parse(code_str)
            return True, "AST syntax check passed successfully."
        except SyntaxError as e:
            return False, f"Syntax Error on line {e.lineno}: {e.msg}"

    def create_initial_draft(self) -> str:
        """Create a default draft strategy if not exists."""
        code = '''"""Vibe-Trading Auto-Optimized Strategy Draft."""

import pandas as pd
import numpy as np

class StrategyEngine:
    def __init__(self, rsi_period: int = 14, rsi_upper: float = 65.0, rsi_lower: float = 35.0):
        self.rsi_period = rsi_period
        self.rsi_upper = rsi_upper
        self.rsi_lower = rsi_lower
        self.use_h4_trend_filter = True
        self.use_volume_filter = True

    def calculate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Generate trading signals: 1 for BUY, -1 for SELL, 0 for HOLD."""
        signals = pd.Series(0, index=df.index)
        
        # Rule 1: Trend Filter (H4 Alignment)
        trend_bullish = df.get('trend_h4', 'UPTREND') == 'UPTREND'
        trend_bearish = df.get('trend_h4', 'DOWNTREND') == 'DOWNTREND'
        
        # Rule 2: RSI Bound Filter (Avoid buying in overbought)
        rsi = df.get('rsi', pd.Series(50, index=df.index))
        rsi_valid_buy = rsi < self.rsi_upper
        rsi_valid_sell = rsi > self.rsi_lower
        
        # Rule 3: Volume Confirmation
        vol_ratio = df.get('volume_ratio', pd.Series(1.0, index=df.index))
        vol_confirmed = vol_ratio >= 1.0
        
        # Combined Signal Generation
        buy_condition = trend_bullish & rsi_valid_buy & vol_confirmed
        sell_condition = trend_bearish & rsi_valid_sell & vol_confirmed
        
        signals[buy_condition] = 1
        signals[sell_condition] = -1
        return signals
'''
        with open(self.draft_file, "w", encoding="utf-8") as f:
            f.write(code)
        return str(self.draft_file)

    def apply_draft_to_active(self) -> Tuple[bool, str]:
        """Promote the draft strategy to active upon user approval."""
        if not self.draft_file.exists():
            return False, "Không tìm thấy file draft_strategy.py để triển khai."

        with open(self.draft_file, "r", encoding="utf-8") as f:
            content = f.read()

        valid, msg = self.validate_code_syntax(content)
        if not valid:
            return False, f"Code bị lỗi cú pháp, không thể áp dụng: {msg}"

        with open(self.active_file, "w", encoding="utf-8") as f:
            f.write(content)

        return True, "Đã áp dụng thành công `draft_strategy.py` vào `active_strategy.py`!"
