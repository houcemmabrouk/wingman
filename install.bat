@echo off
setlocal
echo ============================================
echo   Wingman - Installation des dependances
echo ============================================
echo.

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "VENV_DIR=%BACKEND_DIR%\.venv"

:: ---------- Verif des prerequis ----------
where py >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!!] Python introuvable. Installez Python 3.11+ depuis https://python.org
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!!] Node.js introuvable. Installez Node 20+ depuis https://nodejs.org
    pause
    exit /b 1
)

:: ---------- Backend (Python venv) ----------
echo [1/2] Backend Python...
if not exist "%VENV_DIR%\Scripts\python.exe" (
    echo       Creation du venv backend\.venv...
    py -3 -m venv "%VENV_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo [!!] Echec creation venv.
        pause
        exit /b 1
    )
) else (
    echo       venv existant detecte.
)

echo       Installation des dependances ^(pip install -r requirements.txt^)...
"%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip >nul
"%VENV_DIR%\Scripts\python.exe" -m pip install -r "%BACKEND_DIR%\requirements.txt"
if %ERRORLEVEL% NEQ 0 (
    echo [!!] pip install a echoue.
    pause
    exit /b 1
)
echo       Backend OK.
echo.

:: ---------- Frontend (npm) ----------
echo [2/2] Frontend Node.js...
cd /d "%FRONTEND_DIR%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [!!] npm install a echoue.
    pause
    exit /b 1
)
echo       Frontend OK.
echo.

echo ============================================
echo   Installation terminee !
echo ============================================
echo.
echo   Venv backend :  backend\.venv
echo   node_modules :  frontend\node_modules
echo.
echo   Prochaine etape : lancez start.bat
echo.
pause
endlocal
