import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/courses', authenticate, async (req, res) => {
  try {
    const { category, level, search } = req.query;
    
    // Mock courses
    const courses = [
      {
        id: 'c1',
        title: 'Introduction to Sustainable Architecture',
        description: 'Learn the fundamentals of green building design',
        category: 'Architecture',
        level: 'beginner',
        duration: '4 weeks',
        modules: 8,
        enrolled: 234,
        rating: 4.7,
        instructor: {
          name: 'Dr. Sarah Chen',
          title: 'Senior Architect',
          avatar: '/instructor1.jpg'
        },
        thumbnail: '/course1.jpg',
        price: 299
      },
      {
        id: 'c2',
        title: 'Advanced BIM Modeling',
        description: 'Master Building Information Modeling techniques',
        category: 'Technology',
        level: 'advanced',
        duration: '6 weeks',
        modules: 12,
        enrolled: 156,
        rating: 4.9,
        instructor: {
          name: 'Ahmad Rahman',
          title: 'BIM Specialist',
          avatar: '/instructor2.jpg'
        },
        thumbnail: '/course2.jpg',
        price: 499
      },
      {
        id: 'c3',
        title: 'Project Management for Architects',
        description: 'Essential project management skills for architecture professionals',
        category: 'Management',
        level: 'intermediate',
        duration: '3 weeks',
        modules: 6,
        enrolled: 312,
        rating: 4.5,
        instructor: {
          name: 'Lisa Wong',
          title: 'Project Director',
          avatar: '/instructor3.jpg'
        },
        thumbnail: '/course3.jpg',
        price: 199
      }
    ];
    
    let filtered = courses;
    if (category) filtered = filtered.filter(c => c.category === category);
    if (level) filtered = filtered.filter(c => c.level === level);
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/courses/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = {
      id,
      title: 'Introduction to Sustainable Architecture',
      description: 'Learn the fundamentals of green building design',
      category: 'Architecture',
      level: 'beginner',
      duration: '4 weeks',
      modules: [
        {
          id: 'm1',
          title: 'Introduction to Sustainability',
          duration: '45 min',
          completed: true
        },
        {
          id: 'm2',
          title: 'Green Building Materials',
          duration: '60 min',
          completed: true
        },
        {
          id: 'm3',
          title: 'Energy Efficiency',
          duration: '50 min',
          completed: false
        }
      ],
      instructor: {
        name: 'Dr. Sarah Chen',
        title: 'Senior Architect',
        bio: '15+ years experience in sustainable design',
        avatar: '/instructor1.jpg'
      },
      enrolled: 234,
      rating: 4.7,
      reviews: 45,
      price: 299,
      certificate: true,
      prerequisites: ['Basic architecture knowledge'],
      learningOutcomes: [
        'Understand sustainable design principles',
        'Apply green building techniques',
        'Evaluate environmental impact'
      ]
    };
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Enroll in course
router.post('/courses/:id/enroll', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;
    
    res.json({ 
      success: true,
      enrolled: true,
      courseId: id,
      userId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// Get user's enrolled courses
router.get('/my-courses', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    
    // Mock enrolled courses
    const courses = [
      {
        id: 'c1',
        title: 'Introduction to Sustainable Architecture',
        progress: 65,
        nextModule: 'Energy Efficiency',
        lastAccessed: new Date().toISOString()
      },
      {
        id: 'c3',
        title: 'Project Management for Architects',
        progress: 100,
        completed: true,
        completedDate: new Date().toISOString()
      }
    ];
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

// Update course progress
router.post('/courses/:courseId/progress', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleId, completed } = req.body;
    
    res.json({ 
      success: true,
      courseId,
      moduleId,
      completed
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get certifications
router.get('/certifications', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    
    // Mock certifications
    const certifications = [
      {
        id: 'cert1',
        name: 'Certified Sustainable Designer',
        issuer: 'Green Building Council',
        issueDate: '2024-03-15',
        expiryDate: '2027-03-15',
        status: 'active',
        credentialId: 'GBC-2024-1234'
      },
      {
        id: 'cert2',
        name: 'BIM Professional',
        issuer: 'Autodesk',
        issueDate: '2023-11-20',
        expiryDate: null,
        status: 'active',
        credentialId: 'AD-BIM-5678'
      }
    ];
    
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Get learning paths
router.get('/paths', authenticate, async (req, res) => {
  try {
    // Mock learning paths
    const paths = [
      {
        id: 'p1',
        title: 'Become a Sustainable Architect',
        description: 'Complete journey to master sustainable design',
        courses: 5,
        duration: '3 months',
        level: 'beginner to advanced',
        enrolled: 89
      },
      {
        id: 'p2',
        title: 'Digital Architecture Specialist',
        description: 'Master digital tools and BIM',
        courses: 4,
        duration: '2 months',
        level: 'intermediate',
        enrolled: 67
      }
    ];
    
    res.json(paths);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

// Get quizzes/assessments
router.get('/assessments', authenticate, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // Mock assessments
    const assessments = [
      {
        id: 'a1',
        courseId: 'c1',
        title: 'Module 1 Quiz',
        questions: 10,
        duration: '15 min',
        attempts: 2,
        bestScore: 85
      },
      {
        id: 'a2',
        courseId: 'c1',
        title: 'Final Assessment',
        questions: 25,
        duration: '45 min',
        attempts: 0,
        bestScore: null
      }
    ];
    
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Submit assessment
router.post('/assessments/:id/submit', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    
    // Mock scoring
    const score = Math.floor(Math.random() * 30) + 70; // Random score 70-100
    
    res.json({ 
      success: true,
      assessmentId: id,
      score,
      passed: score >= 80,
      feedback: 'Good job! Review materials on energy efficiency for better understanding.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get learning analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    
    const analytics = {
      totalCourses: 2,
      completedCourses: 1,
      inProgressCourses: 1,
      totalLearningHours: 24.5,
      thisWeekHours: 3.2,
      streak: 5,
      achievements: [
        'Fast Learner',
        'Quiz Master',
        'Consistent Learner'
      ],
      skillProgress: {
        'Sustainable Design': 75,
        'Project Management': 100,
        'BIM': 45,
        'Building Codes': 60
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;