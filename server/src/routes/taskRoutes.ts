import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as taskController from '../controllers/taskController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task CRUD
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task operations
router.patch('/:id/move', taskController.moveTask);
router.post('/bulk-update', taskController.bulkUpdateTasks);

// Task comments
router.get('/:id/comments', taskController.getTaskComments);
router.post('/:id/comments', taskController.addTaskComment);

export default router;