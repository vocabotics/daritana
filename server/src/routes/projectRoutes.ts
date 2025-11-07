import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as projectController from '../controllers/projectController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Project related resources
router.get('/:id/tasks', projectController.getProjectTasks);
router.get('/:id/members', projectController.getProjectMembers);
router.post('/:id/members', projectController.addProjectMember);
router.delete('/:id/members/:userId', projectController.removeProjectMember);
router.get('/:id/files', projectController.getProjectFiles);

export default router;