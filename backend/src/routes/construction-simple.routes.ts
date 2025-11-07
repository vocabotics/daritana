import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Mock data store (replace with actual database later)
const mockConstructionData = {
  sites: [
    {
      id: '1',
      name: 'KLCC Tower Phase 2',
      location: 'Kuala Lumpur City Centre',
      projectId: 'proj_001',
      startDate: new Date('2025-01-01'),
      expectedEndDate: new Date('2025-12-31'),
      currentPhase: 'Foundation',
      overallProgress: 35,
      status: 'active',
      managerName: 'Ahmad Rahman',
      managerContact: '+60123456789',
      totalWorkers: 45,
      activeWorkers: 42,
      weather: {
        condition: 'Partly Cloudy',
        temperature: 32,
        humidity: 75,
        windSpeed: 12,
      },
      safetyScore: 92,
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Penang Bridge Extension',
      location: 'George Town, Penang',
      projectId: 'proj_002',
      startDate: new Date('2025-02-01'),
      expectedEndDate: new Date('2026-06-30'),
      currentPhase: 'Planning',
      overallProgress: 15,
      status: 'active',
      managerName: 'Lee Wei Ming',
      managerContact: '+60123456790',
      totalWorkers: 30,
      activeWorkers: 28,
      weather: {
        condition: 'Sunny',
        temperature: 34,
        humidity: 70,
        windSpeed: 15,
      },
      safetyScore: 95,
      lastUpdated: new Date(),
    },
  ],
};

// Get all construction sites
router.get('/sites', authenticate, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: mockConstructionData.sites,
      total: mockConstructionData.sites.length,
    });
  } catch (error) {
    console.error('Error fetching construction sites:', error);
    res.status(500).json({ error: 'Failed to fetch construction sites' });
  }
});

// Get single construction site (PUBLIC FOR DEVELOPMENT)
router.get('/sites/:siteId', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const site = mockConstructionData.sites.find(s => s.id === siteId) || mockConstructionData.sites[0];

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error fetching construction site:', error);
    res.status(500).json({ error: 'Failed to fetch construction site' });
  }
});

// Get progress updates for a site (PUBLIC FOR DEVELOPMENT)
router.get('/sites/:siteId/progress', async (req: Request, res: Response) => {
  try {
    const updates = [
      {
        id: '1',
        timestamp: new Date('2025-08-17T08:00:00'),
        phase: 'Foundation',
        progress: 35,
        description: 'Foundation work 35% complete. Concrete pouring for B2 level in progress.',
        author: 'Ahmad Rahman',
        mediaCount: 12,
        aiVerified: true,
      },
      {
        id: '2',
        timestamp: new Date('2025-08-16T16:30:00'),
        phase: 'Foundation',
        progress: 32,
        description: 'Completed pile cap construction for Zone A. Steel reinforcement ongoing.',
        author: 'Site Engineer',
        mediaCount: 8,
        aiVerified: true,
      },
      {
        id: '3',
        timestamp: new Date('2025-08-16T09:00:00'),
        phase: 'Foundation',
        progress: 30,
        description: 'Weather delay resolved. Work resumed on foundation excavation.',
        author: 'Ahmad Rahman',
        mediaCount: 5,
        aiVerified: false,
      },
    ];

    res.json({
      success: true,
      data: updates,
      total: updates.length,
    });
  } catch (error) {
    console.error('Error fetching progress updates:', error);
    res.status(500).json({ error: 'Failed to fetch progress updates' });
  }
});

// Get material deliveries
router.get('/sites/:siteId/materials', async (req: Request, res: Response) => {
  try {
    const deliveries = [
      {
        id: '1',
        material: 'Ready Mix Concrete',
        quantity: 150,
        unit: 'cubic meters',
        deliveredAt: new Date('2025-08-17T07:30:00'),
        supplier: 'ABC Construction Supplies',
        status: 'delivered',
      },
      {
        id: '2',
        material: 'Steel Reinforcement Bars',
        quantity: 25,
        unit: 'tonnes',
        deliveredAt: new Date('2025-08-16T14:00:00'),
        supplier: 'Steel Works Sdn Bhd',
        status: 'inspected',
      },
      {
        id: '3',
        material: 'Cement Bags',
        quantity: 500,
        unit: 'bags',
        deliveredAt: new Date('2025-08-16T09:00:00'),
        supplier: 'Cement Malaysia',
        status: 'delivered',
      },
    ];

    res.json({
      success: true,
      data: deliveries,
      total: deliveries.length,
    });
  } catch (error) {
    console.error('Error fetching material deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch material deliveries' });
  }
});

