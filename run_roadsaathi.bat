@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  RoadSaathi — One-Click Production & Dev Launcher (Windows)
::  Works from any folder location.
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

echo.
echo  ====================================================================
echo   RoadSaathi — Municipal Road & Urban Intelligence Platform
echo   MoRTH & National Highway Authority CAD System
echo  ====================================================================
echo   Project path: %PROJECT_DIR%
echo.

:: ── Check Python ─────────────────────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Please install Python 3.10+ from https://python.org
    echo  Ensure 'Add python.exe to PATH' is checked during installation.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo  [OK] %PY_VER% detected

:: ── Check Node.js / npm ──────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js / npm not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected

:: ── Python Virtual Environment Setup ─────────────────────────────────────
if not exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
    echo.
    echo  [SETUP] Creating Python virtual environment in backend\venv ...
    python -m venv "%BACKEND_DIR%\venv"
    if errorlevel 1 (
        echo  [WARNING] Could not create venv. Falling back to system Python environment.
    ) else (
        echo  [SETUP] Installing Python dependencies (this may take a moment)...
        call "%BACKEND_DIR%\venv\Scripts\pip.exe" install -q -r "%BACKEND_DIR%\requirements.txt"
        echo  [OK] Python packages installed successfully.
    )
)

:: ── Node Dependencies Setup ──────────────────────────────────────────────
if not exist "%FRONTEND_DIR%\node_modules" (
    echo.
    echo  [SETUP] Installing frontend node packages...
    pushd "%FRONTEND_DIR%"
    call npm install --silent
    popd
    echo  [OK] Node packages installed successfully.
)

:: ── Start Backend Server ─────────────────────────────────────────────────
echo.
echo  [START] Launching RoadSaathi FastAPI Backend on http://127.0.0.1:8000 ...
if exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
    start "RoadSaathi Backend (FastAPI)" cmd /k "cd /d "%BACKEND_DIR%" && call venv\Scripts\activate.bat && python run_backend.py"
) else (
    start "RoadSaathi Backend (FastAPI)" cmd /k "cd /d "%BACKEND_DIR%" && python run_backend.py"
)
timeout /t 3 /nobreak >nul

:: ── Start Frontend Server ────────────────────────────────────────────────
echo  [START] Launching RoadSaathi WebGIS Frontend on http://localhost:5173 ...
start "RoadSaathi Frontend (Vite + React)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
timeout /t 4 /nobreak >nul

:: ── Open Browser ─────────────────────────────────────────────────────────
echo.
echo  ====================================================================
echo   RoadSaathi is now running:
echo   • WebGIS Dashboard: http://localhost:5173
echo   • REST API Gateway: http://127.0.0.1:8000
echo   • Swagger API Docs: http://127.0.0.1:8000/docs
echo  ====================================================================
echo.
start http://localhost:5173

endlocal
