# 🧪 DARITANA LOCAL TESTING GUIDE
## Complete Setup for Local Development & Testing

---

## 📋 PREREQUISITES

### Required Software:
- ✅ Node.js (v18+)
- ✅ PostgreSQL (v14+)
- ✅ Redis (optional, for caching)
- ✅ Git

---

## 🚀 QUICK START (5 Minutes)

### Step 1: Clone and Install
```bash
# If not already cloned
git clone <repository-url>
cd daritana

# Install all dependencies
npm install --legacy-peer-deps
cd backend && npm install --legacy-peer-deps
cd ..
```

### Step 2: Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE daritana;
CREATE USER daritana_user WITH PASSWORD 'daritana123';
GRANT ALL PRIVILEGES ON DATABASE daritana TO daritana_user;
\q

# Run migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Step 3: Environment Configuration
```bash
# Create backend .env file
cd backend
cp ../.env.example .env

# Edit .env with these LOCAL values:
DATABASE_URL="postgresql://daritana_user:daritana123@localhost:5432/daritana"
JWT_SECRET="local-dev-secret-change-in-production"
JWT_REFRESH_SECRET="local-dev-refresh-secret"

# Stripe Test Keys (for payment testing)
STRIPE_SECRET_KEY="sk_test_51PQjhdP5FzLPDlfpKcYLOqiNwSBQzXNAUnnncFmF1234567890"
STRIPE_WEBHOOK_SECRET="whsec_test_1234567890"

# File Storage (local)
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="104857600"

# Email (use Ethereal for testing)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="test@ethereal.email"
SMTP_PASSWORD="test123"

# Frontend .env
cd ../
echo "VITE_API_URL=http://localhost:8080/api" > .env
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51PQjhdP5FzLPDlfp1234567890" >> .env
```

### Step 4: Seed Database with Test Data
```bash
cd backend
npx prisma db seed
# This will create:
# - Test users (admin@daritana.com, user@daritana.com)
# - Sample projects
# - Test organizations
```

### Step 5: Start Everything
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd daritana
npm run dev

# App will be available at:
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
```

---

## 🧪 TEST ACCOUNTS

### Admin Account:
- Email: `admin@daritana.com`
- Password: `Admin123!`
- Role: System Admin

### Regular Users:
- Email: `john@architecture.com`
- Password: `Test123!`
- Role: Project Manager

- Email: `sarah@design.com`
- Password: `Test123!`
- Role: Designer

- Email: `client@company.com`
- Password: `Test123!`
- Role: Client

---

## ✅ TESTING CHECKLIST

### 1. Authentication Flow
- [ ] Register new account
- [ ] Login with email/password
- [ ] Logout
- [ ] Password reset (check console for email)
- [ ] Session persistence (refresh page)

### 2. Project Management
- [ ] Create new project
- [ ] Edit project details
- [ ] Add team members
- [ ] Create tasks
- [ ] Drag tasks in Kanban board
- [ ] View Gantt chart
- [ ] Set task dependencies

### 3. File Upload
- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Upload large file (>10MB)
- [ ] View uploaded files
- [ ] Download file
- [ ] Delete file
- [ ] Check storage quota

### 4. Payment Flow (Stripe Test Mode)
```bash
# Test Card Numbers:
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

# Any future date for expiry
# Any 3 digits for CVC
# Any 5 digits for ZIP
```

- [ ] View subscription plans
- [ ] Select plan and checkout
- [ ] Complete payment
- [ ] View billing history
- [ ] Cancel subscription
- [ ] Update payment method

### 5. Real-time Features
- [ ] Send message in project chat
- [ ] Receive notifications
- [ ] See user presence indicators
- [ ] Activity feed updates

### 6. Dashboard & Analytics
- [ ] View dashboard widgets
- [ ] Rearrange widgets
- [ ] View project statistics
- [ ] Export reports (PDF/Excel)

### 7. Mobile Responsiveness
- [ ] Test on mobile viewport (F12 → Mobile view)
- [ ] Navigation menu works
- [ ] Forms are usable
- [ ] Tables are scrollable

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Database Connection Failed
```bash
# Fix: Check PostgreSQL is running
sudo service postgresql status
# or
pg_ctl status

# Start if needed:
sudo service postgresql start
```

### Issue: Port Already in Use
```bash
# Find and kill process
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8080
kill -9 <PID>
```

### Issue: Prisma Migration Errors
```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Issue: File Upload Not Working
```bash
# Create uploads directory
cd backend
mkdir -p uploads
chmod 755 uploads
```

