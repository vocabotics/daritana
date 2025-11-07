import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import monteCarloService from '../services/monteCarlo.service'

const prisma = new PrismaClient()

// Validation schemas
const createRiskAssessmentSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  category: z.string(),
  probability: z.number().min(0).max(1),
  impact: z.number().min(1).max(5),
  mitigationPlan: z.string().optional(),
  contingencyPlan: z.string().optional(),
  owner: z.string().optional(),
})

const createResourceAllocationSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  resourceName: z.string(),
  allocatedUnits: z.number(),
  allocatedCost: z.number().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  utilizationRate: z.number().optional(),
})

const createWBSNodeSchema = z.object({
  projectId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  level: z.number(),
  sortOrder: z.number(),
  nodeType: z.enum(['PHASE', 'DELIVERABLE', 'WORK_PACKAGE', 'ACTIVITY', 'MILESTONE']),
  estimatedHours: z.number().optional(),
  estimatedCost: z.number().optional(),
  responsibleId: z.string().optional(),
})

// Helper to get user from request
const getUserFromRequest = (req: any) => {
  return req.user
}

// ==================== RISK ASSESSMENTS ====================

export const getRiskAssessments = async (req: Request, res: Response) => {
  try {
    const { projectId, status, category } = req.query

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (category) where.category = category

    const risks = await prisma.riskAssessment.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { riskScore: 'desc' }
    })

    res.json({
      success: true,
      data: risks
    })
  } catch (error) {
    console.error('Get risk assessments error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk assessments'
    })
  }
}

export const createRiskAssessment = async (req: any, res: Response) => {
  try {
    const validatedData = createRiskAssessmentSchema.parse(req.body)
    
    // Calculate risk score
    const riskScore = validatedData.probability * validatedData.impact

    const risk = await prisma.riskAssessment.create({
      data: {
        ...validatedData,
        riskScore,
        status: 'IDENTIFIED'
      }
    })

    res.status(201).json({
      success: true,
      data: risk
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create risk assessment error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create risk assessment'
    })
  }
}

export const updateRiskAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Recalculate risk score if probability or impact changed
    if (updates.probability !== undefined || updates.impact !== undefined) {
      const existing = await prisma.riskAssessment.findUnique({
        where: { id }
      })
      
      if (existing) {
        const probability = updates.probability ?? existing.probability
        const impact = updates.impact ?? existing.impact
        updates.riskScore = probability * impact
      }
    }

    const risk = await prisma.riskAssessment.update({
      where: { id },
      data: updates
    })

    res.json({
      success: true,
      data: risk
    })
  } catch (error) {
    console.error('Update risk assessment error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update risk assessment'
    })
  }
}

export const deleteRiskAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.riskAssessment.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete risk assessment error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete risk assessment'
    })
  }
}

// ==================== MONTE CARLO SIMULATION ====================

export const runMonteCarloSimulation = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params
    const user = getUserFromRequest(req)
    const { iterations = 10000, confidenceLevel = 0.95 } = req.body

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    // Run simulation
    const simulationId = await monteCarloService.runSimulation(
      projectId,
      user.id,
      iterations,
      confidenceLevel
    )

    // Get simulation results
    const simulation = await monteCarloService.getSimulationResults(simulationId)

    res.status(201).json({
      success: true,
      data: simulation
    })
  } catch (error) {
    console.error('Run Monte Carlo simulation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to run Monte Carlo simulation'
    })
  }
}

export const getMonteCarloSimulation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const simulation = await monteCarloService.getSimulationResults(id)

    res.json({
      success: true,
      data: simulation
    })
  } catch (error) {
    console.error('Get Monte Carlo simulation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Monte Carlo simulation'
    })
  }
}

export const getProjectSimulations = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params

    const simulations = await monteCarloService.getProjectSimulations(projectId)

    res.json({
      success: true,
      data: simulations
    })
  } catch (error) {
    console.error('Get project simulations error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project simulations'
    })
  }
}

// ==================== RESOURCE ALLOCATION ====================

export const getResourceAllocations = async (req: Request, res: Response) => {
  try {
    const { projectId, taskId, resourceType, startDate, endDate } = req.query

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (taskId) where.taskId = taskId
    if (resourceType) where.resourceType = resourceType
    
    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) where.startDate.gte = new Date(startDate as string)
      if (endDate) where.startDate.lte = new Date(endDate as string)
    }

    const allocations = await prisma.resourceAllocation.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    res.json({
      success: true,
      data: allocations
    })
  } catch (error) {
    console.error('Get resource allocations error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource allocations'
    })
  }
}

export const createResourceAllocation = async (req: Request, res: Response) => {
  try {
    const validatedData = createResourceAllocationSchema.parse(req.body)

    // Check for conflicts
    const conflicts = await prisma.resourceAllocation.findMany({
      where: {
        resourceId: validatedData.resourceId,
        OR: [
          {
            AND: [
              { startDate: { lte: validatedData.startDate } },
              { endDate: { gte: validatedData.startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: validatedData.endDate } },
              { endDate: { gte: validatedData.endDate } }
            ]
          }
        ]
      }
    })

    if (conflicts.length > 0) {
      // Calculate total utilization
      const totalUtilization = conflicts.reduce((sum, conflict) => 
        sum + (conflict.utilizationRate || 0), validatedData.utilizationRate || 0)
      
      if (totalUtilization > 1) {
        return res.status(400).json({
          success: false,
          error: 'Resource over-allocated for this time period',
          conflicts
        })
      }
    }

    const allocation = await prisma.resourceAllocation.create({
      data: validatedData
    })

    res.status(201).json({
      success: true,
      data: allocation
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create resource allocation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create resource allocation'
    })
  }
}

