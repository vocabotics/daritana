# 🚀 Daritana Production Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Optimization](#performance-optimization)
9. [Security Checklist](#security-checklist)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Server**: Ubuntu 22.04 LTS or CentOS 8+
- **CPU**: Minimum 4 cores, recommended 8 cores
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 100GB SSD
- **Network**: 100 Mbps minimum bandwidth

### Software Requirements
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+ (for build process)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Nginx (if not using Docker)
- Git

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/daritana.git
cd daritana
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `.env` file with production values:
```env
# Critical Production Settings
NODE_ENV=production
VITE_API_URL=https://api.daritana.com/api
VITE_SOCKET_URL=https://api.daritana.com

# Database
DB_USER=daritana_prod
DB_PASSWORD=<strong-password>
DATABASE_URL=postgresql://daritana_prod:<password>@localhost:5432/daritana

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Redis
REDIS_PASSWORD=<strong-redis-password>
```

### 4. Generate Secrets
```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For SESSION_SECRET
```

## 💾 Database Setup

### Using Docker
```bash
# Start PostgreSQL container
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migrate
```

### Manual PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE USER daritana_prod WITH PASSWORD 'your-password';
CREATE DATABASE daritana OWNER daritana_prod;
GRANT ALL PRIVILEGES ON DATABASE daritana TO daritana_prod;
\q

# Run migrations
cd backend
npm run migrate
```

## 🚀 Application Deployment

### Option 1: Docker Deployment (Recommended)

#### Build and Deploy
```bash
# Build all services
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

#### Update Deployment
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.production.yml exec backend npm run migrate
```

### Option 2: Manual Deployment

#### Backend Deployment
```bash
cd backend

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name daritana-backend
pm2 save
pm2 startup
```

#### Frontend Deployment
```bash
cd ../

# Install dependencies
npm ci

# Build for production
npm run build

# Serve with Nginx
sudo cp -r dist/* /var/www/daritana/
```

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt with Docker
```bash
# Initial certificate request
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d daritana.com -d www.daritana.com \
  --email admin@daritana.com \
  --agree-tos \
  --no-eff-email

# Restart Nginx to load certificates
docker-compose -f docker-compose.production.yml restart nginx
```

### Manual SSL Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d daritana.com -d www.daritana.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# Monitor resource usage
docker stats

# Health checks
curl https://api.daritana.com/health
```

### Setup Monitoring Stack
```yaml
# Add to docker-compose.production.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Log Aggregation
```bash
# Setup ELK Stack (optional)
docker run -d --name elasticsearch elasticsearch:8.10.0
docker run -d --name logstash logstash:8.10.0
docker run -d --name kibana kibana:8.10.0
```

## 💾 Backup & Recovery

### Automated Backups
```bash
# Create backup script
cat > /opt/daritana/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/daritana"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U daritana_prod daritana > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/daritana/backup.sh

# Add to crontab
echo "0 2 * * * /opt/daritana/backup.sh" | crontab -
```

### Recovery Procedure
```bash
# Restore database
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U daritana_prod daritana < backup.sql

# Restore files
tar -xzf uploads_backup.tar.gz -C /
```

## ⚡ Performance Optimization

### 1. Enable Redis Caching
```bash
# Verify Redis is running
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

### 2. Configure CDN
```nginx
# Add to nginx.conf
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_users_email ON users(email);

-- Analyze tables
ANALYZE projects;
ANALYZE tasks;
ANALYZE users;
```

### 4. Enable Compression
```nginx
# Already configured in nginx.production.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 🔐 Security Checklist

### Pre-Deployment
- [ ] Change all default passwords
- [ ] Generate strong secrets for JWT
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Disable debug mode
- [ ] Remove development dependencies
- [ ] Scan for vulnerabilities

### Firewall Configuration
```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### Security Headers
```nginx
# Already configured in nginx.production.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.production.yml logs postgres

# Test connection
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U daritana_prod -d daritana -c "SELECT 1"
```

#### Backend Not Starting
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Check environment variables
docker-compose -f docker-compose.production.yml exec backend env

# Rebuild if needed
docker-compose -f docker-compose.production.yml build --no-cache backend
```

#### Frontend Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci
npm run build
```

#### SSL Certificate Issues
```bash
# Renew certificate manually
docker-compose -f docker-compose.production.yml run --rm certbot renew

# Check certificate expiry
echo | openssl s_client -servername daritana.com -connect daritana.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Performance Issues
```bash
# Check resource usage
docker stats
htop

# Check database slow queries
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U daritana_prod -d daritana -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"

# Clear Redis cache
docker-compose -f docker-compose.production.yml exec redis redis-cli FLUSHALL
```

## 📝 Maintenance

### Regular Tasks
- **Daily**: Check logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies, run security scans
- **Quarterly**: Review and rotate secrets

### Update Procedure
```bash
# 1. Backup everything
./backup.sh

# 2. Pull updates
git pull origin main

# 3. Update dependencies
npm update
cd backend && npm update

# 4. Rebuild and deploy
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.production.yml exec backend npm run migrate

# 6. Verify
curl https://api.daritana.com/health
```

## 🎯 Production Readiness Checklist

### Infrastructure
- [ ] Server provisioned and configured
- [ ] Domain name configured
- [ ] SSL certificates installed
- [ ] CDN configured (optional)
- [ ] Backup system in place

### Application
- [ ] Environment variables set
- [ ] Database migrated and seeded
- [ ] All services running
- [ ] Health checks passing
- [ ] Monitoring configured

### Security
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Secrets rotated

### Performance
- [ ] Caching enabled
- [ ] Compression enabled
- [ ] Database indexed
- [ ] Static assets optimized

## 📞 Support

For deployment assistance:
- Documentation: https://docs.daritana.com
- Support Email: support@daritana.com
- Emergency: +60-123-456-789

---

**Last Updated**: December 2024
**Version**: 1.0.0