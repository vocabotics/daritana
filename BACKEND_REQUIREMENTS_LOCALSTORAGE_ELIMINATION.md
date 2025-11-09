# Backend Requirements for localStorage Elimination

## Overview
This document specifies the backend API changes required to eliminate ALL localStorage usage from the frontend and implement secure, HTTP-Only cookie-based authentication.

**Security Goal**: Remove XSS vulnerability by moving tokens from localStorage to HTTP-Only cookies.

---

## Phase 1: Authentication & Security (CRITICAL)

### 1.1 HTTP-Only Cookie Implementation

**Current Backend Behavior:**
```json
// POST /api/auth/login response
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {...},
  "organization": {...}
}
```

**Required Backend Behavior:**
```json
// POST /api/auth/login response
{
  "success": true,
  "user": {...},
  "organization": {...}
}

// PLUS: Set HTTP-Only cookies:
Set-Cookie: access_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
Set-Cookie: refresh_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=604800
```

**Cookie Configuration:**
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: HTTPS only (production)
- `SameSite=Strict`: CSRF protection
- `Path=/`: Available for all API requests
- `Max-Age`: 15min for access_token, 7 days for refresh_token

### 1.2 Required API Endpoints

#### A. `POST /api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- Status: 200 OK
- Cookies: Set access_token and refresh_token
- Body:
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "organizationId": "org-456",
    "permissions": ["project:read", "project:write", ...],
    "memberOnboardingCompleted": true,
    "vendorOnboardingCompleted": false
  },
  "organization": {
    "id": "org-456",
    "name": "ABC Architecture",
    "slug": "abc-architecture",
    "plan": "professional",
    "onboardingCompleted": true,
    ...
  }
}
```

#### B. `POST /api/auth/refresh`
**Request:**
- No body required
- Requires: refresh_token cookie

**Response:**
- Status: 200 OK
- Cookies: Set new access_token (and optionally rotate refresh_token)
- Body:
```json
{
  "success": true,
  "expiresIn": 900
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "REFRESH_TOKEN_EXPIRED",
  "message": "Please log in again"
}
```

#### C. `GET /api/auth/me`
**Request:**
- Requires: access_token cookie
- No body

**Response:**
- Status: 200 OK
- Body: (same as login response)
```json
{
  "user": {...},
  "organization": {...},
  "permissions": [...]
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

#### D. `POST /api/auth/logout`
**Request:**
- Requires: access_token cookie
- No body

**Response:**
- Status: 200 OK
- Cookies: Clear access_token and refresh_token
```
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```
- Body:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### E. `POST /api/auth/verify`
**Request:**
- Requires: access_token cookie
- No body

**Response:**
- Status: 200 OK
- Body:
```json
{
  "valid": true,
  "expiresIn": 450,
  "userId": "user-123"
}
```

#### F. `POST /api/auth/onboarding-complete`
**Request:**
- Requires: access_token cookie
- Body:
```json
{
  "type": "organization" | "member" | "vendor"
}
```

**Response:**
- Status: 200 OK
- Body:
```json
{
  "success": true,
  "user": {
    "memberOnboardingCompleted": true,
    ...
  }
}
```

---

## Phase 2: Permissions & Organization

### 2.1 Permissions Endpoint

#### A. `GET /api/auth/permissions`
**Request:**
- Requires: access_token cookie
- No body

**Response:**
- Status: 200 OK
- Body:
```json
{
  "permissions": [
    "project:read",
    "project:write",
    "project:delete",
    "document:read",
    "document:write",
    "team:invite",
    ...
  ],
  "roles": ["OWNER", "PROJECT_LEAD"],
  "groups": [
    {
      "id": "group-1",
      "name": "Project Managers",
      "permissions": ["project:read", "project:write"]
    }
  ]
}
```

### 2.2 Permission Management (Admin Only)

#### A. `GET /api/permissions/groups`
**Authorization:** Requires OWNER or ADMIN role

**Response:**
```json
{
  "groups": [
    {
      "id": "group-1",
      "name": "Project Managers",
      "description": "Can manage projects",
      "permissions": [...],
      "userCount": 5
    },
    ...
  ]
}
```

#### B. `POST /api/permissions/groups`
**Authorization:** Requires OWNER or ADMIN role

**Request:**
```json
{
  "name": "New Group",
  "description": "Description",
  "permissions": ["project:read", "project:write"]
}
```

**Response:**
```json
{
  "success": true,
  "group": {
    "id": "group-new",
    "name": "New Group",
    ...
  }
}
```

---

## Phase 3: Layout & Preferences

### 3.1 Layout Management

#### A. `GET /api/layouts`
**Request:**
- Requires: access_token cookie
- Query params: `?type=dashboard|kanban|calendar`

**Response:**
```json
{
  "layouts": [
    {
      "id": "layout-1",
      "name": "My Dashboard",
      "type": "dashboard",
      "config": {...},
      "isDefault": true,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    ...
  ]
}
```

#### B. `POST /api/layouts`
**Request:**
```json
{
  "name": "My Custom Layout",
  "type": "dashboard",
  "config": {
    "widgets": [...],
    "layout": [...],
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "layout": {
    "id": "layout-new",
    ...
  }
}
```

#### C. `PATCH /api/layouts/:id`
**Request:**
```json
{
  "name": "Updated Name",
  "config": {...}
}
```

**Response:**
```json
{
  "success": true,
  "layout": {...}
}
```

#### D. `DELETE /api/layouts/:id`
**Response:**
```json
{
  "success": true,
  "message": "Layout deleted"
}
```

#### E. `POST /api/layouts/:id/set-default`
**Response:**
```json
{
  "success": true,
  "layout": {
    "id": "layout-1",
    "isDefault": true
  }
}
```

#### F. `GET /api/layouts/default`
**Request:**
- Query params: `?type=dashboard`

**Response:**
```json
{
  "layout": {
    "id": "layout-1",
    ...
  }
}
```

---

## Phase 4: Organization Invitations

### 4.1 Team Member Invitations

#### A. `POST /api/organizations/:orgId/invite-members`
**Request:**
```json
{
  "members": [
    {
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STAFF",
      "department": "Architecture",
      "title": "Senior Architect"
    },
    ...
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "success": true,
      "email": "john@example.com",
      "invitationId": "inv-123",
      "invitationUrl": "https://app.daritana.com/invite/inv-123"
    },
    {
      "success": false,
      "email": "duplicate@example.com",
      "error": "User already exists in organization"
    }
  ],
  "successCount": 1,
  "failureCount": 1
}
```

**Backend Actions:**
1. Create invitation records in database
2. Generate unique invitation tokens
3. Send invitation emails via SMTP
4. Return invitation URLs for UI display

---

## Security Requirements

### CORS Configuration
```javascript
// Backend CORS settings
app.use(cors({
  origin: 'https://app.daritana.com', // Frontend URL
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id']
}));
```

### Cookie Security
- **Production:** `Secure=true` (HTTPS only)
- **Development:** `Secure=false` (allow HTTP)
- **SameSite:** `Strict` (CSRF protection)
- **HttpOnly:** `true` (XSS protection)

### Token Rotation
- Rotate refresh tokens on each use
- Invalidate old refresh tokens
- Track active sessions per user
- Allow session revocation

### Rate Limiting
- Login endpoint: 5 attempts per 15 minutes
- Refresh endpoint: 10 requests per minute
- Other endpoints: 100 requests per minute

---

## Middleware Requirements

### 1. Authentication Middleware
```typescript
// Verify access_token cookie on protected routes
async function authenticateRequest(req, res, next) {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No authentication token provided'
    });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.organizationId = decoded.organizationId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
}
```

### 2. Organization Context Middleware
```typescript
// Extract organization from user context
async function organizationContext(req, res, next) {
  if (req.userId) {
    const user = await User.findById(req.userId).populate('organization');
    req.organization = user.organization;
  }
  next();
}
```

### 3. Permission Check Middleware
```typescript
// Verify user has required permissions
function requirePermission(permission: string) {
  return async (req, res, next) => {
    const userPermissions = await getUserPermissions(req.userId);

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Permission required: ${permission}`
      });
    }

    next();
  };
}
```

---

## Database Schema Changes

### User Table
Add columns:
```sql
ALTER TABLE users ADD COLUMN member_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN vendor_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN refresh_token_version INTEGER DEFAULT 0;
```

### Organization Table
Add columns:
```sql
ALTER TABLE organizations ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN onboarding_completed_at TIMESTAMP;
```

### Sessions Table (Optional but Recommended)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  refresh_token_hash VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);
```

