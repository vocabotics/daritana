import { Router } from 'express'
import { switchOrganization } from '../middleware/multi-tenant-auth'
import { authenticate } from '../middleware/auth'

const router = Router()

// Switch organization context
router.post('/switch/:organizationId', authenticate, switchOrganization)

export default router