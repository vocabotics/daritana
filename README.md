# 🏗️ Daritana Architect Management

> **Enterprise-grade architecture project management system for Malaysian architects**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Production](https://img.shields.io/badge/status-production--ready-success)](https://github.com)

**Daritana** is a comprehensive project management platform designed specifically for Malaysian architecture firms, combining powerful project tracking with compliance management for local authorities (DBKL, MBPJ, MBSA, etc.).

---

## ✨ Key Features

### 🏛️ **Architect Features**
- **Authority Tracking** - Manage submissions to DBKL, MBPJ, MBSA, Bomba, TNB, IWK
- **CCC Management** - Track Certificate of Completion & Compliance applications
- **DLP Tracking** - Defects Liability Period monitoring with retention management
- **Payment Certificates** - PAM Form 9/10 generation and tracking
- **Site Instructions** - Architect's Instructions (AI) register
- **Meeting Minutes** - Site progress meeting documentation
- **Retention Tracking** - 5% retention money management

### 💼 **Project Management**
- **Kanban Boards** - Visual task management with drag-and-drop
- **Timeline View** - Gantt charts with critical path analysis
- **Design Briefs** - Client requirements and project scope
- **File Management** - Cloud storage integration (Google Drive, OneDrive)
- **Team Collaboration** - Real-time presence and comments

### 🔐 **Security & Compliance**
- **HTTP-Only Cookies** - XSS protection
- **Real OAuth 2.0** - Google Drive, WhatsApp Business, Telegram
- **Role-Based Access** - 5 user roles (Client, Staff, Contractor, Lead, Designer)
- **Malaysian Standards** - PAM Contracts, LAM/BEM compliance

### 🎨 **User Experience**
- **Professional Loading States** - Smooth UX with Loader2 spinners
- **Error Boundaries** - Graceful error handling with retry
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Dark/Light Mode** - Theme switching support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or yarn/pnpm)
- **PostgreSQL** >= 14.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/daritana.git
cd daritana

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start backend server
npm run dev

# In a new terminal, start frontend
cd ..
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:7001
- **Database**: localhost:5432

### Default Credentials

```
Email: admin@example.com
Password: admin123
```

> ⚠️ **Change default credentials immediately in production!**

---

## 📁 Project Structure

```
daritana/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                   # Radix UI components
│   │   ├── layout/               # Header, Sidebar, Layout
│   │   └── features/             # Feature-specific components
│   ├── pages/                    # Route pages
│   │   ├── architect/            # Architect-specific pages (7 pages)
│   │   ├── dashboard/            # Dashboard views
│   │   └── ...
│   ├── store/                    # Zustand state management
│   │   ├── authStore.ts          # Authentication
│   │   ├── projectStore.ts       # Projects & tasks
│   │   └── architect/            # Architect feature stores (7 stores)
│   ├── services/                 # API service layer
│   │   ├── architect.service.ts  # Architect API calls
│   │   └── ...
│   ├── lib/                      # Utilities
│   │   └── api.ts                # Axios instance with HTTP-Only cookies
│   └── types/                    # TypeScript definitions
│
├── backend/                      # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/          # API controllers
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Auth, CORS, etc.
│   │   └── prisma/               # Database schema
│   └── ...
│
├── docs/                         # Documentation
│   ├── PHASE_1_COMPLETE.md       # Current completion status
│   ├── SESSION_SUMMARY.md        # Latest session overview
│   └── ...
│
└── ...
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Zustand** - State management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM & migrations
- **PostgreSQL** - Database
- **Socket.io** - Real-time features
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### DevOps
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vite** - Fast builds
- **Git** - Version control

---

## 🔧 Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server (port 5174)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend
```bash
cd backend
npm run dev          # Start backend server (port 7001)
npm run build        # Build TypeScript
npm run start        # Start production server
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev --name <name>  # Create migration
```

### Environment Variables

Create `.env` files in root and `backend/`:

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:7001
VITE_ENABLE_MOCKS=false
```

**Backend `.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/daritana"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=7001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5174
```

---

## 📊 Architecture

### Clean Architecture Pattern

```
┌─────────────────────────────────────────┐
│            Pages (React)                │
│  - Loading States (Loader2)             │
│  - Error Boundaries (with Retry)        │
│  - Data Display (from stores)           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Stores (Zustand)                   │
│  - CRUD Operations                      │
│  - Error Handling                       │
│  - Loading States                       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       Services (Business Logic)         │
│  - API Calls (via lib/api.ts)           │
│  - Data Transformation                  │
│  - Error Handling                       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         API (Backend)                   │
│  - HTTP-Only Cookies                    │
│  - Real OAuth                           │
│  - Type Safety                          │
└─────────────────────────────────────────┘
```

