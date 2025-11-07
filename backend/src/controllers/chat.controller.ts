import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get chat messages for a channel
 */
export const getMessages = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      channelType,
      channelId,
      page = 1,
      limit = 50,
      search,
      startDate,
      endDate
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { organizationId }

    // Filter by channel
    if (channelType) where.channelType = channelType
    if (channelId) where.channelId = channelId

    // Date range filter
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    // Search filter
    if (search) {
      where.content = {
        contains: String(search),
        mode: 'insensitive'
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              avatar: true,
              position: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.count({ where })
    ])

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse()

    res.json({
      messages: chronologicalMessages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

/**
 * Send a new message
 */
export const sendMessage = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      content,
      type = 'TEXT',
      channelType,
      channelId,
      threadId,
      parentId,
      attachments = []
    } = req.body

    if (!content && type === 'TEXT') {
      return res.status(400).json({ error: 'Message content is required' })
    }

    // Validate channel access
    if (channelType === 'project' && channelId) {
      const hasAccess = await checkProjectAccess(channelId, req.user!.id)
      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this project chat' })
      }
    }

    const message = await prisma.message.create({
      data: {
        organizationId,
        senderId: req.user!.id,
        content,
        type,
        channelType,
        channelId,
        threadId,
        parentId,
        attachments
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    // TODO: Emit WebSocket event for real-time delivery
    // io.to(`org:${organizationId}`).emit('new_message', message)
    // if (channelId) {
    //   io.to(`channel:${channelId}`).emit('new_message', message)
    // }

    res.status(201).json(message)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

/**
 * Update a message
 */
export const updateMessage = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Only sender can edit their own messages
    if (message.senderId !== req.user!.id) {
      return res.status(403).json({ error: 'Can only edit your own messages' })
    }

    // Don't allow editing messages older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (message.createdAt < twentyFourHoursAgo) {
      return res.status(400).json({ error: 'Cannot edit messages older than 24 hours' })
    }

    const { content } = req.body

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    // TODO: Emit WebSocket event for real-time update
    // io.to(`org:${organizationId}`).emit('message_updated', updatedMessage)

    res.json(updatedMessage)
  } catch (error) {
    console.error('Update message error:', error)
    res.status(500).json({ error: 'Failed to update message' })
  }
}

/**
 * Delete a message
 */
export const deleteMessage = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { id } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Only sender or admins can delete messages
    const canDelete = message.senderId === req.user!.id ||
                     req.user?.organizationRole === 'ORG_ADMIN' ||
                     req.user?.permissions?.includes('messages.delete')

    if (!canDelete) {
      return res.status(403).json({ error: 'No permission to delete this message' })
    }

    // Soft delete by updating deletedAt
    await prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // TODO: Emit WebSocket event for real-time deletion
    // io.to(`org:${organizationId}`).emit('message_deleted', { id })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
}

/**
 * Get chat channels for organization
 */
