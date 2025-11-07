#!/bin/bash

# Daritana Health Check Script
# Performs comprehensive health checks on all services
# Usage: ./health-check.sh [--verbose]

set -e

# Configuration
VERBOSE=${1:-}
FRONTEND_URL=${FRONTEND_URL:-https://localhost:3000}
API_URL=${VITE_API_URL:-https://localhost:8080/api}
TIMEOUT=5

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Logging functions
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
    ((TOTAL_CHECKS++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_info() {
    if [ "$VERBOSE" = "--verbose" ]; then
        echo "  ℹ $1"
    fi
}

# Check if service is running
check_service() {
    local SERVICE=$1
    local PORT=$2
    
    if nc -z localhost $PORT 2>/dev/null; then
        log_success "$SERVICE is running on port $PORT"
        return 0
    else
        log_error "$SERVICE is not responding on port $PORT"
        return 1
    fi
}

# Check HTTP endpoint
check_http_endpoint() {
    local NAME=$1
    local URL=$2
    local EXPECTED_STATUS=${3:-200}
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$URL" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "$EXPECTED_STATUS" ]; then
        log_success "$NAME returned status $RESPONSE"
        log_info "URL: $URL"
        return 0
    elif [ "$RESPONSE" = "000" ]; then
        log_error "$NAME is not reachable"
        log_info "URL: $URL"
        return 1
    else
        log_warning "$NAME returned status $RESPONSE (expected $EXPECTED_STATUS)"
        log_info "URL: $URL"
        return 1
    fi
}

# Check database connection
check_database() {
    if command -v docker-compose &> /dev/null; then
        if docker-compose -f docker-compose.production.yml exec -T postgres \
            psql -U ${DB_USER:-daritana_prod} -d ${DB_NAME:-daritana} -c "SELECT 1;" &>/dev/null; then
            log_success "PostgreSQL database is accessible"
            
            # Check table count
            TABLE_COUNT=$(docker-compose -f docker-compose.production.yml exec -T postgres \
                psql -U ${DB_USER:-daritana_prod} -d ${DB_NAME:-daritana} -t -c \
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
            log_info "Database has $TABLE_COUNT tables"
            return 0
        else
            log_error "PostgreSQL database is not accessible"
            return 1
        fi
    else
        log_warning "Docker Compose not available, skipping database check"
        return 1
    fi
}

# Check Redis
check_redis() {
    if command -v docker-compose &> /dev/null; then
        if docker-compose -f docker-compose.production.yml exec -T redis \
            redis-cli ping &>/dev/null; then
            log_success "Redis cache is responsive"
            
            # Check memory usage
            MEMORY_USAGE=$(docker-compose -f docker-compose.production.yml exec -T redis \
                redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
            log_info "Redis memory usage: $MEMORY_USAGE"
            return 0
        else
            log_error "Redis cache is not responsive"
            return 1
        fi
    else
        log_warning "Docker Compose not available, skipping Redis check"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "Disk usage is ${DISK_USAGE}%"
        return 0
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log_warning "Disk usage is ${DISK_USAGE}% (getting high)"
        return 0
    else
        log_error "Disk usage is ${DISK_USAGE}% (critical)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    if command -v free &> /dev/null; then
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
        
        if [ "$MEMORY_USAGE" -lt 80 ]; then
            log_success "Memory usage is ${MEMORY_USAGE}%"
            return 0
        elif [ "$MEMORY_USAGE" -lt 90 ]; then
            log_warning "Memory usage is ${MEMORY_USAGE}% (getting high)"
            return 0
        else
            log_error "Memory usage is ${MEMORY_USAGE}% (critical)"
            return 1
        fi
    else
        log_warning "Memory check not available on this system"
        return 1
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    local DOMAIN=${1:-yourdomain.com}
    
    if command -v openssl &> /dev/null; then
        CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
            openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ -n "$CERT_EXPIRY" ]; then
            EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
            CURRENT_EPOCH=$(date +%s)
            DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
            
            if [ "$DAYS_LEFT" -gt 30 ]; then
                log_success "SSL certificate valid for $DAYS_LEFT days"
                return 0
            elif [ "$DAYS_LEFT" -gt 7 ]; then
                log_warning "SSL certificate expires in $DAYS_LEFT days"
                return 0
            else
                log_error "SSL certificate expires in $DAYS_LEFT days!"
                return 1
            fi
        else
            log_warning "Could not check SSL certificate for $DOMAIN"
            return 1
        fi
    else
        log_warning "OpenSSL not available, skipping certificate check"
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    if command -v docker &> /dev/null; then
        RUNNING=$(docker ps --filter "name=daritana" --format "{{.Names}}" | wc -l)
        TOTAL=$(docker ps -a --filter "name=daritana" --format "{{.Names}}" | wc -l)
        
        if [ "$RUNNING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
            log_success "All $TOTAL Docker containers are running"
            return 0
        elif [ "$RUNNING" -gt 0 ]; then
            log_warning "$RUNNING of $TOTAL Docker containers are running"
            return 0
        else
            log_error "No Docker containers are running"
            return 1
        fi
    else
        log_warning "Docker not available, skipping container check"
        return 1
    fi
}

# Main health check
echo "========================================="
echo "Daritana Health Check Report"
echo "Time: $(date)"
echo "========================================="
echo ""

echo "🔍 Checking Core Services..."
check_service "Frontend" 3000
check_service "Backend API" 8080
check_service "PostgreSQL" 5432
check_service "Redis" 6379
echo ""

echo "🌐 Checking HTTP Endpoints..."
check_http_endpoint "Frontend Home" "$FRONTEND_URL" 200
check_http_endpoint "API Health" "$API_URL/health" 200
check_http_endpoint "API Auth" "$API_URL/auth/status" 200
echo ""

echo "💾 Checking Data Services..."
check_database
check_redis
echo ""

echo "💻 Checking System Resources..."
check_disk_space
check_memory
echo ""

echo "🔒 Checking Security..."
check_ssl_certificate
echo ""

echo "🐳 Checking Containers..."
check_docker_containers
echo ""

# Summary
echo "========================================="
echo "Health Check Summary"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED_CHECKS"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED_CHECKS"
echo -e "Total Checks: $TOTAL_CHECKS"

# Calculate health score
HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo ""
echo -n "Overall Health Score: "

if [ "$HEALTH_SCORE" -ge 90 ]; then
    echo -e "${GREEN}${HEALTH_SCORE}% - Excellent${NC}"
    exit 0
elif [ "$HEALTH_SCORE" -ge 70 ]; then
    echo -e "${GREEN}${HEALTH_SCORE}% - Good${NC}"
    exit 0
elif [ "$HEALTH_SCORE" -ge 50 ]; then
    echo -e "${YELLOW}${HEALTH_SCORE}% - Fair (attention needed)${NC}"
    exit 1
else
    echo -e "${RED}${HEALTH_SCORE}% - Poor (immediate action required)${NC}"
    exit 2
fi