import { Request, Response } from 'express'
import { prisma } from '../server'
import { z } from 'zod'


// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  duration: z.number().optional(),
  language: z.string().default('en'),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  trailer: z.string().optional(),
  price: z.number().default(0),
  currency: z.string().default('MYR'),
  isFreeTrial: z.boolean().default(false),
  prerequisites: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
})

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
  duration: z.number().optional(),
})

const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT', 'RESOURCE', 'LIVE']),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  resourceUrl: z.string().optional(),
  sortOrder: z.number().default(0),
  duration: z.number().optional(),
  isPreview: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
})

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(1).default(0.7),
  maxAttempts: z.number().optional(),
  timeLimit: z.number().optional(),
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.any(),
    points: z.number().default(1),
  })),
})

// Helper to get user from request
const getUserFromRequest = (req: any) => {
  return req.user
}

// ==================== COURSES ====================

export const getCourses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category, level, status, organizationId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {
      status: 'PUBLISHED',
    }

    if (category) where.category = category
    if (level) where.level = level
    if (organizationId) where.organizationId = organizationId

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ])

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    })
  }
}

export const getCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        enrollments: {
          select: {
            userId: true,
            progress: true,
            completedAt: true,
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      })
    }

    res.json({
      success: true,
      data: course
    })
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    })
  }
}

export const createCourse = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const validatedData = createCourseSchema.parse(req.body)

    // Check if slug is unique
    const existingCourse = await prisma.course.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: 'Course slug already exists'
      })
    }

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        instructorId: user.id,
        organizationId: user.organizationId,
        status: 'DRAFT',
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: course
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create course error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create course'
    })
  }
}

export const updateCourse = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)
    const updates = req.body

    // Check if user is the instructor
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      })
    }

    if (existingCourse.instructorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this course'
      })
    }

    const course = await prisma.course.update({
      where: { id },
      data: updates,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.json({
      success: true,
      data: course
    })
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update course'
    })
  }
}

export const publishCourse = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    // Check if user is the instructor
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      })
    }

    if (course.instructorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to publish this course'
      })
    }

    // Check if course has at least one module with lessons
    if (course.modules.length === 0 || course.modules.every(m => m.lessons.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Course must have at least one module with lessons'
      })
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    })

    res.json({
      success: true,
      data: updatedCourse
    })
  } catch (error) {
    console.error('Publish course error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to publish course'
    })
  }
}

// ==================== MODULES ====================

export const createModule = async (req: any, res: Response) => {
  try {
    const { courseId } = req.params
    const user = getUserFromRequest(req)
    const validatedData = createModuleSchema.parse(req.body)

    // Check if user owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      })
    }

    if (course.instructorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to add modules to this course'
      })
    }

    const module = await prisma.courseModule.create({
      data: {
        ...validatedData,
        courseId,
      }
    })

    res.status(201).json({
      success: true,
      data: module
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create module error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create module'
    })
  }
}

// ==================== LESSONS ====================

export const createLesson = async (req: any, res: Response) => {
  try {
    const { moduleId } = req.params
    const user = getUserFromRequest(req)
    const validatedData = createLessonSchema.parse(req.body)

    // Check if user owns the course
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: true
      }
    })

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      })
    }

    if (module.course.instructorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to add lessons to this module'
      })
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...validatedData,
        moduleId,
      }
    })

    res.status(201).json({
      success: true,
      data: lesson
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create lesson error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create lesson'
    })
  }
}

export const getLesson = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true
          }
        },
        quizzes: true,
      }
    })

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      })
    }

    // Check if user is enrolled or is the instructor
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: lesson.module.course.id,
          userId: user.id
        }
      }
    })

    if (!enrollment && lesson.module.course.instructorId !== user.id && !lesson.isPreview) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled in this course to view this lesson'
      })
    }

    // Get user's progress for this lesson
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_userId: {
          lessonId: id,
          userId: user.id
        }
      }
    })

    res.json({
      success: true,
      data: {
        ...lesson,
        progress
      }
    })
  } catch (error) {
    console.error('Get lesson error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson'
    })
  }
}

