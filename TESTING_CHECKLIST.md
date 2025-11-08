#  localStorage Elimination Testing Checklist
**Last Updated**: 2025-01-08
**Status**: Ready for Testing
**Scope**: Complete localStorage elimination verification

---

## <¯ Testing Overview

This checklist verifies that all localStorage usage has been eliminated and HTTP-Only cookie authentication works correctly across all features.

**Testing Environment**:
-  Development (http://localhost:5174)
-  Staging (if available)
-  Production (after deployment)

---

## 1ã Pre-Testing Setup

### Backend Verification
- [ ] Backend server running on port 7001
- [ ] PostgreSQL database connected
- [ ] Prisma migrations applied
- [ ] Cookie-parser middleware installed
- [ ] CORS configured with `credentials: true`
- [ ] Environment variables set correctly

### Frontend Verification
- [ ] Frontend dev server running on port 5174
- [ ] `VITE_API_URL` points to backend
- [ ] Build successful with zero errors
- [ ] No TypeScript compilation errors

### Browser Setup
- [ ] Open Chrome/Edge DevTools
- [ ] Navigate to Application ’ Cookies
- [ ] Navigate to Network tab
- [ ] Clear all cookies and storage before testing

---

## 2ã Authentication Flow Testing

### Test 2.1: User Login
**Objective**: Verify HTTP-Only cookies are set on login

**Steps**:
1. Navigate to http://localhost:5174/login
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"
4. Open DevTools ’ Application ’ Cookies

**Expected Results**:
- [ ]  Login successful (redirected to dashboard)
- [ ]  `access_token` cookie present
- [ ]  `refresh_token` cookie present
- [ ]  Cookies have `HttpOnly` flag set
- [ ]  Cookies have `SameSite=Strict` flag
- [ ]  Cookies have `Secure` flag (production only)
- [ ] L No tokens in localStorage
- [ ] L No tokens in sessionStorage
- [ ] L No tokens visible in JavaScript console

**Verification Commands**:
```javascript
// Open browser console and run:
console.log(localStorage.getItem('access_token')); // Should be null
console.log(localStorage.getItem('refresh_token')); // Should be null
console.log(document.cookie); // Should NOT show access_token or refresh_token
```

### Test 2.2: API Requests with Cookies
**Objective**: Verify cookies are sent automatically with API requests

**Steps**:
1. Stay logged in from Test 2.1
2. Open DevTools ’ Network tab
3. Navigate to /dashboard
4. Filter Network tab for XHR/Fetch requests
5. Click on any API request (e.g., `/api/projects`)
6. Check Request Headers

**Expected Results**:
- [ ]  Cookie header present in request
- [ ]  Cookie contains access_token
- [ ]  No Authorization header in request (cookies used instead)
- [ ]  API response successful (200 OK)

### Test 2.3: Token Refresh
**Objective**: Verify automatic token refresh via cookies

**Steps**:
1. Stay logged in
2. Wait 16 minutes (access token expires in 15 min)
3. Make any API call (navigate to a different page)
4. Open DevTools ’ Network tab
5. Look for `/api/auth/refresh` request

**Expected Results**:
- [ ]  Refresh request triggered automatically
- [ ]  New `access_token` cookie set
- [ ]  New `refresh_token` cookie set (rotated)
- [ ]  Subsequent API calls succeed
- [ ]  User NOT logged out

**Alternative Test** (Faster):
```bash
# Manually trigger refresh endpoint
curl http://localhost:7001/api/auth/refresh \
  -X POST \
  -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN" \
  -c new_cookies.txt \
  -v
```

### Test 2.4: Logout
**Objective**: Verify cookies are cleared on logout

**Steps**:
1. Stay logged in
2. Click user menu ’ Logout
3. Open DevTools ’ Application ’ Cookies
4. Check localStorage and sessionStorage

**Expected Results**:
- [ ]  Redirected to login page
- [ ]  `access_token` cookie removed
- [ ]  `refresh_token` cookie removed
- [ ]  localStorage is empty (no auth data)
- [ ]  User state cleared in app
- [ ]  Accessing protected routes redirects to login

---

## 3ã WebSocket Authentication Testing

### Test 3.1: WebSocket Connection with Cookies
**Objective**: Verify WebSocket uses cookies for auth

**Steps**:
1. Login successfully
2. Open DevTools ’ Console
3. Look for "Socket connected" message
4. Check Network tab ’ WS (WebSocket)
5. Inspect WebSocket handshake request

**Expected Results**:
- [ ]  WebSocket connects successfully
- [ ]  Cookie header present in WS handshake
- [ ]  Connection ID logged in console
- [ ] L No `auth.token` in WS handshake
- [ ] L No localStorage token used

**Debug Commands**:
```javascript
// Check socket connection
import { getSocket } from '@/lib/socket';
console.log(getSocket()?.connected); // Should be true
```

### Test 3.2: WebSocket Reconnection
**Objective**: Verify WebSocket reconnects using cookies

**Steps**:
1. Stay logged in with WS connected
2. Stop backend server briefly
3. Restart backend server
4. Check console for reconnection

**Expected Results**:
- [ ]  WebSocket reconnects automatically
- [ ]  Uses cookies for re-authentication
- [ ]  Real-time features resume working

---

## 4ã Cross-Tab Session Testing

### Test 4.1: Cross-Tab Login Sync
**Objective**: Verify cookies sync across tabs

**Steps**:
1. Open Tab 1: http://localhost:5174
2. Login in Tab 1
3. Open Tab 2: http://localhost:5174 (new tab)
4. Tab 2 should automatically be authenticated

**Expected Results**:
- [ ]  Tab 2 shows authenticated state (dashboard, not login)
- [ ]  Both tabs share same cookies
- [ ]  Both tabs have access to user data
- [ ] L No cross-tab localStorage sync needed

### Test 4.2: Cross-Tab Logout Sync
**Objective**: Verify logout in one tab logs out all tabs

**Steps**:
1. Have 2 tabs open (both authenticated)
2. Logout in Tab 1
3. Check Tab 2 state

**Expected Results**:
- [ ]  Tab 1 redirected to login
- [ ]  Tab 2 becomes unauthenticated
- [ ]  Tab 2 redirects to login (or shows logout state)
- [ ]  Both tabs have cookies cleared

---

## 5ã Permissions & Authorization Testing

### Test 5.1: Permissions from Backend
**Objective**: Verify permissions fetched fresh (no localStorage cache)

**Steps**:
1. Login as admin user
2. Open DevTools ’ Console
3. Navigate to /settings/permissions
4. Check Network tab for permissions API call

**Expected Results**:
- [ ]  Permissions loaded from `/api/auth/me` endpoint
- [ ]  No permissions in localStorage
- [ ]  Permissions displayed correctly in UI
- [ ]  Role-based access control working

**Verification**:
```javascript
// Check permissionsStore
import { usePermissionsStore } from '@/store/permissionsStore';
const store = usePermissionsStore.getState();
console.log(store.groups); // Should be default groups (not from localStorage)
```

### Test 5.2: Stale Permissions Prevention
**Objective**: Verify permissions are always fresh

**Steps**:
1. Login as user with role "staff"
2. Admin changes your role to "project_lead" in backend
3. Refresh the page
4. Check permissions in UI

**Expected Results**:
- [ ]  New permissions loaded from backend
- [ ]  UI reflects new role immediately
- [ ]  No stale cached permissions

---

## 6ã Session Manager Testing

### Test 6.1: Session Timeout Tracking
**Objective**: Verify session timeout works without localStorage

**Steps**:
1. Login successfully
2. Set session timeout to 2 minutes (for testing)
3. Wait 2 minutes without any activity
4. Try to navigate or make API call

**Expected Results**:
- [ ]  Session warning shown before timeout
- [ ]  User logged out after timeout
- [ ]  Cookies cleared
- [ ]  Redirected to login
- [ ] L No activity timestamps in localStorage

### Test 6.2: Activity Extension
**Objective**: Verify activity tracking without localStorage

**Steps**:
1. Login successfully
2. Interact with the page (mouse movement, clicks)
3. Check session timeout countdown

**Expected Results**:
- [ ]  Activity detected
- [ ]  Session timeout resets
- [ ]  No localStorage writes on activity

---

## 7ã Settings & Preferences Testing

### Test 7.1: Settings Service Cookie Auth
**Objective**: Verify settings API uses cookies

**Steps**:
1. Login successfully
2. Navigate to /settings
3. Change a setting (e.g., theme, language)
4. Check Network tab for `/api/settings` request

**Expected Results**:
- [ ]  Request includes Cookie header
- [ ]  No Authorization header needed
- [ ]  Settings saved successfully
- [ ]  Settings persist across page refreshes

---

## 8ã Team & Collaboration Testing

### Test 8.1: Team Store User ID
**Objective**: Verify team features use correct user ID

**Steps**:
1. Login successfully
2. Navigate to team/collaboration page
3. Update presence status
4. Send a team message
5. Check Network tab for API requests

**Expected Results**:
- [ ]  User ID from authStore (not localStorage)
- [ ]  Presence updates with correct user ID
- [ ]  Messages sent with correct user ID
- [ ] L No 'current-user' string literal used

**Verification**:
```javascript
// Check teamStore
import { useTeamStore } from '@/store/teamStore';
const store = useTeamStore.getState();
console.log(store.presence); // Should show real user IDs
```

---

## 9ã Onboarding Flow Testing

### Test 9.1: Company Registration
**Objective**: Verify onboarding data in memory (not localStorage)

**Steps**:
1. Navigate to /register
2. Fill out company registration form
3. Click "Create Company Account"
4. Check DevTools ’ Application ’ Local Storage

**Expected Results**:
- [ ]  Form data passed to onboarding wizard
- [ ]  No localStorage writes
- [ ]  Data in onboardingStore (memory only)
- [ ]  Wizard shows pre-filled data

**Verification**:
```javascript
// Check onboardingStore
import { useOnboardingStore } from '@/store/onboardingStore';
const store = useOnboardingStore.getState();
console.log(store.companyRegistrationData); // Should have data
console.log(localStorage.getItem('companyRegistrationData')); // Should be null
```

### Test 9.2: Organization Onboarding Wizard
**Objective**: Verify wizard state in memory only

**Steps**:
1. Continue from Test 9.1
2. Complete organization setup step
3. Add team members
4. Select project templates
5. Choose integrations
6. Check localStorage after each step

**Expected Results**:
- [ ]  Organization created successfully
- [ ]  Organization name in onboardingStore
- [ ]  Templates in onboardingStore
- [ ]  Integrations in onboardingStore
- [ ] L No localStorage writes at any step

### Test 9.3: Member Onboarding
**Objective**: Verify member profile in memory

**Steps**:
1. Navigate to /onboarding/member
2. Fill out profile form
3. Complete preferences
4. Connect social accounts
5. Check localStorage

**Expected Results**:
- [ ]  Profile data in onboardingStore
- [ ]  Social accounts in onboardingStore
- [ ]  Organization name from store (not localStorage)
- [ ] L No localStorage writes

### Test 9.4: Vendor Onboarding
**Objective**: Verify vendor completion flag in memory

**Steps**:
1. Navigate to /onboarding/vendor
2. Complete vendor registration
3. Check localStorage

**Expected Results**:
- [ ]  Vendor onboarding completed in authStore
- [ ]  Completion flag in onboardingStore
- [ ] L No 'vendorOnboardingComplete' in localStorage

---

## = Build & Production Testing

### Test 10.1: Production Build Verification
**Objective**: Verify no localStorage in production build

**Steps**:
```bash
npm run build
cd dist
grep -r "localStorage" assets/*.js
```

**Expected Results**:
- [ ]  Build successful (zero errors)
- [ ]  Only acceptable localStorage: theme, recent searches
- [ ] L No auth-related localStorage
- [ ] L No token-related localStorage

### Test 10.2: Production Environment Test
**Objective**: Verify cookies work in production

**Pre-requisites**:
- [ ] HTTPS enabled
- [ ] `COOKIE_SECURE=true` set
- [ ] Production domain configured

**Steps**:
1. Deploy to staging/production
2. Login via HTTPS
3. Check cookies in DevTools

**Expected Results**:
- [ ]  Cookies set with Secure flag
- [ ]  Cookies set with SameSite=Strict
- [ ]  Cookies set with HttpOnly flag
- [ ]  All features working
- [ ]  No mixed content warnings

---

## 1ã1ã Security Testing

### Test 11.1: XSS Attack Prevention
**Objective**: Verify tokens are not accessible via JavaScript

**Steps**:
1. Login successfully
2. Open DevTools ’ Console
3. Try to access tokens via JavaScript

**Commands**:
```javascript
// Try to steal tokens (should all return null or not found)
console.log(localStorage.getItem('access_token')); // null
console.log(sessionStorage.getItem('access_token')); // null
console.log(document.cookie); // Should NOT contain tokens (HttpOnly)

// Try to inject malicious script
localStorage.setItem('access_token', 'malicious-token'); // Won't affect auth
location.reload(); // Should still use HTTP-Only cookies
```

**Expected Results**:
- [ ]  Tokens NOT accessible via JavaScript
- [ ]  Malicious localStorage writes don't affect auth
- [ ]  HTTP-Only cookies used exclusively

### Test 11.2: CSRF Protection
**Objective**: Verify SameSite=Strict prevents CSRF

**Steps**:
1. Login successfully
2. Create malicious HTML file:
```html
<html>
<body>
<form action="http://localhost:7001/api/auth/logout" method="POST">
  <input type="submit" value="Click me!">
</form>
<script>document.forms[0].submit();</script>
</body>
</html>
```
3. Open malicious file in browser
4. Check if user logged out

**Expected Results**:
- [ ]  User NOT logged out
- [ ]  Cookies NOT sent (SameSite=Strict)
- [ ]  CSRF attack prevented

---

## 1ã2ã Edge Cases & Error Handling

### Test 12.1: Expired Token Handling
**Objective**: Verify expired tokens handled gracefully

**Steps**:
1. Login successfully
2. Manually delete `access_token` cookie
3. Try to navigate to protected page

**Expected Results**:
- [ ]  401 error caught
- [ ]  Refresh token attempt made
- [ ]  User re-authenticated if refresh succeeds
- [ ]  User redirected to login if refresh fails

### Test 12.2: Concurrent Tab Requests
**Objective**: Verify token refresh queue works

**Steps**:
1. Open 3 tabs
2. All authenticated
3. Wait for token to expire
4. Navigate in all 3 tabs simultaneously

**Expected Results**:
- [ ]  Only ONE refresh request made
- [ ]  All tabs use the new token
- [ ]  No duplicate refresh requests
- [ ]  All API calls succeed

### Test 12.3: Network Offline
**Objective**: Verify graceful offline handling

**Steps**:
1. Login successfully
2. Open DevTools ’ Network tab
3. Set throttling to "Offline"
4. Try to navigate

**Expected Results**:
- [ ]  Error message shown to user
- [ ]  No crashes or console errors
- [ ]  Retry mechanism available
- [ ]  When online, auto-reconnects

---

## 1ã3ã Final Verification

### Code Audit
```bash
# Search for any remaining localStorage usage
cd /home/user/daritana
grep -r "localStorage\\..*('.*token" src/
grep -r "localStorage\\..*('.*user" src/
grep -r "localStorage\\..*('.*auth" src/
grep -r "localStorage\\..*('.*permission" src/
grep -r "localStorage\\..*('.*organization" src/
```

**Expected**: No matches (except in .OLD files or tests)

### Store Audit
```bash
# Check for persist() middleware
grep -r "persist(" src/store/
```

**Expected**: Only non-critical stores (if any)

### Build Verification
```bash
npm run build
echo "Exit code: $?"
```

**Expected**: Exit code 0 (success)

---

##  Testing Sign-Off

### Completed By
- Name: ___________________
- Date: ___________________
- Environment: ___________________

### Test Results Summary
- Total Tests: 50+
- Passed: _______
- Failed: _______
- Blocked: _______

### Critical Issues Found
1. ___________________
2. ___________________
3. ___________________

### Production Readiness
- [ ]  All tests passed
- [ ]  No critical issues
- [ ]  Security verified
- [ ]  Performance acceptable
- [ ]  Documentation updated

**Approved for Production**:  YES  NO

**Sign-off**: ___________________

---

**Document Version**: 1.0
**Last Updated**: 2025-01-08
**Next Review**: After production deployment
