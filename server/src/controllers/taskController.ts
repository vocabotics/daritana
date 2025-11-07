import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction, buildUpdateQuery } from '../database/connection';
import { Task, TaskStatus, TaskPriority } from '../types';
import { createAuditLog } from '../services/auditService';
import { sendNotification } from '../services/notificationService';

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { project_id, status, priority, assignee, search } = req.query;

    // Build filter conditions
    let filterConditions = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (project_id) {
      paramCount++;
      filterConditions += ` AND t.project_id = $${paramCount}`;
      params.push(project_id);
    }

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

    if (search) {
      paramCount++;
      filterConditions += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get tasks with related data
    const tasksQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.status as project_status,
        array_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'avatar_url', u.avatar_url,
          'email', u.email
        )) FILTER (WHERE u.id IS NOT NULL) as assignees,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'done') as completed_subtasks
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN tasks st ON t.id = st.parent_task_id
      ${filterConditions}
      ${assignee ? `AND EXISTS (SELECT 1 FROM task_assignments WHERE task_id = t.id AND user_id = $${++paramCount})` : ''}
      GROUP BY t.id, p.name, p.status
      ORDER BY t.order_index, t.created_at DESC
    `;

    if (assignee) {
      params.push(assignee);
    }

    const result = await query(tasksQuery, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tasks'
    });
  }
};

// Get single task
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const taskQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.organization_id,
        pt.title as parent_task_title,
        array_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'avatar_url', u.avatar_url,
          'email', u.email
        )) FILTER (WHERE u.id IS NOT NULL) as assignees,
        array_agg(DISTINCT jsonb_build_object(
          'id', st.id,
          'title', st.title,
          'status', st.status,
          'priority', st.priority
        )) FILTER (WHERE st.id IS NOT NULL) as subtasks,
        array_agg(DISTINCT jsonb_build_object(
          'id', td.depends_on_task_id,
          'title', dt.title,
          'status', dt.status,
          'dependency_type', td.dependency_type
        )) FILTER (WHERE td.depends_on_task_id IS NOT NULL) as dependencies
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN tasks st ON t.id = st.parent_task_id
      LEFT JOIN task_dependencies td ON t.id = td.task_id
      LEFT JOIN tasks dt ON td.depends_on_task_id = dt.id
      WHERE t.id = $1
      GROUP BY t.id, p.name, p.organization_id, pt.title
    `;

    const result = await query(taskQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found'
      });
    }

    const task = result.rows[0];

    // Get task comments
    const commentsQuery = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entity_type = 'task' AND c.entity_id = $1
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    const commentsResult = await query(commentsQuery, [id]);
    task.recent_comments = commentsResult.rows;

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch task'
    });
  }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { assignees, ...taskData } = req.body;

    // Verify project exists
    const projectResult = await query(
      'SELECT id, organization_id FROM projects WHERE id = $1',
      [taskData.project_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    const organization_id = projectResult.rows[0].organization_id;

    // Start transaction
    const result = await transaction(async (client) => {
      // Get next order index if not provided
      if (taskData.order_index === undefined) {
        const maxOrderResult = await client.query(
          'SELECT COALESCE(MAX(order_index), -1) + 1 as next_index FROM tasks WHERE project_id = $1',
          [taskData.project_id]
        );
        taskData.order_index = maxOrderResult.rows[0].next_index;
      }

      // Create task
      const columns = Object.keys({ ...taskData, created_by: req.user?.id }).join(', ');
      const placeholders = Object.keys({ ...taskData, created_by: req.user?.id })
        .map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values({ ...taskData, created_by: req.user?.id });

      const taskResult = await client.query(
        `INSERT INTO tasks (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      const task = taskResult.rows[0];

      // Add assignees
      if (assignees && assignees.length > 0) {
        for (const userId of assignees) {
          await client.query(
            `INSERT INTO task_assignments (task_id, user_id, assigned_by)
             VALUES ($1, $2, $3)`,
            [task.id, userId, req.user?.id]
          );
        }
      }

      return task;
    });

    // Send notifications to assignees
    if (assignees && assignees.length > 0) {
      for (const userId of assignees) {
        await sendNotification({
          user_id: userId,
          type: 'task',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${result.title}`,
          entity_type: 'task',
          entity_id: result.id,
          action_url: `/tasks/${result.id}`
        });
      }
    }

    // Create audit log
    await createAuditLog({
      organization_id,
      user_id: req.user?.id,
      action: 'task.create',
      entity_type: 'task',
      entity_id: result.id,
      new_values: result
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create task'
    });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignees, ...updateData } = req.body;

    // Get existing task
    const existingTask = await query(
      `SELECT t.*, p.organization_id 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1`,
      [id]
    );

    if (existingTask.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found'
      });
    }

    const oldTask = existingTask.rows[0];
    const organization_id = oldTask.organization_id;

    // Start transaction
    const result = await transaction(async (client) => {
      // Update task
      if (Object.keys(updateData).length > 0) {
        const { text, values } = buildUpdateQuery('tasks', id, updateData);
        const updateResult = await client.query(text, values);
        
        if (updateResult.rows.length === 0) {
          throw new Error('Failed to update task');
        }
      }

      // Update assignees if provided
      if (assignees !== undefined) {
        // Remove existing assignees
        await client.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);

        // Add new assignees
        if (assignees.length > 0) {
          for (const userId of assignees) {
            await client.query(
              `INSERT INTO task_assignments (task_id, user_id, assigned_by)
               VALUES ($1, $2, $3)`,
              [id, userId, req.user?.id]
            );
          }
        }
      }

      // Get updated task
      const updatedTaskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      );

      return updatedTaskResult.rows[0];
    });

    // Send notifications for status changes
    if (oldTask.status !== result.status) {
      // Get assignees
      const assigneesResult = await query(
        'SELECT user_id FROM task_assignments WHERE task_id = $1',
        [id]
      );

      for (const row of assigneesResult.rows) {
        await sendNotification({
          user_id: row.user_id,
          type: 'task',
          title: 'Task Status Updated',
          message: `Task "${result.title}" status changed from ${oldTask.status} to ${result.status}`,
          entity_type: 'task',
          entity_id: id,
          action_url: `/tasks/${id}`
        });
      }
    }

    // Create audit log
    await createAuditLog({
      organization_id,
      user_id: req.user?.id,
      action: 'task.update',
      entity_type: 'task',
      entity_id: id,
      old_values: oldTask,
      new_values: result
    });

    res.json(result);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update task'
    });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get task details for audit log
    const existingTask = await query(
      `SELECT t.*, p.organization_id 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1`,
      [id]
    );

    if (existingTask.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found'
      });
    }

    const task = existingTask.rows[0];

    // Delete task (cascades to related tables)
    await query('DELETE FROM tasks WHERE id = $1', [id]);

    // Create audit log
    await createAuditLog({
      organization_id: task.organization_id,
      user_id: req.user?.id,
      action: 'task.delete',
      entity_type: 'task',
      entity_id: id,
      old_values: task
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete task'
    });
  }
};

