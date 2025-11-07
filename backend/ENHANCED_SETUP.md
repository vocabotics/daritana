# Enhanced Backend Setup Guide

## 🚀 Overview

This guide covers the setup for the enhanced multi-tenant Daritana backend with the following new features:

- ✅ Multi-tenant authentication with organization context
- ✅ Organization member invitation system
- ✅ Enhanced project management with team assignments
- ✅ Project timeline and milestone tracking
- ✅ Cloud storage integration (AWS S3)
- ✅ Dashboard widget persistence
- ✅ Real-time WebSocket notifications
- ✅ Comprehensive permission system

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- AWS Account (for S3 storage)
- SMTP Server (for email invitations)

## 🔧 Environment Configuration

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE daritana_dev;
CREATE USER daritana_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE daritana_dev TO daritana_user;
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://daritana_user:your_password@localhost:5432/daritana_dev"

# JWT Authentication
JWT_SECRET="your_super_secure_jwt_secret_key_here"

# Server Configuration
PORT=8080
NODE_ENV=development
FRONTEND_URL="http://localhost:5174"
CORS_ORIGIN="http://localhost:5174,http://127.0.0.1:5174"

# AWS S3 Configuration (Optional - for cloud storage)
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="daritana-files"

# Email Configuration (Optional - for invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="noreply@daritana.com"

# Redis (Optional - for caching and sessions)
REDIS_URL="redis://localhost:6379"
```

### 3. AWS S3 Setup (Optional)

If you want to enable cloud storage:

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 permissions
3. Get access keys and update `.env`
4. Configure bucket CORS policy:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5174"],
        "ExposeHeaders": []
    }
]
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Migration

Generate and apply database schema:

```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations (in production)
npx prisma migrate deploy

# OR reset database (development only)
npx prisma migrate reset --force
```

### 3. Seed Database (Optional)

```bash
# Run basic seed
npx tsx prisma/seed-simple.ts

# OR run full seed with sample data
npx tsx prisma/seed.ts
```

## 🚀 Starting the Server

### Option 1: Enhanced Server (Recommended)

```bash
# Start enhanced server with all new features
node start-enhanced.js

# OR directly with tsx
npx tsx src/enhanced-server.ts
```

### Option 2: Development Mode

```bash
# Start with auto-reload
npm run dev

# OR start enhanced version
npm run dev:enhanced
```

### Option 3: Production Mode

```bash
# Build and start
npm run build
npm start
```

## 🧪 Testing the Implementation

Run the comprehensive test suite:

```bash
# Run all tests
node test-implementation.js

# OR run specific feature tests
npm run test:enhanced
```

Expected test results:
- ✅ Authentication System
- ✅ Organization Management  
- ✅ Invitation System
- ✅ Project Management
- ✅ Team Management
- ✅ Timeline Management
- ✅ Dashboard System
- ✅ File Upload System

## 📡 API Endpoints

### Enhanced Authentication

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/organization/switch/:organizationId
```

### Organization Management

```
GET    /api/organizations/:id/members
POST   /api/organizations/:id/members
PUT    /api/organizations/:id/members/:memberId
DELETE /api/organizations/:id/members/:memberId
GET    /api/organizations/:id/members/stats
```

### Invitation System

```
POST   /api/invitations/invite
GET    /api/invitations
POST   /api/invitations/accept/:token
DELETE /api/invitations/:id
POST   /api/invitations/:id/resend
```

### Enhanced Projects

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

# Team Management
GET    /api/projects/:id/members
POST   /api/projects/:id/members
PUT    /api/projects/:id/members/:memberId
DELETE /api/projects/:id/members/:memberId
POST   /api/projects/:id/members/bulk

# Timeline & Milestones
GET    /api/projects/:id/timeline
POST   /api/projects/:id/timeline
PUT    /api/projects/:id/timeline/:timelineId
DELETE /api/projects/:id/timeline/:timelineId

GET    /api/projects/:id/milestones
POST   /api/projects/:id/milestones
PUT    /api/projects/:id/milestones/:milestoneId
DELETE /api/projects/:id/milestones/:milestoneId

