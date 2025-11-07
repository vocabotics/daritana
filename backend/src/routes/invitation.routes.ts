import { Router } from 'express'
import {
  inviteToOrganization,
  acceptInvitation,
  listInvitations,
  cancelInvitation,
  resendInvitation
} from '../controllers/invitation.controller'

const router = Router()

// Send invitation to join organization
router.post('/invite', inviteToOrganization)

// Accept invitation (no auth required)
router.post('/accept/:token', acceptInvitation)

// Get all pending invitations for organization
router.get('/', listInvitations)

// Revoke an invitation
router.delete('/:invitationId', cancelInvitation)

// Resend an invitation
router.post('/:invitationId/resend', resendInvitation)

export default router