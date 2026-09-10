# ============================================================
#  RoadSaarthi — One-Click Launcher (Windows PowerShell)
#  Works from any folder location. Just double-click or run:
#    .\run_roadsaarthi.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# Resolve paths relative to THIS script, not the working directory
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"
$VenvActivate = Join-Path $BackendDir "venv\Scripts\Activate.ps1"
$VenvPip      = Join-Path $BackendDir "venv\Scripts\pip.exe"
$VenvPython   = Join-Path $BackendDir "venv\Scripts\python.exe"

Write-Host ""
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  RoadSaarthi — Municipal Road Intelligence Platform" -ForegroundColor Cyan
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  Project: $ProjectDir" -ForegroundColor DarkGray
Write-Host ""

# ── Check Python ─────────────────────────────────────────────────────────────
try {
    $pyVer = & python --version 2>&1
    Write-Host " [OK] $pyVer found" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Python not found. Install Python 3.10+ from https://python.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Check Node.js ─────────────────────────────────────────────────────────────
try {
    $nodeVer = & node --version 2>&1
    Write-Host " [OK] Node.js $nodeVer found" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Create Python venv if missing ─────────────────────────────────────────────
if (-not (Test-Path $VenvActivate)) {
    Write-Host ""
    Write-Host " [SETUP] Creating Python virtual environment..." -ForegroundColor Yellow
    & python -m venv "$BackendDir\venv"
    Write-Host " [SETUP] Installing Python packages..." -ForegroundColor Yellow
    & $VenvPip install -q -r "$BackendDir\requirements.txt"
    Write-Host " [OK] Python packages installed." -ForegroundColor Green
}

# ── Install Node packages if missing ──────────────────────────────────────────
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host ""
    Write-Host " [SETUP] Installing Node packages (this may take a minute)..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & npm install --silent
    Pop-Location
    Write-Host " [OK] Node packages installed." -ForegroundColor Green
}

# ── Launch Backend ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host " [START] Backend  → http://127.0.0.1:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$BackendDir'; & '$VenvPython' run_backend.py"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Launch Frontend ────────────────────────────────────────────────────────────
Write-Host " [START] Frontend → http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$FrontendDir'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  Backend  → http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor White
Write-Host "  API Docs → http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Process "http://localhost:5173"
