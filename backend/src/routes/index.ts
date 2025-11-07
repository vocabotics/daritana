import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import projectRoutes from './project.routes'
import enhancedProjectRoutes from './enhanced-project.routes'
import projectTeamRoutes from './project-team.routes'
import taskRoutes from './task.routes'
import dashboardRoutes from './dashboard.routes'
import teamRoutes from './team.routes'
import fileRoutes from './file.routes'
import enhancedFileRoutes from './enhanced-file.routes'
import notificationRoutes from './notification.routes'
import healthRoutes from './health.routes'
import quotationRoutes from './quotation.routes'
import designBriefRoutes from './designBrief.routes'
import constructionRoutes from './construction.routes'
import studioRoutes from './studio'
import paymentRoutes from './payment.routes'
import emailRoutes from './email.routes'
import meetingRoutes from './meeting.routes'
import kanbanRoutes from './kanban.routes'
import timelineRoutes from './timeline.routes'
import enhancedTimelineRoutes from './enhanced-timeline.routes'
import invitationRoutes from './invitation.routes'
import organizationMembersRoutes from './organization-members.routes'
import organizationRoutes from './organization.routes'
import ganttRoutes from './gantt.routes'
import stripeRoutes from './stripe.routes'

const router = Router()

// Welcome route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Daritana API',
    version: 'v1',
    documentation: '/api/v1/docs',
    health: '/health'
  })
})

// Health check routes (no versioning)
router.use('/health', healthRoutes)

// API routes
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/projects', projectRoutes)
router.use('/enhanced-projects', enhancedProjectRoutes)
router.use('/project-team', projectTeamRoutes)
router.use('/tasks', taskRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/team', teamRoutes)
router.use('/files', fileRoutes)
router.use('/enhanced-files', enhancedFileRoutes)
router.use('/notifications', notificationRoutes)
router.use('/finance', quotationRoutes)
router.use('/design', designBriefRoutes)
router.use('/construction', constructionRoutes)
router.use('/studio', studioRoutes)
router.use('/payments', paymentRoutes)
router.use('/email', emailRoutes)
router.use('/meetings', meetingRoutes)
router.use('/kanban', kanbanRoutes)
router.use('/timeline', timelineRoutes)
router.use('/enhanced-timeline', enhancedTimelineRoutes)
router.use('/invitations', invitationRoutes)
router.use('/organization-members', organizationMembersRoutes)
router.use('/organizations', organizationRoutes)
router.use('/gantt', ganttRoutes)
router.use('/stripe', stripeRoutes)

export default router