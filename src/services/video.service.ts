import { io, Socket } from 'socket.io-client';

export interface VideoParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export interface VideoRoom {
  id: string;
  name: string;
  participants: VideoParticipant[];
  maxParticipants: number;
  isRecording: boolean;
  createdAt: Date;
  host: string;
}

class VideoService {
  private socket: Socket | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private currentRoom: VideoRoom | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Video service already connected');
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7001';
    
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Video service connected');
      this.emit('connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Video service disconnected');
      this.emit('connected', false);
      this.cleanup();
    });

    // WebRTC signaling events
    this.socket.on('video:user-joined', async (data: { userId: string; userName: string }) => {
      console.log('User joined video:', data);
      await this.createPeerConnection(data.userId, true);
      this.emit('user-joined', data);
    });

    this.socket.on('video:user-left', (data: { userId: string }) => {
      console.log('User left video:', data);
      this.closePeerConnection(data.userId);
      this.emit('user-left', data);
    });

    this.socket.on('video:offer', async (data: { offer: RTCSessionDescriptionInit; userId: string }) => {
      console.log('Received offer from:', data.userId);
      await this.handleOffer(data.userId, data.offer);
    });

    this.socket.on('video:answer', async (data: { answer: RTCSessionDescriptionInit; userId: string }) => {
      console.log('Received answer from:', data.userId);
      await this.handleAnswer(data.userId, data.answer);
    });

    this.socket.on('video:ice-candidate', async (data: { candidate: RTCIceCandidateInit; userId: string }) => {
      console.log('Received ICE candidate from:', data.userId);
      await this.handleIceCandidate(data.userId, data.candidate);
    });

    this.socket.on('video:room-state', (room: VideoRoom) => {
      this.currentRoom = room;
      this.emit('room-updated', room);
    });
  }

  // Start local media stream
  async startLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      );

      this.emit('local-stream', this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Stop local media stream
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.emit('local-stream', null);
    }
  }

  // Join a video room
  async joinRoom(roomId: string, userName: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    if (!this.localStream) {
      await this.startLocalStream();
    }

    this.socket.emit('video:join-room', { roomId, userName });
  }

  // Leave current room
  leaveRoom() {
    if (!this.socket || !this.currentRoom) return;

    this.socket.emit('video:leave-room', this.currentRoom.id);
    this.cleanup();
  }

  // Create peer connection
  private async createPeerConnection(userId: string, createOffer: boolean = false): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from:', userId);
      this.emit('remote-stream', { userId, stream: event.streams[0] });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('video:ice-candidate', {
          candidate: event.candidate,
          userId
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}: ${pc.connectionState}`);
      this.emit('connection-state', { userId, state: pc.connectionState });
    };

    this.peerConnections.set(userId, pc);

    // Create offer if initiator
    if (createOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket?.emit('video:offer', { offer, userId });
    }

    return pc;
  }

  // Handle incoming offer
  private async handleOffer(userId: string, offer: RTCSessionDescriptionInit) {
    let pc = this.peerConnections.get(userId);
    
    if (!pc) {
      pc = await this.createPeerConnection(userId, false);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket?.emit('video:answer', { answer, userId });
  }

  // Handle incoming answer
  private async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // Close peer connection
  private closePeerConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
  }

  // Toggle audio
  toggleAudio(enabled?: boolean) {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      this.socket?.emit('video:toggle-audio', audioTrack.enabled);
      return audioTrack.enabled;
    }
    return false;
  }

  // Toggle video
  toggleVideo(enabled?: boolean) {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      this.socket?.emit('video:toggle-video', videoTrack.enabled);
      return videoTrack.enabled;
    }
    return false;
  }

  // Start screen sharing
  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      this.peerConnections.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share ending
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      this.socket?.emit('video:screen-share', true);
      this.emit('screen-share', screenStream);
      
      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      return null;
    }
  }

  // Stop screen sharing
  stopScreenShare() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    
    // Replace screen share with camera video
    this.peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    });

    this.socket?.emit('video:screen-share', false);
    this.emit('screen-share', null);
  }

  // Event emitter methods
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Cleanup
  private cleanup() {
    this.stopLocalStream();
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.currentRoom = null;
  }

  disconnect() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Get current room
  getCurrentRoom(): VideoRoom | null {
    return this.currentRoom;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}

export const videoService = new VideoService();