# Run NIFTY 50 DMA Scanner Backend
Set-Location -Path $PSScriptRoot
& "$PSScriptRoot\backend\venv\Scripts\uvicorn.exe" app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
