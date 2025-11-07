@echo off
echo ===============================================
echo     DARITANA LOCAL TESTING ENVIRONMENT
echo ===============================================
echo.

echo [1/5] Checking dependencies...
call npm list @prisma/client >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    cd backend
    call npm install --legacy-peer-deps
    cd ..
)

echo [2/5] Setting up database...
cd backend
echo Running database migrations...
call npx prisma migrate dev --name init >nul 2>&1
call npx prisma generate >nul 2>&1

echo [3/5] Seeding test data...
call npm run seed

echo [4/5] Starting backend server...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [5/5] Starting frontend...
cd ..
start cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ===============================================
echo     LOCAL ENVIRONMENT STARTED!
echo ===============================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo.
echo Test Accounts:
echo - admin@daritana.com / Test123!
echo - john@architecture.com / Test123!
echo - sarah@design.com / Test123!
echo - client@company.com / Test123!
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173