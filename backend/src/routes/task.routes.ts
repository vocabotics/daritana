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

// Get all tasks for a project
router.get('/project/:projectId', [
  param('projectId').isUUID(),
  query('status').optional().isIn(['todo', 'in_progress', 'review', 'done', 'blocked']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('assigneeId').optional().isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId } = req.params
    const { status, priority, assigneeId } = req.query

    const where: any = {
      projectId,
      organizationId: req.user.organizationId
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            url: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    res.json({
      success: true,
      tasks,
      count: tasks.length
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tasks',
      message: error.message 
    })
  }
})

// Get kanban board data
router.get('/kanban/:projectId', [
  param('projectId').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { projectId } = req.params

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        organizationId: req.user.organizationId
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
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
      todo: tasks.filter(t => t.status === 'TODO'),
      in_progress: tasks.filter(t => t.status === 'IN_PROGRESS'),
      review: tasks.filter(t => t.status === 'REVIEW'),
      done: tasks.filter(t => t.status === 'DONE'),
      blocked: tasks.filter(t => t.status === 'BLOCKED')
    }

    res.json({
      success: true,
      columns,
      totalTasks: tasks.length
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch kanban board',
      message: error.message 
    })
  }
})

// Create new task
router.post('/', [
  body('title').notEmpty().withMessage('Task title is required'),
  body('projectId').isUUID(),
  body('description').optional(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('assigneeId').optional().isUUID(),
  body('dueDate').optional().isISO8601(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('labels').optional().isArray(),
  validate
], async (req: any, res: any) => {
  try {
    const taskData = {
      ...req.body,
      creatorId: req.user.id,
      organizationId: req.user.organizationId,
      status: req.body.status || 'TODO',
      priority: req.body.priority || 'MEDIUM'
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

// Update task
router.put('/:id', [
  param('id').isUUID(),
  body('title').optional(),
  body('description').optional(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('assigneeId').optional().isUUID().nullable(),
  body('dueDate').optional().isISO8601().nullable(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('actualHours').optional().isFloat({ min: 0 }),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params

    // Check if task exists and user has access
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    const task = await prisma.task.update({
      where: { id },
      data: req.body,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.json({
      success: true,
      task
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update task',
      message: error.message 
    })
  }
})

// Update task status (for kanban drag-drop)
router.patch('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  body('order').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { status, order } = req.body

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        order: order !== undefined ? order : undefined
      }
    })

    res.json({
      success: true,
      task
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update task status',
      message: error.message 
    })
  }
})

// Add comment to task
router.post('/:id/comments', [
  param('id').isUUID(),
  body('content').notEmpty().withMessage('Comment content is required'),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { content } = req.body

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: id,
        userId: req.user.id,
        organizationId: req.user.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      comment
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add comment',
      message: error.message 
    })
  }
})

// Delete task
router.delete('/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params

    // Check if task exists and user has access
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    })

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      })
    }

    await prisma.task.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete task',
      message: error.message 
    })
  }
})

// Bulk update tasks (for multi-select operations)
router.post('/bulk-update', [
  body('taskIds').isArray().withMessage('Task IDs must be an array'),
  body('taskIds.*').isUUID(),
  body('updates').isObject(),
  validate
], async (req: any, res: any) => {
  try {
    const { taskIds, updates } = req.body

    // Only allow certain fields to be bulk updated
    const allowedUpdates: any = {}
    const allowedFields = ['status', 'priority', 'assigneeId']
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field]
      }
    }

    const result = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        organizationId: req.user.organizationId
      },
      data: allowedUpdates
    })

    res.json({
      success: true,
      updated: result.count
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update tasks',
      message: error.message 
    })
  }
})

export default router