// Move task (for kanban board)
export const moveTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { column_id, order_index, status } = req.body;

    // Update task position
    const result = await query(
      `UPDATE tasks 
       SET column_id = $1, order_index = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [column_id, order_index, status || 'todo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to move task'
    });
  }
};

// Bulk update tasks
export const bulkUpdateTasks = async (req: Request, res: Response) => {
  try {
    const { task_ids, updates } = req.body;

    if (!task_ids || task_ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No tasks specified'
      });
    }

    // Build update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [task_ids, ...Object.values(updates)];

    const result = await query(
      `UPDATE tasks 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1::uuid[])
       RETURNING *`,
      values
    );

    res.json({
      updated: result.rows.length,
      tasks: result.rows
    });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update tasks'
    });
  }
};

// Add task comment
export const addTaskComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, mentions } = req.body;

    // Verify task exists
    const taskResult = await query('SELECT title FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found'
      });
    }

    // Create comment
    const result = await query(
      `INSERT INTO comments (entity_type, entity_id, user_id, content, mentions)
       VALUES ('task', $1, $2, $3, $4)
       RETURNING *`,
      [id, req.user?.id, content, mentions || []]
    );

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      for (const userId of mentions) {
        await sendNotification({
          user_id: userId,
          type: 'task',
          title: 'You were mentioned in a comment',
          message: `${req.user?.first_name} mentioned you in a comment on task: ${taskResult.rows[0].title}`,
          entity_type: 'task',
          entity_id: id,
          action_url: `/tasks/${id}`
        });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add comment'
    });
  }
};

// Get task comments
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const commentsQuery = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entity_type = 'task' AND c.entity_id = $1 AND c.is_deleted = false
      ORDER BY c.created_at DESC
    `;

    const result = await query(commentsQuery, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch comments'
    });
  }
};