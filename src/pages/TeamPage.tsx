import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Layout } from '@/components/layout/Layout'
import { usePermissions } from '@/services/permissions'
import { useAuthStore } from '@/store/authStore'
import { virtualOfficeService } from '@/services/virtualOfficeSimple.service'
import { teamActivityService, TeamActivity as RealTeamActivity, TeamStats } from '@/services/teamActivity.service'
import { teamChatService, ChatRoom as ServiceChatRoom, ChatMessage as ServiceChatMessage, VideoRoom as ServiceVideoRoom } from '@/services/teamChat.service'
import { calendarService } from '@/services/calendar.service'
import { videoService, VideoParticipant } from '@/services/video.service'
import { teamApi, virtualOfficeApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  AlertCircle, Activity, MessageSquare, Plus, Video, Calendar, MapPin, Home, Gamepad2, Brain,
  Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, ScreenShare, ScreenShareOff, Volume2, VolumeX,
  Send, Paperclip, Smile, MoreVertical, Search, Settings, Users, UserCheck, UserX,
  Building, Coffee, Music, Palette, Clock, Globe, Wifi, WifiOff, CheckCircle2, Circle,
  ArrowUp, ArrowDown, TrendingUp, Star, Award, Trophy, Target, Zap, Sparkles,
  MessageCircle, FileText, Image, File, Download, Play, Pause, Square, ChevronDown,
  Headphones, Monitor, Laptop, Smartphone, MapPinned, Navigation, Compass, Map,
  BookOpen, Briefcase, PenTool, Layers, Grid3x3, Layout as LayoutIcon, Maximize2,
  Sun, Moon, Cloud, CloudRain, Wind, Thermometer, Eye, EyeOff, Lock, Unlock,
  Heart, ThumbsUp, ThumbsDown, Laugh, Frown, PartyPopper, Gift, Flag, Pin,
  Filter, SortAsc, Archive, Trash2, Edit, Copy, Share2, Link, ExternalLink,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Loader2,
  AlertTriangle, Info, HelpCircle, CheckSquare, Square as SquareIcon, MinusSquare
} from 'lucide-react'

// Types for Virtual Office features
interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'online' | 'busy' | 'meeting' | 'away' | 'offline'
  currentActivity?: string
  location?: 'office' | 'home' | 'site' | 'traveling'
  department?: string
  projects?: string[]
  lastSeen?: Date
  timezone?: string
  mood?: 'productive' | 'focused' | 'creative' | 'collaborative' | 'break'
  currentRoom?: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'audio' | 'video'
  reactions?: { emoji: string; users: string[] }[]
  threadId?: string
  edited?: boolean
  fileUrl?: string
  fileName?: string
}

interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group' | 'project' | 'department' | 'social'
  participants: string[]
  lastMessage?: ChatMessage
  unreadCount: number
  isPinned?: boolean
  avatar?: string
}

interface VirtualRoom {
  id: string
  name: string
  type: 'office' | 'lounge' | 'studio' | 'meeting' | 'break' | 'game'
  capacity: number
  currentOccupants?: string[]
  occupants?: string[]  // New backend uses this
  ambientSound?: string
  backgroundImage?: string
  activities?: string[]
  isLocked?: boolean
}

interface TeamActivity {
  id: string
  userId: string
  userName: string
  userAvatar: string
  action: string
  target?: string
  timestamp: Date
  type: 'project' | 'task' | 'design' | 'meeting' | 'achievement' | 'status'
}

// Team data will be loaded from real APIs

// Chat rooms will be loaded from real APIs

// Virtual rooms will be loaded from real APIs

// Activities will be loaded from real APIs

