# APPLICATION UPGRADE AUDIT: INDIAN STOCK MARKET INTELLIGENCE PLATFORM
**Document Generated:** 14 November 2026  
**Auditor:** Antigravity Principal Financial Software Architect & Quantitative Systems Engineer  
**Repository:** `https://github.com/nithin1024/nifty50-dma-scanner.git`  
**Target Architecture:** Multi-Layered Institutional Market Surveillance, FII/DII Quantitative Tracking, Macroeconomic Intelligence, Dual DMA/EMA Technical Engine, and Global Macro Events.

---

## 1. Executive Summary & Architecture Overview

The application is an institutional-grade stock market surveillance engine built with:
- **Backend:** Python FastAPI (`backend/app/main.py`), SQLAlchemy ORM (`backend/app/models/`), Pydantic models, and SQLite/PostgreSQL database support with pure mathematics engines (Simple Moving Averages, RVOL, Surprise calculator, Timezone with `zoneinfo`).
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (`frontend/src/App.tsx`), Lucide icons, responsive financial terminal layout.
- **Data Layers:** Historical Bhavcopy settlement engine, Upstox live feed integration, multi-sheet Excel generator, and global macroeconomic events registry.

### Audit Findings Summary
While the base infrastructure (6-DMA calculation, Bhavcopy ingestion, live volume RVOL, and 15 global event cards) is robust, several critical user-facing intelligence modules suffer from incomplete pipelines, non-interactive static components, missing DII depth, absent EMA capabilities, and inconsistent event lifecycle tracking.

---

## 2. Module-by-Module Audit & Defect Matrix

