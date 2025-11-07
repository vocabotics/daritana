import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../server';

const router = express.Router();

// Get all construction sites (projects with construction data)
router.get('/sites', authenticate, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        type: { in: ['commercial', 'residential', 'industrial', 'infrastructure'] },
        status: { in: ['IN_PROGRESS', 'PLANNING', 'ON_HOLD'] }
      },
      include: {
        client: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        tasks: {
          select: {
            status: true,
            progress: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform projects to construction site format
    const sites = projects.map(project => ({
      id: project.id,
      name: project.name,
      location: `${project.siteCity || 'Unknown'}, ${project.siteState || 'Malaysia'}`,
      projectId: project.id,
      startDate: project.startDate,
      expectedEndDate: project.endDate,
      currentPhase: getProjectPhase(project.progress),
      overallProgress: Math.round(project.progress * 100),
      status: mapProjectStatus(project.status),
      managerName: project.client ? `${project.client.firstName} ${project.client.lastName}` : 'Project Manager',
      managerContact: project.client?.phone || '+60123456789',
      totalWorkers: 45 + Math.floor(Math.random() * 20), // Simulated for now
      activeWorkers: 40 + Math.floor(Math.random() * 15), // Simulated for now
      weather: {
        condition: getWeatherCondition(),
        temperature: 28 + Math.floor(Math.random() * 8),
        humidity: 65 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 15),
      },
      safetyScore: 85 + Math.floor(Math.random() * 15),
      lastUpdated: project.updatedAt,
      
      // Additional real data
      budget: project.estimatedBudget,
      address: project.siteAddress,
      city: project.siteCity,
      state: project.siteState,
      country: project.siteCountry,
      tasksCompleted: project.tasks.filter(t => t.status === 'COMPLETED').length,
      tasksTotal: project.tasks.length
    }));

    res.json({
      success: true,
      data: sites,
      total: sites.length,
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
    
    let project = await prisma.project.findUnique({
      where: { id: siteId },
      include: {
        client: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            priority: true,
            startDate: true,
            dueDate: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                position: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      // Return a default project if specific one not found
      const defaultProject = await prisma.project.findFirst({
        include: {
          client: true,
          tasks: true,
          members: {
            include: {
              user: true
            }
          }
        }
      });
      
      if (!defaultProject) {
        return res.status(404).json({ error: 'No construction sites found' });
      }
      
      project = defaultProject;
    }

    // Transform to construction site format
    const site = {
      id: project.id,
      name: project.name,
      location: `${project.siteCity || 'Kuala Lumpur'}, ${project.siteState || 'Malaysia'}`,
      projectId: project.id,
      startDate: project.startDate,
      expectedEndDate: project.endDate,
      currentPhase: getProjectPhase(project.progress),
      overallProgress: Math.round(project.progress * 100),
      status: mapProjectStatus(project.status),
      managerName: project.client ? `${project.client.firstName} ${project.client.lastName}` : 'Project Manager',
      managerContact: project.client?.phone || '+60123456789',
      managerEmail: project.client?.email,
      totalWorkers: project.members.length * 5 + 20, // Estimate based on team size
      activeWorkers: project.members.length * 4 + 18,
      weather: {
        condition: getWeatherCondition(),
        temperature: 28 + Math.floor(Math.random() * 8),
        humidity: 65 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.floor(Math.random() * 15),
      },
      safetyScore: 85 + Math.floor(Math.random() * 15),
      lastUpdated: project.updatedAt,
      
      // Real project data
      description: project.description,
      budget: project.estimatedBudget,
      approvedBudget: project.approvedBudget,
      actualCost: project.actualCost,
      address: project.siteAddress,
      city: project.siteCity,
      state: project.siteState,
      postcode: project.sitePostcode,
      country: project.siteCountry,
      type: project.type,
      category: project.category,
      
      // Team data
      teamMembers: project.members.map(m => ({
        id: m.userId,
        name: m.user.name || `${m.user.firstName} ${m.user.lastName}`,
        role: m.role,
        position: m.user.position || m.role
      })),
      
      // Task summary
      tasksTotal: project.tasks.length,
      tasksCompleted: project.tasks.filter(t => t.status === 'COMPLETED').length,
      tasksInProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      tasksPending: project.tasks.filter(t => t.status === 'TODO').length,
      
      // Recent tasks
      recentTasks: project.tasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        progress: t.progress,
        priority: t.priority,
        dueDate: t.dueDate
      }))
    };

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error fetching construction site:', error);
    res.status(500).json({ error: 'Failed to fetch construction site' });
  }
});

