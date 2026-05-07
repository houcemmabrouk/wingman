@echo off
setlocal
echo ============================================
echo   Wingman - Installation frontend ^(npm^)
echo ============================================
echo.

:: Resolu depuis l'emplacement du script, pas le cwd.
set "ROOT=%~dp0"
set "FRONTEND_DIR=%ROOT%frontend"

if not exist "%FRONTEND_DIR%\package.json" (
    echo [!!] package.json introuvable dans :
    echo      %FRONTEND_DIR%
    echo      Verifie que install-frontend.bat est bien a la racine du projet.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!!] npm introuvable. Installe Node.js 20+ depuis https://nodejs.org
    pause
    exit /b 1
)

echo Dossier  : %FRONTEND_DIR%
for /f "tokens=*" %%v in ('node --version 2^>nul') do echo Node.js  : %%v
for /f "tokens=*" %%v in ('npm --version 2^>nul')  do echo npm      : %%v
echo.

cd /d "%FRONTEND_DIR%"
echo Lancement de npm install...
echo.
call npm install
set "RC=%ERRORLEVEL%"

echo.
if %RC% NEQ 0 (
    echo [!!] npm install a echoue ^(code %RC%^).
    pause
    exit /b %RC%
)

echo ============================================
echo   Frontend installe avec succes !
echo ============================================
echo.
echo   node_modules cree dans : %FRONTEND_DIR%\node_modules
echo.
pause
endlocal
