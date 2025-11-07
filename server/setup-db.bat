@echo off
echo Setting up Daritana Database...

set PGPASSWORD=postgres

echo Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS daritana_dev;"
psql -U postgres -c "CREATE DATABASE daritana_dev;"

echo Running schema...
psql -U postgres -d daritana_dev -f src/database/schema.sql

echo Database setup complete!