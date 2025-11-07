/**
 * API Fixes Router - Adds missing routes and fixes validation issues
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import jwt from 'jsonwebtoken';
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth';

const router = Router();

// ============= AUTH REFRESH TOKEN =============
// Fix for: POST /auth/refresh - 404
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    
    // Generate new access token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        organizationRole: decoded.organizationRole
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token: newToken,
      refreshToken: refreshToken // Return same refresh token
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ============= DOCUMENT UPLOAD =============
// Fix for: POST /documents/upload - 404
router.post('/documents/upload', authenticateMultiTenant, async (req, res) => {
  try {
    const { filename, category = 'general', projectId } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        name: filename,
        category,
        projectId,
        uploadedById: (req as any).user.userId,
        organizationId: (req as any).user.organizationId,
        url: `/uploads/${filename}`, // Placeholder URL
        size: 0,
        mimeType: 'application/octet-stream'
      }
    });
    
    res.json({
      message: 'Document uploaded',
      document
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ============= FINANCIAL ANALYTICS =============
// Fix for: GET /financial/analytics - 404
router.get('/financial/analytics', authenticateMultiTenant, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    
    // Get financial analytics
    const [invoices, expenses, revenue] = await Promise.all([
      prisma.invoice.count({
        where: { organizationId }
      }),
      prisma.expense.aggregate({
        where: { organizationId },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId,
          status: 'PAID'
        },
        _sum: { total: true }
      })
    ]);
    
    res.json({
      totalInvoices: invoices,
      totalExpenses: expenses._sum.amount || 0,
      totalRevenue: revenue._sum.total || 0,
      profitMargin: ((revenue._sum.total || 0) - (expenses._sum.amount || 0)) / (revenue._sum.total || 1) * 100
    });
    
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// ============= LEARNING ENROLLMENTS =============
// Fix for: GET /learning/enrollments - 404
router.get('/learning/enrollments', authenticateMultiTenant, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true
      }
    });
    
    res.json(enrollments);
    
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Fix for: POST /learning/enrollments - 404
router.post('/learning/enrollments', authenticateMultiTenant, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = (req as any).user.userId;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId
        }
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        status: 'ENROLLED'
      }
    });
    
    res.json(enrollment);
    
  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

// ============= FIX VALIDATION ERRORS =============

// Fix for: POST /projects - 400 (make fields optional)
router.post('/projects-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const projectSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budget: z.number().optional(),
      clientId: z.string().optional(),
      status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional()
    });
    
    const data = projectSchema.parse(req.body);
    const organizationId = (req as any).user.organizationId;
    
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || '',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget || 0,
        organizationId,
        createdById: (req as any).user.userId,
        status: data.status || 'PLANNING'
      }
    });
    
    res.json(project);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Fix for: POST /tasks - 400 (make fields optional)
router.post('/tasks-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const taskSchema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string().optional(),
      assigneeId: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
      dueDate: z.string().optional()
    });
    
    const data = taskSchema.parse(req.body);
    
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || '',
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'TODO',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: (req as any).user.userId,
        organizationId: (req as any).user.organizationId
      }
    });
    
    res.json(task);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ============= FIX DATABASE ERRORS =============

// Fix for: GET /documents/statistics - 500
router.get('/documents/statistics-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    
    const stats = await prisma.document.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: true
    });
    
    const totalSize = await prisma.document.aggregate({
      where: { organizationId },
      _sum: { size: true },
      _count: true
    });
    
    res.json({
      byCategory: stats,
      totalDocuments: totalSize._count,
      totalSize: totalSize._sum.size || 0
    });
    
  } catch (error) {
    console.error('Document statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
});

// Fix for: GET /documents/categories - 500
router.get('/documents/categories-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const categories = await prisma.document.findMany({
      where: { organizationId: (req as any).user.organizationId },
      select: { category: true },
      distinct: ['category']
    });
    
    res.json(categories.map(c => c.category));
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Fix for: POST /team/presence - 500
router.post('/team/presence-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const { status = 'online', location = 'dashboard' } = req.body;
    const userId = (req as any).user.userId;
    
    // Update user's last active time
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date()
      }
    });
    
    // Create or update presence record
    const presence = await prisma.userPresence.upsert({
      where: { userId },
      update: {
        status,
        location,
        lastSeen: new Date()
      },
      create: {
        userId,
        status,
        location,
        lastSeen: new Date()
      }
    });
    
    res.json(presence);
    
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

// Fix for: GET /compliance/issues - 500
router.get('/compliance/issues-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    
    const issues = await prisma.complianceIssue.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(issues);
    
  } catch (error) {
    console.error('Get compliance issues error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance issues' });
  }
});

// Fix for: POST /compliance/issues - 500
router.post('/compliance/issues-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const { title, description, severity = 'LOW', projectId } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const issue = await prisma.complianceIssue.create({
      data: {
        title,
        description: description || '',
        severity,
        projectId,
        organizationId: (req as any).user.organizationId,
        reportedById: (req as any).user.userId,
        status: 'OPEN'
      }
    });
    
    res.json(issue);
    
  } catch (error) {
    console.error('Create compliance issue error:', error);
    res.status(500).json({ error: 'Failed to create compliance issue' });
  }
});

// Fix for: GET /marketplace/quotes - 500
router.get('/marketplace/quotes-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    
    const quotes = await prisma.quote.findMany({
      where: { organizationId },
      include: {
        vendor: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(quotes);
    
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Fix for: GET /hr/employees - 500
router.get('/hr/employees-fixed', authenticateMultiTenant, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    
    const employees = await prisma.organizationMember.findMany({
      where: { 
        organizationId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            lastActiveAt: true
          }
        }
      }
    });
    
    res.json(employees);
    
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

export default router;