@echo off
setlocal enabledelayedexpansion
title Cross-Platform AI Chatbot - Launcher
color 0B

echo ===================================================================
echo           CROSS-PLATFORM AI CHATBOT - ONE-CLICK LAUNCHER
echo ===================================================================
echo.

:: 1. Detect project directories
set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "WIDGET_DIR=%PROJECT_ROOT%\widget"

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Could not locate backend directory at %BACKEND_DIR%!
    pause
    exit /b 1
)

echo Project directory: %PROJECT_ROOT%
echo.

:: 2. Check for port conflicts and clear them
echo [*] Checking for previous running servers on ports 8000 and 5173...
powershell -NoProfile -Command "try { (Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ea 0).OwningProcess | %% { Stop-Process -Id $_ -Force -ea 0 } } catch {}; exit 0" >nul 2>nul
echo [*] Ports clean and ready.
echo.

:: 3. Verify Python
echo [1/4] Checking Python installation...
set "PYTHON_CMD="
where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON_CMD=py"
    )
)

if not defined PYTHON_CMD goto python_missing
goto python_ok

:python_missing
echo.
echo ===================================================================
echo [ERROR] Python is not installed or not in your system PATH!
echo Please install Python 3.10+ from: https://www.python.org/downloads/
echo Make sure to check the box: Add Python to PATH during installation!
echo ===================================================================
echo.
pause
exit /b 1

:python_ok
for /f "tokens=*" %%v in ('%PYTHON_CMD% --version 2^>^&1') do echo   - Found %%v

:: 4. Verify Node.js and npm
echo.
echo [2/4] Checking Node.js and npm...
where node >nul 2>nul
if %errorlevel% neq 0 goto node_missing
where npm >nul 2>nul
if %errorlevel% neq 0 goto node_missing
goto node_ok

:node_missing
echo.
echo ===================================================================
echo [ERROR] Node.js or npm is not installed or not in your system PATH!
echo Please download and install Node.js from: https://nodejs.org/
echo ===================================================================
echo.
pause
exit /b 1

:node_ok
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo   - Found Node.js %%v
for /f "tokens=*" %%v in ('npm --version 2^>^&1') do echo   - Found npm %%v

:: 5. Setup Python Virtual Environment and Dependencies
echo.
echo [3/4] Preparing Python backend environment...
cd /d "%BACKEND_DIR%"

if exist ".env" goto env_ready
if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo   - Created .env file from .env.example
) else (
    echo AI_PROVIDER=ollama> ".env"
    echo OLLAMA_MODEL=llama3.2>> ".env"
    echo OLLAMA_BASE_URL=http://localhost:11434>> ".env"
    echo   - Created default .env file
)
:env_ready

if exist "venv\Scripts\python.exe" goto venv_ready
echo   - Creating Python virtual environment...
%PYTHON_CMD% -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment!
    pause
    exit /b 1
)
:venv_ready

if exist "venv\Lib\site-packages\fastapi" goto pip_ready
echo   - Installing backend dependencies from requirements.txt...
"%BACKEND_DIR%\venv\Scripts\python.exe" -m pip install -q -r requirements.txt
:pip_ready
echo   - Backend environment ready.

:: 6. Setup Frontend Widget dependencies and build
echo.
echo [4/4] Preparing Frontend Widget...
cd /d "%WIDGET_DIR%"

if exist "node_modules" goto modules_ready
echo   - Installing npm packages for the widget...
call npm install
:modules_ready

if exist "dist\chat-widget.js" goto build_ready
echo   - Building widget bundle...
call npm run build
:build_ready
echo   - Frontend widget ready.

:: 7. Launch servers smoothly in the single console (Zero extra CMD windows)
cd /d "%PROJECT_ROOT%"
echo.
"%BACKEND_DIR%\venv\Scripts\python.exe" "%PROJECT_ROOT%\launcher.py"
