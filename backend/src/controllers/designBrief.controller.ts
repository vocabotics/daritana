import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import DesignBrief from '../models/DesignBrief';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import sequelize from '../database/connection';

// Helper function to generate tasks based on design brief
const generateTasksFromBrief = (brief: any): Array<any> => {
  const tasks = [];
  const baseTaskTemplates = {
    'concept_design': {
      name: 'Concept Design Development',
      estimated_duration: 7,
      dependencies: [],
      assigned_role: 'designer',
      priority: 'high',
    },
    'space_planning': {
      name: 'Space Planning & Layout',
      estimated_duration: 5,
      dependencies: ['concept_design'],
      assigned_role: 'architect',
      priority: 'high',
    },
    'cultural_consultation': {
      name: 'Cultural Design Consultation',
      estimated_duration: 3,
      dependencies: ['concept_design'],
      assigned_role: 'designer',
      priority: 'medium',
    },
    'material_selection': {
      name: 'Material Selection & Sourcing',
      estimated_duration: 4,
      dependencies: ['space_planning'],
      assigned_role: 'designer',
      priority: 'medium',
    },
    'climate_analysis': {
      name: 'Climate Response Analysis',
      estimated_duration: 2,
      dependencies: ['space_planning'],
      assigned_role: 'architect',
      priority: 'medium',
    },
    '3d_visualization': {
      name: '3D Visualization & Rendering',
      estimated_duration: 6,
      dependencies: ['material_selection'],
      assigned_role: 'designer',
      priority: 'low',
    },
    'technical_drawings': {
      name: 'Technical Drawings & Documentation',
      estimated_duration: 8,
      dependencies: ['space_planning', 'material_selection'],
      assigned_role: 'architect',
      priority: 'high',
    },
  };

  // Add cultural-specific tasks
  if (brief.cultural_preferences) {
    if (brief.cultural_preferences.feng_shui_required) {
      tasks.push({
        ...baseTaskTemplates.cultural_consultation,
        name: 'Feng Shui Consultation & Layout Adjustment',
        estimated_duration: 2,
      });
    }
    
    if (brief.cultural_preferences.vastu_compliance) {
      tasks.push({
        ...baseTaskTemplates.cultural_consultation,
        name: 'Vastu Shastra Compliance Review',
        estimated_duration: 2,
      });
    }
  }

  // Add climate-specific tasks
  if (brief.climate_features) {
    tasks.push(baseTaskTemplates.climate_analysis);
    
    if (brief.climate_features.sun_shading_required) {
      tasks.push({
        name: 'Solar Shading Design',
        estimated_duration: 3,
        dependencies: ['climate_analysis'],
        assigned_role: 'architect',
        priority: 'high',
      });
    }
  }

  // Add room-specific tasks
  brief.rooms_requirements?.forEach((room: any) => {
    if (room.priority_level === 'high') {
      tasks.push({
        name: `${room.room_type} Detailed Design`,
        estimated_duration: 3,
        dependencies: ['space_planning'],
        assigned_role: 'designer',
        priority: 'high',
      });
    }
  });

  // Add standard tasks
  Object.values(baseTaskTemplates).forEach(template => {
    if (!tasks.some(task => task.name === template.name)) {
      tasks.push(template);
    }
  });

  return tasks;
};

// Helper function to calculate resource allocation
const calculateResourceAllocation = (brief: any, generatedTasks: any[]): any => {
  const roleHours: Record<string, number> = {};
  
  generatedTasks.forEach(task => {
    const role = task.assigned_role;
    roleHours[role] = (roleHours[role] || 0) + (task.estimated_duration * 8); // 8 hours per day
  });

  const materialQuantities: Record<string, number> = {};
  if (brief.material_preferences?.budget_allocation) {
    Object.entries(brief.material_preferences.budget_allocation).forEach(([material, percentage]) => {
      materialQuantities[material] = (brief.budget * (percentage as number / 100));
    });
  }

  return {
    required_roles: Object.keys(roleHours),
    estimated_hours_per_role: roleHours,
    material_quantities: materialQuantities,
  };
};

