@echo off
setlocal
echo ============================================
echo   Wingman - Installation backend ^(venv + pip^)
echo ============================================
echo.

:: Resolu depuis l'emplacement du script, pas le cwd.
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "VENV_DIR=%BACKEND_DIR%\.venv"
set "REQS=%BACKEND_DIR%\requirements.txt"

if not exist "%REQS%" (
    echo [!!] requirements.txt introuvable dans :
    echo      %BACKEND_DIR%
    echo      Verifie que install-backend.bat est bien a la racine du projet.
    pause
    exit /b 1
)

where py >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!!] py ^(Python launcher^) introuvable.
    echo      Installe Python 3.11+ depuis https://python.org
    echo      ^(coche "Add python.exe to PATH" pendant l'install^)
    pause
    exit /b 1
)

echo Dossier        : %BACKEND_DIR%
for /f "tokens=*" %%v in ('py -3 --version 2^>^&1') do echo Python systeme : %%v
echo Venv cible     : %VENV_DIR%
echo.

:: ---------- Creation du venv ----------
if exist "%VENV_DIR%\Scripts\python.exe" (
    echo [1/3] venv existant detecte, on le reutilise.
) else (
    echo [1/3] Creation du venv...
    py -3 -m venv "%VENV_DIR%"
    if %ERRORLEVEL% NEQ 0 (
        echo [!!] Echec creation venv.
        pause
        exit /b 1
    )
)
echo.

:: ---------- Mise a jour pip ----------
echo [2/3] Mise a jour de pip dans le venv...
"%VENV_DIR%\Scripts\python.exe" -m pip install --upgrade pip
if %ERRORLEVEL% NEQ 0 (
    echo [!!] Echec upgrade pip.
    pause
    exit /b 1
)
echo.

:: ---------- Install des deps ----------
echo [3/3] Installation des dependances ^(requirements.txt^)...
"%VENV_DIR%\Scripts\python.exe" -m pip install -r "%REQS%"
set "RC=%ERRORLEVEL%"

echo.
if %RC% NEQ 0 (
    echo [!!] pip install a echoue ^(code %RC%^).
    echo      Voir l'erreur ci-dessus.
    pause
    exit /b %RC%
)

echo ============================================
echo   Backend installe avec succes !
echo ============================================
echo.
echo   Venv      : %VENV_DIR%
echo   Activate  : %VENV_DIR%\Scripts\activate
echo.
echo   start.bat detectera automatiquement ce venv.
echo.
pause
endlocal
