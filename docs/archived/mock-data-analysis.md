# Mock Data Analysis & Real API Integration Plan
**Date:** January 17, 2025  
**Status:** Comprehensive Mock Data Audit

## Executive Summary
This document provides a complete analysis of all mock data usage across the CraftKit/Daritana platform, identifying components that need real API integration and real-time collaboration features that need proper WebSocket implementation.

---

## 📊 MOCK DATA USAGE BY CATEGORY

### 🔴 CRITICAL - High Priority Mock Data

#### **Pages with Mock Data**
| Page | Mock Data Type | Current Status | Required API | Priority |
|------|----------------|----------------|--------------|----------|
| **TeamPage.tsx** | Team members, chat rooms, activities | ❌ Mock data | `/team/members`, `/team/chat`, `/team/activities` | Critical |
| **HRDashboard.tsx** | Employees, leave requests | ❌ Mock data | `/hr/employees`, `/hr/leave-requests` | Critical |
| **LearningDashboard.tsx** | Courses, activities | ❌ Mock data | `/learning/courses`, `/learning/activities` | Critical |
| **ProjectDetail.tsx** | Team members, milestones | ❌ Mock data | `/projects/:id/team`, `/projects/:id/milestones` | Critical |
| **EnterprisePM.tsx** | ROI, NPV, IRR calculations | ❌ Mock calculations | `/enterprise/analytics` | Critical |
| **ARIACommandCenter.tsx** | AI interactions, usage data | ❌ Mock data | `/ai/interactions`, `/ai/usage` | Critical |

#### **Components with Mock Data**
| Component | Mock Data Type | Current Status | Required API | Priority |
|-----------|----------------|----------------|--------------|----------|
| **UserManagement.tsx** | Users list | ❌ Mock data | `/admin/users` | Critical |
| **AuditLogs.tsx** | Audit logs | ❌ Mock data | `/admin/audit-logs` | Critical |
| **BackupRestore.tsx** | Backup records | ❌ Mock data | `/admin/backups` | Critical |
| **Calendar.tsx** | Calendar events | ❌ Mock data | `/calendar/events` | Critical |
| **DocumentVersionControl.tsx** | Document versions | ❌ Mock data | `/documents/:id/versions` | Critical |
| **DocumentVersionHistory.tsx** | Version history | ❌ Mock data | `/documents/:id/history` | Critical |

### 🟡 MEDIUM - Medium Priority Mock Data

#### **Community Components**
| Component | Mock Data Type | Current Status | Required API | Priority |
|-----------|----------------|----------------|--------------|----------|
| **IndustryFeed.tsx** | Industry posts, trending topics | ❌ Mock data | `/community/industry-feed` | Medium |
| **CommunityGroups.tsx** | Groups, posts | ❌ Mock data | `/community/groups` | Medium |
| **CommunityHub.tsx** | Growth metrics, professionals | ❌ Mock data | `/community/hub` | Medium |
| **EducationalPlatform.tsx** | Courses, modules | ❌ Mock data | `/community/education` | Medium |
| **ConstructionReels.tsx** | Construction reels | ❌ Mock data | `/community/reels` | Medium |
| **ProjectPortfolio.tsx** | Project posts | ❌ Mock data | `/community/portfolio` | Medium |

#### **Collaboration Components**
| Component | Mock Data Type | Current Status | Required API | Priority |
|-----------|----------------|----------------|--------------|----------|
| **ActivityFeed.tsx** | Activity feed | ❌ Mock data | `/collaboration/activity-feed` | Medium |
| **PresenceIndicator.tsx** | Online users | ❌ Mock data | `/collaboration/presence` | Medium |
| **LiveCursors.tsx** | Cursor positions | ❌ Mock data | WebSocket real-time | Medium |

#### **Enterprise Components**
| Component | Mock Data Type | Current Status | Required API | Priority |
|-----------|----------------|----------------|--------------|----------|
| **WBSDesigner.tsx** | WBS nodes | ❌ Mock data | `/enterprise/wbs` | Medium |
| **DesignShowcase.tsx** | Design data | ❌ Mock data | `/design/showcase` | Medium |

### 🟢 LOW - Low Priority Mock Data

