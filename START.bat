@echo off
title Landolt C Vision Test

echo.
echo  ================================================
echo    Landolt C Vision Test  -  Starting...
echo  ================================================
echo.

REM ── Check Node.js ───────────────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please download it from:  https://nodejs.org
    echo  Click the LTS button, install it, then double-click this file again.
    echo.
    pause
    exit /b 1
)

REM ── Install packages on first run ───────────────────────────────────
if not exist "node_modules" (
    echo  First run: installing packages ^(takes ~30 seconds^)...
    echo.
    npm install
    echo.
)

REM ── Start server (browser opens automatically) ───────────────────────
echo  Starting... your browser will open automatically.
echo  To stop: close this window or press Ctrl+C
echo.
node server.js
pause