export const updateResourceAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const allocation = await prisma.resourceAllocation.update({
      where: { id },
      data: updates
    })

    res.json({
      success: true,
      data: allocation
    })
  } catch (error) {
    console.error('Update resource allocation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update resource allocation'
    })
  }
}

export const deleteResourceAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.resourceAllocation.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete resource allocation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource allocation'
    })
  }
}

// ==================== RESOURCE UTILIZATION ANALYSIS ====================

export const getResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { resourceId, startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      })
    }

    const allocations = await prisma.resourceAllocation.findMany({
      where: {
        resourceId: resourceId as string,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(endDate as string) } },
              { endDate: { gte: new Date(startDate as string) } }
            ]
          }
        ]
      },
      include: {
        project: true,
        task: true
      },
      orderBy: { startDate: 'asc' }
    })

    // Calculate daily utilization
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    const dailyUtilization: Record<string, number> = {}

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      dailyUtilization[dateStr] = 0

      allocations.forEach(allocation => {
        if (allocation.startDate <= d && allocation.endDate >= d) {
          dailyUtilization[dateStr] += allocation.utilizationRate || 0
        }
      })
    }

    // Calculate statistics
    const utilizationValues = Object.values(dailyUtilization)
    const avgUtilization = utilizationValues.reduce((a, b) => a + b, 0) / utilizationValues.length
    const maxUtilization = Math.max(...utilizationValues)
    const minUtilization = Math.min(...utilizationValues)
    const overAllocatedDays = utilizationValues.filter(u => u > 1).length

    res.json({
      success: true,
      data: {
        allocations,
        dailyUtilization,
        statistics: {
          avgUtilization: Math.round(avgUtilization * 100) / 100,
          maxUtilization: Math.round(maxUtilization * 100) / 100,
          minUtilization: Math.round(minUtilization * 100) / 100,
          overAllocatedDays,
          totalDays: utilizationValues.length
        }
      }
    })
  } catch (error) {
    console.error('Get resource utilization error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource utilization'
    })
  }
}

// ==================== WBS (Work Breakdown Structure) ====================

export const getWBSNodes = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params

    const nodes = await prisma.wBSNode.findMany({
      where: { projectId },
      include: {
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    // Build tree structure
    const tree = buildWBSTree(nodes)

    res.json({
      success: true,
      data: {
        nodes,
        tree
      }
    })
  } catch (error) {
    console.error('Get WBS nodes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WBS nodes'
    })
  }
}

export const createWBSNode = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const validatedData = createWBSNodeSchema.parse(req.body)

    // Check if code is unique within project
    const existingNode = await prisma.wBSNode.findUnique({
      where: {
        projectId_code: {
          projectId: validatedData.projectId,
          code: validatedData.code
        }
      }
    })

    if (existingNode) {
      return res.status(400).json({
        success: false,
        error: 'WBS code already exists in this project'
      })
    }

    const node = await prisma.wBSNode.create({
      data: validatedData,
      include: {
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: node
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create WBS node error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create WBS node'
    })
  }
}

export const updateWBSNode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Calculate progress if actual values are provided
    if (updates.actualHours !== undefined || updates.actualCost !== undefined) {
      const existing = await prisma.wBSNode.findUnique({
        where: { id }
      })
      
      if (existing) {
        if (updates.actualHours !== undefined && existing.estimatedHours) {
          updates.progressPercent = Math.min(100, (updates.actualHours / existing.estimatedHours) * 100)
        } else if (updates.actualCost !== undefined && existing.estimatedCost) {
          updates.progressPercent = Math.min(100, (updates.actualCost / existing.estimatedCost) * 100)
        }
      }
    }

    const node = await prisma.wBSNode.update({
      where: { id },
      data: updates,
      include: {
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    res.json({
      success: true,
      data: node
    })
  } catch (error) {
    console.error('Update WBS node error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update WBS node'
    })
  }
}

export const deleteWBSNode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if node has children
    const node = await prisma.wBSNode.findUnique({
      where: { id }
    })

    if (node) {
      const children = await prisma.wBSNode.count({
        where: { parentId: id }
      })

      if (children > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete node with children'
        })
      }
    }

    await prisma.wBSNode.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete WBS node error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete WBS node'
    })
  }
}

// Helper function to build WBS tree
function buildWBSTree(nodes: any[]): any[] {
  const nodeMap: Record<string, any> = {}
  const tree: any[] = []

  // Create a map of all nodes
  nodes.forEach(node => {
    nodeMap[node.id] = { ...node, children: [] }
  })

  // Build the tree
  nodes.forEach(node => {
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(nodeMap[node.id])
    } else if (!node.parentId) {
      tree.push(nodeMap[node.id])
    }
  })

  return tree
}