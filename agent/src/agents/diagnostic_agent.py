"""Diagnostic Agent: Analyzes trade loss patterns using DeepSeek LLM or Rule-Based Engine."""

from __future__ import annotations

import os
import json
from typing import Any, Dict, List, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class DiagnosticAgent:
    """Specialist sub-agent that analyzes loss events and produces root-cause diagnosis."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.deepseek_key = (api_key or os.getenv("DEEPSEEK_API_KEY", "")).strip()
        
        # Select provider priority: Gemini Flash (Free/Cheap) or DeepSeek
        if self.gemini_key and not self.gemini_key.startswith("AIzaSy-your"):
            self.provider = "gemini"
            self.api_key = self.gemini_key
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            self.model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
        elif self.deepseek_key and not self.deepseek_key.startswith("sk-your"):
            self.provider = "deepseek"
            self.api_key = self.deepseek_key
            self.base_url = base_url or os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
            self.model_name = os.getenv("LANGCHAIN_MODEL_NAME", "deepseek-chat")
        else:
            self.provider = "heuristic"
            self.api_key = ""
            self.base_url = ""
            self.model_name = "heuristic"

    def diagnose_losses(self, loss_events: List[Dict[str, Any]]) -> str:
        """Diagnose a list of loss events and return actionable recommendations."""
        if not loss_events:
            return "✅ Hiện tại không ghi nhận lệnh thua nào cần phân tích."

        if self.api_key:
            try:
                return self._diagnose_with_llm(loss_events)
            except Exception as e:
                # If API call fails, fall back to rule-based analysis
                fallback = self._rule_based_diagnosis(loss_events)
                return f"{fallback}\n\n*(Lưu ý: {self.provider.upper()} API gặp lỗi tạm thời: {e}, chuyển sang phân tích heuristic)*"
        else:
            return self._rule_based_diagnosis(loss_events)

    def _diagnose_with_llm(self, loss_events: List[Dict[str, Any]]) -> str:
        """Call LLM API (Gemini or DeepSeek) for deep quantitative diagnosis."""
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key, base_url=self.base_url)

        system_prompt = (
            "Bạn là Bác sĩ Trưởng Chẩn đoán Chiến lược Trading (Senior Quantitative Diagnostic Agent). "
            "Nhiệm vụ của bạn là phân tích các lệnh thua, tìm ra nguyên nhân gốc rễ (Root Cause), "
            "phân loại lỗi theo xác suất (%) và đưa ra ĐƠN THUỐC CỤ THỂ (Actionable Fixes) để lập trình viên/Antigravity sửa code. "
            "Định dạng trả về: Markdown tiếng Việt, chuyên nghiệp, rõ ràng, gạch đầu dòng ngắn gọn."
        )

        user_prompt = (
            f"Dưới đây là danh sách {len(loss_events)} lệnh giao dịch bị THUA kèm bối cảnh kỹ thuật tại thời điểm vào lệnh:\n\n"
            f"```json\n{json.dumps(loss_events, indent=2, ensure_ascii=False)}\n```\n\n"
            "Hãy phân tích:\n"
            "1. Thống kê nhanh và quy luật chung của các lệnh thua.\n"
            "2. Nguyên nhân cốt lõi (Phân loại theo tỷ lệ % lỗi, ví dụ: Ngược trend H4, Mua tại vùng quá mua RSI, Sideway thiếu volume...).\n"
            "3. Đề xuất cụ thể 2-3 bộ lọc hoặc điều kiện logic cần thêm vào code chiến lược để loại bỏ các lệnh thua này."
        )

        response = client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1500,
        )

        return response.choices[0].message.content or "Không nhận được phản hồi từ mô hình."

    def _rule_based_diagnosis(self, loss_events: List[Dict[str, Any]]) -> str:
        """Fast heuristic diagnosis when API key is not yet set."""
        total_losses = len(loss_events)
        counter_trend_count = 0
        overbought_buy_count = 0
        low_volume_count = 0
        asian_session_count = 0

        for trade in loss_events:
            action = trade.get("action", "")
            trend_h4 = trade.get("trend_h4", "")
            rsi = trade.get("rsi") or 50.0
            volume_ratio = trade.get("volume_ratio") or 1.0
            session = trade.get("session", "")

            if (action == "BUY" and trend_h4 == "DOWNTREND") or (action == "SELL" and trend_h4 == "UPTREND"):
                counter_trend_count += 1
            if action == "BUY" and rsi > 70:
                overbought_buy_count += 1
            if volume_ratio < 0.8:
                low_volume_count += 1
            if session == "Asian":
                asian_session_count += 1

        pct_trend = (counter_trend_count / total_losses) * 100
        pct_rsi = (overbought_buy_count / total_losses) * 100
        pct_vol = (low_volume_count / total_losses) * 100
        pct_asia = (asian_session_count / total_losses) * 100

        report = [
            f"🔬 **BÁO CÁO CHẨN ĐOÁN LỆNH THUA ({total_losses} LỆNH)**",
            "─────────────────────────────────",
            "**1. Phân loại Nguyên nhân cốt lõi (Root Cause):**",
            f"• 📉 **Lỗi ngược Xu hướng Khung Lớn (H4 Trend):** {counter_trend_count}/{total_losses} lệnh ({pct_trend:.1f}%)",
            f"  ↳ *Vào lệnh BUY khi H4 đang DOWNTREND hoặc SELL khi H4 đang UPTREND.*",
            f"• ⚠️ **Lỗi Mua tại Vùng Quá Mua (RSI > 70):** {overbought_buy_count}/{total_losses} lệnh ({pct_rsi:.1f}%)",
            f"  ↳ *Fomo mua đuổi tại đỉnh ngắn hạn dẫn đến bị quét Stop Loss.*",
            f"• 🔕 **Lỗi Thị trường Đi ngang / Thanh khoản yếu:** {low_volume_count}/{total_losses} lệnh ({pct_vol:.1f}%)",
            f"  ↳ *Khối lượng Volume < 80% trung bình 20 phiên, xuất hiện nhiều nến Fakeout.*",
            f"• 🌏 **Phân bố Phiên Giao Dịch:** {asian_session_count}/{total_losses} lệnh ({pct_asia:.1f}%) xảy ra ở Phiên Á.",
            "",
            "**2. Đề xuất Tối ưu hóa Code cho Antigravity:**",
            "1. **Thêm bộ lọc Xu hướng H4:** Chỉ cho phép BUY khi `trend_h4 == 'UPTREND'` và SELL khi `trend_h4 == 'DOWNTREND'`.",
            "2. **Thêm ngưỡng an toàn RSI:** Cấm BUY khi `RSI > 65` và cấm SELL khi `RSI < 35`.",
            "3. **Thêm bộ lọc Thanh khoản (Volume Filter):** Chỉ kích hoạt tín hiệu khi `volume_current > volume_sma_20 * 1.1`.",
            "─────────────────────────────────",
            "💡 *Bạn có thể yêu cầu Antigravity áp dụng ngay các bộ lọc trên vào bản nháp chiến lược.*"
        ]

        return "\n".join(report)
