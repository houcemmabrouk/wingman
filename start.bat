@echo off
setlocal
echo ============================================
echo   Wingman - Demarrage des serveurs
echo ============================================
echo.

:: All paths are relative to this script's directory.
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

:: ---------- Database detection ----------
:: Try Postgres on localhost:5432. Otherwise fall back to bundled SQLite.
set "DB_MODE=sqlite"
where pg_isready >nul 2>&1 && pg_isready -h localhost -p 5432 -t 1 >nul 2>&1 && set "DB_MODE=postgres"

:: Fallback probe if pg_isready isn't on PATH.
if "%DB_MODE%"=="sqlite" (
    netstat -ano | findstr /R /C:":5432 .* LISTENING" >nul 2>&1 && set "DB_MODE=postgres"
)

if "%DB_MODE%"=="postgres" (
    echo [DB ] Postgres detecte sur localhost:5432
    set "BACKEND_DB_ENV=set DATABASE_URL=postgresql+asyncpg://wingman:wingman_secret@localhost:5432/wingman&&"
) else (
    echo [DB ] Aucun Postgres - fallback SQLite ^(wingman_fallback.db^)
    set "BACKEND_DB_ENV=set WINGMAN_NO_DB=1&&"
)

:: ---------- Redis (optional) ----------
set "REDIS_STATUS=absent (cache desactive)"
where redis-cli >nul 2>&1 && redis-cli -h localhost -p 6379 ping >nul 2>&1 && set "REDIS_STATUS=detecte sur localhost:6379"
echo [RED] Redis %REDIS_STATUS%
echo.

:: ---------- Python launcher selection ----------
:: Prefer a project venv if present; fall back to the system launcher (`py -3`).
if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
    set "PY=%BACKEND_DIR%\.venv\Scripts\python.exe"
    echo [PY ] venv detecte ^(backend\.venv^)
    goto :py_done
)
if exist "%ROOT%.venv\Scripts\python.exe" (
    set "PY=%ROOT%.venv\Scripts\python.exe"
    echo [PY ] venv detecte ^(.venv racine^)
    goto :py_done
)
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PY=py -3"
    echo [PY ] py -3 ^(systeme^)
    goto :py_done
)
echo [!!] Aucun Python detecte. Installez Python 3.11+ ou creez un venv :
echo      py -3 -m venv backend\.venv
echo      backend\.venv\Scripts\pip install -r backend\requirements.txt
pause
exit /b 1
:py_done

:: ---------- Backend ----------
echo [1/2] Demarrage backend FastAPI ^(port 8000^)...
start "Wingman Backend" cmd /k "cd /d "%BACKEND_DIR%" && %BACKEND_DB_ENV% %PY% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

:: ---------- Frontend ----------
echo [2/2] Demarrage frontend Next.js ^(port 3000^)...
start "Wingman Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Wingman est en cours de demarrage !
echo ============================================
echo.
echo   Frontend :  http://localhost:3000
echo   Backend  :  http://localhost:8000
echo   Swagger  :  http://localhost:8000/docs
echo   DB mode  :  %DB_MODE%
echo.
echo   Pour arreter : lancez stop.bat
echo.
pause
endlocal
