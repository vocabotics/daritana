# Daritana Product Requirements Document (PRD)

**Version**: 2.0
**Last Updated**: November 28, 2025
**Status**: Production Ready (Bug Fixes Required)

---

## 1. Executive Summary

### 1.1 Product Vision
Daritana is an enterprise-grade Architecture and Interior Design Project Management Platform designed specifically for Malaysian architecture firms. It aims to be a comprehensive solution that exceeds Primavera P6 capabilities while maintaining a user-friendly interface tailored for the design industry.

### 1.2 Mission Statement
To provide Malaysian architecture and design professionals with a complete, integrated platform for project management, collaboration, compliance tracking, and business operations.

### 1.3 Target Users
- **Architects**: Principal architects, senior architects, design team leads
- **Interior Designers**: Lead designers, design associates
- **Project Managers**: Project leads, coordinators
- **Clients**: Property developers, homeowners, commercial clients
- **Contractors**: General contractors, subcontractors, vendors
- **Staff**: Administrative personnel, HR, finance teams

---

## 2. Product Overview

### 2.1 Core Value Propositions

| Value Proposition | Description |
|------------------|-------------|
| **Integrated Platform** | Single platform for all project management needs |
| **Malaysian Context** | Local compliance (UBBL, PAM), currency (RM), banking (FPX) |
| **Enterprise Features** | Gantt charts, WBS, Monte Carlo analysis, resource management |
| **Real-time Collaboration** | WebSocket-based presence, cursors, and editing |
| **AI-Powered Assistant** | ARIA - contextual AI for insights and automation |

### 2.2 Platform Architecture

```
Frontend (React 18 + TypeScript + Vite)
├── UI Layer (Radix UI + Tailwind CSS)
├── State Management (Zustand)
├── Services Layer (API, WebSocket, AI)
└── Utility Layer (Hooks, Utils, Types)

Backend (Node.js + Express + Prisma)
├── API Routes (70+ endpoints)
├── WebSocket Server (Socket.io)
├── Database (PostgreSQL)
└── External Services (Stripe, SendGrid, AWS S3)
```

---

## 3. Feature Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-001 | Multi-tenant organization support | P0 | Done |
| AUTH-002 | Role-based access control (12 roles) | P0 | Done |
| AUTH-003 | JWT token authentication with refresh | P0 | Done |
| AUTH-004 | HTTP-Only cookie session management | P0 | Done |
| AUTH-005 | Two-factor authentication | P1 | Pending |
| AUTH-006 | SSO integration (Google, Microsoft) | P2 | Pending |

#### 3.1.2 User Roles
1. **System Admin** - Full system access
2. **Organization Admin** - Organization-level management
3. **Project Lead** - Project management authority
4. **Senior Architect** - Design leadership
5. **Architect** - Design work
6. **Designer** - Interior design work
7. **Staff** - General staff access
8. **Client** - Client portal access
9. **Contractor** - Contractor portal access
10. **Vendor** - Marketplace vendor access
11. **Guest** - Limited view access
12. **Billing Admin** - Financial management

### 3.2 Project Management

#### 3.2.1 Core Project Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| PRJ-001 | Project CRUD operations | P0 | Done |
| PRJ-002 | Project lifecycle stages | P0 | Done |
| PRJ-003 | Kanban board with drag-drop | P0 | Done |
| PRJ-004 | Timeline/Gantt view | P0 | Done |
| PRJ-005 | Task management with dependencies | P0 | Done |
| PRJ-006 | Budget tracking | P0 | Done |
| PRJ-007 | Team assignment | P0 | Done |
| PRJ-008 | Project templates | P1 | Done |

#### 3.2.2 Enterprise PM Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| ENT-001 | Advanced Gantt with critical path | P0 | Done |
| ENT-002 | Work Breakdown Structure (WBS) | P0 | Done |
| ENT-003 | Resource management & heat maps | P0 | Done |
| ENT-004 | Monte Carlo risk simulation | P1 | Done |
| ENT-005 | Portfolio dashboard with KPIs | P1 | Done |
| ENT-006 | Agile sprint boards | P1 | Done |
| ENT-007 | 50+ report templates | P1 | Done |

### 3.3 Architect-Specific Features

#### 3.3.1 Malaysian Compliance
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| ARC-001 | UBBL compliance tracking | P0 | Done |
| ARC-002 | PAM contract administration | P0 | Done |
| ARC-003 | Authority submission tracking | P0 | Done |
| ARC-004 | CCC tracking | P0 | Done |
| ARC-005 | DLP management | P1 | Done |

