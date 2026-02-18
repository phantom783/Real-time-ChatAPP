@echo off
REM Chat Application Startup Script for Windows

setlocal enabledelayedexpansion

echo.
echo ================================
echo Chat App - Development Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js v14+
    pause
    exit /b 1
)

echo Node.js installed: 
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

REM Setup frontend
echo Setting up Frontend...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

REM Setup environment file
if not exist ".env.local" (
    echo Creating .env.local from .env.example
    copy .env.example .env.local
    echo ^!WARNING^! Update .env.local with your configuration
)

echo Frontend ready
echo.

REM Setup backend
echo Setting up Backend...
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing backend dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)

REM Setup backend environment file
if not exist ".env" (
    echo Creating .env from .env.example
    copy .env.example .env
    echo ^!WARNING^! Update backend/.env with your configuration
)

echo Backend ready
cd ..
echo.

REM Summary
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Update .env.local (Frontend configuration)
echo 2. Update backend\.env (Backend configuration)
echo 3. Ensure MongoDB is running
echo.
echo To start development:
echo Terminal 1: cd backend ^&^& npm run dev
echo Terminal 2: npm run dev
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
pause
