import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

interface AuthenticatedSocket extends SocketIOServer {
  userId?: string
  organizationId?: string
  userEmail?: string
}

export class NotificationService {
  private io: SocketIOServer
  private connectedUsers: Map<string, string[]> = new Map() // userId -> socketIds

  constructor(io: SocketIOServer) {
    this.io = io
    this.setupSocketHandlers()
  }

  private setupSocketHandlers() {
    this.io.on('connection', async (socket: any) => {
      console.log('Socket connected:', socket.id)

      // Authenticate socket connection
      socket.on('authenticate', async (token: string) => {
        try {
          await this.authenticateSocket(socket, token)
        } catch (error) {
          console.error('Socket authentication failed:', error)
          socket.emit('auth_error', { error: 'Authentication failed' })
          socket.disconnect()
        }
      })

      // Join organization room
      socket.on('join_organization', (organizationId: string) => {
        if (socket.userId && socket.organizationId === organizationId) {
          socket.join(`org:${organizationId}`)
          console.log(`User ${socket.userId} joined organization ${organizationId}`)
        }
      })

      // Join project room
      socket.on('join_project', async (projectId: string) => {
        if (!socket.userId || !socket.organizationId) return

        try {
          // Check if user has access to project
          const projectMember = await prisma.projectMember.findFirst({
            where: {
              projectId,
              userId: socket.userId,
              project: {
                organizationId: socket.organizationId
              }
            }
          })

          if (projectMember) {
            socket.join(`project:${projectId}`)
            console.log(`User ${socket.userId} joined project ${projectId}`)
          } else {
            socket.emit('error', { message: 'No access to this project' })
          }
        } catch (error) {
          console.error('Error joining project room:', error)
        }
      })

      // Leave project room
      socket.on('leave_project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        console.log(`User ${socket.userId} left project ${projectId}`)
      })

      // Handle typing indicators
      socket.on('typing_start', (data: { projectId?: string, taskId?: string }) => {
        const room = data.projectId ? `project:${data.projectId}` : `task:${data.taskId}`
        socket.to(room).emit('user_typing', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          ...data
        })
      })

      socket.on('typing_stop', (data: { projectId?: string, taskId?: string }) => {
        const room = data.projectId ? `project:${data.projectId}` : `task:${data.taskId}`
        socket.to(room).emit('user_stopped_typing', {
          userId: socket.userId,
          ...data
        })
      })

      // Handle cursor position updates
      socket.on('cursor_move', (data: { 
        x: number, 
        y: number, 
        projectId?: string, 
        documentId?: string 
      }) => {
        const room = data.projectId ? `project:${data.projectId}` : `document:${data.documentId}`
        socket.to(room).emit('cursor_update', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          ...data
        })
      })

