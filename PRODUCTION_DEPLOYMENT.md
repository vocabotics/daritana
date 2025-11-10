# 🚀 PRODUCTION DEPLOYMENT GUIDE
**Daritana Architect Management Platform**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Environment Configuration
- [ ] Copy `.env.production` to `.env` and fill in all values
- [ ] Copy `backend/.env.production` to `backend/.env` and configure
- [ ] Generate strong secrets for JWT, SESSION, CSRF
- [ ] Configure database connection string
- [ ] Set up Redis connection
- [ ] Add production API keys (OpenRouter, OAuth, Stripe, etc.)

### ✅ Security
- [ ] Rotate all API keys from development
- [ ] Generate SSL certificates (Let's Encrypt recommended)
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS/TLS
- [ ] Set secure session cookies
- [ ] Configure Content Security Policy

### ✅ Database
- [ ] Run database migrations: `cd backend && npx prisma migrate deploy`
- [ ] Seed initial data if needed
- [ ] Set up automated backups
- [ ] Configure connection pooling

### ✅ Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure DataDog/New Relic for monitoring
- [ ] Enable application logs
- [ ] Set up uptime monitoring

### ✅ Performance
- [ ] Enable Redis caching
- [ ] Configure CDN (CloudFlare recommended)
- [ ] Optimize images and assets
- [ ] Enable gzip/brotli compression

---

## 🐳 DOCKER DEPLOYMENT

### Option 1: Docker Compose (Recommended for small deployments)

```bash
# 1. Clone repository
git clone https://github.com/your-org/daritana.git
cd daritana

# 2. Configure environment
cp .env.production .env
cp backend/.env.production backend/.env
# Edit .env files with your production values

# 3. Build and start services
docker-compose -f docker-compose.production.yml up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Check status
docker-compose ps
docker-compose logs -f
```

### Option 2: Kubernetes (Recommended for large deployments)

```bash
# 1. Build and push images
docker build -t daritana-frontend:latest .
docker build -t daritana-backend:latest ./backend

docker push your-registry/daritana-frontend:latest
docker push your-registry/daritana-backend:latest

# 2. Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify deployment
kubectl get pods -n daritana
kubectl logs -f deployment/backend -n daritana
```

---

## ☁️ CLOUD DEPLOYMENT

### AWS Deployment

#### Using ECS (Elastic Container Service)

```bash
# 1. Install AWS CLI and configure
aws configure

# 2. Create ECR repositories
aws ecr create-repository --repository-name daritana-frontend
aws ecr create-repository --repository-name daritana-backend

# 3. Push images to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t daritana-frontend .
docker tag daritana-frontend:latest your-account.dkr.ecr.ap-southeast-1.amazonaws.com/daritana-frontend:latest
docker push your-account.dkr.ecr.ap-southeast-1.amazonaws.com/daritana-frontend:latest

docker build -t daritana-backend ./backend
docker tag daritana-backend:latest your-account.dkr.ecr.ap-southeast-1.amazonaws.com/daritana-backend:latest
docker push your-account.dkr.ecr.ap-southeast-1.amazonaws.com/daritana-backend:latest

# 4. Create ECS cluster and services
# Use AWS Console or CloudFormation templates
```

#### Using Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize application
eb init -p docker daritana

# 3. Create environment
eb create daritana-prod --database.engine postgres

# 4. Deploy
eb deploy

# 5. Open application
eb open
```

### Vercel Deployment (Frontend Only)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# 3. Configure environment variables in Vercel dashboard
# - VITE_API_URL
# - VITE_OPENROUTER_API_KEY
# - All other VITE_* variables
```

### Railway.app Deployment (Full Stack)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add

# 5. Deploy
railway up

# 6. Configure environment variables
railway variables set VITE_API_URL=https://your-backend.railway.app
```

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### 1. Database Setup

```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed data
npx prisma db seed
```

### 2. SSL/TLS Configuration

#### Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d daritana.com -d www.daritana.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### 3. Nginx Configuration

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx
```

### 4. Monitoring Setup

#### Sentry Error Tracking

1. Create account at sentry.io
2. Create new project
3. Copy DSN and add to environment:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

#### DataDog Monitoring

1. Create account at datadoghq.com
2. Install DataDog agent
3. Configure application:
   ```bash
   DD_API_KEY=your-datadog-api-key
   DD_SITE=datadoghq.com
   ```

---

## 🔐 SECURITY HARDENING

### 1. Generate Secure Secrets

```bash
# JWT Secret (64 characters)
openssl rand -base64 64

# Session Secret
openssl rand -base64 64

# CSRF Secret
openssl rand -base64 64
```

### 2. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if using direct server access)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### 3. Security Headers

Already configured in `nginx.production.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security (HSTS)

---

## 📊 MONITORING & MAINTENANCE

### Health Checks

```bash
# Frontend health check
curl https://daritana.com/health

# Backend health check
curl https://api.daritana.com/health

# Database check
docker-compose exec postgres pg_isready
```

### Logs

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow specific service
docker-compose logs -f --tail=50 backend
```

### Backups

```bash
# Automated daily backup
# Add to crontab: crontab -e
0 2 * * * /opt/daritana/scripts/backup.sh

# Manual backup
docker-compose exec postgres pg_dump -U daritana daritana_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U daritana daritana_prod < backup_20251109.sql
```

---

## 🚨 TROUBLESHOOTING

### Issue: Frontend can't connect to backend

**Solution:**
- Check CORS configuration in `backend/.env`
- Verify `VITE_API_URL` in frontend `.env`
- Check nginx proxy configuration

### Issue: Database connection failed

**Solution:**
- Verify `DATABASE_URL` in `backend/.env`
- Check PostgreSQL is running: `docker-compose ps`
- Test connection: `docker-compose exec backend npx prisma db pull`

### Issue: High memory usage

**Solution:**
- Enable Redis caching
- Configure connection pooling in Prisma
- Optimize database queries
- Enable nginx gzip compression

### Issue: Slow page loads

**Solution:**
- Enable CDN (CloudFlare)
- Optimize images
- Enable brotli compression
- Configure browser caching

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Enable CDN

**CloudFlare (Recommended):**
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable caching and minification
5. Configure SSL/TLS (Full mode)

### 2. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Analyze and vacuum
ANALYZE;
VACUUM ANALYZE;
```

### 3. Redis Caching

Already configured in backend. Verify it's working:
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions (Already Configured)

Pipeline automatically:
1. ✅ Runs tests on PR
2. ✅ Builds Docker images on merge to main
3. ✅ Deploys to production

### Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Verify
docker-compose ps
```

---

## 📞 SUPPORT

**Production Issues:**
- Email: support@daritana.com
- Slack: #daritana-production
- On-call: +60-XXX-XXXXXXX

**Monitoring Dashboards:**
- Sentry: https://sentry.io/daritana
- DataDog: https://app.datadoghq.com/daritana
- Status Page: https://status.daritana.com

---

## 📝 NOTES

### Production URLs
- **Frontend**: https://daritana.com
- **Backend API**: https://api.daritana.com
- **Admin Panel**: https://daritana.com/admin

### Deployment Schedule
- **Staging**: Continuous (every merge to develop)
- **Production**: Weekly (Sundays 2AM MYT)
- **Hotfixes**: As needed (with approval)

### Rollback Procedure
```bash
# 1. Identify last working version
docker images | grep daritana

# 2. Tag as rollback
docker tag daritana-backend:sha-abc123 daritana-backend:rollback

# 3. Deploy rollback
docker-compose -f docker-compose.production.yml up -d

# 4. Notify team
# Send notification to #daritana-prod channel
```

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
**Maintainer**: DevOps Team
