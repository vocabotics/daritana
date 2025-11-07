import { Router } from 'express'
import * as enterpriseController from '../controllers/enterprise.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// All enterprise routes require authentication
router.use(authenticate)

// ==================== RISK ASSESSMENTS ====================
router.get('/risks', enterpriseController.getRiskAssessments)
router.post('/risks', enterpriseController.createRiskAssessment)
router.put('/risks/:id', enterpriseController.updateRiskAssessment)
router.delete('/risks/:id', enterpriseController.deleteRiskAssessment)

// ==================== MONTE CARLO SIMULATION ====================
router.post('/projects/:projectId/monte-carlo', enterpriseController.runMonteCarloSimulation)
router.get('/simulations/:id', enterpriseController.getMonteCarloSimulation)
router.get('/projects/:projectId/simulations', enterpriseController.getProjectSimulations)

// ==================== RESOURCE ALLOCATION ====================
router.get('/resource-allocations', enterpriseController.getResourceAllocations)
router.post('/resource-allocations', enterpriseController.createResourceAllocation)
router.put('/resource-allocations/:id', enterpriseController.updateResourceAllocation)
router.delete('/resource-allocations/:id', enterpriseController.deleteResourceAllocation)
router.get('/resource-utilization', enterpriseController.getResourceUtilization)

// ==================== WBS (Work Breakdown Structure) ====================
router.get('/projects/:projectId/wbs', enterpriseController.getWBSNodes)
router.post('/wbs', enterpriseController.createWBSNode)
router.put('/wbs/:id', enterpriseController.updateWBSNode)
router.delete('/wbs/:id', enterpriseController.deleteWBSNode)

export default router