GET    /api/projects/:id/progress
```

### File Management

```
POST   /api/files/upload
POST   /api/files/upload-url
GET    /api/files
GET    /api/files/:id
DELETE /api/files/:id
GET    /api/files/stats
```

### Dashboard System

```
GET    /api/dashboard/config
PUT    /api/dashboard/config
GET    /api/dashboard/data
```

## 🔌 WebSocket Events

### Connection & Authentication

```javascript
// Client connects and authenticates
socket.emit('authenticate', authToken)
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data)
})
```

### Real-time Collaboration

```javascript
// Join organization/project rooms
socket.emit('join_organization', organizationId)
socket.emit('join_project', projectId)

// Typing indicators
socket.emit('typing_start', { projectId })
socket.emit('typing_stop', { projectId })

// Cursor tracking
socket.emit('cursor_move', { x, y, projectId })

// Presence updates
socket.emit('update_presence', 'online')
```

### Notifications

```javascript
// Receive notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification)
})

// Real-time updates
socket.on('resource_update', (update) => {
  console.log('Resource updated:', update)
})

// Presence updates
socket.on('presence_update', (presence) => {
  console.log('User presence:', presence)
})
```

## 🔒 Security Features

### Multi-Tenant Authentication

- JWT tokens with organization context
- Session persistence across organization switches
- Role-based access control with 12+ roles
- Granular permission system

### Data Isolation

- Organization-scoped data queries
- Project-level access controls
- User permission validation
- Audit logging for all operations

### File Security

- Pre-signed URLs for secure access
- Organization-scoped storage
- File type validation
- Size limits and quotas

## 📊 Monitoring & Debugging

### Health Checks

```bash
# Server health
curl http://localhost:8080/health

# Database connection
curl http://localhost:8080/api/system/status
```

### Logs

- Application logs: `backend/logs/`
- Database queries: Enable in `.env` with `NODE_ENV=development`
- WebSocket events: Check browser console

### Performance Monitoring

- Request rate limiting: 1000 requests/15 minutes
- File upload limits: 100MB per file
- WebSocket connection limits: Per organization

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Solution: Check DATABASE_URL and PostgreSQL service
   ```

2. **JWT Authentication Failed**
   ```
   Solution: Verify JWT_SECRET and token format
   ```

3. **File Upload Failed**
   ```
   Solution: Check AWS credentials and S3 bucket permissions
   ```

4. **WebSocket Connection Issues**
   ```
   Solution: Verify CORS settings and client authentication
   ```

### Debug Mode

Enable verbose logging:

```env
NODE_ENV=development
DEBUG=*
```

## 🚀 Deployment

### Production Setup

1. Update environment variables for production
2. Set up SSL certificates
3. Configure reverse proxy (nginx)
4. Set up monitoring and logging
5. Configure backup strategies

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 8080
CMD ["node", "src/enhanced-server.js"]
```

## 📈 Performance Optimization

### Database

- Connection pooling enabled
- Query optimization with Prisma
- Indexed fields for fast lookups
- Pagination for large datasets

### Caching

- Redis session storage (optional)
- File metadata caching
- API response caching
- Static asset optimization

### Monitoring

- Request/response metrics
- Database query performance
- Memory and CPU usage
- WebSocket connection counts

## 🔄 Migration Guide

### From Original Backend

1. Backup existing database
2. Run migration scripts
3. Update frontend integration
4. Test all endpoints
5. Deploy incrementally

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name enhanced_features

# Apply to production
npx prisma migrate deploy
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [AWS S3 Setup Guide](https://docs.aws.amazon.com/s3/)
- [Multi-Tenant Architecture Best Practices](https://docs.microsoft.com/en-us/azure/sql-database/sql-database-design-patterns-multi-tenancy-saas-applications)

## 🆘 Support

For issues or questions:

1. Check this documentation
2. Review the test implementation
3. Check application logs
4. Create detailed issue reports

---

**🎉 Congratulations!** You now have a fully featured multi-tenant architecture backend with enterprise-grade project management capabilities.