### Layouts Table
```sql
CREATE TABLE user_layouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255),
  type VARCHAR(50), -- dashboard, kanban, calendar
  config JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Environment Variables

Add to `.env`:
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie Configuration
COOKIE_DOMAIN=.daritana.com
COOKIE_SECURE=true  # Set to false in development
COOKIE_SAME_SITE=Strict

# SMTP Configuration (for invitations)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@daritana.com

# Frontend URL (for invitation links)
FRONTEND_URL=https://app.daritana.com
```

---

## Testing Checklist

### Authentication Flow
- [ ] Login sets HTTP-Only cookies correctly
- [ ] Cookies are sent with subsequent API requests
- [ ] Token refresh works automatically on 401
- [ ] Logout clears cookies properly
- [ ] Multiple browser tabs share session
- [ ] Session persists across page refreshes
- [ ] Expired token triggers re-login

### Security
- [ ] Tokens not accessible via JavaScript (document.cookie)
- [ ] XSS attacks cannot steal tokens
- [ ] CSRF protection with SameSite=Strict
- [ ] Rate limiting prevents brute force
- [ ] Token rotation invalidates old tokens
- [ ] Logout revokes all sessions

### Permissions
- [ ] Permissions fetched from backend, not cached
- [ ] Permission changes reflect immediately
- [ ] Unauthorized access returns 403
- [ ] Role changes update permissions

