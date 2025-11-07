#!/bin/bash

# Daritana Security Audit Script
# This script performs a comprehensive security audit of the Daritana system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AUDIT_DIR="/tmp/daritana-security-audit"
REPORT_FILE="$AUDIT_DIR/security-audit-report.txt"
SCORE=0
MAX_SCORE=100

# Create audit directory
mkdir -p "$AUDIT_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$REPORT_FILE"
}

# Function to add score
add_score() {
    local points=$1
    local reason=$2
    SCORE=$((SCORE + points))
    log "✅ +$points points: $reason"
}

# Function to subtract score
subtract_score() {
    local points=$1
    local reason=$2
    SCORE=$((SCORE - points))
    log "❌ -$points points: $reason"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check file permissions
check_file_permissions() {
    log "🔒 Checking file permissions..."
    
    # Check .env file permissions
    if [ -f "/opt/daritana/.env" ]; then
        local perms=$(stat -c %a /opt/daritana/.env)
        if [ "$perms" = "600" ]; then
            add_score 5 "Proper .env file permissions (600)"
        else
            subtract_score 10 "Insecure .env file permissions ($perms), should be 600"
        fi
    else
        subtract_score 5 ".env file not found"
    fi
    
    # Check SSL certificate permissions
    if [ -f "/opt/daritana/ssl/daritana.com.key" ]; then
        local perms=$(stat -c %a /opt/daritana/ssl/daritana.com.key)
        if [ "$perms" = "600" ]; then
            add_score 5 "Proper SSL key permissions (600)"
        else
            subtract_score 10 "Insecure SSL key permissions ($perms), should be 600"
        fi
    fi
}

# Function to check firewall configuration
check_firewall() {
    log "🔥 Checking firewall configuration..."
    
    if command_exists ufw; then
        local status=$(ufw status | grep "Status: active")
        if [ -n "$status" ]; then
            add_score 10 "Firewall (UFW) is active"
            
            # Check specific rules
            local ssh_allowed=$(ufw status | grep "22/tcp.*ALLOW")
            if [ -n "$ssh_allowed" ]; then
                add_score 5 "SSH access properly configured"
            else
                subtract_score 5 "SSH access not properly configured"
            fi
            
            local http_allowed=$(ufw status | grep "80/tcp.*ALLOW")
            if [ -n "$http_allowed" ]; then
                add_score 2 "HTTP access allowed (needed for SSL redirect)"
            fi
            
            local https_allowed=$(ufw status | grep "443/tcp.*ALLOW")
            if [ -n "$https_allowed" ]; then
                add_score 3 "HTTPS access allowed"
            fi
        else
            subtract_score 20 "Firewall is not active"
        fi
    else
        subtract_score 15 "Firewall (UFW) not installed"
    fi
}

# Function to check SSL/TLS configuration
check_ssl_config() {
    log "🔐 Checking SSL/TLS configuration..."
    
    if [ -f "/opt/daritana/ssl/daritana.com.crt" ] && [ -f "/opt/daritana/ssl/daritana.com.key" ]; then
        add_score 5 "SSL certificates exist"
        
        # Check certificate expiration
        local expiry=$(openssl x509 -enddate -noout -in /opt/daritana/ssl/daritana.com.crt | cut -d= -f2)
        local expiry_date=$(date -d "$expiry" +%s)
        local current_date=$(date +%s)
        local days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            add_score 5 "SSL certificate valid for more than 30 days ($days_until_expiry days)"
        elif [ $days_until_expiry -gt 0 ]; then
            add_score 2 "SSL certificate valid but expiring soon ($days_until_expiry days)"
        else
            subtract_score 15 "SSL certificate has expired"
        fi
    else
        subtract_score 10 "SSL certificates not found"
    fi
}

# Function to check database security
check_database_security() {
    log "🗄️ Checking database security..."
    
    # Check PostgreSQL configuration
    if command_exists psql; then
        # Check if PostgreSQL is running
        if systemctl is-active --quiet postgresql; then
            add_score 5 "PostgreSQL service is running"
            
            # Check authentication method
            local auth_method=$(sudo -u postgres psql -c "SHOW hba_file;" | grep -v "hba_file" | xargs)
            if [ -f "$auth_method" ]; then
                local md5_count=$(grep -c "md5\|scram-sha-256" "$auth_method" 2>/dev/null || echo "0")
                if [ "$md5_count" -gt 0 ]; then
                    add_score 3 "PostgreSQL using secure authentication methods"
                else
                    subtract_score 5 "PostgreSQL not using secure authentication methods"
                fi
            fi
        else
            subtract_score 5 "PostgreSQL service not running"
        fi
    fi
    
    # Check Redis security
    if command_exists redis-cli; then
        if systemctl is-active --quiet redis-server; then
            add_score 3 "Redis service is running"
            
            # Check if Redis has password protection
            local redis_config="/etc/redis/redis.conf"
            if [ -f "$redis_config" ]; then
                local requirepass=$(grep -c "requirepass" "$redis_config")
                if [ "$requirepass" -gt 0 ]; then
                    add_score 5 "Redis password protection enabled"
                else
                    subtract_score 10 "Redis password protection not enabled"
                fi
            fi
        fi
    fi
}

# Function to check Docker security
check_docker_security() {
    log "🐳 Checking Docker security..."
    
    if command_exists docker; then
        add_score 3 "Docker is installed"
        
        # Check Docker daemon configuration
        local daemon_config="/etc/docker/daemon.json"
        if [ -f "$daemon_config" ]; then
            add_score 2 "Docker daemon configuration file exists"
            
            # Check for security settings
            if grep -q "userns-remap" "$daemon_config"; then
                add_score 3 "Docker user namespace remapping enabled"
            fi
            
            if grep -q "live-restore" "$daemon_config"; then
                add_score 2 "Docker live restore enabled"
            fi
        fi
        
        # Check running containers
        local running_containers=$(docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 2>/dev/null | wc -l)
        if [ "$running_containers" -gt 1 ]; then
            add_score 2 "Docker containers are running"
        fi
        
        # Check for privileged containers
        local privileged_containers=$(docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 2>/dev/null | grep -c "privileged" || echo "0")
        if [ "$privileged_containers" -gt 0 ]; then
            subtract_score 10 "Privileged containers detected (security risk)"
        fi
    else
        subtract_score 5 "Docker not installed"
    fi
}

# Function to check system updates
check_system_updates() {
    log "🔄 Checking system updates..."
    
    # Check if system is up to date
    local last_update=$(stat -c %Y /var/lib/apt/periodic/update-success-stamp 2>/dev/null || echo "0")
    local current_time=$(date +%s)
    local days_since_update=$(( (current_time - last_update) / 86400 ))
    
    if [ $days_since_update -lt 7 ]; then
        add_score 10 "System updated within last 7 days"
    elif [ $days_since_update -lt 30 ]; then
        add_score 5 "System updated within last 30 days"
    else
        subtract_score 10 "System not updated for $days_since_update days"
    fi
    
    # Check for available updates
    if command_exists apt; then
        local available_updates=$(apt list --upgradable 2>/dev/null | grep -c "upgradable" || echo "0")
        if [ "$available_updates" -eq 0 ]; then
            add_score 5 "No system updates available"
        else
            subtract_score 5 "$available_updates system updates available"
        fi
    fi
}

# Function to check user security
check_user_security() {
    log "👤 Checking user security..."
    
    # Check for users with UID 0 (other than root)
    local uid0_users=$(awk -F: '$3 == 0 && $1 != "root" {print $1}' /etc/passwd | wc -l)
    if [ "$uid0_users" -eq 0 ]; then
        add_score 5 "No unauthorized users with UID 0"
    else
        subtract_score 15 "Unauthorized users with UID 0 detected"
    fi
    
    # Check for users without password
    local no_password_users=$(awk -F: '$2 == "" {print $1}' /etc/shadow | wc -l)
    if [ "$no_password_users" -eq 0 ]; then
        add_score 5 "All users have passwords"
    else
        subtract_score 10 "$no_password_users users without passwords"
    fi
    
    # Check for expired passwords
    local expired_passwords=$(awk -F: '$5 != "" && $5 < 99999 {print $1}' /etc/shadow | wc -l)
    if [ "$expired_passwords" -eq 0 ]; then
        add_score 3 "No expired passwords"
    else
        add_score 2 "Password expiration policy enforced"
    fi
}

# Function to check service security
check_service_security() {
    log "🔧 Checking service security..."
    
    # Check for unnecessary services
    local unnecessary_services=("telnet" "rsh" "rlogin" "rexec" "tftp" "xinetd")
    local running_unnecessary=0
    
    for service in "${unnecessary_services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            running_unnecessary=$((running_unnecessary + 1))
        fi
    done
    
    if [ "$running_unnecessary" -eq 0 ]; then
        add_score 5 "No unnecessary network services running"
    else
        subtract_score 10 "$running_unnecessary unnecessary network services running"
    fi
    
    # Check SSH configuration
    if command_exists sshd; then
        local ssh_config="/etc/ssh/sshd_config"
        if [ -f "$ssh_config" ]; then
            # Check root login
            if grep -q "^PermitRootLogin no" "$ssh_config"; then
                add_score 5 "SSH root login disabled"
            else
                subtract_score 10 "SSH root login enabled"
            fi
            
            # Check password authentication
            if grep -q "^PasswordAuthentication no" "$ssh_config"; then
                add_score 5 "SSH password authentication disabled"
            else
                subtract_score 5 "SSH password authentication enabled"
            fi
            
            # Check protocol version
            if grep -q "^Protocol 2" "$ssh_config"; then
                add_score 3 "SSH protocol version 2 enforced"
            else
                subtract_score 5 "SSH protocol version 1 allowed"
            fi
        fi
    fi
}

# Function to check network security
check_network_security() {
    log "🌐 Checking network security..."
    
    # Check listening ports
    local listening_ports=$(netstat -tlnp 2>/dev/null | grep LISTEN | wc -l)
    if [ "$listening_ports" -lt 10 ]; then
        add_score 5 "Reasonable number of listening ports ($listening_ports)"
    else
        subtract_score 5 "High number of listening ports ($listening_ports)"
    fi
    
    # Check for open ports that shouldn't be open
    local dangerous_ports=("21" "23" "25" "110" "143" "445" "1433" "1521" "3306" "3389" "5432" "5900" "6379" "8080" "9090")
    local open_dangerous=0
    
    for port in "${dangerous_ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            open_dangerous=$((open_dangerous + 1))
        fi
    done
    
    if [ "$open_dangerous" -eq 0 ]; then
        add_score 5 "No dangerous ports open to external access"
    else
        subtract_score 10 "$open_dangerous dangerous ports open to external access"
    fi
}

# Function to check log monitoring
check_log_monitoring() {
    log "📊 Checking log monitoring..."
    
    # Check if log files exist and are writable
    local log_files=("/opt/daritana/logs/app.log" "/var/log/nginx/access.log" "/var/log/nginx/error.log")
    local log_files_exist=0
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ] && [ -w "$log_file" ]; then
            log_files_exist=$((log_files_exist + 1))
        fi
    done
    
    if [ "$log_files_exist" -eq "${#log_files[@]}" ]; then
        add_score 5 "All required log files exist and are writable"
    else
        subtract_score 5 "Some log files missing or not writable"
    fi
    
    # Check log rotation
    if [ -f "/etc/logrotate.d/daritana" ]; then
        add_score 3 "Log rotation configured for Daritana"
    else
        subtract_score 3 "Log rotation not configured for Daritana"
    fi
}

