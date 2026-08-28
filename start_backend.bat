@echo off
title Vibe-Trading Backend Server
echo ===================================================
echo [1/2] Dang khoi dong Vibe-Trading API Backend...
echo ===================================================
cd /d "%~dp0"
set PYTHONPATH=agent
".venv\Scripts\python.exe" agent\api_server.py
pause