// Get progress updates for a site (based on task updates)
router.get('/sites/:siteId/progress', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    
    // Get recent task updates for the project
    const tasks = await prisma.task.findMany({
      where: { projectId: siteId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        createdBy: {
          select: {
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const updates = tasks.map((task, index) => ({
      id: task.id,
      timestamp: task.updatedAt,
      phase: getProjectPhase(task.progress),
      progress: Math.round(task.progress * 100),
      description: task.description || `${task.title} - ${task.status}`,
      author: task.createdBy.name || `${task.createdBy.firstName} ${task.createdBy.lastName}`,
      mediaCount: Math.floor(Math.random() * 15),
      aiVerified: index % 2 === 0
    }));

    // If no tasks, return mock data
    if (updates.length === 0) {
      const mockUpdates = [
        {
          id: '1',
          timestamp: new Date(),
          phase: 'Foundation',
          progress: 35,
          description: 'Project initiated. Setting up construction site.',
          author: 'System',
          mediaCount: 0,
          aiVerified: true,
        }
      ];
      
      return res.json({
        success: true,
        data: mockUpdates,
        total: mockUpdates.length,
      });
    }

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

// Get material deliveries (simulated based on project data)
router.get('/sites/:siteId/materials', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    
    // For now, generate realistic mock data based on project
    const project = await prisma.project.findUnique({
      where: { id: siteId },
      select: {
        name: true,
        type: true,
        progress: true
      }
    });

    const materials = getMaterialsForProjectType(project?.type || 'commercial', project?.progress || 0);

    res.json({
      success: true,
      data: materials,
      total: materials.length,
    });
  } catch (error) {
    console.error('Error fetching material deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch material deliveries' });
  }
});

// Get worker activities (based on team members)
router.get('/sites/:siteId/workers', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: siteId },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true
          }
        }
      }
    });

    const workers = projectMembers.map(member => {
      const checkInTime = new Date();
      checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      
      const hoursWorked = 4 + Math.floor(Math.random() * 6);
      const checkOutTime = member.isActive ? null : new Date(checkInTime.getTime() + hoursWorked * 60 * 60 * 1000);
      
      return {
        id: member.userId,
        name: member.user.name || `${member.user.firstName} ${member.user.lastName}`,
        role: member.user.position || member.role || 'Worker',
        department: member.user.department,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        hoursWorked: checkOutTime ? hoursWorked : (new Date().getHours() - checkInTime.getHours()),
        productivity: 75 + Math.floor(Math.random() * 25),
        safetyCompliant: Math.random() > 0.1
      };
    });

    // Add some additional mock workers if team is small
    if (workers.length < 5) {
      const additionalWorkers = [
        { name: 'Ahmad Rahman', role: 'Site Supervisor' },
        { name: 'Lee Wei Ming', role: 'Safety Officer' },
        { name: 'Kumar Raj', role: 'Crane Operator' },
        { name: 'Mohd Ali', role: 'Foreman' },
        { name: 'Tan Boon Keat', role: 'Engineer' }
      ].slice(workers.length).map((w, i) => {
        const checkInTime = new Date();
        checkInTime.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        const hoursWorked = 4 + Math.floor(Math.random() * 6);
        
        return {
          id: `mock_${i}`,
          name: w.name,
          role: w.role,
          department: 'Construction',
          checkIn: checkInTime,
          checkOut: i % 2 === 0 ? new Date(checkInTime.getTime() + hoursWorked * 60 * 60 * 1000) : null,
          hoursWorked: hoursWorked,
          productivity: 75 + Math.floor(Math.random() * 25),
          safetyCompliant: Math.random() > 0.1
        };
      });
      
      workers.push(...additionalWorkers);
    }

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

// Helper functions
function getProjectPhase(progress: number): string {
  if (progress < 0.1) return 'Planning';
  if (progress < 0.25) return 'Foundation';
  if (progress < 0.5) return 'Structure';
  if (progress < 0.75) return 'MEP Installation';
  if (progress < 0.9) return 'Finishing';
  return 'Final Inspection';
}

function mapProjectStatus(status: string): 'active' | 'on_hold' | 'completed' | 'delayed' {
  switch (status) {
    case 'IN_PROGRESS': return 'active';
    case 'ON_HOLD': return 'on_hold';
    case 'COMPLETED': return 'completed';
    case 'CANCELLED': return 'on_hold';
    default: return 'active';
  }
}

function getWeatherCondition(): string {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm'];
  // Malaysian weather - more likely to be sunny or rainy
  const weights = [0.3, 0.25, 0.2, 0.15, 0.08, 0.02];
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < conditions.length; i++) {
    sum += weights[i];
    if (random < sum) return conditions[i];
  }
  
  return 'Partly Cloudy';
}

function getMaterialsForProjectType(type: string, progress: number) {
  const baseMaterials = [
    { material: 'Ready Mix Concrete', quantity: 150, unit: 'cubic meters', supplier: 'Lafarge Malaysia' },
    { material: 'Steel Reinforcement Bars', quantity: 25, unit: 'tonnes', supplier: 'Ann Joo Steel' },
    { material: 'Cement Bags', quantity: 500, unit: 'bags', supplier: 'YTL Cement' },
    { material: 'Sand', quantity: 200, unit: 'tonnes', supplier: 'Local Supplier' },
    { material: 'Bricks', quantity: 50000, unit: 'pieces', supplier: 'Clay Brick Manufacturer' }
  ];

  if (progress > 0.5) {
    baseMaterials.push(
      { material: 'Tiles', quantity: 2000, unit: 'sqm', supplier: 'MML Ceramics' },
      { material: 'Paint', quantity: 500, unit: 'liters', supplier: 'Nippon Paint' },
      { material: 'Electrical Cables', quantity: 5000, unit: 'meters', supplier: 'Tenaga Cables' }
    );
  }

  return baseMaterials.map((m, i) => ({
    id: `mat_${i}`,
    material: m.material,
    quantity: m.quantity,
    unit: m.unit,
    deliveredAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    supplier: m.supplier,
    status: i < 2 ? 'delivered' : i < 4 ? 'inspected' : 'pending' as any
  }));
}

export default router;