# Function to check backup configuration
check_backup_config() {
    log "💾 Checking backup configuration..."
    
    # Check backup script
    if [ -f "/opt/daritana/backup.sh" ] && [ -x "/opt/daritana/backup.sh" ]; then
        add_score 5 "Backup script exists and is executable"
    else
        subtract_score 5 "Backup script missing or not executable"
    fi
    
    # Check backup directory
    if [ -d "/opt/daritana/backups" ]; then
        add_score 3 "Backup directory exists"
        
        # Check for recent backups
        local recent_backups=$(find /opt/daritana/backups -name "*.gz" -mtime -7 2>/dev/null | wc -l)
        if [ "$recent_backups" -gt 0 ]; then
            add_score 5 "Recent backups exist (within 7 days)"
        else
            subtract_score 5 "No recent backups found"
        fi
    else
        subtract_score 3 "Backup directory missing"
    fi
    
    # Check cron job for backups
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        add_score 3 "Automated backup cron job configured"
    else
        subtract_score 3 "Automated backup cron job not configured"
    fi
}

# Function to check environment variables
check_environment_variables() {
    log "🔑 Checking environment variables..."
    
    if [ -f "/opt/daritana/.env" ]; then
        # Check for sensitive variables
        local sensitive_vars=("JWT_SECRET" "STRIPE_SECRET_KEY" "SENDGRID_API_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
        local secure_vars=0
        
        for var in "${sensitive_vars[@]}"; do
            if grep -q "^$var=" "/opt/daritana/.env"; then
                local value=$(grep "^$var=" "/opt/daritana/.env" | cut -d'=' -f2)
                if [ "$value" != "your_${var,,}_here" ] && [ "$value" != "" ]; then
                    secure_vars=$((secure_vars + 1))
                fi
            fi
        done
        
        if [ "$secure_vars" -eq "${#sensitive_vars[@]}" ]; then
            add_score 10 "All sensitive environment variables are properly configured"
        else
            subtract_score 10 "Some sensitive environment variables not properly configured"
        fi
    else
        subtract_score 5 "Environment file not found"
    fi
}

# Function to check monitoring setup
check_monitoring_setup() {
    log "📈 Checking monitoring setup..."
    
    # Check Prometheus
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "daritana-prometheus"; then
        add_score 5 "Prometheus monitoring container running"
    else
        subtract_score 5 "Prometheus monitoring container not running"
    fi
    
    # Check Grafana
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "daritana-grafana"; then
        add_score 5 "Grafana monitoring container running"
    else
        subtract_score 5 "Grafana monitoring container not running"
    fi
    
    # Check health check endpoint
    if curl -s -f "http://localhost/health" >/dev/null 2>&1; then
        add_score 3 "Health check endpoint responding"
    else
        subtract_score 3 "Health check endpoint not responding"
    fi
}

# Function to generate security report
generate_report() {
    log "📋 Generating security report..."
    
    # Calculate percentage
    local percentage=$(( (SCORE + MAX_SCORE) * 100 / (MAX_SCORE * 2) ))
    
    # Determine security level
    local security_level
    if [ $percentage -ge 90 ]; then
        security_level="🟢 EXCELLENT"
    elif [ $percentage -ge 80 ]; then
        security_level="🟡 GOOD"
    elif [ $percentage -ge 70 ]; then
        security_level="🟠 FAIR"
    elif [ $percentage -ge 60 ]; then
        security_level="🔴 POOR"
    else
        security_level="⚫ CRITICAL"
    fi
    
    # Generate report header
    cat > "$REPORT_FILE" << EOF
================================================================================
                        DARITANA SECURITY AUDIT REPORT
================================================================================
Date: $(date)
System: $(hostname)
Auditor: Security Audit Script
================================================================================

SECURITY SCORE: $SCORE / $MAX_SCORE ($percentage%)
SECURITY LEVEL: $security_level

================================================================================
DETAILED FINDINGS:
EOF
    
    # Add recommendations
    cat >> "$REPORT_FILE" << EOF

================================================================================
RECOMMENDATIONS:
EOF
    
    if [ $percentage -lt 80 ]; then
        cat >> "$REPORT_FILE" << EOF
🔴 IMMEDIATE ACTIONS REQUIRED:
- Review and fix all security issues identified above
- Update system packages
- Configure firewall properly
- Secure all services
- Review user permissions

🟡 RECOMMENDED IMPROVEMENTS:
- Implement intrusion detection system
- Set up automated security scanning
- Configure log monitoring and alerting
- Regular security training for team
- Implement security incident response plan

🟢 BEST PRACTICES:
- Regular security audits
- Automated vulnerability scanning
- Security monitoring and alerting
- Regular backup testing
- Incident response planning
EOF
    else
        cat >> "$REPORT_FILE" << EOF
🟢 EXCELLENT SECURITY POSTURE:
- Continue current security practices
- Regular security reviews
- Stay updated with security patches
- Monitor for new threats
- Regular security training
EOF
    fi
    
    cat >> "$REPORT_FILE" << EOF

================================================================================
NEXT STEPS:
1. Review all findings above
2. Prioritize fixes based on risk level
3. Implement security improvements
4. Schedule follow-up audit
5. Document security procedures

================================================================================
Report generated by Daritana Security Audit Script
EOF
    
    log "Security report generated: $REPORT_FILE"
}

# Function to display summary
display_summary() {
    local percentage=$(( (SCORE + MAX_SCORE) * 100 / (MAX_SCORE * 2) ))
    
    echo -e "\n${BLUE}================================================================================${NC}"
    echo -e "${BLUE}                        SECURITY AUDIT SUMMARY${NC}"
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "Date: $(date)"
    echo -e "System: $(hostname)"
    echo -e "Security Score: $SCORE / $MAX_SCORE ($percentage%)"
    
    if [ $percentage -ge 90 ]; then
        echo -e "Security Level: ${GREEN}🟢 EXCELLENT${NC}"
    elif [ $percentage -ge 80 ]; then
        echo -e "Security Level: ${GREEN}🟡 GOOD${NC}"
    elif [ $percentage -ge 70 ]; then
        echo -e "Security Level: ${YELLOW}🟠 FAIR${NC}"
    elif [ $percentage -ge 60 ]; then
        echo -e "Security Level: ${RED}🔴 POOR${NC}"
    else
        echo -e "Security Level: ${RED}⚫ CRITICAL${NC}"
    fi
    
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "Detailed report: $REPORT_FILE"
    echo -e "${BLUE}================================================================================${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🔒 Starting Daritana Security Audit...${NC}"
    
    # Initialize score
    SCORE=0
    
    # Run all security checks
    check_file_permissions
    check_firewall
    check_ssl_config
    check_database_security
    check_docker_security
    check_system_updates
    check_user_security
    check_service_security
    check_network_security
    check_log_monitoring
    check_backup_config
    check_environment_variables
    check_monitoring_setup
    
    # Generate report and display summary
    generate_report
    display_summary
    
    echo -e "${GREEN}✅ Security audit completed!${NC}"
}

# Run main function
main "$@"
