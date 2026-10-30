@echo off
echo =========================================================================
echo       CyberSentinel - Backend API Server (For XAMPP Integration)
echo =========================================================================
echo.

set PYTHONPATH=backend
set DISABLE_SQLALCHEMY_CEXT=1

echo Checking database connectivity...
.\venv\Scripts\python backend\app\seed.py

echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
echo (XAMPP Apache will proxy requests from http://localhost/cybersentinel/ to this server)
echo.
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
