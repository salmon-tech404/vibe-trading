"""FastAPI Routes for Physical Reflection Storage and Strategy Active Learning Memory."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reflections", tags=["Strategy Reflections & Continuous Learning"])

# Base data directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
REFLECTIONS_DIR = DATA_DIR / "reflections"


def _get_strategy_dir(strategy_mode: str) -> Path:
    normalized = "scalping" if "scalp" in strategy_mode.lower() else "trend_swing"
    target_dir = REFLECTIONS_DIR / normalized
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


class ReflectionEntry(BaseModel):
    id: str = Field(..., description="Unique reflection ID, e.g. REF-170000000")
    symbol: str
    direction: str  # "LONG" | "SHORT"
    entryPrice: float
    exitPrice: float
    pnlUsd: float
    roiPct: float
    outcome: str  # "Target Hit" | "Stop Loss" | "Breakeven" | "Time Exit"
    strategyName: str
    strategyId: str
    timestamp: str
    marketRegime: str
    setupScore: float
    entryReason: str
    postMortemDiagnosis: str
    actionTaken: str
    strategyMode: Optional[str] = "scalping"  # "scalping" | "trend_swing"


@router.get("/{strategy_mode}")
async def list_reflections(strategy_mode: str, limit: int = Query(50, ge=1, le=500)) -> List[Dict[str, Any]]:
    """Read reflections from the physical .jsonl file for the specified strategy mode."""
    target_dir = _get_strategy_dir(strategy_mode)
    jsonl_file = target_dir / f"{target_dir.name}_reflections.jsonl"

    if not jsonl_file.exists():
        return []

    entries: List[Dict[str, Any]] = []
    try:
        with open(jsonl_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        return entries[-limit:]
    except Exception as exc:
        logger.error(f"Failed to read reflections from {jsonl_file}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/{strategy_mode}")
async def append_reflection(strategy_mode: str, entry: ReflectionEntry) -> Dict[str, Any]:
    """Append a new reflection post-mortem record directly to the physical .jsonl file."""
    target_dir = _get_strategy_dir(strategy_mode)
    jsonl_file = target_dir / f"{target_dir.name}_reflections.jsonl"

    record = entry.model_dump()
    if not record.get("timestamp"):
        record["timestamp"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    try:
        with open(jsonl_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        # Update learned rules summary file
        rules_file = target_dir / f"{target_dir.name}_rules_learned.json"
        learned_rules = []
        if rules_file.exists():
            try:
                with open(rules_file, "r", encoding="utf-8") as rf:
                    existing_data = json.load(rf)
                    learned_rules = existing_data.get("learned_rules", [])
            except Exception:
                learned_rules = []

        if entry.actionTaken and entry.actionTaken not in [r.get("rule") for r in learned_rules]:
            learned_rules.append({
                "rule": entry.actionTaken,
                "learnedFrom": entry.id,
                "outcome": entry.outcome,
                "symbol": entry.symbol,
                "timestamp": record["timestamp"]
            })
            with open(rules_file, "w", encoding="utf-8") as wf:
                json.dump({"strategy": target_dir.name, "learned_rules": learned_rules[-30:]}, wf, indent=2, ensure_ascii=False)

        return {"status": "success", "id": entry.id, "file": str(jsonl_file)}
    except Exception as exc:
        logger.error(f"Failed to write reflection to {jsonl_file}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{strategy_mode}/prompt-context")
async def get_prompt_context(strategy_mode: str, limit: int = Query(5, ge=1, le=20)) -> Dict[str, Any]:
    """Retrieve summarized lessons-learned to inject directly into LLM prompts."""
    target_dir = _get_strategy_dir(strategy_mode)
    rules_file = target_dir / f"{target_dir.name}_rules_learned.json"
    jsonl_file = target_dir / f"{target_dir.name}_reflections.jsonl"

    rules: List[str] = []
    if rules_file.exists():
        try:
            with open(rules_file, "r", encoding="utf-8") as rf:
                data = json.load(rf)
                rules = [r.get("rule", "") for r in data.get("learned_rules", []) if r.get("rule")]
        except Exception:
            rules = []

    recent_reflections: List[Dict[str, Any]] = []
    if jsonl_file.exists():
        try:
            with open(jsonl_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        recent_reflections.append(json.loads(line.strip()))
            recent_reflections = recent_reflections[-limit:]
        except Exception:
            pass

    # Build formatted prompt text
    mode_title = "SCALPING (LƯỚT SÓNG NHANH)" if target_dir.name == "scalping" else "MULTI-TP TREND (GỒNG SÓNG XU HƯỚNG)"
    lines = [f"=== [BỘ NHỚ KINH NGHIỆM CHIẾN LƯỢC: {mode_title}] ==="]

    if rules:
        lines.append("--- CÁC QUY TẮC ĐÃ RÚT RA TỪ QUÁ KHỨ ---")
        for idx, r in enumerate(rules[-5:], 1):
            lines.append(f"{idx}. {r}")

    if recent_reflections:
        lines.append("\n--- CHẨN ĐOÁN CÁC LỆNH GẦN ĐÂY ---")
        for ref in recent_reflections:
            outcome_symbol = "+" if (ref.get("pnlUsd") or 0) >= 0 else "-"
            lines.append(
                f"• [{ref.get('symbol')}] {ref.get('outcome')} ({outcome_symbol}${abs(ref.get('pnlUsd', 0)):.2f}): "
                f"{ref.get('postMortemDiagnosis', '')} -> Bài học: {ref.get('actionTaken', '')}"
            )

    return {
        "strategyMode": target_dir.name,
        "promptContext": "\n".join(lines),
        "totalReflections": len(recent_reflections),
        "activeRulesCount": len(rules)
    }


def register_reflection_routes(app: Any) -> None:
    """Register reflection routes onto FastAPI app."""
    app.include_router(router)

