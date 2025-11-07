import { Router } from 'express'
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth'

// Team controllers
import {
  getTeamMembers,
  getTeamMember,
  updateTeamMember,
  removeTeamMember,
  getTeamAnalytics,
  getTeamWorkload
} from '../controllers/team.controller'

// Chat controllers
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getChannels,
  getDirectMessages,
  startDirectMessage,
  searchMessages
} from '../controllers/chat.controller'

// Presence controllers
import {
  updatePresence,
  getPresenceStatus,
  getOnlineUsers,
  setStatusMessage,
  getUserActivity,
  getActivityAnalytics,
  updateCursorPosition
} from '../controllers/presence.controller'

const router = Router()

// Apply multi-tenant authentication to all routes
router.use(authenticateMultiTenant)

// ==================== TEAM MANAGEMENT ROUTES ====================

// List and manage team members
router.get('/members', getTeamMembers)
router.get('/members/:id', getTeamMember)
router.put('/members/:id', updateTeamMember)
router.delete('/members/:id', removeTeamMember)

// Team analytics and insights
router.get('/analytics', getTeamAnalytics)
router.get('/workload', getTeamWorkload)

// ==================== CHAT & MESSAGING ROUTES ====================

// Messages
router.get('/messages', getMessages)
router.post('/messages', sendMessage)
router.put('/messages/:id', updateMessage)
router.delete('/messages/:id', deleteMessage)

// Channels and conversations
router.get('/channels', getChannels)
router.get('/direct-messages', getDirectMessages)
router.post('/direct-messages/:userId', startDirectMessage)

// Message search
router.get('/messages/search', searchMessages)

// ==================== PRESENCE & ACTIVITY ROUTES ====================

// Presence management
router.post('/presence', updatePresence)
router.get('/presence', getPresenceStatus)
router.get('/presence/online', getOnlineUsers)
router.post('/presence/status', setStatusMessage)

// Activity tracking
router.get('/activity/:userId', getUserActivity)
router.get('/activity/analytics', getActivityAnalytics)

// Real-time collaboration
router.post('/cursor', updateCursorPosition)

export default router