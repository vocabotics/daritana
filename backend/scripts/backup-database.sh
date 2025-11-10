#!/bin/bash

###############################################################################
# Database Backup Automation Script
# Backs up PostgreSQL database to local and optionally to S3
# Usage: ./scripts/backup-database.sh [--s3]
###############################################################################

set -e  # Exit on error

# Load environment variables
if [ -f .env.production ]; then
  source .env.production
fi

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/daritana_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Database credentials from environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-daritana_prod}"
DB_USER="${DB_USER:-postgres}"

# S3 configuration (optional)
UPLOAD_TO_S3=false
if [ "$1" == "--s3" ]; then
  UPLOAD_TO_S3=true
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

###############################################################################
# Functions
###############################################################################

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

check_dependencies() {
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
  fi

  if [ "$UPLOAD_TO_S3" == "true" ] && ! command -v aws &> /dev/null; then
    error "AWS CLI not found. Please install AWS CLI for S3 uploads."
    exit 1
  fi
}

create_backup_directory() {
  if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
  fi
}

perform_backup() {
  log "Starting database backup..."
  log "Database: $DB_NAME on $DB_HOST:$DB_PORT"

  # Perform backup with pg_dump
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_FILE"

  if [ $? -eq 0 ]; then
    log "Database dump completed: $BACKUP_FILE"
  else
    error "Database dump failed!"
    exit 1
  fi
}

compress_backup() {
  log "Compressing backup..."

  gzip "$BACKUP_FILE"

  if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "Backup compressed: $COMPRESSED_FILE ($BACKUP_SIZE)"
  else
    error "Compression failed!"
    exit 1
  fi
}

upload_to_s3() {
  if [ "$UPLOAD_TO_S3" != "true" ]; then
    return 0
  fi

  log "Uploading backup to S3..."

  S3_BUCKET="${S3_BACKUP_BUCKET}"
  S3_PATH="s3://${S3_BUCKET}/database-backups/$(basename $COMPRESSED_FILE)"

  aws s3 cp "$COMPRESSED_FILE" "$S3_PATH" --storage-class STANDARD_IA

  if [ $? -eq 0 ]; then
    log "Backup uploaded to S3: $S3_PATH"
  else
    error "S3 upload failed!"
    exit 1
  fi
}

cleanup_old_backups() {
  log "Cleaning up backups older than $RETENTION_DAYS days..."

  # Remove local backups older than retention period
  find "$BACKUP_DIR" -name "daritana_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

  REMAINING=$(find "$BACKUP_DIR" -name "daritana_backup_*.sql.gz" -type f | wc -l)
  log "Local backups remaining: $REMAINING"

  # Cleanup old S3 backups if enabled
  if [ "$UPLOAD_TO_S3" == "true" ]; then
    log "Cleaning up S3 backups older than $RETENTION_DAYS days..."

    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%s)

    aws s3 ls "s3://${S3_BACKUP_BUCKET}/database-backups/" | while read -r line; do
      FILE_DATE=$(echo "$line" | awk '{print $1" "$2}')
      FILE_NAME=$(echo "$line" | awk '{print $4}')

      if [ -n "$FILE_NAME" ]; then
        FILE_TIMESTAMP=$(date -d "$FILE_DATE" +%s)

        if [ "$FILE_TIMESTAMP" -lt "$CUTOFF_DATE" ]; then
          log "Deleting old S3 backup: $FILE_NAME"
          aws s3 rm "s3://${S3_BACKUP_BUCKET}/database-backups/$FILE_NAME"
        fi
      fi
    done
  fi
}

verify_backup() {
  log "Verifying backup integrity..."

  # Check if file exists and is not empty
  if [ ! -s "$COMPRESSED_FILE" ]; then
    error "Backup file is empty or does not exist!"
    exit 1
  fi

  # Test gunzip
  gunzip -t "$COMPRESSED_FILE"

  if [ $? -eq 0 ]; then
    log "Backup integrity verified successfully"
  else
    error "Backup integrity check failed!"
    exit 1
  fi
}

send_notification() {
  local STATUS=$1
  local MESSAGE=$2

  # If notification webhook is configured, send notification
  if [ -n "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$STATUS\", \"message\": \"$MESSAGE\", \"timestamp\": \"$(date -Iseconds)\"}" \
      &> /dev/null
  fi
}

###############################################################################
# Main execution
###############################################################################

main() {
  log "==================================================================="
  log "Daritana Database Backup Script"
  log "==================================================================="

  check_dependencies
  create_backup_directory
  perform_backup
  compress_backup
  verify_backup
  upload_to_s3
  cleanup_old_backups

  log "==================================================================="
  log "Backup completed successfully!"
  log "Backup file: $COMPRESSED_FILE"
  log "==================================================================="

  send_notification "success" "Database backup completed: $(basename $COMPRESSED_FILE)"
}

# Trap errors and send notification
trap 'error "Backup failed with error!"; send_notification "error" "Database backup failed"; exit 1' ERR

# Run main function
main

exit 0
