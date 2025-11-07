# Daritana Backend - Production Ready API

A secure, scalable Node.js backend for the Daritana Architecture Management Platform, built with TypeScript, Express.js, Prisma ORM, and PostgreSQL.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user CRUD with profiles, sessions, and security features
- **Database**: Prisma ORM with PostgreSQL for type-safe database operations
- **Security**: Helmet, CORS, rate limiting, input validation, and password hashing
- **Logging**: Winston-based logging with different levels and file rotation
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling with detailed error responses
- **Health Checks**: Database and system health monitoring

### Authentication Features
- User registration and login
- JWT access and refresh tokens
- Password reset functionality
- Email verification
- Session management
- Account security (login attempts, account locking)
- Role-based permissions (Admin, Project Lead, Designer, Contractor, Staff, Client)

### Malaysian-Specific Features
- Default timezone: Asia/Kuala_Lumpur
- Default currency: MYR
- Localization support (EN/MS/ZH)

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, cors, express-rate-limit
- **Validation**: Zod
- **Logging**: Winston
- **File Upload**: Multer (with AWS S3 support)
- **Real-time**: Socket.IO
- **Email**: SendGrid
- **Testing**: Jest (configured)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Redis for caching

### Quick Setup

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

3. **Run setup script:**
```bash
npm run setup
```

This will:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Seed the database with sample data

4. **Start the server:**
```bash
npm run dev  # Development mode
npm start    # Production mode
```

### Manual Setup (if needed)

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npm run seed

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/daritana_dev"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Security Configuration
BCRYPT_ROUNDS=12

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SMS_NOTIFICATIONS=false
```

See `.env.example` for all available options.

### Database Schema

The application uses Prisma ORM with a comprehensive schema including:
- User management with roles and permissions
- Session tracking
- Audit logging
- Project management entities
- Document management
- Notification system
- Malaysian compliance features

## 🔐 Authentication

### User Roles
- **ADMIN**: Full system access
- **PROJECT_LEAD**: Project management capabilities
- **DESIGNER**: Design and creative tasks
- **CONTRACTOR**: Construction and implementation
- **STAFF**: General staff access
- **CLIENT**: Client portal access

### Test Accounts

After running the setup, these test accounts are available:

```
Admin: admin@daritana.com / admin123!
Project Lead: lead@daritana.com / lead123!
Designer: designer@daritana.com / designer123!
Contractor: contractor@daritana.com / contractor123!
Client: client@daritana.com / client123!
Staff: staff@daritana.com / staff123!
```

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email
- `GET /sessions` - Get user sessions
- `DELETE /sessions/:id` - Revoke session

### User Management Routes (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /stats` - Get user statistics (Admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user (Admin only)
- `DELETE /:id` - Delete user (Admin only)
- `POST /:id/ban` - Ban user (Admin only)
- `POST /:id/unban` - Unban user (Admin only)
- `GET /:id/activity` - Get user activity log (Admin only)

### System Routes
- `GET /health` - Basic health check
- `GET /api/health` - Detailed health check
- `GET /` - API information

## 🔒 Security Features

### Authentication Security
- JWT tokens with secure secrets
- Refresh token rotation
- Login attempt limiting
- Account locking after failed attempts
- Session management and revocation
- Password strength requirements

### General Security
- Helmet.js for security headers
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input sanitization and validation
- SQL injection prevention (Prisma ORM)
- Password hashing with bcrypt
- Secure error handling (no sensitive data exposure)

### Audit & Compliance
- Comprehensive audit logging
- User activity tracking
- Session tracking with IP and user agent
- Failed login attempt logging

## 📊 Logging & Monitoring

### Logging Levels
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages (default)
- `debug` - Debug messages

### Log Files
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console output in development

### Health Monitoring
- Database connectivity checks
- System resource monitoring
- Uptime tracking
- Memory usage monitoring

## 🧪 Development

### Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run setup       # Initial setup script
npm run seed        # Seed database with sample data
npm run prisma:studio # Open Prisma Studio
npm run prisma:generate # Generate Prisma client
```

### Database Management
```bash
# View database in browser
npx prisma studio

# Reset database (CAUTION: destroys data)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# Apply schema changes to database
npx prisma db push
```

### Project Structure
```
backend/src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── validators/      # Request validation schemas
├── types/           # TypeScript type definitions
├── scripts/         # Database seeding and setup scripts
└── server.prisma.ts # Main server file
```

## 🚀 Production Deployment

### Build Process
```bash
npm run build
npm start
```

### Environment Considerations
- Use strong, unique JWT secrets
- Configure proper database connection pooling
- Enable HTTPS
- Set up proper logging aggregation
- Configure monitoring and alerts
- Use environment-specific database URLs
- Enable security features (CSRF, HSTS, etc.)

### Docker Support
A Dockerfile is provided for containerized deployment.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists
   
2. **JWT Token Errors**
   - Ensure JWT_SECRET is at least 32 characters
   - Check token expiration settings
   
3. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on port 3001

4. **Prisma Schema Issues**
   - Run `npx prisma generate` after schema changes
   - Use `npx prisma db push` to apply changes

### Logs Location
- Development: Console + `logs/` directory
- Production: `logs/` directory only

## 📝 License

This project is proprietary software for Daritana Architecture Management Platform.

## 🤝 Contributing

For contribution guidelines, please contact the development team.

---

For more information, visit: [https://daritana.com](https://daritana.com)