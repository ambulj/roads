@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  RoadSaarthi — One-Click Launcher (Windows CMD)
::  Works from any folder location.
:: ============================================================

:: Resolve project root relative to this script (not CWD)
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

echo.
echo  ====================================================================
echo   RoadSaarthi — Municipal Road Intelligence Platform
echo  ====================================================================
echo   Project path: %PROJECT_DIR%
echo.

:: ── Check Python ─────────────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ from https://python.org
    echo  Then re-run this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo  [OK] %PY_VER% found

:: ── Check Node / npm ─────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js / npm not found. Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found

:: ── Install Python dependencies if needed ────────────────────────────────
if not exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
    echo.
    echo  [SETUP] Creating Python virtual environment...
    python -m venv "%BACKEND_DIR%\venv"
    echo  [SETUP] Installing Python packages...
    call "%BACKEND_DIR%\venv\Scripts\pip.exe" install -q -r "%BACKEND_DIR%\requirements.txt"
    echo  [OK] Python packages installed.
)

:: ── Install Node packages if needed ──────────────────────────────────────
if not exist "%FRONTEND_DIR%\node_modules" (
    echo.
    echo  [SETUP] Installing Node packages (this may take a minute)...
    pushd "%FRONTEND_DIR%"
    npm install --silent
    popd
    echo  [OK] Node packages installed.
)

:: ── Start Backend ─────────────────────────────────────────────────────────
echo.
echo  [START] Launching backend on http://127.0.0.1:8000 ...
start "RoadSaarthi Backend" cmd /k "cd /d "%BACKEND_DIR%" && call venv\Scripts\activate && python run_backend.py"
timeout /t 3 /nobreak >nul

:: ── Start Frontend ────────────────────────────────────────────────────────
echo  [START] Launching frontend on http://localhost:5173 ...
start "RoadSaarthi Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
timeout /t 4 /nobreak >nul

:: ── Open Browser ─────────────────────────────────────────────────────────
echo.
echo  ====================================================================
echo   Backend  → http://127.0.0.1:8000
echo   Frontend → http://localhost:5173
echo   API Docs → http://127.0.0.1:8000/docs
echo  ====================================================================
echo.
start http://localhost:5173

endlocal
