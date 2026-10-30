@echo off
setlocal enabledelayedexpansion

echo =========================================================================
echo              CyberSentinel - Deploy to XAMPP Apache
echo =========================================================================
echo.

set XAMPP_HTDOCS=C:\xampp\htdocs\cybersentinel

echo [1/3] Building frontend production bundle...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Deploying files to %XAMPP_HTDOCS% ...
if not exist "%XAMPP_HTDOCS%" mkdir "%XAMPP_HTDOCS%"
xcopy /E /Y /I "frontend\dist\*" "%XAMPP_HTDOCS%\"

echo.
echo [3/3] Creating Apache .htaccess configuration...
(
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteBase /cybersentinel/
echo.
echo   # Proxy WebSocket /api/ws
echo   RewriteCond %%{HTTP:Upgrade} websocket [NC]
echo   RewriteCond %%{HTTP:Connection} upgrade [NC]
echo   RewriteRule ^api/ws/?(.*)$ ws://127.0.0.1:8000/api/ws$1 [P,L]
echo.
echo   # Proxy API calls to FastAPI backend
echo   RewriteRule ^api/(.*)$ http://127.0.0.1:8000/api/$1 [P,L]
echo.
echo   # Route SPA front-end paths to index.html
echo   RewriteRule ^index\.html$ - [L]
echo   RewriteCond %%{REQUEST_FILENAME} !-f
echo   RewriteCond %%{REQUEST_FILENAME} !-d
echo   RewriteRule . /cybersentinel/index.html [L]
echo ^</IfModule^>
) > "%XAMPP_HTDOCS%\.htaccess"

echo.
echo =========================================================================
echo Deployment to XAMPP completed successfully!
echo Target folder: %XAMPP_HTDOCS%
echo.
echo Next steps:
echo 1. In XAMPP Control Panel, ensure Apache and MySQL are STARTED.
echo 2. Enable proxy modules in C:\xampp\apache\conf\httpd.conf:
echo      Uncomment: LoadModule proxy_http_module modules/mod_proxy_http.so
echo      Uncomment: LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
echo 3. Start the CyberSentinel Python backend:
echo      run: .\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
echo 4. Open browser at: http://localhost/cybersentinel
echo =========================================================================
pause
