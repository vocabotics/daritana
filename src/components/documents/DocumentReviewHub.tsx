import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Phone,
  PhoneOff,
  Settings,
  Download,
  Upload,
  Share2,
  Lock,
  Unlock,
  Menu,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  GitBranch,
  GitCommit,
  GitMerge,
  History,
  Eye,
  Edit3,
  Save,
  RefreshCw,
  Maximize2,
  Minimize2,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Camera,
  Radio,
  Headphones,
  Volume2,
  VolumeX,
  UserPlus,
  UserMinus,
  Shield,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Copy,
  Scissors,
  Paperclip,
  Link,
  Send,
  Archive,
  Trash2,
  MoreVertical,
  Plus,
  Minus,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Smile,
  Frown,
  Zap,
  Brain,
  Sparkles,
  Bot,
  // Additional icons for markup tools
  Pen,
  Highlighter,
  Type,
  ArrowUp,
  Square,
  Circle,
  Ruler,
  Stamp,
  Cloud,
  Crosshair,
  Move,
  Eraser,
  Palette,
  Undo,
  Redo,
  Box,
  Package,
  Navigation,
  Compass,
  Sun,
  Map as MapIcon,
  Fullscreen,
  Filter,
  GitCompare,
  FileCheck,
  FileX,
  FileQuestion,
  FolderOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  CornerUpLeft,
  CornerUpRight,
  ArrowBigUp,
  MousePointer,
  PenTool,
  Slash,
  Sliders,
  Aperture,
  Maximize,
  Minimize,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Pipette,
  PaintBucket,
  Brush,
  Scissors as ScissorsIcon,
  FileImage,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { documentReviewService } from '@/services/documentReviewService'

interface DocumentVersion {
  id: string
  version: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: Date
  changes: {
    additions: number
    deletions: number
    modifications: number
  }
  status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived'
  comments: number
  reviewers: string[]
  approvals: {
    userId: string
    status: 'pending' | 'approved' | 'rejected'
    timestamp?: Date
    comments?: string
  }[]
  tags: string[]
  description: string
}

interface ReviewParticipant {
  id: string
  name: string
  avatar?: string
  role: 'owner' | 'reviewer' | 'viewer' | 'contributor'
  status: 'online' | 'away' | 'busy' | 'offline'
  isAudioOn: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  isSpeaking: boolean
  joinedAt: Date
  contributions: number
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: 'text' | 'emoji' | 'file' | 'image' | 'annotation' | 'ai'
  content: string
  timestamp: Date
  reactions: {
    type: string
    users: string[]
  }[]
  replyTo?: string
  edited?: boolean
  editedAt?: Date
}

