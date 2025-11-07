@echo off
echo Setting up development database...

REM Create database if it doesn't exist
echo Creating database daritana_dev...
psql -U postgres -c "CREATE DATABASE daritana_dev;" 2>nul

REM Run Prisma migrations
echo Running Prisma migrations...
npx prisma migrate dev --name init

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate

echo Database setup complete!
echo.
echo You can now start the backend server with: npm run dev
pause