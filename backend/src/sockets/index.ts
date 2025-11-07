import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export const setupSocketHandlers = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        username: string;
        role: string;
      };

      // Verify session
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid or expired token'));
      }

      socket.userId = decoded.userId;
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Document review room management
    socket.on('join-review', async (reviewId: string) => {
      try {
        // Verify user has access to this review
        const review = await prisma.review.findUnique({
          where: { id: reviewId },
          include: {
            participants: {
              where: { userId: socket.userId },
            },
          },
        });

        if (!review) {
          socket.emit('error', { message: 'Review not found' });
          return;
        }

        // Add user as participant if not already
        if (review.participants.length === 0) {
          await prisma.reviewParticipant.create({
            data: {
              reviewId,
              userId: socket.userId!,
              role: 'VIEWER',
            },
          });
        } else {
          // Update participant as active
          await prisma.reviewParticipant.updateMany({
            where: {
              reviewId,
              userId: socket.userId!,
            },
            data: {
              isActive: true,
              leftAt: null,
            },
          });
        }

        socket.join(`review:${reviewId}`);
        
        // Notify others in the review
        socket.to(`review:${reviewId}`).emit('user-joined', {
          userId: socket.userId,
          username: socket.user?.username,
          timestamp: new Date(),
        });

        // Get active participants
        const activeParticipants = await prisma.reviewParticipant.findMany({
          where: {
            reviewId,
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        });

        socket.emit('review-joined', {
          reviewId,
          participants: activeParticipants,
        });

        console.log(`User ${socket.user?.username} joined review ${reviewId}`);
      } catch (error) {
        console.error('Error joining review:', error);
        socket.emit('error', { message: 'Failed to join review' });
      }
    });

    socket.on('leave-review', async (reviewId: string) => {
      try {
        // Mark participant as inactive
        await prisma.reviewParticipant.updateMany({
          where: {
            reviewId,
            userId: socket.userId!,
          },
          data: {
            isActive: false,
            leftAt: new Date(),
          },
        });

        socket.leave(`review:${reviewId}`);
        
        // Notify others
        socket.to(`review:${reviewId}`).emit('user-left', {
          userId: socket.userId,
          username: socket.user?.username,
          timestamp: new Date(),
        });

        console.log(`User ${socket.user?.username} left review ${reviewId}`);
      } catch (error) {
        console.error('Error leaving review:', error);
      }
    });

    // Chat messages
    socket.on('send-message', async (data: {
      reviewId: string;
      content: string;
      type?: string;
    }) => {
      try {
        // Verify user is in the review
        const participant = await prisma.reviewParticipant.findFirst({
          where: {
            reviewId: data.reviewId,
            userId: socket.userId!,
            isActive: true,
          },
        });

        if (!participant) {
          socket.emit('error', { message: 'Not authorized to send messages' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            reviewId: data.reviewId,
            userId: socket.userId!,
            type: (data.type as any) || 'TEXT',
            content: data.content,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        });

        // Broadcast to all participants
        io.to(`review:${data.reviewId}`).emit('new-message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Annotations
    socket.on('add-annotation', async (data: {
      documentId: string;
      type: string;
      content: string;
      position: any;
      priority?: string;
    }) => {
      try {
        const annotation = await prisma.annotation.create({
          data: {
            documentId: data.documentId,
            userId: socket.userId!,
            type: data.type as any,
            content: data.content,
            position: data.position,
            priority: (data.priority as any) || 'MEDIUM',
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        });

        // Notify all users viewing this document
        io.emit('new-annotation', annotation);
      } catch (error) {
        console.error('Error adding annotation:', error);
        socket.emit('error', { message: 'Failed to add annotation' });
      }
    });

    // Cursor tracking for collaborative editing
    socket.on('cursor-move', (data: {
      reviewId: string;
      position: { x: number; y: number; page?: number };
    }) => {
      socket.to(`review:${data.reviewId}`).emit('cursor-update', {
        userId: socket.userId,
        username: socket.user?.username,
        position: data.position,
      });
    });

    // Selection tracking
    socket.on('selection-change', (data: {
      reviewId: string;
      selection: any;
    }) => {
      socket.to(`review:${data.reviewId}`).emit('selection-update', {
        userId: socket.userId,
        username: socket.user?.username,
        selection: data.selection,
      });
    });

    // Document state changes
    socket.on('document-update', async (data: {
      documentId: string;
      changes: any;
    }) => {
      try {
        // Verify user has permission to update
        const document = await prisma.document.findUnique({
          where: { id: data.documentId },
        });

        if (!document || (document.uploadedBy !== socket.userId && socket.user?.role !== 'ADMIN')) {
          socket.emit('error', { message: 'Not authorized to update document' });
          return;
        }

        // Broadcast changes to all viewers
        io.emit('document-changed', {
          documentId: data.documentId,
          changes: data.changes,
          userId: socket.userId,
          username: socket.user?.username,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error updating document:', error);
        socket.emit('error', { message: 'Failed to update document' });
      }
    });

    // Typing indicators
    socket.on('typing-start', (reviewId: string) => {
      socket.to(`review:${reviewId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.user?.username,
      });
    });

    socket.on('typing-stop', (reviewId: string) => {
      socket.to(`review:${reviewId}`).emit('user-stopped-typing', {
        userId: socket.userId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected (${socket.id})`);

      // Mark user as inactive in all reviews
      // TODO: Enable when ReviewParticipant model is added to schema
      // await prisma.reviewParticipant.updateMany({
      //   where: {
      //     userId: socket.userId!,
      //     isActive: true,
      //   },
      //   data: {
      //     isActive: false,
      //     leftAt: new Date(),
      //   },
      // });

      // Notify all rooms
      socket.rooms.forEach((room) => {
        if (room.startsWith('review:')) {
          socket.to(room).emit('user-disconnected', {
            userId: socket.userId,
            username: socket.user?.username,
            timestamp: new Date(),
          });
        }
      });
    });
  });
};