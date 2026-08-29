#!/usr/bin/env python3
"""Standard Model Context Protocol (MCP) Server for Vibe-Trading.

Exposes a JSON-RPC 2.0 stdio interface to Antigravity IDE Agent:
1. `scan_binance_market`: Quét toàn bộ 500+ token trên sàn Binance tìm coin có xung lực mạnh nhất.
2. `diagnose_loss_events`: Đọc và phân tích pháp y các lệnh dính Stop Loss thật từ `data/loss_events.json`.
3. `run_5_token_batch`: Kích hoạt chu trình Lô 5 Token tự hành trên Binance Demo.
4. `verify_governance_ledger`: Kiểm tra tính toàn vẹn của chuỗi mã băm SHA-256 trên Sổ cái `data/governance_ledger.jsonl`.
5. `read_master_xml_prompts`: Đọc toàn bộ kho tri thức XML 5 tầng từ `data/prompts/`.
6. `compile_and_validate_strategy`: Biên dịch code Python trong AST Sandbox và chạy kiểm định Cổng DSR.
"""

from __future__ import annotations

import os
import sys
import json
import logging
from pathlib import Path
from typing import Any, Dict, List

# Ensure UTF-8 on Windows stdio
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")

# Add agent path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "agent"))

from src.agents.loss_collector import LossCollector
from src.agents.diagnostic_agent import DiagnosticAgent
from src.agents.strategy_optimizer import StrategyOptimizer, StrategyASTSecurityVisitor
from src.agents.real_quant_engine import RealQuantEngine
from src.agents.batch_loop_coordinator import BatchLoopCoordinator
from src.governance.ledger import verify_chain

LEDGER_PATH = PROJECT_ROOT / "data" / "governance_ledger.jsonl"
PROMPTS_DIR = PROJECT_ROOT / "data" / "prompts"

TOOLS_DEFINITIONS = [
    {
        "name": "scan_binance_market",
        "description": "Quét toàn bộ 500+ cặp coin trên sàn Binance, lọc theo thanh khoản > $3M và xếp hạng các đồng coin đang có đà tăng & nén giá đẹp nhất.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "top_n": {"type": "integer", "description": "Số lượng coin tiềm năng muốn lấy (mặc định: 5)", "default": 5},
                "min_volume_usdt": {"type": "number", "description": "Khối lượng 24h tối thiểu USD (mặc định: 3,000,000)", "default": 3000000}
            }
        }
    },
    {
        "name": "diagnose_loss_events",
        "description": "Đọc toàn bộ các lệnh dính Stop Loss thật trong data/loss_events.json và xuất báo cáo pháp y (RSI, H4 Trend, Volume, Fakeout).",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "run_5_token_batch",
        "description": "Kích hoạt 1 chu trình Lô 5 Token tự hành trên tài khoản Binance Demo ($10,359.98 USDT), chốt kết quả và ghi Sổ cái kiểm toán.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "verify_governance_ledger",
        "description": "Kiểm tra tính toàn vẹn của chuỗi mã băm SHA-256 (hash-chain) trong data/governance_ledger.jsonl.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "read_master_xml_prompts",
        "description": "Đọc toàn bộ nội dung của kho Prompt XML 5 Tầng chuyên biệt đúc kết từ 38 cuốn sách tài chính trong data/prompts/.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tier": {"type": "string", "description": "Tầng muốn đọc: 'master', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5' hoặc 'all'", "default": "all"}
            }
        }
    },
    {
        "name": "compile_and_validate_strategy",
        "description": "Kiểm tra mã nguồn Python chiến lược qua bộ lọc AST Sandbox và chạy Backtest trên nến thật của Binance để đo Deflated Sharpe Ratio (DSR).",
        "inputSchema": {
            "type": "object",
            "required": ["code_content"],
            "properties": {
                "code_content": {"type": "string", "description": "Nội dung code Python của chiến lược cần kiểm thử an toàn"}
            }
        }
    }
]


def handle_scan_binance_market(args: Dict[str, Any]) -> Dict[str, Any]:
    top_n = args.get("top_n", 5)
    min_vol = args.get("min_volume_usdt", 3_000_000)
    coord = BatchLoopCoordinator()
    coins = coord.discover_top_market_candidates(min_volume_usdt=min_vol, top_pool=top_n)
    return {"status": "success", "top_candidates": coins, "count": len(coins)}