export const createDesignBrief = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      project_id,
      client_id,
      brief_name,
      project_type,
      requirements,
      budget,
      target_completion_date,
      pinterest_board,
      project_location,
      cultural_preferences,
      climate_features,
      rooms_requirements,
      material_preferences,
      timeline_preferences,
    } = req.body;

    // Generate tasks and resource allocation
    const generatedTasks = generateTasksFromBrief(req.body);
    const resourceAllocation = calculateResourceAllocation(req.body, generatedTasks);
    
    // Calculate estimated timeline
    const estimatedTimeline = generatedTasks.reduce((total, task) => {
      return Math.max(total, task.estimated_duration + (task.dependencies?.length || 0) * 2);
    }, 0);

    const designBrief = await DesignBrief.create({
      project_id,
      client_id,
      brief_name,
      project_type,
      requirements,
      budget,
      target_completion_date,
      pinterest_board,
      project_location,
      cultural_preferences,
      climate_features,
      rooms_requirements: rooms_requirements || [],
      material_preferences,
      timeline_preferences,
      generated_tasks: generatedTasks,
      resource_allocation: resourceAllocation,
      estimated_timeline: estimatedTimeline,
      submitted_by: (req as any).user.id,
      status: 'draft',
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: designBrief,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getDesignBriefs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { project_id, status, client_id } = req.query;
    
    const whereClause: any = {};
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (client_id) whereClause.client_id = client_id;

    const designBriefs = await DesignBrief.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectCode'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: designBriefs,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignBriefById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const designBrief = await DesignBrief.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'submittedBy',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'reviewedBy',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Project,
          as: 'project',
        },
      ],
    });

    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    res.json({
      success: true,
      data: designBrief,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDesignBrief = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const designBrief = await DesignBrief.findByPk(id);
    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    // Regenerate tasks and resource allocation if relevant fields are updated
    if (updates.cultural_preferences || updates.climate_features || updates.rooms_requirements || updates.budget) {
      const briefData = { ...designBrief.toJSON(), ...updates };
      updates.generated_tasks = generateTasksFromBrief(briefData);
      updates.resource_allocation = calculateResourceAllocation(briefData, updates.generated_tasks);
      
      // Recalculate estimated timeline
      updates.estimated_timeline = updates.generated_tasks.reduce((total: number, task: any) => {
        return Math.max(total, task.estimated_duration + (task.dependencies?.length || 0) * 2);
      }, 0);
    }

    await designBrief.update(updates);

    res.json({
      success: true,
      data: designBrief,
    });
  } catch (error) {
    next(error);
  }
};

export const submitDesignBrief = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const designBrief = await DesignBrief.findByPk(id);
    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    await designBrief.update({
      status: 'submitted',
      submitted_at: new Date(),
    });

    res.json({
      success: true,
      message: 'Design brief submitted for review',
      data: designBrief,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDesignBrief = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject' | 'request_revision'

    const designBrief = await DesignBrief.findByPk(id);
    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    const updates: any = {
      reviewed_by: (req as any).user.id,
      reviewed_at: new Date(),
    };

    switch (action) {
      case 'approve':
        updates.status = 'approved';
        updates.approved_by = (req as any).user.id;
        updates.approved_at = new Date();
        break;
      case 'reject':
        updates.status = 'rejected';
        updates.rejection_reason = notes;
        break;
      case 'request_revision':
        updates.status = 'revision_needed';
        updates.revision_notes = notes;
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action',
        });
        return;
    }

    await designBrief.update(updates);

    res.json({
      success: true,
      message: `Design brief ${action}d successfully`,
      data: designBrief,
    });
  } catch (error) {
    next(error);
  }
};

export const convertBriefToTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const designBrief = await DesignBrief.findByPk(id);
    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    if (designBrief.status !== 'approved') {
      res.status(400).json({
        success: false,
        error: 'Design brief must be approved before converting to tasks',
      });
      return;
    }

    // Create tasks from generated_tasks
    const createdTasks = [];
    if (designBrief.generated_tasks) {
      for (const taskTemplate of designBrief.generated_tasks) {
        const task = await Task.create({
          projectId: designBrief.project_id,
          title: taskTemplate.task_name,
          description: `Generated from design brief: ${designBrief.brief_name}`,
          status: 'open',
          priority: taskTemplate.priority,
          estimatedHours: taskTemplate.estimated_duration * 8, // Convert days to hours
          assigneeId: null, // Will be assigned based on role
          reporterId: (req as any).user.id,
          dueDate: new Date(Date.now() + taskTemplate.estimated_duration * 24 * 60 * 60 * 1000),
          tags: ['design-brief', taskTemplate.assigned_role],
        }, { transaction });

        createdTasks.push(task);
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Created ${createdTasks.length} tasks from design brief`,
      data: {
        tasks: createdTasks,
        designBrief,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const deleteDesignBrief = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const designBrief = await DesignBrief.findByPk(id);
    if (!designBrief) {
      res.status(404).json({
        success: false,
        error: 'Design brief not found',
      });
      return;
    }

    // Only allow deletion of draft briefs
    if (designBrief.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Only draft design briefs can be deleted',
      });
      return;
    }

    await designBrief.destroy();

    res.json({
      success: true,
      message: 'Design brief deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};