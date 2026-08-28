"""Runner script for Telegram Leader Agent."""

import sys
import os
from pathlib import Path

# Add agent directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
agent_dir = root_dir / "agent"
sys.path.insert(0, str(agent_dir))

from src.agents.telegram_leader import TelegramLeaderBot

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 ĐANG KHỞI ĐỘNG AI AGENT LEADER (TELEGRAM BOT)...")
    print("=" * 60)
    bot = TelegramLeaderBot()
    bot.run()