#### 3.3.2 Contract Administration
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| ARC-010 | RFI management | P0 | Done |
| ARC-011 | Change order tracking | P0 | Done |
| ARC-012 | Site visit reports | P0 | Done |
| ARC-013 | Punch list management | P0 | Done |
| ARC-014 | Payment certificates | P0 | Done |
| ARC-015 | Site instruction register | P1 | Done |
| ARC-016 | Submittal tracking | P1 | Done |
| ARC-017 | Meeting minutes | P1 | Done |
| ARC-018 | Fee calculator | P2 | Done |
| ARC-019 | Retention tracking | P2 | Done |

### 3.4 Document Management

#### 3.4.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| DOC-001 | Document upload/download | P0 | Done |
| DOC-002 | Version control | P0 | Done |
| DOC-003 | Category organization | P0 | Done |
| DOC-004 | 2D markup tools | P1 | Done |
| DOC-005 | 3D model review | P2 | Done |
| DOC-006 | Collaborative review | P1 | Done |
| DOC-007 | Drawing register | P0 | Done |

### 3.5 Financial Management

#### 3.5.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FIN-001 | Quotation management | P0 | Done |
| FIN-002 | Invoice generation | P0 | Done |
| FIN-003 | Expense tracking | P0 | Done |
| FIN-004 | SST calculation | P0 | Done |
| FIN-005 | Payment status tracking | P0 | Done |
| FIN-006 | Budget analytics | P1 | Done |
| FIN-007 | Financial reports | P1 | Done |

#### 3.5.2 Payment Integration
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PAY-001 | Stripe integration | P1 | Configured |
| PAY-002 | FPX payment gateway | P1 | Configured |
| PAY-003 | Subscription billing | P0 | Done |
| PAY-004 | Invoice payment links | P2 | Pending |

### 3.6 Collaboration Features

#### 3.6.1 Real-time Collaboration
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| COL-001 | Presence indicators | P0 | Done |
| COL-002 | Live cursor tracking | P1 | Done |
| COL-003 | Real-time comments | P0 | Done |
| COL-004 | Activity feed | P0 | Done |
| COL-005 | Chat/messaging | P0 | Done |
| COL-006 | Video conferencing | P2 | Configured |

#### 3.6.2 Team Management
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| TEAM-001 | Team member management | P0 | Done |
| TEAM-002 | Role assignment | P0 | Done |
| TEAM-003 | Workload visualization | P1 | Done |
| TEAM-004 | Team analytics | P1 | Done |
| TEAM-005 | Virtual office | P2 | Done |

### 3.7 Marketplace

#### 3.7.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| MKT-001 | Product catalog | P1 | Done |
| MKT-002 | Advanced search & filtering | P1 | Done |
| MKT-003 | Shopping cart | P1 | Done |
| MKT-004 | Vendor dashboard | P1 | Done |
| MKT-005 | Quote management (RFQ) | P1 | Done |
| MKT-006 | Live bidding | P2 | Done |
| MKT-007 | Bulk ordering | P2 | Done |

### 3.8 AI Features (ARIA)

#### 3.8.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AI-001 | AI assistant chatbot | P1 | Done |
| AI-002 | Document analysis | P1 | Done |
| AI-003 | Compliance checking | P1 | Done |
| AI-004 | Slack integration | P2 | Configured |
| AI-005 | WhatsApp integration | P2 | Configured |
| AI-006 | Email automation | P2 | Configured |
| AI-007 | Daily standup automation | P2 | Done |

### 3.9 Community & Learning

#### 3.9.1 Community Features
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| COM-001 | Posts and discussions | P2 | Done |
| COM-002 | Community groups | P2 | Done |
| COM-003 | Events management | P2 | Done |
| COM-004 | Challenges/competitions | P3 | Done |

#### 3.9.2 Learning Platform
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LRN-001 | Course catalog | P2 | Done |
| LRN-002 | Course enrollment | P2 | Done |
| LRN-003 | Progress tracking | P2 | Done |
| LRN-004 | Certifications | P3 | Done |

### 3.10 HR Management

#### 3.10.1 Requirements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| HR-001 | Employee management | P1 | Done |
| HR-002 | Leave management | P1 | Done |
| HR-003 | Attendance tracking | P2 | Done |
| HR-004 | Payroll integration | P3 | Configured |

---

## 4. Technical Requirements

### 4.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 5.0 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Radix UI | Latest | UI components |
| Zustand | 4.5 | State management |
| React Router | 6.30 | Routing |
| Socket.io-client | 4.8 | WebSockets |
| Axios | 1.11 | HTTP client |

