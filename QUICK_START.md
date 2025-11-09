# ⚡ Quick Start Guide - Daritana Architect Management

Get up and running in **5 minutes**!

---

## 🎯 Prerequisites (1 minute)

Ensure you have these installed:

```bash
# Check Node.js version (should be >= 18.x)
node --version

# Check npm version (should be >= 9.x)
npm --version

# Check PostgreSQL (should be >= 14.x)
psql --version
```

**Don't have them?**
- Node.js: [Download here](https://nodejs.org/)
- PostgreSQL: [Download here](https://www.postgresql.org/download/)

---

## 🚀 Installation (2 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/daritana.git
cd daritana

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Setup Database

```bash
# Create database (run in PostgreSQL)
createdb daritana

# Or using psql
psql -U postgres
CREATE DATABASE daritana;
\q
```

### Step 3: Configure Environment

```bash
# Frontend environment
cp .env.example .env

# Backend environment
cd backend
cp .env.example .env

# Edit backend/.env and update DATABASE_URL:
# DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/daritana"
```

### Step 4: Run Migrations

```bash
# From backend directory
cd backend
npx prisma migrate dev
npx prisma generate
```

---

## 🎮 Running the App (1 minute)

### Terminal 1: Start Backend

```bash
cd backend
npm run dev

# You should see:
# ✅ Server running on port 7001
# ✅ Database connected
```

### Terminal 2: Start Frontend

```bash
# From project root
npm run dev

# You should see:
# ✅ VITE v5.x.x ready in Xms
# ✅ Local: http://localhost:5174
```

### Access the App

Open your browser to: **http://localhost:5174**

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

> 🔐 **Security Note**: Change these credentials immediately!

---

## ✅ Verify Installation (1 minute)

### Check Frontend
1. Navigate to http://localhost:5174
2. You should see the login page
3. Login with default credentials
4. You should see the dashboard

### Check Backend
```bash
# Test backend API
curl http://localhost:7001/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Check Database
```bash
cd backend
npx prisma studio

# Opens Prisma Studio at http://localhost:5555
# You should see all database tables
```

---

## 🎨 First Steps

### 1. Create Your First Project

1. Click **"Projects"** in the sidebar
2. Click **"New Project"** button
3. Fill in project details:
   - Project Name: "My First Project"
   - Client Name: "Test Client"
   - Location: "Kuala Lumpur"
   - Budget: RM 1,000,000
4. Click **"Create Project"**

### 2. Add a Task

1. Go to **"Kanban"** view
2. Click **"Add Task"** in "To Do" column
3. Fill in task details
4. Drag and drop to change status

### 3. Track Authority Submission

1. Navigate to **"Architect" > "Authority Tracking"**
2. Click **"New Submission"**
3. Select authority (e.g., DBKL)
4. Upload required documents
5. Submit for approval

---

## 🔧 Common Issues & Solutions

### Issue: Port 5174 already in use

```bash
# Find and kill the process
lsof -ti:5174 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Issue: Port 7001 already in use

```bash
# Find and kill the process
lsof -ti:7001 | xargs kill -9

# Or change in backend/.env
PORT=7002
```

### Issue: Database connection error

```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS)
brew services restart postgresql

# Restart PostgreSQL (Linux)
sudo systemctl restart postgresql

# Verify connection string in backend/.env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/daritana"
```

### Issue: Prisma migration fails

```bash
# Reset database (WARNING: This deletes all data)
cd backend
npx prisma migrate reset

# Run migrations again
npx prisma migrate dev
npx prisma generate
```

### Issue: Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Same for backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

### Explore Features

- **Dashboard**: Overview of all projects
- **Kanban**: Visual task management
- **Timeline**: Gantt charts and schedules
- **Architect Tools**: CCC, DLP, Payment Certificates
- **Team**: Manage members and permissions
- **Integrations**: Connect Google Drive, WhatsApp

### Customize Settings

1. Go to **"Settings"** (gear icon)
2. Update your profile
3. Configure integrations
4. Setup team members
5. Customize dashboard widgets

### Read Documentation

- **[README.md](README.md)** - Full project documentation
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)** - Feature completion status

---

## 🎯 Quick Reference

### Useful Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Run linter

# Backend
cd backend
npm run dev          # Start backend
npx prisma studio    # Open database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate  # Generate Prisma client

# Database
createdb daritana    # Create database
dropdb daritana      # Delete database
psql daritana        # Connect to database
```

### Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5174 | Main application |
| Backend API | http://localhost:7001 | REST API |
| Prisma Studio | http://localhost:5555 | Database GUI |
| API Docs | http://localhost:7001/api-docs | Swagger docs |

### Default Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@example.com | admin123 | Full access |
| Designer | designer@example.com | designer123 | Design features |
| Client | client@example.com | client123 | View only |

> 🔐 **Change all passwords in production!**

---

## 💡 Tips & Tricks

### Speed Up Development

1. **Enable Hot Reload**: Already configured in Vite
2. **Use Prisma Studio**: Visual database editing
3. **Browser DevTools**: React DevTools extension
4. **VS Code Extensions**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - Prisma

### Best Practices

- ✅ Commit frequently with clear messages
- ✅ Test new features before merging
- ✅ Keep dependencies updated
- ✅ Follow TypeScript best practices
- ✅ Use environment variables for secrets

### Performance Tips

- Use `React.memo()` for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and components
- Optimize images and assets
- Enable production builds for deployment

---

## 🆘 Getting Help

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/your-org/daritana/issues)
- **Discussions**: [Ask questions](https://github.com/your-org/daritana/discussions)
- **Email**: support@daritana.com

### Documentation

- **README**: [Full documentation](README.md)
- **API Docs**: http://localhost:7001/api-docs
- **Architecture**: [System design](ARCHITECT_FEATURES_STATUS.md)

### Professional Support

For enterprise support, contact: enterprise@daritana.com

---

## 🎉 You're All Set!

Congratulations! You now have Daritana running locally.

**What's Next?**

1. 🎨 **Customize** your dashboard
2. 📊 **Create** your first project
3. 👥 **Invite** team members
4. 🔗 **Connect** integrations (Google Drive, etc.)
5. 📱 **Test** on mobile devices

---

<div align="center">

**Happy Building! 🏗️**

[Back to Main README](README.md) | [View Documentation](docs/) | [Get Support](mailto:support@daritana.com)

</div>
