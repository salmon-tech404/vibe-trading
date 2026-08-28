"""
Knowledge Hub & Grounding Engine
Connects Vibe-Trading agents, indicators, and backtesting tools with the distilled
principles from the 21-volume Finance & Quantitative Trading Knowledge Base.
"""

import os
import sys
import re
from typing import Dict, List, Optional

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

KNOWLEDGE_DIR = os.path.dirname(os.path.abspath(__file__))

class KnowledgeHub:
    """Provides querying and rule checking across the 6 Quantitative Knowledge Pillars."""

    @staticmethod
    def list_pillars() -> List[Dict[str, str]]:
        pillars = []
        for fname in sorted(os.listdir(KNOWLEDGE_DIR)):
            if fname.endswith(".md") and fname != "KNOWLEDGE_BASE_CATALOG.md":
                path = os.path.join(KNOWLEDGE_DIR, fname)
                with open(path, "r", encoding="utf-8") as f:
                    first_line = f.readline().strip().lstrip("#").strip()
                pillars.append({
                    "filename": fname,
                    "title": first_line,
                    "path": path
                })
        return pillars

    @staticmethod
    def get_pillar_content(pillar_name: str) -> Optional[str]:
        for fname in os.listdir(KNOWLEDGE_DIR):
            if pillar_name.lower() in fname.lower() and fname.endswith(".md"):
                path = os.path.join(KNOWLEDGE_DIR, fname)
                with open(path, "r", encoding="utf-8") as f:
                    return f.read()
        return None

    @staticmethod
    def search(query: str) -> List[Dict[str, str]]:
        """Search across all knowledge cards for relevant trading rules and math."""
        results = []
        query_terms = query.lower().split()
        for fname in os.listdir(KNOWLEDGE_DIR):
            if fname.endswith(".md"):
                path = os.path.join(KNOWLEDGE_DIR, fname)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                score = sum(1 for term in query_terms if term in content.lower())
                if score > 0:
                    results.append({
                        "file": fname,
                        "score": score,
                        "matches": [line.strip() for line in content.split("\n") if any(term in line.lower() for term in query_terms)][:5]
                    })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    @staticmethod
    def get_strategy_grounding_checklist() -> Dict[str, List[str]]:
        """Returns the institutional quant verification checklist for any strategy or indicator."""
        return {
            "Regime_Adaptability": [
                "Is the market regime explicitly identified (Trend vs Range vs High Volatility)?",
                "Does the strategy dynamically adjust indicators using Kaufman Efficiency Ratio (ER) or Hurst Exponent?",
                "Are trend-following signals suppressed during low-ER chop to prevent whipsaws?"
            ],
            "Order_Flow_and_Leading_Signals": [
                "Does the entry rely on leading microstructure signals (Liquidity Sweeps, FVGs, Volume Divergence) rather than lagging MA crosses?",
                "Is higher timeframe (HTF) market structure confirming the lower timeframe (LTF) trigger?"
            ],
            "Risk_and_Money_Management": [
                "Is Stop Loss calculated dynamically based on ATR volatility rather than a fixed arbitrary percentage?",
                "Are multiple Take-Profit levels (TP1, TP2, TP3) established with a trailing stop mechanism?",
                "Is single-trade risk capped at 1-2% of total capital (Fractional Kelly sizing)?"
            ],
            "Backtest_and_Statistical_Rigor": [
                "Has lookahead bias and survivorship bias been strictly eliminated?",
                "Is Deflated Sharpe Ratio (DSR) or Purged Cross-Validation applied to account for multiple testing?"
            ]
        }

if __name__ == "__main__":
    hub = KnowledgeHub()
    print("=== Available Quant Knowledge Pillars ===")
    for p in hub.list_pillars():
        print(f"- {p['filename']}: {p['title']}")
    
    print("\n=== Search for 'Kaufman' ===")
    res = hub.search("Kaufman")
    for r in res:
        print(f"File: {r['file']}, Score: {r['score']}")