### Issue: Stripe Webhooks Not Working Locally
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local
stripe listen --forward-to localhost:8080/api/stripe/webhook

# Copy webhook secret to .env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🔍 DEBUGGING TOOLS

### 1. Database GUI
```bash
# Option 1: pgAdmin
# Download from: https://www.pgadmin.org/

# Option 2: Prisma Studio
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### 2. API Testing
```bash
# Option 1: Postman
# Import collection from: backend/postman_collection.json

# Option 2: VS Code REST Client
# Install REST Client extension
# Use .http files in backend/tests/
```

### 3. Email Testing
```bash
# Ethereal Email (catches all test emails)
# View at: https://ethereal.email/messages
# Login with test credentials from .env
```

### 4. Browser DevTools
```javascript
// Console commands for debugging:

// Check auth token
localStorage.getItem('token')

// Check user data
JSON.parse(localStorage.getItem('user'))

// Clear all data
localStorage.clear()

// Check API calls
// Network tab → Filter by XHR
```

---

## 📊 PERFORMANCE TESTING

### 1. Lighthouse Audit
```bash
# Chrome DevTools → Lighthouse
# Run audit for:
- Performance
- Accessibility
- Best Practices
- SEO
```

### 2. Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 100 http://localhost:8080/api/health
```

### 3. Bundle Size Analysis
```bash
# Frontend bundle analysis
npm run build
npm run analyze
```

---

## 🎯 TEST SCENARIOS

### Scenario 1: Complete Project Flow
1. Login as project manager
2. Create new project "Office Renovation"
3. Add team members
4. Create 5 tasks
5. Upload floor plans
6. Set task dependencies
7. View Gantt chart
8. Mark tasks complete

### Scenario 2: Client Collaboration
1. Login as client
2. View assigned project
3. Comment on tasks
4. Upload reference images
5. Approve quotation
6. View project progress

### Scenario 3: Payment & Subscription
1. Register new account
2. Select Professional plan
3. Complete payment (test card)
4. Verify subscription active
5. Access premium features
6. Download invoice

### Scenario 4: Team Collaboration
1. Login as designer
2. Join project team
3. Create design brief
4. Upload design files
5. Request feedback
6. Update task status

---

## 🚦 HEALTH CHECKS

### Backend Health
```bash
# Check API health
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 1234,
  "version": "1.0.0"
}
```

### Frontend Health
```bash
# Check build
npm run build

# Check for errors
npm run lint

# Type checking
npm run type-check
```

### Database Health
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Project";
SELECT COUNT(*) FROM "Task";
```

---

## 📝 LOCAL DEVELOPMENT TIPS

### 1. Hot Reload
Both frontend and backend support hot reload:
- Frontend: Save file → Auto refresh
- Backend: Save file → Auto restart (nodemon)

### 2. Debug Mode
```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode
VITE_DEBUG=true npm run dev
```

### 3. Mock Data
```javascript
// Enable mock data in frontend
localStorage.setItem('useMockData', 'true')

// Disable API calls
localStorage.setItem('offlineMode', 'true')
```

### 4. Browser Extensions
Recommended for development:
- React Developer Tools
- Redux DevTools (for Zustand)
- Pesticide (CSS layout debugger)

---

## 🎨 CUSTOMIZATION FOR TESTING

### Change Theme/Branding
```javascript
// src/styles/globals.css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

### Add Test Data
```bash
# Edit seed file
backend/prisma/seed.ts

# Re-run seed
npx prisma db seed
```

### Test Different Roles
```javascript
// Quick role switch (console)
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'admin'; // or 'designer', 'client', etc.
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

---

## 🚀 READY FOR TESTING!

Your local environment is now fully configured. Start with:

1. **Basic Flow**: Login → Create Project → Add Tasks
2. **File Upload**: Test with PDFs and images
3. **Payments**: Use test cards for subscription
4. **Collaboration**: Test with multiple browser tabs/users

### Support & Issues:
- Check console for errors (F12)
- Backend logs in terminal
- Database issues in Prisma Studio
- API issues in Network tab

---

## 📌 QUICK COMMANDS REFERENCE

```bash
# Start everything
npm run dev:all

# Reset everything
npm run reset:all

# Run tests
npm run test

# Check code quality
npm run lint
npm run type-check

# Build for production
npm run build

# Clean everything
npm run clean
rm -rf node_modules backend/node_modules
npm install --legacy-peer-deps
```

---

*Happy Testing! 🎉*