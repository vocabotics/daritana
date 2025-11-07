import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { AuthRequest, authorize } from '../middleware/auth';

const router = Router();

// ==================== EMPLOYEES ====================

// Get all employees
router.get('/employees', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const { department, status, search } = req.query;

    const employees = await prisma.employee.findMany({
      where: {
        ...(department && { department: department as string }),
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
            { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
            { employeeId: { contains: search as string, mode: 'insensitive' } },
            { jobTitle: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            directReports: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/employees/:id', async (req: AuthRequest, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        manager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        directReports: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        leaveBalances: {
          include: {
            leaveType: true,
          },
        },
        cpdRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        skillAssessments: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
        },
        performanceReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check access permissions
    if (
      req.user?.id !== employee.userId &&
      req.user?.role !== 'ADMIN' &&
      req.user?.role !== 'PROJECT_LEAD'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee record
const createEmployeeSchema = z.object({
  userId: z.string(),
  employeeId: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  reportingTo: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE', 'CONSULTANT']).optional(),
  startDate: z.string().datetime(),
  baseSalary: z.number().optional(),
  payGrade: z.string().optional(),
  workLocation: z.string().optional(),
});

router.post('/employees', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const data = createEmployeeSchema.parse(req.body);

    // Check if employee record already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: data.userId },
          { employeeId: data.employeeId },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee record already exists' });
    }

    const employee = await prisma.employee.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== LEAVE MANAGEMENT ====================

// Get leave types
router.get('/leave-types', async (req: AuthRequest, res) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json(leaveTypes);
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leave requests
router.get('/leave-requests', async (req: AuthRequest, res) => {
  try {
    const { employeeId, status, month, year } = req.query;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        ...(employeeId && { employeeId: employeeId as string }),
        ...(status && { status: status as any }),
        ...(month && year && {
          startDate: {
            gte: new Date(parseInt(year as string), parseInt(month as string) - 1, 1),
            lt: new Date(parseInt(year as string), parseInt(month as string), 1),
          },
        }),
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit leave request
const leaveRequestSchema = z.object({
  leaveTypeId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalDays: z.number(),
  reason: z.string().optional(),
  emergencyContact: z.string().optional(),
  handoverNotes: z.string().optional(),
});

router.post('/leave-requests', async (req: AuthRequest, res) => {
  try {
    const data = leaveRequestSchema.parse(req.body);

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveTypeId: data.leaveTypeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays: data.totalDays,
        reason: data.reason,
        emergencyContact: data.emergencyContact,
        handoverNotes: data.handoverNotes,
      },
      include: {
        leaveType: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject leave request
router.patch('/leave-requests/:id', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const { status, rejectedReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedBy: status === 'APPROVED' ? req.user!.id : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        rejectedReason: status === 'REJECTED' ? rejectedReason : undefined,
      },
      include: {
        leaveType: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.json(leaveRequest);
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== CPD RECORDS ====================

// Get CPD records
router.get('/cpd-records', async (req: AuthRequest, res) => {
  try {
    const { employeeId, categoryId, year } = req.query;

    // Get employee record if not provided
    let targetEmployeeId = employeeId as string;
    if (!targetEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user!.id },
      });
      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found' });
      }
      targetEmployeeId = employee.id;
    }

    const cpdRecords = await prisma.cPDRecord.findMany({
      where: {
        employeeId: targetEmployeeId,
        ...(categoryId && { categoryId: categoryId as string }),
        ...(year && {
          startDate: {
            gte: new Date(parseInt(year as string), 0, 1),
            lt: new Date(parseInt(year as string) + 1, 0, 1),
          },
        }),
      },
      include: {
        category: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json(cpdRecords);
  } catch (error) {
    console.error('Get CPD records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add CPD record
const cpdRecordSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  provider: z.string().optional(),
  type: z.enum(['FORMAL_COURSE', 'CONFERENCE', 'WORKSHOP', 'SEMINAR', 'WEBINAR', 'READING', 'RESEARCH', 'MENTORING', 'COACHING', 'PROJECT_WORK', 'PEER_LEARNING', 'SELF_STUDY']),
  hours: z.number(),
  cost: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  completionDate: z.string().datetime().optional(),
  certificateUrl: z.string().optional(),
  learningOutcomes: z.string().optional(),
  reflection: z.string().optional(),
});

router.post('/cpd-records', async (req: AuthRequest, res) => {
  try {
    const data = cpdRecordSchema.parse(req.body);

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const cpdRecord = await prisma.cPDRecord.create({
      data: {
        employeeId: employee.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        provider: data.provider,
        type: data.type,
        hours: data.hours,
        cost: data.cost,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
        certificateUrl: data.certificateUrl,
        learningOutcomes: data.learningOutcomes,
        reflection: data.reflection,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(cpdRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create CPD record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== SKILLS MATRIX ====================

// Get skill categories and skills
router.get('/skills', async (req: AuthRequest, res) => {
  try {
    const skillCategories = await prisma.skillCategory.findMany({
      where: { isActive: true },
      include: {
        skills: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(skillCategories);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skill assessments
router.get('/skill-assessments', async (req: AuthRequest, res) => {
  try {
    const { employeeId } = req.query;

    // Get employee record if not provided
    let targetEmployeeId = employeeId as string;
    if (!targetEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user!.id },
      });
      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found' });
      }
      targetEmployeeId = employee.id;
    }

    const skillAssessments = await prisma.skillAssessment.findMany({
      where: { employeeId: targetEmployeeId },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        skill: {
          category: {
            name: 'asc',
          },
        },
      },
    });

    res.json(skillAssessments);
  } catch (error) {
    console.error('Get skill assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update skill assessment
const skillAssessmentSchema = z.object({
  skillId: z.string(),
  currentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  targetLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']).optional(),
  proficiency: z.number().min(0).max(100),
  evidence: z.string().optional(),
  notes: z.string().optional(),
  developmentPlan: z.string().optional(),
});

router.post('/skill-assessments', async (req: AuthRequest, res) => {
  try {
    const data = skillAssessmentSchema.parse(req.body);

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user!.id },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    const skillAssessment = await prisma.skillAssessment.upsert({
      where: {
        employeeId_skillId: {
          employeeId: employee.id,
          skillId: data.skillId,
        },
      },
      update: {
        currentLevel: data.currentLevel,
        targetLevel: data.targetLevel,
        proficiency: data.proficiency,
        evidence: data.evidence,
        notes: data.notes,
        developmentPlan: data.developmentPlan,
        lastAssessed: new Date(),
      },
      create: {
        employeeId: employee.id,
        skillId: data.skillId,
        currentLevel: data.currentLevel,
        targetLevel: data.targetLevel,
        proficiency: data.proficiency,
        evidence: data.evidence,
        notes: data.notes,
        developmentPlan: data.developmentPlan,
      },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });

    res.json(skillAssessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update skill assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;