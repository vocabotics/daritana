import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { wsServer } from './websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'daritana_dev',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth endpoints
app.post('/api/auth/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token with 7 day expiration for persistence
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role_name,
        organizationId: user.organization_id 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } // Extended to 7 days for better persistence
    );
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    res.json({
      success: true,
      token,
      role: user.role_name, // Add role at top level for frontend
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        organizationId: user.organization_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res): Promise<any> => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Get default organization
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    const orgId = orgResult.rows[0]?.id;
    
    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role || 'client']);
    const roleId = roleResult.rows[0]?.id;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role_id, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true, true)
       RETURNING id`,
      [orgId, email, hashedPassword, firstName, lastName, roleId]
    );
    
    const userId = userResult.rows[0].id;
    
    // Generate token with 7 day expiration for persistence
    const token = jwt.sign(
      { id: userId, email, role: role || 'client', organizationId: orgId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } // Extended to 7 days for better persistence
    );
    
    res.json({
      success: true,
      token,
      user: { id: userId, email, firstName, lastName, role: role || 'client' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/v1/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    const userResult = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.is_active = true`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      success: true,
      role: user.role_name,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        organizationId: user.organization_id,
        avatar: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', authenticateToken, async (req: any, res: any): Promise<any> => {
  try {
    // Generate new token with extended expiration
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role,
        organizationId: req.user.organizationId 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } // 7 days expiration
    );
    
    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Projects endpoints
