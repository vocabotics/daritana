import { Router } from 'express';
import {
  createDesignBrief,
  getDesignBriefs,
  getDesignBriefById,
  updateDesignBrief,
  submitDesignBrief,
  reviewDesignBrief,
  convertBriefToTasks,
  deleteDesignBrief
} from '../controllers/designBrief.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Design Brief routes
router.post('/design-briefs', createDesignBrief);
router.get('/design-briefs', getDesignBriefs);
router.get('/design-briefs/:id', getDesignBriefById);
router.put('/design-briefs/:id', updateDesignBrief);
router.post('/design-briefs/:id/submit', submitDesignBrief);
router.post('/design-briefs/:id/review', reviewDesignBrief);
router.post('/design-briefs/:id/convert-to-tasks', convertBriefToTasks);
router.delete('/design-briefs/:id', deleteDesignBrief);

export default router;