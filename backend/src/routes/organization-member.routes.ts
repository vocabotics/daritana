import { Router } from 'express'
import {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeMember,
  bulkInviteMembers,
  getMemberPermissions,
  updateMemberPermissions
} from '../controllers/organization-member.controller'

const router = Router()

// Get all members in the organization
router.get('/', getOrganizationMembers)

// Add a new member to the organization
router.post('/', addOrganizationMember)

// Bulk invite members
router.post('/bulk-invite', bulkInviteMembers)

// Get member permissions
router.get('/:memberId/permissions', getMemberPermissions)

// Update member permissions
router.put('/:memberId/permissions', updateMemberPermissions)

// Update member role
router.put('/:memberId/role', updateMemberRole)

// Remove member from organization
router.delete('/:memberId', removeMember)

export default router