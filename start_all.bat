@echo off
title Vibe-Trading Launcher
echo ======================================================================
echo 🚀 KHOI DONG VIBE-TRADING (GOP 2 TAB CHUNG 1 CUA SO WINDOWS TERMINAL)
echo ======================================================================
cd /d "%~dp0"

:: Kiem tra su ton tai cua Windows Terminal (wt.exe)
where wt.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Dang mo 2 tab trong cung 1 cua so Windows Terminal...
    wt.exe -w 0 nt --title "Backend Server" -d "%CD%" cmd.exe /k "%~dp0start_backend.bat" ; nt --title "Frontend Web UI" -d "%CD%" cmd.exe /k "%~dp0start_frontend.bat"
) else (
    echo Khong tim thay Windows Terminal, mo bang cua so Command Prompt thuong...
    start "Backend Server" cmd.exe /k "%~dp0start_backend.bat"
    start "Frontend Web UI" cmd.exe /k "%~dp0start_frontend.bat"
)

echo.
echo ======================================================================
echo Backend Port:  http://127.0.0.1:8000
echo Frontend URL:  http://localhost:5899
echo ======================================================================
timeout /t 3 >nul
