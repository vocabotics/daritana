import { Router } from 'express';
import {
  createOrganization,
  getOrganization,
  inviteUser,
  updateMember,
  removeMember,
  getOrganizationStats
} from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create new organization (public route)
router.post('/', createOrganization);

// All other routes require authentication
router.use(authenticate);

// Get organization details
router.get('/:organizationId', getOrganization);

// Get organization statistics
router.get('/:organizationId/stats', getOrganizationStats);

// Invite user to organization
router.post('/:organizationId/invite', inviteUser);

// Update organization member
router.put('/:organizationId/members/:memberId', updateMember);

// Remove member from organization
router.delete('/:organizationId/members/:memberId', removeMember);

export default router;