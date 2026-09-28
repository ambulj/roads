# ============================================================
#  RoadSaathi — One-Click Launcher (Windows PowerShell)
#  Works from any folder location. Just execute:
#    .\run_roadsaathi.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"
$VenvActivate = Join-Path $BackendDir "venv\Scripts\Activate.ps1"
$VenvPip      = Join-Path $BackendDir "venv\Scripts\pip.exe"
$VenvPython   = Join-Path $BackendDir "venv\Scripts\python.exe"

Write-Host ""
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  RoadSaathi — Municipal Road & Urban Intelligence Platform" -ForegroundColor Cyan
Write-Host "  MoRTH & National Highway Authority CAD System" -ForegroundColor Cyan
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  Project directory: $ProjectDir" -ForegroundColor DarkGray
Write-Host ""

# ── Check Python ─────────────────────────────────────────────────────────────
try {
    $pyVer = & python --version 2>&1
    Write-Host " [OK] $pyVer detected" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Python not found. Please install Python 3.10+ from https://python.org" -ForegroundColor Red
    Write-Host " Ensure 'Add python.exe to PATH' is checked during setup." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Check Node.js ─────────────────────────────────────────────────────────────
try {
    $nodeVer = & node --version 2>&1
    Write-Host " [OK] Node.js $nodeVer detected" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ── Create Python Virtual Environment if missing ─────────────────────────────
if (-not (Test-Path $VenvActivate)) {
    Write-Host ""
    Write-Host " [SETUP] Creating Python virtual environment in backend\venv..." -ForegroundColor Yellow
    try {
        & python -m venv "$BackendDir\venv"
        Write-Host " [SETUP] Installing Python packages from requirements.txt..." -ForegroundColor Yellow
        & $VenvPip install -q -r "$BackendDir\requirements.txt"
        Write-Host " [OK] Python dependencies installed." -ForegroundColor Green
    } catch {
        Write-Host " [WARNING] Could not create virtual environment. Will execute using system Python." -ForegroundColor DarkYellow
    }
}

# ── Install Node packages if missing ──────────────────────────────────────────
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host ""
    Write-Host " [SETUP] Installing Node dependencies (this may take a minute)..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    & npm install --silent
    Pop-Location
    Write-Host " [OK] Node dependencies installed." -ForegroundColor Green
}

# ── Launch Backend ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host " [START] Launching Backend  → http://127.0.0.1:8000" -ForegroundColor Green
if (Test-Path $VenvPython) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$BackendDir'; & '$VenvPython' run_backend.py"
    ) -WindowStyle Normal
} else {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$BackendDir'; python run_backend.py"
    ) -WindowStyle Normal
}

Start-Sleep -Seconds 3

# ── Launch Frontend ────────────────────────────────────────────────────────────
Write-Host " [START] Launching Frontend → http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$FrontendDir'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host "  RoadSaathi is active:" -ForegroundColor White
Write-Host "  • WebGIS Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  • REST API Gateway: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  • Interactive Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host " ====================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:5173"
