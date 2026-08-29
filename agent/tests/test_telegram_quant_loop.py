"""Unit tests for the end-to-end Quantitative Agent and Security Governance Pipeline."""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
from unittest.mock import MagicMock

from src.agents.strategy_optimizer import StrategyOptimizer, StrategyASTSecurityVisitor
from src.agents.loss_collector import LossCollector, TradeContext
from src.agents.real_quant_engine import RealQuantEngine, enrich_technical_indicators, calculate_rsi, calculate_adx
from src.agents.telegram_leader import TelegramLeaderBot
from src.governance.ledger import append_record, verify_chain


def test_ast_security_visitor_allows_clean_code():
    """Verify clean quantitative strategy passes security inspection."""
    clean_code = """
import pandas as pd
import numpy as np

class StrategyEngine:
    def calculate_signals(self, df: pd.DataFrame) -> pd.Series:
        return (df['rsi'] < 30).astype(int)
"""
    optimizer = StrategyOptimizer()
    valid, msgs = optimizer.validate_code_security(clean_code)
    assert valid is True
    assert "VALID" in msgs[0]


def test_ast_security_visitor_blocks_dangerous_code():
    """Verify security visitor blocks dangerous execution and banned imports."""
    malicious_code_1 = """
import os
os.system("rm -rf /")
"""
    malicious_code_2 = """
eval("1 + 1")
"""
    malicious_code_3 = """
import subprocess
subprocess.Popen(["ls"])
"""
    optimizer = StrategyOptimizer()
    
    valid1, errs1 = optimizer.validate_code_security(malicious_code_1)
    assert valid1 is False
    assert any("forbidden module 'os'" in e for e in errs1)

    valid2, errs2 = optimizer.validate_code_security(malicious_code_2)
    assert valid2 is False
    assert any("Forbidden call to 'eval()'" in e for e in errs2)

    valid3, errs3 = optimizer.validate_code_security(malicious_code_3)
    assert valid3 is False
    assert any("forbidden module 'subprocess'" in e for e in errs3)


def test_technical_indicator_calculations():
    """Verify technical indicator calculations on sample price series."""
    np.random.seed(42)
    dates = pd.date_range("2026-01-01", periods=100, freq="15min")
    prices = 100 + np.cumsum(np.random.randn(100))
    df = pd.DataFrame({
        "open": prices,
        "high": prices + 1.0,
        "low": prices - 1.0,
        "close": prices,
        "volume": np.random.randint(100, 1000, size=100)
    }, index=dates)

    enriched = enrich_technical_indicators(df)
    assert "rsi" in enriched.columns
    assert "ema20" in enriched.columns
    assert "ema50" in enriched.columns
    assert "ema200" in enriched.columns
    assert "adx" in enriched.columns
    assert "trend_h4" in enriched.columns

    # Verify RSI bounded in [0, 100]
    assert (enriched["rsi"] >= 0).all() and (enriched["rsi"] <= 100).all()


def test_loss_collector_persistence(tmp_path: Path):
    """Verify loss telemetry collector writes and loads JSON properly."""
    collector = LossCollector(storage_path=tmp_path / "test_loss.json")
    trade = TradeContext(
        symbol="BTCUSDT",
        action="BUY",
        entry_price=65000.0,
        exit_price=64000.0,
        stop_loss=64000.0,
        take_profit=67000.0,
        pnl=-20.0,
        rsi=72.0,
        trend_h4="DOWNTREND"
    )
    collector.record_loss(trade)
    events = collector.load_events()
    assert len(events) == 1
    assert events[0]["symbol"] == "BTCUSDT"
    assert events[0]["pnl"] == -20.0


def test_governance_ledger_hash_chain(tmp_path: Path):
    """Verify native cryptographic governance ledger maintains unbroken hash chain."""
    ledger_file = tmp_path / "test_ledger.jsonl"
    
    rec1 = append_record(ledger_file, {"action": "PROMOTE_V1", "author": "dev"})
    rec2 = append_record(ledger_file, {"action": "PROMOTE_V2", "author": "dev"})
    
    assert rec1["seq"] == 1
    assert rec2["seq"] == 2
    assert rec2["prev_record_hash"] == rec1["record_hash"]

    res = verify_chain(ledger_file)
    assert res.ok is True
    assert res.record_count == 2


def test_telegram_leader_authorization():
    """Verify user ID authorization whitelist checks."""
    bot = TelegramLeaderBot()
    bot.allowed_users = {"123456", "@admin_user"}

    # Mock authorized update
    mock_auth = MagicMock()
    mock_auth.effective_user.id = 123456
    mock_auth.effective_user.username = "some_other"
    assert bot._is_authorized(mock_auth) is True

    # Mock unauthorized update
    mock_unauth = MagicMock()
    mock_unauth.effective_user.id = 999999
    mock_unauth.effective_user.username = "intruder"
    assert bot._is_authorized(mock_unauth) is False