export function TeamPage() {
  const { hasPermission } = usePermissions()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [virtualRooms, setVirtualRooms] = useState<VirtualRoom[]>([])
  const [videoRooms, setVideoRooms] = useState<ServiceVideoRoom[]>([])
  const [activities, setActivities] = useState<TeamActivity[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null)
  const [selectedVirtualRoom, setSelectedVirtualRoom] = useState<VirtualRoom | null>(null)
  const [chatMessages, setChatMessages] = useState<ServiceChatMessage[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [todaysMeetings, setTodaysMeetings] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [userStatus, setUserStatus] = useState<TeamMember['status']>('online')
  const [userLocation, setUserLocation] = useState<TeamMember['location']>('office')
  const [isConnected, setIsConnected] = useState(false)
  const [meetingRooms, setMeetingRooms] = useState<any[]>([])
  const [teamLocations, setTeamLocations] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [ariaInsights, setAriaInsights] = useState<any[]>([])
  const [ariaMessages, setAriaMessages] = useState<any[]>([])
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [videoCallParticipants, setVideoCallParticipants] = useState<VideoParticipant[]>([])
  const [videoCallDuration, setVideoCallDuration] = useState(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [meetingFormData, setMeetingFormData] = useState({
    name: '',
    type: 'meeting' as const,
    maxParticipants: 10,
    description: '',
    isPublic: true
  })
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'meeting' as const,
    location: '',
    isVirtual: true
  })
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    type: 'office' as const,
    address: '',
    coordinates: { lat: 0, lng: 0 }
  })
  const [ariaMessageInput, setAriaMessageInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Check permissions
  const canViewTeam = hasPermission('user.read')
  
  // Fetch real team data from database
  const fetchTeamData = async () => {
    setIsLoadingData(true)
    try {
      // Fetch team members
      const membersResponse = await teamApi.getMembers()
      if (membersResponse.success && membersResponse.data.members) {
        const formattedMembers = membersResponse.data.members.map((member: any) => ({
          id: member.id,
          name: member.name || `${member.firstName} ${member.lastName}`,
          role: member.role || member.department,
          avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.firstName)}&background=0D8ABC&color=fff`,
          status: member.status || 'online',
          currentActivity: member.currentActivity || 'Active',
          location: member.location || 'office',
          department: member.department,
          projects: member.projects || [],
          mood: member.mood || 'productive',
          currentRoom: member.currentRoom
        }))
        setTeamMembers(formattedMembers)
      }

      // Fetch team activity
      const activityResponse = await teamApi.getActivity()
      if (activityResponse.success && activityResponse.data.activities) {
        const formattedActivities = activityResponse.data.activities.map((activity: any) => ({
          id: activity.id,
          userId: activity.userId,
          userName: activity.userName,
          userAvatar: activity.userAvatar,
          action: activity.action,
          target: activity.target,
          timestamp: new Date(activity.timestamp),
          type: activity.type
        }))
        setActivities(formattedActivities)
      }

      // Fetch chat rooms/channels
      const channelsResponse = await teamApi.getChannels()
      if (channelsResponse.success && channelsResponse.data.channels) {
        const formattedChannels = channelsResponse.data.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          participants: channel.participants || [],
          lastMessage: channel.lastMessage,
          unreadCount: channel.unreadCount || 0,
          isPinned: channel.isPinned || false,
          avatar: channel.avatar
        }))
        setChatRooms(formattedChannels)
      }

      // Fetch virtual rooms from virtual office API
      const virtualResponse = await virtualOfficeApi.getRooms()
      if (virtualResponse.data?.rooms) {
        const formattedRooms = virtualResponse.data.rooms.map((room: any) => ({
          id: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity || 10,
          currentOccupants: room.currentOccupants || room.occupants || [],
          ambientSound: room.ambientSound,
          backgroundImage: room.backgroundImage,
          activities: room.activities || [],
          isLocked: room.isLocked || false,
          host: room.host
        }))
        setVirtualRooms(formattedRooms)
      }

      // Fetch meeting rooms
      const meetingRoomsResponse = await virtualOfficeApi.getMeetingRooms()
      if (meetingRoomsResponse.data?.rooms) {
        setMeetingRooms(meetingRoomsResponse.data.rooms)
      }

      // Fetch team locations
      const locationsResponse = await virtualOfficeApi.getTeamLocations()
      if (locationsResponse.data?.locations) {
        setTeamLocations(locationsResponse.data.locations)
      }

      // Fetch calendar events
      const calendarResponse = await virtualOfficeApi.getCalendarEvents()
      if (calendarResponse.data?.events) {
        setCalendarEvents(calendarResponse.data.events)
        // Filter today's events
        const today = new Date().toDateString()
        const todays = calendarResponse.data.events.filter((event: any) => 
          new Date(event.startTime).toDateString() === today
        )
        setTodaysMeetings(todays)
      }

      // Fetch games
      const gamesResponse = await virtualOfficeApi.getGames()
      if (gamesResponse.data?.games) {
        setGames(gamesResponse.data.games)
      }

      // Fetch ARIA insights
      const ariaResponse = await virtualOfficeApi.getARIAInsights()
      if (ariaResponse.data?.insights) {
        setAriaInsights(ariaResponse.data.insights)
      }

      // Fetch online users for presence
      const onlineResponse = await teamApi.getOnlineUsers()
      if (onlineResponse.success && onlineResponse.data.users) {
        // Update team members with online status
        setTeamMembers(prev => prev.map(member => {
          const onlineUser = onlineResponse.data.users.find((u: any) => u.id === member.id)
          return onlineUser ? { ...member, status: onlineUser.status } : member
        }))
      }

    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoadingData(false)
    }
  }
  
  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTeamData()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Connect to Virtual Office on mount
  useEffect(() => {
    if (user) {
      // SECURITY: Services use HTTP-Only cookies for auth (no token needed)
      virtualOfficeService.connect();

      // Connect to chat service
      teamChatService.connect().then(() => {
        // Load chat rooms
        teamChatService.getChatRooms().then(rooms => {
          setChatRooms(rooms as any);
        });
        
        // Load video rooms
        teamChatService.getVideoRooms().then(rooms => {
          setVideoRooms(rooms);
        });
      }).catch(err => {
        console.error('Failed to connect chat service:', err);
      });
      
      // Load calendar meetings
      const loadMeetings = async () => {
        try {
          const allMeetings = await calendarService.getUpcomingMeetings(undefined, 30);
          setMeetings(allMeetings);
          
          // Filter today's meetings
          const today = new Date();
          const todayStart = new Date(today.setHours(0, 0, 0, 0));
          const todayEnd = new Date(today.setHours(23, 59, 59, 999));
          
          const todayMeetings = allMeetings.filter(m => {
            const meetingDate = new Date(m.startTime);
            return meetingDate >= todayStart && meetingDate <= todayEnd;
          });
          
          setTodaysMeetings(todayMeetings);
        } catch (error) {
          console.error('Failed to load meetings:', error);
        }
      };
      
      loadMeetings();
      
      // Set up event listeners
      virtualOfficeService.on('connected', (connected: boolean) => {
        setIsConnected(connected);
      });
      
      // Set up chat message listener
      teamChatService.onMessage((message) => {
        setChatMessages(prev => [...prev, message]);
      });
      
      // Fetch real team data
      fetchTeamData();
      
      virtualOfficeService.on('initialized', (data: any) => {
        console.log('Virtual Office initialized with data:', data);
        // Update virtual rooms with real data
        if (data.rooms) {
          const formattedRooms = data.rooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity || 10,
            currentOccupants: room.currentOccupants || room.occupants || [],
            ambientSound: room.ambientSound,
            backgroundImage: room.backgroundImage,
            activities: room.activities || [],
            isLocked: room.isLocked || false,
            host: room.host
          }));
          setVirtualRooms(formattedRooms);
        }
        setIsConnected(true);
        
        // Show success message
        toast.success(`Connected to Virtual Office as ${data.user?.name || user?.email}`);
      });
      
      virtualOfficeService.on('team-members-loaded', (members: TeamMember[]) => {
        // Merge with existing presence data
        setTeamMembers(prev => {
          const map = new Map(prev.map(m => [m.id, m]));
          members.forEach(m => {
            if (!map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          return Array.from(map.values());
        });
      });
      
      virtualOfficeService.on('user-joined', (member: TeamMember) => {
        setTeamMembers(prev => {
          const exists = prev.find(m => m.id === member.id);
          if (exists) {
            return prev.map(m => m.id === member.id ? member : m);
          }
          return [...prev, member];
        });
      });
      
      virtualOfficeService.on('presence-update', (data: any) => {
        setTeamMembers(prev => prev.map(m => 
          m.id === data.userId ? { ...m, ...data } : m
        ));
      });
      
      virtualOfficeService.on('new-message', (message: any) => {
        // Handle new messages
        toast.success(`New message from ${message.senderName}`);
      });
    }
    
    return () => {
      virtualOfficeService.disconnect();
    };
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    
    // Load messages when chat room is selected
    if (selectedChat) {
      teamChatService.getMessages(selectedChat.id).then(messages => {
        setChatMessages(messages);
      }).catch(err => {
        console.error('Failed to load messages:', err);
      });
      
      // Join the room
      teamChatService.joinRoom(selectedChat.id);
    }
  }, [selectedChat])

  // Video call timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isVideoCallActive) {
      interval = setInterval(() => {
        setVideoCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isVideoCallActive])

  // Video service event listeners
  useEffect(() => {
    if (!isVideoCallActive) return

    const handleParticipantJoined = (participant: VideoParticipant) => {
      setVideoCallParticipants(prev => [...prev, participant])
      toast.success(`${participant.userName} joined the call`)
    }

    const handleParticipantLeft = (participantId: string) => {
      setVideoCallParticipants(prev => prev.filter(p => p.id !== participantId))
      toast.info('A participant left the call')
    }

    const handleRemoteStream = (participantId: string, stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
    }

    videoService.on('participant-joined', handleParticipantJoined)
    videoService.on('participant-left', handleParticipantLeft)
    videoService.on('remote-stream', handleRemoteStream)

    return () => {
      videoService.off('participant-joined', handleParticipantJoined)
      videoService.off('participant-left', handleParticipantLeft)
      videoService.off('remote-stream', handleRemoteStream)
    }
  }, [isVideoCallActive])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return

    // Send message via chat service
    teamChatService.sendMessage(selectedChat.id, messageInput, 'text');
    
    // Also send via Virtual Office for compatibility
    virtualOfficeService.sendMessage(messageInput, selectedChat.id);
    
    setMessageInput('')
  }

  const handleJoinVirtualRoom = (room: VirtualRoom) => {
    if (room.isLocked) {
      toast.error('This room is currently locked')
      return
    }

    setSelectedVirtualRoom(room)
    toast.success(`Joined ${room.name}`)
    
    // Add user to room occupants
    setVirtualRooms(prev => prev.map(r => 
      r.id === room.id 
        ? { ...r, 
            currentOccupants: [...(r.currentOccupants || r.occupants || []), user?.id || '1'],
            occupants: [...(r.occupants || r.currentOccupants || []), user?.id || '1']
          }
        : r
    ))
  }

  const handleLeaveVirtualRoom = () => {
    if (!selectedVirtualRoom) return

    toast.success(`Left ${selectedVirtualRoom.name}`)
    
    // Remove user from room occupants
    setVirtualRooms(prev => prev.map(r => 
      r.id === selectedVirtualRoom.id 
        ? { ...r, currentOccupants: r.currentOccupants.filter(id => id !== (user?.id || '1')) }
        : r
    ))

    setSelectedVirtualRoom(null)
  }

  const handleStartVideoCall = async () => {
    try {
      // SECURITY: Video service uses HTTP-Only cookies for auth (no token needed)
      if (!user) {
        toast.error('Authentication required for video calls')
        return
      }

      videoService.connect()
      
      // Start local media stream
      const stream = await videoService.startLocalStream({
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
      })

      setLocalStream(stream)
      
      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create video room
      const roomId = `team-call-${Date.now()}`
      await videoService.joinRoom(roomId, 'Team Video Call')
      
      setIsVideoCallActive(true)
      setVideoCallDuration(0)
      
      // Update user status to 'meeting'
      await virtualOfficeApi.updatePresence({
        status: 'meeting',
        currentActivity: 'In video call'
      })
      setUserStatus('meeting')
      
      toast.success('Video call started! Camera and microphone enabled.')
    } catch (error) {
      console.error('Failed to start video call:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow permissions.')
      } else {
        toast.error('Failed to start video call')
      }
    }
  }

  const handleEndVideoCall = async () => {
    try {
      // Stop local stream
      videoService.stopLocalStream()
      
      // Leave video room
      await videoService.leaveRoom()
      
      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      
      setLocalStream(null)
      setIsVideoCallActive(false)
      setIsVideoCall(false)
      setIsScreenSharing(false)
      setVideoCallParticipants([])
      setVideoCallDuration(0)
      
      // Update user status back to online
      await virtualOfficeApi.updatePresence({
        status: 'online',
        currentActivity: 'Available'
      })
      setUserStatus('online')
      
      toast.success('Video call ended')
    } catch (error) {
      console.error('Failed to end video call:', error)
      toast.error('Failed to end video call')
    }
  }

  const handlePlayGame = async (gameId: string) => {
    try {
      const response = await virtualOfficeApi.startGame(gameId, {
        participants: teamMembers.map(m => m.id)
      })
      if (response.data?.session) {
        setSelectedGame(gameId)
        toast.success('Game session started! 🎮')
      }
    } catch (error) {
      console.error('Failed to start game:', error)
      toast.error('Failed to start game')
    }
  }

  const handleCreateMeetingRoom = async (data: any) => {
    try {
      const response = await virtualOfficeApi.createMeetingRoom(data)
      if (response.data?.room) {
        setMeetingRooms(prev => [...prev, response.data.room])
        toast.success('Meeting room created!')
        setIsCreatingMeeting(false)
      }
    } catch (error) {
      console.error('Failed to create meeting room:', error)
      toast.error('Failed to create meeting room')
    }
  }

  const handleJoinMeetingRoom = async (roomId: string) => {
    try {
      const response = await virtualOfficeApi.joinMeetingRoom(roomId)
      if (response.data?.room) {
        toast.success(`Joined ${response.data.room.name}`)
        // Update room status
        setMeetingRooms(prev => prev.map(room => 
          room.id === roomId ? { ...room, isOccupied: true } : room
        ))
      }
    } catch (error) {
      console.error('Failed to join meeting room:', error)
      toast.error('Failed to join meeting room')
    }
  }

  const handleCreateCalendarEvent = async (data: any) => {
    try {
      const response = await virtualOfficeApi.createCalendarEvent(data)
      if (response.data?.event) {
        setCalendarEvents(prev => [...prev, response.data.event])
        toast.success('Event created!')
        setIsCreatingEvent(false)
      }
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event')
    }
  }

  const handleUpdateLocation = async (data: any) => {
    try {
      const response = await virtualOfficeApi.updateLocation(data)
      if (response.data) {
        toast.success('Location updated!')
        setIsAddingLocation(false)
        // Refresh team locations
        const locationsResponse = await virtualOfficeApi.getTeamLocations()
        if (locationsResponse.data?.locations) {
          setTeamLocations(locationsResponse.data.locations)
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error)
      toast.error('Failed to update location')
    }
  }

  const handleSendARIAMessage = async (message: string) => {
    if (!message.trim()) return
    
    try {
      const response = await virtualOfficeApi.sendARIAMessage(message)
      if (response.data?.response) {
        setAriaMessages(prev => [...prev, 
          { type: 'user', content: message, timestamp: new Date() },
          { type: 'aria', content: response.data.response, timestamp: new Date() }
        ])
        setAriaMessageInput('') // Clear input after sending
      }
    } catch (error) {
      console.error('Failed to send ARIA message:', error)
      toast.error('Failed to send message to ARIA')
    }
  }

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
        toast.success(videoTrack.enabled ? 'Video enabled' : 'Video disabled')
      }
    }
  }

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
        toast.success(audioTrack.enabled ? 'Audio enabled' : 'Audio disabled')
      }
    }
  }

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream
        }
        setIsScreenSharing(false)
        toast.success('Screen sharing stopped')
      }
    } catch (error) {
      console.error('Failed to toggle screen sharing:', error)
      toast.error('Failed to toggle screen sharing')
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'meeting': return 'bg-orange-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return <Circle className="h-3 w-3 fill-current" />
      case 'busy': return <MinusSquare className="h-3 w-3" />
      case 'meeting': return <Video className="h-3 w-3" />
      case 'away': return <Clock className="h-3 w-3" />
      case 'offline': return <Circle className="h-3 w-3" />
      default: return <Circle className="h-3 w-3" />
    }
  }

  const getMoodEmoji = (mood?: TeamMember['mood']) => {
    switch (mood) {
      case 'productive': return '🚀'
      case 'focused': return '🎯'
      case 'creative': return '🎨'
      case 'collaborative': return '🤝'
      case 'break': return '☕'
      default: return '😊'
    }
  }

  const getLocationIcon = (location?: TeamMember['location']) => {
    switch (location) {
      case 'office': return <Building className="h-4 w-4" />
      case 'home': return <Home className="h-4 w-4" />
      case 'site': return <MapPin className="h-4 w-4" />
      case 'traveling': return <Navigation className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  if (!canViewTeam) {
    return (
      <Layout>
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the Virtual Office.
            </p>
          </div>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Status Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Virtual Office
            </h1>
            <p className="text-muted-foreground mt-1">Welcome to your digital workspace</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Status Selector */}
            <Select value={userStatus} onValueChange={(value: TeamMember['status']) => setUserStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getStatusColor(userStatus)}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Available
                  </div>
                </SelectItem>
                <SelectItem value="busy">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Busy
                  </div>
                </SelectItem>
                <SelectItem value="meeting">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    In Meeting
                  </div>
                </SelectItem>
                <SelectItem value="away">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Away
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Location Selector */}
            <Select value={userLocation} onValueChange={(value: TeamMember['location']) => setUserLocation(value)}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  {getLocationIcon(userLocation)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="site">On Site</SelectItem>
                <SelectItem value="traveling">Traveling</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden lg:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden lg:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="hangouts" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">Hangouts</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden lg:inline">Games</span>
            </TabsTrigger>
            <TabsTrigger value="aria" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden lg:inline">ARIA</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team Activity Feed */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Team Activity</h3>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={activity.userAvatar} />
                            <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.userName}</span>
                              {' '}
                              <span className="text-muted-foreground">{activity.action}</span>
                              {activity.target && (
                                <>
                                  {' '}
                                  <span className="font-medium text-primary">{activity.target}</span>
                                </>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {activity.type === 'achievement' && (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Card>

              {/* Team Status */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Status</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.currentActivity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMoodEmoji(member.mood)}</span>
                            {getLocationIcon(member.location)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Productivity</p>
                    <p className="text-2xl font-bold">{teamStats?.overview?.productivityScore || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={teamStats?.overview?.productivityScore || 0} className="mt-2" />
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{teamStats?.projects?.active || 0}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={teamStats?.projects?.activityRate || 0} className="mt-2" />
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    <p className="text-2xl font-bold">{teamStats?.tasks?.completed || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-500" />
                </div>
                <Progress value={teamStats?.tasks?.completionRate || 0} className="mt-2" />
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{teamStats?.teamMembers?.active || 0}/{teamStats?.teamMembers?.total || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <Progress value={teamStats?.teamMembers?.activityRate || 0} className="mt-2" />
              </Card>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Rooms List */}
              <Card className="lg:col-span-1">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Conversations</h3>
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search conversations..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {chatRooms.map((room) => (
                        <div
                          key={room.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChat?.id === room.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedChat(room)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={room.avatar} />
                                <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{room.name}</p>
                                  {room.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                                </div>
                                {room.lastMessage && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {room.lastMessage.senderName}: {room.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            {room.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Card>

              {/* Chat Window */}
              <Card className="lg:col-span-3">
                {selectedChat ? (
                  <div className="flex flex-col h-[600px]">
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedChat.avatar} />
                          <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedChat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedChat.participants.length} members
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-sm text-muted-foreground py-8">
                            No messages yet. Start the conversation!
                          </div>
                        ) : (
                          <>
                            <div className="text-center text-sm text-muted-foreground py-2">
                              Today
                            </div>
                            
                            {/* Real Messages */}
                            {chatMessages.map((message) => (
                              <div key={message.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={message.senderAvatar} />
                                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium">{message.senderName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(message.timestamp).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <div className={`rounded-lg p-3 max-w-[80%] ${
                                    message.senderId === user?.id ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
                                  }`}>
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Video Hub Tab */}
          <TabsContent value="video" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Call Area */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  {isVideoCallActive ? (
                    <div className="space-y-4">
                      {/* Video Stream */}
                      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg relative overflow-hidden">
                        {/* Main Video */}
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Video Overlay */}
                        {!localStream && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg">Connecting to camera...</p>
                              <p className="text-sm opacity-75">Please allow camera access</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Local Video Thumbnail */}
                        {localStream && (
                          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                            <video
                              ref={localVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Remote Video */}
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ display: videoCallParticipants.length > 0 ? 'block' : 'none' }}
                        />

                        {/* Call Controls */}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <Button
                            size="icon"
                            variant={!isAudioEnabled ? "destructive" : "secondary"}
                            onClick={handleToggleAudio}
                          >
                            {!isAudioEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant={!isVideoEnabled ? "destructive" : "secondary"}
                            onClick={handleToggleVideo}
                          >
                            {!isVideoEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant={isScreenSharing ? "default" : "secondary"}
                            onClick={handleToggleScreenShare}
                          >
                            {isScreenSharing ? <ScreenShareOff className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={handleEndVideoCall}
                          >
                            <PhoneOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Meeting Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Team Video Call</p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {Math.floor(videoCallDuration / 60)}:{(videoCallDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Square className="h-4 w-4 mr-2" />
                          Record
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="text-center">
                        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Start a Video Call</h3>
                        <p className="text-muted-foreground mb-4">Connect with your team face-to-face</p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={handleStartVideoCall}>
                            <Video className="h-4 w-4 mr-2" />
                            Start Video Call
                          </Button>
                          <Button variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Meeting Rooms */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Meeting Rooms</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setIsCreatingMeeting(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Room
                    </Button>
                  </div>
                  
                  {meetingRooms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No meeting rooms available</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setIsCreatingMeeting(true)}
                      >
                        Create First Room
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetingRooms.map((room) => (
                        <div key={room.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{room.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{room.type}</p>
                            </div>
                            <Badge variant={room.isOccupied ? "destructive" : "outline"}>
                              {room.isOccupied ? 'Occupied' : 'Available'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {room.participants?.length || 0}/{room.maxParticipants} participants
                            </div>
                            <Button 
                              className="w-24" 
                              size="sm"
                              disabled={room.isOccupied}
                              onClick={() => handleJoinMeetingRoom(room.id)}
                            >
                              {room.isOccupied ? 'In Use' : 'Join Room'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Team Calendar</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setIsCreatingEvent(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Event
                    </Button>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i - 2; // Start from the 29th of previous month
                        const isCurrentMonth = day >= 1 && day <= 31;
                        const isToday = day === 10;
                        const todayEvents = calendarEvents.filter(event => {
                          const eventDate = new Date(event.startTime);
                          return eventDate.getDate() === 10 && eventDate.getMonth() === new Date().getMonth();
                        });
                        
                        return (
                          <div
                            key={i}
                            className={`
                              aspect-square p-2 border rounded-lg text-sm
                              ${isCurrentMonth ? '' : 'opacity-50'}
                              ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                            `}
                          >
                            <div className="font-medium">
                              {day <= 0 ? 29 + day : day > 31 ? day - 31 : day}
                            </div>
                            {isToday && todayEvents.length > 0 && (
                              <div className="text-xs mt-1">{todayEvents.length} events</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Today's Schedule */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {todaysMeetings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No meetings scheduled for today</p>
                        </div>
                      ) : (
                        todaysMeetings.map((meeting) => {
                          const startTime = new Date(meeting.startTime);
                          const endTime = new Date(meeting.endTime);
                          const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                          
                          // Determine color based on meeting type
                          const colorClass = meeting.type === 'standup' ? 'blue' :
                                           meeting.type === 'design' ? 'purple' :
                                           meeting.type === 'client' ? 'green' :
                                           'orange';
                          
                          return (
                            <div key={meeting.id} className="flex gap-3">
                              <div className="text-xs text-muted-foreground w-12">
                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                              <div className={`flex-1 p-2 bg-${colorClass}-500/10 border-l-2 border-${colorClass}-500 rounded`}>
                                <p className="text-sm font-medium">{meeting.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {meeting.location || 'Virtual'} - {duration} min
                                </p>
                                {meeting.participants && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Users className="h-3 w-3" />
                                    <span className="text-xs">{meeting.participants.length} participants</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map View */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Team Locations</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setIsAddingLocation(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </div>
                  
                  {/* Interactive Map */}
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Map className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                    
                    {/* Real Location Pins */}
                    {teamLocations.map((location, index) => (
                      <div 
                        key={location.id}
                        className="absolute cursor-pointer"
                        style={{
                          top: `${20 + (index * 20)}%`,
                          left: `${30 + (index * 15)}%`
                        }}
                      >
                        <div className="relative group">
                          <MapPin className={`h-8 w-8 ${location.type === 'office' ? 'text-red-500' : location.type === 'site' ? 'text-blue-500' : 'text-green-500'}`} />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <Card className="p-3 text-xs whitespace-nowrap min-w-[200px]">
                              <p className="font-medium">{location.name}</p>
                              <p className="text-muted-foreground">{location.address}</p>
                              <p className="text-muted-foreground">{location.members?.length || 0} team members</p>
                              <div className="flex items-center gap-1 mt-1">
                                {location.members?.slice(0, 3).map((member: any) => (
                                  <Avatar key={member.id} className="h-4 w-4">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {location.members?.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{location.members.length - 3}</span>
                                )}
                              </div>
                            </Card>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Office Floor Plan */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Office Floor Plan</h4>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 12 }, (_, i) => {
                          const occupied = i === 2 || i === 5 || i === 7;
                          return (
                            <div
                              key={i}
                              className={`
                                aspect-square rounded border-2 flex items-center justify-center text-xs
                                ${occupied ? 'border-primary bg-primary/10' : 'border-dashed border-muted-foreground/30'}
                              `}
                            >
                              {occupied ? `Desk ${i + 1}` : 'Empty'}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Location Stats */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Location Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">In Office</p>
                          <p className="text-sm text-muted-foreground">Main HQ</p>
                        </div>
                      </div>
                      <Badge>3</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Working from Home</p>
                          <p className="text-sm text-muted-foreground">Remote</p>
                        </div>
                      </div>
                      <Badge>1</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">On Site</p>
                          <p className="text-sm text-muted-foreground">Various locations</p>
                        </div>
                      </div>
                      <Badge>1</Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-3">Check In/Out</h4>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        <MapPinned className="h-4 w-4 mr-2" />
                        Check In to Office
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Navigation className="h-4 w-4 mr-2" />
                        Update Location
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Virtual Hangouts Tab */}
          <TabsContent value="hangouts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {virtualRooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <div 
                    className="h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 relative"
                    style={{ 
                      backgroundImage: room.backgroundImage ? `url(${room.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute top-4 left-4">
                      <Badge variant={room.isLocked ? "destructive" : "default"}>
                        {room.isLocked ? 'Locked' : 'Open'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 flex -space-x-2">
                      {(room.currentOccupants || room.occupants || []).slice(0, 3).map((userId) => {
                        const member = teamMembers.find(m => m.id === userId)
                        return member ? (
                          <Avatar key={userId} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name ? member.name.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                        ) : null
                      })}
                      {(room.currentOccupants || room.occupants || []).length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                          +{(room.currentOccupants || room.occupants || []).length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{room.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {(room.currentOccupants || room.occupants || []).length}/{room.capacity || 10} people
                    </p>
                    
                    {room.activities && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {room.activities.map((activity) => (
                          <Badge key={activity} variant="secondary" className="text-xs">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {selectedVirtualRoom?.id === room.id ? (
                      <Button 
                        className="w-full" 
                        variant="destructive"
                        onClick={handleLeaveVirtualRoom}
                      >
                        Leave Room
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleJoinVirtualRoom(room)}
                        disabled={room.isLocked}
                      >
                        Join Room
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Ambient Sound Controls */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Ambient Sounds</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
                    <Coffee className="h-6 w-6" />
                    <span className="text-xs">Coffee Shop</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
                    <Building className="h-6 w-6" />
                    <span className="text-xs">Office Buzz</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
                    <Wind className="h-6 w-6" />
                    <span className="text-xs">Nature</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
                    <Music className="h-6 w-6" />
                    <span className="text-xs">Lo-Fi</span>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Games Available</h3>
                  <p className="text-muted-foreground mb-4">Games will be loaded from the server</p>
                </div>
              ) : (
                games.map((game) => (
                  <Card key={game.id} className="overflow-hidden">
                    <div className={`h-32 bg-gradient-to-br ${game.gradient || 'from-purple-600 to-pink-600'} flex items-center justify-center`}>
                      {game.icon === 'trophy' && <Trophy className="h-16 w-16 text-white" />}
                      {game.icon === 'palette' && <Palette className="h-16 w-16 text-white" />}
                      {game.icon === 'grid' && <Grid3x3 className="h-16 w-16 text-white" />}
                      {game.icon === 'help' && <HelpCircle className="h-16 w-16 text-white" />}
                      {game.icon === 'lock' && <Lock className="h-16 w-16 text-white" />}
                      {game.icon === 'message' && <MessageCircle className="h-16 w-16 text-white" />}
                      {!game.icon && <Gamepad2 className="h-16 w-16 text-white" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{game.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex -space-x-2">
                          {game.players?.slice(0, 3).map((player: any) => (
                            <Avatar key={player.id} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <Badge variant="secondary">{game.players?.length || 0} playing</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handlePlayGame(game.id)}
                      >
                        {game.status === 'in-progress' ? 'Continue Playing' : 'Play Now'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              {/* Design Challenge */}
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                  <Palette className="h-16 w-16 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Design Challenge</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    30-minute speed design competitions with your team
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge>New Challenge Daily</Badge>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayGame('design-challenge')}
                  >
                    Start Challenge
                  </Button>
                </div>
              </Card>

              {/* Building Blocks */}
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <Grid3x3 className="h-16 w-16 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Building Blocks</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Collaborative 3D building puzzle game
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">Multiplayer</Badge>
                    <Badge variant="outline">Co-op</Badge>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayGame('building-blocks')}
                  >
                    Create Room
                  </Button>
                </div>
              </Card>

              {/* Guess the Building */}
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                  <HelpCircle className="h-16 w-16 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Guess the Building</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Identify famous buildings from clues and sketches
                  </p>
                  <Progress value={65} className="mb-3" />
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayGame('guess-building')}
                  >
                    Continue Playing
                  </Button>
                </div>
              </Card>

              {/* Virtual Escape Room */}
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Lock className="h-16 w-16 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Escape Room</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Team up to solve architectural puzzles and escape
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="destructive">60 min</Badge>
                    <Badge>4-6 players</Badge>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayGame('escape-room')}
                  >
                    Find Team
                  </Button>
                </div>
              </Card>

              {/* Word Association */}
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center">
                  <MessageCircle className="h-16 w-16 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Word Association</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quick word games to boost creativity and teamwork
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">Quick Play</Badge>
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePlayGame('word-association')}
                  >
                    Quick Game
                  </Button>
                </div>
              </Card>
            </div>

            {/* Leaderboard */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">This Week's Leaders</h3>
                <div className="space-y-3">
                  {teamMembers.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-600 text-white'}
                      `}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {1250 - index * 150} points
                        </p>
                      </div>
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ARIA Assistant Tab */}
          <TabsContent value="aria" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ARIA Chat Interface */}
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">ARIA Team Assistant</h3>
                      <p className="text-sm text-muted-foreground">AI-powered insights for your team</p>
                    </div>
                  </div>

                  <ScrollArea className="h-[400px] mb-4">
                    <div className="space-y-4">
                      {/* ARIA Insights */}
                      {ariaInsights.map((insight) => (
                        <div key={insight.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <Card className="p-3">
                              <p className="text-sm mb-2">{insight.title}</p>
                              <ul className="text-sm space-y-1 ml-4">
                                {insight.points?.map((point: string, index: number) => (
                                  <li key={index}>• {point}</li>
                                ))}
                              </ul>
                            </Card>
                          </div>
                        </div>
                      ))}

                      {/* ARIA Chat Messages */}
                      {ariaMessages.map((message, index) => (
                        <div key={index} className="flex gap-3">
                          {message.type === 'user' ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Brain className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Card className="p-3">
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </Card>
                          </div>
                        </div>
                      ))}

                      {/* Sample ARIA Response */}
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <Card className="p-3">
                            <p className="text-sm mb-2">Heritage Mall Project Status:</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span>Overall Progress</span>
                                <Badge>62% Complete</Badge>
                              </div>
                              <Progress value={62} className="h-2" />
                              <p className="text-muted-foreground">
                                Currently in Design Development phase. Ahmad Razak is meeting with the client today to review the latest facade designs.
                              </p>
                            </div>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Ask ARIA anything about your team or projects..."
                      className="min-h-[80px]"
                      value={ariaMessageInput}
                      onChange={(e) => setAriaMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendARIAMessage(ariaMessageInput)}
                    />
                    <Button 
                      size="icon" 
                      className="h-[80px]"
                      onClick={() => handleSendARIAMessage(ariaMessageInput)}
                      disabled={!ariaMessageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* ARIA Insights */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Insights</h3>
                  
                  <div className="space-y-4">
                    {/* Sentiment Analysis */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Team Sentiment</p>
                        <Badge variant="outline">Positive</Badge>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on recent communications
                      </p>
                    </div>

                    {/* Collaboration Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Collaboration Score</p>
                        <span className="text-sm font-bold">9.2/10</span>
                      </div>
                      <Progress value={92} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Excellent team coordination
                      </p>
                    </div>

                    {/* Workload Balance */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Workload Balance</p>
                        <Badge variant="secondary">Good</Badge>
                      </div>
                      <div className="space-y-1 mt-2">
                        {teamMembers.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center gap-2">
                            <span className="text-xs w-20 truncate">{member.name}</span>
                            <Progress value={60 + Math.random() * 30} className="h-1 flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* AI Suggestions */}
                    <div>
                      <p className="text-sm font-medium mb-2">AI Suggestions</p>
                      <div className="space-y-2">
                        <Card className="p-2 bg-blue-500/10 border-blue-500/20">
                          <p className="text-xs">
                            Schedule a team break at 3 PM - high activity detected
                          </p>
                        </Card>
                        <Card className="p-2 bg-green-500/10 border-green-500/20">
                          <p className="text-xs">
                            Consider pairing Maria and Lisa on the Modern Villa project
                          </p>
                        </Card>
                        <Card className="p-2 bg-purple-500/10 border-purple-500/20">
                          <p className="text-xs">
                            Time to celebrate - KLCC Tower milestone achieved! 🎉
                          </p>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
              </div>

        {/* Create Meeting Room Dialog */}
        <Dialog open={isCreatingMeeting} onOpenChange={setIsCreatingMeeting}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Meeting Room</DialogTitle>
              <DialogDescription>
                Create a new meeting room for your team to collaborate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meeting-name">Room Name</Label>
                <Input
                  id="meeting-name"
                  value={meetingFormData.name}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <Label htmlFor="meeting-type">Room Type</Label>
                <Select 
                  value={meetingFormData.type} 
                  onValueChange={(value: any) => setMeetingFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">General Meeting</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="brainstorm">Brainstorm</SelectItem>
                    <SelectItem value="client">Client Meeting</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="meeting-description">Description</Label>
                <Textarea
                  id="meeting-description"
                  value={meetingFormData.description}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this room"
                />
              </div>
              <div>
                <Label htmlFor="meeting-participants">Max Participants</Label>
                <Input
                  id="meeting-participants"
                  type="number"
                  value={meetingFormData.maxParticipants}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  min="2"
                  max="50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="meeting-public"
                  checked={meetingFormData.isPublic}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <Label htmlFor="meeting-public">Public Room (visible to all team members)</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingMeeting(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreateMeetingRoom(meetingFormData)}>
                Create Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Calendar Event Dialog */}
        <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Calendar Event</DialogTitle>
              <DialogDescription>
                Schedule a new event for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-title">Event Title</Label>
                <Input
                  id="event-title"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the event"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-start">Start Time</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={eventFormData.startTime}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="event-end">End Time</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={eventFormData.endTime}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <Select 
                  value={eventFormData.type} 
                  onValueChange={(value: any) => setEventFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="social">Social Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location or meeting link"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="event-virtual"
                  checked={eventFormData.isVirtual}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, isVirtual: e.target.checked }))}
                />
                <Label htmlFor="event-virtual">Virtual Event</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingEvent(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreateCalendarEvent(eventFormData)}>
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Location Dialog */}
        <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Team Location</DialogTitle>
              <DialogDescription>
                Add a new location for your team members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-name">Location Name</Label>
                <Input
                  id="location-name"
                  value={locationFormData.name}
                  onChange={(e) => setLocationFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter location name"
                />
              </div>
              <div>
                <Label htmlFor="location-type">Location Type</Label>
                <Select 
                  value={locationFormData.type} 
                  onValueChange={(value: any) => setLocationFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="site">Construction Site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="client">Client Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location-address">Address</Label>
                <Textarea
                  id="location-address"
                  value={locationFormData.address}
                  onChange={(e) => setLocationFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingLocation(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateLocation(locationFormData)}>
                Add Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    )
  }