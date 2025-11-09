# 🎯 Frontend-Backend End-to-End Integration Test Guide

**Date**: 2025-11-08
**System**: Daritana Architecture Management Platform
**Frontend**: http://127.0.0.1:5174/
**Backend**: http://localhost:7001

---

## 🚀 System Status

### Services Running
- ✅ **Backend API**: Running on port 7001
- ✅ **PostgreSQL Database**: Connected and operational
- ✅ **Frontend Dev Server**: Running on port 5174
- ✅ **Real-time WebSocket**: Available on backend

### Test Environment
- **Backend**: Express.js + TypeScript + PostgreSQL 16
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand stores with persistence
- **API Client**: Axios with interceptors
- **Authentication**: JWT tokens

---

## 📋 Comprehensive E2E Test Checklist

### Phase 1: Authentication & Authorization (Critical)

#### Test 1.1: Login Flow - Admin
**Steps**:
1. Open browser to http://127.0.0.1:5174/
2. Navigate to Login page
3. Enter credentials:
   - Email: `admin@daritana.com`
   - Password: `admin123`
4. Click "Log In"

**Expected Results**:
- ✅ Login request sent to POST /api/auth/login
- ✅ JWT token received and stored in localStorage
- ✅ User data stored in auth store
- ✅ Redirect to /dashboard
- ✅ Header shows user name "Admin User"
- ✅ Sidebar visible with all menu items

**Backend Verification**:
```bash
# Check login endpoint
curl -X POST http://localhost:7001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daritana.com","password":"admin123"}'
```

---

#### Test 1.2: Login Flow - Project Lead
**Steps**:
1. Logout (if logged in)
2. Login with:
   - Email: `john@daritana.com`
   - Password: `password123`

**Expected Results**:
- ✅ Successful login
- ✅ Dashboard shows project lead-specific view
- ✅ Can see "Create Project" button
- ✅ Sidebar shows appropriate menu items

---

#### Test 1.3: Login Flow - Designer
**Steps**:
1. Logout
2. Login with:
   - Email: `jane@daritana.com`
   - Password: `password123`

**Expected Results**:
- ✅ Successful login
- ✅ Dashboard shows designer-specific view
- ✅ Can access Kanban board
- ✅ Can update task status

---

#### Test 1.4: Login Flow - Client
**Steps**:
1. Logout
2. Login with:
   - Email: `client@daritana.com`
   - Password: `password123`

**Expected Results**:
- ✅ Successful login
- ✅ Dashboard shows client-specific view
- ✅ Limited access (read-only for most features)
- ✅ Can view projects and tasks

---