#### **Compliance & Authority**
| Component | Mock Data Type | Current Status | Required API | Priority |
|-----------|----------------|----------------|--------------|----------|
| **AuthoritySubmissionWizard.tsx** | Fee calculations | ❌ Mock calculations | `/compliance/fee-calculator` | Low |

---

## 🔌 REAL-TIME COLLABORATION STATUS

### **WebSocket Infrastructure**
| Component | Status | Implementation | Notes |
|-----------|--------|----------------|-------|
| **WebSocket Service** | ✅ Implemented | `src/services/websocket.service.ts` | Full WebSocket client with reconnection |
| **Backend Socket.IO** | ✅ Implemented | `backend/src/sockets/index.ts` | Authentication, presence, document review |
| **Real-time Notifications** | ✅ Implemented | `src/components/realtime/RealtimeNotifications.tsx` | Live notification system |

### **Collaboration Features Status**
| Feature | Frontend | Backend | WebSocket | Status |
|---------|----------|---------|-----------|--------|
| **User Presence** | ✅ PresenceIndicator.tsx | ✅ Socket handlers | ✅ Real-time updates | ✅ Complete |
| **Live Cursors** | ⚠️ LiveCursors.tsx | ❌ Missing handlers | ❌ Mock data | 🔄 Needs Backend |
| **Document Review** | ✅ CollaborativeEditor.tsx | ✅ Socket handlers | ✅ Real-time collaboration | ✅ Complete |
| **Activity Feed** | ⚠️ ActivityFeed.tsx | ❌ Missing API | ❌ Mock data | 🔄 Needs API |
| **Team Chat** | ❌ Missing component | ❌ Missing API | ❌ Missing handlers | ❌ Not Implemented |
| **Video Meetings** | ❌ Missing component | ❌ Missing API | ❌ Missing handlers | ❌ Not Implemented |

---

## 📋 DETAILED COMPONENT ANALYSIS

### **1. TeamPage.tsx (Critical Priority)**
```typescript
// Current Mock Data:
const mockTeamMembers: TeamMember[] = [...]
const mockChatRooms: ChatRoom[] = [...]
const mockVirtualRooms: VirtualRoom[] = [...]
const mockActivities: TeamActivity[] = [...]
```

**Required APIs:**
- `GET /api/team/members` - Get team members with presence
- `GET /api/team/chat-rooms` - Get chat rooms
- `GET /api/team/virtual-rooms` - Get virtual office rooms
- `GET /api/team/activities` - Get team activities
- `POST /api/team/chat/message` - Send chat message
- `POST /api/team/presence/update` - Update presence status

**WebSocket Events Needed:**
- `team:member_joined`
- `team:member_left`
- `team:message_sent`
- `team:activity_updated`

### **2. HRDashboard.tsx (Critical Priority)**
```typescript
// Current Mock Data:
const mockEmployees: Employee[] = [...]
const mockLeaveRequests: LeaveRequest[] = [...]
```

**Required APIs:**
- `GET /api/hr/employees` - Get all employees
- `GET /api/hr/leave-requests` - Get leave requests
- `GET /api/hr/statistics` - Get HR statistics
- `POST /api/hr/leave-request` - Create leave request
- `PUT /api/hr/leave-request/:id/approve` - Approve leave request

### **3. LearningDashboard.tsx (Critical Priority)**
```typescript
// Current Mock Data:
const mockCourses: Course[] = [...]
const mockRecentActivity: RecentActivity[] = [...]
```

**Required APIs:**
- `GET /api/learning/courses` - Get enrolled courses
- `GET /api/learning/activities` - Get learning activities
- `GET /api/learning/progress` - Get learning progress
- `GET /api/learning/certifications` - Get certifications

### **4. ProjectDetail.tsx (Critical Priority)**
```typescript
// Current Mock Data:
const mockTeamMembers = [...]
const mockMilestones = [...]
```

**Required APIs:**
- `GET /api/projects/:id/team` - Get project team members
- `GET /api/projects/:id/milestones` - Get project milestones
- `GET /api/projects/:id/analytics` - Get project analytics

### **5. UserManagement.tsx (Critical Priority)**
```typescript
// Current Mock Data:
const mockUsers: User[] = [...]
```