// ==================== ENROLLMENT ====================

export const enrollInCourse = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: id,
          userId: user.id
        }
      }
    })

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      })
    }

    // Calculate total lessons
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: id,
        userId: user.id,
        totalLessons,
        status: 'ACTIVE'
      }
    })

    // Update enrollment count
    await prisma.course.update({
      where: { id },
      data: { enrollmentCount: { increment: 1 } }
    })

    res.status(201).json({
      success: true,
      data: enrollment
    })
  } catch (error) {
    console.error('Enroll in course error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in course'
    })
  }
}

export const getMyEnrollments = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const { status } = req.query

    const where: any = {
      userId: user.id
    }

    if (status) where.status = status

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    res.json({
      success: true,
      data: enrollments
    })
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments'
    })
  }
}

// ==================== PROGRESS TRACKING ====================

export const updateLessonProgress = async (req: any, res: Response) => {
  try {
    const { lessonId } = req.params
    const user = getUserFromRequest(req)
    const { progress, lastPosition, isCompleted } = req.body

    // Get lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      })
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: lesson.module.course.id,
          userId: user.id
        }
      }
    })

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled in this course'
      })
    }

    // Upsert lesson progress
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_userId: {
          lessonId,
          userId: user.id
        }
      },
      create: {
        lessonId,
        userId: user.id,
        progress: progress || 0,
        lastPosition,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null
      },
      update: {
        progress: progress || 0,
        lastPosition,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Update enrollment progress if lesson is completed
    if (isCompleted) {
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          isCompleted: true,
          lesson: {
            module: {
              courseId: lesson.module.course.id
            }
          }
        }
      })

      const courseProgress = completedLessons / enrollment.totalLessons

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          completedLessons,
          progress: courseProgress,
          completedAt: courseProgress === 1 ? new Date() : null,
          status: courseProgress === 1 ? 'COMPLETED' : 'ACTIVE'
        }
      })

      // Generate certificate if course is completed
      if (courseProgress === 1) {
        const certificateNumber = `CERT-${Date.now()}-${user.id.substring(0, 8)}`
        
        await prisma.certificate.create({
          data: {
            courseId: lesson.module.course.id,
            userId: user.id,
            certificateNumber,
            verificationUrl: `/certificates/verify/${certificateNumber}`
          }
        })
      }
    }

    res.json({
      success: true,
      data: lessonProgress
    })
  } catch (error) {
    console.error('Update lesson progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update lesson progress'
    })
  }
}

// ==================== QUIZZES ====================

export const createQuiz = async (req: any, res: Response) => {
  try {
    const { lessonId } = req.params
    const user = getUserFromRequest(req)
    const validatedData = createQuizSchema.parse(req.body)

    // Check if user owns the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      })
    }

    if (lesson.module.course.instructorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to add quiz to this lesson'
      })
    }

    const quiz = await prisma.quiz.create({
      data: {
        ...validatedData,
        lessonId,
      }
    })

    res.status(201).json({
      success: true,
      data: quiz
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create quiz error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create quiz'
    })
  }
}

export const submitQuizAttempt = async (req: any, res: Response) => {
  try {
    const { quizId } = req.params
    const user = getUserFromRequest(req)
    const { answers } = req.body

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      })
    }

    // Check max attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        quizId,
        userId: user.id
      }
    })

    if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        error: 'Maximum attempts reached'
      })
    }

    // Calculate score
    const questions = quiz.questions as any[]
    let correctAnswers = 0
    let totalPoints = 0

    questions.forEach((question, index) => {
      totalPoints += question.points || 1
      if (answers[index] === question.correctAnswer) {
        correctAnswers += question.points || 1
      }
    })

    const score = correctAnswers / totalPoints
    const passed = score >= quiz.passingScore

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        score,
        passed,
        answers,
        completedAt: new Date()
      }
    })

    res.status(201).json({
      success: true,
      data: {
        ...attempt,
        totalQuestions: questions.length,
        correctAnswers,
        passingScore: quiz.passingScore
      }
    })
  } catch (error) {
    console.error('Submit quiz attempt error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz attempt'
    })
  }
}