| Module | Current Functionality | Problem / Defect Identified | Required Architectural Fix |
|---|---|---|---|
| **Market Overview** | Displays Nifty closing, Sensex, USD/INR, Brent crude, and a single session of FII cash & DII net. | DII activity is reduced to a single net number with zero historical trend; no gross purchase/sales breakdown; no 5-session, 20-session, monthly, or YTD totals. | Upgrade to dedicated Institutional FII/DII Activity Dashboard with full Cash Market breakdown and dual-series comparison. |
| **FII/DII Cash Analytics** | Displays latest FII cash net (+₹12,563 Cr) and DII net (-₹8,435 Cr) with 3 recent FII rows. | Complete absence of historical cash graphs; DII daily history is missing; no multi-timeframe aggregation (5D, 10D, 20D, Monthly, 6M, 1Y). | Implement `institutional_data_service` providing full FII/DII daily historical series, gross purchases/sales, and interactive SVG/Canvas cash flow charts with zero-line baseline. |
| **FII/DII Derivatives Positioning** | Shows single snapshot of FII net index-futures (-70,413 contracts) and text note on 225k peak shorts. | No historical derivatives graphs; no participant-wise breakdown (FII, DII, PRO, Client); no Long vs. Short contracts curve; DII futures positioning is missing. | Ingest official NSE participant-wise open interest dataset; build interactive charts for FII Net Shorts Trend (225k &rarr; 70k), FII Long vs. Short, and DII futures positioning. |
| **Macro Intelligence & Cheat Sheet** | Displays 21 macro terms in a static HTML table with simple 1-line definitions. | Rows are completely non-clickable; clicking any term does nothing; no historical data, no formula, no 5-year observation table, no interactive graphs, and no sector-specific impact analysis. | Build an interactive Macroeconomic Intelligence Drawer / Modal for all 21 National Accounts terms + 20 key macroeconomic indicators (CPI, WPI, GDP, Repo Rate, 10Y G-Sec, Trade Balance, Crude) with 5-year historical data tables and charts. |
| **National Accounts Engine** | Hardcoded glossary array in `market_intelligence_service.py`. | Lacks quantitative historical metrics (e.g. India Real GDP growth series, GVA breakdown, PFCE trends, Deflator trends). | Implement `macro_data_service.py` with historical time series, YoY/QoQ calculations, and sector transmission maps. |
| **NIFTY Logo Navigation** | Top-left brand logo click only resets the page tab to `'overview'`. | User requested a selector dropdown on the NIFTY logo offering: `1. DMA SCANNER` and `2. EMA SCANNER`. Currently absent. | Enhance `Navbar.tsx` brand section with an accessible dropdown menu allowing instant toggling between DMA Scanner and EMA Scanner. |
| **DMA Scanner** | Computes 6 SMAs (5, 10, 20, 50, 100, 200) for all 50 constituents with Category A (6/6) and B (5/6). | DMA engine is mathematically sound; needs to be preserved and protected from regressions while exposing quick links to EMA. | Preserve existing DMA calculation logic in `scanner_service.py`; maintain full backwards compatibility. |
| **EMA Scanner** | Does not exist in the codebase. | Entire EMA technical scanner is missing (EMA 9, EMA 21, RSI 14, RSI 40–60 corridor filter, fresh bullish/bearish crossovers). | Implement `technical_scanner_service.py` with Exponential Moving Average (EMA 9/21) and Wilder's RSI 14 calculation across all 50 constituents, complete with dedicated UI page. |
| **Global Events Lifecycle** | Events compute countdown via `compute_live_countdown`. | Lifecycle contradiction bug: when scheduled time passes (e.g. WPI on 14 Nov 12:00 PM), the card shows `Released 9h 11m ago` while actual value still says `Not yet released` and surprise says `Pending`. | Refactor event lifecycle into 8 distinct states: `UPCOMING`, `RELEASE_DUE`, `RELEASED_ACTUAL_AVAILABLE`, `RELEASED_ACTUAL_UNVERIFIED`, `DELAYED`, `POSTPONED`, `CANCELLED`, `TIME_NOT_CONFIRMED`. Automatically update actual results upon release. |
| **Global News & Insights** | Global events cards have a "Show Full Insights" toggle that opens basic explanation accordions. | "Show Full Insights" lacks structured scenario analysis (Positive, Neutral, Negative), detailed sector transmission maps, and direct institutional source provenance. | Expand "Full Insights" engine with comprehensive English & Telugu multi-scenario synthesis, sector impact matrices, and verifiable official source links. |
| **Weekend & Non-Working Days** | Live polling interval runs regardless of market hours, but lacks explicit market status indicators. | Application does not explicitly communicate exchange state on weekends/holidays while streaming global data. | Implement dual-state header indicator: `NSE MARKET CLOSED` vs `GLOBAL MARKETS OPEN / DATA UPDATED`, allowing macroeconomic updates 24/7. |
| **Telugu Localization** | Basic dictionary in `translations.ts` covers headers and badges. | Complex institutional explanations (FII short covering, GVA value-add, EMA crossover, scenario analysis) lack full Telugu equivalents. | Expand `translations.ts` and bilingual service payloads with fluent Telugu financial terminology for all new modules. |

---

## 3. Detailed Data Pipeline & Implementation Plan

### Level 1: Full Application Audit & Baseline Verification
- Deliverable: `APPLICATION_UPGRADE_AUDIT.md` (this document).
- Verify database migrations and existing test suite health.

### Level 2: FII / DII Cash Market Activity & Historical Dual-Series Graphs
- Backend: Implement `backend/app/services/institutional_data_service.py` returning:
  - Latest Gross Purchases, Gross Sales, Net Investment for FII and DII.
  - Historical daily series (1Y, 6M, 1M, 20D, 10D, 5D).
  - Multi-session aggregations (5-day, 20-day, Monthly, YTD net totals).
- Frontend: Responsive dual-series bar/area chart with dynamic hover tooltips, date range picker, and zero-baseline rendering.