      // Handle presence updates
      socket.on('update_presence', (status: 'online' | 'away' | 'busy') => {
        if (socket.userId && socket.organizationId) {
          socket.to(`org:${socket.organizationId}`).emit('presence_update', {
            userId: socket.userId,
            status,
            timestamp: new Date()
          })

          // Update database
          this.updateUserPresence(socket.userId, status)
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id)
        
        if (socket.userId) {
          this.removeUserSocket(socket.userId, socket.id)
          
          // Notify organization about user going offline
          if (socket.organizationId) {
            socket.to(`org:${socket.organizationId}`).emit('presence_update', {
              userId: socket.userId,
              status: 'offline',
              timestamp: new Date()
            })
          }
        }
      })
    })
  }

  private async authenticateSocket(socket: any, token: string) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string
        email: string
        organizationId?: string
      }

      // Verify session in database
      const session = await prisma.session.findUnique({
        where: { token },
        include: { 
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              isActive: true
            }
          }
        }
      })

      if (!session || session.expiresAt < new Date() || !session.user.isActive) {
        throw new Error('Invalid or expired session')
      }

      // Set socket properties
      socket.userId = decoded.userId
      socket.userEmail = decoded.email
      socket.organizationId = decoded.organizationId || session.organizationId

      // Track connected user
      this.addUserSocket(decoded.userId, socket.id)

      // Send authentication success
      socket.emit('authenticated', {
        userId: decoded.userId,
        email: decoded.email,
        organizationId: socket.organizationId
      })

      console.log(`Socket ${socket.id} authenticated for user ${decoded.userId}`)
    } catch (error) {
      throw new Error('Authentication failed')
    }
  }

  private addUserSocket(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId) || []
    userSockets.push(socketId)
    this.connectedUsers.set(userId, userSockets)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId) || []
    const updatedSockets = userSockets.filter(id => id !== socketId)
    
    if (updatedSockets.length === 0) {
      this.connectedUsers.delete(userId)
    } else {
      this.connectedUsers.set(userId, updatedSockets)
    }
  }

  private async updateUserPresence(userId: string, status: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() }
      })
    } catch (error) {
      console.error('Error updating user presence:', error)
    }
  }

  // Public methods for sending notifications

  /**
   * Send notification to specific user
   */
  public async notifyUser(userId: string, notification: {
    type: string
    title: string
    message: string
    data?: any
  }) {
    const userSockets = this.connectedUsers.get(userId) || []
    
    for (const socketId of userSockets) {
      this.io.to(socketId).emit('notification', notification)
    }

    // Store in database
    try {
      await prisma.notification.create({
        data: {
          recipientId: userId,
          title: notification.title,
          message: notification.message,
          type: this.mapNotificationType(notification.type),
          resourceType: notification.data?.resourceType,
          resourceId: notification.data?.resourceId,
          url: notification.data?.url
        }
      })
    } catch (error) {
      console.error('Error saving notification:', error)
    }
  }

  /**
   * Send notification to organization members
   */
  public notifyOrganization(organizationId: string, notification: {
    type: string
    title: string
    message: string
    data?: any
    excludeUserId?: string
  }) {
    this.io.to(`org:${organizationId}`).emit('notification', notification)
  }

  /**
   * Send notification to project members
   */
  public notifyProject(projectId: string, notification: {
    type: string
    title: string
    message: string
    data?: any
    excludeUserId?: string
  }) {
    this.io.to(`project:${projectId}`).emit('notification', notification)
  }

  /**
   * Broadcast system announcement
   */
  public broadcastAnnouncement(announcement: {
    title: string
    message: string
    type?: string
    organizationId?: string
  }) {
    if (announcement.organizationId) {
      this.io.to(`org:${announcement.organizationId}`).emit('announcement', announcement)
    } else {
      this.io.emit('announcement', announcement)
    }
  }

  /**
   * Send real-time updates for specific resources
   */
  public broadcastUpdate(room: string, update: {
    type: string
    resource: string
    resourceId: string
    data: any
    userId?: string
  }) {
    this.io.to(room).emit('resource_update', update)
  }

  /**
   * Get online users in organization
   */
  public getOnlineUsers(organizationId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(`org:${organizationId}`)
    if (!room) return []

    const onlineUsers: string[] = []
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId) as any
      if (socket?.userId) {
        onlineUsers.push(socket.userId)
      }
    }

    return [...new Set(onlineUsers)] // Remove duplicates
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  private mapNotificationType(type: string): string {
    const typeMap: Record<string, string> = {
      'info': 'INFO',
      'success': 'SUCCESS',
      'warning': 'WARNING',
      'error': 'ERROR',
      'reminder': 'REMINDER'
    }
    return typeMap[type] || 'INFO'
  }
}

// Global notification service instance
let notificationService: NotificationService | null = null

export const initializeNotificationService = (io: SocketIOServer) => {
  notificationService = new NotificationService(io)
  return notificationService
}

export const getNotificationService = (): NotificationService | null => {
  return notificationService
}

// Helper functions for common notifications
export const notifyTaskAssigned = async (taskId: string, assigneeId: string, assignerName: string) => {
  if (!notificationService) return

  await notificationService.notifyUser(assigneeId, {
    type: 'info',
    title: 'Task Assigned',
    message: `${assignerName} assigned you a new task`,
    data: {
      resourceType: 'task',
      resourceId: taskId,
      url: `/tasks/${taskId}`
    }
  })
}

export const notifyProjectUpdate = (projectId: string, updateType: string, data: any) => {
  if (!notificationService) return

  notificationService.notifyProject(projectId, {
    type: 'info',
    title: 'Project Update',
    message: `Project has been ${updateType}`,
    data: {
      resourceType: 'project',
      resourceId: projectId,
      updateType,
      ...data
    }
  })
}

export const notifyTeamMemberAdded = (projectId: string, memberName: string, addedByName: string) => {
  if (!notificationService) return

  notificationService.notifyProject(projectId, {
    type: 'info',
    title: 'Team Member Added',
    message: `${addedByName} added ${memberName} to the project`,
    data: {
      resourceType: 'project',
      resourceId: projectId
    }
  })
}