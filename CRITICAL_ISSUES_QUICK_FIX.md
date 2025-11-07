# Daritana Codebase - QUICK REFERENCE: Critical Issues

## 🔴 MUST FIX IMMEDIATELY (Blocking Production)

### Issue #1: Double API Path Bug
**Files Affected:** 
- `/src/services/settings.service.ts` (line 4-12)
- `/src/lib/api.ts` (line 4)

**Problem:**
```
Console Error: GET http://localhost:7001/api/api/settings 404
```

**Root Cause:**
```typescript
// In .env:
VITE_API_URL=http://localhost:7001/api

// In settings.service.ts:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';
const api = axios.create({
  baseURL: `${API_URL}/api`,  // ADDS /api again!
  // Result: http://localhost:7001/api/api
});
```

**Fix Options (pick one):**

**Option A:** Fix .env
```env
# Change from:
VITE_API_URL=http://localhost:7001/api

# To:
VITE_API_URL=http://localhost:7001
```

**Option B:** Fix settings.service.ts
```typescript
// Line 8, change from:
baseURL: `${API_URL}/api`,

// To:
baseURL: API_URL, // Assume URL already has /api or make it explicit
```

---

### Issue #2: Backend Server Not Running
**Impact:** ALL API calls fail with ECONNREFUSED

**Status:** 
- Backend code exists at `/home/user/daritana/backend/`
- Port 7001 is empty
- No Express server process running

**To Fix:**
```bash
cd /home/user/daritana/backend
npm install
npm run prisma:generate
npm run dev
```

**Expected Output:**
```
🚀 Server running on http://localhost:7001
```

---

### Issue #3: Notification Store Runtime Error
**File:** `/src/store/notificationStore.ts` (line 68)

**Error:** `Cannot read properties of undefined (reading 'unreadCount')`

**Problem:**
```typescript
const response = await notificationsApi.getUnreadCount();
// response is undefined when API call fails
// Then tries: response?.data?.unreadCount ?? response?.unreadCount
// Still crashes because response itself is undefined
```

**Fix:**
```typescript
// Line 64-73, change from:
getUnreadCount: async () => {
  try {
    const response = await notificationsApi.getUnreadCount();
    const count = response?.data?.unreadCount ?? response?.unreadCount ?? 0;
    set({ unreadCount: count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
  }
},

// To:
getUnreadCount: async () => {
  try {
    const response = await notificationsApi.getUnreadCount();
    if (!response) {
      set({ unreadCount: 0 });
      return;
    }
    const count = response?.data?.unreadCount ?? response?.unreadCount ?? 0;
    set({ unreadCount: count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
    set({ unreadCount: 0 });
  }
},
```

---

### Issue #4: Database Not Connected
**Impact:** All backend operations use in-memory/mock data

**Status:**
- Prisma schema defined (76 models)
- No DATABASE_URL in .env
- No migrations executed

**To Fix:**
```bash
# 1. Setup PostgreSQL locally or get connection string
# 2. Add to backend/.env:
DATABASE_URL="postgresql://user:password@localhost:5432/daritana"

# 3. Run migrations:
cd backend
npm run prisma:migrate

# 4. Seed test data:
npm run prisma:seed
```

---

## 🟡 HIGH PRIORITY (Next Phase)

### Issue #5: Mixed Mock and Real Data
**Scope:** 15+ stores using both mock fallbacks and real API

**Files:**
- `src/store/authStore.ts`
- `src/store/projectStore.ts`
- `src/store/financialStore.ts`
- `src/store/dashboardStore.ts`
- Multiple others

**Impact:** Unpredictable behavior, hard to debug

**Fix:** Audit each store and remove all mock data fallbacks once backend is stable

---

### Issue #6: Settings Routes Configuration
**Current:** Registered in server.ts directly
**Better:** Should be imported in routes/index.ts

**Files:**
- `/backend/src/routes/index.ts` - Missing settings import
- `/backend/src/routes/settings.routes.ts` - Exists but not used
- `/backend/src/routes/settings-simple.routes.ts` - Currently used

**Fix:**
```typescript
// In routes/index.ts, add:
import settingsRoutes from './settings.routes'

// In router registration, add:
router.use('/settings', settingsRoutes)
```

---

### Issue #7: Missing Real-time Implementation
**Components Affected:**
- Activity feeds (using setTimeout mock)
- Presence indicators (mock WebSocket)
- Live cursors (not implemented)
- Real-time notifications (not working)

**Current:** `mockWebsocket.service.ts` with fake implementations

**Needed:**
- Actual Socket.io server in backend
- Real WebSocket connections
- Server-side event handlers

**Status:** Socket.io server code exists but not fully connected

---

## 📊 CURRENT STATE SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend** | ✅ 95% | 251 components, 36 pages, all UI complete |
| **Backend** | ⚠️ 70% | Code exists, not running, not connected to DB |
| **Database** | ❌ 0% | Schema defined, not connected, no migrations |
| **API Integration** | ⚠️ 60% | Routes defined, but 404 errors on some endpoints |
| **Real-time** | ❌ 0% | All mock, no actual WebSocket |
| **Payment** | ⚠️ 40% | Stripe only, no FPX, no webhook handling |
| **Email** | ❌ 0% | No configuration, no testing |
| **File Storage** | ⚠️ 30% | Local storage works, no cloud integration |
| **Testing** | ❌ 5% | Minimal test files, no E2E tests |

---

## QUICK VERIFICATION CHECKLIST

- [ ] Fix API URL (settings.service.ts OR .env)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Check port 7001 responds: `curl http://localhost:7001/health`
- [ ] Verify no console errors in browser
- [ ] Test login works
- [ ] Test settings API call works

---

## ESTIMATED EFFORT TO PRODUCTION

| Phase | Tasks | Estimated Time |
|-------|-------|-----------------|
| **Phase 1: Critical Fixes** | Fix API URL, start backend, fix notifications | **1-2 days** |
| **Phase 2: Database Setup** | Connect PostgreSQL, run migrations, seed data | **2-3 days** |
| **Phase 3: API Testing** | Test all 51 endpoints, fix failures | **3-5 days** |
| **Phase 4: Real-time** | Implement Socket.io, setup WebSocket | **3-5 days** |
| **Phase 5: External Services** | Email, payment, file storage | **5-7 days** |
| **Phase 6: Testing & Polish** | Unit tests, integration tests, optimization | **5-7 days** |

**Total: 3-4 weeks to production-ready**

---

## KEY FILES TO MONITOR

**Frontend:**
- `/src/services/settings.service.ts` - API URL bug
- `/src/lib/api.ts` - Main API configuration
- `/src/store/notificationStore.ts` - Runtime error
- `/src/App.tsx` - Main authentication logic

**Backend:**
- `/backend/src/server.ts` - Not running
- `/backend/src/routes/index.ts` - Route configuration
- `/backend/prisma/schema.prisma` - Database models
- `/backend/.env` - Configuration (missing DATABASE_URL)

**Config:**
- `/.env` - Frontend environment variables
- `/backend/.env` - Backend environment variables
- `/package.json` - Frontend dependencies
- `/backend/package.json` - Backend dependencies

