# Daritana Design Document Pack

**Version**: 2.0
**Last Updated**: November 28, 2025

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Component Library](#5-component-library)
6. [State Management](#6-state-management)
7. [Security Design](#7-security-design)
8. [Performance Optimization](#8-performance-optimization)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
                                    ┌─────────────────────┐
                                    │   Load Balancer     │
                                    │     (Nginx)         │
                                    └──────────┬──────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
          ┌─────────▼─────────┐    ┌──────────▼──────────┐    ┌─────────▼─────────┐
          │   Frontend        │    │   Backend API       │    │   WebSocket       │
          │   (React/Vite)    │    │   (Express)         │    │   (Socket.io)     │
          │   Port: 5174      │    │   Port: 7001        │    │   Port: 7001      │
          └─────────┬─────────┘    └──────────┬──────────┘    └─────────┬─────────┘
                    │                          │                          │
                    │              ┌───────────┴───────────┐              │
                    │              │                       │              │
          ┌─────────▼─────────────▼───────┐    ┌─────────▼──────────────▼─────────┐
          │       PostgreSQL               │    │          Redis                   │
          │       (Database)               │    │          (Cache/Sessions)        │
          │       Port: 5432               │    │          Port: 6379              │
          └────────────────────────────────┘    └──────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          ┌─────────▼─────────┐ ┌───────▼───────────┐
          │   AWS S3          │ │  External APIs     │
          │   (File Storage)  │ │  (Stripe, SendGrid)│
          └───────────────────┘ └────────────────────┘
```

### 1.2 Component Interaction

```
Frontend Components
├── Pages (Route-level components)
│   └── Use Layout components
├── Layout (Header, Sidebar, Main content)
│   └── Contain feature components
├── Feature Components (Business logic)
│   └── Use UI components & hooks
├── UI Components (Presentation)
│   └── Radix UI primitives
├── Hooks (Logic reuse)
│   └── Use services & stores
├── Services (API communication)
│   └── Use lib/api.ts
└── Stores (State management)
    └── Zustand with persistence
```

### 1.3 Request Flow

```
User Action
    │
    ▼
React Component
    │
    ├─► Zustand Store (state update)
    │
    └─► Service Layer
            │
            ▼
        lib/api.ts (axios instance)
            │
            ├─► Request Interceptor (add auth)
            │
            ▼
        Backend API (Express)
            │
            ├─► Middleware (auth, validation, logging)
            │
            ▼
        Route Handler
            │
            ├─► Prisma ORM
            │
            ▼
        PostgreSQL
            │
            ▼
        Response → Response Interceptor → Component → State Update → Re-render
```

---

## 2. Database Design

### 2.1 Entity Relationship Diagram (Core)

```
                           ┌────────────────────┐
                           │   Organization     │
                           ├────────────────────┤
                           │ id                 │
                           │ name               │
                           │ slug               │
                           │ subscriptionPlanId │
                           │ settings           │
                           └────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
            │ OrgMember     │ │ Project   │ │ Document      │
            ├───────────────┤ ├───────────┤ ├───────────────┤
            │ userId        │ │ id        │ │ id            │
            │ organizationId│ │ name      │ │ name          │
            │ role          │ │ orgId     │ │ projectId     │
            │ permissions   │ │ status    │ │ category      │
            └───────┬───────┘ │ budget    │ │ versionHistory│
                    │         └─────┬─────┘ └───────────────┘
            ┌───────▼───────┐       │
            │ User          │       │
            ├───────────────┤ ┌─────▼─────────────────┐
            │ id            │ │ Task                  │
            │ email         │ ├───────────────────────┤
            │ firstName     │ │ id                    │
            │ lastName      │ │ title                 │
            │ role          │ │ projectId             │
            │ settings      │ │ assignedTo            │
            └───────────────┘ │ status                │
                              │ priority              │
                              │ dependencies          │
                              └───────────────────────┘
```

### 2.2 Core Models

#### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  firstName     String
  lastName      String
  role          UserRole @default(STAFF)
  status        UserStatus @default(ACTIVE)
  phoneNumber   String?
  companyName   String?
  designation   String?
  avatar        String?
  settings      Json?
  lastLogin     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  organizations OrganizationMember[]
  projects      ProjectMember[]
  tasks         Task[]
  documents     Document[]
  notifications Notification[]
}
```

#### Project Model
```prisma
model Project {
  id             String   @id @default(uuid())
  name           String
  code           String   @unique
  description    String?
  status         ProjectStatus @default(PLANNING)
  type           ProjectType
  startDate      DateTime
  endDate        DateTime?
  budget         Decimal?
  location       String?
  organizationId String
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization   Organization @relation(...)
  tasks          Task[]
  documents      Document[]
  team           ProjectMember[]
  milestones     Milestone[]
  finances       ProjectFinance[]
}
```

#### Task Model
```prisma
model Task {
  id            String   @id @default(uuid())
  title         String
  description   String?
  status        TaskStatus @default(TODO)
  priority      TaskPriority @default(MEDIUM)
  projectId     String
  assignedToId  String?
  parentTaskId  String?
  startDate     DateTime?
  dueDate       DateTime?
  completedAt   DateTime?
  estimatedHours Decimal?
  actualHours   Decimal?
  order         Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  project       Project @relation(...)
  assignedTo    User? @relation(...)
  parentTask    Task? @relation(...)
  subtasks      Task[]
  dependencies  TaskDependency[]
  comments      Comment[]
}
```

### 2.3 Status Enums

```typescript
enum ProjectStatus {
  PLANNING
  PRE_DESIGN
  SCHEMATIC_DESIGN
  DESIGN_DEVELOPMENT
  CONSTRUCTION_DOCUMENTS
  BIDDING
  CONSTRUCTION
  POST_CONSTRUCTION
  COMPLETED
  ON_HOLD
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum UserRole {
  SYSTEM_ADMIN
  ORG_ADMIN
  PROJECT_LEAD
  SENIOR_ARCHITECT
  ARCHITECT
  DESIGNER
  STAFF
  CLIENT
  CONTRACTOR
  VENDOR
  GUEST
}
```

---

## 3. API Design

### 3.1 API Standards

#### Base URL
```
Development: http://localhost:7001/api
Production:  https://api.daritana.com/api
```

#### Response Format
```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### 3.2 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| POST | /auth/logout | Logout user |
| POST | /auth/refresh | Refresh access token |
| GET | /auth/me | Get current user |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/verify-email | Verify email address |

### 3.3 Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /projects | List all projects |
| POST | /projects | Create project |
| GET | /projects/:id | Get project details |
| PUT | /projects/:id | Update project |
| DELETE | /projects/:id | Delete project |
| GET | /projects/:id/team | Get project team |
| GET | /projects/:id/tasks | Get project tasks |
| GET | /projects/:id/statistics | Get project stats |

### 3.4 Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List all tasks |
| POST | /tasks | Create task |
| GET | /tasks/:id | Get task details |
| PUT | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| PATCH | /tasks/:id/status | Update task status |
| POST | /tasks/:id/comments | Add comment |

### 3.5 Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /documents | List documents |
| POST | /documents | Upload document |
| GET | /documents/:id | Get document |
| PUT | /documents/:id | Update document |
| DELETE | /documents/:id | Delete document |
| GET | /documents/:id/versions | Get version history |
| POST | /documents/:id/versions | Create new version |

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
src/
├── components/           # Reusable components
│   ├── ui/              # Base UI components (Radix)
│   ├── layout/          # Layout components
│   ├── admin/           # Admin components
│   ├── auth/            # Authentication
│   ├── dashboard/       # Dashboard widgets
│   ├── projects/        # Project components
│   ├── kanban/          # Kanban board
│   ├── timeline/        # Timeline/Gantt
│   ├── documents/       # Document management
│   ├── financial/       # Financial components
│   ├── team/            # Team collaboration
│   ├── marketplace/     # Marketplace
│   ├── aria/            # AI assistant
│   ├── architect/       # Architect-specific
│   └── enterprise/      # Enterprise PM
├── pages/               # Route-level pages
├── store/               # Zustand stores
├── services/            # API services
├── hooks/               # Custom hooks
├── lib/                 # Shared utilities
├── types/               # TypeScript types
├── utils/               # Utility functions
├── config/              # Configuration
└── i18n/                # Internationalization
```

### 4.2 Routing Structure

```typescript
const routes = {
  // Public routes
  '/login': LoginPage,
  '/register': CompanyRegistration,

  // Main routes
  '/dashboard': UltimateStudioHub,
  '/projects': Projects,
  '/projects/:id': ProjectDetail,
  '/kanban': KanbanPage,
  '/timeline': TimelinePage,
  '/documents': Documents,
  '/files': Files,
  '/team': TeamPage,
  '/financial': Financial,
  '/settings': Settings,

  // Architect routes
  '/architect/rfi': RFIManagement,
  '/architect/drawings': DrawingManagement,
  '/architect/contracts': PAMContractAdmin,
  '/architect/ubbl': UBBLCompliance,
  // ... more architect routes

  // Enterprise routes
  '/enterprise-pm': EnterprisePM,

  // Admin routes
  '/admin/*': AdminPortal,
};
```

### 4.3 Code Splitting Strategy

```typescript
// Lazy load large feature modules
const EnterprisePM = lazy(() => import('@/pages/EnterprisePM'));
const RFIManagement = lazy(() => import('@/pages/architect/RFIManagement'));
const Analytics = lazy(() => import('@/pages/Analytics'));

// Wrap with Suspense
<Suspense fallback={<FullPageSkeleton />}>
  <EnterprisePM />
</Suspense>
```

---

## 5. Component Library

### 5.1 Design Tokens

```css
/* Colors */
--primary: 220 90% 56%;        /* Blue */
--secondary: 240 4% 16%;       /* Dark gray */
--accent: 142 76% 36%;         /* Green */
--destructive: 0 84% 60%;      /* Red */
--warning: 48 96% 53%;         /* Yellow */
--muted: 240 4% 46%;           /* Gray */

/* Typography */
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;

/* Radius */
--radius-sm: 0.25rem;
--radius-md: 0.375rem;
--radius-lg: 0.5rem;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### 5.2 Core Components

| Component | Source | Purpose |
|-----------|--------|---------|
| Button | Radix + Custom | Actions and navigation |
| Card | Custom | Content containers |
| Dialog | Radix | Modal dialogs |
| Dropdown | Radix | Selection menus |
| Input | Custom | Form inputs |
| Select | Radix | Dropdown selection |
| Table | Custom | Data display |
| Tabs | Radix | Content organization |
| Toast | Sonner | Notifications |
| Tooltip | Radix | Contextual help |

### 5.3 Component Guidelines

```typescript
// Component structure
interface ComponentProps {
  // Required props first
  children: React.ReactNode;

  // Optional props with defaults
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;

  // Event handlers
  onClick?: () => void;

  // Style overrides
  className?: string;
}

// Default export pattern
export function Component({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  ...props
}: ComponentProps) {
  return (
    <div className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </div>
  );
}
```

---

## 6. State Management

### 6.1 Store Architecture

```
Zustand Stores
├── authStore           # Authentication state
├── projectStore        # Project data
├── taskStore           # Task management
├── teamStore           # Team data
├── dashboardStore      # Dashboard widgets
├── settingsStore       # User settings
├── uiStore             # UI state
├── notificationStore   # Notifications
├── marketplaceStore    # Marketplace
├── communityStore      # Community
├── financialStore      # Financial data
└── architect/          # Architect-specific stores
    ├── rfiStore
    ├── drawingStore
    └── contractStore
```

### 6.2 Store Pattern

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  // State
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  selectItem: (id: string) => void;
  createItem: (data: CreateItemData) => Promise<void>;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      selectedId: null,
      isLoading: false,
      error: null,

      // Actions
      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const items = await api.getItems();
          set({ items, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },
      // ... more actions
    }),
    {
      name: 'store-name',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

### 6.3 Store Dependencies

```
authStore (independent)
    │
    ▼
projectStore (depends on auth)
    │
    ├── taskStore (depends on project)
    │
    └── teamStore (depends on project)
```

---

## 7. Security Design

### 7.1 Authentication Flow

```
Login Flow
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ ──► │  Server  │ ──► │ Database │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │ POST /login    │                │
     │ {email, pass}  │                │
     │──────────────►│                │
     │                │ Find user      │
     │                │───────────────►│
     │                │                │
     │                │◄───────────────│
     │                │ User data      │
     │                │                │
     │                │ Verify password│
     │                │ Generate JWT   │
     │                │ Set cookies    │
     │◄───────────────│                │
     │ Set-Cookie:    │                │
     │ access_token   │                │
     │ refresh_token  │                │
```

### 7.2 JWT Token Structure

```typescript
// Access Token (15 min expiry)
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "ARCHITECT",
  "organizationId": "uuid",
  "permissions": ["read:projects", "write:tasks"],
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 days expiry)
{
  "userId": "uuid",
  "tokenId": "uuid", // For revocation
  "iat": 1234567890,
  "exp": 1235172690
}
```

### 7.3 Permission Matrix

| Role | Projects | Tasks | Documents | Team | Admin |
|------|----------|-------|-----------|------|-------|
| System Admin | CRUD | CRUD | CRUD | CRUD | CRUD |
| Org Admin | CRUD | CRUD | CRUD | CRUD | R |
| Project Lead | CRUD | CRUD | CRUD | CRU | - |
| Architect | CRU | CRUD | CRUD | R | - |
| Designer | R | CRU | CRU | R | - |
| Staff | R | CRU | R | R | - |
| Client | R | R | R | R | - |
| Contractor | R | RU | R | R | - |

---

## 8. Performance Optimization

### 8.1 Frontend Optimization

| Technique | Implementation |
|-----------|----------------|
| Code splitting | Lazy load routes and heavy components |
| Tree shaking | Vite automatically tree shakes |
| Image optimization | Sharp image processing |
| Caching | Service worker + localStorage |
| Bundle analysis | rollup-plugin-visualizer |

### 8.2 API Optimization

| Technique | Implementation |
|-----------|----------------|
| Request deduplication | Track pending requests |
| Response caching | Redis + memory cache |
| Pagination | Limit + offset patterns |
| Query optimization | Prisma includes + selects |
| Connection pooling | Prisma connection pool |

### 8.3 Database Optimization

```prisma
// Index strategy
model Task {
  // Single field indexes
  @@index([projectId])
  @@index([assignedToId])
  @@index([status])

  // Composite indexes
  @@index([projectId, status])
  @@index([assignedToId, dueDate])
}
```

### 8.4 Performance Budgets

| Metric | Budget | Current |
|--------|--------|---------|
| JS bundle (gzipped) | < 200KB | ~180KB |
| CSS bundle (gzipped) | < 50KB | ~35KB |
| LCP | < 2.5s | ~2.1s |
| FID | < 100ms | ~50ms |
| CLS | < 0.1 | ~0.05 |

---

## Appendix A: Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:7001
VITE_SOCKET_URL=http://localhost:7001
VITE_OPENROUTER_API_KEY=your_key

# Backend (.env)
NODE_ENV=development
PORT=7001
DATABASE_URL=postgresql://user:pass@localhost:5432/daritana
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=http://localhost:5174
```

---

## Appendix B: Critical Bug Fixes

### Port Configuration Issues

The following files have hardcoded fallback to port 5004 which should be 7001:

1. `src/services/api.ts` - Line 8
2. `src/lib/socket.ts` - Line 14
3. `src/services/documents.service.ts`
4. `src/services/chat.service.ts`
5. `src/services/video.service.ts`
6. `src/services/team.service.ts`
7. `src/services/teamChat.service.ts`
8. `src/services/virtualOffice.service.ts`
9. `src/services/virtualOfficeSimple.service.ts`

**Fix**: Replace `localhost:5004` with `localhost:7001` in all files.

### Environment Variable Issues

Files using Node.js `process.env` instead of Vite's `import.meta.env`:

1. `src/services/api.ts` - Line 64, 101, 171

**Fix**: Replace `process.env.NODE_ENV` with `import.meta.env.DEV` or `import.meta.env.MODE`.

---

**Document Control**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01 | Dev Team | Initial design |
| 2.0 | 2025-11-28 | Claude | Comprehensive review |
