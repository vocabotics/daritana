@echo off
echo ========================================
echo   DARITANA ARCHITECT MANAGEMENT SYSTEM
echo   Starting Development Servers
echo ========================================
echo.

REM Kill any existing processes on our ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7000') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7001') do taskkill /PID %%a /F 2>nul

REM Set environment variables
echo Setting environment variables...
set VITE_PORT=7000
set VITE_API_URL=http://localhost:7001/api
set PORT=7001
set NODE_ENV=development

REM Start Backend Server
echo.
echo Starting Backend Server on port 7001...
start "Daritana Backend" cmd /k "cd backend && set PORT=7001 && npm run dev"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo.
echo Starting Frontend Server on port 7000...
start "Daritana Frontend" cmd /k "set VITE_PORT=7000 && set VITE_API_URL=http://localhost:7001/api && npm run dev -- --port 7000"

echo.
echo ========================================
echo   Servers are starting...
echo   Frontend: http://localhost:7000
echo   Backend:  http://localhost:7001/api
echo ========================================
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open the application in the default browser
start http://localhost:7000

echo.
echo Application launched successfully!
echo Keep this window open to monitor the servers.
echo Press Ctrl+C to stop all servers.
pause