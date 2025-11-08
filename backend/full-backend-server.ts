import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/daritana_dev',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Express app setup
const app = express();
const PORT = process.env.PORT || 7001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:7000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: string;
  organization_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}

// Enhanced request type with user
interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Database initialization
async function initDatabase() {
  console.log('🔧 Initializing database tables...');

  const tables = [
    // Organizations table
    `CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE,
      plan VARCHAR(50) DEFAULT 'basic',
      max_users INTEGER DEFAULT 5,
      max_projects INTEGER DEFAULT 10,
      max_storage_gb INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff',
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      avatar_url TEXT,
      phone VARCHAR(50),
      department VARCHAR(100),
      position VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Projects table
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'planning',
      priority VARCHAR(20) DEFAULT 'medium',
      start_date DATE,
      end_date DATE,
      budget DECIMAL(15,2),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      project_lead_id UUID REFERENCES users(id),
      client_id UUID REFERENCES users(id),
      progress INTEGER DEFAULT 0,
      location TEXT,
      type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium',
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id UUID REFERENCES users(id),
      reporter_id UUID REFERENCES users(id),
      due_date DATE,
      estimated_hours DECIMAL(10,2),
      actual_hours DECIMAL(10,2),
      order_index INTEGER DEFAULT 0,
      labels TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      read BOOLEAN DEFAULT false,
      data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      key VARCHAR(255) NOT NULL,
      value JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key),
      UNIQUE(organization_id, key)
    )`,

    // Documents table
    `CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      mime_type VARCHAR(100),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      uploaded_by UUID REFERENCES users(id),
      category VARCHAR(50),
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Activity logs table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id UUID,
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)',
    'CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_logs_organization ON activity_logs(organization_id)',
  ];

  try {
    // Create tables
    for (const table of tables) {
      await pool.query(table);
    }

    // Create indexes
    for (const index of indexes) {
      await pool.query(index);
    }

    console.log('✅ Database tables initialized successfully');

    // Create default data if needed
    await createDefaultData();

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Create default data
async function createDefaultData() {
  try {
    // Check if default organization exists
    const orgResult = await pool.query('SELECT id FROM organizations WHERE slug = $1', ['default']);

    let orgId: string;

    if (orgResult.rows.length === 0) {
      // Create default organization
      const newOrg = await pool.query(
        `INSERT INTO organizations (name, slug, plan, max_users, max_projects, max_storage_gb)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Default Organization', 'default', 'professional', 50, 100, 100]
      );
      orgId = newOrg.rows[0].id;
      console.log('✅ Created default organization');
    } else {
      orgId = orgResult.rows[0].id;
    }

    // Check if admin user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@daritana.com']);

    if (userResult.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (email, password, name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@daritana.com', hashedPassword, 'System Admin', 'admin', orgId]
      );
      console.log('✅ Created admin user (admin@daritana.com / admin123)');
    }

    // Create test users if they don't exist
    const testUsers = [
      { email: 'john@daritana.com', name: 'John Doe', role: 'project_lead', password: 'password123' },
      { email: 'jane@daritana.com', name: 'Jane Smith', role: 'designer', password: 'password123' },
      { email: 'client@daritana.com', name: 'Client User', role: 'client', password: 'password123' },
    ];

    for (const user of testUsers) {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (exists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          `INSERT INTO users (email, password, name, role, organization_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.email, hashedPassword, user.name, user.role, orgId]
        );
        console.log(`✅ Created test user: ${user.email}`);
      }
    }

  } catch (error) {
    console.error('Warning: Could not create default data:', error);
  }
}

// Authentication middleware
async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth middleware (doesn't fail if no token)
async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue without user
    }
  }
  next();
}

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'daritana-backend',
    database: pool.totalCount > 0 ? 'connected' : 'disconnected'
  });
});

// Auth endpoints
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get or create organization
    let orgId = organizationId;
    if (!orgId) {
      const defaultOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', ['default']);
      orgId = defaultOrg.rows[0]?.id;
    }

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (email, password, name, role, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, organization_id`,
      [email, hashedPassword, name, 'staff', orgId]
    );

    const user = newUser.rows[0];

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password, name, role, organization_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Settings endpoints
app.get('/api/settings', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const organizationId = req.user?.organizationId;

    let settings: any = {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        desktop: true
      },
      display: {
        compactMode: false,
        showSidebar: true
      }
    };

    if (userId) {
      // Get user settings
      const userSettings = await pool.query(
        'SELECT key, value FROM settings WHERE user_id = $1',
        [userId]
      );

      userSettings.rows.forEach(row => {
        settings[row.key] = row.value;
      });
    }

    if (organizationId) {
      // Get organization settings
      const orgSettings = await pool.query(
        'SELECT key, value FROM settings WHERE organization_id = $1',
        [organizationId]
      );

      orgSettings.rows.forEach(row => {
        settings[row.key] = row.value;
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const settings = req.body;

    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (user_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, key)
         DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP`,
        [userId, key, JSON.stringify(value)]
      );
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Notifications endpoints
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit = 20, offset = 0, unread } = req.query;

    let query = `
      SELECT id, type, title, message, read, data, created_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (unread === 'true') {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      notifications: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Projects endpoints
app.get('/api/projects', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, u.name as project_lead_name, c.name as client_name,
             COUNT(DISTINCT t.id) as task_count
      FROM projects p
      LEFT JOIN users u ON p.project_lead_id = u.id
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY p.id, u.name, c.name`;
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      projects: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;
    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      start_date,
      end_date,
      budget,
      location,
      type
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await pool.query(
      `INSERT INTO projects
       (name, description, status, priority, start_date, end_date, budget,
        organization_id, project_lead_id, location, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget,
       organizationId, userId, location, type]
    );

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT p.*, u.name as project_lead_name, c.name as client_name
       FROM projects p
       LEFT JOIN users u ON p.project_lead_id = u.id
       LEFT JOIN users c ON p.client_id = c.id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get tasks
    const tasks = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY order_index',
      [id]
    );

    // Get documents
    const documents = await pool.query(
      'SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      ...result.rows[0],
      tasks: tasks.rows,
      documents: documents.rows
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Tasks endpoints
app.get('/api/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const { project_id, status, assignee_id } = req.query;

    let query = `
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE p.organization_id = $1
    `;

    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (project_id) {
      query += ` AND t.project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignee_id) {
      query += ` AND t.assignee_id = $${paramIndex}`;
      params.push(assignee_id);
      paramIndex++;
    }

    query += ' ORDER BY t.order_index, t.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      tasks: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      project_id,
      projectId, // Support camelCase
      assignee_id,
      assigneeId, // Support camelCase
      due_date,
      dueDate, // Support camelCase
      estimated_hours,
      estimatedHours, // Support camelCase
      labels
    } = req.body;

    // Use camelCase if provided, otherwise use snake_case
    const projectIdValue = projectId || project_id;
    const assigneeIdValue = assigneeId || assignee_id;
    const dueDateValue = dueDate || due_date;
    const estimatedHoursValue = estimatedHours || estimated_hours;

    if (!title || !projectIdValue) {
      return res.status(400).json({ error: 'Title and projectId are required' });
    }

    const result = await pool.query(
      `INSERT INTO tasks
       (title, description, status, priority, project_id, assignee_id,
        reporter_id, due_date, estimated_hours, labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, status, priority, projectIdValue, assigneeIdValue,
       userId, dueDateValue, estimatedHoursValue, labels]
    );

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (['title', 'description', 'status', 'priority', 'assignee_id',
           'due_date', 'estimated_hours', 'actual_hours', 'labels'].includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE tasks
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Users endpoints
app.get('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT id, email, name, role, department, position, avatar_url, is_active
       FROM users
       WHERE organization_id = $1
       ORDER BY name`,
      [organizationId]
    );

    res.json({
      users: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const { email, name, role = 'staff', department, position, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, department, position, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role, department, position`,
      [email, hashedPassword, name, role, department, position, organizationId]
    );

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    // Get statistics
    const [projectCount, taskCount, userCount, activeProjects] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM projects WHERE organization_id = $1', [organizationId]),
      pool.query(
        `SELECT COUNT(*) FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE p.organization_id = $1`,
        [organizationId]
      ),
      pool.query('SELECT COUNT(*) FROM users WHERE organization_id = $1', [organizationId]),
      pool.query(
        `SELECT COUNT(*) FROM projects
         WHERE organization_id = $1 AND status IN ('in_progress', 'active')`,
        [organizationId]
      )
    ]);

    // Get recent projects
    const recentProjects = await pool.query(
      `SELECT id, name, status, progress, updated_at
       FROM projects
       WHERE organization_id = $1
       ORDER BY updated_at DESC
       LIMIT 5`,
      [organizationId]
    );

    // Get user's tasks
    const userTasks = await pool.query(
      `SELECT t.id, t.title, t.status, t.priority, p.name as project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.assignee_id = $1 AND t.status != 'completed'
       ORDER BY t.priority DESC, t.due_date
       LIMIT 10`,
      [userId]
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT action, resource_type, details, created_at
       FROM activity_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [organizationId]
    );

    res.json({
      stats: {
        totalProjects: parseInt(projectCount.rows[0].count),
        activeProjects: parseInt(activeProjects.rows[0].count),
        totalTasks: parseInt(taskCount.rows[0].count),
        teamMembers: parseInt(userCount.rows[0].count)
      },
      recentProjects: recentProjects.rows,
      userTasks: userTasks.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============================================================================
// Additional User/Auth Endpoints
// ============================================================================

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await pool.query(
      'SELECT id, email, name, role, department, position, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update current user profile
app.put('/api/users/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, name, department } = req.body;

    const updateName = name || (firstName && lastName ? `${firstName} ${lastName}` : null);

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, name, role, department, position`,
      [updateName, department, userId]
    );

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================================================
// Additional Project Endpoints
// ============================================================================

// Update project
app.put('/api/projects/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, description, status, priority, start_date, end_date,
      budget, location, type
    } = req.body;

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           budget = COALESCE($7, budget),
           location = COALESCE($8, location),
           type = COALESCE($9, type),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget, location, type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ============================================================================
// Additional Task Endpoints
// ============================================================================

// Get task by ID
app.get('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Update task (full update)
app.put('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, description, status, priority, assignee_id, assigneeId,
      due_date, dueDate, estimated_hours, estimatedHours, labels
    } = req.body;

    const assigneeIdValue = assigneeId || assignee_id;
    const dueDateValue = dueDate || due_date;
    const estimatedHoursValue = estimatedHours || estimated_hours;

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assignee_id = COALESCE($5, assignee_id),
           due_date = COALESCE($6, due_date),
           estimated_hours = COALESCE($7, estimated_hours),
           labels = COALESCE($8, labels),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, description, status, priority, assigneeIdValue, dueDateValue, estimatedHoursValue, labels, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ============================================================================
// Additional Notification Endpoints
// ============================================================================

// Mark all notifications as read
app.patch('/api/notifications/mark-all-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `UPDATE notifications
       SET read = true
       WHERE user_id = $1 AND read = false
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      updatedCount: result.rows.length
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// ============================================================================
// Document Management Endpoints
// ============================================================================

// Get documents
app.get('/api/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Return empty array for now - files table doesn't exist yet
    // In production, this would query the actual files table
    res.json({
      success: true,
      documents: []
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Get document statistics
app.get('/api/documents/statistics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Return empty statistics for now - files table doesn't exist yet
    // In production, this would query actual file statistics
    res.json({
      success: true,
      statistics: {
        totalDocuments: 0,
        totalSize: 0,
        byType: []
      }
    });
  } catch (error) {
    console.error('Get doc stats error:', error);
    res.status(500).json({ error: 'Failed to get document statistics' });
  }
});

// Get document categories
app.get('/api/documents/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      categories: [
        { id: 1, name: 'Drawings', count: 0 },
        { id: 2, name: 'Specifications', count: 0 },
        { id: 3, name: 'Reports', count: 0 },
        { id: 4, name: 'Contracts', count: 0 },
        { id: 5, name: 'Photos', count: 0 }
      ]
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// ============================================================================
// Team & Collaboration Endpoints
// ============================================================================

// Get team members
app.get('/api/team/members', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT id, name, email, role, department, position, created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY name`,
      [organizationId]
    );

    res.json({
      success: true,
      members: result.rows
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Get team analytics
app.get('/api/team/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const [totalMembers, activeProjects] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE organization_id = $1', [organizationId]),
      pool.query('SELECT COUNT(*) FROM projects WHERE organization_id = $1 AND status = $2', [organizationId, 'active'])
    ]);

    res.json({
      success: true,
      analytics: {
        totalMembers: parseInt(totalMembers.rows[0].count),
        activeProjects: parseInt(activeProjects.rows[0].count),
        productivity: 85,
        utilization: 72
      }
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({ error: 'Failed to get team analytics' });
  }
});

// Get team workload
app.get('/api/team/workload', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, COUNT(t.id) as task_count
       FROM users u
       LEFT JOIN tasks t ON u.id = t.assignee_id AND t.status != 'completed'
       WHERE u.organization_id = $1
       GROUP BY u.id, u.name, u.email
       ORDER BY task_count DESC`,
      [organizationId]
    );

    res.json({
      success: true,
      workload: result.rows.map(row => ({
        userId: row.id,
        name: row.name,
        email: row.email,
        taskCount: parseInt(row.task_count),
        capacity: 40,
        utilization: Math.min(100, (parseInt(row.task_count) / 10) * 100)
      }))
    });
  } catch (error) {
    console.error('Get workload error:', error);
    res.status(500).json({ error: 'Failed to get team workload' });
  }
});

// Get online users
app.get('/api/team/presence/online', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT id, name, email, role, department
       FROM users
       WHERE organization_id = $1
       ORDER BY name
       LIMIT 10`,
      [organizationId]
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

// Update presence
app.post('/api/team/presence', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // For now, just return success
    // In a real implementation, this would update a presence table or Redis
    res.json({
      success: true,
      message: 'Presence updated'
    });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

// Get team activity
app.get('/api/team-activity/activity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const result = await pool.query(
      `SELECT action, resource_type, details, created_at
       FROM activity_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [organizationId]
    );

    res.json({
      success: true,
      activities: result.rows
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get team activity' });
  }
});

// ============================================================================
// HR Endpoints
// ============================================================================

// Get HR statistics
app.get('/api/hr/statistics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const [totalEmployees, departments] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE organization_id = $1', [organizationId]),
      pool.query('SELECT COUNT(DISTINCT department) FROM users WHERE organization_id = $1', [organizationId])
    ]);

    res.json({
      success: true,
      statistics: {
        totalEmployees: parseInt(totalEmployees.rows[0].count),
        totalDepartments: parseInt(departments.rows[0].count),
        activeEmployees: parseInt(totalEmployees.rows[0].count),
        avgTenure: 2.5
      }
    });
  } catch (error) {
    console.error('Get HR stats error:', error);
    res.status(500).json({ error: 'Failed to get HR statistics' });
  }
});

// ============================================================================
// Learning Endpoints
// ============================================================================

// Get learning courses
app.get('/api/learning/courses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      courses: [
        {
          id: 1,
          title: 'Introduction to Architecture',
          category: 'Architecture',
          level: 'Beginner',
          duration: '10 hours'
        },
        {
          id: 2,
          title: 'Advanced Project Management',
          category: 'Management',
          level: 'Advanced',
          duration: '15 hours'
        }
      ]
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
});

