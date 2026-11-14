import pytest
from pathlib import Path
import openpyxl
from app.services.export_service import excel_export_engine, BACKEND_EXPORTS_DIR


@pytest.mark.asyncio
async def test_excel_report_generation_12_sheets():
    """Verify that the institutional Excel workbook contains all 12 specified sheets."""
    res = await excel_export_engine.generate_daily_report()
    assert res["status"] == "SUCCESS"
    assert res["total_sheets"] == 12

    expected_sheets = [
        "Market Overview",
        "NIFTY50 Constituents",
        "6-6 DMA Stocks",
        "5-6 DMA Stocks",
        "Fresh Crossovers",
        "All 50 Live Volume",
        "Top 7 Heavyweights",
        "Six-Day Volume History",
        "DMA Comparison",
        "Volume Analytics",
        "Data Verification",
        "Scan History"
    ]
    assert res["sheet_names"] == expected_sheets

    # Verify file is readable with openpyxl
    file_path = Path(res["backend_path"])
    assert file_path.exists()
    assert file_path.stat().st_size > 5000  # Non-trivial workbook size

    wb = openpyxl.load_workbook(file_path, read_only=True)
    assert wb.sheetnames == expected_sheets
    wb.close()


def test_companion_csv_exports():
    """Verify companion CSV exports exist in backend exports directory."""
    csv_files = list(BACKEND_EXPORTS_DIR.glob("*.csv"))
    assert len(csv_files) >= 2, "Expected at least 2 companion CSV files"
