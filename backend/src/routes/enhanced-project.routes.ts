import { Router } from 'express'
import {
  createProject,
  listProjects as getProjects,
  getProject as getProjectById,
  updateProject,
  deleteProject
} from '../controllers/enhanced-project.controller'

const router = Router()

// Project CRUD operations
router.post('/', createProject)
router.get('/', getProjects)
router.get('/:projectId', getProjectById)
router.put('/:projectId', updateProject)
router.delete('/:projectId', deleteProject)

// Additional project endpoints can be added here

export default router