### 4.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | Runtime |
| Express | 4.21 | API framework |
| Prisma | 6.19 | ORM |
| PostgreSQL | 15 | Database |
| Socket.io | 4.8 | WebSockets |
| Redis | 7 | Caching |

### 4.3 External Services

| Service | Purpose | Status |
|---------|---------|--------|
| Stripe | Payments | Configured |
| SendGrid | Email | Configured |
| AWS S3 | File storage | Configured |
| Pinecone | Vector DB for AI | Configured |
| OpenRouter | AI models | Configured |

---

## 5. Non-Functional Requirements

### 5.1 Performance
| Requirement | Target | Status |
|-------------|--------|--------|
| Page load time | < 3 seconds | Met |
| API response time | < 500ms | Met |
| WebSocket latency | < 100ms | Met |
| Concurrent users | 1000+ | Designed |

### 5.2 Security
| Requirement | Target | Status |
|-------------|--------|--------|
| JWT token auth | Implemented | Done |
| HTTP-Only cookies | Implemented | Done |
| CORS protection | Implemented | Done |
| Rate limiting | Configured | Done |
| Input validation | Implemented | Done |
| XSS prevention | Implemented | Done |

### 5.3 Reliability
| Requirement | Target | Status |
|-------------|--------|--------|
| Uptime | 99.9% | Planned |
| Database backup | Daily | Planned |
| Error logging | Sentry | Configured |

### 5.4 Scalability
| Requirement | Target | Status |
|-------------|--------|--------|
| Horizontal scaling | Docker | Ready |
| Database scaling | PostgreSQL | Ready |
| File storage | S3 | Ready |

---

## 6. Known Issues & Bug Fixes Required

### 6.1 Critical Bugs

| ID | Issue | File(s) | Impact |
|----|-------|---------|--------|
| BUG-001 | Hardcoded port 5004 instead of 7001 | Multiple services | API failures |
| BUG-002 | process.env used in browser code | services/api.ts | Build/runtime errors |
| BUG-003 | Notification API response handling | notificationStore.ts | Console errors |

### 6.2 Files Requiring Port Fix (5004 -> 7001)
1. `src/services/api.ts`
2. `src/services/documents.service.ts`
3. `src/services/chat.service.ts`
4. `src/services/video.service.ts`
5. `src/services/team.service.ts`
6. `src/services/teamChat.service.ts`
7. `src/services/virtualOffice.service.ts`
8. `src/services/virtualOfficeSimple.service.ts`
9. `src/lib/socket.ts`

### 6.3 Environment Variable Issues
Files using `process.env` instead of `import.meta.env`:
- `src/services/api.ts`
- `src/services/payment/PaymentService.ts`
- `src/services/payment/NotificationService.ts`
- `src/services/aiComplianceService.ts`

---

## 7. Release Criteria

### 7.1 MVP Requirements (v1.0)
- [x] Authentication & authorization
- [x] Project management (CRUD)
- [x] Task management (Kanban)
- [x] Document management
- [x] Team collaboration
- [x] Basic financial tracking
- [ ] Bug fixes complete

### 7.2 Production Requirements (v2.0)
- [x] Enterprise PM features
- [x] Architect-specific features
- [x] Marketplace
- [x] AI integration
- [ ] Payment gateway live
- [ ] Email service live
- [ ] Cloud storage configured
- [ ] All bugs resolved

---

## 8. Success Metrics

### 8.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| User adoption rate | 70% of invited users | Analytics |
| Daily active users | 60% of total users | Analytics |
| Task completion rate | 85%+ | Backend metrics |
| Bug resolution time | < 48 hours | Issue tracking |
| Customer satisfaction | > 4.5/5 | Surveys |

### 8.2 Technical Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API success rate | > 99% | 96.1% |
| Frontend build time | < 30s | ~25s |
| Test coverage | > 80% | ~60% |
| Lighthouse score | > 90 | ~85 |

---

## 9. Appendices

### 9.1 Glossary
- **UBBL**: Uniform Building By-Laws (Malaysian building code)
- **PAM**: Pertubuhan Akitek Malaysia (Malaysian Institute of Architects)
- **CCC**: Certificate of Completion and Compliance
- **DLP**: Defects Liability Period
- **RFI**: Request for Information
- **SST**: Sales and Service Tax

### 9.2 References
- Malaysian Institute of Architects (PAM) Standards
- UBBL 1984 (Amendment 2021)
- OWASP Top 10 Security Guidelines
- WCAG 2.1 Accessibility Guidelines

---

**Document Control**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01 | Dev Team | Initial PRD |
| 2.0 | 2025-11-28 | Claude | Comprehensive review & bug analysis |
