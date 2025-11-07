#!/bin/bash

# Daritana Restore Script
# Restores database and files from backup
# Usage: ./restore.sh [backup_file] [type]
# Example: ./restore.sh /backups/db_20240101_120000.sql.gz database

set -e

# Configuration
BACKUP_FILE=$1
RESTORE_TYPE=${2:-auto}
DECRYPT_BACKUP=${BACKUP_ENCRYPT:-true}
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

# Check if backup file exists
check_backup_file() {
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
    fi
}

# Detect backup type from filename
detect_backup_type() {
    if [[ "$BACKUP_FILE" == *"db_"* ]]; then
        echo "database"
    elif [[ "$BACKUP_FILE" == *"files_"* ]]; then
        echo "files"
    elif [[ "$BACKUP_FILE" == *"config_"* ]]; then
        echo "config"
    else
        echo "unknown"
    fi
}

# Decrypt backup if encrypted
decrypt_backup() {
    local FILE=$1
    
    if [[ "$FILE" == *.enc ]]; then
        if [ "$DECRYPT_BACKUP" = "true" ] && [ -n "$ENCRYPTION_KEY" ]; then
            log_info "Decrypting backup..."
            DECRYPTED_FILE="${FILE%.enc}"
            openssl enc -aes-256-cbc -d -in "$FILE" -out "$DECRYPTED_FILE" -k "$ENCRYPTION_KEY"
            echo "$DECRYPTED_FILE"
        else
            log_error "Backup is encrypted but no encryption key provided"
        fi
    else
        echo "$FILE"
    fi
}

# Restore database
restore_database() {
    local FILE=$1
    log_info "Starting database restore from: $FILE"
    
    # Decrypt if needed
    FILE=$(decrypt_backup "$FILE")
    
    # Decompress if gzipped
    if [[ "$FILE" == *.gz ]]; then
        log_info "Decompressing backup..."
        gunzip -c "$FILE" > "${FILE%.gz}"
        FILE="${FILE%.gz}"
    fi
    
    # Stop application to prevent connections
    log_warn "Stopping application services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.production.yml stop app worker
    fi
    
    # Create backup of current database
    log_info "Creating backup of current database..."
    ./scripts/backup.sh database /backups/before-restore
    
    # Restore database
    log_info "Restoring database..."
    if command -v docker-compose &> /dev/null; then
        # Drop existing database and recreate
        docker-compose -f docker-compose.production.yml exec -T postgres \
            psql -U ${DB_USER:-daritana_prod} -c "DROP DATABASE IF EXISTS ${DB_NAME:-daritana};"
        docker-compose -f docker-compose.production.yml exec -T postgres \
            psql -U ${DB_USER:-daritana_prod} -c "CREATE DATABASE ${DB_NAME:-daritana};"
        
        # Restore from backup
        docker-compose -f docker-compose.production.yml exec -T postgres \
            psql -U ${DB_USER:-daritana_prod} ${DB_NAME:-daritana} < "$FILE"
    else
        # Direct PostgreSQL restore
        PGPASSWORD=${DB_PASSWORD} psql \
            -h ${DB_HOST:-localhost} \
            -p ${DB_PORT:-5432} \
            -U ${DB_USER:-daritana_prod} \
            -c "DROP DATABASE IF EXISTS ${DB_NAME:-daritana};"
        
        PGPASSWORD=${DB_PASSWORD} psql \
            -h ${DB_HOST:-localhost} \
            -p ${DB_PORT:-5432} \
            -U ${DB_USER:-daritana_prod} \
            -c "CREATE DATABASE ${DB_NAME:-daritana};"
        
        PGPASSWORD=${DB_PASSWORD} psql \
            -h ${DB_HOST:-localhost} \
            -p ${DB_PORT:-5432} \
            -U ${DB_USER:-daritana_prod} \
            -d ${DB_NAME:-daritana} \
            -f "$FILE"
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.production.yml exec -T app \
            npx prisma migrate deploy
    fi
    
    # Restart services
    log_info "Restarting application services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.production.yml start app worker
    fi
    
    log_info "Database restore completed successfully"
}