def handle_diagnose_loss_events(args: Dict[str, Any]) -> Dict[str, Any]:
    collector = LossCollector()
    diag = DiagnosticAgent()
    events = collector.load_events()
    report = diag.diagnose_losses(events)
    return {"status": "success", "event_count": len(events), "diagnosis_report": report}


def handle_run_5_token_batch(args: Dict[str, Any]) -> Dict[str, Any]:
    coord = BatchLoopCoordinator()
    res = coord.run_single_batch_iteration()
    return {"status": "success", "batch_result": res}


def handle_verify_governance_ledger(args: Dict[str, Any]) -> Dict[str, Any]:
    chain_res = verify_chain(LEDGER_PATH)
    return {
        "status": "success",
        "ok": chain_res.ok,
        "record_count": chain_res.record_count,
        "first_break": str(chain_res.first_break) if chain_res.first_break else None
    }


def handle_read_master_xml_prompts(args: Dict[str, Any]) -> Dict[str, Any]:
    tier = args.get("tier", "all").lower()
    prompts: Dict[str, str] = {}
    
    mapping = {
        "master": "master_system_architecture.xml",
        "tier1": "tier1_alpha_scanner.xml",
        "tier2": "tier2_strategy_codegen.xml",
        "tier3": "tier3_quant_robustness.xml",
        "tier4": "tier4_risk_execution.xml",
        "tier5": "tier5_meta_learning.xml"
    }

    if tier in mapping:
        fpath = PROMPTS_DIR / mapping[tier]
        if fpath.exists():
            prompts[tier] = fpath.read_text(encoding="utf-8")
    else:
        for k, fname in mapping.items():
            fpath = PROMPTS_DIR / fname
            if fpath.exists():
                prompts[k] = fpath.read_text(encoding="utf-8")

    return {"status": "success", "prompts": prompts}


def handle_compile_and_validate_strategy(args: Dict[str, Any]) -> Dict[str, Any]:
    code = args.get("code_content", "")
    opt = StrategyOptimizer()
    valid, msg = opt.validate_code_security(code)
    if not valid:
        return {"status": "rejected_by_ast", "reason": msg, "ast_passed": False}

    # Write to sandbox draft
    opt.draft_file.parent.mkdir(parents=True, exist_ok=True)
    opt.draft_file.write_text(code, encoding="utf-8")

    # Run quant backtest
    engine = RealQuantEngine()
    bt = engine.run_backtest_simulation("BTCUSDT", "15m", 500, use_active_strategy=False)
    return {
        "status": "success",
        "ast_passed": True,
        "backtest": bt,
        "dsr_survives": bt.get("dsr_survives", False)
    }


TOOL_HANDLERS = {
    "scan_binance_market": handle_scan_binance_market,
    "diagnose_loss_events": handle_diagnose_loss_events,
    "run_5_token_batch": handle_run_5_token_batch,
    "verify_governance_ledger": handle_verify_governance_ledger,
    "read_master_xml_prompts": handle_read_master_xml_prompts,
    "compile_and_validate_strategy": handle_compile_and_validate_strategy,
}


def main():
    """Main JSON-RPC 2.0 loop over stdio."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id")
            method = req.get("method")
            params = req.get("params", {})

            if method == "initialize":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "serverInfo": {
                            "name": "vibe-trading-mcp",
                            "version": "2.0.0"
                        },
                        "capabilities": {
                            "tools": {}
                        }
                    }
                }
            elif method == "tools/list":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": TOOLS_DEFINITIONS
                    }
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})
                handler = TOOL_HANDLERS.get(tool_name)
                if handler:
                    res_data = handler(tool_args)
                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(res_data, indent=2, ensure_ascii=False)
                                }
                            ]
                        }
                    }
                else:
                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "error": {
                            "code": -32601,
                            "message": f"Tool '{tool_name}' not found."
                        }
                    }
            elif method == "notifications/initialized":
                continue
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method '{method}' not supported."
                    }
                }

            sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()

        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32603,
                    "message": str(e)
                }
            }
            sys.stdout.write(json.dumps(err_resp, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
