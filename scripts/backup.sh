#!/bin/bash

# Daritana Backup Script
# Performs automated backups of database and uploaded files
# Usage: ./backup.sh [type] [destination]
# Example: ./backup.sh full /backups

set -e

# Configuration
BACKUP_TYPE=${1:-full}
BACKUP_DEST=${2:-/backups/daritana}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
ENCRYPT_BACKUP=${BACKUP_ENCRYPT:-true}
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY:-}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    exit 1
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DEST" ]; then
        log_info "Creating backup directory: $BACKUP_DEST"
        mkdir -p "$BACKUP_DEST"
    fi
}

# Backup database
backup_database() {
    log_info "Starting database backup..."
    
    DB_BACKUP_FILE="$BACKUP_DEST/db_${TIMESTAMP}.sql"
    
    # Use Docker if available
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.production.yml exec -T postgres \
            pg_dump -U ${DB_USER:-daritana_prod} ${DB_NAME:-daritana} > "$DB_BACKUP_FILE"
    else
        # Direct PostgreSQL backup
        PGPASSWORD=${DB_PASSWORD} pg_dump \
            -h ${DB_HOST:-localhost} \
            -p ${DB_PORT:-5432} \
            -U ${DB_USER:-daritana_prod} \
            -d ${DB_NAME:-daritana} \
            -f "$DB_BACKUP_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        # Compress the backup
        gzip "$DB_BACKUP_FILE"
        DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"
        
        # Encrypt if enabled
        if [ "$ENCRYPT_BACKUP" = "true" ] && [ -n "$ENCRYPTION_KEY" ]; then
            openssl enc -aes-256-cbc -salt -in "$DB_BACKUP_FILE" \
                -out "${DB_BACKUP_FILE}.enc" -k "$ENCRYPTION_KEY"
            rm "$DB_BACKUP_FILE"
            DB_BACKUP_FILE="${DB_BACKUP_FILE}.enc"
        fi
        
        log_info "Database backup completed: $DB_BACKUP_FILE"
        echo "$DB_BACKUP_FILE"
    else
        log_error "Database backup failed"
    fi
}

# Backup uploaded files
backup_files() {
    log_info "Starting file backup..."
    
    FILES_BACKUP_FILE="$BACKUP_DEST/files_${TIMESTAMP}.tar.gz"
    UPLOAD_DIR=${UPLOAD_DIR:-/app/uploads}
    
    if [ -d "$UPLOAD_DIR" ]; then
        tar -czf "$FILES_BACKUP_FILE" -C "$(dirname $UPLOAD_DIR)" "$(basename $UPLOAD_DIR)"
        
        # Encrypt if enabled
        if [ "$ENCRYPT_BACKUP" = "true" ] && [ -n "$ENCRYPTION_KEY" ]; then
            openssl enc -aes-256-cbc -salt -in "$FILES_BACKUP_FILE" \
                -out "${FILES_BACKUP_FILE}.enc" -k "$ENCRYPTION_KEY"
            rm "$FILES_BACKUP_FILE"
            FILES_BACKUP_FILE="${FILES_BACKUP_FILE}.enc"
        fi
        
        log_info "File backup completed: $FILES_BACKUP_FILE"
        echo "$FILES_BACKUP_FILE"
    else
        log_warn "Upload directory not found: $UPLOAD_DIR"
    fi
}

# Backup configuration files
backup_config() {
    log_info "Starting configuration backup..."
    
    CONFIG_BACKUP_FILE="$BACKUP_DEST/config_${TIMESTAMP}.tar.gz"
    
    # Create temporary directory for config files
    TEMP_DIR=$(mktemp -d)
    
    # Copy configuration files (excluding sensitive data)
    cp docker-compose.production.yml "$TEMP_DIR/" 2>/dev/null || true
    cp nginx.production.conf "$TEMP_DIR/" 2>/dev/null || true
    cp .env.example "$TEMP_DIR/" 2>/dev/null || true
    
    # Create tarball
    tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_DIR" .
    rm -rf "$TEMP_DIR"
    
    log_info "Configuration backup completed: $CONFIG_BACKUP_FILE"
    echo "$CONFIG_BACKUP_FILE"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DEST" -type f \( -name "*.sql.gz*" -o -name "*.tar.gz*" \) \
        -mtime +$RETENTION_DAYS -delete
    
    log_info "Cleanup completed"
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    local FILE=$1
    
    # AWS S3 upload
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        log_info "Uploading to S3: $FILE"
        aws s3 cp "$FILE" "s3://${AWS_S3_BUCKET}/backups/$(basename $FILE)"
    fi
    
    # Google Cloud Storage upload
    if [ -n "$GCS_BUCKET" ] && command -v gsutil &> /dev/null; then
        log_info "Uploading to GCS: $FILE"
        gsutil cp "$FILE" "gs://${GCS_BUCKET}/backups/$(basename $FILE)"
    fi
}

# Verify backup integrity
verify_backup() {
    local FILE=$1
    
    if [ -f "$FILE" ]; then
        # Check file size
        SIZE=$(stat -f%z "$FILE" 2>/dev/null || stat -c%s "$FILE" 2>/dev/null)
        if [ "$SIZE" -gt 0 ]; then
            log_info "Backup verified: $FILE (Size: $SIZE bytes)"
            return 0
        else
            log_error "Backup file is empty: $FILE"
            return 1
        fi
    else
        log_error "Backup file not found: $FILE"
        return 1
    fi
}

# Send notification
send_notification() {
    local STATUS=$1
    local MESSAGE=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup $STATUS: $MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Email notification (requires mail command)
    if [ -n "$BACKUP_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$MESSAGE" | mail -s "Daritana Backup $STATUS" "$BACKUP_EMAIL"
    fi
}

# Main backup function
perform_backup() {
    log_info "Starting backup process (Type: $BACKUP_TYPE)"
    
    create_backup_dir
    
    case $BACKUP_TYPE in
        full)
            DB_FILE=$(backup_database)
            FILES_FILE=$(backup_files)
            CONFIG_FILE=$(backup_config)
            
            # Verify backups
            verify_backup "$DB_FILE"
            verify_backup "$FILES_FILE"
            verify_backup "$CONFIG_FILE"
            
            # Upload to cloud if configured
            upload_to_cloud "$DB_FILE"
            upload_to_cloud "$FILES_FILE"
            upload_to_cloud "$CONFIG_FILE"
            ;;
        
        database)
            DB_FILE=$(backup_database)
            verify_backup "$DB_FILE"
            upload_to_cloud "$DB_FILE"
            ;;
        
        files)
            FILES_FILE=$(backup_files)
            verify_backup "$FILES_FILE"
            upload_to_cloud "$FILES_FILE"
            ;;
        
        config)
            CONFIG_FILE=$(backup_config)
            verify_backup "$CONFIG_FILE"
            upload_to_cloud "$CONFIG_FILE"
            ;;
        
        *)
            log_error "Unknown backup type: $BACKUP_TYPE"
            ;;
    esac
    
    cleanup_old_backups
    
    log_info "Backup process completed successfully"
    send_notification "SUCCESS" "Backup completed at $(date)"
}

# Error handling
trap 'log_error "Backup failed with error on line $LINENO"' ERR

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Run backup
perform_backup

# Create summary
log_info "=== Backup Summary ==="
log_info "Type: $BACKUP_TYPE"
log_info "Destination: $BACKUP_DEST"
log_info "Timestamp: $TIMESTAMP"
log_info "Retention: $RETENTION_DAYS days"
log_info "Encryption: $ENCRYPT_BACKUP"
log_info "===================="