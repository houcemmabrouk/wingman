@echo off
echo ============================================
echo   Wingman - Arret des serveurs
echo ============================================
echo.

:: Kill Backend (uvicorn on port 8000) + child processes
echo [1/3] Arret du backend (port 8000)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%p /T /F >nul 2>&1
)

:: Kill Frontend (Next.js on 3000, plus fallback 3001/3002) + child processes
echo [2/3] Arret du frontend (ports 3000-3002)...
for %%P in (3000 3001 3002) do (
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        taskkill /PID %%p /T /F >nul 2>&1
    )
)

:: Close the named cmd windows opened by start.bat
echo [3/3] Fermeture des fenetres Wingman...
taskkill /FI "WINDOWTITLE eq Wingman Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Wingman Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator: Wingman Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator: Wingman Frontend*" /T /F >nul 2>&1

:: Best-effort cleanup of any orphaned uvicorn / next-dev workers
taskkill /FI "IMAGENAME eq uvicorn.exe" /F >nul 2>&1
for /f "tokens=2" %%p in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST ^| findstr /B "PID:"') do (
    wmic process where "ProcessId=%%p" get CommandLine 2>nul | findstr /I "next" >nul && taskkill /PID %%p /F >nul 2>&1
)

:: Purge Next.js build cache (OneDrive-friendly: avoids EINVAL readlink on restart)
if exist "%~dp0frontend\.next" (
    echo Purge du cache .next...
    rmdir /S /Q "%~dp0frontend\.next" >nul 2>&1
)

echo.
echo ============================================
echo   Tous les serveurs sont arretes.
echo   Vous pouvez relancer via start.bat
echo ============================================
echo.
pause
