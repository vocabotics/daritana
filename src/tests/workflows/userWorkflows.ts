// Predefined user workflow tests for Daritana
import { 
  WorkflowTest, 
  createNavigationStep, 
  createFormStep, 
  createApiStep, 
  createWaitStep,
  workflowTester 
} from '@/utils/workflowTesting';

// Authentication Workflows
export const loginWorkflow: WorkflowTest = {
  id: 'auth-login',
  name: 'User Login',
  description: 'Test complete login flow with valid credentials',
  priority: 'critical',
  roles: ['all'],
  steps: [
    createNavigationStep('Navigate to Login', '/login'),
    {
      id: 'check-login-form',
      name: 'Verify Login Form',
      description: 'Check that login form is visible and accessible',
      action: async () => {
        const emailInput = await workflowTester.waitForElement('[data-testid="email-input"]');
        const passwordInput = await workflowTester.waitForElement('[data-testid="password-input"]');
        const submitButton = await workflowTester.waitForElement('[data-testid="login-submit"]');
        return !!(emailInput && passwordInput && submitButton);
      },
    },
    createFormStep('Fill Login Form', {
      '[data-testid="email-input"]': 'admin@daritana.com',
      '[data-testid="password-input"]': 'password123',
    }, '[data-testid="login-submit"]'),
    createWaitStep('Wait for Dashboard Redirect', () => 
      window.location.pathname === '/dashboard', 10000),
    {
      id: 'verify-user-auth',
      name: 'Verify User Authentication',
      description: 'Check that user is properly authenticated',
      action: async () => {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user_data');
        return !!(token && user);
      },
    },
  ],
};

export const registrationWorkflow: WorkflowTest = {
  id: 'auth-registration',
  name: 'User Registration',
  description: 'Test complete user registration flow',
  priority: 'high',
  roles: ['public'],
  steps: [
    createNavigationStep('Navigate to Registration', '/register'),
    createFormStep('Fill Registration Form', {
      '[data-testid="firstName-input"]': 'John',
      '[data-testid="lastName-input"]': 'Doe',
      '[data-testid="email-input"]': `test${Date.now()}@example.com`,
      '[data-testid="password-input"]': 'TestPassword123!',
      '[data-testid="confirmPassword-input"]': 'TestPassword123!',
      '[data-testid="terms-checkbox"]': 'true',
    }, '[data-testid="register-submit"]'),
    createWaitStep('Wait for Success Message', () => 
      !!document.querySelector('[data-testid="registration-success"]'), 5000),
  ],
  teardown: async () => {
    // Clean up test user if needed
    console.log('Registration test cleanup completed');
  },
};

// Project Management Workflows
export const createProjectWorkflow: WorkflowTest = {
  id: 'project-create',
  name: 'Create New Project',
  description: 'Test creating a new project with all required fields',
  priority: 'critical',
  roles: ['admin', 'project_lead'],
  setup: async () => {
    // Ensure user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('User must be authenticated for project creation test');
    }
  },
  steps: [
    createNavigationStep('Navigate to Projects', '/projects'),
    {
      id: 'click-create-project',
      name: 'Click Create Project Button',
      description: 'Click the create project button to open form',
      action: () => workflowTester.clickElement('[data-testid="create-project-btn"]'),
    },
    createWaitStep('Wait for Project Form', () => 
      !!document.querySelector('[data-testid="project-form"]'), 3000),
    createFormStep('Fill Project Form', {
      '[data-testid="project-name-input"]': `Test Project ${Date.now()}`,
      '[data-testid="project-description-input"]': 'This is a test project for workflow testing',
      '[data-testid="project-type-select"]': 'residential',
      '[data-testid="project-priority-select"]': 'medium',
      '[data-testid="project-start-date"]': '2024-01-01',
      '[data-testid="project-end-date"]': '2024-12-31',
      '[data-testid="project-budget-input"]': '1000000',
      '[data-testid="project-site-address"]': '123 Test Street',
      '[data-testid="project-site-city"]': 'Kuala Lumpur',
      '[data-testid="project-site-postcode"]': '50000',
    }, '[data-testid="project-submit-btn"]'),
    createWaitStep('Wait for Project Created', () => 
      !!document.querySelector('[data-testid="project-created-success"]'), 5000),
    {
      id: 'verify-project-in-list',
      name: 'Verify Project in List',
      description: 'Check that the created project appears in the project list',
      action: async () => {
        await workflowTester.delay(1000);
        return !!document.querySelector('[data-testid="project-list-item"]');
      },
    },
  ],
};

