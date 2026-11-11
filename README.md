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
- **Database**: PostgreSQL (Migrations via Alembic — initialized in Level 7).
- **Data Ingestion**: Official NSE historical Bhavcopy (Level 3) & Upstox Market Data Feed V3 (Level 8).

---

## Project Structure

```
nifty50-dma-scanner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app & CORS configuration
│   │   ├── config.py            # Typed settings via pydantic-settings
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py    # Health telemetry
│   │   │       ├── stocks.py    # NIFTY 50 constituents (Level 2)
│   │   │       ├── daily_scanner.py # Daily 6/6 and 5/6 scanner (Level 5)
│   │   │       ├── live_scanner.py  # Live intraday scanner (Level 9)
│   │   │       └── data_status.py   # Provenance & quality audit
│   │   ├── services/            # Business & calculation engines
│   │   ├── models/              # Database models
│   │   ├── schemas/             # Request & response schemas
│   │   ├── database/            # Database session handlers
│   │   └── workers/             # Background ingestion tasks
│   ├── tests/
│   │   └── test_health.py       # Async API test suite
│   ├── requirements.txt         # Backend Python dependencies
│   ├── .env.example             # Documented environment template
│   └── venv/                    # Isolated Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx       # Responsive mobile/desktop navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Primary metrics & telemetry
│   │   │   ├── DailyScanner.tsx # Daily 6/6 & 5/6 scanner view
│   │   │   ├── LiveScanner.tsx  # Live streaming provisional signals
│   │   │   ├── StockDetails.tsx # Deep-dive charts & DMA breakdowns
│   │   │   ├── ScanHistory.tsx  # Historical scan records
│   │   │   └── DataStatus.tsx   # Provenance audit & quality levels
│   │   ├── services/
│   │   │   └── api.ts           # Typed API client
│   │   ├── types/
│   │   │   └── index.ts         # Shared TypeScript interfaces
│   │   ├── App.tsx              # Root component & polling loop
│   │   ├── main.tsx
│   │   └── index.css            # Tailwind CSS styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts           # Vite bundler with reverse proxy
├── pytest.ini
├── .gitignore
└── README.md
```

---

## Development Setup

### Backend
```powershell
# Activate virtual environment
backend\venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt

# Run test suite
pytest

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```powershell
cd frontend
npm install
npm run build
npm run dev
```

Visit the app at `http://localhost:3000` (automatically proxies `/api` to the backend on port 8000).

---

## Development Milestones

- [x] **Level 1 — Project Foundation** (Repository, FastAPI, React TS, Tailwind, Health Telemetry, Zero Mock in Prod)
- [ ] **Level 2 — NIFTY 50 Constituents**
- [ ] **Level 3 — Historical Market Data Ingestion**
- [ ] **Level 4 — 6-DMA Calculation Engine**
- [ ] **Level 5 — Daily Scanner (6/6 & 5/6)**
- [ ] **Level 6 — Fresh Bullish Crossovers**
- [ ] **Level 7 — PostgreSQL Persistence & Alembic Migrations**
- [ ] **Level 8 — Upstox V3 OAuth & Instrument Mapping**
- [ ] **Level 9 — Live Intraday Scanner & WebSockets**
- [ ] **Level 10 — End-to-End Testing & Historical Calibration**
- [ ] **Level 11 — Production Deployment & Public Verification**