# Restore files
restore_files() {
    local FILE=$1
    log_info "Starting file restore from: $FILE"
    
    # Decrypt if needed
    FILE=$(decrypt_backup "$FILE")
    
    UPLOAD_DIR=${UPLOAD_DIR:-/app/uploads}
    
    # Create backup of current files
    log_info "Creating backup of current files..."
    if [ -d "$UPLOAD_DIR" ]; then
        mv "$UPLOAD_DIR" "${UPLOAD_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Extract files
    log_info "Extracting files..."
    mkdir -p "$(dirname $UPLOAD_DIR)"
    tar -xzf "$FILE" -C "$(dirname $UPLOAD_DIR)"
    
    # Set proper permissions
    log_info "Setting file permissions..."
    chown -R www-data:www-data "$UPLOAD_DIR" 2>/dev/null || true
    chmod -R 755 "$UPLOAD_DIR"
    
    log_info "File restore completed successfully"
}

# Restore configuration
restore_config() {
    local FILE=$1
    log_info "Starting configuration restore from: $FILE"
    
    # Decrypt if needed
    FILE=$(decrypt_backup "$FILE")
    
    # Create backup directory for current config
    CONFIG_BACKUP_DIR="config.backup.$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CONFIG_BACKUP_DIR"
    
    # Backup current configuration files
    log_info "Backing up current configuration..."
    cp docker-compose.production.yml "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    cp nginx.production.conf "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
    
    # Extract configuration
    log_info "Extracting configuration files..."
    tar -xzf "$FILE" -C .
    
    log_info "Configuration restore completed successfully"
    log_warn "Please review the restored configuration files before restarting services"
}

# Verify restore
verify_restore() {
    local TYPE=$1
    
    case $TYPE in
        database)
            # Check database connection
            if command -v docker-compose &> /dev/null; then
                docker-compose -f docker-compose.production.yml exec -T postgres \
                    psql -U ${DB_USER:-daritana_prod} -d ${DB_NAME:-daritana} -c "SELECT COUNT(*) FROM users;" &>/dev/null
            fi
            
            if [ $? -eq 0 ]; then
                log_info "Database restore verified successfully"
            else
                log_error "Database restore verification failed"
            fi
            ;;
        
        files)
            # Check if files exist
            UPLOAD_DIR=${UPLOAD_DIR:-/app/uploads}
            if [ -d "$UPLOAD_DIR" ] && [ "$(ls -A $UPLOAD_DIR)" ]; then
                log_info "File restore verified successfully"
            else
                log_error "File restore verification failed"
            fi
            ;;
        
        config)
            # Check if config files exist
            if [ -f "docker-compose.production.yml" ] && [ -f "nginx.production.conf" ]; then
                log_info "Configuration restore verified successfully"
            else
                log_error "Configuration restore verification failed"
            fi
            ;;
    esac
}

# Main restore function
perform_restore() {
    check_backup_file
    
    # Auto-detect type if not specified
    if [ "$RESTORE_TYPE" = "auto" ]; then
        RESTORE_TYPE=$(detect_backup_type)
        log_info "Auto-detected backup type: $RESTORE_TYPE"
    fi
    
    case $RESTORE_TYPE in
        database)
            restore_database "$BACKUP_FILE"
            verify_restore "database"
            ;;
        
        files)
            restore_files "$BACKUP_FILE"
            verify_restore "files"
            ;;
        
        config)
            restore_config "$BACKUP_FILE"
            verify_restore "config"
            ;;
        
        *)
            log_error "Unknown restore type: $RESTORE_TYPE"
            ;;
    esac
}

# Confirmation prompt
confirm_restore() {
    log_warn "=== RESTORE WARNING ==="
    log_warn "This will restore from: $BACKUP_FILE"
    log_warn "Restore type: $RESTORE_TYPE"
    log_warn "This operation will OVERWRITE existing data!"
    log_warn "======================="
    
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

# Error handling
trap 'log_error "Restore failed with error on line $LINENO"' ERR

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check arguments
if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 [backup_file] [type]"
fi

# Confirm before restore
confirm_restore

# Run restore
perform_restore

# Summary
log_info "=== Restore Summary ==="
log_info "Backup file: $BACKUP_FILE"
log_info "Restore type: $RESTORE_TYPE"
log_info "Completed at: $(date)"
log_info "====================="