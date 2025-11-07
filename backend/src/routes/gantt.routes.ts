import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, addDays } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get Gantt data for a project
router.get('/projects/:projectId/gantt', 
  param('projectId').isUUID(),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const { includeBaseline } = req.query;

      // Get project with tasks
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            include: {
              assignedTo: true,
              dependencies: true,
              subtasks: true
            }
          },
          team: {
            include: {
              user: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Transform to Gantt format
      const ganttTasks = project.tasks.map(task => ({
        id: task.id,
        name: task.title,
        startDate: task.startDate || project.startDate,
        endDate: task.dueDate || task.endDate || project.endDate,
        duration: differenceInDays(
          task.dueDate || task.endDate || project.endDate,
          task.startDate || project.startDate
        ),
        percentComplete: calculateProgress(task.status),
        dependencies: task.dependencies || [],
        resources: task.assignedTo ? [task.assignedTo.id] : [],
        isCritical: task.priority === 'urgent' || task.priority === 'high',
        parentId: task.parentTaskId,
        level: task.parentTaskId ? 1 : 0,
        status: task.status
      }));

      // Calculate critical path
      const criticalPath = calculateCriticalPath(ganttTasks);

      res.json({
        project: {
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.endDate,
          status: project.status
        },
        tasks: ganttTasks,
        criticalPath,
        resources: project.team.map(member => ({
          id: member.user.id,
          name: member.user.name,
          role: member.role,
          availability: 100
        }))
      });
    } catch (error: any) {
      console.error('Gantt fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch Gantt data' });
    }
  }
);

// Save/Update Gantt task
router.post('/projects/:projectId/gantt/tasks',
  authenticate,
  param('projectId').isUUID(),
  body('name').notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const taskData = req.body;

      // Create or update task
      const task = await prisma.task.create({
        data: {
          projectId,
          title: taskData.name,
          description: taskData.description || '',
          startDate: new Date(taskData.startDate),
          dueDate: new Date(taskData.endDate),
          endDate: new Date(taskData.endDate),
          status: taskData.status || 'pending',
          priority: taskData.isCritical ? 'high' : 'medium',
          assignedToId: taskData.resources?.[0] || null,
          parentTaskId: taskData.parentId || null,
          createdById: req.user.id,
          metadata: {
            ganttData: {
              percentComplete: taskData.percentComplete || 0,
              dependencies: taskData.dependencies || [],
              totalFloat: taskData.totalFloat || 0,
              isCritical: taskData.isCritical || false
            }
          }
        }
      });

      res.json({ success: true, task });
    } catch (error: any) {
      console.error('Task creation error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Update task dependencies
router.put('/projects/:projectId/tasks/:taskId/dependencies',
  authenticate,
  param('projectId').isUUID(),
  param('taskId').isUUID(),
  body('dependencies').isArray(),
  validate,
  async (req: any, res: any) => {
    try {
      const { taskId } = req.params;
      const { dependencies } = req.body;

      // Update task with dependencies
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          dependencies: dependencies,
          metadata: {
            ...(await prisma.task.findUnique({ where: { id: taskId } }))?.metadata as any,
            dependencies
          }
        }
      });

      // Recalculate critical path for project
      const projectTasks = await prisma.task.findMany({
        where: { projectId: task.projectId }
      });

      const criticalPath = calculateCriticalPath(projectTasks as any);

      res.json({ 
        success: true, 
        task,
        criticalPath 
      });
    } catch (error: any) {
      console.error('Dependency update error:', error);
      res.status(500).json({ error: 'Failed to update dependencies' });
    }
  }
);

