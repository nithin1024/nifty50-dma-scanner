# Project Audit — NIFTY 50 Institutional DMA + Live Volume Scanner
**Date**: November 14, 2026  
**Auditor**: Antigravity Quantitative Engineering  
**Version**: 1.0.0-audit  

---

## Executive Summary

An exhaustive technical audit of the NIFTY 50 DMA Scanner repository was conducted. The project has a clean architectural foundation (FastAPI backend with SQLAlchemy and Pydantic v2; React 19 + TypeScript frontend with Tailwind CSS; 29 passing automated test cases). However, to evolve into a production-grade **institutional quantitative equity analysis platform**, critical modules must be implemented and upgraded, specifically:
1. Dynamic constituent tracking with official NIFTY 50 index weightages and CSV exports.
2. An institutional Volume Analytics Engine (6-session average volume, completed and intraday RVOL, volume trend classifications, and price-volume confirmation).
3. A dedicated Top 7 NIFTY Heavyweight stock analytics module (HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, INFY) with live market metrics, 6-session volume history, DMA support levels, and approximate index contribution calculation.
4. Combined DMA + Volume Signal Engine (Strong Bullish, Bullish Watchlist, Fresh Breakout, Weakening, No Confirmed Signal).
5. Comprehensive 12-sheet institutional daily Excel workbook generation (`NIFTY50_Institutional_DMA_Volume_YYYY-MM-DD.xlsx`) with conditional formatting and companion CSVs.
6. A responsive 7-page dashboard with institutional quantitative visualizations.

---

## Existing Module Audit & Action Matrix

| Module | Existing status | Missing functionality | Required action |
|---|---|---|---|
| **Stock universe** | Basic static registry in `constituents_service.py` (50 symbols, ISINs, industries). Dynamic fetching attempts basic CSV. | Dynamic official index weightages (%), sector classifications, effective change dates, and official constituent export to `data/nifty50_constituents.csv`. | **Improve**: Incorporate official index weightages, dynamic fetch with robust fallback, and CSV persistence with metadata. |
| **Historical data** | Yahoo Finance daily candle ingestion (248 sessions) in `historical_data_service.py`. Boundary validation and JSON caching. | Secondary data fallbacks (NSE Bhavcopy / UDiFF / multi-source failover), explicit 220+ session enforcement, structured `data/cache/`, `data/logs/` directories, and source-level verification records. | **Improve**: Enforce >=220 sessions, implement multi-source fallback pipelines, create directory structure, and log verification details. |
| **DMA calculations** | 5, 10, 20, 50, 100, 200 SMA engine in `dma_service.py`. Strict `P > SMA` check, percentage distance calculation. 6/6 and 5/6 classifications. | Category B (5/6 bullish) does not explicitly identify which single DMA remains uncleared. Insufficient ranking metrics for combined price/volume strength. | **Verify & Improve**: Enhance 5/6 classification to clearly return the exact uncleared DMA period and name; add quantitative sorting. |
| **Crossover scanner** | `crossover_service.py` compares `Close[-2] <= SMA[-2]` and `Close[-1] > SMA[-1]`. Intraday provisional crossing detection. | Tracking for transition states: maintaining bullish alignment, moving from 5/6 to 6/6, falling from 6/6 to 5/6, losing alignment, and approaching crossover within proximity threshold. | **Improve**: Implement full transition-state tracker and potential crossover proximity alert engine. |
| **Live volume** | Incomplete / stubbed. `upstox_service.py` sets `live_price = completed_close` with zero live volume processing. | Real-time cumulative volume tracking for ALL 50 stocks, 6-session average volume `(V1..V6)/6`, completed-session RVOL, same-time-of-day intraday RVOL benchmark, volume classifications, and price-volume confirmation. | **Implement**: Complete institutional live volume engine for all 50 stocks with Upstox V3 live WebSocket + fallback market data, volume change %, and RVOL models. |
| **Heavyweight tracking** | Missing dedicated tracker. Heavyweights are treated like any generic constituent. | Dedicated tracking service for top 7 (HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, INFY): live metrics, 6-session volume history table, volume analytics, DMA support levels, and approximate index contribution calculation. | **Implement**: Dedicated heavyweight tracker module, analytics API, and dedicated UI dashboard cards. |
| **Combined signals** | Signals are purely DMA-based without volume confirmation. | Combined technical + volume classification: Strong Bullish, Bullish Watchlist, Fresh Breakout, Weakening, No Confirmed Signal. | **Implement**: Combined Signal Engine synthesizing price trend, DMA alignment, and volume expansion/divergence. |
| **Dashboard** | 6 basic React tabs (Dashboard, DailyScanner, LiveScanner, StockDetails, ScanHistory, DataStatus). | The 7 institutional pages: 1. Market Overview, 2. DMA Scanner, 3. All 50 Stocks Volume Dashboard, 4. Top 7 Heavyweights, 5. Volume Analytics, 6. Historical Analysis, 7. Data Quality. Interactive charts and filters. | **Improve**: Upgrade frontend into responsive, institutional 7-page interface with sorting, filtering, and Plotly/charting. |
| **Excel reports** | Completely missing. No Excel or CSV export pipeline exists. | 12-sheet Excel report (`NIFTY50_Institutional_DMA_Volume_YYYY-MM-DD.xlsx`) with formulas, conditional formatting, filters, and companion CSV files. | **Implement**: Full openpyxl-based institutional report generator covering all 12 specified sheets. |
| **Automated testing** | 29 tests passing for basic DMA math, crossover, health, database, and historical candle integrity. | Automated tests for volume calculations, RVOL formulas, intraday RVOL time-of-day logic, top 7 index contribution approximations, and Excel export sheet integrity. | **Implement**: Expand pytest test suite to cover all quantitative formulas, volume analytics, and export integrity. |

