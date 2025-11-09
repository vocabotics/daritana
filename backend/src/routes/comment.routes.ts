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

// Get comments for an entity (task, project, file, etc.)
router.get('/', [
  query('entityType').isIn(['TASK', 'PROJECT', 'FILE', 'DESIGN_BRIEF', 'QUOTATION']),
  query('entityId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { entityType, entityId, limit = 50, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          organizationId,
          entityType,
          entityId
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }),
      prisma.comment.count({
        where: {
          organizationId,
          entityType,
          entityId
        }
      })
    ])

    res.json({
      success: true,
      comments,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
      message: error.message
    })
  }
})

// Create a comment
router.post('/', [
  body('entityType').isIn(['TASK', 'PROJECT', 'FILE', 'DESIGN_BRIEF', 'QUOTATION']),
  body('entityId').isUUID(),
  body('content').notEmpty(),
  body('parentId').optional().isUUID(),
  body('mentions').optional().isArray(),
  body('mentions.*').optional().isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { entityType, entityId, content, parentId, mentions } = req.body
    const organizationId = req.user.organizationId
    const authorId = req.user.id

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        entityType,
        entityId,
        organizationId,
        authorId,
        parentId
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Handle mentions
    if (mentions && mentions.length > 0) {
      await prisma.commentMention.createMany({
        data: mentions.map((userId: string) => ({
          commentId: comment.id,
          userId
        }))
      })

      // Send notifications to mentioned users
      for (const userId of mentions) {
        await prisma.notification.create({
          data: {
            userId,
            organizationId,
            type: 'COMMENT',
            title: 'You were mentioned in a comment',
            message: `${req.user.firstName} ${req.user.lastName} mentioned you in a comment`,
            metadata: {
              commentId: comment.id,
              entityType,
              entityId
            },
            status: 'UNREAD'
          }
        })
      }
    }

    // If it's a reply, notify the parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      })

      if (parentComment && parentComment.authorId !== authorId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            organizationId,
            type: 'COMMENT',
            title: 'New reply to your comment',
            message: `${req.user.firstName} ${req.user.lastName} replied to your comment`,
            metadata: {
              commentId: comment.id,
              parentCommentId: parentId,
              entityType,
              entityId
            },
            status: 'UNREAD'
          }
        })
      }
    }

    // Create activity log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: authorId,
        action: 'COMMENT_CREATED',
        entityType,
        entityId,
        metadata: {
          commentId: comment.id,
          content: content.substring(0, 100)
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
      error: 'Failed to create comment',
      message: error.message
    })
  }
})

// Update a comment
router.put('/:id', [
  param('id').isUUID(),
  body('content').notEmpty(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const organizationId = req.user.organizationId
    const userId = req.user.id

    // Check if comment exists and user owns it
    const existing = await prisma.comment.findFirst({
      where: {
        id,
        organizationId,
        authorId: userId
      }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or you do not have permission to edit it'
      })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        editedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    res.json({
      success: true,
      comment
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update comment',
      message: error.message
    })
  }
})

// Delete a comment
router.delete('/:id', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId
    const userId = req.user.id

    // Check if comment exists and user owns it
    const existing = await prisma.comment.findFirst({
      where: {
        id,
        organizationId,
        authorId: userId
      }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or you do not have permission to delete it'
      })
    }

    // Delete mentions first
    await prisma.commentMention.deleteMany({
      where: { commentId: id }
    })

    // Delete reactions
    await prisma.commentReaction.deleteMany({
      where: { commentId: id }
    })

    // Delete replies
    await prisma.comment.deleteMany({
      where: { parentId: id }
    })

    // Delete the comment
    await prisma.comment.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
      message: error.message
    })
  }
})

// Add reaction to comment
router.post('/:id/reactions', [
  param('id').isUUID(),
  body('reaction').isIn(['like', 'love', 'laugh', 'wow', 'sad', 'angry']),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { reaction } = req.body
    const organizationId = req.user.organizationId
    const userId = req.user.id

    // Check if comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      })
    }

    // Check if user already reacted
    const existing = await prisma.commentReaction.findFirst({
      where: {
        commentId: id,
        userId
      }
    })

    if (existing) {
      // Update existing reaction
      await prisma.commentReaction.update({
        where: { id: existing.id },
        data: { type: reaction }
      })
    } else {
      // Create new reaction
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId,
          type: reaction
        }
      })

      // Notify comment author
      if (comment.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: comment.authorId,
            organizationId,
            type: 'COMMENT',
            title: 'New reaction to your comment',
            message: `${req.user.firstName} ${req.user.lastName} reacted to your comment`,
            metadata: {
              commentId: id,
              reaction
            },
            status: 'UNREAD'
          }
        })
      }
    }

    res.json({
      success: true,
      message: 'Reaction added successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction',
      message: error.message
    })
  }
})

// Remove reaction from comment
router.delete('/:id/reactions', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    await prisma.commentReaction.deleteMany({
      where: {
        commentId: id,
        userId
      }
    })

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove reaction',
      message: error.message
    })
  }
})

// Get comment activity for a user
router.get('/activity', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { limit = 20, offset = 0 } = req.query
    const organizationId = req.user.organizationId
    const userId = req.user.id

    const activity = await prisma.comment.findMany({
      where: {
        organizationId,
        OR: [
          { authorId: userId },
          {
            mentions: {
              some: { userId }
            }
          },
          {
            parent: {
              authorId: userId
            }
          }
        ]
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      activity
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment activity',
      message: error.message
    })
  }
})

export default router