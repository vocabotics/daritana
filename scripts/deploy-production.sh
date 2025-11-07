#!/bin/bash

# Daritana Production Deployment Script
# This script sets up a complete production environment on Ubuntu 22.04 LTS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"daritana.com"}
EMAIL=${2:-"admin@daritana.com"}
DB_PASSWORD=${3:-$(openssl rand -base64 32)}
JWT_SECRET=${4:-$(openssl rand -base64 64)}

# Logging
LOG_FILE="/var/log/daritana-deployment.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${BLUE}🚀 Starting Daritana Production Deployment${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"
echo -e "${BLUE}Email: $EMAIL${NC}"
echo -e "${BLUE}Log file: $LOG_FILE${NC}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}This script must be run as root${NC}"
        exit 1
    fi
}

# Function to update system
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
}

# Function to install Docker
install_docker() {
    log "Installing Docker..."
    if ! command_exists docker; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
    else
        log "Docker already installed"
    fi
}

# Function to install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    if ! command_exists docker-compose; then
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        log "Docker Compose already installed"
    fi
}

# Function to install Nginx
install_nginx() {
    log "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
}

# Function to install Certbot
install_certbot() {
    log "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
}

# Function to install PostgreSQL
install_postgresql() {
    log "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE daritana;"
    sudo -u postgres psql -c "CREATE USER daritana WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE daritana TO daritana;"
    sudo -u postgres psql -c "ALTER USER daritana CREATEDB;"
}

# Function to install Redis
install_redis() {
    log "Installing Redis..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
}

# Function to configure firewall
configure_firewall() {
    log "Configuring firewall..."
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8080/tcp
    ufw allow 9090/tcp
    ufw reload
}

# Function to create application user
create_app_user() {
    log "Creating application user..."
    useradd -m -s /bin/bash daritana || true
    usermod -aG docker daritana
    usermod -aG sudo daritana
    echo "daritana ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/daritana
}

# Function to setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    mkdir -p /opt/daritana
    chown daritana:daritana /opt/daritana
    chmod 755 /opt/daritana
}

# Function to create environment file
create_env_file() {
    log "Creating environment file..."
    cat > /opt/daritana/.env << EOF
# Daritana Production Environment Configuration

# Application
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://daritana:$DB_PASSWORD@localhost:5432/daritana
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_ACQUIRE_TIMEOUT=30000
DB_CREATE_TIMEOUT=30000
DB_DESTROY_TIMEOUT=5000
DB_IDLE_TIMEOUT=30000
DB_REAP_INTERVAL=1000
DB_CREATE_RETRY_INTERVAL=200

# Security
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=daritana.com
JWT_AUDIENCE=daritana-users
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_MAX=100

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@daritana.com
FROM_NAME=Daritana
SENDGRID_WELCOME_TEMPLATE_ID=your_welcome_template_id
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=your_password_reset_template_id
SENDGRID_INVITATION_TEMPLATE_ID=your_invitation_template_id
SENDGRID_PAYMENT_CONFIRMATION_TEMPLATE_ID=your_payment_confirmation_template_id
SENDGRID_SUBSCRIPTION_UPDATE_TEMPLATE_ID=your_subscription_update_template_id

# Payment (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_CURRENCY=usd

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,zip,rar,7z,mp4,avi,mov,wmv,flv

# Monitoring
LOG_LEVEL=info
LOG_FILE=/opt/daritana/logs/app.log
LOG_MAX_SIZE=10485760
LOG_MAX_FILES=5
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_ENDPOINT=/metrics
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Performance
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
MEMORY_CACHE_MAX=100
MEMORY_CACHE_TTL=300

# Backup
DB_BACKUP_ENABLED=true
DB_BACKUP_SCHEDULE=0 2 * * *
DB_BACKUP_RETENTION=30
DB_BACKUP_ENCRYPTION=true
FILE_BACKUP_ENABLED=true
FILE_BACKUP_SCHEDULE=0 3 * * *
FILE_BACKUP_RETENTION=90

# AI & Machine Learning
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index
LANGCHAIN_ENABLED=true
LANGCHAIN_TRACING=false

# External Services
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://$DOMAIN/auth/google/callback
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://$DOMAIN/auth/microsoft/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://$DOMAIN/auth/github/callback

# Feature Flags
FEATURE_AI_ASSISTANT=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_REAL_TIME_COLLABORATION=true
FEATURE_MOBILE_APP=true
FEATURE_API_RATE_LIMITING=true
FEATURE_AUDIT_LOGGING=true

# Maintenance
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=System is under maintenance. Please try again later.
MAINTENANCE_ALLOWED_IPS=127.0.0.1
SCHEDULED_MAINTENANCE_ENABLED=false
SCHEDULED_MAINTENANCE_SCHEDULE=0 1 * * 0
SCHEDULED_MAINTENANCE_DURATION=3600000

# CORS
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
EOF

    chown daritana:daritana /opt/daritana/.env
    chmod 600 /opt/daritana/.env
}