---

## Detailed Codebase Findings

### 1. Calculation & Logic Verification
- **DMA Calculation**: The SMA implementation in `dma_service.py` uses unrounded float sliding windows and evaluates strict inequalities (`price > sma`). This is mathematically correct and institutional standard.
- **5/6 Bullish Classification**: While `score == 5` is detected, the API response does not explicitly single out the missing DMA (e.g., `"failed_dma": "dma50"`). Institutional traders need instant visibility into which specific moving average is capping price.
- **Crossover Logic**: `prev_close <= prev_sma and latest_close > latest_sma` strictly satisfies the two-session confirmation rule. However, transition states (e.g., 5/6 to 6/6 and approaching crossovers within 1% buffer) are not yet tracked.

### 2. Data Sources & Provenance
- `constituents_service.py` has the 50 constituents but lacks index weightages and effective revision dates.
- `historical_data_service.py` currently fetches 1y data from Yahoo Finance NSE feed (`.NS`). While reliable and providing 248 sessions, it lacks a secondary fallback pipeline and does not enforce the 220-session minimum strictly in all checks.
- Directories `data/cache/` and `data/logs/` do not exist.
- Output file `data/nifty50_constituents.csv` is not currently generated.

### 3. Live Volume & Intraday
- In `upstox_service.py`, `compute_live_intraday_scan` is a placeholder that duplicates closing prices. Live cumulative traded volume, 6-session volume average, RVOL, and intraday time-of-day volume benchmarking must be built.

### 4. Top 7 Heavyweights
- Top 7 heavyweight stocks (HDFCBANK, ICICIBANK, RELIANCE, BHARTIARTL, LT, SBIN, INFY) account for >50% of NIFTY 50 index movement. No specialized tracking, 6-session volume table, or index point contribution calculations currently exist.

### 5. Reporting & Exports
- No `.xlsx` generation library (such as `openpyxl`) is installed or integrated. The required 12-sheet institutional workbook must be implemented with professional styling, formulas, and data verification.

---

## Architecture Plan & Directory Targets

```
DMA Stocks/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── daily_scanner.py     (Upgrade with transition states & 5/6 details)
│   │   │   ├── live_scanner.py      (Upgrade with live volume & RVOL)
│   │   │   ├── heavyweights.py      (NEW: Top 7 dedicated analytics endpoint)
│   │   │   ├── volume_analytics.py  (NEW: All 50 volume analytics & ranking)
│   │   │   ├── export.py            (NEW: 12-sheet Excel & CSV exports)
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── constituents_service.py    (Upgrade: Dynamic weights, CSV persistence)
│   │   │   ├── historical_data_service.py (Upgrade: 220+ sessions, cache/logs)
│   │   │   ├── dma_service.py            (Upgrade: Exact uncleared DMA in 5/6)
│   │   │   ├── crossover_service.py      (Upgrade: Transitions & approaching signals)
│   │   │   ├── volume_service.py         (NEW: 6-session avg, RVOL, volume trends)
│   │   │   ├── heavyweight_service.py    (NEW: Top 7 analytics & index contribution)
│   │   │   ├── signal_service.py         (NEW: Combined DMA + Volume signals)
│   │   │   ├── export_service.py         (NEW: openpyxl 12-sheet Excel generator)
│   │   │   └── upstox_service.py         (Upgrade: Real-time volume feed)
│   │   ├── models/                       (Relational tables for volumes, weights, exports)
│   │   └── ...
│   ├── data/
│   │   ├── historical/                   (Verified 220+ session OHLCV JSONs)
│   │   ├── cache/                        (Intraday caches, snapshots)
│   │   ├── logs/                         (Audit logs, retrieval provenance)
│   │   ├── exports/                      (Daily Excel and CSV workbooks)
│   │   ├── nifty50_constituents.csv      (Official constituents with weights)
│   │   └── nifty50_constituents.json
│   └── tests/                            (Comprehensive test suite covering all modules)
└── frontend/                             (Responsive 7-page institutional dashboard)
```

---

## Audit Conclusion
The foundation is clean, modular, and structurally sound. We will proceed strictly through the Level-Wise Development Plan (Levels 1 to 12) without overwriting existing working code unnecessarily, ensuring rigorous data integrity, exact calculations, and automated test coverage at every stage.
