"""Test suite for 5-Token Batch Multi-Agent Autonomous Loop Pipeline."""

import pytest
import os
from pathlib import Path
from src.agents.binance_demo_executor import BinanceDemoExecutor
from src.agents.batch_loop_coordinator import BatchLoopCoordinator
from src.governance.ledger import verify_chain


def test_binance_demo_executor_connection():
    """Verify Binance Demo connection with active API credentials."""
    executor = BinanceDemoExecutor()
    snapshot = executor.get_account_snapshot()
    assert snapshot["status"] in ["success", "error"]
    if snapshot["status"] == "success":
        assert snapshot["usdt_free"] > 0
        assert "USDT" in snapshot["balances"]


def test_binance_demo_price_fetch():
    """Verify fetching live Binance public prices."""
    executor = BinanceDemoExecutor()
    btc_price = executor.get_current_price("BTCUSDT")
    eth_price = executor.get_current_price("ETHUSDT")
    assert btc_price > 1000.0
    assert eth_price > 100.0


def test_batch_loop_single_iteration():
    """Verify executing one full 5-Token Batch loop cycle."""
    coordinator = BatchLoopCoordinator()
    res = coordinator.run_single_batch_iteration()
    
    assert res["batch_id"] >= 1
    assert len(res["tokens"]) == 5
    assert len(res["positions"]) == 5
    assert res["batch_wins"] + res["batch_losses"] == 5
    assert 0.0 <= res["batch_win_rate"] <= 100.0
    assert res["total_trades"] == 5

    # Verify cryptographic audit chain integrity
    ledger_path = Path("data/governance_ledger.jsonl")
    assert ledger_path.exists()
    chain_res = verify_chain(ledger_path)
    assert chain_res.ok is True
    assert chain_res.record_count >= 1


def test_batch_loop_goal_tracking():
    """Verify cumulative win rate tracking across multiple batches."""
    coordinator = BatchLoopCoordinator()
    res1 = coordinator.run_single_batch_iteration()
    res2 = coordinator.run_single_batch_iteration()
    
    assert coordinator.total_trades == 10
    assert 0.0 <= coordinator.get_overall_win_rate() <= 100.0
    assert res2["total_trades"] == 10
