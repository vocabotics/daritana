@echo off
echo ========================================
echo   DARITANA ARCHITECT MANAGEMENT SYSTEM
echo   Stopping Development Servers
echo ========================================
echo.

echo Stopping processes on port 7000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7000') do (
    echo Killing process %%a
    taskkill /PID %%a /F 2>nul
)

echo Stopping processes on port 7001 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7001') do (
    echo Killing process %%a
    taskkill /PID %%a /F 2>nul
)

echo.
echo ========================================
echo   All servers stopped successfully!
echo ========================================
echo.
pause