// Get worker activities (PUBLIC FOR DEVELOPMENT)
router.get('/sites/:siteId/workers', async (req: Request, res: Response) => {
  try {
    const workers = [
      {
        id: '1',
        name: 'Mohd Ali',
        role: 'Foreman',
        checkIn: new Date('2025-08-17T07:00:00'),
        checkOut: new Date('2025-08-17T17:00:00'),
        hoursWorked: 10,
        productivity: 95,
        safetyCompliant: true,
      },
      {
        id: '2',
        name: 'Kumar Raj',
        role: 'Crane Operator',
        checkIn: new Date('2025-08-17T07:30:00'),
        checkOut: null,
        hoursWorked: 4.5,
        productivity: 88,
        safetyCompliant: true,
      },
      {
        id: '3',
        name: 'Chen Wei',
        role: 'Electrician',
        checkIn: new Date('2025-08-17T08:00:00'),
        checkOut: null,
        hoursWorked: 4,
        productivity: 92,
        safetyCompliant: true,
      },
    ];

    res.json({
      success: true,
      data: workers,
      total: workers.length,
    });
  } catch (error) {
    console.error('Error fetching worker activities:', error);
    res.status(500).json({ error: 'Failed to fetch worker activities' });
  }
});

// Get analytics data
router.get('/sites/:siteId/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const analytics = {
      progressChart: [
        { date: '2025-08-11', planned: 25, actual: 24 },
        { date: '2025-08-12', planned: 27, actual: 26 },
        { date: '2025-08-13', planned: 29, actual: 28 },
        { date: '2025-08-14', planned: 31, actual: 30 },
        { date: '2025-08-15', planned: 33, actual: 32 },
        { date: '2025-08-16', planned: 35, actual: 34 },
        { date: '2025-08-17', planned: 37, actual: 35 },
      ],
      phaseCompletion: [
        { phase: 'Site Prep', completed: 100 },
        { phase: 'Foundation', completed: 35 },
        { phase: 'Structure', completed: 0 },
        { phase: 'MEP', completed: 0 },
        { phase: 'Finishing', completed: 0 },
      ],
      safetyMetrics: {
        incidents: 0,
        nearMisses: 2,
        safetyScore: 92,
        daysWithoutIncident: 45,
      },
      resourceUtilization: {
        workers: 93,
        equipment: 87,
        materials: 78,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Upload construction image for AI analysis (mock)
router.post('/sites/:siteId/analyze-image', authenticate, async (req: Request, res: Response) => {
  try {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      success: true,
      data: {
        progressDetected: 35,
        phase: 'Foundation',
        elementsIdentified: [
          'Concrete foundation',
          'Steel reinforcement',
          'Formwork',
          'Construction equipment',
          'Workers with PPE',
        ],
        safetyIssues: [],
        recommendations: [
          'Continue with current pace to meet deadline',
          'Ensure proper curing of concrete in hot weather',
          'Monitor steel placement accuracy',
        ],
        confidence: 0.92,
      },
      message: 'Image analyzed successfully',
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Add progress update (mock)
router.post('/sites/:siteId/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { phase, progress, description, mediaUrls } = req.body;

    const newUpdate = {
      id: Date.now().toString(),
      timestamp: new Date(),
      phase,
      progress,
      description,
      author: 'Current User',
      mediaCount: mediaUrls?.length || 0,
      aiVerified: false,
      siteId,
    };

    res.json({
      success: true,
      data: newUpdate,
      message: 'Progress update added successfully',
    });
  } catch (error) {
    console.error('Error adding progress update:', error);
    res.status(500).json({ error: 'Failed to add progress update' });
  }
});

// Get dashboard summary
router.get('/dashboard/:siteId', authenticate, async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const site = mockConstructionData.sites.find(s => s.id === siteId) || mockConstructionData.sites[0];

    const dashboard = {
      site,
      statistics: {
        overallProgress: site.overallProgress,
        daysRemaining: Math.floor((new Date(site.expectedEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        workersOnSite: site.activeWorkers,
        safetyScore: site.safetyScore,
        tasksCompleted: 24,
        tasksInProgress: 12,
        issuesOpen: 3,
        inspectionsDue: 2,
      },
      recentActivity: [
        {
          type: 'progress',
          message: 'Foundation work reached 35% completion',
          timestamp: new Date('2025-08-17T08:00:00'),
          user: 'Ahmad Rahman',
        },
        {
          type: 'material',
          message: '150 cubic meters of concrete delivered',
          timestamp: new Date('2025-08-17T07:30:00'),
          user: 'Site Manager',
        },
        {
          type: 'safety',
          message: 'Daily safety briefing completed',
          timestamp: new Date('2025-08-17T07:00:00'),
          user: 'Safety Officer',
        },
      ],
      upcomingMilestones: [
        {
          name: 'Foundation Completion',
          date: new Date('2025-09-15'),
          progress: 35,
        },
        {
          name: 'Structural Frame Start',
          date: new Date('2025-09-20'),
          progress: 0,
        },
      ],
    };

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;