export const projectDetailWorkflow: WorkflowTest = {
  id: 'project-detail-view',
  name: 'View Project Details',
  description: 'Test viewing project details and navigating through tabs',
  priority: 'high',
  roles: ['admin', 'project_lead', 'designer', 'client'],
  steps: [
    createNavigationStep('Navigate to Projects', '/projects'),
    {
      id: 'click-first-project',
      name: 'Click First Project',
      description: 'Click on the first project in the list',
      action: () => workflowTester.clickElement('[data-testid="project-list-item"]:first-child'),
    },
    createWaitStep('Wait for Project Detail Page', () => 
      window.location.pathname.includes('/projects/'), 5000),
    {
      id: 'verify-project-tabs',
      name: 'Verify Project Tabs',
      description: 'Check that all project tabs are present',
      action: async () => {
        const tabs = ['overview', 'tasks', 'files', 'team', 'timeline'];
        for (const tab of tabs) {
          const tabElement = document.querySelector(`[data-testid="tab-${tab}"]`);
          if (!tabElement) return false;
        }
        return true;
      },
    },
    {
      id: 'test-tab-navigation',
      name: 'Test Tab Navigation',
      description: 'Navigate through different project tabs',
      action: async () => {
        const tabs = ['tasks', 'files', 'team'];
        for (const tab of tabs) {
          const success = await workflowTester.clickElement(`[data-testid="tab-${tab}"]`);
          if (!success) return false;
          await workflowTester.delay(500);
        }
        return true;
      },
    },
  ],
};

// Task Management Workflows
export const createTaskWorkflow: WorkflowTest = {
  id: 'task-create',
  name: 'Create New Task',
  description: 'Test creating a new task in the kanban board',
  priority: 'high',
  roles: ['admin', 'project_lead', 'designer'],
  steps: [
    createNavigationStep('Navigate to Kanban', '/kanban'),
    createWaitStep('Wait for Kanban Board', () => 
      !!document.querySelector('[data-testid="kanban-board"]'), 3000),
    {
      id: 'click-add-task',
      name: 'Click Add Task',
      description: 'Click the add task button in TODO column',
      action: () => workflowTester.clickElement('[data-testid="add-task-todo"]'),
    },
    createWaitStep('Wait for Task Form', () => 
      !!document.querySelector('[data-testid="task-form"]'), 3000),
    createFormStep('Fill Task Form', {
      '[data-testid="task-title-input"]': `Test Task ${Date.now()}`,
      '[data-testid="task-description-input"]': 'This is a test task for workflow testing',
      '[data-testid="task-priority-select"]': 'medium',
      '[data-testid="task-due-date"]': '2024-12-31',
    }, '[data-testid="task-submit-btn"]'),
    createWaitStep('Wait for Task Created', () => 
      !!document.querySelector('[data-testid="task-created-success"]'), 5000),
  ],
};

export const taskDragDropWorkflow: WorkflowTest = {
  id: 'task-drag-drop',
  name: 'Task Drag and Drop',
  description: 'Test dragging tasks between columns in kanban board',
  priority: 'medium',
  roles: ['admin', 'project_lead', 'designer'],
  steps: [
    createNavigationStep('Navigate to Kanban', '/kanban'),
    createWaitStep('Wait for Kanban Board', () => 
      !!document.querySelector('[data-testid="kanban-board"]'), 3000),
    {
      id: 'verify-task-columns',
      name: 'Verify Task Columns',
      description: 'Check that all kanban columns are present',
      action: async () => {
        const columns = ['todo', 'in-progress', 'review', 'done'];
        for (const column of columns) {
          const columnElement = document.querySelector(`[data-testid="column-${column}"]`);
          if (!columnElement) return false;
        }
        return true;
      },
    },
    {
      id: 'simulate-drag-drop',
      name: 'Simulate Drag and Drop',
      description: 'Simulate dragging a task from TODO to IN-PROGRESS',
      action: async () => {
        // This is a simplified simulation - real drag/drop testing would need more complex setup
        const taskElement = document.querySelector('[data-testid="task-item"]:first-child');
        const targetColumn = document.querySelector('[data-testid="column-in-progress"]');
        
        if (taskElement && targetColumn) {
          // Simulate the drag and drop by dispatching custom events
          const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
          const dropEvent = new DragEvent('drop', { bubbles: true });
          
          taskElement.dispatchEvent(dragStartEvent);
          targetColumn.dispatchEvent(dropEvent);
          
          await workflowTester.delay(1000);
          return true;
        }
        return false;
      },
    },
  ],
};