### Security Architecture

- **Authentication**: JWT tokens stored in HTTP-Only cookies
- **Authorization**: Role-based access control (RBAC)
- **XSS Protection**: HTTP-Only cookies prevent token theft
- **CSRF Protection**: SameSite cookie attribute
- **OAuth 2.0**: Real implementations for third-party services

---

## 🎯 Malaysian Standards Compliance

### Supported Local Authorities
- **DBKL** - Dewan Bandaraya Kuala Lumpur
- **MBPJ** - Majlis Bandaraya Petaling Jaya
- **MBSA** - Majlis Bandaraya Shah Alam
- **MPS** - Majlis Perbandaran Selayang
- **MPAJ** - Majlis Perbandaran Ampang Jaya
- **MPSJ** - Majlis Perbandaran Subang Jaya

### PAM Contracts
- PAM 2006 (Standard Form)
- PAM 2018 (Updated Form)
- Architect's Fee Scale
- Payment Certificate Forms (9/10)

### Statutory Requirements
- **CCC** - Certificate of Completion & Compliance
- **DLP** - Defects Liability Period (12-24 months)
- **Retention** - 5% standard retention money
- **LAM** - Lembaga Arkitek Malaysia registration
- **BEM** - Board of Engineers Malaysia registration

---

## 📚 Documentation

### For Developers
- **[SESSION_SUMMARY.md](SESSION_SUMMARY.md)** - Latest development session
- **[PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)** - Feature completion report
- **[CLAUDE.md](CLAUDE.md)** - Claude Code project instructions

### For Deployment
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment
- **Environment Setup** - See `.env.example` files

### For Architecture
- **[ARCHITECT_FEATURES_STATUS.md](ARCHITECT_FEATURES_STATUS.md)** - Feature list
- **[FRONTEND_BACKEND_AUDIT.md](FRONTEND_BACKEND_AUDIT.md)** - Integration status

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update `.env` with production values
- [ ] Change default admin password
- [ ] Setup PostgreSQL production database
- [ ] Run `npx prisma migrate deploy`
- [ ] Configure OAuth credentials (Google, WhatsApp, etc.)
- [ ] Setup SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Setup monitoring (Sentry, DataDog, etc.)
- [ ] Configure CDN for static assets
- [ ] Setup automated backups

### Recommended Hosting

- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Railway, Render, AWS EC2, DigitalOcean
- **Database**: Supabase, Railway, AWS RDS, DigitalOcean Managed DB

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow existing rules
- **Formatting**: Use Prettier (auto-format on save)
- **Components**: Functional components with hooks
- **State**: Zustand for global state, useState for local
- **Naming**: camelCase for variables, PascalCase for components

---

## 📈 Current Status

### ✅ Completed Features (95% Complete)

- **Frontend Architecture**: 100% ✅
- **Backend Integration**: 96.1% ✅ (49/51 endpoints working)
- **Security**: 100% ✅ (HTTP-Only cookies, Real OAuth)
- **Architect Pages**: 100% ✅ (All 7 pages connected to backend)
- **State Management**: 100% ✅ (Zustand stores with persistence)
- **UI/UX**: 100% ✅ (Loading states, error boundaries)

### 📊 Metrics

| Metric | Value |
|--------|-------|
| TypeScript Coverage | 100% |
| Build Errors | 0 |
| Test Pass Rate | 96.1% |
| localStorage Usage | 0 (HTTP-Only cookies) |
| Bundle Size | 5.07 MB (1.13 MB gzip) |
| Pages | 28+ |
| Components | 200+ |
| API Endpoints | 51 |

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- **Malaysian Architect Standards** - PAM, LAM, BEM
- **Radix UI** - Accessible component primitives
- **Tailwind Labs** - Utility-first CSS framework
- **Vercel** - Next-gen frontend tooling
- **Prisma** - Modern database toolkit

---

## 📧 Support

For support, email support@daritana.com or join our Slack channel.

---

## 🎉 What's New

### Latest Release (Phase 1 Complete)

**🔥 All Architect Pages Now Connected to Backend!**

- ✅ Real-time data synchronization
- ✅ Professional loading states
- ✅ Error boundaries with retry
- ✅ HTTP-Only cookie authentication
- ✅ Real OAuth implementations

See [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) for full details.

---

<div align="center">

**Built with ❤️ for Malaysian Architects**

[Website](https://daritana.com) • [Documentation](docs/) • [Support](mailto:support@daritana.com)

</div>
