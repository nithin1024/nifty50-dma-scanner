import os
import csv
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.services.scanner_service import scanner_service
from app.services.constituents_service import constituents_service
from app.services.heavyweight_service import heavyweight_engine
from app.services.volume_service import volume_engine
from app.services.historical_data_service import historical_data_service
from app.services.db_service import db_service

logger = logging.getLogger("export_service")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_EXPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "exports"
ROOT_EXPORTS_DIR = PROJECT_ROOT / "data" / "exports"


class InstitutionalExcelReportEngine:
    """
    Generates the official daily institutional 12-sheet Excel workbook:
    NIFTY50_Institutional_DMA_Volume_YYYY-MM-DD.xlsx
    Sheets:
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
    """

    def __init__(self):
        BACKEND_EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
        ROOT_EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    def _apply_header_style(self, ws, row_idx: int, col_count: int):
        header_font = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="medium", color="475569")
        )
        for col in range(1, col_count + 1):
            cell = ws.cell(row=row_idx, column=col)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border
        ws.row_dimensions[row_idx].height = 28

    def _auto_fit_columns(self, ws, max_col: int):
        for col in range(1, max_col + 1):
            col_letter = get_column_letter(col)
            max_len = 0
            for row in range(1, ws.max_row + 1):
                val = ws.cell(row=row, column=col).value
                if val is not None:
                    max_len = max(max_len, len(str(val)))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    async def generate_daily_report(self) -> Dict[str, Any]:
        """Generate the complete 12-sheet institutional workbook."""
        scan = scanner_service.get_latest_scan()
        if not scan:
            scan = await scanner_service.run_daily_scan()

        heavyweights_report = await heavyweight_engine.get_all_heavyweights_report()
        all_results = scan.get("all_results", [])
        completed_date = scan.get("completed_session_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        filename = f"NIFTY50_Institutional_DMA_Volume_{completed_date}.xlsx"

        backend_filepath = BACKEND_EXPORTS_DIR / filename
        root_filepath = ROOT_EXPORTS_DIR / filename

        wb = openpyxl.Workbook()
        wb.remove(wb.active)  # Remove default blank sheet

        # ----------------------------------------------------
        # 1. Sheet: Market Overview
        # ----------------------------------------------------
        ws1 = wb.create_sheet(title="Market Overview")
        ws1.views.sheetView[0].showGridLines = True
        ws1["A1"] = "NIFTY 50 INSTITUTIONAL DMA + VOLUME EXECUTIVE REPORT"
        ws1["A1"].font = Font(name="Segoe UI", size=14, bold=True, color="0F172A")
        ws1["A2"] = f"Session Date: {completed_date} | Generated: {scan.get('scan_timestamp')} | Model: Institutional SMA Engine"
        ws1["A2"].font = Font(name="Segoe UI", size=9, italic=True, color="64748B")

        overview_metrics = [
            ("Total Constituents Tracked", scan.get("total_constituents", 50)),
            ("Verified Daily OHLCV Constituents", scan.get("verified_constituents", 50)),
            ("6/6 Bullish Alignment Stocks (All SMAs Cleared)", scan.get("count_6_6", 0)),
            ("5/6 Bullish Watchlist Stocks (1 SMA Hurdle)", scan.get("count_5_6", 0)),
            ("Confirmed Fresh Bullish Crossovers", len(scan.get("fresh_crossovers", []))),
            ("Stocks Maintaining 6/6 Alignment", len(scan.get("maintaining_6_6", []))),
            ("Stocks Upgraded (5/6 -> 6/6)", len(scan.get("upgraded_5_to_6", []))),
            ("Stocks Downgraded (6/6 -> 5/6)", len(scan.get("downgraded_6_to_5", []))),
            ("Stocks Losing Alignment (< 5/6)", len(scan.get("lost_alignment", []))),
            ("Top 7 Heavyweights Combined Weightage", f"{heavyweights_report.get('combined_weightage_pct', 0.0)}%"),
            ("Top 7 Estimated Index Contribution", f"{heavyweights_report.get('combined_estimated_contribution_pts', 0.0):+.4f} pts"),
            ("Primary Index Supporter", f"{heavyweights_report.get('top_supporter', {}).get('symbol', 'N/A')} ({heavyweights_report.get('top_supporter', {}).get('price_change_pct', 0.0):+.2f}%)"),
            ("Primary Index Dragger", f"{heavyweights_report.get('top_dragger', {}).get('symbol', 'N/A')} ({heavyweights_report.get('top_dragger', {}).get('price_change_pct', 0.0):+.2f}%)"),
            ("Heavyweight Concentration", heavyweights_report.get("concentration_analysis", "N/A"))
        ]

        for i, (label, val) in enumerate(overview_metrics, start=4):
            ws1.cell(row=i, column=1, value=label).font = Font(name="Segoe UI", size=10, bold=True)
            ws1.cell(row=i, column=2, value=str(val)).font = Font(name="Segoe UI", size=10)
        self._auto_fit_columns(ws1, 2)

        # ----------------------------------------------------
        # 2. Sheet: NIFTY50 Constituents
        # ----------------------------------------------------
        ws2 = wb.create_sheet(title="NIFTY50 Constituents")
        ws2.views.sheetView[0].showGridLines = True
        headers2 = ["Symbol", "Company Name", "Sector", "Industry", "ISIN", "Series", "Weightage %", "Effective Date", "Upstox Key", "Active"]
        ws2.append(headers2)
        self._apply_header_style(ws2, 1, len(headers2))
        for c in constituents_service.get_constituents():
            ws2.append([
                c["symbol"], c["company_name"], c.get("sector", ""), c.get("industry", ""),
                c["isin"], c.get("series", "EQ"), c.get("weightage", 0.0), c.get("effective_date", ""),
                c["upstox_instrument_key"], "YES" if c.get("active") else "NO"
            ])
        ws2.auto_filter.ref = f"A1:{get_column_letter(len(headers2))}{ws2.max_row}"
        self._auto_fit_columns(ws2, len(headers2))

        # ----------------------------------------------------
        # 3. Sheet: 6-6 DMA Stocks
        # ----------------------------------------------------
        ws3 = wb.create_sheet(title="6-6 DMA Stocks")
        ws3.views.sheetView[0].showGridLines = True
        headers3 = [
            "Symbol", "Company Name", "Sector", "Weight %", "Close", "Chg %",
            "5 DMA", "10 DMA", "20 DMA", "50 DMA", "100 DMA", "200 DMA",
            "Dist 5%", "Dist 10%", "Dist 20%", "Dist 50%", "Dist 100%", "Dist 200%",
            "RVOL", "Volume Class", "Signal"
        ]
        ws3.append(headers3)
        self._apply_header_style(ws3, 1, len(headers3))
        for r in scan.get("stocks_6_6", []):
            smas = r.get("smas", {})
            dists = r.get("distances", {})
            ws3.append([
                r["symbol"], r["company_name"], r.get("sector", ""), r.get("weightage", 0.0),
                r["latest_close"], r.get("price_change_pct", 0.0),
                smas.get("dma5"), smas.get("dma10"), smas.get("dma20"),
                smas.get("dma50"), smas.get("dma100"), smas.get("dma200"),
                dists.get("dist_dma5"), dists.get("dist_dma10"), dists.get("dist_dma20"),
                dists.get("dist_dma50"), dists.get("dist_dma100"), dists.get("dist_dma200"),
                r.get("rvol"), r.get("volume_classification"),
                r.get("combined_signal", {}).get("label", "Bullish 6/6")
            ])
        ws3.auto_filter.ref = f"A1:{get_column_letter(len(headers3))}{max(ws3.max_row, 2)}"
        self._auto_fit_columns(ws3, len(headers3))

        # ----------------------------------------------------
        # 4. Sheet: 5-6 DMA Stocks
        # ----------------------------------------------------
        ws4 = wb.create_sheet(title="5-6 DMA Stocks")
        ws4.views.sheetView[0].showGridLines = True
        headers4 = [
            "Symbol", "Company Name", "Sector", "Weight %", "Close", "Chg %",
            "Failed DMA Hurdle", "Failed DMA Value", "Hurdle Gap %",
            "Closest Support DMA", "Closest Support Level",
            "5 DMA", "10 DMA", "20 DMA", "50 DMA", "100 DMA", "200 DMA"
        ]
        ws4.append(headers4)
        self._apply_header_style(ws4, 1, len(headers4))
        for r in scan.get("stocks_5_6", []):
            smas = r.get("smas", {})
            ws4.append([
                r["symbol"], r["company_name"], r.get("sector", ""), r.get("weightage", 0.0),
                r["latest_close"], r.get("price_change_pct", 0.0),
                r.get("failed_dma_label", "N/A"), r.get("failed_dma_value"), r.get("failed_dma_distance_pct"),
                r.get("closest_support_dma", "N/A"), r.get("closest_support_value"),
                smas.get("dma5"), smas.get("dma10"), smas.get("dma20"),
                smas.get("dma50"), smas.get("dma100"), smas.get("dma200")
            ])
        ws4.auto_filter.ref = f"A1:{get_column_letter(len(headers4))}{max(ws4.max_row, 2)}"
        self._auto_fit_columns(ws4, len(headers4))

        # ----------------------------------------------------
        # 5. Sheet: Fresh Crossovers
        # ----------------------------------------------------
        ws5 = wb.create_sheet(title="Fresh Crossovers")
        ws5.views.sheetView[0].showGridLines = True
        headers5 = [
            "Symbol", "Company Name", "Crossover Period", "Label", "Crossover Date",
            "Previous Close", "Previous SMA", "Latest Close", "Latest SMA", "Distance %", "Verification Status"
        ]
        ws5.append(headers5)
        self._apply_header_style(ws5, 1, len(headers5))
        for xo in scan.get("fresh_crossovers", []):
            ws5.append([
                xo.get("symbol"), xo.get("company_name"), xo.get("period"), xo.get("label"),
                xo.get("crossover_date"), xo.get("previous_close"), xo.get("previous_sma"),
                xo.get("latest_close"), xo.get("latest_sma"), xo.get("distance_pct"), "CONFIRMED_COMPLETED_SESSION"
            ])
        ws5.auto_filter.ref = f"A1:{get_column_letter(len(headers5))}{max(ws5.max_row, 2)}"
        self._auto_fit_columns(ws5, len(headers5))

        # ----------------------------------------------------
        # 6. Sheet: All 50 Live Volume
        # ----------------------------------------------------
        ws6 = wb.create_sheet(title="All 50 Live Volume")
        ws6.views.sheetView[0].showGridLines = True
        headers6 = [
            "Symbol", "Company Name", "Weight %", "Close", "Chg %",
            "Cumulative Volume", "Prev Session Vol", "6-Session Avg Vol", "RVOL",
            "Vol Change %", "Trend", "Volume Classification", "Price-Volume Conviction", "Update Timestamp"
        ]
        ws6.append(headers6)
        self._apply_header_style(ws6, 1, len(headers6))
        for r in all_results:
            ws6.append([
                r["symbol"], r["company_name"], r.get("weightage", 0.0),
                r["latest_close"], r.get("price_change_pct", 0.0),
                r.get("volume", 0), r.get("previous_session_volume", 0),
                r.get("six_session_avg_volume"), r.get("rvol"),
                r.get("volume_change_pct"), r.get("volume_trend", "STEADY"),
                r.get("volume_classification", "NORMAL_VOLUME"),
                r.get("price_volume_confirmation", {}).get("label", "Neutral"),
                scan.get("scan_timestamp")
            ])
        ws6.auto_filter.ref = f"A1:{get_column_letter(len(headers6))}{ws6.max_row}"
        self._auto_fit_columns(ws6, len(headers6))

        # ----------------------------------------------------
        # 7. Sheet: Top 7 Heavyweights
        # ----------------------------------------------------
        ws7 = wb.create_sheet(title="Top 7 Heavyweights")
        ws7.views.sheetView[0].showGridLines = True
        headers7 = [
            "Symbol", "Company Name", "Sector", "Weight %", "LTP", "Open", "High", "Low", "Prev Close",
            "Chg %", "Volume", "Turnover (INR)", "6-Session Avg Vol", "RVOL", "DMA Score",
            "Alignment", "Closest Support", "Approx NIFTY Contribution (pts)", "Impact Role"
        ]
        ws7.append(headers7)
        self._apply_header_style(ws7, 1, len(headers7))
        for hw in heavyweights_report.get("heavyweights", []):
            m = hw["market_data"]
            t = hw["technical_analytics"]
            v = hw["volume_analytics"]
            w_imp = hw["weightage_impact"]
            ws7.append([
                hw["symbol"], hw["company_name"], hw["sector"], hw["weightage"],
                m["ltp"], m["open"], m["high"], m["low"], m["previous_close"],
                m["price_change_pct"], m["cumulative_volume"], m["traded_value_rupees"],
                v["six_session_avg_volume"], v["rvol"], t["score"], t["classification"],
                t["closest_support_dma"], w_imp["approx_index_contribution_pts"], w_imp["impact_status"]
            ])
        ws7.auto_filter.ref = f"A1:{get_column_letter(len(headers7))}{ws7.max_row}"
        self._auto_fit_columns(ws7, len(headers7))

        # ----------------------------------------------------
        # 8. Sheet: Six-Day Volume History
        # ----------------------------------------------------
        ws8 = wb.create_sheet(title="Six-Day Volume History")
        ws8.views.sheetView[0].showGridLines = True
        headers8 = [
            "Symbol", "Company Name",
            "Day 1 Date", "Day 1 Vol", "Day 1 Chg%",
            "Day 2 Date", "Day 2 Vol", "Day 2 Chg%",
            "Day 3 Date", "Day 3 Vol", "Day 3 Chg%",
            "Day 4 Date", "Day 4 Vol", "Day 4 Chg%",
            "Day 5 Date", "Day 5 Vol", "Day 5 Chg%",
            "Day 6 Date", "Day 6 Vol", "Day 6 Chg%",
            "6-Session Avg", "RVOL"
        ]
        ws8.append(headers8)
        self._apply_header_style(ws8, 1, len(headers8))
        for r in all_results:
            row_data = [r["symbol"], r["company_name"]]
            hist_list = r.get("six_session_history", [])
            for session_item in hist_list[:6]:
                row_data.extend([
                    session_item.get("trading_date", ""),
                    session_item.get("traded_volume", 0),
                    session_item.get("price_change_pct", 0.0)
                ])
            # If less than 6 rows, pad
            while len(row_data) < 2 + 18:
                row_data.extend(["", 0, 0.0])
            row_data.extend([r.get("six_session_avg_volume"), r.get("rvol")])
            ws8.append(row_data)
        ws8.auto_filter.ref = f"A1:{get_column_letter(len(headers8))}{ws8.max_row}"
        self._auto_fit_columns(ws8, len(headers8))

        # ----------------------------------------------------
        # 9. Sheet: DMA Comparison
        # ----------------------------------------------------
        ws9 = wb.create_sheet(title="DMA Comparison")
        ws9.views.sheetView[0].showGridLines = True
        headers9 = [
            "Symbol", "Company Name", "Close", "Score", "Classification",
            "5 DMA", "Dist 5%", "10 DMA", "Dist 10%", "20 DMA", "Dist 20%",
            "50 DMA", "Dist 50%", "100 DMA", "Dist 100%", "200 DMA", "Dist 200%"
        ]
        ws9.append(headers9)
        self._apply_header_style(ws9, 1, len(headers9))
        for r in all_results:
            s = r.get("smas", {})
            d = r.get("distances", {})
            ws9.append([
                r["symbol"], r["company_name"], r["latest_close"], r["score"], r["classification"],
                s.get("dma5"), d.get("dist_dma5"),
                s.get("dma10"), d.get("dist_dma10"),
                s.get("dma20"), d.get("dist_dma20"),
                s.get("dma50"), d.get("dist_dma50"),
                s.get("dma100"), d.get("dist_dma100"),
                s.get("dma200"), d.get("dist_dma200")
            ])
        ws9.auto_filter.ref = f"A1:{get_column_letter(len(headers9))}{ws9.max_row}"
        self._auto_fit_columns(ws9, len(headers9))

        # ----------------------------------------------------
        # 10. Sheet: Volume Analytics
        # ----------------------------------------------------
        ws10 = wb.create_sheet(title="Volume Analytics")
        ws10.views.sheetView[0].showGridLines = True
        headers10 = [
            "Symbol", "Company Name", "Weight %", "Close", "Chg %",
            "Latest Volume", "6-Session Avg", "RVOL", "Volume Chg %",
            "Trend", "Classification", "Conviction Signal", "Detail"
        ]
        ws10.append(headers10)
        self._apply_header_style(ws10, 1, len(headers10))
        for r in all_results:
            pv = r.get("price_volume_confirmation", {})
            ws10.append([
                r["symbol"], r["company_name"], r.get("weightage", 0.0),
                r["latest_close"], r.get("price_change_pct", 0.0),
                r.get("volume", 0), r.get("six_session_avg_volume"),
                r.get("rvol"), r.get("volume_change_pct"),
                r.get("volume_trend", "STEADY"),
                r.get("volume_classification", "NORMAL_VOLUME"),
                pv.get("label", "Neutral"), pv.get("detail", "")
            ])
        ws10.auto_filter.ref = f"A1:{get_column_letter(len(headers10))}{ws10.max_row}"
        self._auto_fit_columns(ws10, len(headers10))

        # ----------------------------------------------------
        # 11. Sheet: Data Verification
        # ----------------------------------------------------
        ws11 = wb.create_sheet(title="Data Verification")
        ws11.views.sheetView[0].showGridLines = True
        headers11 = [
            "Symbol", "Company Name", "ISIN", "Provider", "Price Adjustment",
            "Historical Sessions", "Min Required (220)", "Status",
            "First Trading Date", "Latest Trading Date", "Retrieval Timestamp"
        ]
        ws11.append(headers11)
        self._apply_header_style(ws11, 1, len(headers11))
        vlog = historical_data_service.get_verification_log()
        records = vlog.get("records", []) if vlog else []
        for v in records:
            ws11.append([
                v["symbol"], v["company_name"], v["isin"], v["provider"], v["price_adjustment"],
                v["sessions"], v["min_required"], v["status"],
                v["first_date"], v["latest_date"], v["retrieval_timestamp"]
            ])
        ws11.auto_filter.ref = f"A1:{get_column_letter(len(headers11))}{max(ws11.max_row, 2)}"
        self._auto_fit_columns(ws11, len(headers11))

        # ----------------------------------------------------
        # 12. Sheet: Scan History
        # ----------------------------------------------------
        ws12 = wb.create_sheet(title="Scan History")
        ws12.views.sheetView[0].showGridLines = True
        headers12 = [
            "Scan ID", "Timestamp (UTC)", "Completed Session Date",
            "Total Constituents", "Verified Count", "6/6 Count", "5/6 Count"
        ]
        ws12.append(headers12)
        self._apply_header_style(ws12, 1, len(headers12))
        try:
            history_rows = db_service.get_scan_history(limit=50)
            for h in history_rows:
                ws12.append([
                    h["id"], h["scan_timestamp"], h["completed_session_date"],
                    h["total_constituents"], h["verified_count"], h["count_6_6"], h["count_5_6"]
                ])
        except Exception as e:
            logger.warning(f"Could not load scan history from DB: {e}")
        ws12.auto_filter.ref = f"A1:{get_column_letter(len(headers12))}{max(ws12.max_row, 2)}"
        self._auto_fit_columns(ws12, len(headers12))

        # Save workbook to both backend and root exports directories
        for fp in [backend_filepath, root_filepath]:
            try:
                fp.parent.mkdir(parents=True, exist_ok=True)
                wb.save(fp)
                logger.info(f"Excel workbook saved to {fp}")
            except Exception as e:
                logger.error(f"Error saving Excel workbook to {fp}: {e}")

        # Export key companion CSV files
        self._export_companion_csvs(scan, heavyweights_report, completed_date)

        return {
            "status": "SUCCESS",
            "filename": filename,
            "backend_path": str(backend_filepath),
            "root_path": str(root_filepath),
            "total_sheets": len(wb.sheetnames),
            "sheet_names": wb.sheetnames,
            "completed_session_date": completed_date,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    def _export_companion_csvs(self, scan: Dict[str, Any], heavyweights: Dict[str, Any], session_date: str):
        """Export companion CSV files for key sheets."""
        # 1. 6-6 Bullish Stocks CSV
        csv6_6 = BACKEND_EXPORTS_DIR / f"NIFTY50_Bullish_6_6_{session_date}.csv"
        with open(csv6_6, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Symbol", "Company Name", "Weightage %", "Close", "Chg %", "5 DMA", "10 DMA", "20 DMA", "50 DMA", "100 DMA", "200 DMA", "RVOL"])
            for r in scan.get("stocks_6_6", []):
                smas = r.get("smas", {})
                writer.writerow([
                    r["symbol"], r["company_name"], r.get("weightage", 0.0),
                    r["latest_close"], r.get("price_change_pct", 0.0),
                    smas.get("dma5"), smas.get("dma10"), smas.get("dma20"),
                    smas.get("dma50"), smas.get("dma100"), smas.get("dma200"),
                    r.get("rvol")
                ])

        # 2. Top 7 Heavyweights CSV
        csv_hw = BACKEND_EXPORTS_DIR / f"NIFTY50_Top7_Heavyweights_{session_date}.csv"
        with open(csv_hw, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Symbol", "Company Name", "Weightage %", "LTP", "Chg %", "Volume", "RVOL", "DMA Score", "Approx Index Contribution (pts)"])
            for hw in heavyweights.get("heavyweights", []):
                writer.writerow([
                    hw["symbol"], hw["company_name"], hw["weightage"],
                    hw["market_data"]["ltp"], hw["market_data"]["price_change_pct"],
                    hw["market_data"]["cumulative_volume"], hw["volume_analytics"]["rvol"],
                    hw["technical_analytics"]["score"],
                    hw["weightage_impact"]["approx_index_contribution_pts"]
                ])


excel_export_engine = InstitutionalExcelReportEngine()
