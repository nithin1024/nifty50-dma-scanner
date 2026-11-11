@echo off
echo ========================================================
echo Starting NIFTY 50 DMA Scanner - Frontend Dev Server
echo ========================================================
cd /d "%~dp0frontend"
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
npm run dev
pause
