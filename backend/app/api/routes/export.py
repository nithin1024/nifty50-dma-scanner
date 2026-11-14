from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any
from pathlib import Path
from app.services.export_service import excel_export_engine, BACKEND_EXPORTS_DIR

router = APIRouter(prefix="/export", tags=["Excel & CSV Reports"])


@router.post("/generate", response_model=Dict[str, Any])
async def generate_excel_report():
    """Generate the complete 12-sheet institutional Excel workbook and companion CSVs."""
    return await excel_export_engine.generate_daily_report()


@router.get("/download/latest")
async def download_latest_excel():
    """Download the latest generated institutional Excel workbook."""
    files = list(BACKEND_EXPORTS_DIR.glob("NIFTY50_Institutional_DMA_Volume_*.xlsx"))
    if not files:
        # Generate on the fly if not existing
        res = await excel_export_engine.generate_daily_report()
        latest_file = Path(res["backend_path"])
    else:
        files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        latest_file = files[0]

    return FileResponse(
        path=str(latest_file),
        filename=latest_file.name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
