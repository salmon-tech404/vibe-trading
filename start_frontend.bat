@echo off
title Vibe-Trading Frontend Web UI
echo ===================================================
echo [2/2] Dang khoi dong Vibe-Trading Frontend Web UI...
echo ===================================================
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Cai dat node_modules lan dau...
    call npm install
)
call npm run dev
pause
