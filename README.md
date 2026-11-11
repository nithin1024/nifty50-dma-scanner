# NIFTY 50 DMA Scanner — Daily + Live Market Analysis

A production-quality technical analysis and stock screening web application for all 50 current NIFTY 50 constituent stocks.

The application computes and tracks six Daily Simple Moving Averages (**5 DMA, 10 DMA, 20 DMA, 50 DMA, 100 DMA, 200 DMA**) and detects:
1. **6/6 Bullish Stocks**: Latest eligible price > all 6 SMAs.
2. **Exactly 5/6 Bullish Stocks**: Latest eligible price > exactly 5 of 6 SMAs.
3. **Fresh Bullish Crossovers**: Previous close &le; previous session SMA AND latest close > latest session SMA.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (trading dark-theme) + Lucide Icons.
- **Backend**: Python 3.11+ / 3.13 + FastAPI + Pydantic v2 + Uvicorn + Pytest.
- **Database**: PostgreSQL / SQLite via SQLAlchemy with automatic relational schema persistence.
- **Data Ingestion**: Official NSE historical Bhavcopy & verified exchange feeds with unadjusted settlement prices.
- **Live Intraday**: Upstox Market Data Feed V3 architecture with WebSocket streaming (`/ws/live-scanner`).

---

## 11-Level Development Status

- [x] **LEVEL 1 — PROJECT FOUNDATION**: Git repository, React TS, FastAPI, Tailwind CSS, health telemetry.
- [x] **LEVEL 2 — NIFTY 50 CONSTITUENTS**: Official NSE constituent registry, ISIN codes, Upstox instrument keys.
- [x] **LEVEL 3 — HISTORICAL MARKET DATA**: 200+ daily sessions per constituent, OHLC boundary verification, zero synthetic data.
- [x] **LEVEL 4 — DMA CALCULATION ENGINE**: 5, 10, 20, 50, 100, 200 DMA pure SMA mathematical engine, percentage distance metrics.
- [x] **LEVEL 5 — DAILY SCANNER**: Automated scan across all 50 constituents, 6/6 and 5/6 classifications.
- [x] **LEVEL 6 — FRESH BULLISH CROSSOVERS**: Session-by-session crossover detection (`Close[-2] <= SMA[-2]` and `Close[-1] > SMA[-1]`).
- [x] **LEVEL 7 — DATABASE PERSISTENCE**: SQLAlchemy relational models, history archiving, and constituent sync.
- [x] **LEVEL 8 — SECURE UPSTOX INTEGRATION**: V3 OAuth management, instrument mapping, permissions disclosure.
- [x] **LEVEL 9 — LIVE INTRADAY SCANNER**: Live price comparisons against completed daily SMAs, WebSocket live feed.
- [x] **LEVEL 10 — COMPREHENSIVE TESTING**: 29 automated test cases covering math, crossovers, API, and coverage report.
- [x] **LEVEL 11 — PUBLIC DEPLOYMENT**: Multi-stage Dockerfile, docker-compose, Procfile, and deployment documentation.

---

## Running the Application Locally

### Backend
```powershell
$env:PYTHONPATH = "backend"
backend\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/api/docs`
- Health: `http://127.0.0.1:8000/api/v1/health`
- Daily Scan: `http://127.0.0.1:8000/api/v1/scanner/daily`

### Frontend (Development)
```powershell
cd frontend
npm run dev
```
Open `http://localhost:3000` (auto-proxies `/api` and `/ws` to port 8000).

### Run Test Suite
```powershell
$env:PYTHONPATH = "backend"
backend\venv\Scripts\pytest -v
```

---

## Deployment
See [DEPLOYMENT.md](file:///c:/Users/nithi/OneDrive/Nithin/Indian%20Stock%20Market/DMA%20Stocks/docs/DEPLOYMENT.md) for Docker, Render, and Railway setup instructions.