### Level 3: FII / DII Derivatives Positioning & Historical Futures Graphs
- Backend: Ingest and model NSE participant-wise derivatives open interest (FII, DII, Pro, Client):
  - Long Contracts, Short Contracts, Net Open Interest, Daily Contract Change.
  - Multi-session short-covering trend (225k peak shorts &rarr; 70k current).
- Frontend: Multi-line positioning charts with bullish/bearish exhaustion signals and institutional interpretation narrative.

### Level 4 & 5: Interactive Macroeconomic Intelligence & National Accounts Suite
- Backend: Implement `backend/app/services/macro_data_service.py` with 40+ indicators covering:
  - 21 National Accounts terms (GDP, GVA, Nominal, Real, PFCE, GFCF, Deflator, Output Gap, etc.).
  - 20 Key Macro Indicators (CPI, WPI, IIP, HSBC PMI, Repo Rate, 10Y G-Sec, Trade Balance, Brent Crude, etc.).
  - 5-year historical observation tables with YoY/QoQ calculations and source references.
- Frontend: Interactive Modal / Drawer opening on any clicked term, featuring:
  - Bilingual English/Telugu definitions & formulas.
  - Historical 5-year data table.
  - Interactive SVG historical trend line chart.
  - Indian equity sector & NIFTY transmission analysis.

### Level 6 & 7: NIFTY 50 DMA / EMA Selection Menu & Working EMA Scanner
- Backend: Implement EMA 9, EMA 21, and RSI 14 calculation algorithms in `backend/app/services/technical_scanner_service.py`:
  - Formula: $\text{EMA}_t = \text{Price}_t \times k + \text{EMA}_{t-1} \times (1-k)$ where $k = 2 / (N + 1)$.
  - Wilder's 14-period Relative Strength Index (RSI).
  - Fresh crossover detection (Previous $\le 0$, Latest $> 0$).
  - Configurable RSI 40–60 momentum consolidation filter.
- Frontend:
  - Update `Navbar.tsx` with interactive dropdown on NIFTY 50 logo (`DMA Scanner` / `EMA Scanner`).
  - Create `frontend/src/pages/EmaScanner.tsx` with 6 classification buckets, filtering, and volume confirmation.

### Level 8 & 9: Global Events Lifecycle Correction & Real Data Pipeline
- Backend: Update `global_events_service.py` and `timezone_service.py`:
  - 8 lifecycle states: `UPCOMING`, `RELEASE_DUE`, `RELEASED_ACTUAL_AVAILABLE`, `RELEASED_ACTUAL_UNVERIFIED`, `DELAYED`, `POSTPONED`, `CANCELLED`, `TIME_NOT_CONFIRMED`.
  - Fix WPI event (14 Nov 2026, 12:00 PM): Set actual value to 2.36%, calculate surprise, and set state to `RELEASED_ACTUAL_AVAILABLE`.
  - Weekend & holiday surveillance engine with continuous updates.
- Frontend: Refactor `GlobalEventCard.tsx` badges to reflect exact lifecycle state without contradiction.

### Level 10: Full Insights Expandable Panel with Scenario Analysis
- Upgrade `GlobalEventCard.tsx` and news drawer with:
  - Comprehensive English & Telugu narrative summaries.
  - 3-Way Scenario Analysis: Bullish / Positive, Neutral / Consensus, Bearish / Negative.
  - Comprehensive sector and stock sensitivity map.

### Level 11 & 12: Localization, Automated Testing & Verification
- Expand `translations.ts` with complete Telugu terminology.
- Write pytest suites for:
  - FII/DII cash aggregation & derivatives net calculations.
  - Macro indicator 5-year historical retrieval and YoY percentage formulas.
  - EMA 9/21 and RSI 14 crossover logic.
  - Event lifecycle transitions.
- Build verification: 0 TypeScript errors on Vite build.

### Level 13: Final Deployment & Documentation
- Update `DEVELOPMENT_PROGRESS.md`.
- Git commit and push to `origin/main`.
