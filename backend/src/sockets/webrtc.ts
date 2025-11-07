import { Server as SocketIOServer, Socket } from 'socket.io';

interface WebRTCSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    username: string;
  };
  roomId?: string;
}

interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

export const setupWebRTCSignaling = (io: SocketIOServer) => {
  const rooms = new Map<string, Set<string>>(); // roomId -> Set of userIds
  const userSockets = new Map<string, string>(); // userId -> socketId

  io.on('connection', (socket: WebRTCSocket) => {
    // Store user socket mapping
    socket.on('webrtc-register', (userId: string) => {
      socket.userId = userId;
      userSockets.set(userId, socket.id);
      console.log(`WebRTC: User ${userId} registered with socket ${socket.id}`);
    });

    // Join a WebRTC room (for audio/video calls)
    socket.on('webrtc-join-room', (data: { roomId: string; userId: string; username: string }) => {
      const { roomId, userId, username } = data;
      
      socket.userId = userId;
      socket.user = { id: userId, username };
      socket.roomId = roomId;
      
      // Add user to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(userId);
      
      socket.join(`webrtc:${roomId}`);
      
      // Get existing participants
      const participants = Array.from(rooms.get(roomId)!).filter(id => id !== userId);
      
      // Notify the new user about existing participants
      socket.emit('webrtc-room-joined', {
        roomId,
        participants: participants.map(id => ({
          userId: id,
          socketId: userSockets.get(id),
        })),
      });
      
      // Notify existing participants about the new user
      socket.to(`webrtc:${roomId}`).emit('webrtc-user-joined', {
        userId,
        username,
        socketId: socket.id,
      });
      
      console.log(`WebRTC: User ${username} joined room ${roomId}. Total participants: ${rooms.get(roomId)!.size}`);
    });

    // Handle WebRTC offer
    socket.on('webrtc-offer', (data: {
      offer: SessionDescription;
      targetUserId: string;
      roomId: string;
    }) => {
      const targetSocketId = userSockets.get(data.targetUserId);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-offer', {
          offer: data.offer,
          fromUserId: socket.userId,
          fromUsername: socket.user?.username,
          roomId: data.roomId,
        });
        console.log(`WebRTC: Offer sent from ${socket.userId} to ${data.targetUserId}`);
      } else {
        socket.emit('webrtc-error', {
          message: 'Target user not found',
          targetUserId: data.targetUserId,
        });
      }
    });

    // Handle WebRTC answer
    socket.on('webrtc-answer', (data: {
      answer: SessionDescription;
      targetUserId: string;
      roomId: string;
    }) => {
      const targetSocketId = userSockets.get(data.targetUserId);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-answer', {
          answer: data.answer,
          fromUserId: socket.userId,
          fromUsername: socket.user?.username,
          roomId: data.roomId,
        });
        console.log(`WebRTC: Answer sent from ${socket.userId} to ${data.targetUserId}`);
      }
    });

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', (data: {
      candidate: IceCandidate;
      targetUserId: string;
      roomId: string;
    }) => {
      const targetSocketId = userSockets.get(data.targetUserId);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
          candidate: data.candidate,
          fromUserId: socket.userId,
          roomId: data.roomId,
        });
      }
    });

    // Handle media state changes
    socket.on('webrtc-media-state', (data: {
      roomId: string;
      audio: boolean;
      video: boolean;
      screen: boolean;
    }) => {
      socket.to(`webrtc:${data.roomId}`).emit('webrtc-user-media-state', {
        userId: socket.userId,
        username: socket.user?.username,
        audio: data.audio,
        video: data.video,
        screen: data.screen,
      });
    });

    // Handle screen sharing
    socket.on('webrtc-start-screen-share', (roomId: string) => {
      socket.to(`webrtc:${roomId}`).emit('webrtc-user-started-screen-share', {
        userId: socket.userId,
        username: socket.user?.username,
      });
    });

    socket.on('webrtc-stop-screen-share', (roomId: string) => {
      socket.to(`webrtc:${roomId}`).emit('webrtc-user-stopped-screen-share', {
        userId: socket.userId,
      });
    });

    // Handle recording
    socket.on('webrtc-start-recording', (roomId: string) => {
      // In production, you would start server-side recording here
      socket.to(`webrtc:${roomId}`).emit('webrtc-recording-started', {
        startedBy: socket.user?.username,
        timestamp: new Date(),
      });
      console.log(`WebRTC: Recording started in room ${roomId} by ${socket.user?.username}`);
    });

    socket.on('webrtc-stop-recording', (roomId: string) => {
      // In production, you would stop server-side recording here
      socket.to(`webrtc:${roomId}`).emit('webrtc-recording-stopped', {
        stoppedBy: socket.user?.username,
        timestamp: new Date(),
      });
      console.log(`WebRTC: Recording stopped in room ${roomId} by ${socket.user?.username}`);
    });

    // Handle leaving a room
    socket.on('webrtc-leave-room', (roomId: string) => {
      if (socket.userId && rooms.has(roomId)) {
        rooms.get(roomId)!.delete(socket.userId);
        
        if (rooms.get(roomId)!.size === 0) {
          rooms.delete(roomId);
        }
        
        socket.leave(`webrtc:${roomId}`);
        
        socket.to(`webrtc:${roomId}`).emit('webrtc-user-left', {
          userId: socket.userId,
          username: socket.user?.username,
        });
        
        console.log(`WebRTC: User ${socket.user?.username} left room ${roomId}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        
        // Remove from all rooms
        if (socket.roomId && rooms.has(socket.roomId)) {
          rooms.get(socket.roomId)!.delete(socket.userId);
          
          if (rooms.get(socket.roomId)!.size === 0) {
            rooms.delete(socket.roomId);
          }
          
          socket.to(`webrtc:${socket.roomId}`).emit('webrtc-user-disconnected', {
            userId: socket.userId,
            username: socket.user?.username,
          });
        }
        
        console.log(`WebRTC: User ${socket.userId} disconnected`);
      }
    });

    // Ping-pong for connection health
    socket.on('webrtc-ping', () => {
      socket.emit('webrtc-pong', { timestamp: Date.now() });
    });
  });

  // Periodic cleanup of stale rooms
  setInterval(() => {
    rooms.forEach((users, roomId) => {
      if (users.size === 0) {
        rooms.delete(roomId);
        console.log(`WebRTC: Cleaned up empty room ${roomId}`);
      }
    });
  }, 60000); // Clean up every minute
};