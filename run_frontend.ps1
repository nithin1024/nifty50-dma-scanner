# Run NIFTY 50 DMA Scanner Frontend
$env:PATH = "$env:LOCALAPPDATA\Programs\nodejs;$env:PATH"
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