### Multi-Organization
- [ ] Organization context set correctly
- [ ] Users can switch organizations
- [ ] Data isolation enforced
- [ ] Invitations work across organizations

---

## Migration Plan

### Step 1: Backend Implementation (Week 1)
1. Implement HTTP-Only cookie authentication
2. Create /api/auth/me endpoint
3. Create /api/auth/refresh endpoint
4. Add permission endpoints
5. Test all endpoints with Postman

### Step 2: Frontend Migration (Week 2)
1. Remove localStorage from authStore
2. Update API interceptors
3. Remove localStorage from services
4. Test login/logout flow

### Step 3: UI State Migration (Week 3)
1. Implement layout API endpoints
2. Migrate cache to IndexedDB
3. Create onboarding zustand store
4. Test offline functionality

### Step 4: Testing & Deployment (Week 4)
1. Integration testing
2. Security audit
3. Performance testing
4. Production deployment

---

## Success Criteria

After implementation:
1. ✅ Zero localStorage usage in frontend code
2. ✅ All tokens stored in HTTP-Only cookies
3. ✅ No XSS vulnerability for token theft
4. ✅ Session persists across page refreshes
5. ✅ Permissions always fetched from backend
6. ✅ All API tests passing
7. ✅ Security audit passed
8. ✅ User experience unchanged (no visible difference)

---

## Support & Documentation

### For Frontend Developers
- All auth logic moved to authStore
- No manual token handling required
- Cookies managed automatically by browser
- Use `useAuthStore().user` for current user data

### For Backend Developers
- Implement cookie-based authentication
- Use provided middleware for auth checks
- Follow security best practices
- Document all API endpoints

---

**Document Version:** 1.0
**Last Updated:** 2025-01-08
**Status:** Ready for Implementation