app.get('/api/v1/projects', async (req, res): Promise<any> => {
  try {
    console.log('Get projects request:', req.query);
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const projectsResult = await pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM projects');
    const total = parseInt(countResult.rows[0].count);
    
    // Transform projects to match frontend expectations
    const transformedProjects = projectsResult.rows.map(project => ({
      ...project,
      type: project.project_type || 'general',
      actualCost: parseFloat(project.spent || '0'),
      startDate: project.start_date,
      endDate: project.end_date,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }));
    
    console.log(`Found ${transformedProjects.length} projects, total: ${total}`);
    
    res.json({
      success: true,
      data: transformedProjects,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/projects/:id', async (req, res): Promise<any> => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Transform the project data to match frontend expectations
    const project = result.rows[0];
    const transformedProject = {
      ...project,
      type: project.project_type || 'general',
      actualCost: parseFloat(project.spent || '0'),
      startDate: project.start_date,
      endDate: project.end_date,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
    
    res.json({
      success: true,
      data: transformedProject,
      project: transformedProject
    });
  } catch (error) {
    console.error('Project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/v1/projects/:id', async (req, res): Promise<any> => {
  try {
    const { 
      name, description, status, budget,
      startDate, endDate 
    } = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (budget !== undefined) {
      updateFields.push(`budget = $${paramCount++}`);
      values.push(budget);
    }
    if (startDate !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      values.push(new Date(startDate));
    }
    if (endDate !== undefined) {
      updateFields.push(`end_date = $${paramCount++}`);
      values.push(new Date(endDate));
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    
    const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = result.rows[0];
    const transformedProject = {
      ...project,
      type: project.project_type || 'general',
      actualCost: parseFloat(project.spent || '0'),
      startDate: project.start_date,
      endDate: project.end_date,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    };
    
    res.json({ 
      success: true,
      data: transformedProject,
      project: transformedProject 
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.delete('/api/v1/projects/:id', async (req, res): Promise<any> => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/projects', async (req, res): Promise<any> => {
  try {
    console.log('Create project request:', req.body);
    const { 
      name, description, type, status, priority, budget,
      startDate, endDate, address, city, state,
      clientEmail, clientName, clientPhone 
    } = req.body;
    
    // Get organization ID (using first org for now)
    const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    const orgId = orgResult.rows[0]?.id;
    
    // Format dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
    
    // Create full address
    const fullAddress = [address, city, state].filter(Boolean).join(', ');
    
    // Build description with additional info
    const fullDescription = [
      description,
      type ? `Type: ${type}` : null,
      priority ? `Priority: ${priority}` : null,
      clientName ? `Client: ${clientName}` : null,
      clientEmail ? `Email: ${clientEmail}` : null,
      clientPhone ? `Phone: ${clientPhone}` : null,
      fullAddress ? `Location: ${fullAddress}` : null
    ].filter(Boolean).join('\n');
    
    const result = await pool.query(
      `INSERT INTO projects (organization_id, name, description, status, budget, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orgId, name, fullDescription, status || 'planning', budget || 0, start, end]
    );
    
    console.log('Project created successfully:', result.rows[0].id);
    res.status(201).json({ 
      success: true,
      data: result.rows[0],
      project: result.rows[0] // Frontend expects this format
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Tasks endpoints
app.get('/api/v1/tasks', async (req, res): Promise<any> => {
  try {
    const { page = 1, limit = 50, projectId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT * FROM tasks';
    let countQuery = 'SELECT COUNT(*) FROM tasks';
    const queryParams: any[] = [];
    const countParams: any[] = [];
    
    if (projectId) {
      query += ' WHERE project_id = $1';
      countQuery += ' WHERE project_id = $1';
      queryParams.push(projectId);
      countParams.push(projectId);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const tasksResult = await pool.query(query, queryParams);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Transform tasks to match frontend format
    const transformedTasks = tasksResult.rows.map(task => ({
      id: task.id,
      projectId: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date,
      dueDate: task.due_date,
      endDate: task.due_date,
      progress: task.progress || 0,
      estimatedCost: task.estimated_cost,
      actualCost: task.actual_cost,
      assignee: task.assignee_id ? {
        id: task.assignee_id,
        name: task.assignee_name || 'Team Member',
        email: task.assignee_email
      } : null,
      tags: task.tags || [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
    
    res.json({
      success: true,
      data: transformedTasks,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/tasks/:id', async (req, res): Promise<any> => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/tasks', async (req, res): Promise<any> => {
  try {
    const { 
      projectId, project_id, title, description, status, priority,
      startDate, dueDate, estimatedCost, assigneeId 
    } = req.body;
    
    const actualProjectId = projectId || project_id;
    const start = startDate ? new Date(startDate) : new Date();
    const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, start_date, due_date, estimated_cost, assignee_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [actualProjectId, title, description, status || 'todo', priority || 'medium', 
       start, due, estimatedCost || 0, assigneeId || null]
    );
    
    const task = result.rows[0];
    const transformedTask = {
      id: task.id,
      projectId: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date,
      dueDate: task.due_date,
      estimatedCost: task.estimated_cost,
      assigneeId: task.assignee_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
    
    res.status(201).json({ 
      success: true,
      data: transformedTask,
      task: transformedTask 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/v1/tasks/:id', async (req, res): Promise<any> => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = result.rows[0];
    const transformedTask = {
      id: task.id,
      projectId: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date,
      dueDate: task.due_date,
      estimatedCost: task.estimated_cost,
      progress: task.progress || 0,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
    
    res.json({ success: true, data: transformedTask, task: transformedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/v1/tasks/:id', async (req, res): Promise<any> => {
  try {
    const { 
      title, description, status, priority, progress,
      startDate, dueDate, estimatedCost, actualCost 
    } = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (progress !== undefined) {
      updateFields.push(`progress = $${paramCount++}`);
      values.push(progress);
    }
    if (startDate !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      values.push(new Date(startDate));
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount++}`);
      values.push(new Date(dueDate));
    }
    if (estimatedCost !== undefined) {
      updateFields.push(`estimated_cost = $${paramCount++}`);
      values.push(estimatedCost);
    }
    if (actualCost !== undefined) {
      updateFields.push(`actual_cost = $${paramCount++}`);
      values.push(actualCost);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    
    const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = result.rows[0];
    const transformedTask = {
      id: task.id,
      projectId: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date,
      dueDate: task.due_date,
      endDate: task.due_date,
      estimatedCost: task.estimated_cost,
      actualCost: task.actual_cost,
      progress: task.progress || 0,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
    
    res.json({ success: true, data: transformedTask, task: transformedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/tasks/:id', async (req, res): Promise<any> => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project tasks endpoint
app.get('/api/v1/projects/:id/tasks', async (req, res): Promise<any> => {
  try {
    const { status, assignedTo } = req.query;
    let query = 'SELECT * FROM tasks WHERE project_id = $1';
    const queryParams: any[] = [req.params.id];
    
    if (status) {
      query += ` AND status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    if (assignedTo) {
      query += ` AND assignee_id = $${queryParams.length + 1}`;
      queryParams.push(assignedTo);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const tasksResult = await pool.query(query, queryParams);
    
    // Transform tasks to match frontend format
    const transformedTasks = tasksResult.rows.map(task => ({
      id: task.id,
      projectId: task.project_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date,
      dueDate: task.due_date,
      endDate: task.due_date,
      progress: task.progress || 0,
      estimatedCost: task.estimated_cost,
      actualCost: task.actual_cost,
      assignee: task.assignee_id ? {
        id: task.assignee_id,
        name: task.assignee_name || 'Team Member',
        email: task.assignee_email
      } : null,
      tags: task.tags || [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));
    
    res.json({
      success: true,
      data: transformedTasks,
      tasks: transformedTasks
    });
  } catch (error) {
    console.error('Project tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoints
app.get('/api/v1/users', async (req, res): Promise<any> => {
  try {
    const { page = 1, limit = 50, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `SELECT u.*, r.name as role_name 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.is_active = true`;
    const queryParams: any[] = [];
    
    if (role) {
      query += ` AND r.name = $${queryParams.length + 1}`;
      queryParams.push(role);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const usersResult = await pool.query(query, queryParams);
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const total = parseInt(countResult.rows[0].count);
    
    // Transform users to match frontend format
    const transformedUsers = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role_name,
      organizationId: user.organization_id,
      isActive: user.is_active,
      isVerified: user.is_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      // Additional fields for resources
      department: user.role_name === 'designer' ? 'Design' : 
                  user.role_name === 'project_lead' ? 'Management' : 
                  user.role_name === 'contractor' ? 'Construction' : 'General',
      skills: user.role_name === 'designer' ? ['Architecture', 'Design', 'CAD', '3D Modeling'] :
              user.role_name === 'project_lead' ? ['Project Management', 'Leadership', 'Budgeting'] :
              user.role_name === 'contractor' ? ['Construction', 'Site Management', 'Safety'] :
              ['General Skills'],
      costPerHour: user.role_name === 'project_lead' ? 200 :
                   user.role_name === 'designer' ? 180 :
                   user.role_name === 'contractor' ? 150 : 100
    }));
    
    res.json({
      success: true,
      data: transformedUsers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/users/:id', async (req, res): Promise<any> => {
  try {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role_name,
      organizationId: user.organization_id,
      isActive: user.is_active,
      isVerified: user.is_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json({ success: true, data: transformedUser, user: transformedUser });
  } catch (error) {
    console.error('User error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Documents endpoint (stub)
app.get('/api/v1/documents', async (_req, res) => {
  res.json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
wsServer.initialize(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Real backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time connections`);
  console.log(`📦 Connected to PostgreSQL database: ${process.env.DB_NAME || 'daritana_dev'}`);
  console.log(`🎯 Virtual Office features ready`);
  console.log(`🔐 Test accounts (password: password123):`);
  console.log(`   - admin@daritana.com`);
  console.log(`   - lead@daritana.com`);
  console.log(`   - designer@daritana.com`);
  console.log(`   - client@example.com`);
  console.log(`   - contractor@build.com`);
  console.log(`   - staff@daritana.com`);
});