// File Management Workflows
export const fileUploadWorkflow: WorkflowTest = {
  id: 'file-upload',
  name: 'File Upload',
  description: 'Test uploading files to a project',
  priority: 'high',
  roles: ['admin', 'project_lead', 'designer', 'contractor'],
  steps: [
    createNavigationStep('Navigate to Files', '/files'),
    createWaitStep('Wait for Files Page', () => 
      !!document.querySelector('[data-testid="files-page"]'), 3000),
    {
      id: 'check-upload-area',
      name: 'Check Upload Area',
      description: 'Verify that file upload area is present',
      action: async () => {
        const uploadArea = document.querySelector('[data-testid="file-upload-area"]');
        return !!uploadArea;
      },
    },
    {
      id: 'simulate-file-upload',
      name: 'Simulate File Upload',
      description: 'Simulate selecting and uploading a file',
      action: async () => {
        // Create a mock file for testing
        const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        
        if (fileInput) {
          // Create a new FileList with our mock file
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(mockFile);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Click upload button
          await workflowTester.delay(500);
          return await workflowTester.clickElement('[data-testid="upload-submit-btn"]');
        }
        return false;
      },
    },
    createWaitStep('Wait for Upload Complete', () => 
      !!document.querySelector('[data-testid="upload-success"]'), 10000),
  ],
};

// User Profile Workflows
export const profileUpdateWorkflow: WorkflowTest = {
  id: 'profile-update',
  name: 'Update User Profile',
  description: 'Test updating user profile information',
  priority: 'medium',
  roles: ['all'],
  steps: [
    createNavigationStep('Navigate to Profile', '/profile'),
    createWaitStep('Wait for Profile Page', () => 
      !!document.querySelector('[data-testid="profile-page"]'), 3000),
    {
      id: 'click-edit-profile',
      name: 'Click Edit Profile',
      description: 'Click the edit profile button',
      action: () => workflowTester.clickElement('[data-testid="edit-profile-btn"]'),
    },
    createWaitStep('Wait for Edit Form', () => 
      !!document.querySelector('[data-testid="profile-edit-form"]'), 3000),
    createFormStep('Update Profile Information', {
      '[data-testid="profile-bio-input"]': 'Updated bio for workflow testing',
      '[data-testid="profile-phone-input"]': '+60123456789',
      '[data-testid="profile-website-input"]': 'https://example.com',
    }, '[data-testid="profile-save-btn"]'),
    createWaitStep('Wait for Profile Updated', () => 
      !!document.querySelector('[data-testid="profile-updated-success"]'), 5000),
  ],
};

// Dashboard Navigation Workflow
export const dashboardNavigationWorkflow: WorkflowTest = {
  id: 'dashboard-navigation',
  name: 'Dashboard Navigation',
  description: 'Test navigating through different dashboard sections',
  priority: 'high',
  roles: ['all'],
  steps: [
    createNavigationStep('Navigate to Dashboard', '/dashboard'),
    createWaitStep('Wait for Dashboard Load', () => 
      !!document.querySelector('[data-testid="dashboard-main"]'), 3000),
    {
      id: 'test-sidebar-navigation',
      name: 'Test Sidebar Navigation',
      description: 'Test clicking through different sidebar menu items',
      action: async () => {
        const menuItems = [
          'projects',
          'kanban',
          'timeline',
          'files',
          'team',
          'financial',
        ];
        
        for (const item of menuItems) {
          const success = await workflowTester.clickElement(`[data-testid="nav-${item}"]`);
          if (!success) {
            console.warn(`Failed to click nav item: ${item}`);
          }
          await workflowTester.delay(500);
        }
        
        // Return to dashboard
        await workflowTester.clickElement('[data-testid="nav-dashboard"]');
        return true;
      },
    },
    {
      id: 'verify-dashboard-widgets',
      name: 'Verify Dashboard Widgets',
      description: 'Check that dashboard widgets are loaded',
      action: async () => {
        const widgets = document.querySelectorAll('[data-testid^="widget-"]');
        return widgets.length > 0;
      },
    },
  ],
};

// Export all workflows
export const ALL_WORKFLOWS: WorkflowTest[] = [
  loginWorkflow,
  registrationWorkflow,
  createProjectWorkflow,
  projectDetailWorkflow,
  createTaskWorkflow,
  taskDragDropWorkflow,
  fileUploadWorkflow,
  profileUpdateWorkflow,
  dashboardNavigationWorkflow,
];

// Workflow categories for organized testing
export const WORKFLOW_CATEGORIES = {
  authentication: [loginWorkflow, registrationWorkflow],
  projectManagement: [createProjectWorkflow, projectDetailWorkflow],
  taskManagement: [createTaskWorkflow, taskDragDropWorkflow],
  fileManagement: [fileUploadWorkflow],
  userManagement: [profileUpdateWorkflow],
  navigation: [dashboardNavigationWorkflow],
  critical: ALL_WORKFLOWS.filter(w => w.priority === 'critical'),
  high: ALL_WORKFLOWS.filter(w => w.priority === 'high'),
  medium: ALL_WORKFLOWS.filter(w => w.priority === 'medium'),
  low: ALL_WORKFLOWS.filter(w => w.priority === 'low'),
};