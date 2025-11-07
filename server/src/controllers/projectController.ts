import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction, buildUpdateQuery, paginate } from '../database/connection';
import { Project, ProjectStatus, Task, TaskStatus } from '../types';
import { createAuditLog } from '../services/auditService';

// Get all projects for organization
export const getProjects = async (req: Request, res: Response) => {
  try {
    if (!req.organization_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Organization context required'
      });
    }

    // Parse query parameters
    const { page, limit, status, search, sort_by, order } = req.query;
    const pagination = paginate({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      orderBy: sort_by as string || 'created_at',
      order: (order as 'ASC' | 'DESC') || 'DESC'
    });

    // Build filter conditions
    let filterConditions = 'WHERE p.organization_id = $1';
    const params: any[] = [req.organization_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      filterConditions += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      filterConditions += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      ${filterConditions}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get projects with related data
    const projectsQuery = `
      SELECT 
        p.*,
        u1.first_name as client_first_name,
        u1.last_name as client_last_name,
        u2.first_name as lead_first_name,
        u2.last_name as lead_last_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
        COUNT(DISTINCT pm.user_id) as member_count
      FROM projects p
      LEFT JOIN users u1 ON p.client_id = u1.id
      LEFT JOIN users u2 ON p.project_lead_id = u2.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      ${filterConditions}
      GROUP BY p.id, u1.first_name, u1.last_name, u2.first_name, u2.last_name
      ${pagination.orderClause}
      ${pagination.limitClause}
    `;

    const projectsResult = await query(projectsQuery, params);

    // Calculate pagination metadata
    const total_pages = Math.ceil(total / pagination.limit);
    const current_page = Math.floor(pagination.offset / pagination.limit) + 1;

    res.json({
      data: projectsResult.rows,
      total,
      page: current_page,
      limit: pagination.limit,
      total_pages,
      has_next: current_page < total_pages,
      has_prev: current_page > 1
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch projects'
    });
  }
};

