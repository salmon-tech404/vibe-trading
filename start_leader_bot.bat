@echo off
title Vibe-Trading AI Agent Leader
echo ========================================================
echo   KHOI DONG AI AGENT LEADER (TELEGRAM: @velx_trading_bot)
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate.bat
python scripts\start_leader_bot.py
pause
