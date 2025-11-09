import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all compliance documents
router.get('/documents', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const documents = await prisma.document.findMany({
      where: { 
        project: { organizationId }
      },
      include: {
        uploadedBy: true,
        project: true,
        versions: true
      }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance documents' });
  }
});

// Get compliance audits
router.get('/audits', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const audits = await prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Get compliance standards
router.get('/standards', authenticate, async (req, res) => {
  try {
    // Return mock standards for now
    const standards = [
      { id: '1', name: 'ISO 9001:2015', category: 'Quality Management', status: 'active' },
      { id: '2', name: 'MS 1064', category: 'Building Standards', status: 'active' },
      { id: '3', name: 'UBBL', category: 'Local Regulations', status: 'active' },
      { id: '4', name: 'CIDB Standards', category: 'Construction', status: 'active' }
    ];
    res.json(standards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standards' });
  }
});

// Get compliance issues
router.get('/issues', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    const issues = await prisma.complianceIssue.findMany({
      where: { 
        organizationId
      },
      include: {
        reportedBy: true,
        assignedTo: true,
        project: true
      }
    });
    res.json(issues);
  } catch (error) {
    console.error('Get compliance issues error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance issues' });
  }
});

// Create compliance issue
router.post('/issues', authenticate, async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { title, description, severity = 'LOW', projectId, assignedToId } = req.body;
    
    const issue = await prisma.complianceIssue.create({
      data: {
        title: title || 'New Compliance Issue',
        description: description || '',
        severity: severity.toUpperCase(),
        status: 'OPEN',
        projectId,
        organizationId,
        reportedById: userId,
        assignedToId
      },
      include: {
        reportedBy: true,
        assignedTo: true,
        project: true
      }
    });
    
    res.json(issue);
  } catch (error) {
    console.error('Create compliance issue error:', error);
    res.status(500).json({ error: 'Failed to create compliance issue' });
  }
});

// Update compliance issue
router.put('/issues/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, severity, assignedToId } = req.body;
    
    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    }
    if (severity) updateData.severity = severity.toUpperCase();
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    
    const issue = await prisma.complianceIssue.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: true,
        assignedTo: true,
        project: true
      }
    });
    
    res.json(issue);
  } catch (error) {
    console.error('Update compliance issue error:', error);
    res.status(500).json({ error: 'Failed to update compliance issue' });
  }
});

// Get compliance report
router.get('/report', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    const [totalIssues, resolvedIssues, documents, audits] = await Promise.all([
      prisma.task.count({
        where: { 
          project: { organizationId },
          tags: { has: 'compliance' }
        }
      }),
      prisma.task.count({
        where: { 
          project: { organizationId },
          tags: { has: 'compliance' },
          status: 'done'
        }
      }),
      prisma.document.count({
        where: { project: { organizationId } }
      }),
      prisma.auditLog.count({
        where: { organizationId }
      })
    ]);
    
    res.json({
      totalIssues,
      resolvedIssues,
      complianceRate: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 100,
      totalDocuments: documents,
      totalAudits: audits
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

export default router;