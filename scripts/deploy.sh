#!/bin/bash

# Daritana Production Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production deploy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-deploy}
PROJECT_NAME="daritana"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it from .env.example"
    fi
    
    log_info "All requirements met"
}

backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.sql"
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres \
        pg_dump -U ${DB_USER:-daritana} ${DB_NAME:-daritana} > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log_info "Backup created: $BACKUP_FILE"
    else
        log_warn "Backup failed, continuing anyway..."
    fi
}

pull_latest() {
    log_info "Pulling latest code..."
    git fetch --all
    git pull origin main
}

build_images() {
    log_info "Building Docker images..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
}

deploy_services() {
    log_info "Deploying services..."
    
    # Stop existing services
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    docker-compose -f $DOCKER_COMPOSE_FILE ps
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec backend npm run migrate
    
    if [ $? -eq 0 ]; then
        log_info "Migrations completed successfully"
    else
        log_error "Migrations failed"
    fi
}

clear_cache() {
    log_info "Clearing cache..."
    
    # Clear Redis cache
    docker-compose -f $DOCKER_COMPOSE_FILE exec redis redis-cli FLUSHALL
    
    # Clear application cache
    docker-compose -f $DOCKER_COMPOSE_FILE exec backend rm -rf /app/cache/*
    
    log_info "Cache cleared"
}

health_check() {
    log_info "Running health checks..."
    
    # Check backend
    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
    if [ "$BACKEND_HEALTH" == "200" ]; then
        log_info "Backend is healthy"
    else
        log_error "Backend health check failed"
    fi
    
    # Check frontend
    FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    if [ "$FRONTEND_HEALTH" == "200" ]; then
        log_info "Frontend is healthy"
    else
        log_warn "Frontend health check failed"
    fi
}

rollback() {
    log_info "Rolling back deployment..."
    
    # Checkout previous commit
    git checkout HEAD~1
    
    # Rebuild and deploy
    build_images
    deploy_services
    
    log_info "Rollback completed"
}

show_logs() {
    log_info "Showing logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f --tail=100
}

show_status() {
    log_info "Service Status:"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    
    echo ""
    log_info "Resource Usage:"
    docker stats --no-stream
}

# Main execution
log_info "Starting deployment for environment: $ENVIRONMENT"
log_info "Action: $ACTION"

case $ACTION in
    deploy)
        check_requirements
        backup_database
        pull_latest
        build_images
        deploy_services
        run_migrations
        clear_cache
        health_check
        log_info "Deployment completed successfully!"
        ;;
    
    build)
        check_requirements
        build_images
        log_info "Build completed successfully!"
        ;;
    
    migrate)
        run_migrations
        ;;
    
    backup)
        backup_database
        ;;
    
    rollback)
        rollback
        ;;
    
    logs)
        show_logs
        ;;
    
    status)
        show_status
        ;;
    
    restart)
        docker-compose -f $DOCKER_COMPOSE_FILE restart
        log_info "Services restarted"
        ;;
    
    stop)
        docker-compose -f $DOCKER_COMPOSE_FILE stop
        log_info "Services stopped"
        ;;
    
    start)
        docker-compose -f $DOCKER_COMPOSE_FILE start
        log_info "Services started"
        ;;
    
    *)
        echo "Usage: $0 [environment] [action]"
        echo "Actions: deploy, build, migrate, backup, rollback, logs, status, restart, stop, start"
        exit 1
        ;;
esac