// Create project baseline
router.post('/projects/:projectId/baselines',
  authenticate,
  param('projectId').isUUID(),
  body('name').notEmpty(),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;

      // Get current project state
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { tasks: true }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Create baseline snapshot
      const baseline = await prisma.projectBaseline.create({
        data: {
          projectId,
          name,
          description,
          baselineDate: new Date(),
          projectSnapshot: {
            startDate: project.startDate,
            endDate: project.endDate,
            budget: project.budget,
            tasks: project.tasks.map(task => ({
              id: task.id,
              title: task.title,
              startDate: task.startDate,
              dueDate: task.dueDate,
              status: task.status
            }))
          },
          createdById: req.user.id
        }
      });

      res.json({ success: true, baseline });
    } catch (error: any) {
      console.error('Baseline creation error:', error);
      res.status(500).json({ error: 'Failed to create baseline' });
    }
  }
);

// Get project critical path
router.get('/projects/:projectId/critical-path',
  authenticate,
  param('projectId').isUUID(),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignedTo: true
        }
      });

      const criticalPath = calculateCriticalPath(tasks as any);
      const projectDuration = calculateProjectDuration(tasks as any);

      res.json({
        criticalPath,
        projectDuration,
        criticalTasks: criticalPath.length,
        totalTasks: tasks.length
      });
    } catch (error: any) {
      console.error('Critical path error:', error);
      res.status(500).json({ error: 'Failed to calculate critical path' });
    }
  }
);

// Resource assignment
router.post('/projects/:projectId/resources',
  authenticate,
  param('projectId').isUUID(),
  body('taskId').isUUID(),
  body('userId').isUUID(),
  body('allocation').isInt({ min: 0, max: 100 }),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const { taskId, userId, allocation, startDate, endDate } = req.body;

      // Check resource availability
      const conflicts = await checkResourceConflicts(userId, startDate, endDate, allocation);
      
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'Resource conflict detected',
          conflicts 
        });
      }

      // Assign resource to task
      const assignment = await prisma.task.update({
        where: { id: taskId },
        data: {
          assignedToId: userId,
          metadata: {
            ...(await prisma.task.findUnique({ where: { id: taskId } }))?.metadata as any,
            resourceAllocation: allocation
          }
        }
      });

      res.json({ success: true, assignment });
    } catch (error: any) {
      console.error('Resource assignment error:', error);
      res.status(500).json({ error: 'Failed to assign resource' });
    }
  }
);

// Resource leveling
router.post('/projects/:projectId/level-resources',
  authenticate,
  param('projectId').isUUID(),
  validate,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      const { strategy = 'automatic' } = req.body;

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: { assignedTo: true }
      });

      // Perform resource leveling
      const leveledSchedule = await performResourceLeveling(tasks, strategy);

      // Update tasks with new dates
      for (const task of leveledSchedule) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            startDate: task.startDate,
            dueDate: task.endDate
          }
        });
      }

      res.json({ 
        success: true, 
        leveledSchedule,
        adjustedTasks: leveledSchedule.length 
      });
    } catch (error: any) {
      console.error('Resource leveling error:', error);
      res.status(500).json({ error: 'Failed to level resources' });
    }
  }
);

// Helper functions

function calculateProgress(status: string): number {
  const statusProgress: any = {
    'completed': 100,
    'in_progress': 50,
    'in-progress': 50,
    'review': 75,
    'testing': 80,
    'pending': 0,
    'todo': 0,
    'blocked': 25
  };
  return statusProgress[status] || 0;
}

