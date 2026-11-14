# NIFTY 50 Institutional DMA & Live Volume Platform

An institutional-grade quantitative stock screening, technical analysis, and real-time volume analytics platform for all 50 current NIFTY 50 constituents.

The platform continuously computes six Daily Simple Moving Averages (**5 DMA, 10 DMA, 20 DMA, 50 DMA, 100 DMA, 200 DMA**), Relative Volume (**RVOL**), price-volume confirmations, top heavyweight index impact, and generates comprehensive 12-sheet Excel workbooks.

---

## Key Capabilities

1. **Category A — 6/6 Bullish Alignment**:
   - Stocks where the closing price is strictly greater than all six DMAs (5, 10, 20, 50, 100, 200).
2. **Category B — Exactly 5/6 Bullish Alignment**:
   - Stocks clearing exactly five of six DMAs with explicit identification of the uncleared DMA and percentage distance.
3. **Fresh Bullish Crossovers & Transitions**:
   - Validates previous completed session (`Close[-2] <= DMA[-2]`) vs latest session (`Close[-1] > DMA[-1]`).
   - Tracks alignment transitions (`MAINTAINED_6_6`, `UPGRADED_5_TO_6`, `DOWNGRADED_6_TO_5`, `LOST_BULLISH_ALIGNMENT`).
   - Identifies stocks within 1.0% of a potential crossover (`approaching_crossovers`).
4. **Institutional Live Volume & RVOL Engine (All 50 Stocks)**:
   - 6-session average volume (`(V1 + V2 + V3 + V4 + V5 + V6) / 6`).
   - Relative Volume (`RVOL`) benchmarked against 5 prior completed sessions.
   - Five quantitative volume tiers: *Very High Volume*, *High Volume*, *Normal Volume*, *Low Volume*, *Declining Volume*.
   - Price-volume confirmation logic (institutional accumulation vs distribution).
5. **Top 7 NIFTY Heavyweights Dedicated Module**:
   - Granular tracking of **HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, and INFY** (~46% combined index weight).
   - Real-time market metrics, 6-session volume history tables, closest support levels.
   - Approximate index contribution points: `Weightage (%) * Price Change (%) / 100`.
   - Index concentration analysis (identifies leading vs lagging heavyweights).
6. **Combined DMA + Volume Signal Engine**:
   - Synthesizes DMA score, price direction, and volume confirmation into actionable institutional tiers:
     - `STRONG_BULLISH`: 6/6 DMA + Price Up + High/Very High Volume.
     - `BULLISH_WATCHLIST`: 5/6 or 6/6 DMA + Moderate/Normal Volume.
     - `FRESH_BREAKOUT`: Fresh Crossover + Volume Expansion.
     - `WEAKENING`: Alignment lost or high-volume divergence.
     - `NO_CONFIRMED_SIGNAL`: Baseline.
   - Strict rule: Volume alone never generates a bullish signal without DMA alignment.
7. **12-Sheet Daily Excel Report Generator**:
   - Generates formatted `NIFTY50_Institutional_DMA_Volume_YYYY-MM-DD.xlsx` daily workbooks with 12 dedicated sheets:
     1. Market Overview
     2. NIFTY50 Constituents
     3. 6-6 DMA Stocks
     4. 5-6 DMA Stocks
     5. Fresh Crossovers
     6. All 50 Live Volume
     7. Top 7 Heavyweights
     8. Six-Day Volume History
     9. DMA Comparison
     10. Volume Analytics
     11. Data Verification
     12. Scan History
   - Companion CSV files for rapid automated downstream pipelines.
8. **7-Page Responsive Trader Dashboard**:
   - Page 1: **Market Overview** (Executive KPIs, Heavyweight Impact, Combined Signals Top-10)
   - Page 2: **Daily DMA Scanner** (6/6, 5/6, Crossovers, Filter Controls)
   - Page 3: **All 50 Stocks Live Volume** (Search, Sector, DMA & Volume Filters)
   - Page 4: **Top 7 Heavyweight Tracker** (Selection Pills, 6-Session History, 6-DMA Grid)
   - Page 5: **Volume & RVOL Analytics** (RVOL Leaderboard, Bullish Confirmation, Distribution)
   - Page 6: **Stock Details & Chart** (Granular Single-Stock DMA and History Inspection)
   - Page 7: **Data Quality & Feed Status** (220+ Session Verification, Cache Status, Upstox Feed)

---

## Architecture & Technology Stack

- **Backend**: Python 3.11+ / 3.13, FastAPI, Pydantic v2, SQLAlchemy, openpyxl, Uvicorn, Pytest.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Database**: PostgreSQL / SQLite with automatic schema migration.
- **Historical Engine**: 220+ sessions verified per constituent, unadjusted closing prices matching NSE settlement.
- **Real-Time Feed**: Upstox Market Data Feed V3 with WebSocket streaming (`/ws/live-scanner`).

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, cache status, constituent count |
| `GET` | `/api/v1/health/data-status` | Historical data coverage and verification audit |
| `GET` | `/api/v1/constituents` | All 50 NIFTY constituents with official index weightages |
| `GET` | `/api/v1/scanner/daily` | Complete daily scan with 6/6, 5/6, transitions, and combined signals |
| `GET` | `/api/v1/scanner/daily/crossovers` | Fresh bullish crossovers and approaching candidates |
| `GET` | `/api/v1/volume/all-50` | 6-session volume analytics and RVOL for all 50 stocks |
| `GET` | `/api/v1/volume/{symbol}` | Individual stock volume analytics and 6-session history |
| `GET` | `/api/v1/heavyweights` | Top 7 heavyweights report with index contribution points |
| `GET` | `/api/v1/heavyweights/{symbol}` | Individual heavyweight detailed report card |
| `POST` | `/api/v1/export/generate` | Generates 12-sheet Excel report and companion CSVs |
| `GET` | `/api/v1/export/download/latest` | One-click download of the latest generated Excel workbook |
| `WS` | `/ws/live-scanner` | Real-time WebSocket streaming feed |

---

## Running Locally

### 1. Backend Server
```powershell
$env:PYTHONPATH = "backend"
backend\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Swagger API Docs: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 2. Frontend Development Server
```powershell
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (auto-proxies `/api` and `/ws` to port 8000).

### 3. Build Frontend for Production
```powershell
cd frontend
npm run build
```

### 4. Run Automated Test Suite
```powershell
$env:PYTHONPATH = "backend"
backend\venv\Scripts\pytest -v
```
*(All 52 tests pass with zero errors)*