# Function to create Docker Compose file
create_docker_compose() {
    log "Creating Docker Compose file..."
    cat > /opt/daritana/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Frontend
  frontend:
    image: daritana-frontend:latest
    container_name: daritana-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=https://api.daritana.com
    volumes:
      - ./logs:/app/logs
    networks:
      - daritana-network

  # Backend API
  backend:
    image: daritana-backend:latest
    container_name: daritana-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - daritana-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: daritana-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=daritana
      - POSTGRES_USER=daritana
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - daritana-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: daritana-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - daritana-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: daritana-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - daritana-network

  # Monitoring (Prometheus)
  prometheus:
    image: prom/prometheus:latest
    container_name: daritana-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - daritana-network

  # Monitoring (Grafana)
  grafana:
    image: grafana/grafana:latest
    container_name: daritana-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    networks:
      - daritana-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  daritana-network:
    driver: bridge
EOF

    chown daritana:daritana /opt/daritana/docker-compose.yml
}

# Function to create Nginx configuration
create_nginx_config() {
    log "Creating Nginx configuration..."
    mkdir -p /opt/daritana/nginx/conf.d
    
    # Main Nginx config
    cat > /opt/daritana/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-src 'self' https:;" always;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

    # Frontend configuration
    cat > /opt/daritana/nginx/conf.d/frontend.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/$DOMAIN.crt;
    ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    chown -R daritana:daritana /opt/daritana/nginx
}

# Function to create monitoring configuration
create_monitoring_config() {
    log "Creating monitoring configuration..."
    mkdir -p /opt/daritana/monitoring/grafana/provisioning/datasources
    mkdir -p /opt/daritana/monitoring/grafana/provisioning/dashboards
    
    # Prometheus configuration
    cat > /opt/daritana/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'daritana-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'daritana-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF

    # Grafana datasource
    cat > /opt/daritana/monitoring/grafana/provisioning/datasources/datasource.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    chown -R daritana:daritana /opt/daritana/monitoring
}

# Function to create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    cat > /etc/systemd/system/daritana.service << 'EOF'
[Unit]
Description=Daritana Application Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/daritana
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable daritana.service
}

# Function to create backup script
create_backup_script() {
    log "Creating backup script..."
    cat > /opt/daritana/backup.sh << 'EOF'
#!/bin/bash

# Daritana Backup Script
BACKUP_DIR="/opt/daritana/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
docker exec daritana-postgres pg_dump -U daritana daritana | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# File backup
echo "Creating file backup..."
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C /opt/daritana uploads logs

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF

    chmod +x /opt/daritana/backup.sh
    chown daritana:daritana /opt/daritana/backup.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/daritana/backup.sh") | crontab -
}

# Function to create log rotation
create_log_rotation() {
    log "Creating log rotation configuration..."
    cat > /etc/logrotate.d/daritana << 'EOF'
/opt/daritana/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 daritana daritana
    postrotate
        systemctl reload daritana.service
    endscript
}
EOF
}

# Function to setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    mkdir -p /opt/daritana/ssl
    
    # Generate self-signed certificate for initial setup
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /opt/daritana/ssl/$DOMAIN.key \
        -out /opt/daritana/ssl/$DOMAIN.crt \
        -subj "/C=US/ST=State/L=City/O=Daritana/CN=$DOMAIN"
    
    chown -R daritana:daritana /opt/daritana/ssl
    chmod 600 /opt/daritana/ssl/$DOMAIN.key
    chmod 644 /opt/daritana/ssl/$DOMAIN.crt
    
    # Setup Let's Encrypt (commented out for initial deployment)
    # certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
}

# Function to create directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p /opt/daritana/{logs,uploads,backups,ssl}
    chown -R daritana:daritana /opt/daritana
    chmod -R 755 /opt/daritana
}

# Function to finalize setup
finalize_setup() {
    log "Finalizing setup..."
    
    # Set proper permissions
    chown -R daritana:daritana /opt/daritana
    chmod -R 755 /opt/daritana
    chmod 600 /opt/daritana/.env
    
    # Create log files
    touch /opt/daritana/logs/app.log
    touch /opt/daritana/logs/nginx/access.log
    touch /opt/daritana/logs/nginx/error.log
    chown -R daritana:daritana /opt/daritana/logs
    
    log "Setup completed successfully!"
}

# Main execution
main() {
    echo -e "${GREEN}Starting Daritana production deployment...${NC}"
    
    check_root
    update_system
    install_docker
    install_docker_compose
    install_nginx
    install_certbot
    install_postgresql
    install_redis
    configure_firewall
    create_app_user
    setup_app_directory
    create_env_file
    create_docker_compose
    create_nginx_config
    create_monitoring_config
    create_systemd_service
    create_backup_script
    create_log_rotation
    setup_ssl
    create_directories
    finalize_setup
    
    echo -e "${GREEN}✅ Daritana production deployment completed successfully!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "${YELLOW}1. Update /opt/daritana/.env with your actual API keys${NC}"
    echo -e "${YELLOW}2. Build and deploy your Docker images${NC}"
    echo -e "${YELLOW}3. Start the services: systemctl start daritana${NC}"
    echo -e "${YELLOW}4. Setup Let's Encrypt SSL: certbot --nginx -d $DOMAIN${NC}"
    echo -e "${YELLOW}5. Access your application at https://$DOMAIN${NC}"
    echo -e "${YELLOW}6. Access Grafana at https://$DOMAIN:3001 (admin/admin)${NC}"
    echo -e "${YELLOW}7. Access Prometheus at https://$DOMAIN:9090${NC}"
}

# Run main function
main "$@"
