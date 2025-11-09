import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';


// Validation schemas
const createComplianceRequirementSchema = z.object({
  authorityId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  documentType: z.string(),
  projectTypes: z.array(z.string()),
  validationRules: z.record(z.any()).optional(),
  isMandatory: z.boolean().default(true),
});

const createSubmissionSchema = z.object({
  projectId: z.string().uuid(),
  authorityId: z.string().uuid(),
  submissionType: z.string(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const createChecklistSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  items: z.array(z.object({
    description: z.string(),
    isMandatory: z.boolean(),
    category: z.string().optional(),
  })),
});

const createAuditSchema = z.object({
  projectId: z.string().uuid(),
  auditType: z.string(),
  findings: z.array(z.object({
    item: z.string(),
    status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'OBSERVATION']),
    notes: z.string().optional(),
  })),
  auditor: z.string(),
  auditDate: z.string().datetime(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get all compliance requirements
export const getComplianceRequirements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      authorityId = '',
      category = '',
      projectType = '',
      isMandatory,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isActive: true,
      ...(authorityId && { authorityId }),
      ...(category && { category }),
      ...(projectType && { projectTypes: { has: String(projectType) } }),
      ...(isMandatory !== undefined && { isMandatory: isMandatory === 'true' }),
    };

    const [requirements, total] = await Promise.all([
      prisma.complianceRequirement.findMany({
        where,
        include: {
          authority: {
            select: {
              id: true,
              name: true,
              code: true,
              jurisdiction: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.complianceRequirement.count({ where }),
    ]);

    res.json({
      requirements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance requirements:', error);
    res.status(500).json({ error: 'Failed to fetch compliance requirements' });
  }
};

// Get compliance status for project
export const getProjectCompliance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.user!;

    // Get project details
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
        siteState: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get applicable requirements based on project type
    const requirements = await prisma.complianceRequirement.findMany({
      where: {
        isActive: true,
        OR: [
          { projectTypes: { has: project.type || '' } },
          { projectTypes: { has: project.category || '' } },
          { projectTypes: { isEmpty: true } }, // Universal requirements
        ],
      },
      include: {
        authority: {
          select: {
            id: true,
            name: true,
            code: true,
            jurisdiction: true,
            state: true,
          },
        },
      },
      orderBy: [
        { isMandatory: 'desc' },
        { authority: { jurisdiction: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Filter by jurisdiction if project has state info
    const filteredRequirements = requirements.filter(req => {
      if (!project.siteState) return true;
      return req.authority.jurisdiction === 'Federal' || 
             req.authority.state === project.siteState ||
             !req.authority.state;
    });

    // Get existing submissions for this project
    const submissions = await prisma.authoritySubmission.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        authorityId: true,
        submissionType: true,
        status: true,
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        comments: true,
      },
    });

    // Map requirements to compliance status
    const complianceStatus = filteredRequirements.map(req => {
      const relatedSubmissions = submissions.filter(sub => 
        sub.authorityId === req.authorityId && 
        sub.submissionType === req.documentType
      );

      const latestSubmission = relatedSubmissions.sort((a, b) => 
        new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime()
      )[0];

      let status = 'NOT_STARTED';
      if (latestSubmission) {
        switch (latestSubmission.status) {
          case 'APPROVED':
            status = 'COMPLIANT';
            break;
          case 'REJECTED':
            status = 'NON_COMPLIANT';
            break;
          case 'SUBMITTED':
            status = 'PENDING_APPROVAL';
            break;
          default:
            status = 'IN_PROGRESS';
        }
      }

      return {
        requirement: req,
        status,
        submission: latestSubmission,
        allSubmissions: relatedSubmissions,
      };
    });

    // Calculate overall compliance score
    const mandatoryReqs = complianceStatus.filter(cs => cs.requirement.isMandatory);
    const compliantMandatory = mandatoryReqs.filter(cs => cs.status === 'COMPLIANT').length;
    const totalMandatory = mandatoryReqs.length;
    
    const optionalReqs = complianceStatus.filter(cs => !cs.requirement.isMandatory);
    const compliantOptional = optionalReqs.filter(cs => cs.status === 'COMPLIANT').length;
    const totalOptional = optionalReqs.length;

    const overallScore = totalMandatory > 0 
      ? (compliantMandatory / totalMandatory) * 100 
      : 100;

    const optionalScore = totalOptional > 0 
      ? (compliantOptional / totalOptional) * 100 
      : 0;

    res.json({
      project,
      complianceStatus,
      summary: {
        totalRequirements: filteredRequirements.length,
        mandatoryRequirements: totalMandatory,
        optionalRequirements: totalOptional,
        compliantMandatory,
        compliantOptional,
        overallScore: Math.round(overallScore * 10) / 10,
        optionalScore: Math.round(optionalScore * 10) / 10,
        isCompliant: compliantMandatory === totalMandatory,
      },
    });
  } catch (error) {
    console.error('Error fetching project compliance:', error);
    res.status(500).json({ error: 'Failed to fetch project compliance' });
  }
};

// Check UBBL compliance
export const checkUBBLCompliance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.user!;
    const { buildingData } = req.body;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId, organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        category: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // UBBL compliance rules (simplified)
    const ubblRules = [
      {
        code: '66A',
        title: 'Height of Buildings',
        description: 'Maximum height restrictions',
        check: (data: any) => {
          if (!data.height || !data.area) return { passed: false, reason: 'Missing height or area data' };
          
          const maxHeight = data.area < 2000 ? 60 : // Small buildings
                           data.area < 10000 ? 100 : // Medium buildings
                           200; // Large buildings
          
          return {
            passed: data.height <= maxHeight,
            reason: data.height > maxHeight ? 
              `Building height ${data.height}m exceeds maximum ${maxHeight}m for this area` : 
              'Height compliance OK',
            maxAllowed: maxHeight,
            actual: data.height,
          };
        },
      },
      {
        code: '70',
        title: 'Minimum Setbacks',
        description: 'Building setback requirements',
        check: (data: any) => {
          if (!data.setbacks) return { passed: false, reason: 'Missing setback data' };
          
          const minSetback = 3; // meters
          const actualSetback = Math.min(
            data.setbacks.front || 0,
            data.setbacks.back || 0,
            data.setbacks.left || 0,
            data.setbacks.right || 0
          );
          
          return {
            passed: actualSetback >= minSetback,
            reason: actualSetback < minSetback ? 
              `Minimum setback ${actualSetback}m is less than required ${minSetback}m` : 
              'Setback compliance OK',
            required: minSetback,
            actual: actualSetback,
          };
        },
      },
      {
        code: '72',
        title: 'Plot Ratio',
        description: 'Maximum plot ratio restrictions',
        check: (data: any) => {
          if (!data.builtUpArea || !data.lotArea) return { passed: false, reason: 'Missing area data' };
          
          const maxPlotRatio = data.landUse === 'commercial' ? 6.0 :
                              data.landUse === 'residential' ? 2.0 :
                              1.5; // default
          
          const actualRatio = data.builtUpArea / data.lotArea;
          
          return {
            passed: actualRatio <= maxPlotRatio,
            reason: actualRatio > maxPlotRatio ? 
              `Plot ratio ${actualRatio.toFixed(2)} exceeds maximum ${maxPlotRatio}` : 
              'Plot ratio compliance OK',
            maxAllowed: maxPlotRatio,
            actual: actualRatio,
          };
        },
      },
      {
        code: '40A',
        title: 'Fire Safety Requirements',
        description: 'Fire escape and safety provisions',
        check: (data: any) => {
          if (!data.floors || !data.fireExits) return { passed: false, reason: 'Missing fire safety data' };
          
          const requiredExits = data.floors > 3 ? 2 : 1;
          
          return {
            passed: data.fireExits >= requiredExits,
            reason: data.fireExits < requiredExits ? 
              `Insufficient fire exits: ${data.fireExits} (required: ${requiredExits})` : 
              'Fire safety compliance OK',
            required: requiredExits,
            actual: data.fireExits,
          };
        },
      },
    ];

    // Run compliance checks
    const complianceResults = ubblRules.map(rule => {
      const result = rule.check(buildingData);
      return {
        rule: {
          code: rule.code,
          title: rule.title,
          description: rule.description,
        },
        ...result,
      };
    });

    // Calculate overall compliance
    const passedChecks = complianceResults.filter(r => r.passed).length;
    const totalChecks = complianceResults.length;
    const complianceScore = (passedChecks / totalChecks) * 100;

    const isCompliant = passedChecks === totalChecks;

    res.json({
      project,
      buildingData,
      complianceResults,
      summary: {
        isCompliant,
        complianceScore: Math.round(complianceScore * 10) / 10,
        passedChecks,
        totalChecks,
        failedChecks: totalChecks - passedChecks,
      },
      checkedAt: new Date(),
    });
  } catch (error) {
    console.error('Error checking UBBL compliance:', error);
    res.status(500).json({ error: 'Failed to check UBBL compliance' });
  }
};

// Get compliance alerts
export const getComplianceAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { projectId } = req.query;

    const where: any = {
      organizationId,
      ...(projectId && { projectId }),
    };

    // Get submissions with issues
    const submissions = await prisma.authoritySubmission.findMany({
      where: {
        project: where,
        OR: [
          { status: 'REJECTED' },
          { 
            status: 'SUBMITTED',
            submittedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Pending > 30 days
            }
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        authority: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });

    const alerts = submissions.map(submission => {
      let type = 'warning';
      let message = '';
      
      if (submission.status === 'REJECTED') {
        type = 'error';
        message = `Submission rejected: ${submission.rejectionReason || 'No reason provided'}`;
      } else if (submission.status === 'SUBMITTED') {
        const daysPending = Math.floor(
          (new Date().getTime() - new Date(submission.submittedAt!).getTime()) / (1000 * 60 * 60 * 24)
        );
        type = 'warning';
        message = `Submission pending for ${daysPending} days`;
      }

      return {
        id: submission.id,
        type,
        message,
        project: submission.project,
        authority: submission.authority,
        submissionType: submission.submissionType,
        status: submission.status,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching compliance alerts:', error);
    res.status(500).json({ error: 'Failed to fetch compliance alerts' });
  }
};

// Get compliance dashboard data
export const getComplianceDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;

    // Get projects with compliance status
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        authoritySubmissions: {
          select: {
            status: true,
            authorityId: true,
            submissionType: true,
          },
        },
      },
    });

    // Calculate compliance metrics
    let totalProjects = projects.length;
    let compliantProjects = 0;
    let projectsWithIssues = 0;
    let pendingSubmissions = 0;
    let rejectedSubmissions = 0;

    projects.forEach(project => {
      const submissions = project.authoritySubmissions;
      const hasRejected = submissions.some(s => s.status === 'REJECTED');
      const hasPending = submissions.some(s => s.status === 'SUBMITTED');
      const hasApproved = submissions.some(s => s.status === 'APPROVED');

      if (hasRejected) {
        projectsWithIssues++;
      } else if (hasApproved) {
        compliantProjects++;
      }

      pendingSubmissions += submissions.filter(s => s.status === 'SUBMITTED').length;
      rejectedSubmissions += submissions.filter(s => s.status === 'REJECTED').length;
    });

    // Get recent activity
    const recentSubmissions = await prisma.authoritySubmission.findMany({
      where: {
        project: { organizationId },
      },
      include: {
        project: {
          select: {
            name: true,
            code: true,
          },
        },
        authority: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    // Compliance score
    const complianceScore = totalProjects > 0 
      ? (compliantProjects / totalProjects) * 100 
      : 0;

    res.json({
      summary: {
        totalProjects,
        compliantProjects,
        projectsWithIssues,
        pendingSubmissions,
        rejectedSubmissions,
        complianceScore: Math.round(complianceScore * 10) / 10,
      },
      recentActivity: recentSubmissions,
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch compliance dashboard' });
  }
};

// Create compliance requirement
export const createComplianceRequirement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createComplianceRequirementSchema.parse(req.body);
    const { organizationId } = req.user!;

    const requirement = await prisma.complianceRequirement.create({
      data: {
        ...validatedData,
        organizationId,
      },
    });

    res.status(201).json(requirement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating compliance requirement:', error);
    res.status(500).json({ error: 'Failed to create compliance requirement' });
  }
};

// Update compliance requirement
export const updateComplianceRequirement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const requirement = await prisma.complianceRequirement.update({
      where: { id, organizationId },
      data: req.body,
    });

    res.json(requirement);
  } catch (error) {
    console.error('Error updating compliance requirement:', error);
    res.status(500).json({ error: 'Failed to update compliance requirement' });
  }
};

// Delete compliance requirement
export const deleteComplianceRequirement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    await prisma.complianceRequirement.update({
      where: { id, organizationId },
      data: { isActive: false },
    });

    res.json({ message: 'Compliance requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting compliance requirement:', error);
    res.status(500).json({ error: 'Failed to delete compliance requirement' });
  }
};

// Get authority submissions
export const getAuthoritySubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { projectId, status, authorityId, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      project: { organizationId },
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(authorityId && { authorityId }),
    };

    const [submissions, total] = await Promise.all([
      prisma.authoritySubmission.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          authority: {
            select: {
              id: true,
              name: true,
              code: true,
              jurisdiction: true,
            },
          },
          documents: true,
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.authoritySubmission.count({ where }),
    ]);

    res.json({
      submissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching authority submissions:', error);
    res.status(500).json({ error: 'Failed to fetch authority submissions' });
  }
};

// Create authority submission
export const createAuthoritySubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createSubmissionSchema.parse(req.body);
    const { organizationId, id: userId } = req.user!;

    // Verify project belongs to organization
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId, organizationId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const submission = await prisma.authoritySubmission.create({
      data: {
        ...validatedData,
        submittedBy: userId,
        status: 'DRAFT',
        referenceNumber: `SUB-${Date.now()}`,
      },
      include: {
        authority: true,
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating authority submission:', error);
    res.status(500).json({ error: 'Failed to create authority submission' });
  }
};

// Update submission status
export const updateSubmissionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments, rejectionReason } = req.body;
    const { organizationId } = req.user!;

    // Verify submission belongs to organization
    const submission = await prisma.authoritySubmission.findFirst({
      where: {
        id,
        project: { organizationId },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updateData: any = {
      status,
      comments,
    };

    if (status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const updatedSubmission = await prisma.authoritySubmission.update({
      where: { id },
      data: updateData,
      include: {
        authority: true,
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        documents: true,
      },
    });

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ error: 'Failed to update submission status' });
  }
};

// Get submission details
export const getSubmissionDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const submission = await prisma.authoritySubmission.findFirst({
      where: {
        id,
        project: { organizationId },
      },
      include: {
        authority: true,
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            category: true,
          },
        },
        documents: true,
        complianceChecks: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
};

// Upload submission document
export const uploadSubmissionDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { documentName, documentType, documentUrl } = req.body;
    const { organizationId } = req.user!;

    // Verify submission belongs to organization
    const submission = await prisma.authoritySubmission.findFirst({
      where: {
        id,
        project: { organizationId },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const document = await prisma.complianceDocument.create({
      data: {
        submissionId: id,
        name: documentName,
        type: documentType,
        url: documentUrl,
        uploadedBy: req.user!.id,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading submission document:', error);
    res.status(500).json({ error: 'Failed to upload submission document' });
  }
};

// Get compliance checklists
export const getComplianceChecklists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { projectId, category, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      organizationId,
      ...(projectId && { projectId }),
      ...(category && { category }),
    };

    const [checklists, total] = await Promise.all([
      prisma.complianceChecklist.findMany({
        where,
        include: {
          items: {
            orderBy: {
              order: 'asc',
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.complianceChecklist.count({ where }),
    ]);

    res.json({
      checklists,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance checklists:', error);
    res.status(500).json({ error: 'Failed to fetch compliance checklists' });
  }
};

// Create compliance checklist
export const createComplianceChecklist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createChecklistSchema.parse(req.body);
    const { organizationId } = req.user!;

    // Verify project belongs to organization
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId, organizationId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const checklist = await prisma.complianceChecklist.create({
      data: {
        projectId: validatedData.projectId,
        name: validatedData.name,
        category: validatedData.category,
        organizationId,
        items: {
          create: validatedData.items.map((item, index) => ({
            ...item,
            order: index + 1,
            isCompleted: false,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(checklist);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating compliance checklist:', error);
    res.status(500).json({ error: 'Failed to create compliance checklist' });
  }
};

// Update checklist item
export const updateChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, isCompleted, notes, completedBy } = req.body;
    const { organizationId } = req.user!;

    // Verify checklist belongs to organization
    const checklist = await prisma.complianceChecklist.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const updateData: any = {
      isCompleted,
      notes,
    };

    if (isCompleted) {
      updateData.completedAt = new Date();
      updateData.completedBy = completedBy || req.user!.id;
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData,
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
};

// Get project checklists
export const getProjectChecklists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.user!;

    const checklists = await prisma.complianceChecklist.findMany({
      where: {
        projectId,
        organizationId,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Calculate completion status
    const checklistsWithStatus = checklists.map(checklist => {
      const totalItems = checklist.items.length;
      const completedItems = checklist.items.filter(item => item.isCompleted).length;
      const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        ...checklist,
        totalItems,
        completedItems,
        completionPercentage: Math.round(completionPercentage),
      };
    });

    res.json(checklistsWithStatus);
  } catch (error) {
    console.error('Error fetching project checklists:', error);
    res.status(500).json({ error: 'Failed to fetch project checklists' });
  }
};

// Create audit entry
export const createAuditEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createAuditSchema.parse(req.body);
    const { organizationId } = req.user!;

    // Verify project belongs to organization
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId, organizationId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const audit = await prisma.complianceAudit.create({
      data: {
        projectId: validatedData.projectId,
        auditType: validatedData.auditType,
        auditor: validatedData.auditor,
        auditDate: new Date(validatedData.auditDate),
        findings: validatedData.findings,
        organizationId,
        overallStatus: validatedData.findings.some(f => f.status === 'NON_COMPLIANT') 
          ? 'NON_COMPLIANT' 
          : 'COMPLIANT',
      },
    });

    res.status(201).json(audit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating audit entry:', error);
    res.status(500).json({ error: 'Failed to create audit entry' });
  }
};

// Get audit history
export const getAuditHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { projectId, auditType, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      organizationId,
      ...(projectId && { projectId }),
      ...(auditType && { auditType }),
    };

    const [audits, total] = await Promise.all([
      prisma.complianceAudit.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          auditDate: 'desc',
        },
      }),
      prisma.complianceAudit.count({ where }),
    ]);

    res.json({
      audits,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    res.status(500).json({ error: 'Failed to fetch audit history' });
  }
};

// Get project audits
export const getProjectAudits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.user!;

    const audits = await prisma.complianceAudit.findMany({
      where: {
        projectId,
        organizationId,
      },
      orderBy: {
        auditDate: 'desc',
      },
    });

    res.json(audits);
  } catch (error) {
    console.error('Error fetching project audits:', error);
    res.status(500).json({ error: 'Failed to fetch project audits' });
  }
};

// Generate compliance report
export const generateComplianceReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { startDate, endDate, projectId } = req.query;

    const where: any = {
      organizationId,
      ...(projectId && { id: projectId }),
    };

    const projects = await prisma.project.findMany({
      where,
      include: {
        authoritySubmissions: {
          where: {
            ...(startDate && endDate && {
              createdAt: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
              },
            }),
          },
          include: {
            authority: true,
          },
        },
        complianceChecklists: {
          include: {
            items: true,
          },
        },
        complianceAudits: {
          where: {
            ...(startDate && endDate && {
              auditDate: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
              },
            }),
          },
        },
      },
    });

    // Generate report data
    const reportData = projects.map(project => {
      const totalSubmissions = project.authoritySubmissions.length;
      const approvedSubmissions = project.authoritySubmissions.filter(s => s.status === 'APPROVED').length;
      const rejectedSubmissions = project.authoritySubmissions.filter(s => s.status === 'REJECTED').length;
      const pendingSubmissions = project.authoritySubmissions.filter(s => s.status === 'SUBMITTED').length;

      const totalChecklists = project.complianceChecklists.length;
      const checklistCompletion = project.complianceChecklists.map(checklist => {
        const totalItems = checklist.items.length;
        const completedItems = checklist.items.filter(item => item.isCompleted).length;
        return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      });
      const avgChecklistCompletion = checklistCompletion.length > 0 
        ? checklistCompletion.reduce((a, b) => a + b, 0) / checklistCompletion.length 
        : 0;

      const totalAudits = project.complianceAudits.length;
      const compliantAudits = project.complianceAudits.filter(a => a.overallStatus === 'COMPLIANT').length;

      return {
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
        },
        submissions: {
          total: totalSubmissions,
          approved: approvedSubmissions,
          rejected: rejectedSubmissions,
          pending: pendingSubmissions,
          approvalRate: totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0,
        },
        checklists: {
          total: totalChecklists,
          averageCompletion: Math.round(avgChecklistCompletion),
        },
        audits: {
          total: totalAudits,
          compliant: compliantAudits,
          complianceRate: totalAudits > 0 ? (compliantAudits / totalAudits) * 100 : 0,
        },
      };
    });

    res.json({
      reportDate: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      projects: reportData,
      summary: {
        totalProjects: reportData.length,
        totalSubmissions: reportData.reduce((sum, p) => sum + p.submissions.total, 0),
        totalApproved: reportData.reduce((sum, p) => sum + p.submissions.approved, 0),
        totalRejected: reportData.reduce((sum, p) => sum + p.submissions.rejected, 0),
        totalPending: reportData.reduce((sum, p) => sum + p.submissions.pending, 0),
        totalAudits: reportData.reduce((sum, p) => sum + p.audits.total, 0),
        overallComplianceRate: reportData.length > 0 
          ? reportData.reduce((sum, p) => sum + p.audits.complianceRate, 0) / reportData.length 
          : 0,
      },
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
};

// Generate project compliance report
export const generateProjectComplianceReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { organizationId } = req.user!;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        authoritySubmissions: {
          include: {
            authority: true,
            documents: true,
          },
        },
        complianceChecklists: {
          include: {
            items: true,
          },
        },
        complianceAudits: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate detailed project report
    const report = {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        type: project.type,
        category: project.category,
        status: project.status,
      },
      submissions: project.authoritySubmissions.map(submission => ({
        id: submission.id,
        authority: submission.authority.name,
        type: submission.submissionType,
        status: submission.status,
        submittedAt: submission.submittedAt,
        approvedAt: submission.approvedAt,
        rejectedAt: submission.rejectedAt,
        documents: submission.documents.length,
        comments: submission.comments,
      })),
      checklists: project.complianceChecklists.map(checklist => {
        const totalItems = checklist.items.length;
        const completedItems = checklist.items.filter(item => item.isCompleted).length;
        return {
          id: checklist.id,
          name: checklist.name,
          category: checklist.category,
          totalItems,
          completedItems,
          completionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          items: checklist.items,
        };
      }),
      audits: project.complianceAudits.map(audit => ({
        id: audit.id,
        type: audit.auditType,
        date: audit.auditDate,
        auditor: audit.auditor,
        status: audit.overallStatus,
        findings: audit.findings,
      })),
      summary: {
        totalSubmissions: project.authoritySubmissions.length,
        approvedSubmissions: project.authoritySubmissions.filter(s => s.status === 'APPROVED').length,
        totalChecklists: project.complianceChecklists.length,
        completedChecklists: project.complianceChecklists.filter(c => 
          c.items.every(item => item.isCompleted)
        ).length,
        totalAudits: project.complianceAudits.length,
        compliantAudits: project.complianceAudits.filter(a => a.overallStatus === 'COMPLIANT').length,
      },
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating project compliance report:', error);
    res.status(500).json({ error: 'Failed to generate project compliance report' });
  }
};

// Export compliance report
export const exportComplianceReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format = 'pdf', projectId } = req.query;
    const { organizationId } = req.user!;

    // Generate report data (reusing generateComplianceReport logic)
    const reportData = await generateComplianceReportData(organizationId, projectId as string);

    if (format === 'pdf') {
      // Generate PDF (placeholder - would need actual PDF generation library)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.pdf"');
      res.send('PDF content would be here');
    } else if (format === 'excel') {
      // Generate Excel (placeholder - would need actual Excel generation library)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.xlsx"');
      res.send('Excel content would be here');
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Error exporting compliance report:', error);
    res.status(500).json({ error: 'Failed to export compliance report' });
  }
};

// Get Malaysian authorities
export const getMalaysianAuthorities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authorities = await prisma.regulatoryAuthority.findMany({
      where: {
        country: 'Malaysia',
        isActive: true,
      },
      orderBy: [
        { jurisdiction: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(authorities);
  } catch (error) {
    console.error('Error fetching Malaysian authorities:', error);
    res.status(500).json({ error: 'Failed to fetch Malaysian authorities' });
  }
};

// Get Malaysian regulations
export const getMalaysianRegulations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, type } = req.query;

    const where: any = {
      country: 'Malaysia',
      isActive: true,
      ...(category && { category }),
      ...(type && { type }),
    };

    const regulations = await prisma.regulation.findMany({
      where,
      include: {
        authority: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(regulations);
  } catch (error) {
    console.error('Error fetching Malaysian regulations:', error);
    res.status(500).json({ error: 'Failed to fetch Malaysian regulations' });
  }
};

// Get UBBL regulations
export const getUBBLRegulations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ubblRegulations = [
      {
        code: '66A',
        title: 'Height of Buildings',
        description: 'Maximum height restrictions based on area and zoning',
        category: 'Building Design',
      },
      {
        code: '70',
        title: 'Minimum Setbacks',
        description: 'Building setback requirements from property boundaries',
        category: 'Site Planning',
      },
      {
        code: '72',
        title: 'Plot Ratio',
        description: 'Maximum plot ratio restrictions based on land use',
        category: 'Development Control',
      },
      {
        code: '40A',
        title: 'Fire Safety Requirements',
        description: 'Fire escape and safety provisions',
        category: 'Safety',
      },
      {
        code: '41',
        title: 'Natural Lighting',
        description: 'Minimum natural lighting requirements',
        category: 'Building Design',
      },
      {
        code: '42',
        title: 'Natural Ventilation',
        description: 'Minimum natural ventilation requirements',
        category: 'Building Design',
      },
      {
        code: '137',
        title: 'Parking Requirements',
        description: 'Minimum parking space provisions',
        category: 'Site Planning',
      },
      {
        code: '140',
        title: 'Access for Disabled',
        description: 'Accessibility requirements for disabled persons',
        category: 'Accessibility',
      },
    ];

    res.json(ubblRegulations);
  } catch (error) {
    console.error('Error fetching UBBL regulations:', error);
    res.status(500).json({ error: 'Failed to fetch UBBL regulations' });
  }
};

// Get state regulations
export const getStateRegulations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { state } = req.params;

    const stateRegulations = await prisma.regulation.findMany({
      where: {
        country: 'Malaysia',
        state,
        isActive: true,
      },
      include: {
        authority: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(stateRegulations);
  } catch (error) {
    console.error('Error fetching state regulations:', error);
    res.status(500).json({ error: 'Failed to fetch state regulations' });
  }
};

// Helper function for report generation
async function generateComplianceReportData(organizationId: string, projectId?: string) {
  const where: any = {
    organizationId,
    ...(projectId && { id: projectId }),
  };

  const projects = await prisma.project.findMany({
    where,
    include: {
      authoritySubmissions: {
        include: {
          authority: true,
        },
      },
      complianceChecklists: {
        include: {
          items: true,
        },
      },
      complianceAudits: true,
    },
  });

  return projects;
}