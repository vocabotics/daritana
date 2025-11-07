import express from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authorize, AuthRequest } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const courseSchema = z.object({
  title: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  credits: z.number().min(1).max(20),
  level: z.enum(['UNDERGRADUATE', 'GRADUATE', 'DOCTORAL', 'PROFESSIONAL']),
  departmentId: z.string().uuid(),
  syllabus: z.string().optional(),
  learningOutcomes: z.string().optional(),
  prerequisites: z.string().optional(),
  maxEnrollment: z.number().optional(),
})

const moduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  orderIndex: z.number().min(0),
  estimatedHours: z.number().optional(),
})

const lessonSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  orderIndex: z.number().min(0),
  type: z.enum(['VIDEO', 'TEXT', 'INTERACTIVE', 'QUIZ', 'ASSIGNMENT']),
  duration: z.number().optional(),
  resources: z.string().optional(),
})

const assignmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  instructions: z.string().optional(),
  maxPoints: z.number().min(0),
  dueDate: z.string().datetime(),
  submissionFormat: z.enum(['TEXT', 'FILE', 'LINK', 'BOTH']),
  allowLateSubmission: z.boolean().default(false),
  latePenalty: z.number().optional(),
})

const enrollmentSchema = z.object({
  courseId: z.string().uuid(),
  semesterId: z.string().uuid().optional(),
})

// Institution Routes
router.get('/institutions', authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        departments: {
          include: {
            _count: {
              select: { courses: true, faculty: true }
            }
          }
        },
        _count: {
          select: { 
            learningUsers: true,
            courses: true,
            semesters: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json(institutions)
  } catch (error) {
    console.error('Error fetching institutions:', error)
    res.status(500).json({ error: 'Failed to fetch institutions' })
  }
})

// Course Routes
router.get('/courses', authorize(['ADMIN', 'PROJECT_LEAD', 'DESIGNER']), async (req: AuthRequest, res) => {
  try {
    const { 
      departmentId, 
      level, 
      semesterId, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (level) {
      where.level = level
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          department: {
            select: { name: true, institution: { select: { name: true } } }
          },
          instructor: {
            select: {
              user: {
                select: { firstName: true, lastName: true, avatar: true }
              }
            }
          },
          _count: {
            select: { 
              modules: true, 
              enrollments: true,
              assignments: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { code: 'asc' }
      }),
      prisma.course.count({ where })
    ])

    res.json({
      courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

router.post('/courses', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const validatedData = courseSchema.parse(req.body)
    const instructorId = req.body.instructorId

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        instructorId: instructorId || undefined,
        status: 'DRAFT'
      },
      include: {
        department: true,
        instructor: {
          select: {
            user: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          }
        }
      }
    })

    res.status(201).json(course)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Error creating course:', error)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

router.get('/courses/:id', authorize(['ADMIN', 'PROJECT_LEAD', 'DESIGNER', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: {
          include: { institution: true }
        },
        instructor: {
          select: {
            user: {
              select: { firstName: true, lastName: true, avatar: true, email: true }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' }
            },
            _count: {
              select: { lessons: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        assignments: {
          include: {
            _count: {
              select: { submissions: true }
            }
          },
          orderBy: { dueDate: 'asc' }
        },
        announcements: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { 
            enrollments: true,
            modules: true,
            lessons: true,
            assignments: true
          }
        }
      }
    })

    if (!course) {
      res.status(404).json({ error: 'Course not found' })
      return
    }

    res.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    res.status(500).json({ error: 'Failed to fetch course' })
  }
})

// Module Routes
router.post('/courses/:courseId/modules', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params
    const validatedData = moduleSchema.parse(req.body)

    const module = await prisma.module.create({
      data: {
        ...validatedData,
        courseId
      },
      include: {
        _count: {
          select: { lessons: true }
        }
      }
    })

    res.status(201).json(module)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Error creating module:', error)
    res.status(500).json({ error: 'Failed to create module' })
  }
})

// Lesson Routes
router.post('/modules/:moduleId/lessons', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const { moduleId } = req.params
    const validatedData = lessonSchema.parse(req.body)

    const lesson = await prisma.lesson.create({
      data: {
        ...validatedData,
        moduleId
      }
    })

    res.status(201).json(lesson)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Error creating lesson:', error)
    res.status(500).json({ error: 'Failed to create lesson' })
  }
})

