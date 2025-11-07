import { Router } from 'express';
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth';

// Import controllers
import * as projectAnalyticsController from '../controllers/project-analytics.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateMultiTenant);

// ==================== PROJECT ANALYTICS ROUTES ====================
router.get('/projects/performance', projectAnalyticsController.getProjectPerformance);
router.get('/projects/trends', projectAnalyticsController.getProjectTrends);
router.get('/projects/risk-analysis', projectAnalyticsController.getProjectRiskAnalysis);

export default router;