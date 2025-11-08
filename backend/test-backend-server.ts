/**
 * Mock Backend Server for UAT Testing
 * Provides in-memory data storage without PostgreSQL dependency
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 7001;
const JWT_SECRET = 'test-secret-key-for-uat';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
const mockData = {
  users: [
    {
      id: '1',
      email: 'architect@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Ahmad bin Abdullah',
      role: 'designer',
      organization_id: 'org-1',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'lead@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Siti Nurhaliza',
      role: 'project_lead',
      organization_id: 'org-1',
      created_at: new Date().toISOString(),
    },
  ],
  organizations: [
    {
      id: 'org-1',
      name: 'Daritana Architects Sdn Bhd',
      registration_number: 'SSM-123456-A',
      subscription_plan: 'professional',
      subscription_status: 'active',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'KLCC Mixed Development',
      organization_id: 'org-1',
      status: 'in_progress',
      start_date: '2025-01-01',
      end_date: '2026-12-31',
      budget: 5000000,
      location: 'Kuala Lumpur City Centre',
      description: 'High-rise mixed development project',
      created_at: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      name: 'George Town Heritage Restoration',
      organization_id: 'org-1',
      status: 'planning',
      start_date: '2025-03-01',
      end_date: '2025-12-31',
      budget: 1200000,
      location: 'George Town, Penang',
      description: 'UNESCO heritage building restoration',
      created_at: new Date().toISOString(),
    },
  ],
  rfis: [
    {
      id: 'rfi-1',
      project_id: 'proj-1',
      rfi_number: 'RFI-KLCC-001',
      title: 'Clarification on Foundation Depth',
      description: 'Need clarification on the required foundation depth for Tower A',
      category: 'technical',
      priority: 'high',
      status: 'submitted',
      submitted_by: '1',
      due_date: '2025-11-15',
      cost_impact: 50000,
      schedule_impact_days: 7,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rfi-2',
      project_id: 'proj-1',
      rfi_number: 'RFI-KLCC-002',
      title: 'MEP Coordination - Ceiling Height',
      description: 'Ceiling height conflicts with MEP routing in Level 12',
      category: 'design',
      priority: 'medium',
      status: 'under_review',
      submitted_by: '1',
      due_date: '2025-11-20',
      cost_impact: 0,
      schedule_impact_days: 3,
      created_at: new Date().toISOString(),
    },
  ],
  changeOrders: [
    {
      id: 'co-1',
      project_id: 'proj-1',
      co_number: 'CO-KLCC-001',
      title: 'Additional Fire Egress Staircase',
      description: 'Add one more fire egress staircase as per BOMBA requirements',
      reason: 'regulatory',
      status: 'pending_approval',
      requested_by: '1',
      cost_impact: 250000,
      time_impact_days: 21,
      approval_workflow: [
        {
          step: 1,
          approver_id: '2',
          approver_name: 'Siti Nurhaliza',
          approver_role: 'Project Lead',
          status: 'pending',
          required: true,
        },
      ],
      created_at: new Date().toISOString(),
    },
  ],
  drawings: [
    {
      id: 'dwg-1',
      project_id: 'proj-1',
      drawing_number: 'A-101',
      title: 'Ground Floor Plan',
      discipline: 'A',
      drawing_type: 'plan',
      current_revision: 'B',
      status: 'approved',
      file_url: '/mock-drawings/A-101-B.pdf',
      file_type: 'pdf',
      created_by: '1',
      created_at: '2025-10-01T10:00:00Z',
      versions: [
        {
          revision: 'A',
          date: '2025-09-15',
          description: 'Initial issue',
          file_url: '/mock-drawings/A-101-A.pdf',
        },
        {
          revision: 'B',
          date: '2025-10-01',
          description: 'Revised per client comments',
          file_url: '/mock-drawings/A-101-B.pdf',
        },
      ],
    },
    {
      id: 'dwg-2',
      project_id: 'proj-1',
      drawing_number: 'S-201',
      title: 'Foundation Plan',
      discipline: 'S',
      drawing_type: 'plan',
      current_revision: 'A',
      status: 'under_review',
      file_url: '/mock-drawings/S-201-A.pdf',
      file_type: 'pdf',
      created_by: '1',
      created_at: '2025-10-15T14:30:00Z',
      versions: [
        {
          revision: 'A',
          date: '2025-10-15',
          description: 'For approval',
          file_url: '/mock-drawings/S-201-A.pdf',
        },
      ],
    },
  ],
  siteVisits: [
    {
      id: 'sv-1',
      project_id: 'proj-1',
      visit_number: 'SV-KLCC-001',
      visit_date: '2025-11-05',
      visit_type: 'inspection',
      weather_condition: 'Sunny',
      temperature: 32,
      attendees: [
        { name: 'Ahmad bin Abdullah', role: 'Architect', organization: 'Daritana Architects' },
        { name: 'Lim Ah Kow', role: 'Site Engineer', organization: 'Main Contractor Sdn Bhd' },
      ],
      observations: 'Foundation works progressing well. Formwork installation for Level 1 slab ongoing.',
      photos: [
        {
          id: 'photo-1',
          url: '/mock-photos/site-visit-1-1.jpg',
          caption: 'Foundation works - Grid A1',
          location: 'Tower A Foundation',
          taken_at: '2025-11-05T09:30:00Z',
        },
      ],
      issues: [
        {
          id: 'issue-1',
          description: 'Waterproofing membrane not properly lapped at joint',
          severity: 'medium',
          location: 'Grid B3',
          status: 'open',
        },
      ],
      created_at: '2025-11-05T16:00:00Z',
    },
  ],
  punchList: [
    {
      id: 'pl-1',
      project_id: 'proj-1',
      item_number: 'PL-KLCC-001',
      description: 'Paint touch-up required on column C12',
      location: 'Level 5, Column C12',
      category: 'finishing',
      priority: 'low',
      status: 'assigned',
      assigned_to_contractor: 'Main Contractor Sdn Bhd',
      identified_by: '1',
      identified_date: '2025-11-03',
      photos_before: ['/mock-photos/punch-1-before.jpg'],
      created_at: '2025-11-03T11:00:00Z',
    },
    {
      id: 'pl-2',
      project_id: 'proj-1',
      item_number: 'PL-KLCC-002',
      description: 'Door closer not functioning - Unit 5-12',
      location: 'Level 5, Unit 5-12 Main Door',
      category: 'mechanical',
      priority: 'high',
      status: 'in_progress',
      assigned_to_contractor: 'M&E Contractor Sdn Bhd',
      identified_by: '1',
      identified_date: '2025-11-04',
      photos_before: ['/mock-photos/punch-2-before.jpg'],
      created_at: '2025-11-04T14:30:00Z',
    },
  ],
  pamContracts: [
    {
      id: 'pam-1',
      project_id: 'proj-1',
      contract_number: 'PAM-KLCC-2025-001',
      contract_type: 'PAM_2018',
      contract_sum: 45000000,
      retention_percentage: 5,
      retention_sum: 2250000,
      performance_bond_percentage: 10,
      defects_liability_period_months: 24,
      commencement_date: '2025-02-01',
      completion_date: '2026-12-31',
      extension_of_time_days: 0,
      liquidated_damages_per_day: 15000,
      payment_certificates: [
        {
          id: 'cert-1',
          certificate_number: 'PC-01',
          certificate_date: '2025-08-31',
          period_from: '2025-02-01',
          period_to: '2025-08-31',
          gross_valuation: 15000000,
          retention_amount: 750000,
          previous_payments: 0,
          amount_due: 14250000,
          status: 'paid',
        },
        {
          id: 'cert-2',
          certificate_number: 'PC-02',
          certificate_date: '2025-10-31',
          period_from: '2025-09-01',
          period_to: '2025-10-31',
          gross_valuation: 8000000,
          retention_amount: 400000,
          previous_payments: 14250000,
          amount_due: 7600000,
          status: 'approved',
        },
      ],
      created_at: '2025-02-01T00:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      project_id: 'proj-1',
      title: 'Complete schematic design',
      description: 'Prepare schematic design drawings',
      status: 'in_progress',
      priority: 'high',
      assigned_to: '1',
      due_date: '2025-11-30',
      created_at: new Date().toISOString(),
    },
  ],
  settings: {
    theme: 'light',
    language: 'en',
    notifications_enabled: true,
  },
};

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ==================== AUTHENTICATION ENDPOINTS ====================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = mockData.users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = mockData.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
    },
  });
});

// ==================== RFI ENDPOINTS ====================

app.get('/api/rfis', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let rfis = mockData.rfis.filter((rfi) => {
    const project = mockData.projects.find((p) => p.id === rfi.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    rfis = rfis.filter((rfi) => rfi.project_id === project_id);
  }

  res.json({ success: true, rfis });
});

app.post('/api/rfis', authenticateToken, (req: AuthRequest, res: Response) => {
  const newRfi = {
    id: `rfi-${Date.now()}`,
    ...req.body,
    status: 'draft',
    submitted_by: req.user!.userId,
    created_at: new Date().toISOString(),
  };

  mockData.rfis.push(newRfi);
  res.status(201).json({ success: true, rfi: newRfi });
});

app.patch('/api/rfis/:id/submit', authenticateToken, (req: AuthRequest, res: Response) => {
  const rfi = mockData.rfis.find((r) => r.id === req.params.id);
  if (!rfi) {
    return res.status(404).json({ error: 'RFI not found' });
  }

  rfi.status = 'submitted';
  res.json({ success: true, rfi });
});

// ==================== CHANGE ORDER ENDPOINTS ====================

app.get('/api/change-orders', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let changeOrders = mockData.changeOrders.filter((co) => {
    const project = mockData.projects.find((p) => p.id === co.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    changeOrders = changeOrders.filter((co) => co.project_id === project_id);
  }

  res.json({ success: true, changeOrders });
});

app.post('/api/change-orders', authenticateToken, (req: AuthRequest, res: Response) => {
  const newCo = {
    id: `co-${Date.now()}`,
    ...req.body,
    status: 'draft',
    requested_by: req.user!.userId,
    created_at: new Date().toISOString(),
  };

  mockData.changeOrders.push(newCo);
  res.status(201).json({ success: true, changeOrder: newCo });
});

// ==================== DRAWING ENDPOINTS ====================

app.get('/api/drawings', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let drawings = mockData.drawings.filter((dwg) => {
    const project = mockData.projects.find((p) => p.id === dwg.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    drawings = drawings.filter((dwg) => dwg.project_id === project_id);
  }

  res.json({ success: true, drawings });
});

app.post('/api/drawings', authenticateToken, (req: AuthRequest, res: Response) => {
  const newDrawing = {
    id: `dwg-${Date.now()}`,
    ...req.body,
    current_revision: 'A',
    status: 'draft',
    created_by: req.user!.userId,
    created_at: new Date().toISOString(),
    versions: [
      {
        revision: 'A',
        date: new Date().toISOString().split('T')[0],
        description: 'Initial issue',
        file_url: req.body.file_url,
      },
    ],
  };

  mockData.drawings.push(newDrawing);
  res.status(201).json({ success: true, drawing: newDrawing });
});

// ==================== SITE VISIT ENDPOINTS ====================

app.get('/api/site-visits', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let siteVisits = mockData.siteVisits.filter((sv) => {
    const project = mockData.projects.find((p) => p.id === sv.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    siteVisits = siteVisits.filter((sv) => sv.project_id === project_id);
  }

  res.json({ success: true, siteVisits });
});

app.post('/api/site-visits', authenticateToken, (req: AuthRequest, res: Response) => {
  const newSiteVisit = {
    id: `sv-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
  };

  mockData.siteVisits.push(newSiteVisit);
  res.status(201).json({ success: true, siteVisit: newSiteVisit });
});

// ==================== PUNCH LIST ENDPOINTS ====================

app.get('/api/punch-list', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let punchItems = mockData.punchList.filter((pl) => {
    const project = mockData.projects.find((p) => p.id === pl.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    punchItems = punchItems.filter((pl) => pl.project_id === project_id);
  }

  res.json({ success: true, items: punchItems });
});

app.post('/api/punch-list', authenticateToken, (req: AuthRequest, res: Response) => {
  const newPunchItem = {
    id: `pl-${Date.now()}`,
    ...req.body,
    identified_by: req.user!.userId,
    identified_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  mockData.punchList.push(newPunchItem);
  res.status(201).json({ success: true, item: newPunchItem });
});

// ==================== PAM CONTRACT ENDPOINTS ====================

app.get('/api/pam-contracts', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let contracts = mockData.pamContracts.filter((pam) => {
    const project = mockData.projects.find((p) => p.id === pam.project_id);
    return project?.organization_id === req.user!.organizationId;
  });

  if (project_id) {
    contracts = contracts.filter((pam) => pam.project_id === project_id);
  }

  res.json({ success: true, contracts });
});

app.post('/api/pam-contracts', authenticateToken, (req: AuthRequest, res: Response) => {
  const newContract = {
    id: `pam-${Date.now()}`,
    ...req.body,
    retention_sum: (req.body.contract_sum * req.body.retention_percentage) / 100,
    payment_certificates: [],
    created_at: new Date().toISOString(),
  };

  mockData.pamContracts.push(newContract);
  res.status(201).json({ success: true, contract: newContract });
});

// ==================== PROJECT ENDPOINTS ====================

app.get('/api/projects', authenticateToken, (req: AuthRequest, res: Response) => {
  const projects = mockData.projects.filter(
    (p) => p.organization_id === req.user!.organizationId
  );
  res.json({ success: true, projects });
});

app.get('/api/projects/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const project = mockData.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ success: true, project });
});

// ==================== TASK ENDPOINTS ====================

app.get('/api/tasks', authenticateToken, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  let tasks = mockData.tasks;

  if (project_id) {
    tasks = tasks.filter((t) => t.project_id === project_id);
  }

  res.json({ success: true, tasks });
});

// ==================== SETTINGS ENDPOINTS ====================

app.get('/api/settings', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, settings: mockData.settings });
});

app.patch('/api/settings', authenticateToken, (req: AuthRequest, res: Response) => {
  mockData.settings = { ...mockData.settings, ...req.body };
  res.json({ success: true, settings: mockData.settings });
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', message: 'Mock backend server running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock backend server running on http://localhost:${PORT}`);
  console.log(`📝 Mock data available for testing`);
  console.log(`👤 Test user: architect@example.com / password123`);
  console.log(`🏢 Organization: Daritana Architects Sdn Bhd`);
  console.log(`📊 Projects: ${mockData.projects.length}`);
  console.log(`📋 RFIs: ${mockData.rfis.length}`);
  console.log(`🔄 Change Orders: ${mockData.changeOrders.length}`);
  console.log(`📐 Drawings: ${mockData.drawings.length}`);
  console.log(`🏗️  Site Visits: ${mockData.siteVisits.length}`);
  console.log(`✅ Punch List Items: ${mockData.punchList.length}`);
  console.log(`📄 PAM Contracts: ${mockData.pamContracts.length}`);
});