// Assignment Routes
router.post('/courses/:courseId/assignments', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params
    const validatedData = assignmentSchema.parse(req.body)

    const assignment = await prisma.assignment.create({
      data: {
        ...validatedData,
        courseId,
        createdBy: req.user!.id
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    res.status(201).json(assignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Error creating assignment:', error)
    res.status(500).json({ error: 'Failed to create assignment' })
  }
})

// Enrollment Routes
router.post('/enrollments', authorize(['ADMIN', 'PROJECT_LEAD', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const validatedData = enrollmentSchema.parse(req.body)
    const studentId = req.body.studentId || req.user!.id

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: validatedData.courseId,
          userId: studentId
        }
      }
    })

    if (existingEnrollment) {
      res.status(400).json({ error: 'Student already enrolled in this course' })
      return
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId: validatedData.courseId,
        status: 'ACTIVE'
      },
      include: {
        course: true,
        user: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json(enrollment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Error creating enrollment:', error)
    res.status(500).json({ error: 'Failed to create enrollment' })
  }
})

// Student Dashboard
router.get('/dashboard/student', authorize(['STAFF', 'DESIGNER']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    // Get student info or create if doesn't exist
    let student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true }
        }
      }
    })

    if (!student) {
      // Create student record for existing user
      student = await prisma.student.create({
        data: {
          userId,
          studentId: `STU${Date.now()}`,
          level: 'UNDERGRADUATE',
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true, email: true }
          }
        }
      })
    }

    // Get enrolled courses with progress
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        studentId: student.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            _count: {
              select: { lessons: true, assignments: true }
            }
          }
        },
        semester: {
          select: { name: true, startDate: true, endDate: true }
        }
      }
    })

    // Get lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { studentId: student.id },
      include: {
        lesson: {
          include: {
            module: {
              select: { courseId: true }
            }
          }
        }
      }
    })

    // Get recent assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        course: {
          enrollments: {
            some: {
              studentId: student.id,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        course: {
          select: { title: true, code: true }
        },
        submissions: {
          where: { studentId: student.id },
          select: { submittedAt: true, grade: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    // Calculate progress for each course
    const coursesWithProgress = enrollments.map(enrollment => {
      const courseProgress = lessonProgress.filter(
        progress => progress.lesson.module.courseId === enrollment.course.id
      )
      
      const completedLessons = courseProgress.filter(p => p.status === 'COMPLETED').length
      const totalLessons = enrollment.course._count.lessons
      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        ...enrollment,
        progress: {
          completedLessons,
          totalLessons,
          percentage: progressPercentage
        }
      }
    })

    const dashboardData = {
      student,
      courses: coursesWithProgress,
      assignments: assignments.map(assignment => ({
        ...assignment,
        isSubmitted: assignment.submissions.length > 0,
        grade: assignment.submissions[0]?.grade || null
      })),
      stats: {
        totalCourses: enrollments.length,
        completedLessons: lessonProgress.filter(p => p.status === 'COMPLETED').length,
        pendingAssignments: assignments.filter(a => 
          a.submissions.length === 0 && new Date(a.dueDate) > new Date()
        ).length,
        averageProgress: coursesWithProgress.reduce((sum, course) => 
          sum + course.progress.percentage, 0) / (coursesWithProgress.length || 1)
      }
    }

    res.json(dashboardData)
  } catch (error) {
    console.error('Error fetching student dashboard:', error)
    res.status(500).json({ error: 'Failed to fetch student dashboard' })
  }
})

// Faculty Dashboard
router.get('/dashboard/faculty', authorize(['ADMIN', 'PROJECT_LEAD']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    // Get faculty info or create if doesn't exist
    let faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true }
        }
      }
    })

    if (!faculty) {
      faculty = await prisma.faculty.create({
        data: {
          userId,
          facultyId: `FAC${Date.now()}`,
          title: 'Instructor',
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true, email: true }
          }
        }
      })
    }

    // Get courses taught by this faculty
    const courses = await prisma.course.findMany({
      where: { instructorId: faculty.id },
      include: {
        department: {
          select: { name: true }
        },
        _count: {
          select: { 
            enrollments: true, 
            assignments: true,
            modules: true,
            lessons: true
          }
        }
      }
    })

    // Get assignments needing grading
    const assignmentsToGrade = await prisma.assignment.findMany({
      where: {
        course: { instructorId: faculty.id },
        submissions: {
          some: {
            status: 'SUBMITTED'
          }
        }
      },
      include: {
        course: {
          select: { title: true, code: true }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    const dashboardData = {
      faculty,
      courses,
      assignmentsToGrade,
      stats: {
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum, course) => sum + course._count.enrollments, 0),
        pendingGrading: assignmentsToGrade.reduce((sum, assignment) => sum + assignment._count.submissions, 0),
        totalLessons: courses.reduce((sum, course) => sum + course._count.lessons, 0)
      }
    }

    res.json(dashboardData)
  } catch (error) {
    console.error('Error fetching faculty dashboard:', error)
    res.status(500).json({ error: 'Failed to fetch faculty dashboard' })
  }
})

export default router