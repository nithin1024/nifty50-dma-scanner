@echo off
echo ========================================================
echo Starting NIFTY 50 DMA Scanner - FastAPI Backend
echo ========================================================
cd /d "%~dp0"
backend\venv\Scripts\uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
pause