#### Test 1.5: Invalid Credentials
**Steps**:
1. Try to login with:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`

**Expected Results**:
- ❌ Login fails
- ✅ Error message displayed
- ✅ User remains on login page
- ✅ No token stored

---

#### Test 1.6: Token Persistence
**Steps**:
1. Login as admin
2. Refresh the page (F5)

**Expected Results**:
- ✅ User remains logged in
- ✅ Dashboard loads correctly
- ✅ No redirect to login page
- ✅ Token retrieved from localStorage

---

### Phase 2: Dashboard & Data Loading

#### Test 2.1: Dashboard Statistics
**Steps**:
1. Login as admin
2. View dashboard

**Expected Results**:
- ✅ GET /api/dashboard called automatically
- ✅ Statistics cards show data:
  - Total Projects count
  - Active Projects count
  - Total Tasks count
  - Team Members count
- ✅ Recent projects list populated
- ✅ User's tasks list populated
- ✅ Recent activity feed populated

**Frontend Check** (Open DevTools Console):
```javascript
// Check if dashboard data loaded
console.log(window.localStorage.getItem('auth-storage'));
```

---

#### Test 2.2: Dashboard Role-Specific Views
**Steps**:
1. Login as different roles and compare dashboards

**Expected Results**:
- ✅ Admin sees full statistics
- ✅ Project Lead sees project-focused view
- ✅ Designer sees task-focused view
- ✅ Client sees limited view

---

### Phase 3: Project Management

#### Test 3.1: View Projects List
**Steps**:
1. Login as admin
2. Navigate to /projects

**Expected Results**:
- ✅ GET /api/projects called
- ✅ Projects list displays
- ✅ Each project shows:
  - Project name
  - Status badge
  - Progress bar
  - Priority indicator
  - Location
- ✅ Filtering options available
- ✅ Search functionality works

**Frontend Verification**:
- Open Network tab in DevTools
- Look for GET request to http://localhost:7001/api/projects
- Check response data

---

#### Test 3.2: Create New Project (Admin/Project Lead)
**Steps**:
1. Login as admin or project_lead
2. Go to /projects
3. Click "Create Project" button
4. Fill in form:
   - Name: "Test E2E Project"
   - Description: "End-to-end testing project"
   - Status: "Planning"
   - Priority: "High"
   - Budget: 500000
   - Location: "Kuala Lumpur"
   - Type: "Residential"
5. Click "Create"

**Expected Results**:
- ✅ POST /api/projects called with form data
- ✅ Response status 201 with project ID
- ✅ Success notification shown
- ✅ Project appears in projects list
- ✅ Redirect to project detail page

**Backend Verification**:
```bash
# Check if project was created
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:7001/api/projects
```

---

#### Test 3.3: View Project Details
**Steps**:
1. Click on a project from the list

**Expected Results**:
- ✅ GET /api/projects/:id called
- ✅ Project detail page loads
- ✅ Shows all project information
- ✅ Shows tasks related to project
- ✅ Shows team members
- ✅ Shows project timeline

---

#### Test 3.4: Update Project
**Steps**:
1. Open a project detail page
2. Click "Edit" button
3. Change status to "Active"
4. Click "Save"

**Expected Results**:
- ✅ PUT /api/projects/:id called
- ✅ Success message displayed
- ✅ Project status updated in UI
- ✅ Changes persisted in database

---

### Phase 4: Task Management (Kanban Board)

#### Test 4.1: View Kanban Board
**Steps**:
1. Login as any role
2. Navigate to /kanban or /tasks

**Expected Results**:
- ✅ GET /api/tasks called
- ✅ Kanban board displays with columns:
  - To Do
  - In Progress
  - Review
  - Done
- ✅ Tasks populate in correct columns based on status
- ✅ Each task card shows:
  - Title
  - Priority badge
  - Assignee
  - Due date
  - Project name

---

#### Test 4.2: Create New Task
**Steps**:
1. Login as admin or designer
2. Go to Kanban board
3. Click "Add Task" or "+" button
4. Fill form:
   - Title: "Test E2E Task"
   - Description: "Testing task creation"
   - Status: "todo"
   - Priority: "High"
   - Project: Select a project
   - Estimated Hours: 8
5. Click "Create"

**Expected Results**:
- ✅ POST /api/tasks called with task data
- ✅ Supports both camelCase and snake_case parameters
- ✅ Response status 201 with task ID
- ✅ Task appears in "To Do" column
- ✅ Success notification shown

---

#### Test 4.3: Drag and Drop Task
**Steps**:
1. On Kanban board
2. Drag a task from "To Do" to "In Progress"

**Expected Results**:
- ✅ PATCH /api/tasks/:id called with new status
- ✅ Task moves to new column in UI
- ✅ Status updated in database
- ✅ Optimistic UI update (moves immediately)
- ✅ Reverts if API call fails

---

#### Test 4.4: Update Task Details
**Steps**:
1. Click on a task card
2. Modal/detail view opens
3. Edit task fields
4. Click "Save"

**Expected Results**:
- ✅ PUT /api/tasks/:id called
- ✅ Task updated successfully
- ✅ Changes reflected in Kanban board
- ✅ Success notification shown

---

### Phase 5: User Management

#### Test 5.1: View Team Members
**Steps**:
1. Login as any role
2. Navigate to Team or Users section

**Expected Results**:
- ✅ GET /api/users called
- ✅ List of users displayed with:
  - Name
  - Email
  - Role
  - Department
  - Position
- ✅ Search/filter functionality works

---

#### Test 5.2: View User Profile
**Steps**:
1. Click on user avatar or profile menu
2. Select "Profile" or "My Profile"

**Expected Results**:
- ✅ GET /api/auth/me called
- ✅ Current user data displayed
- ✅ Profile information shown:
  - Name
  - Email
  - Role
  - Department

---

#### Test 5.3: Update User Profile
**Steps**:
1. Go to profile page
2. Click "Edit Profile"
3. Change first name and last name
4. Click "Save"

**Expected Results**:
- ✅ PUT /api/users/me called
- ✅ Success message shown
- ✅ Name updated in header
- ✅ Changes persisted

---

### Phase 6: Settings & Preferences

#### Test 6.1: View Settings
**Steps**:
1. Navigate to Settings page

**Expected Results**:
- ✅ GET /api/settings called
- ✅ Settings page displays with tabs/sections:
  - General
  - Notifications
  - Appearance
  - Privacy
- ✅ Current settings loaded from backend

---

#### Test 6.2: Update Settings
**Steps**:
1. On Settings page
2. Change theme to "Dark" or "Light"
3. Change language preference
4. Toggle notification settings
5. Click "Save"

**Expected Results**:
- ✅ PUT /api/settings called with updated values
- ✅ Success message displayed
- ✅ Settings persisted in database
- ✅ UI reflects changes immediately (theme change visible)

---

#### Test 6.3: Settings Persistence
**Steps**:
1. Update settings
2. Logout
3. Login again

**Expected Results**:
- ✅ Settings still applied
- ✅ Theme/language preferences maintained
- ✅ GET /api/settings returns saved values

---

### Phase 7: Notifications

#### Test 7.1: View Notifications
**Steps**:
1. Click on notifications icon in header

**Expected Results**:
- ✅ GET /api/notifications called
- ✅ Notifications dropdown/panel opens
- ✅ List of notifications displayed
- ✅ Unread count badge shows correct number

---

#### Test 7.2: Mark Notification as Read
**Steps**:
1. Open notifications
2. Click on an unread notification

**Expected Results**:
- ✅ PATCH /api/notifications/:id/read called
- ✅ Notification marked as read
- ✅ Unread count decreases
- ✅ Visual indication changes (bold → regular)

---

#### Test 7.3: Mark All as Read
**Steps**:
1. Open notifications
2. Click "Mark all as read" button

**Expected Results**:
- ✅ PATCH /api/notifications/mark-all-read called
- ✅ All notifications marked as read
- ✅ Unread count becomes 0
- ✅ Badge hidden/shows 0

---

### Phase 8: Team Collaboration

#### Test 8.1: View Team Analytics
**Steps**:
1. Navigate to Team section
2. View Analytics tab

**Expected Results**:
- ✅ GET /api/team/analytics called
- ✅ Analytics displayed:
  - Total team members
  - Active projects
  - Productivity metrics
  - Utilization rates

---

#### Test 8.2: View Team Workload
**Steps**:
1. Go to Team Workload view

**Expected Results**:
- ✅ GET /api/team/workload called
- ✅ Workload chart/list displayed showing:
  - Each team member
  - Number of assigned tasks
  - Capacity
  - Utilization percentage

---

#### Test 8.3: Team Presence
**Steps**:
1. View team members list

**Expected Results**:
- ✅ GET /api/team/presence/online called
- ✅ Online/offline indicators shown
- ✅ Status updated in real-time (if WebSocket connected)

---

### Phase 9: Advanced Features

#### Test 9.1: Documents/Files
**Steps**:
1. Navigate to Documents section

**Expected Results**:
- ✅ GET /api/documents called
- ✅ Documents list displayed (may be empty)
- ✅ GET /api/documents/statistics called
- ✅ Statistics shown (may be zero)

---

#### Test 9.2: Financial Module
**Steps**:
1. Navigate to Financial section

**Expected Results**:
- ✅ GET /api/financial/invoices called
- ✅ GET /api/financial/expenses called
- ✅ GET /api/financial/analytics called
- ✅ Financial dashboard loads (may show empty state)

---

#### Test 9.3: HR Module
**Steps**:
1. Navigate to HR section

**Expected Results**:
- ✅ GET /api/hr/statistics called
- ✅ HR statistics displayed

---

#### Test 9.4: Learning Platform
**Steps**:
1. Navigate to Learning section

**Expected Results**:
- ✅ GET /api/learning/courses called
- ✅ Courses list displayed

---

#### Test 9.5: Marketplace
**Steps**:
1. Navigate to Marketplace

**Expected Results**:
- ✅ GET /api/marketplace/products called
- ✅ Products list displayed

---

### Phase 10: Error Handling & Edge Cases

#### Test 10.1: Network Error Handling
**Steps**:
1. Stop the backend server
2. Try to perform any action (create project, task, etc.)

**Expected Results**:
- ✅ Error toast/notification displayed
- ✅ User-friendly error message shown
- ✅ UI doesn't break
- ✅ Error logged to console

---

#### Test 10.2: Session Expiry
**Steps**:
1. Login
2. Manually delete JWT token from localStorage
3. Try to navigate or perform action

**Expected Results**:
- ✅ Redirect to login page
- ✅ Session expired message shown
- ✅ No errors in console

---

#### Test 10.3: Concurrent Updates
**Steps**:
1. Open same project in two browser tabs
2. Update project in tab 1
3. Update same project in tab 2

**Expected Results**:
- ✅ Both updates processed
- ✅ Last update wins (expected behavior)
- ✅ No data corruption
- ✅ Proper conflict handling (if implemented)

---

## 🔧 Testing Tools

### Browser DevTools Checklist

#### Console Tab
Check for:
- ❌ No JavaScript errors
- ❌ No unhandled promise rejections
- ✅ API logs showing requests (if enabled)

#### Network Tab
Verify:
- ✅ All API calls to http://localhost:7001
- ✅ Correct HTTP methods (GET, POST, PUT, PATCH)
- ✅ Response status codes (200, 201, 401, etc.)
- ✅ Request/response payloads correct
- ✅ Authorization headers present on protected routes

#### Application Tab
Check:
- ✅ localStorage contains:
  - `access_token` (JWT)
  - `refresh_token`
  - `auth-storage` (Zustand persist)
- ✅ Cookies (if used)
- ✅ Session storage

---

## 🧪 Automated Testing Commands

### Backend API Tests
```bash
# Run comprehensive backend tests
cd backend
node comprehensive-integration-test.js

