#!/bin/bash

###############################################################################
# Database Restore Script
# Restores PostgreSQL database from backup
# Usage: ./scripts/restore-database.sh <backup-file>
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
  error "Usage: $0 <backup-file.sql.gz>"
  error "Example: $0 ./backups/daritana_backup_20250109_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env.production ]; then
  source .env.production
elif [ -f .env ]; then
  source .env
fi

# Database credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-daritana_prod}"
DB_USER="${DB_USER:-postgres}"

log "==================================================================="
log "Daritana Database Restore Script"
log "==================================================================="
log "Backup file: $BACKUP_FILE"
log "Database: $DB_NAME on $DB_HOST:$DB_PORT"
log "==================================================================="

# Confirm before proceeding
warn "WARNING: This will DROP and recreate the database!"
warn "All existing data will be LOST!"
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled."
  exit 0
fi

# Create temporary directory for extraction
TEMP_DIR=$(mktemp -d)
EXTRACTED_FILE="$TEMP_DIR/backup.sql"

log "Extracting backup file..."
gunzip -c "$BACKUP_FILE" > "$EXTRACTED_FILE"

if [ $? -eq 0 ]; then
  log "Backup file extracted successfully"
else
  error "Failed to extract backup file"
  rm -rf "$TEMP_DIR"
  exit 1
fi

log "Stopping all connections to database..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

log "Restoring database..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$EXTRACTED_FILE"

if [ $? -eq 0 ]; then
  log "Database restored successfully!"
else
  error "Database restore failed!"
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

log "Running database migrations..."
cd "$(dirname "$0")/.."
npx prisma migrate deploy

log "==================================================================="
log "Restore completed successfully!"
log "==================================================================="

exit 0
