import { Router } from 'express'
import {
  createTimeline,
  listTimelines,
  updateTimeline,
  deleteTimeline,
  createMilestone,
  listMilestones,
  updateMilestone,
  deleteMilestone,
  getProjectProgress
} from '../controllers/project-timeline.controller'

const router = Router()

// Timeline entries
router.post('/projects/:projectId/timeline', createTimeline)
router.get('/projects/:projectId/timeline', listTimelines)
router.put('/timeline/:entryId', updateTimeline)
router.delete('/timeline/:entryId', deleteTimeline)

// Milestones
router.post('/projects/:projectId/milestones', createMilestone)
router.get('/projects/:projectId/milestones', listMilestones)
router.put('/milestones/:milestoneId', updateMilestone)
router.delete('/milestones/:milestoneId', deleteMilestone)

// Progress tracking
router.get('/projects/:projectId/progress', getProjectProgress)

export default router