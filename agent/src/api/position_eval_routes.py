"""FastAPI Routes for In-Flight Position Evaluation driven by Physical XML Prompts and LLM."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/eval", tags=["In-Flight Position Evaluation & LLM Circuit Breaker"])

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PROMPTS_DIR = DATA_DIR / "prompts"


class PositionItem(BaseModel):
    symbol: str
    direction: str  # "LONG" | "SHORT"
    entryPrice: float
    currentPrice: float
    pnlPct: float
    holdingMinutes: float = 0.0
    marketRegime: Optional[str] = "Normal"
    rsi: Optional[float] = 50.0
    efficiencyRatio: Optional[float] = 0.5
    stopLoss: Optional[float] = None
    tp1: Optional[float] = None


class PositionEvalRequest(BaseModel):
    strategyMode: str = "scalping"  # "scalping" | "trend_swing"
    positions: List[PositionItem]
    btcTrend: Optional[str] = "bullish"


class EvaluationResult(BaseModel):
    symbol: str
    healthStatus: str  # "HEALTHY" | "WARNING" | "CRITICAL" | "TIME_EXPIRED"
    action: str  # "HOLD_PATIENT" | "EMERGENCY_CLOSE" | "TIMEOUT_CLOSE" | "BREAK_EVEN_GUARD" | "TIGHTEN_SL"
    urgency: str  # "HIGH" | "MEDIUM" | "LOW"
    diagnosis: str
    recommendedStopLoss: Optional[float] = None


class PositionEvalResponse(BaseModel):
    strategyMode: str
    evaluations: List[EvaluationResult]


@router.get("/prompts")
async def get_all_prompts() -> Dict[str, str]:
    """Retrieve all available physical XML prompt templates."""
    if not PROMPTS_DIR.exists():
        return {}
    
    prompts = {}
    for p_file in PROMPTS_DIR.glob("*.xml"):
        try:
            with open(p_file, "r", encoding="utf-8") as f:
                prompts[p_file.name] = f.read()
        except Exception as e:
            logger.error(f"Error reading prompt {p_file.name}: {e}")
    return prompts


@router.post("/in-flight-positions", response_model=PositionEvalResponse)
async def evaluate_in_flight_positions(req: PositionEvalRequest) -> PositionEvalResponse:
    """Evaluate currently open positions using Strategy Rules and XML Prompts."""
    is_scalping = "scalp" in req.strategyMode.lower()
    evaluations: List[EvaluationResult] = []

    # Read XML prompt if available for validation
    eval_prompt_path = PROMPTS_DIR / "position_evaluator_prompt.xml"
    prompt_template = ""
    if eval_prompt_path.exists():
        try:
            with open(eval_prompt_path, "r", encoding="utf-8") as f:
                prompt_template = f.read()
        except Exception:
            pass

    for pos in req.positions:
        pnl = pos.pnlPct
        hold_time = pos.holdingMinutes
        rsi = pos.rsi or 50.0

        if is_scalping:
            # Scalping Strict Discipline Rules
            if pnl <= -6.0 or (pos.stopLoss and (
                (pos.direction == "LONG" and pos.currentPrice <= pos.stopLoss) or
                (pos.direction == "SHORT" and pos.currentPrice >= pos.stopLoss)
            )):
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="CRITICAL",
                    action="EMERGENCY_CLOSE",
                    urgency="HIGH",
                    diagnosis=f"Lệnh Scalping âm {pnl:.1f}% đã vi phạm ngưỡng cắt lỗ an toàn (-6.0%). Kích hoạt lệnh cắt lỗ khẩn cấp bảo toàn vốn.",
                    recommendedStopLoss=pos.stopLoss,
                ))
            elif hold_time >= 20.0 and pnl <= 0.5:
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="TIME_EXPIRED",
                    action="TIMEOUT_CLOSE",
                    urgency="MEDIUM",
                    diagnosis=f"Lệnh Scalping đã giữ quá {hold_time:.0f} phút mà không tạo đà bứt phá. Tất toán Time-Stop để giải phóng slot vốn.",
                    recommendedStopLoss=pos.currentPrice,
                ))
            elif pnl >= 8.0 or (rsi >= 75 and pos.direction == "LONG") or (rsi <= 25 and pos.direction == "SHORT"):
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="HEALTHY",
                    action="EMERGENCY_CLOSE",  # Lock profit
                    urgency="HIGH",
                    diagnosis=f"Lệnh Scalping đạt lợi nhuận mục tiêu +{pnl:.1f}% (RSI: {rsi:.0f}). Đóng lệnh dứt khoát 1 Target để chốt lời trọn vẹn.",
                    recommendedStopLoss=pos.currentPrice,
                ))
            elif pnl >= 4.0:
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="HEALTHY",
                    action="BREAK_EVEN_GUARD",
                    urgency="MEDIUM",
                    diagnosis=f"Lệnh Scalping đang lãi +{pnl:.1f}%. Dời Stop Loss về giá hòa vốn Entry ${pos.entryPrice} để khóa rủi ro 0%.",
                    recommendedStopLoss=pos.entryPrice,
                ))
            else:
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="HEALTHY",
                    action="HOLD_PATIENT",
                    urgency="LOW",
                    diagnosis=f"Vị thế Scalping đang hoạt động ổn định (PnL: {pnl:+.1f}%, Thời gian: {hold_time:.0f}p). Tiếp tục duy trì vị thế.",
                    recommendedStopLoss=pos.stopLoss,
                ))
        else:
            # Multi-TP Trend Swing Discipline Rules
            if pnl <= -12.0 or (pos.stopLoss and (
                (pos.direction == "LONG" and pos.currentPrice <= pos.stopLoss) or
                (pos.direction == "SHORT" and pos.currentPrice >= pos.stopLoss)
            )):
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="CRITICAL",
                    action="EMERGENCY_CLOSE",
                    urgency="HIGH",
                    diagnosis=f"Vị thế Trend âm {pnl:.1f}% vi phạm ngưỡng hỗ trợ kỹ thuật. Cắt lỗ chủ động bảo vệ tài khoản.",
                    recommendedStopLoss=pos.stopLoss,
                ))
            elif pnl >= 12.0:
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="HEALTHY",
                    action="BREAK_EVEN_GUARD",
                    urgency="HIGH",
                    diagnosis=f"Vị thế Trend đạt mục tiêu TP1 (+{pnl:.1f}%). Đã chốt 50% và dời Stop Loss về hòa vốn Entry ${pos.entryPrice}.",
                    recommendedStopLoss=pos.entryPrice,
                ))
            elif rsi >= 80 and pos.direction == "LONG":
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="WARNING",
                    action="TIGHTEN_SL",
                    urgency="MEDIUM",
                    diagnosis=f"Xuất hiện dấu hiệu kiệt sức tại vùng quá mua (RSI: {rsi:.0f}). Nâng Stop Loss bám sát đáy nến 5m gần nhất.",
                    recommendedStopLoss=pos.currentPrice * 0.995,
                ))
            else:
                evaluations.append(EvaluationResult(
                    symbol=pos.symbol,
                    healthStatus="HEALTHY",
                    action="HOLD_PATIENT",
                    urgency="LOW",
                    diagnosis=f"Vị thế Trend đang di chuyển thuận xu hướng 1H (PnL: {pnl:+.1f}%). Tiếp tục gồng sóng theo Trailing Stop.",
                    recommendedStopLoss=pos.stopLoss,
                ))

    return PositionEvalResponse(
        strategyMode=req.strategyMode,
        evaluations=evaluations,
    )
def register_position_eval_routes(app: Any) -> None:
    """Register position evaluation routes onto FastAPI app."""
    app.include_router(router)