# Expected: 95.7% pass rate (66/69 tests)
```

### Frontend Build Test
```bash
# Test production build
npm run build

# Expected: Build completes without errors
# Output in dist/ directory
```

### Frontend Linting
```bash
# Check code quality
npm run lint

# Expected: No linting errors
```

---

## 📊 Test Results Template

### Test Execution Summary

| Phase | Tests | Passed | Failed | Notes |
|-------|-------|--------|--------|-------|
| Phase 1: Auth | 6 | __ | __ | |
| Phase 2: Dashboard | 2 | __ | __ | |
| Phase 3: Projects | 4 | __ | __ | |
| Phase 4: Tasks | 4 | __ | __ | |
| Phase 5: Users | 3 | __ | __ | |
| Phase 6: Settings | 3 | __ | __ | |
| Phase 7: Notifications | 3 | __ | __ | |
| Phase 8: Team | 3 | __ | __ | |
| Phase 9: Advanced | 5 | __ | __ | |
| Phase 10: Errors | 3 | __ | __ | |
| **TOTAL** | **36** | **__** | **__** | |

---

## 🐛 Issue Tracking Template

### Found Issues

| ID | Severity | Component | Description | Status |
|----|----------|-----------|-------------|--------|
| E2E-001 | | | | |
| E2E-002 | | | | |

Severity Levels:
- **Critical**: Blocks core functionality
- **High**: Major feature broken
- **Medium**: Feature partially working
- **Low**: Minor UI/UX issue
- **Info**: Enhancement suggestion

---

## ✅ Sign-Off Checklist

- [ ] All Phase 1 tests passing (Authentication)
- [ ] All Phase 2 tests passing (Dashboard)
- [ ] All Phase 3 tests passing (Projects)
- [ ] All Phase 4 tests passing (Tasks/Kanban)
- [ ] All Phase 5 tests passing (Users)
- [ ] All Phase 6 tests passing (Settings)
- [ ] All Phase 7 tests passing (Notifications)
- [ ] All Phase 8 tests passing (Team)
- [ ] All Phase 9 tests passing (Advanced Features)
- [ ] All Phase 10 tests passing (Error Handling)
- [ ] No console errors in browser
- [ ] All API calls successful in Network tab
- [ ] localStorage data correct
- [ ] Production build successful
- [ ] No linting errors

---

## 🎯 Quick Test URLs

### Frontend Pages
- Login: http://127.0.0.1:5174/login
- Dashboard: http://127.0.0.1:5174/dashboard
- Projects: http://127.0.0.1:5174/projects
- Kanban: http://127.0.0.1:5174/kanban
- Tasks: http://127.0.0.1:5174/tasks
- Timeline: http://127.0.0.1:5174/timeline
- Team: http://127.0.0.1:5174/team
- Settings: http://127.0.0.1:5174/settings

### API Endpoints
- Health: http://localhost:7001/health
- Login: POST http://localhost:7001/api/auth/login
- Projects: http://localhost:7001/api/projects
- Tasks: http://localhost:7001/api/tasks
- Dashboard: http://localhost:7001/api/dashboard

---

## 📞 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@daritana.com | admin123 |
| Project Lead | john@daritana.com | password123 |
| Designer | jane@daritana.com | password123 |
| Client | client@daritana.com | password123 |

---

**Report Generated**: 2025-11-08
**Frontend URL**: http://127.0.0.1:5174/
**Backend URL**: http://localhost:7001
**Database**: PostgreSQL 16
**Test Suite Version**: 1.0.0