**Required APIs:**
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/role` - Update user role

### **6. ActivityFeed.tsx (Medium Priority)**
```typescript
// Current Mock Data:
const mockWebSocket = {...}
function generateMockActivity(): Activity {...}
function generateMockActivities(count: number = 50): Activity[] {...}
```

**Required APIs:**
- `GET /api/activity-feed` - Get activity feed
- `POST /api/activity-feed/react` - React to activity
- `POST /api/activity-feed/comment` - Comment on activity

**WebSocket Events Needed:**
- `activity:new`
- `activity:updated`
- `activity:deleted`

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Critical APIs (Week 1)**
1. **Team Management APIs**
   - Implement `/api/team/*` endpoints
   - Add WebSocket handlers for team collaboration
   - Update TeamPage.tsx to use real APIs

2. **HR Management APIs**
   - Implement `/api/hr/*` endpoints
   - Update HRDashboard.tsx to use real APIs

3. **Learning Platform APIs**
   - Implement `/api/learning/*` endpoints
   - Update LearningDashboard.tsx to use real APIs

4. **Project Detail APIs**
   - Implement `/api/projects/:id/team` and `/api/projects/:id/milestones`
   - Update ProjectDetail.tsx to use real APIs

### **Phase 2: Admin & Management APIs (Week 2)**
1. **User Management APIs**
   - Implement `/api/admin/users` endpoints
   - Update UserManagement.tsx to use real APIs

2. **Audit & Backup APIs**
   - Implement `/api/admin/audit-logs` and `/api/admin/backups`
   - Update AuditLogs.tsx and BackupRestore.tsx

3. **Calendar Integration**
   - Implement `/api/calendar/events` endpoints
   - Update Calendar.tsx to use real APIs

### **Phase 3: Document & Version Control (Week 3)**
1. **Document Version APIs**
   - Implement `/api/documents/:id/versions` endpoints
   - Update DocumentVersionControl.tsx and DocumentVersionHistory.tsx

2. **Enterprise Analytics**
   - Implement `/api/enterprise/analytics` for real ROI/NPV calculations
   - Update EnterprisePM.tsx

### **Phase 4: Community & Collaboration (Week 4)**
1. **Community APIs**
   - Implement `/api/community/*` endpoints
   - Update all community components

2. **Collaboration APIs**
   - Implement `/api/collaboration/*` endpoints
   - Add WebSocket handlers for live cursors and activity feed

3. **AI Integration**
   - Implement `/api/ai/*` endpoints
   - Update ARIACommandCenter.tsx

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### **WebSocket Real-time Features**
1. **Live Cursors** - Need backend handlers for cursor position updates
2. **Activity Feed** - Need real-time activity streaming
3. **Team Chat** - Need chat room management and message handling
4. **Presence System** - Already implemented, needs integration

### **API Integration Patterns**
1. **Use React Query/SWR** for data fetching and caching
2. **Implement proper error handling** for all API calls
3. **Add loading states** for better UX
4. **Use optimistic updates** for real-time features

### **Database Considerations**
1. **Ensure all mock data has corresponding database models**
2. **Add proper indexes** for performance
3. **Implement soft deletes** where appropriate
4. **Add audit trails** for admin actions

---

## 📈 SUCCESS METRICS

### **Completion Targets**
- **Week 1**: 40% of mock data replaced with real APIs
- **Week 2**: 70% of mock data replaced with real APIs
- **Week 3**: 90% of mock data replaced with real APIs
- **Week 4**: 100% of mock data replaced with real APIs

### **Quality Metrics**
- **API Response Time**: < 200ms for all endpoints
- **WebSocket Latency**: < 100ms for real-time features
- **Error Rate**: < 1% for all API calls
- **Uptime**: > 99.9% for production

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Start with TeamPage.tsx** - Highest impact, most visible mock data
2. **Implement team APIs** - Foundation for collaboration features
3. **Add WebSocket handlers** - Enable real-time team collaboration
4. **Update components systematically** - Follow the priority order
5. **Test thoroughly** - Ensure no regression in functionality

**The goal is to have a completely real-data-driven system with no mock data by the end of Week 4.**
