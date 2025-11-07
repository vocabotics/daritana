# Daritana Architect Management - User Permissions Matrix

## User Roles Overview

The system has 6 main user types with different access levels:
1. **Admin** - System administrator with full access
2. **Project Lead** - Project managers with comprehensive management rights
3. **Designer** - Design team members with creative tools access
4. **Staff** - General staff members with operational access
5. **Contractor** - External contractors with limited project access
6. **Client** - Clients with view-only access to their projects

## Feature Access Matrix

| Feature/Module | Admin | Project Lead | Designer | Staff | Contractor | Client | Notes |
|----------------|-------|--------------|----------|-------|------------|--------|-------|
| **Dashboard** | | | | | | | |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | All users can view dashboard |
| Customize Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Contractors and clients cannot customize |
| Widget Management | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Add/remove dashboard widgets |
| **Projects** | | | | | | | |
| View Projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Client sees only their projects |
| Create Projects | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Only leads and staff can create |
| Edit Projects | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| Delete Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| **Tasks/Kanban** | | | | | | | |
| View Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | Client has limited view |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Assign Tasks | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| Complete Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| **Documents** | | | | | | | |
| View Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Edit Documents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Delete Documents | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| Start Review Session | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Document review hub access |
| **Design Brief** | | | | | | | |
| View Design Briefs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Create Design Briefs | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | Clients can create their briefs |
| Edit Design Briefs | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | Clients can edit their own |
| Approve Designs | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | Clients approve designs |
| **Financial** | | | | | | | |
| View Financials | ✅ | ✅ | ❌ | ✅ | 👁️ | 👁️ | Limited view for some roles |
| Create Invoices/Quotes | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| Approve Payments | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | Clients approve their payments |
| View Reports | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| **Team/Virtual Office** | | | | | | | |
| Access Virtual Office | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Team collaboration space |
| Video Conferencing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | All can join meetings |
| Team Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Marketplace** | | | | | | | |
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Purchase Products | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Vendor Portal Access | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | Contractors can be vendors |
| Manage Listings | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | |
| **Compliance** | | | | | | | |
| View Compliance Status | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ | |
| Manage Submissions | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Authority submissions |
| Update Compliance | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | |
| **Enterprise PM** | | | | | | | |
| Access Enterprise Tools | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Advanced PM features |
| Resource Planning | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| Portfolio Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| Risk Analysis | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| **AI Assistant (ARIA)** | | | | | | | |
| Basic ARIA Access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | All users have basic access |
| Team Management AI | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Leadership insights |
| Advanced AI Features | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | |
| **Settings & Admin** | | | | | | | |
| View Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Edit Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Admin only |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| Organization Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | |
| **Notifications** | | | | | | | |
| Receive Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| System Announcements | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Admin can broadcast |
| **Quick Actions** | | | | | | | |
| Create Project | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Via command palette |
| Create Task | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Upload File | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Start Meeting | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | |

## Legend

- ✅ Full Access - Complete read, write, edit, delete permissions
- 👁️ View Only - Read-only access, cannot modify
- ❌ No Access - Feature not available for this role

## Special Role Behaviors

### Client Role
- Can only see projects they are assigned to
- Limited to viewing and approving, not creating (except design briefs)
- Can communicate with team through messages
- Can approve designs and payments

### Contractor Role
- Access limited to assigned projects and tasks
- Can be vendors in marketplace
- Cannot access internal team features
- Can complete assigned tasks but not create new ones

### Designer Role
- Full access to design-related features
- Can customize dashboard for design workflow
- Access to collaborative design tools
- Cannot manage financial or compliance aspects

### Staff Role
- Operational access to most features
- Can create and manage projects
- Limited financial permissions
- Cannot access enterprise PM tools

### Project Lead Role
- Comprehensive management permissions
- Team management capabilities
- Full project lifecycle control
- Access to enterprise PM features
- Can manage users within projects

### Admin Role
- Unrestricted access to all features
- System configuration and settings
- User and organization management
- Can override any permission
- Access to system logs and analytics

## Security Notes

1. All sensitive operations require authentication
2. Organization-based isolation ensures data security
3. Role changes require admin or project lead approval
4. Audit logs track all permission-based actions
5. API endpoints enforce the same permission model

## Implementation Status

✅ Implemented and Active
🚧 Partially Implemented
📅 Planned for Future Release

Most permissions are ✅ fully implemented in the current system.