import { Router } from 'express'
import {
  listOrganizationMembers,
  getOrganizationMember,
  updateMemberRole,
  updateMemberDetails,
  removeMember,
  getMemberStats
} from '../controllers/organization-members.controller'
import { authenticateMultiTenant, requireOrgRole } from '../middleware/multi-tenant-auth'

const router = Router()

// Apply multi-tenant auth to all routes
router.use(authenticateMultiTenant)

// List organization members
router.get('/', listOrganizationMembers)

// Get member statistics (for admins)
router.get('/stats', requireOrgRole(['ORG_ADMIN']), getMemberStats)

// Get single member details
router.get('/:memberId', getOrganizationMember)

// Update member role (admin/lead only)
router.put('/:memberId/role', requireOrgRole(['ORG_ADMIN', 'PROJECT_LEAD']), updateMemberRole)

// Update member details (admin/lead only)
router.put('/:memberId', requireOrgRole(['ORG_ADMIN', 'PROJECT_LEAD']), updateMemberDetails)

// Remove member (admin only)
router.delete('/:memberId', requireOrgRole(['ORG_ADMIN']), removeMember)

export default router