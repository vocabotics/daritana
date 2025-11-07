import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { systemAdminController } from '../controllers/system-admin.controller';

const router = Router();

// All system admin routes require authentication
router.use(authenticate);

// Platform statistics
router.get('/stats', ...systemAdminController.getPlatformStats);

// Organizations management
router.get('/organizations', ...systemAdminController.getAllOrganizations);
router.put('/organizations/:organizationId/status', ...systemAdminController.updateOrganizationStatus);

// Subscription plans management
router.post('/subscription-plans', ...systemAdminController.createSubscriptionPlan);
router.get('/subscription-plans', ...systemAdminController.getSubscriptionPlans);

// Billing analytics
router.get('/billing/analytics', ...systemAdminController.getBillingAnalytics);

// System admins management
router.post('/system-admins', ...systemAdminController.createSystemAdmin);
router.get('/system-admins', ...systemAdminController.getSystemAdmins);

// Audit logs
router.get('/audit-logs', ...systemAdminController.getSystemAuditLogs);

export default router;