interface DocumentAnnotation {
  id: string
  userId: string
  userName: string
  type: 'comment' | 'highlight' | 'suggestion' | 'question' | 'approval' | 'pen' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'measurement' | 'stamp' | 'cloud' | 'dimension' | 'hatch' | 'text' | 'pin3d'
  content: string
  position: {
    page?: number
    x: number
    y: number
    z?: number // For 3D annotations
    width?: number
    height?: number
    depth?: number // For 3D annotations
    points?: { x: number; y: number; z?: number }[] // For freehand/polyline
  }
  style?: {
    color?: string
    strokeWidth?: number
    fillColor?: string
    opacity?: number
    fontSize?: number
    fontFamily?: string
    pattern?: 'solid' | 'dashed' | 'dotted' | 'hatch1' | 'hatch2' | 'hatch3'
    arrowStyle?: 'none' | 'arrow' | 'dot' | 'open'
    stampType?: 'approved' | 'rejected' | 'revise' | 'for_review' | 'checked' | 'void'
  }
  measurement?: {
    value: number
    unit: 'mm' | 'cm' | 'm' | 'ft' | 'in'
    scale?: number
    angle?: number
  }
  layer?: string
  discipline?: 'architectural' | 'structural' | 'mep' | 'electrical' | 'plumbing' | 'landscape'
  timestamp: Date
  resolved: boolean
  replies: {
    userId: string
    userName: string
    content: string
    timestamp: Date
  }[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  version?: string
  isVisible?: boolean
}

interface ReviewSession {
  id: string
  documentId: string
  documentName: string
  startTime: Date
  endTime?: Date
  participants: ReviewParticipant[]
  isRecording: boolean
  recordingUrl?: string
  transcript: {
    speaker: string
    text: string
    timestamp: Date
  }[]
  decisions: {
    type: string
    description: string
    timestamp: Date
    madeBy: string
  }[]
  aiInsights: {
    type: 'suggestion' | 'warning' | 'insight' | 'summary'
    content: string
    confidence: number
    timestamp: Date
  }[]
}

// Tool types for markup
type MarkupTool = 
  | 'select' | 'pan' | 'pen' | 'highlighter' | 'text' | 'arrow' | 'rectangle' | 'circle' 
  | 'line' | 'measurement' | 'stamp' | 'cloud' | 'dimension' | 'hatch' | 'eraser'
  | 'orbit' | 'section' | 'measure3d' | 'angle' | 'visibility' | 'transparency' 
  | 'explode' | 'walkthrough' | 'sun' | 'material' | 'pin' | 'clash'

type ViewMode = '2d' | '3d' | 'split' | 'compare'

interface MarkupSettings {
  color: string
  strokeWidth: number
  fillColor: string
  opacity: number
  fontSize: number
  fontFamily: string
  highlighterColor: 'yellow' | 'green' | 'red' | 'blue' | 'orange' | 'purple'
  stampType: 'approved' | 'rejected' | 'revise' | 'for_review' | 'checked' | 'void'
  hatchPattern: 'hatch1' | 'hatch2' | 'hatch3' | 'crosshatch' | 'dots' | 'diagonal'
  measurementUnit: 'mm' | 'cm' | 'm'
  measurementScale: number
  arrowStyle: 'arrow' | 'dot' | 'open' | 'closed'
}

interface SectionPlane {
  id: string
  axis: 'x' | 'y' | 'z'
  position: number
  isActive: boolean
  isReversed: boolean
}

interface ModelViewState {
  camera: {
    position: { x: number; y: number; z: number }
    target: { x: number; y: number; z: number }
    up: { x: number; y: number; z: number }
    fov: number
  }
  sectionPlanes: SectionPlane[]
  hiddenElements: string[]
  transparentElements: { id: string; opacity: number }[]
  explodedFactor: number
  sunPosition: { azimuth: number; altitude: number }
  shadowsEnabled: boolean
  materialOverrides: { elementId: string; material: string }[]
  clashResults: { id: string; elements: string[]; severity: 'critical' | 'warning' | 'info' }[]
}

export const DocumentReviewHub: React.FC = () => {
  const { user } = useAuthStore()
  const { projects } = useProjectStore()

  // State Management
  const [activeDocument, setActiveDocument] = useState<any>(null)
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null)
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null)
  const [participants, setParticipants] = useState<ReviewParticipant[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([])
  const [isInReview, setIsInReview] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Markup Tool State
  const [activeTool, setActiveTool] = useState<MarkupTool>('select')
  const [markupSettings, setMarkupSettings] = useState<MarkupSettings>({
    color: '#FF0000',
    strokeWidth: 2,
    fillColor: 'transparent',
    opacity: 1,
    fontSize: 14,
    fontFamily: 'Arial',
    highlighterColor: 'yellow',
    stampType: 'approved',
    hatchPattern: 'hatch1',
    measurementUnit: 'm',
    measurementScale: 1,
    arrowStyle: 'arrow',
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [selectedAnnotations, setSelectedAnnotations] = useState<string[]>([])
  const [annotationLayers, setAnnotationLayers] = useState<string[]>(['General', 'Architectural', 'Structural', 'MEP'])
  const [activeLayer, setActiveLayer] = useState('General')
  const [visibleLayers, setVisibleLayers] = useState<string[]>(['General', 'Architectural', 'Structural', 'MEP'])
  const [compareVersions, setCompareVersions] = useState<{ v1: string | null; v2: string | null }>({ v1: null, v2: null })
  const [annotationHistory, setAnnotationHistory] = useState<DocumentAnnotation[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  // 3D Model State
  const [modelViewState, setModelViewState] = useState<ModelViewState>({
    camera: {
      position: { x: 10, y: 10, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 60,
    },
    sectionPlanes: [],
    hiddenElements: [],
    transparentElements: [],
    explodedFactor: 0,
    sunPosition: { azimuth: 180, altitude: 45 },
    shadowsEnabled: true,
    materialOverrides: [],
    clashResults: [],
  })
  const [measurementPoints, setMeasurementPoints] = useState<{ x: number; y: number; z?: number }[]>([])
  const [walkthroughMode, setWalkthroughMode] = useState(false)
  const [walkthroughPath, setWalkthroughPath] = useState<{ x: number; y: number; z: number }[]>([])

  // Audio/Video State
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('')

  // Refs
  const documentViewerRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const videoGridRef = useRef<HTMLDivElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  // Initialize with real data from service
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get documents from service
        const documents = await documentReviewService.getDocuments()
        
        // Load messages for active reviews
        const activeReviews = await documentReviewService.getActiveReviews()
        if (activeReviews.length > 0) {
          const messages = await documentReviewService.getMessages(activeReviews[0].id.toString())
          setChatMessages(messages)
        }

        // Subscribe to real-time events
        documentReviewService.onMessage((message) => {
          setChatMessages(prev => [...prev, message])
        })

        documentReviewService.onParticipantJoined((participant) => {
          setParticipants(prev => [...prev, participant])
        })

        documentReviewService.onParticipantLeft((participantId) => {
          setParticipants(prev => prev.filter(p => p.id !== participantId))
        })

        documentReviewService.onAnnotationAdded((annotation) => {
          setAnnotations(prev => [...prev, annotation])
        })
      } catch (error) {
        console.error('Failed to load document data:', error)
        toast.error('Failed to load document data')
      }
    }

    loadData()
    
    // Cleanup on unmount
    return () => {
      documentReviewService.disconnect()
    }
  }, [])

  // Set initial participants
  useEffect(() => {
    setParticipants([
      {
        id: '1',
        name: 'John Architect',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        role: 'owner',
        status: 'online',
        isAudioOn: true,
        isVideoOn: false,
        isScreenSharing: false,
        isSpeaking: false,
        joinedAt: new Date(),
        contributions: 24,
      },
      {
        id: '2',
        name: 'Sarah Designer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        role: 'reviewer',
        status: 'online',
        isAudioOn: true,
        isVideoOn: true,
        isScreenSharing: false,
        isSpeaking: true,
        joinedAt: new Date(),
        contributions: 18,
      },
      {
        id: 'aria',
        name: 'ARIA AI',
        avatar: '',
        role: 'contributor',
        status: 'online',
        isAudioOn: true,
        isVideoOn: false,
        isScreenSharing: false,
        isSpeaking: false,
        joinedAt: new Date(),
        contributions: 42,
      },
    ])

    setChatMessages([
      {
        id: '1',
        userId: '1',
        userName: 'John Architect',
        type: 'text',
        content: 'Let\'s review the latest changes to the floor plan',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        reactions: [{ type: '👍', users: ['2', '3'] }],
      },
      {
        id: '2',
        userId: 'aria',
        userName: 'ARIA AI',
        type: 'ai',
        content: 'I\'ve analyzed the document. There are 3 compliance issues that need attention on pages 4, 7, and 12.',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        reactions: [{ type: '🎯', users: ['1'] }],
      },
    ])
  }, [])

  // WebRTC Setup for Audio/Video
  const initializeMediaStream = async () => {
    try {
      const constraints = {
        audio: isAudioOn,
        video: isVideoOn ? { width: 1280, height: 720 } : false,
      }
      
      const stream = await documentReviewService.initializeMediaStream(constraints)
      localStreamRef.current = stream
      
      // Setup audio level monitoring
      if (isAudioOn) {
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          if (isAudioOn) {
            requestAnimationFrame(checkAudioLevel)
          }
        }
        checkAudioLevel()
      }
    } catch (error) {
      console.error('Failed to initialize media stream:', error)
      toast.error('Failed to access camera/microphone')
    }
  }

  // Handle Audio Toggle
  const toggleAudio = async () => {
    setIsAudioOn(!isAudioOn)
    if (!isAudioOn) {
      await initializeMediaStream()
    } else {
      localStreamRef.current?.getAudioTracks().forEach(track => track.stop())
    }
  }

  // Handle Video Toggle
  const toggleVideo = async () => {
    setIsVideoOn(!isVideoOn)
    if (!isVideoOn) {
      await initializeMediaStream()
    } else {
      localStreamRef.current?.getVideoTracks().forEach(track => track.stop())
    }
  }

  // Handle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await documentReviewService.shareScreen()
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      } catch (error) {
        console.error('Failed to share screen:', error)
        toast.error('Failed to share screen')
      }
    } else {
      setIsScreenSharing(false)
      toast.info('Screen sharing stopped')
    }
  }

  // Start Recording
  const startRecording = () => {
    if (localStreamRef.current) {
      const recorder = documentReviewService.startRecording(localStreamRef.current)
      setIsRecording(true)
      toast.success('Recording started')
    }
  }

  // Stop Recording
  const stopRecording = () => {
    setIsRecording(false)
    toast.success('Recording saved')
  }

  // Handle Document Version Change
  const switchVersion = (version: DocumentVersion) => {
    setCurrentVersion(version)
    toast.info(`Switched to version ${version.version}`)
  }

  // Send Chat Message
  const sendMessage = async (content: string) => {
    try {
      const reviewId = '1' // Use current review ID
      await documentReviewService.sendMessage(reviewId, content, user?.id || '1')
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }

  // Add Annotation
  const addAnnotation = async (annotation: Partial<DocumentAnnotation>) => {
    try {
      const newAnnotation = {
        userId: user?.id || '1',
        userName: user?.name || 'User',
        type: annotation.type || 'comment',
        content: annotation.content || '',
        position: annotation.position || { page: currentPage, x: 0, y: 0 },
        resolved: false,
        replies: [],
        priority: annotation.priority || 'medium',
      }
      
      await documentReviewService.addAnnotation('1', newAnnotation)
      // Annotation will be added via real-time subscription
      toast.success('Annotation added')
    } catch (error) {
      console.error('Failed to add annotation:', error)
      toast.error('Failed to add annotation')
    }
  }

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle tool selection
  const selectTool = (tool: MarkupTool) => {
    setActiveTool(tool)
    setIsDrawing(false)
    setCurrentPath([])
    
    // Clear measurement points when switching tools
    if (tool !== 'measurement' && tool !== 'measure3d') {
      setMeasurementPoints([])
    }
  }

  // Handle undo/redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(annotationHistory[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < annotationHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(annotationHistory[historyIndex + 1])
    }
  }

  // Save annotation to history
  const saveToHistory = (newAnnotations: DocumentAnnotation[]) => {
    const newHistory = annotationHistory.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setAnnotationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setAnnotations(newAnnotations)
  }

  // Add section plane
  const addSectionPlane = (axis: 'x' | 'y' | 'z') => {
    const newPlane: SectionPlane = {
      id: `plane-${Date.now()}`,
      axis,
      position: 0,
      isActive: true,
      isReversed: false,
    }
    setModelViewState(prev => ({
      ...prev,
      sectionPlanes: [...prev.sectionPlanes, newPlane],
    }))
  }

  // Toggle element visibility
  const toggleElementVisibility = (elementId: string) => {
    setModelViewState(prev => {
      const isHidden = prev.hiddenElements.includes(elementId)
      return {
        ...prev,
        hiddenElements: isHidden
          ? prev.hiddenElements.filter(id => id !== elementId)
          : [...prev.hiddenElements, elementId],
      }
    })
  }

  // Set element transparency
  const setElementTransparency = (elementId: string, opacity: number) => {
    setModelViewState(prev => ({
      ...prev,
      transparentElements: [
        ...prev.transparentElements.filter(e => e.id !== elementId),
        { id: elementId, opacity },
      ],
    }))
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Main Toolbar with Markup Tools */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Top Header Bar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-600" />
            <div>
              <h1 className="text-sm font-semibold">Floor Plan v1.1.0</h1>
              <p className="text-xs text-gray-500">KLCC Tower Project</p>
            </div>
          </div>

          {/* Version Control */}
          <div className="flex items-center gap-2 ml-4">
            <Badge variant="outline" className="gap-1">
              <GitBranch className="h-3 w-3" />
              main
            </Badge>
            <Badge variant={currentVersion?.status === 'approved' ? 'default' : 'secondary'}>
              {currentVersion?.status || 'draft'}
            </Badge>
            {viewMode === 'compare' && compareVersions.v1 && compareVersions.v2 && (
              <Badge variant="outline" className="gap-1">
                <GitCompare className="h-3 w-3" />
                v{compareVersions.v1} vs v{compareVersions.v2}
              </Badge>
            )}
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex items-center gap-2">
          {/* Participants */}
          <div className="flex items-center gap-2 mr-4">
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((p) => (
                <Avatar key={p.id} className="h-8 w-8 border-2 border-white">
                  {p.id === 'aria' ? (
                    <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600">
                      <Brain className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </>
                  )}
                </Avatar>
              ))}
              {participants.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                  +{participants.length - 3}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Audio/Video Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant={isAudioOn ? 'default' : 'outline'}
              size="icon"
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isVideoOn ? 'default' : 'outline'}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="icon"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Radio className={cn("h-4 w-4", isRecording && "animate-pulse")} />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === '2d' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('2d')}
              title="2D View"
            >
              <FileImage className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('3d')}
              title="3D View"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'split' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('split')}
              title="Split View"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'compare' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('compare')}
              title="Compare Versions"
            >
              <GitCompare className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <Button 
            variant="outline" 
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Markup Tools Toolbar */}
      <div className="h-16 px-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-900">
        {/* Selection Tools */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Button
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => selectTool('select')}
            title="Select Tool"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'pan' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => selectTool('pan')}
            title="Pan Tool"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-10" />

        {/* 2D Markup Tools */}
        {(viewMode === '2d' || viewMode === 'split' || viewMode === 'compare') && (
          <>
            {/* Drawing Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'pen' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('pen')}
                title="Pen/Pencil Tool"
              >
                <PenTool className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'highlighter' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('highlighter')}
                title="Highlighter Tool"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'text' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('text')}
                title="Text Annotation"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'eraser' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('eraser')}
                title="Eraser Tool"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>

            {/* Shape Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'arrow' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('arrow')}
                title="Arrow Tool"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'line' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('line')}
                title="Line Tool"
              >
                <Slash className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('rectangle')}
                title="Rectangle Tool"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'circle' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('circle')}
                title="Circle Tool"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'cloud' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('cloud')}
                title="Revision Cloud"
              >
                <Cloud className="h-4 w-4" />
              </Button>
            </div>

            {/* Technical Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'measurement' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('measurement')}
                title="Measurement Tool"
              >
                <Ruler className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'dimension' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('dimension')}
                title="Dimension Lines"
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'hatch' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('hatch')}
                title="Hatch Pattern"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Stamps */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={activeTool === 'stamp' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    title="Stamp Tool"
                  >
                    <Stamp className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'approved' })) }}>
                    <FileCheck className="h-4 w-4 mr-2 text-green-600" />
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'rejected' })) }}>
                    <FileX className="h-4 w-4 mr-2 text-red-600" />
                    Rejected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'revise' })) }}>
                    <FileQuestion className="h-4 w-4 mr-2 text-yellow-600" />
                    Revise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'for_review' })) }}>
                    <Eye className="h-4 w-4 mr-2 text-blue-600" />
                    For Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'checked' })) }}>
                    <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                    Checked
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { selectTool('stamp'); setMarkupSettings(prev => ({ ...prev, stampType: 'void' })) }}>
                    <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                    Void
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}

        {/* 3D Model Tools */}
        {(viewMode === '3d' || viewMode === 'split') && (
          <>
            {/* Navigation Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'orbit' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('orbit')}
                title="Orbit View"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'walkthrough' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => { selectTool('walkthrough'); setWalkthroughMode(!walkthroughMode) }}
                title="Walkthrough Mode"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {/* Section Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={activeTool === 'section' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    title="Section Planes"
                  >
                    <Box className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addSectionPlane('x')}>
                    Section X
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSectionPlane('y')}>
                    Section Y
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSectionPlane('z')}>
                    Section Z
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setModelViewState(prev => ({ ...prev, sectionPlanes: [] }))}>
                    Clear All Sections
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={activeTool === 'explode' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('explode')}
                title="Exploded View"
              >
                <ArrowBigUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Analysis Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'measure3d' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('measure3d')}
                title="Measure Distance"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'angle' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('angle')}
                title="Measure Angle"
              >
                <CornerUpRight className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'sun' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('sun')}
                title="Sun Study"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'clash' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('clash')}
                title="Clash Detection"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Visibility Tools */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'visibility' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('visibility')}
                title="Hide/Show Elements"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'transparency' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('transparency')}
                title="Transparency"
              >
                <Aperture className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === 'material' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('material')}
                title="Material Override"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>

            {/* 3D Annotations */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Button
                variant={activeTool === 'pin' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => selectTool('pin')}
                title="3D Annotation Pin"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Common Actions */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={historyIndex === annotationHistory.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Markup Settings"
            >
              <Sliders className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <div className="p-3 space-y-3">
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1 mt-1">
                  {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000'].map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      onClick={() => setMarkupSettings(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Stroke Width</Label>
                <Slider
                  value={[markupSettings.strokeWidth]}
                  onValueChange={([value]) => setMarkupSettings(prev => ({ ...prev, strokeWidth: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Opacity</Label>
                <Slider
                  value={[markupSettings.opacity * 100]}
                  onValueChange={([value]) => setMarkupSettings(prev => ({ ...prev, opacity: value / 100 }))}
                  min={0}
                  max={100}
                  step={10}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Measurement Unit</Label>
                <Select 
                  value={markupSettings.measurementUnit} 
                  onValueChange={(value: 'mm' | 'cm' | 'm') => setMarkupSettings(prev => ({ ...prev, measurementUnit: value }))}
                >
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Scale (1:{markupSettings.measurementScale})</Label>
                <Input
                  type="number"
                  value={markupSettings.measurementScale}
                  onChange={(e) => setMarkupSettings(prev => ({ ...prev, measurementScale: parseInt(e.target.value) || 1 }))}
                  className="h-8 mt-1"
                  min={1}
                  max={1000}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Layer Control */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Markup Layers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {annotationLayers.map(layer => (
              <DropdownMenuItem key={layer} className="justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={visibleLayers.includes(layer)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setVisibleLayers(prev => [...prev, layer])
                      } else {
                        setVisibleLayers(prev => prev.filter(l => l !== layer))
                      }
                    }}
                  />
                  <span className={cn(
                    "text-sm",
                    activeLayer === layer && "font-semibold"
                  )}>
                    {layer}
                  </span>
                </div>
                {activeLayer === layer && (
                  <Badge variant="default" className="ml-2 h-5">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const newLayer = prompt('Enter new layer name:')
              if (newLayer) {
                setAnnotationLayers(prev => [...prev, newLayer])
                setVisibleLayers(prev => [...prev, newLayer])
                setActiveLayer(newLayer)
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Layer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Version History & Annotations */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <Tabs defaultValue="versions" className="h-full flex flex-col">
                <TabsList className="w-full rounded-none">
                  <TabsTrigger value="versions" className="flex-1">
                    <History className="h-4 w-4 mr-2" />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger value="annotations" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Annotations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="versions" className="flex-1 overflow-auto p-4">
                  <div className="space-y-3">
                    {documentVersions.map((version) => (
                      <Card
                        key={version.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          currentVersion?.id === version.id && "ring-2 ring-violet-600"
                        )}
                        onClick={() => switchVersion(version)}
                      >
                        <CardHeader className="p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">v{version.version}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {version.description}
                              </CardDescription>
                            </div>
                            <Badge variant={
                              version.status === 'approved' ? 'default' :
                              version.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {version.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={version.author.avatar} />
                              <AvatarFallback>{version.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{version.author.name}</span>
                            <span>•</span>
                            <span>{new Date(version.timestamp).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-600">+{version.changes.additions}</span>
                            <span className="text-red-600">-{version.changes.deletions}</span>
                            <span className="text-blue-600">~{version.changes.modifications}</span>
                          </div>

                          {version.approvals.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1">
                                {version.approvals.map((approval, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "h-2 flex-1 rounded-full",
                                      approval.status === 'approved' ? 'bg-green-500' :
                                      approval.status === 'rejected' ? 'bg-red-500' :
                                      'bg-gray-300'
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="annotations" className="flex-1 overflow-auto p-4">
                  <div className="space-y-3">
                    {annotations.map((annotation) => (
                      <Card key={annotation.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full mt-1.5",
                              annotation.priority === 'critical' ? 'bg-red-500' :
                              annotation.priority === 'high' ? 'bg-orange-500' :
                              annotation.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            )} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{annotation.userName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {annotation.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>Page {annotation.position.page}</span>
                                <span>•</span>
                                <span>{new Date(annotation.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                        {annotation.replies.length > 0 && (
                          <div className="ml-4 mt-2 space-y-1">
                            {annotation.replies.map((reply, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{reply.userName}:</span>
                                <span className="ml-1 text-gray-600">{reply.content}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document/Model Viewer */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-950 relative">
          {/* Document/Model Toolbar */}
          <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {viewMode === '2d' && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {viewMode === '3d' && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Camera: {modelViewState.camera.fov}° FOV
                  </Badge>
                  {modelViewState.sectionPlanes.length > 0 && (
                    <Badge variant="secondary">
                      {modelViewState.sectionPlanes.length} Section{modelViewState.sectionPlanes.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {walkthroughMode && (
                    <Badge variant="default" className="animate-pulse">
                      Walkthrough Mode
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoomLevel}%</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Document/Model Content */}
          <div
            ref={documentViewerRef}
            className="flex-1 overflow-auto relative"
          >
            {/* 2D Document View */}
            {(viewMode === '2d' || (viewMode === 'split' && activeTab === 'document')) && (
              <div className="p-8 flex items-center justify-center h-full">
                <div
                  className="bg-white dark:bg-gray-800 shadow-xl relative"
                  style={{
                    width: `${297 * (zoomLevel / 100)}mm`,
                    minHeight: `${420 * (zoomLevel / 100)}mm`,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Document Canvas */}
                  <canvas
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 10 }}
                  />
                  
                  {/* Document Content */}
                  <div className="p-8">
                    <h2 className="text-2xl font-bold mb-4">Floor Plan - Level 1</h2>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-sm">
                        <strong>Project:</strong> KLCC Tower
                      </div>
                      <div className="text-sm">
                        <strong>Scale:</strong> 1:{markupSettings.measurementScale}
                      </div>
                      <div className="text-sm">
                        <strong>Date:</strong> {new Date().toLocaleDateString('en-MY')}
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 h-96 rounded flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        [Architectural Drawing Area]
                      </span>
                    </div>
                    
                    {/* Render Annotations */}
                    {annotations
                      .filter(a => visibleLayers.includes(a.layer || 'General'))
                      .filter(a => !a.position.page || a.position.page === currentPage)
                      .map(annotation => (
                        <div
                          key={annotation.id}
                          className="absolute"
                          style={{
                            left: `${annotation.position.x}px`,
                            top: `${annotation.position.y}px`,
                            opacity: annotation.style?.opacity || 1,
                          }}
                        >
                          {annotation.type === 'text' && (
                            <div
                              style={{
                                color: annotation.style?.color || '#000',
                                fontSize: `${annotation.style?.fontSize || 14}px`,
                                fontFamily: annotation.style?.fontFamily || 'Arial',
                              }}
                            >
                              {annotation.content}
                            </div>
                          )}
                          {annotation.type === 'stamp' && (
                            <div className="p-2 border-2 border-current rounded">
                              <Badge
                                variant={
                                  annotation.style?.stampType === 'approved' ? 'default' :
                                  annotation.style?.stampType === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {annotation.style?.stampType?.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* 3D Model View */}
            {(viewMode === '3d' || (viewMode === 'split' && activeTab === 'model')) && (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300">3D Model Viewer</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    3D model would be rendered here using Three.js or similar
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-gray-400">
                      Section Planes: {modelViewState.sectionPlanes.length} active
                    </div>
                    <div className="text-xs text-gray-400">
                      Hidden Elements: {modelViewState.hiddenElements.length}
                    </div>
                    <div className="text-xs text-gray-400">
                      Exploded Factor: {modelViewState.explodedFactor}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare View */}
            {viewMode === 'compare' && (
              <div className="grid grid-cols-2 gap-4 p-4 h-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <h3 className="text-sm font-semibold mb-2">Version {compareVersions.v1 || '1.0.0'}</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 h-full rounded flex items-center justify-center">
                    <span className="text-gray-500">Document Version 1</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <h3 className="text-sm font-semibold mb-2">Version {compareVersions.v2 || '1.1.0'}</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 h-full rounded flex items-center justify-center">
                    <span className="text-gray-500">Document Version 2</span>
                  </div>
                </div>
              </div>
            )}

            {/* Split View */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-2 gap-4 p-4 h-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <h3 className="text-sm font-semibold mb-2">2D Drawing</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 h-full rounded flex items-center justify-center">
                    <span className="text-gray-500">2D Document View</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow p-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-300">3D Model</h3>
                  <div className="h-full rounded flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Measurement Overlay */}
            {(activeTool === 'measurement' || activeTool === 'measure3d') && measurementPoints.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  {measurementPoints.map((point, idx) => (
                    <circle
                      key={idx}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={markupSettings.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                  {measurementPoints.length >= 2 && (
                    <>
                      <line
                        x1={measurementPoints[0].x}
                        y1={measurementPoints[0].y}
                        x2={measurementPoints[1].x}
                        y2={measurementPoints[1].y}
                        stroke={markupSettings.color}
                        strokeWidth={markupSettings.strokeWidth}
                        strokeDasharray="5,5"
                      />
                      <text
                        x={(measurementPoints[0].x + measurementPoints[1].x) / 2}
                        y={(measurementPoints[0].y + measurementPoints[1].y) / 2 - 10}
                        fill={markupSettings.color}
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {Math.round(Math.sqrt(
                          Math.pow(measurementPoints[1].x - measurementPoints[0].x, 2) +
                          Math.pow(measurementPoints[1].y - measurementPoints[0].y, 2)
                        ) * markupSettings.measurementScale / 10)} {markupSettings.measurementUnit}
                      </text>
                    </>
                  )}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Collaboration Panel */}
        <motion.div
          initial={{ width: 320 }}
          animate={{ width: viewMode === 'document' ? 0 : 320 }}
          className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full rounded-none grid grid-cols-3">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="voice">
                <Headphones className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Brain className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      {message.userId === 'aria' ? (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.userAvatar} />
                          <AvatarFallback>{message.userName[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{message.userName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          message.type === 'ai' && "bg-violet-50 dark:bg-violet-900/20 p-2 rounded"
                        )}>
                          {message.content}
                        </p>
                        {message.reactions.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {message.reactions.map((reaction, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {reaction.type} {reaction.users.length}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        sendMessage(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AtSign className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Voice Room Tab */}
            <TabsContent value="voice" className="flex-1 p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Live Audio Room</span>
                      <Badge variant={isRecording ? 'destructive' : 'outline'}>
                        {isRecording ? 'Recording' : 'Live'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {participant.id === 'aria' ? (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                                <Brain className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback>{participant.name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="text-sm font-medium">{participant.name}</p>
                              <p className="text-xs text-gray-500">{participant.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {participant.isSpeaking && (
                              <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
                            )}
                            {participant.isAudioOn && <Mic className="h-3 w-3" />}
                            {participant.isVideoOn && <Video className="h-3 w-3" />}
                            {participant.isScreenSharing && <Monitor className="h-3 w-3" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Audio Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Volume</Label>
                      <Slider
                        value={[audioLevel]}
                        max={100}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Microphone</Label>
                      <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select microphone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Microphone</SelectItem>
                          <SelectItem value="headset">Headset Microphone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Noise Cancellation</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai" className="flex-1 p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-violet-600" />
                      ARIA AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                          AI Insights
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          3 compliance issues detected. The fire exit on page 4 doesn't meet minimum width requirements.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Summary
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Shield className="h-4 w-4 mr-2" />
                          Check Compliance
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Suggest Improvements
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">AI Transcription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">John:</span>
                          <span className="ml-1 text-gray-600">Let's review the latest changes...</span>
                        </div>
                        <div>
                          <span className="font-medium">Sarah:</span>
                          <span className="ml-1 text-gray-600">I think we need to adjust the layout...</span>
                        </div>
                        <div>
                          <span className="font-medium text-violet-600">ARIA:</span>
                          <span className="ml-1 text-gray-600">Based on my analysis, the current design...</span>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.length} participants
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {chatMessages.length} messages
          </span>
          <span className="flex items-center gap-1">
            <Edit3 className="h-3 w-3" />
            {annotations.filter(a => visibleLayers.includes(a.layer || 'General')).length}/{annotations.length} annotations
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Layer: {activeLayer}
          </span>
          {activeTool !== 'select' && (
            <Badge variant="outline" className="gap-1">
              <MousePointer className="h-3 w-3" />
              {activeTool}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isRecording && (
            <span className="flex items-center gap-1 text-red-600">
              <Radio className="h-3 w-3 animate-pulse" />
              Recording: 00:45:32
            </span>
          )}
          <span>Last saved: 2 minutes ago</span>
        </div>
      </div>
    </div>
  )
}