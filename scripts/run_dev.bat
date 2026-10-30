@echo off
echo =========================================================================
echo               CyberSentinel - Enterprise SOC Platform
echo                 Discover. Monitor. Detect. Defend.
echo =========================================================================
echo.

set PYTHONPATH=backend
set DISABLE_SQLALCHEMY_CEXT=1

echo [1/2] Launching CyberSentinel FastAPI Backend on http://127.0.0.1:8000 ...
start "CyberSentinel Backend API" cmd /k ".\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching CyberSentinel Frontend on http://localhost:5173 ...
cd frontend
start "CyberSentinel Frontend" cmd /k "npm run dev"

echo.
echo CyberSentinel is starting!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Frontend UI:  http://localhost:5173
echo.
echo Default Credentials:
echo   Super Administrator: admin / CyberAdmin2026!
echo   Security Admin:      secadmin / SecAdmin2026!
echo   Security Analyst:    analyst / Analyst2026!
echo   Auditor / Viewer:    viewer / Viewer2026!
echo =========================================================================