export const getChannels = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Get project channels user has access to
    const projectChannels = await prisma.project.findMany({
      where: {
        organizationId,
        members: {
          some: {
            userId: req.user!.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true
      }
    })

    // Get recent message count for each project
    const projectChannelsWithCounts = await Promise.all(
      projectChannels.map(async (project) => {
        const [messageCount, lastMessage] = await Promise.all([
          prisma.message.count({
            where: {
              organizationId,
              channelType: 'project',
              channelId: project.id
            }
          }),
          prisma.message.findFirst({
            where: {
              organizationId,
              channelType: 'project',
              channelId: project.id
            },
            include: {
              sender: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        ])

        return {
          ...project,
          type: 'project' as const,
          messageCount,
          lastMessage
        }
      })
    )

    // Get general organization channels
    const generalChannels = [
      {
        id: 'general',
        name: 'General',
        type: 'general' as const,
        description: 'Organization-wide discussions'
      },
      {
        id: 'announcements',
        name: 'Announcements',
        type: 'announcement' as const,
        description: 'Important updates and announcements'
      }
    ]

    // Get message counts for general channels
    const generalChannelsWithCounts = await Promise.all(
      generalChannels.map(async (channel) => {
        const [messageCount, lastMessage] = await Promise.all([
          prisma.message.count({
            where: {
              organizationId,
              channelType: channel.type,
              channelId: channel.id
            }
          }),
          prisma.message.findFirst({
            where: {
              organizationId,
              channelType: channel.type,
              channelId: channel.id
            },
            include: {
              sender: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        ])

        return {
          ...channel,
          messageCount,
          lastMessage
        }
      })
    )

    const channels = {
      general: generalChannelsWithCounts,
      projects: projectChannelsWithCounts
    }

    res.json(channels)
  } catch (error) {
    console.error('Get channels error:', error)
    res.status(500).json({ error: 'Failed to get channels' })
  }
}

/**
 * Get direct message conversations
 */
export const getDirectMessages = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    // Get all users the current user has exchanged messages with
    const conversations = await prisma.message.findMany({
      where: {
        organizationId,
        channelType: 'direct',
        OR: [
          { senderId: req.user!.id },
          { 
            channelId: {
              contains: req.user!.id
            }
          }
        ]
      },
      distinct: ['channelId'],
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Process conversations to get the other participant
    const dmConversations = await Promise.all(
      conversations.map(async (message) => {
        // DM channelId format: "user1_user2" (sorted by ID)
        const userIds = message.channelId?.split('_') || []
        const otherUserId = userIds.find(id => id !== req.user!.id)

        if (!otherUserId) return null

        const [otherUser, messageCount, lastMessage] = await Promise.all([
          prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              avatar: true,
              position: true,
              lastActiveAt: true
            }
          }),
          prisma.message.count({
            where: {
              organizationId,
              channelType: 'direct',
              channelId: message.channelId
            }
          }),
          prisma.message.findFirst({
            where: {
              organizationId,
              channelType: 'direct',
              channelId: message.channelId
            },
            include: {
              sender: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        ])

        if (!otherUser) return null

        return {
          channelId: message.channelId,
          user: otherUser,
          messageCount,
          lastMessage
        }
      })
    )

    // Filter out null values and remove duplicates
    const uniqueConversations = dmConversations
      .filter(conv => conv !== null)
      .filter((conv, index, arr) => 
        arr.findIndex(c => c?.channelId === conv?.channelId) === index
      )

    res.json(uniqueConversations)
  } catch (error) {
    console.error('Get direct messages error:', error)
    res.status(500).json({ error: 'Failed to get direct messages' })
  }
}

/**
 * Start or get direct message conversation
 */
export const startDirectMessage = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { userId } = req.params
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot start DM with yourself' })
    }

    // Check if the other user is in the same organization
    const otherUserMember = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            position: true
          }
        }
      }
    })

    if (!otherUserMember) {
      return res.status(404).json({ error: 'User not found in organization' })
    }

    // Generate channel ID (sorted user IDs to ensure consistency)
    const channelId = [req.user!.id, userId].sort().join('_')

    // Get existing conversation or create new one
    const existingMessages = await prisma.message.findFirst({
      where: {
        organizationId,
        channelType: 'direct',
        channelId
      }
    })

    const conversation = {
      channelId,
      user: otherUserMember.user,
      exists: !!existingMessages
    }

    res.json(conversation)
  } catch (error) {
    console.error('Start direct message error:', error)
    res.status(500).json({ error: 'Failed to start direct message' })
  }
}

/**
 * Search messages across channels
 */
export const searchMessages = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const {
      query,
      channelType,
      channelId,
      senderId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {
      organizationId,
      content: {
        contains: String(query),
        mode: 'insensitive'
      },
      deletedAt: null
    }

    // Apply filters
    if (channelType) where.channelType = channelType
    if (channelId) where.channelId = channelId
    if (senderId) where.senderId = senderId

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              avatar: true,
              position: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.count({ where })
    ])

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Search messages error:', error)
    res.status(500).json({ error: 'Failed to search messages' })
  }
}

/**
 * Check if user has access to a project
 */
async function checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId
    }
  })

  return !!membership
}