// ============================================================================
// Community Endpoints
// ============================================================================

// Get community posts
app.get('/api/community/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      posts: []
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get community posts' });
  }
});

// ============================================================================
// Marketplace Endpoints
// ============================================================================

// Get marketplace products
app.get('/api/marketplace/products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      products: []
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// ============================================================================
// Compliance Endpoints
// ============================================================================

// Get compliance issues
app.get('/api/compliance/issues', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    res.json({
      success: true,
      issues: []
    });
  } catch (error) {
    console.error('Get compliance issues error:', error);
    res.status(500).json({ error: 'Failed to get compliance issues' });
  }
});

// ============================================================================
// Financial Endpoints
// ============================================================================

// Get financial invoices
app.get('/api/financial/invoices', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    res.json({
      success: true,
      invoices: []
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get financial expenses
app.get('/api/financial/expenses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    res.json({
      success: true,
      expenses: []
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// Get financial analytics
app.get('/api/financial/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    res.json({
      success: true,
      analytics: {
        totalRevenue: 0,
        totalExpenses: 0,
        profit: 0,
        profitMargin: 0
      }
    });
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ error: 'Failed to get financial analytics' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Initialize database tables
    await initDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   - Health: GET /health`);
      console.log(`   - Auth: POST /api/auth/login, /api/auth/register`);
      console.log(`   - Settings: GET/PUT /api/settings`);
      console.log(`   - Projects: GET/POST /api/projects`);
      console.log(`   - Tasks: GET/POST /api/tasks`);
      console.log(`   - Users: GET/POST /api/users`);
      console.log(`   - Dashboard: GET /api/dashboard`);
      console.log(`\n👤 Default credentials:`);
      console.log(`   Email: admin@daritana.com`);
      console.log(`   Password: admin123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();