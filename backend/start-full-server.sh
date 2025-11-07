#!/bin/bash

# Start the full backend server (non-Prisma version)
echo "🚀 Starting Daritana Backend Server (pg version)..."
echo "📦 Using direct PostgreSQL connection with pg library"
echo ""

# Kill any existing process on port 7001
if lsof -i :7001 > /dev/null 2>&1; then
    echo "⚠️  Port 7001 is in use, stopping existing process..."
    kill $(lsof -t -i :7001) 2>/dev/null || true
    sleep 2
fi

# Start the server
echo "✅ Starting server on port 7001..."
npx tsx full-backend-server.ts