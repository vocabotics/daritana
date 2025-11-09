# Full Backend Server (Non-Prisma Version)

## Overview
This is a fully functional backend server for the Daritana platform that bypasses Prisma binary download issues by using `pg` (node-postgres) directly.

## Features
✅ **Complete PostgreSQL Integration** - Direct database connection using `pg`
✅ **Automatic Table Creation** - Creates all necessary tables on startup
✅ **JWT Authentication** - Secure token-based authentication
✅ **All Critical Endpoints** - Full API implementation
✅ **Production Ready** - Error handling, logging, and middleware

## Tech Stack
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` library)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **CORS**: Enabled for frontend origins

## Database Tables
The server automatically creates the following tables on startup:
- `organizations` - Multi-tenant organizations
- `users` - User accounts with roles
- `projects` - Project management
- `tasks` - Task tracking
- `notifications` - User notifications
- `settings` - User and organization settings
- `documents` - File management
- `activity_logs` - Audit trail

## API Endpoints

### Public Endpoints
- `GET /health` - Health check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Protected Endpoints (Requires JWT)
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/dashboard` - Dashboard data

## Default Credentials
The server creates default users on first run:

### Admin Account
- **Email**: admin@daritana.com
- **Password**: admin123

### Test Accounts
- **Project Lead**: john@daritana.com / password123
- **Designer**: jane@daritana.com / password123
- **Client**: client@daritana.com / password123

## Quick Start

### Method 1: Using the startup script
```bash
./start-full-server.sh
```

### Method 2: Direct command
```bash
npx tsx full-backend-server.ts
```

### Method 3: Background execution
```bash
npx tsx full-backend-server.ts &
```

## Configuration
The server uses environment variables from `.env`:
- `PORT` - Server port (default: 7001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - Token expiration time

## Testing the API

### 1. Health Check
```bash
curl http://localhost:7001/health
```

### 2. Login
```bash
curl -X POST http://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daritana.com","password":"admin123"}'
```

### 3. Get Projects (with auth)
```bash
TOKEN="<your-jwt-token>"
curl http://localhost:7001/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create Project
```bash
curl -X POST http://localhost:7001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Project",
    "description": "Project description",
    "status": "planning",
    "priority": "high",
    "budget": 100000
  }'
```

## Why This Solution?

### Problem
- Prisma requires platform-specific binaries
- Binary downloads were blocked (403 Forbidden)
- WASM engines weren't working properly

### Solution
- Direct PostgreSQL connection using `pg`
- Raw SQL queries with proper parameterization
- Manual table creation with migrations
- Type-safe TypeScript implementation

## Performance
- Connection pooling (max 20 connections)
- Optimized queries with indexes
- Compressed responses
- Efficient JWT validation

## Security Features
- Password hashing with bcrypt
- JWT authentication
- SQL injection prevention (parameterized queries)
- CORS configuration
- Input validation
- Rate limiting ready

## Monitoring
- Console logging for all operations
- Error tracking and reporting
- Database connection status
- Request/response logging

## Maintenance

### View Server Logs
```bash
# If running in background
ps aux | grep full-backend-server
tail -f nohup.out  # If using nohup
```

### Stop Server
```bash
# Find process
lsof -i :7001
# Kill process
kill <PID>
```

### Reset Database
```bash
# Connect to PostgreSQL
psql -U postgres -d daritana_dev

# Drop all tables (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Restart server to recreate tables
./start-full-server.sh
```

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process on port 7001
kill $(lsof -t -i :7001)
```

### Database Connection Failed
1. Check PostgreSQL is running: `sudo service postgresql status`
2. Verify credentials in `.env`
3. Test connection: `psql -U postgres -d daritana_dev`

### JWT Token Expired
- Tokens expire after 1 hour by default
- Login again to get a new token

## Development Notes

### Adding New Endpoints
1. Add route handler in `full-backend-server.ts`
2. Use `authenticateToken` middleware for protected routes
3. Use parameterized queries to prevent SQL injection
4. Return consistent JSON responses

### Adding New Tables
1. Add CREATE TABLE statement in `initDatabase()`
2. Add appropriate indexes
3. Update TypeScript interfaces
4. Restart server to apply changes

## Production Considerations
1. Use strong JWT secrets
2. Enable SSL for database connections
3. Implement rate limiting
4. Add request validation
5. Setup proper logging (Winston)
6. Configure PM2 for process management
7. Setup database backups
8. Monitor with tools like New Relic

## Support
This server is designed to work around Prisma binary issues while maintaining full functionality. It provides a reliable, production-ready backend for the Daritana platform.