function calculateCriticalPath(tasks: any[]): string[] {
  if (!tasks || tasks.length === 0) return [];

  // Build adjacency list
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const adjList = new Map<string, string[]>();
  
  tasks.forEach(task => {
    if (!adjList.has(task.id)) {
      adjList.set(task.id, []);
    }
    if (task.dependencies) {
      task.dependencies.forEach((dep: any) => {
        const depId = typeof dep === 'string' ? dep : dep.predecessorId;
        if (!adjList.has(depId)) {
          adjList.set(depId, []);
        }
        adjList.get(depId)!.push(task.id);
      });
    }
  });

  // Calculate early start and early finish
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();
  
  // Topological sort
  const visited = new Set<string>();
  const stack: string[] = [];
  
  function dfs(taskId: string) {
    visited.add(taskId);
    const neighbors = adjList.get(taskId) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    });
    stack.push(taskId);
  }
  
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  });
  
  // Calculate forward pass
  while (stack.length > 0) {
    const taskId = stack.pop()!;
    const task = taskMap.get(taskId);
    if (!task) continue;
    
    const dependencies = task.dependencies || [];
    let maxEarlyFinish = 0;
    
    dependencies.forEach((dep: any) => {
      const depId = typeof dep === 'string' ? dep : dep.predecessorId;
      const depFinish = earlyFinish.get(depId) || 0;
      maxEarlyFinish = Math.max(maxEarlyFinish, depFinish);
    });
    
    earlyStart.set(taskId, maxEarlyFinish);
    earlyFinish.set(taskId, maxEarlyFinish + (task.duration || 1));
  }
  
  // Find critical path (tasks with zero float)
  const criticalPath: string[] = [];
  const projectEnd = Math.max(...Array.from(earlyFinish.values()));
  
  tasks.forEach(task => {
    const taskEarlyFinish = earlyFinish.get(task.id) || 0;
    const totalFloat = projectEnd - taskEarlyFinish;
    
    if (totalFloat === 0 || task.isCritical) {
      criticalPath.push(task.id);
    }
  });
  
  return criticalPath;
}

function calculateProjectDuration(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;
  
  let minDate = new Date(tasks[0].startDate);
  let maxDate = new Date(tasks[0].dueDate || tasks[0].endDate);
  
  tasks.forEach(task => {
    const start = new Date(task.startDate);
    const end = new Date(task.dueDate || task.endDate);
    
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  });
  
  return differenceInDays(maxDate, minDate);
}

async function checkResourceConflicts(
  userId: string, 
  startDate: Date, 
  endDate: Date, 
  allocation: number
): Promise<any[]> {
  const existingTasks = await prisma.task.findMany({
    where: {
      assignedToId: userId,
      AND: [
        { startDate: { lte: endDate } },
        { dueDate: { gte: startDate } }
      ]
    }
  });

  const conflicts = [];
  let totalAllocation = allocation;

  for (const task of existingTasks) {
    const taskAllocation = (task.metadata as any)?.resourceAllocation || 100;
    totalAllocation += taskAllocation;
    
    if (totalAllocation > 100) {
      conflicts.push({
        taskId: task.id,
        taskTitle: task.title,
        allocation: taskAllocation,
        dates: `${task.startDate} - ${task.dueDate}`
      });
    }
  }

  return conflicts;
}

async function performResourceLeveling(tasks: any[], strategy: string): Promise<any[]> {
  // Simple resource leveling algorithm
  const leveledTasks = [...tasks];
  
  // Sort by priority and dependencies
  leveledTasks.sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
    return 0;
  });

  // Check for resource conflicts and adjust dates
  const resourceSchedule = new Map<string, any[]>();
  
  for (const task of leveledTasks) {
    if (!task.assignedToId) continue;
    
    if (!resourceSchedule.has(task.assignedToId)) {
      resourceSchedule.set(task.assignedToId, []);
    }
    
    const userSchedule = resourceSchedule.get(task.assignedToId)!;
    
    // Find conflicts
    const conflicts = userSchedule.filter(t => 
      (task.startDate >= t.startDate && task.startDate <= t.endDate) ||
      (task.endDate >= t.startDate && task.endDate <= t.endDate)
    );
    
    if (conflicts.length > 0 && strategy === 'automatic') {
      // Push task to after conflicts
      const lastConflict = conflicts[conflicts.length - 1];
      const duration = differenceInDays(task.endDate, task.startDate);
      task.startDate = addDays(lastConflict.endDate, 1);
      task.endDate = addDays(task.startDate, duration);
    }
    
    userSchedule.push({
      taskId: task.id,
      startDate: task.startDate,
      endDate: task.endDate
    });
  }
  
  return leveledTasks;
}

export default router;