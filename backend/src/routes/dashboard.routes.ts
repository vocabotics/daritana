import { Router } from 'express'
import { body, query, param } from 'express-validator'
import {
  getDashboardConfig,
  updateDashboardConfig,
  getDashboardData,
  getWidgetData,
  getDashboardTemplates,
  saveDashboardTemplate,
  applyDashboardTemplate,
  getWidgetAnalytics,
  exportDashboardConfig,
  importDashboardConfig
} from '../controllers/dashboard.controller'
import { authenticateMultiTenant, requirePermission } from '../middleware/multi-tenant-auth'
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

// Apply multi-tenant auth to all routes
router.use(authenticateMultiTenant)

// Get user's dashboard configuration
router.get('/config', getDashboardConfig)

// Update dashboard configuration
router.put('/config', [
  body('layout').optional().isIn(['grid', 'kanban', 'list', 'calendar']),
  body('widgets').optional().isArray(),
  validate
], updateDashboardConfig)

// Save widget configuration
router.put('/widget/:widgetId', [
  param('widgetId').notEmpty(),
  body('position').optional().isObject(),
  body('settings').optional().isObject(),
  body('isVisible').optional().isBoolean(),
  validate
], async (req: any, res: any) => {
  try {
    const { widgetId } = req.params
    const userId = req.user.id
    const updates = req.body

    // Get current dashboard config
    const dashboardConfig = await prisma.userDashboard.findFirst({
      where: {
        userId,
        organizationId: req.user.organizationId
      }
    })

    if (!dashboardConfig) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard configuration not found'
      })
    }

    // Update specific widget in the widgets array
    const widgets = dashboardConfig.widgets as any[]
    const widgetIndex = widgets.findIndex(w => w.id === widgetId)

    if (widgetIndex === -1) {
      // Add new widget
      widgets.push({
        id: widgetId,
        ...updates
      })
    } else {
      // Update existing widget
      widgets[widgetIndex] = {
        ...widgets[widgetIndex],
        ...updates
      }
    }

    // Save updated config
    const updatedConfig = await prisma.userDashboard.update({
      where: { id: dashboardConfig.id },
      data: { widgets }
    })

    res.json({
      success: true,
      config: updatedConfig
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update widget configuration',
      message: error.message
    })
  }
})

// Delete widget from dashboard
router.delete('/widget/:widgetId', [
  param('widgetId').notEmpty(),
  validate
], async (req: any, res: any) => {
  try {
    const { widgetId } = req.params
    const userId = req.user.id

    // Get current dashboard config
    const dashboardConfig = await prisma.userDashboard.findFirst({
      where: {
        userId,
        organizationId: req.user.organizationId
      }
    })

    if (!dashboardConfig) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard configuration not found'
      })
    }

    // Remove widget from the widgets array
    const widgets = dashboardConfig.widgets as any[]
    const filteredWidgets = widgets.filter(w => w.id !== widgetId)

    // Save updated config
    const updatedConfig = await prisma.userDashboard.update({
      where: { id: dashboardConfig.id },
      data: { widgets: filteredWidgets }
    })

    res.json({
      success: true,
      config: updatedConfig
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete widget',
      message: error.message
    })
  }
})

// Get dashboard data (for specific user role)
router.get('/data', getDashboardData)

// Get dashboard statistics (legacy endpoint for backward compatibility)
router.get('/statistics', getDashboardData)

// Get widget data
router.get('/widget-data/:widgetType', [
  param('widgetType').notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], getWidgetData)

// Save dashboard layout
router.post('/layout', [
  body('layout').isArray(),
  validate
], async (req: any, res: any) => {
  try {
    const userId = req.user.id
    const { layout } = req.body

    // Get current dashboard config
    const dashboardConfig = await prisma.userDashboard.findFirst({
      where: {
        userId,
        organizationId: req.user.organizationId
      }
    })

    if (!dashboardConfig) {
      // Create new config with layout
      await prisma.userDashboard.create({
        data: {
          userId,
          organizationId: req.user.organizationId,
          widgets: layout,
          layout: 'custom'
        }
      })
    } else {
      // Update existing config
      await prisma.userDashboard.update({
        where: { id: dashboardConfig.id },
        data: {
          widgets: layout,
          layout: 'custom'
        }
      })
    }

    res.json({
      success: true,
      message: 'Dashboard layout saved successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to save dashboard layout',
      message: error.message
    })
  }
})

// Get dashboard templates
router.get('/templates', getDashboardTemplates)

// Save custom dashboard template
router.post('/templates', [
  body('name').notEmpty(),
  body('widgets').isArray(),
  body('description').optional().isString(),
  body('isPublic').optional().isBoolean(),
  validate
], saveDashboardTemplate)

// Apply dashboard template
router.post('/apply-template', [
  body('templateId').notEmpty(),
  body('templateType').isIn(['predefined', 'custom']),
  validate
], applyDashboardTemplate)

// Get widget analytics
router.get('/analytics', [
  query('timeframe').optional().isIn(['1d', '7d', '30d', '90d']),
  validate
], getWidgetAnalytics)

// Export dashboard configuration
router.get('/export', exportDashboardConfig)

// Import dashboard configuration
router.post('/import', [
  body('configData').isObject(),
  body('mergeMode').optional().isIn(['replace', 'merge']),
  validate
], importDashboardConfig)

export default router