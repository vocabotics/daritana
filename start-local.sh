#!/bin/bash

echo "==============================================="
echo "     DARITANA LOCAL TESTING ENVIRONMENT"
echo "==============================================="
echo

echo "[1/5] Checking dependencies..."
if ! npm list @prisma/client > /dev/null 2>&1; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
    cd backend
    npm install --legacy-peer-deps
    cd ..
fi

echo "[2/5] Setting up database..."
cd backend
echo "Running database migrations..."
npx prisma migrate dev --name init > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1

echo "[3/5] Seeding test data..."
npm run seed

echo "[4/5] Starting backend server..."
npm run dev &
BACKEND_PID=$!

sleep 3

echo "[5/5] Starting frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

sleep 3

echo
echo "==============================================="
echo "     LOCAL ENVIRONMENT STARTED!"
echo "==============================================="
echo
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8080"
echo
echo "Test Accounts:"
echo "- admin@daritana.com / Test123!"
echo "- john@architecture.com / Test123!"
echo "- sarah@design.com / Test123!"
echo "- client@company.com / Test123!"
echo
echo "Press Ctrl+C to stop all services"

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5173
fi

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait