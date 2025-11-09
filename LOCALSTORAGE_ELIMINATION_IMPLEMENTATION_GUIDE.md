# localStorage Elimination - Complete Implementation Guide

## Executive Summary

**Scope**: 28 localStorage keys across 24 files
**Estimated Time**: 1-2 weeks (frontend + backend)
**Status**: ✅ Backend requirements documented, 🔄 Frontend partially complete
**Priority**: 🚨 CRITICAL - XSS security vulnerability

---

## What's Been Completed

### ✅ Phase 0: Analysis & Documentation (DONE)
1. ✅ Comprehensive audit of all localStorage usage (28 keys, 24 files)
2. ✅ Backend API requirements document created (`BACKEND_REQUIREMENTS_LOCALSTORAGE_ELIMINATION.md`)
3. ✅ Secure authStore implementation (`src/store/authStore.SECURE.ts`)
4. ✅ Implementation roadmap documented

---

## Implementation Phases

### 📋 Phase 1: Authentication & Security (Week 1) - CRITICAL

#### 1.1 Backend Implementation (3-4 days)

**Files to Create/Modify:**
```
backend/
├── middleware/
│   ├── auth.middleware.ts          (Create HTTP-Only cookie auth)
│   ├── organization.middleware.ts  (Organization context)
│   └── permission.middleware.ts    (Permission checks)
├── routes/
│   └── auth.routes.ts              (Add new endpoints)
├── controllers/
│   └── auth.controller.ts          (Implement login/logout/me/refresh)
└── models/
    └── User.model.ts                (Add onboarding flags)
```

**New API Endpoints Required:**
```
POST   /api/auth/login                  (Set HTTP-Only cookies)
POST   /api/auth/refresh                (Refresh access token)
GET    /api/auth/me                     (Get user + org + permissions)
POST   /api/auth/logout                 (Clear cookies)
POST   /api/auth/verify                 (Verify token)
POST   /api/auth/onboarding-complete    (Mark onboarding done)
```

**Database Migrations:**
```sql
-- Add onboarding flags to users table
ALTER TABLE users
  ADD COLUMN member_onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN vendor_onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN last_login_at TIMESTAMP,
  ADD COLUMN refresh_token_version INTEGER DEFAULT 0;

-- Add onboarding flag to organizations table
ALTER TABLE organizations
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN onboarding_completed_at TIMESTAMP;
```

**Environment Variables to Add:**
```bash
# .env
JWT_SECRET=your-super-secret-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_DOMAIN=.daritana.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=Strict
```

#### 1.2 Frontend Implementation (2-3 days)

**Step 1: Replace authStore**
```bash
# Backup current authStore
mv src/store/authStore.ts src/store/authStore.OLD.ts

# Use secure version
mv src/store/authStore.SECURE.ts src/store/authStore.ts
```

**Step 2: Update API Interceptors** (`src/services/api.ts`)

Current code (REMOVE):
```typescript
// REMOVE THIS:
let authToken: string | null = localStorage.getItem('access_token');

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
});
```

New code (ADD):
```typescript
// ADD THIS:
apiClient.interceptors.request.use((config) => {
  // Cookies sent automatically by browser
  // No manual Authorization header needed
  config.withCredentials = true; // Important!
  return config;
});

// 401 error handling - token expired
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear state and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Step 3: Update authService.ts**

Current code (REMOVE):
```typescript
// REMOVE ALL localStorage calls:
localStorage.setItem('access_token', ...);
localStorage.getItem('access_token');
localStorage.removeItem('access_token');
```

New code (ADD):
```typescript
// Tokens managed by HTTP-Only cookies
// No manual token storage needed
class AuthService {
  getAccessToken(): string | null {
    // Get from authStore memory (for debugging only)
    return useAuthStore.getState().user ? 'valid' : null;
  }

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }
}
```

**Step 4: Update App.tsx Initialization**

Add to `App.tsx`:
```typescript
useEffect(() => {
  // Check auth on app load (calls /api/auth/me)
  useAuthStore.getState().checkAuth();
}, []);
```

**Files to Modify:**
- [ ] `src/store/authStore.ts` (replace with SECURE version)
- [ ] `src/services/api.ts` (update interceptors)
- [ ] `src/services/authService.ts` (remove localStorage)
- [ ] `src/utils/auth.ts` (deprecate or update)
- [ ] `src/App.tsx` (add auth check on mount)

---

### 📋 Phase 2: Permissions & Organization (Week 2)

#### 2.1 Backend Implementation (2 days)

**New API Endpoints:**
```
GET    /api/auth/permissions             (Get user permissions)
GET    /api/permissions/groups           (List permission groups - admin)
POST   /api/permissions/groups           (Create group - admin)
PATCH  /api/permissions/groups/:id       (Update group - admin)
```

#### 2.2 Frontend Implementation (2 days)

**Step 1: Update permissionsStore** (`src/store/permissionsStore.ts`)

REMOVE:
```typescript
persist(..., { name: 'permissions-storage' })
```

ADD:
```typescript
export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  // NO persist middleware

  fetchPermissions: async () => {
    const response = await fetch('http://localhost:7001/api/auth/permissions', {
      credentials: 'include'
    });
    const data = await response.json();
    set({ permissions: data.permissions });
  }
}));
```

**Step 2: Update teamStore** (`src/store/teamStore.ts`)

REMOVE:
```typescript
const currentUserId = localStorage.getItem('userId') || 'current-user';
```

ADD:
```typescript
const currentUserId = useAuthStore.getState().user?.id || 'current-user';
```

**Step 3: Update Service Files**

Remove from ALL services:
```typescript
// REMOVE from:
// - src/services/settings.service.ts
// - src/services/team.service.ts
// - src/services/documents.service.ts
// - src/services/construction.service.ts

// REMOVE THIS:
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const organizationId = localStorage.getItem('organizationId');
```

**Files to Modify:**
- [ ] `src/store/permissionsStore.ts`
- [ ] `src/store/teamStore.ts`
- [ ] `src/services/settings.service.ts`
- [ ] `src/services/team.service.ts`
- [ ] `src/services/documents.service.ts`
- [ ] `src/services/construction.service.ts`
- [ ] `src/pages/TeamPage.tsx`

---

### 📋 Phase 3: UI State & Onboarding (Week 3)

#### 3.1 Create Onboarding Store (1 day)

**New File:** `src/store/onboardingStore.ts`

```typescript
import { create } from 'zustand';

interface OnboardingState {
  // Temporary form data (memory only)
  organizationData: {
    name: string;
    type: string;
    size: string;
    country: string;
    description: string;
  } | null;

  projectTemplates: string[];
  integrations: string[];

  // Methods
  setOrganizationData: (data: any) => void;
  setProjectTemplates: (templates: string[]) => void;
  setIntegrations: (integrations: string[]) => void;
  clearOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  organizationData: null,
  projectTemplates: [],
  integrations: [],

  setOrganizationData: (data) => set({ organizationData: data }),
  setProjectTemplates: (templates) => set({ projectTemplates: templates }),
  setIntegrations: (integrations) => set({ integrations }),
  clearOnboarding: () => set({
    organizationData: null,
    projectTemplates: [],
    integrations: []
  })
}));

// NO localStorage - state resets on page refresh (expected for multi-step forms)
```

#### 3.2 Update Onboarding Components (1-2 days)

**File:** `src/components/onboarding/OnboardingWizard.tsx`

REMOVE:
```typescript
const savedData = localStorage.getItem('companyRegistrationData');
localStorage.setItem('organizationName', orgResult.name);
localStorage.setItem('projectTemplates', JSON.stringify(selectedTemplates));
localStorage.setItem('integrations', JSON.stringify(selectedIntegrations));
```

ADD:
```typescript
import { useOnboardingStore } from '@/store/onboardingStore';

// In component:
const { organizationData, setOrganizationData } = useOnboardingStore();

// Load from store instead of localStorage
useEffect(() => {
  if (organizationData) {
    // Pre-populate from store
  }
}, []);
```

**File:** `src/pages/CompanyRegistration.tsx`

REMOVE:
```typescript
localStorage.setItem('companyRegistrationData', JSON.stringify(formData));
```

ADD:
```typescript
import { useOnboardingStore } from '@/store/onboardingStore';

// Save to zustand store
useOnboardingStore.getState().setOrganizationData(formData);
```

#### 3.3 Migrate Cache to IndexedDB (2 days)

**File:** `src/utils/caching.ts`

ADD IndexedDB wrapper:
```typescript
class IndexedDBCacheManager extends CacheManager {
  private db: IDBDatabase | null = null;
  private dbName = 'daritana-cache';
  private storeName = 'api-cache';

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async set(key: string, value: any, ttl?: number) {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const data = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 0
    };

    return new Promise((resolve, reject) => {
      const request = store.put(data, key);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string) {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const data = request.result;

        if (!data) {
          resolve(null);
          return;
        }

        // Check TTL
        if (data.ttl && Date.now() - data.timestamp > data.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(data.value);
      };
      request.onerror = () => resolve(null);
    });
  }

  async delete(key: string) {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.delete(key);
  }
}

// Use IndexedDB instead of localStorage
export const cache = new IndexedDBCacheManager({
  maxSize: 100, // 100 MB
  defaultTTL: 1000 * 60 * 60 * 24 // 24 hours
});
```

#### 3.4 Update Layout Storage (1 day)

**File:** `src/services/layoutStorage.ts`

CHANGE:
```typescript
// FROM:
export const layoutStorage: LayoutStorageService = new LocalStorageLayoutService();

// TO:
export const layoutStorage: LayoutStorageService = new APILayoutService();
```

Backend must implement:
- GET /api/layouts
- POST /api/layouts
- PATCH /api/layouts/:id
- DELETE /api/layouts/:id

**Files to Create/Modify:**
- [ ] `src/store/onboardingStore.ts` (create)
- [ ] `src/components/onboarding/OnboardingWizard.tsx`
- [ ] `src/pages/CompanyRegistration.tsx`
- [ ] `src/utils/caching.ts` (add IndexedDB)
- [ ] `src/services/layoutStorage.ts`

---

### 📋 Phase 4: Cleanup & Testing (Week 4)

#### 4.1 Remove Deprecated Files (1 hour)

```bash
# Delete these files:
rm src/utils/fixPermissions.ts
rm src/utils/resetPermissions.ts
rm src/store/authStore.OLD.ts  # After testing

# Verify no localStorage usage:
grep -r "localStorage\." src/ --exclude-dir=node_modules --exclude="*.OLD.*"
# Should return 0 results!
```

#### 4.2 Update Security Utils (1 day)

**File:** `src/utils/security.ts`

CHANGE:
```typescript
// FROM localStorage:
localStorage.setItem(`secure_${key}`, encrypted);

// TO sessionStorage (for true temporary data):
sessionStorage.setItem(`secure_${key}`, encrypted);

// OR better: Remove if not needed
```

#### 4.3 Update Test Files (1 day)

**File:** `src/tests/workflows/userWorkflows.ts`

REMOVE:
```typescript
const token = localStorage.getItem('access_token');
const user = localStorage.getItem('user_data');
```

ADD:
```typescript
// Use test context instead
const { authStore } = testContext;
const isAuthenticated = authStore.isAuthenticated;
```

#### 4.4 Testing Checklist

**Authentication Tests:**
- [ ] Login sets HTTP-Only cookies
- [ ] Logout clears cookies
- [ ] Page refresh maintains session (calls /api/auth/me)
- [ ] Token expiry triggers re-login
- [ ] Multiple tabs share same session
- [ ] Logout from one tab logs out all tabs

**Security Tests:**
- [ ] `document.cookie` cannot read tokens
- [ ] DevTools > Application > localStorage is empty
- [ ] XSS attacks cannot steal tokens
- [ ] CSRF protection works (SameSite cookies)

**Functionality Tests:**
- [ ] All pages load correctly
- [ ] Permissions check properly
- [ ] Onboarding flow works
- [ ] Team invitations work
- [ ] Layout saving works (via API)
- [ ] Cache works (via IndexedDB)

---

## Quick Reference: Files to Modify

### 🔴 CRITICAL (Phase 1) - Week 1
```
src/store/authStore.ts                   - Replace with SECURE version
src/services/api.ts                      - Update interceptors
src/services/authService.ts              - Remove localStorage
src/utils/auth.ts                        - Update or deprecate
src/App.tsx                              - Add auth check on mount
```

### 🟡 HIGH (Phase 2) - Week 2
```
src/store/permissionsStore.ts           - Remove persist
src/store/teamStore.ts                   - Remove localStorage.getItem('userId')
src/services/settings.service.ts         - Remove token reading
src/services/team.service.ts             - Remove token reading
src/services/documents.service.ts        - Remove token reading
src/services/construction.service.ts     - Remove token reading
src/pages/TeamPage.tsx                   - Use authStore.user.id
```

### 🟢 MEDIUM (Phase 3) - Week 3
```
src/store/onboardingStore.ts            - Create new file
src/components/onboarding/OnboardingWizard.tsx  - Use zustand store
src/pages/CompanyRegistration.tsx       - Use zustand store
src/utils/caching.ts                     - Add IndexedDB option
src/services/layoutStorage.ts           - Switch to API service
src/utils/security.ts                    - Use sessionStorage
```

### 🔵 LOW (Phase 4) - Week 4
```
src/utils/fixPermissions.ts             - DELETE
src/utils/resetPermissions.ts           - DELETE
src/tests/workflows/userWorkflows.ts    - Update tests
```

---

## Command Line Verification

After each phase, verify progress:

```bash
# Check remaining localStorage usage
grep -r "localStorage\." src/ --exclude-dir=node_modules | wc -l

# Phase 1 target: <15 occurrences
# Phase 2 target: <10 occurrences
# Phase 3 target: <5 occurrences
# Phase 4 target: 0 occurrences
```

---

## Rollback Plan

If issues occur during deployment:

1. **Immediate Rollback:**
   ```bash
   # Restore old authStore
   mv src/store/authStore.OLD.ts src/store/authStore.ts
   npm run build
   ```

2. **Backend Rollback:**
   - Keep old token-in-body response format
   - Add new cookie-based endpoints in parallel
   - Switch frontend gradually

3. **Feature Flag:**
   ```typescript
   const USE_COOKIE_AUTH = process.env.VITE_USE_COOKIE_AUTH === 'true';
   ```

---

## Success Metrics

After full implementation:

- ✅ `grep -r "localStorage" src/` returns 0 results
- ✅ All tokens in HTTP-Only cookies
- ✅ DevTools > localStorage is empty
- ✅ No XSS vulnerability
- ✅ Session persists across refreshes
- ✅ All tests passing
- ✅ Zero production errors

---

## Timeline Summary

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| 1. Auth & Security | 1 week | CRITICAL | Backend cookies |
| 2. Permissions | 1 week | HIGH | Phase 1 |
| 3. UI State | 1 week | MEDIUM | Phase 1, 2 |
| 4. Cleanup | 1 week | LOW | Phase 1, 2, 3 |

**Total: 3-4 weeks for complete implementation**

---

## Next Steps

1. **Backend Team:** Implement HTTP-Only cookie authentication (see `BACKEND_REQUIREMENTS_LOCALSTORAGE_ELIMINATION.md`)
2. **Frontend Team:** Replace authStore with secure version
3. **QA Team:** Test authentication flows
4. **DevOps:** Update environment variables
5. **Security:** Audit implementation

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2025-01-08