// Get single project by ID
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const projectQuery = `
      SELECT 
        p.*,
        u1.first_name as client_first_name,
        u1.last_name as client_last_name,
        u1.email as client_email,
        u2.first_name as lead_first_name,
        u2.last_name as lead_last_name,
        u2.email as lead_email,
        array_agg(DISTINCT jsonb_build_object(
          'id', pm.user_id,
          'role', pm.role,
          'joined_at', pm.joined_at
        )) FILTER (WHERE pm.user_id IS NOT NULL) as members
      FROM projects p
      LEFT JOIN users u1 ON p.client_id = u1.id
      LEFT JOIN users u2 ON p.project_lead_id = u2.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1 AND p.organization_id = $2
      GROUP BY p.id, u1.first_name, u1.last_name, u1.email, 
               u2.first_name, u2.last_name, u2.email
    `;

    const projectResult = await query(projectQuery, [id, req.organization_id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get project statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT m.id) FILTER (WHERE m.is_completed = true) as completed_milestones,
        COUNT(DISTINCT f.id) as total_files,
        SUM(f.size) as total_storage_used
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_milestones m ON p.id = m.project_id
      LEFT JOIN files f ON p.id = f.project_id
      WHERE p.id = $1
    `;

    const statsResult = await query(statsQuery, [id]);
    project.statistics = statsResult.rows[0];

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch project'
    });
  }
};

// Create new project
export const createProject = async (req: Request, res: Response) => {
  try {
    if (!req.organization_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Organization context required'
      });
    }

    const projectData = {
      ...req.body,
      organization_id: req.organization_id,
      created_by: req.user?.id
    };

    // Start transaction
    const result = await transaction(async (client) => {
      // Create project
      const columns = Object.keys(projectData).join(', ');
      const placeholders = Object.keys(projectData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(projectData);

      const projectResult = await client.query(
        `INSERT INTO projects (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      const project = projectResult.rows[0];

      // Add creator as project member
      if (req.user) {
        await client.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)`,
          [project.id, req.user.id, 'owner']
        );
      }

      // Add project lead as member if specified
      if (project.project_lead_id && project.project_lead_id !== req.user?.id) {
        await client.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [project.id, project.project_lead_id, 'lead']
        );
      }

      // Add client as member if specified
      if (project.client_id && project.client_id !== req.user?.id) {
        await client.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [project.id, project.client_id, 'client']
        );
      }

      // Create default milestones if it's not a template
      if (!project.is_template) {
        const defaultMilestones = [
          { name: 'Project Kickoff', order_index: 1 },
          { name: 'Design Phase', order_index: 2 },
          { name: 'Development Phase', order_index: 3 },
          { name: 'Testing & Review', order_index: 4 },
          { name: 'Project Completion', order_index: 5 }
        ];

        for (const milestone of defaultMilestones) {
          await client.query(
            `INSERT INTO project_milestones (project_id, name, order_index)
             VALUES ($1, $2, $3)`,
            [project.id, milestone.name, milestone.order_index]
          );
        }
      }

      return project;
    });

    // Create audit log
    await createAuditLog({
      organization_id: req.organization_id,
      user_id: req.user?.id,
      action: 'project.create',
      entity_type: 'project',
      entity_id: result.id,
      new_values: result
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create project'
    });
  }
};

// Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to organization
    const existingProject = await query(
      'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
      [id, req.organization_id]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    const oldValues = existingProject.rows[0];

    // Build update query
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.organization_id;
    delete updateData.created_at;
    delete updateData.created_by;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    const { text, values } = buildUpdateQuery('projects', id, updateData);
    const result = await query(text, values);

    if (result.rows.length === 0) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update project'
      });
    }

    // Create audit log
    await createAuditLog({
      organization_id: req.organization_id,
      user_id: req.user?.id,
      action: 'project.update',
      entity_type: 'project',
      entity_id: id,
      old_values: oldValues,
      new_values: result.rows[0]
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update project'
    });
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProject = await query(
      'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
      [id, req.organization_id]
    );

    if (existingProject.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // Delete project (cascades to related tables)
    await query('DELETE FROM projects WHERE id = $1', [id]);

    // Create audit log
    await createAuditLog({
      organization_id: req.organization_id,
      user_id: req.user?.id,
      action: 'project.delete',
      entity_type: 'project',
      entity_id: id,
      old_values: existingProject.rows[0]
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete project'
    });
  }
};

// Get project tasks
export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignee, priority } = req.query;

    // Build filter conditions
    let filterConditions = 'WHERE t.project_id = $1';
    const params: any[] = [id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      filterConditions += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      filterConditions += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }

    // Get tasks with assignees
    const tasksQuery = `
      SELECT 
        t.*,
        array_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'avatar_url', u.avatar_url
        )) FILTER (WHERE u.id IS NOT NULL) as assignees
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      ${filterConditions}
      ${assignee ? `AND ta.user_id = $${++paramCount}` : ''}
      GROUP BY t.id
      ORDER BY t.order_index, t.created_at DESC
    `;

    if (assignee) {
      params.push(assignee);
    }

    const result = await query(tasksQuery, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch project tasks'
    });
  }
};

// Get project members
export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const membersQuery = `
      SELECT 
        pm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        u.role as user_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at
    `;

    const result = await query(membersQuery, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch project members'
    });
  }
};

// Add project member
export const addProjectMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    // Check if project exists
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
      [id, req.organization_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // Add member
    const result = await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) 
       DO UPDATE SET role = $3
       RETURNING *`,
      [id, user_id, role || 'member']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add project member'
    });
  }
};

// Remove project member
export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove project member'
    });
  }
};

// Get project files
export const getProjectFiles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const filesQuery = `
      SELECT 
        f.*,
        u.first_name as uploader_first_name,
        u.last_name as uploader_last_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.project_id = $1
      ORDER BY f.is_folder DESC, f.name
    `;

    const result = await query(filesQuery, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch project files'
    });
  }
};