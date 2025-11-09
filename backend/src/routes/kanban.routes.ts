import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { prisma } from '../server'

const router = Router()

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// All routes require authentication
router.use(authenticate)

// Get kanban board for project
router.get('/project/:projectId', [
  param('projectId').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId } = req.params
    const organizationId = req.user.organizationId

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    // Get all tasks grouped by status
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        organizationId
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Group tasks by status for kanban columns
    const columns = {
      TODO: {
        id: 'TODO',
        title: 'To Do',
        color: 'gray',
        tasks: tasks.filter(t => t.status === 'TODO')
      },
      IN_PROGRESS: {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        color: 'blue',
        tasks: tasks.filter(t => t.status === 'IN_PROGRESS')
      },
      REVIEW: {
        id: 'REVIEW',
        title: 'Review',
        color: 'yellow',
        tasks: tasks.filter(t => t.status === 'REVIEW')
      },
      DONE: {
        id: 'DONE',
        title: 'Done',
        color: 'green',
        tasks: tasks.filter(t => t.status === 'DONE')
      },
      BLOCKED: {
        id: 'BLOCKED',
        title: 'Blocked',
        color: 'red',
        tasks: tasks.filter(t => t.status === 'BLOCKED')
      }
    }

    // Calculate statistics
    const stats = {
      total: tasks.length,
      todo: columns.TODO.tasks.length,
      inProgress: columns.IN_PROGRESS.tasks.length,
      review: columns.REVIEW.tasks.length,
      done: columns.DONE.tasks.length,
      blocked: columns.BLOCKED.tasks.length,
      completionRate: tasks.length > 0 ? (columns.DONE.tasks.length / tasks.length) * 100 : 0
    }

    res.json({
      success: true,
      project: {
        id: project.id,
        name: project.name
      },
      columns,
      stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch kanban board',
      message: error.message
    })
  }
})

// Move task between columns
router.put('/task/:taskId/move', [
  param('taskId').isUUID(),
  body('status').isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  body('order').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { taskId } = req.params
    const { status, order } = req.body
    const organizationId = req.user.organizationId

    // Check if task exists
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        organizationId
      }
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    // If order is provided, reorder tasks in the column
    if (order !== undefined) {
      // Get all tasks in the target status column
      const tasksInColumn = await prisma.task.findMany({
        where: {
          projectId: existingTask.projectId,
          status,
          id: { not: taskId }
        },
        orderBy: { order: 'asc' }
      })

      // Update orders for tasks that need to shift
      const updates = []
      let currentOrder = 0

      for (const task of tasksInColumn) {
        if (currentOrder === order) {
          currentOrder++ // Skip this position for the moved task
        }
        if (task.order !== currentOrder) {
          updates.push(
            prisma.task.update({
              where: { id: task.id },
              data: { order: currentOrder }
            })
          )
        }
        currentOrder++
      }

      // Execute all order updates
      if (updates.length > 0) {
        await prisma.$transaction(updates)
      }
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        order: order !== undefined ? order : existingTask.order
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    })

    // Create activity log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: taskId,
        metadata: {
          from: existingTask.status,
          to: status,
          taskTitle: existingTask.title
        }
      }
    })

    res.json({
      success: true,
      task: updatedTask
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to move task',
      message: error.message
    })
  }
})

// Create quick task for kanban
router.post('/quick-task', [
  body('title').notEmpty(),
  body('projectId').isUUID(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  body('columnId').optional(),
  validate
], async (req: any, res: any) => {
  try {
    const { title, projectId, status = 'TODO', columnId } = req.body
    const organizationId = req.user.organizationId
    const createdBy = req.user.id

    // Get the highest order number in the column
    const highestOrder = await prisma.task.findFirst({
      where: {
        projectId,
        status: columnId || status
      },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const task = await prisma.task.create({
      data: {
        title,
        projectId,
        organizationId,
        status: columnId || status,
        priority: 'MEDIUM',
        createdById: createdBy,
        order: (highestOrder?.order || 0) + 1
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        labels: true,
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      task
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    })
  }
})

// Bulk move tasks
router.post('/bulk-move', [
  body('taskIds').isArray(),
  body('taskIds.*').isUUID(),
  body('status').isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  validate
], async (req: any, res: any) => {
  try {
    const { taskIds, status } = req.body
    const organizationId = req.user.organizationId

    // Verify all tasks belong to organization
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        organizationId
      }
    })

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some tasks not found or access denied'
      })
    }

    // Update all tasks
    await prisma.task.updateMany({
      where: {
        id: { in: taskIds }
      },
      data: { status }
    })

    // Create audit logs
    const auditLogs = tasks.map(task => ({
      organizationId,
      userId: req.user.id,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'TASK',
      entityId: task.id,
      metadata: {
        from: task.status,
        to: status,
        taskTitle: task.title,
        bulkOperation: true
      }
    }))

    await prisma.auditLog.createMany({
      data: auditLogs
    })

    res.json({
      success: true,
      updated: taskIds.length,
      message: `${taskIds.length} tasks moved to ${status}`
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to bulk move tasks',
      message: error.message
    })
  }
})

// Get kanban filters and labels
router.get('/project/:projectId/filters', [
  param('projectId').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId } = req.params
    const organizationId = req.user.organizationId

    // Get all unique assignees
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        organizationId
      },
      select: {
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        labels: true,
        priority: true
      }
    })

    // Extract unique assignees
    const assigneesMap = new Map()
    tasks.forEach(task => {
      if (task.assignedTo && !assigneesMap.has(task.assignedTo.id)) {
        assigneesMap.set(task.assignedTo.id, task.assignedTo)
      }
    })

    // Extract unique labels
    const labelsSet = new Set()
    tasks.forEach(task => {
      task.labels?.forEach((label: any) => labelsSet.add(label))
    })

    // Extract unique priorities
    const prioritiesSet = new Set(tasks.map(t => t.priority))

    res.json({
      success: true,
      filters: {
        assignees: Array.from(assigneesMap.values()),
        labels: Array.from(labelsSet),
        priorities: Array.from(prioritiesSet),
        statuses: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filters',
      message: error.message
    })
  }
})

// Archive completed tasks
router.post('/project/:projectId/archive', [
  param('projectId').isUUID(),
  body('olderThanDays').optional().isInt({ min: 1, max: 365 }),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId } = req.params
    const { olderThanDays = 30 } = req.body
    const organizationId = req.user.organizationId

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Archive tasks
    const result = await prisma.task.updateMany({
      where: {
        projectId,
        organizationId,
        status: 'DONE',
        updatedAt: { lt: cutoffDate }
      },
      data: {
        archived: true,
        archivedAt: new Date()
      }
    })

    res.json({
      success: true,
      archived: result.count,
      message: `Archived ${result.count} completed tasks older than ${olderThanDays} days`
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to archive tasks',
      message: error.message
    })
  }
})

export default router