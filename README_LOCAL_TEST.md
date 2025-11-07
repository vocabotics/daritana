# 🚀 DARITANA - Quick Local Testing

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

## Quick Start (2 minutes)

### Windows:
```bash
# Just run this:
start-local.bat
```

### Mac/Linux:
```bash
# Make executable and run:
chmod +x start-local.sh
./start-local.sh
```

## Manual Setup (if scripts don't work)

### 1. Database Setup
```sql
-- Create database (run in PostgreSQL)
CREATE DATABASE daritana;
CREATE USER daritana_user WITH PASSWORD 'daritana123';
GRANT ALL PRIVILEGES ON DATABASE daritana TO daritana_user;
```

### 2. Backend Setup
```bash
cd backend
npm install --legacy-peer-deps

# Create .env file with:
DATABASE_URL="postgresql://daritana_user:daritana123@localhost:5432/daritana"
JWT_SECRET="local-dev-secret"
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"

# Run migrations
npx prisma migrate dev
npx prisma db seed

# Start backend
npm run dev
```

### 3. Frontend Setup
```bash
# In root directory
npm install --legacy-peer-deps

# Create .env file with:
VITE_API_URL=http://localhost:8080/api

# Start frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database GUI**: `npx prisma studio` → http://localhost:5555
- **Test Checklist**: http://localhost:5173/test

## 👤 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@daritana.com | Test123! |
| Project Manager | john@architecture.com | Test123! |
| Designer | sarah@design.com | Test123! |
| Client | client@company.com | Test123! |
| Contractor | contractor@builders.com | Test123! |

## ✅ Quick Test Flow

1. **Login**: Use any test account above
2. **Dashboard**: View projects and stats
3. **Create Project**: Click "New Project" button
4. **Upload Files**: Test file upload in any project
5. **Kanban Board**: Drag and drop tasks
6. **Gantt Chart**: View project timeline
7. **Test Payments**: Go to `/billing` (uses Stripe test mode)
8. **System Check**: Go to `/test` for full system test

## 🧪 Test Payment Cards

Use these test cards in Billing section:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future date, any 3-digit CVC, any 5-digit ZIP

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo service postgresql status
# or
pg_ctl status
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID [PID] /F

# Mac/Linux
lsof -i :8080
kill -9 [PID]
```

### Reset Everything
```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

## 📊 System Test

Visit http://localhost:5173/test to run automated system checks:
- ✅ Authentication
- ✅ API Health
- ✅ Database Connection
- ✅ File Upload
- ✅ Payment Integration
- ✅ Performance Metrics

## 🎯 Key Features to Test

1. **Project Management**
   - Create/edit projects
   - Assign team members
   - Set task dependencies
   - View Gantt chart

2. **File Management**
   - Upload single/multiple files
   - View file gallery
   - Download files
   - Check storage quota

3. **Team Collaboration**
   - Add team members
   - Assign tasks
   - Leave comments
   - Real-time updates

4. **Billing & Payments**
   - View subscription plans
   - Upgrade/downgrade
   - Payment history
   - Billing portal

5. **Enterprise Features**
   - Gantt charts
   - Resource management
   - Critical path analysis
   - Monte Carlo simulation

## 📝 Notes

- All data is stored locally
- Emails are logged to console (not sent)
- Payments use Stripe test mode
- File uploads go to `backend/uploads/`

## 🆘 Support

Check the console (F12) for any errors. Backend logs appear in the terminal where you started the server.

---

**Ready to test!** 🎉 The system should be fully functional for local testing.