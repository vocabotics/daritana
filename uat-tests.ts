/**
 * User Acceptance Testing Script
 * Tests all architect features as a Malaysian architect user
 */

import axios from 'axios';
import chalk from 'chalk';

const API_BASE = 'http://localhost:7001/api';
const FRONTEND_URL = 'http://127.0.0.1:5174';

// Test results tracking
const testResults: {
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    status: 'PASS' | 'FAIL';
    message: string;
    endpoint?: string;
    duration: number;
  }>;
  bugs: Array<{ severity: string; description: string; location: string }>;
  improvements: Array<{ priority: string; description: string; benefit: string }>;
} = {
  passed: 0,
  failed: 0,
  tests: [],
  bugs: [],
  improvements: [],
};

let authToken = '';
let userId = '';

// Utility functions
const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  error: (msg: string) => console.log(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  section: (msg: string) => console.log(chalk.cyan.bold(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`)),
};

async function runTest(
  name: string,
  fn: () => Promise<void>,
  endpoint?: string
): Promise<void> {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS', message: 'Test passed', endpoint, duration });
    log.success(`${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'FAIL',
      message: error.message,
      endpoint,
      duration,
    });
    log.error(`${name}: ${error.message}`);
  }
}

async function reportBug(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', description: string, location: string) {
  testResults.bugs.push({ severity, description, location });
  log.warn(`BUG [${severity}]: ${description} at ${location}`);
}

async function suggestImprovement(priority: 'HIGH' | 'MEDIUM' | 'LOW', description: string, benefit: string) {
  testResults.improvements.push({ priority, description, benefit });
  log.info(`IMPROVEMENT [${priority}]: ${description}`);
}

// ==================== AUTHENTICATION TESTS ====================

async function testAuthentication() {
  log.section('AUTHENTICATION TESTS');

  await runTest('Login with valid credentials', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'architect@example.com',
      password: 'password123',
    });

    if (!response.data.success) throw new Error('Login failed');
    if (!response.data.token) throw new Error('No token received');
    if (!response.data.user) throw new Error('No user data received');

    authToken = response.data.token;
    userId = response.data.user.id;

    log.info(`Logged in as: ${response.data.user.name} (${response.data.user.role})`);
  }, 'POST /api/auth/login');

  await runTest('Get current user profile', async () => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get profile');
    if (response.data.user.email !== 'architect@example.com') throw new Error('Wrong user data');
  }, 'GET /api/auth/me');

  await runTest('Login with invalid credentials should fail', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'architect@example.com',
        password: 'wrongpassword',
      });
      throw new Error('Should have failed but succeeded');
    } catch (error: any) {
      if (error.response?.status !== 401) throw new Error('Should return 401 status');
    }
  }, 'POST /api/auth/login');
}

// ==================== PROJECT TESTS ====================

async function testProjects() {
  log.section('PROJECT MANAGEMENT TESTS');

  await runTest('List all projects', async () => {
    const response = await axios.get(`${API_BASE}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get projects');
    if (!Array.isArray(response.data.projects)) throw new Error('Projects should be an array');
    if (response.data.projects.length < 1) throw new Error('Should have at least 1 project');

    log.info(`Found ${response.data.projects.length} projects`);
    response.data.projects.forEach((p: any) => {
      log.info(`  - ${p.name} (${p.status})`);
    });
  }, 'GET /api/projects');

  await runTest('Get specific project details', async () => {
    const response = await axios.get(`${API_BASE}/projects/proj-1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get project');
    if (response.data.project.id !== 'proj-1') throw new Error('Wrong project returned');

    const project = response.data.project;
    log.info(`Project: ${project.name}`);
    log.info(`Location: ${project.location}`);
    log.info(`Budget: RM ${project.budget.toLocaleString()}`);
  }, 'GET /api/projects/:id');
}

// ==================== RFI TESTS ====================

async function testRFI() {
  log.section('RFI MANAGEMENT TESTS');

  await runTest('List all RFIs', async () => {
    const response = await axios.get(`${API_BASE}/rfis`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get RFIs');
    if (!Array.isArray(response.data.rfis)) throw new Error('RFIs should be an array');

    log.info(`Found ${response.data.rfis.length} RFIs`);
    response.data.rfis.forEach((rfi: any) => {
      log.info(`  - ${rfi.rfi_number}: ${rfi.title} [${rfi.status}]`);
    });
  }, 'GET /api/rfis');

  await runTest('Filter RFIs by project', async () => {
    const response = await axios.get(`${API_BASE}/rfis?project_id=proj-1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get RFIs');
    response.data.rfis.forEach((rfi: any) => {
      if (rfi.project_id !== 'proj-1') throw new Error('Filter not working');
    });
  }, 'GET /api/rfis?project_id=proj-1');

  await runTest('Create new RFI', async () => {
    const response = await axios.post(
      `${API_BASE}/rfis`,
      {
        project_id: 'proj-1',
        rfi_number: 'RFI-TEST-001',
        title: 'UAT Test RFI',
        description: 'This is a test RFI created during UAT',
        category: 'technical',
        priority: 'medium',
        due_date: '2025-12-01',
        cost_impact: 0,
        schedule_impact_days: 0,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create RFI');
    if (!response.data.rfi.id) throw new Error('No RFI ID returned');
    if (response.data.rfi.status !== 'draft') throw new Error('New RFI should be in draft status');

    log.info(`Created RFI: ${response.data.rfi.rfi_number}`);
  }, 'POST /api/rfis');

  await runTest('Submit RFI', async () => {
    const response = await axios.patch(
      `${API_BASE}/rfis/rfi-1/submit`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to submit RFI');
    if (response.data.rfi.status !== 'submitted') throw new Error('RFI should be in submitted status');
  }, 'PATCH /api/rfis/:id/submit');

  // Check RFI data quality
  const rfiResponse = await axios.get(`${API_BASE}/rfis`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const sampleRfi = rfiResponse.data.rfis[0];

  if (!sampleRfi.cost_impact && sampleRfi.cost_impact !== 0) {
    await reportBug('MEDIUM', 'RFI cost_impact field should always have a value', 'RFI model');
  }

  if (!sampleRfi.schedule_impact_days && sampleRfi.schedule_impact_days !== 0) {
    await reportBug('MEDIUM', 'RFI schedule_impact_days field should always have a value', 'RFI model');
  }

  await suggestImprovement(
    'HIGH',
    'Add RFI response tracking with architect comments and approval workflow',
    'Better collaboration and accountability'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add file attachments to RFIs for supporting documents',
    'More comprehensive RFI documentation'
  );
}

// ==================== CHANGE ORDER TESTS ====================

async function testChangeOrders() {
  log.section('CHANGE ORDER MANAGEMENT TESTS');

  await runTest('List all change orders', async () => {
    const response = await axios.get(`${API_BASE}/change-orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get change orders');
    if (!Array.isArray(response.data.changeOrders)) throw new Error('Change orders should be an array');

    log.info(`Found ${response.data.changeOrders.length} change orders`);
    response.data.changeOrders.forEach((co: any) => {
      log.info(`  - ${co.co_number}: ${co.title} (RM ${co.cost_impact.toLocaleString()})`);
    });
  }, 'GET /api/change-orders');

  await runTest('Create new change order', async () => {
    const response = await axios.post(
      `${API_BASE}/change-orders`,
      {
        project_id: 'proj-1',
        co_number: 'CO-TEST-001',
        title: 'UAT Test Change Order',
        description: 'This is a test change order',
        reason: 'client_request',
        cost_impact: 50000,
        time_impact_days: 14,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create change order');
    if (!response.data.changeOrder.id) throw new Error('No change order ID returned');
    if (response.data.changeOrder.status !== 'draft') throw new Error('New CO should be in draft status');

    log.info(`Created CO: ${response.data.changeOrder.co_number}`);
  }, 'POST /api/change-orders');

  await suggestImprovement(
    'HIGH',
    'Add change order approval workflow with multi-level approvals',
    'Proper governance and accountability for project changes'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add impact analysis showing cumulative effect of all COs on project budget and timeline',
    'Better project financial control'
  );
}

// ==================== DRAWING TESTS ====================

async function testDrawings() {
  log.section('DRAWING MANAGEMENT TESTS');

  await runTest('List all drawings', async () => {
    const response = await axios.get(`${API_BASE}/drawings`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get drawings');
    if (!Array.isArray(response.data.drawings)) throw new Error('Drawings should be an array');

    log.info(`Found ${response.data.drawings.length} drawings`);
    response.data.drawings.forEach((dwg: any) => {
      log.info(`  - ${dwg.drawing_number} Rev ${dwg.current_revision}: ${dwg.title}`);
    });
  }, 'GET /api/drawings');

  await runTest('Create new drawing', async () => {
    const response = await axios.post(
      `${API_BASE}/drawings`,
      {
        project_id: 'proj-1',
        drawing_number: 'A-999',
        title: 'UAT Test Drawing',
        discipline: 'A',
        drawing_type: 'section',
        file_url: '/mock-drawings/A-999-A.pdf',
        file_type: 'pdf',
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create drawing');
    if (!response.data.drawing.id) throw new Error('No drawing ID returned');
    if (response.data.drawing.current_revision !== 'A') throw new Error('First revision should be A');

    log.info(`Created drawing: ${response.data.drawing.drawing_number}`);
  }, 'POST /api/drawings');

  const drawingsResponse = await axios.get(`${API_BASE}/drawings`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const sampleDrawing = drawingsResponse.data.drawings[0];

  if (!sampleDrawing.versions || !Array.isArray(sampleDrawing.versions)) {
    await reportBug('HIGH', 'Drawing versions should be an array', 'Drawing model');
  }

  await suggestImprovement(
    'CRITICAL',
    'Add actual file upload functionality for drawings (currently mock URLs)',
    'Essential for real-world usage - architects need to upload actual DWG/PDF files'
  );

  await suggestImprovement(
    'HIGH',
    'Add drawing transmittal feature to track drawing submissions to authorities/consultants',
    'Required for PAM contract administration'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add drawing comparison view to see changes between revisions',
    'Helps track design evolution and identify errors'
  );
}

// ==================== SITE VISIT TESTS ====================

async function testSiteVisits() {
  log.section('SITE VISIT MANAGEMENT TESTS');

  await runTest('List all site visits', async () => {
    const response = await axios.get(`${API_BASE}/site-visits`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get site visits');
    if (!Array.isArray(response.data.siteVisits)) throw new Error('Site visits should be an array');

    log.info(`Found ${response.data.siteVisits.length} site visits`);
    response.data.siteVisits.forEach((sv: any) => {
      log.info(`  - ${sv.visit_number} on ${sv.visit_date} (${sv.visit_type})`);
    });
  }, 'GET /api/site-visits');

  await runTest('Create new site visit', async () => {
    const response = await axios.post(
      `${API_BASE}/site-visits`,
      {
        project_id: 'proj-1',
        visit_number: 'SV-TEST-001',
        visit_date: '2025-11-08',
        visit_type: 'inspection',
        weather_condition: 'Partly Cloudy',
        temperature: 31,
        attendees: [
          { name: 'Ahmad bin Abdullah', role: 'Architect', organization: 'Daritana Architects' },
        ],
        observations: 'UAT test site visit',
        photos: [],
        issues: [],
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create site visit');
    if (!response.data.siteVisit.id) throw new Error('No site visit ID returned');

    log.info(`Created site visit: ${response.data.siteVisit.visit_number}`);
  }, 'POST /api/site-visits');

  await suggestImprovement(
    'HIGH',
    'Add mobile app for site visits with offline photo capture',
    'Architects work on-site often without internet - offline capability is crucial'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add GPS coordinates to photos for precise location tracking',
    'Better documentation for large construction sites'
  );

  await suggestImprovement(
    'LOW',
    'Add weather API integration to auto-fill weather and temperature',
    'Saves time and ensures accurate weather recording'
  );
}

// ==================== PUNCH LIST TESTS ====================

async function testPunchList() {
  log.section('PUNCH LIST MANAGEMENT TESTS');

  await runTest('List all punch list items', async () => {
    const response = await axios.get(`${API_BASE}/punch-list`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get punch list');
    if (!Array.isArray(response.data.items)) throw new Error('Punch list should be an array');

    log.info(`Found ${response.data.items.length} punch list items`);
    response.data.items.forEach((pl: any) => {
      log.info(`  - ${pl.item_number}: ${pl.description} [${pl.status}]`);
    });
  }, 'GET /api/punch-list');

  await runTest('Create new punch list item', async () => {
    const response = await axios.post(
      `${API_BASE}/punch-list`,
      {
        project_id: 'proj-1',
        item_number: 'PL-TEST-001',
        description: 'UAT test punch list item',
        location: 'Level 1, Test Area',
        category: 'finishing',
        priority: 'low',
        status: 'identified',
        assigned_to_contractor: 'Test Contractor Sdn Bhd',
        photos_before: [],
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create punch list item');
    if (!response.data.item.id) throw new Error('No item ID returned');

    log.info(`Created punch item: ${response.data.item.item_number}`);
  }, 'POST /api/punch-list');

  await suggestImprovement(
    'HIGH',
    'Add Kanban board view for punch list items (by status)',
    'Visual workflow management improves efficiency'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add before/after photo comparison view',
    'Makes verification of completed work easier'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add bulk actions to assign multiple items to contractor',
    'Saves time when managing many punch list items'
  );
}

// ==================== PAM CONTRACT TESTS ====================

async function testPAMContracts() {
  log.section('PAM CONTRACT ADMINISTRATION TESTS');

  await runTest('List all PAM contracts', async () => {
    const response = await axios.get(`${API_BASE}/pam-contracts`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get PAM contracts');
    if (!Array.isArray(response.data.contracts)) throw new Error('Contracts should be an array');

    log.info(`Found ${response.data.contracts.length} PAM contracts`);
    response.data.contracts.forEach((pam: any) => {
      log.info(`  - ${pam.contract_number} (${pam.contract_type}): RM ${pam.contract_sum.toLocaleString()}`);
      log.info(`    Retention: ${pam.retention_percentage}% (RM ${pam.retention_sum.toLocaleString()})`);
      log.info(`    Payment Certificates: ${pam.payment_certificates.length}`);
    });
  }, 'GET /api/pam-contracts');

  await runTest('Create new PAM contract', async () => {
    const response = await axios.post(
      `${API_BASE}/pam-contracts`,
      {
        project_id: 'proj-2',
        contract_number: 'PAM-TEST-001',
        contract_type: 'PAM_2018',
        contract_sum: 1500000,
        retention_percentage: 5,
        performance_bond_percentage: 10,
        defects_liability_period_months: 24,
        commencement_date: '2025-12-01',
        completion_date: '2026-06-30',
        liquidated_damages_per_day: 2000,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to create PAM contract');
    if (!response.data.contract.id) throw new Error('No contract ID returned');
    if (response.data.contract.retention_sum !== 75000) throw new Error('Retention calculation wrong');

    log.info(`Created PAM contract: ${response.data.contract.contract_number}`);
    log.info(`Contract Sum: RM ${response.data.contract.contract_sum.toLocaleString()}`);
    log.info(`Retention: RM ${response.data.contract.retention_sum.toLocaleString()}`);
  }, 'POST /api/pam-contracts');

  const pamResponse = await axios.get(`${API_BASE}/pam-contracts`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const sampleContract = pamResponse.data.contracts[0];

  if (!sampleContract.payment_certificates || !Array.isArray(sampleContract.payment_certificates)) {
    await reportBug('HIGH', 'Payment certificates should be an array', 'PAM Contract model');
  }

  // Check Malaysian context
  if (sampleContract.retention_percentage !== 5) {
    await reportBug('MEDIUM', 'Standard retention in Malaysia is 5%, default should be set', 'PAM Contract');
  }

  await suggestImprovement(
    'CRITICAL',
    'Add Payment Certificate generation feature with automatic calculations',
    'Core PAM contract requirement - architects issue payment certificates monthly'
  );

  await suggestImprovement(
    'HIGH',
    'Add Variation Order (VO) tracking linked to Change Orders',
    'Required for proper contract administration under PAM'
  );

  await suggestImprovement(
    'HIGH',
    'Add Extension of Time (EOT) claim tracking and approval',
    'Critical PAM contract administration function'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add PAM contract clause library with standard Malaysian clauses',
    'Saves time and ensures compliance with PAM standards'
  );
}

// ==================== SETTINGS TESTS ====================

async function testSettings() {
  log.section('SETTINGS TESTS');

  await runTest('Get user settings', async () => {
    const response = await axios.get(`${API_BASE}/settings`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.success) throw new Error('Failed to get settings');
    if (!response.data.settings) throw new Error('No settings returned');

    log.info(`Current theme: ${response.data.settings.theme}`);
    log.info(`Language: ${response.data.settings.language}`);
  }, 'GET /api/settings');

  await runTest('Update user settings', async () => {
    const response = await axios.patch(
      `${API_BASE}/settings`,
      {
        theme: 'dark',
        language: 'ms',
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (!response.data.success) throw new Error('Failed to update settings');
    if (response.data.settings.theme !== 'dark') throw new Error('Theme not updated');

    log.info(`Updated theme to: ${response.data.settings.theme}`);
  }, 'PATCH /api/settings');
}

// ==================== FRONTEND CHECKS ====================

async function checkFrontendAvailability() {
  log.section('FRONTEND AVAILABILITY CHECKS');

  await runTest('Frontend server is accessible', async () => {
    const response = await axios.get(FRONTEND_URL);
    if (response.status !== 200) throw new Error('Frontend not accessible');
  }, FRONTEND_URL);

  log.info(`\n📱 Frontend running at: ${FRONTEND_URL}`);
  log.info(`👤 Test user: architect@example.com`);
  log.info(`🔑 Password: password123`);
  log.info(`\n🔍 Manual testing required for:`);
  log.info(`   - UI/UX experience`);
  log.info(`   - Navigation flow`);
  log.info(`   - Form validations`);
  log.info(`   - CAD Viewer functionality`);
  log.info(`   - Responsive design`);
  log.info(`   - Malaysian localization (RM currency, date formats)`);
}

// ==================== MALAYSIAN ARCHITECT PERSPECTIVE ====================

async function malaysianArchitectReview() {
  log.section('MALAYSIAN ARCHITECT PERSPECTIVE');

  log.info('As a Malaysian architect, here are the key observations:');
  log.info('');

  // Positive aspects
  log.success('STRENGTHS:');
  log.info('✓ PAM 2018/2006 contract support - critical for local market');
  log.info('✓ RM currency throughout - proper Malaysian context');
  log.info('✓ RFI management - essential for project coordination');
  log.info('✓ Change order tracking - required for all projects');
  log.info('✓ Drawing register - basic requirement for architects');
  log.info('✓ Site visit documentation - daily architect activity');
  log.info('✓ Punch list management - project closeout essential');
  log.info('');

  // Critical gaps
  log.warn('CRITICAL GAPS FOR MALAYSIAN ARCHITECTS:');
  log.info('⚠ No UBBL (Uniform Building By-Laws) compliance checking');
  log.info('⚠ No JKR (Public Works Department) specifications library');
  log.info('⚠ No integration with Malaysian authorities (Bomba, DBKL, etc.)');
  log.info('⚠ No QS (Quantity Surveyor) collaboration features');
  log.info('⚠ No BQ (Bill of Quantities) management');
  log.info('⚠ No actual DWG file upload/storage (only mock URLs)');
  log.info('⚠ Missing AutoCAD/Revit integration');
  log.info('');

  // Malaysian-specific improvements needed
  await suggestImprovement(
    'CRITICAL',
    'Add UBBL compliance checklist (Part 1-13) with automated checking',
    'Required by law for all building submissions in Malaysia'
  );

  await suggestImprovement(
    'CRITICAL',
    'Add submission tracking for local authorities (DBKL, PBT, etc.)',
    'All projects require multiple authority submissions'
  );

  await suggestImprovement(
    'HIGH',
    'Add Bomba (Fire Department) submission and approval tracking',
    'Mandatory for all buildings - separate submission process'
  );

  await suggestImprovement(
    'HIGH',
    'Add JKR specification library and clause builder',
    'Standard specification for government projects'
  );

  await suggestImprovement(
    'HIGH',
    'Add QS integration for BQ and cost estimation',
    'QS is separate profession in Malaysia, need collaboration tools'
  );

  await suggestImprovement(
    'HIGH',
    'Add CF (Certificate of Fitness) and CCC (Certificate of Completion and Compliance) tracking',
    'Final deliverables for all projects'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add LAD (Liquidated Ascertained Damages) calculator',
    'Important for PAM contract administration'
  );

  await suggestImprovement(
    'MEDIUM',
    'Add CIDB contractor registration verification',
    'Required to check contractor qualifications'
  );

  await suggestImprovement(
    'LOW',
    'Add support for Bahasa Malaysia in all forms and documents',
    'Many clients and authorities prefer BM'
  );
}

// ==================== GENERATE REPORT ====================

function generateReport() {
  log.section('USER ACCEPTANCE TEST REPORT');

  console.log('\n📊 TEST SUMMARY');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(chalk.green(`Passed: ${testResults.passed}`));
  console.log(chalk.red(`Failed: ${testResults.failed}`));
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);

  console.log('\n🐛 BUGS FOUND');
  if (testResults.bugs.length === 0) {
    console.log(chalk.green('No bugs found!'));
  } else {
    testResults.bugs.forEach((bug, idx) => {
      console.log(`${idx + 1}. [${chalk.red(bug.severity)}] ${bug.description}`);
      console.log(`   Location: ${bug.location}`);
    });
  }

  console.log('\n💡 IMPROVEMENTS SUGGESTED');
  const criticalImprovements = testResults.improvements.filter((i) => i.priority === 'CRITICAL');
  const highImprovements = testResults.improvements.filter((i) => i.priority === 'HIGH');
  const mediumImprovements = testResults.improvements.filter((i) => i.priority === 'MEDIUM');
  const lowImprovements = testResults.improvements.filter((i) => i.priority === 'LOW');

  if (criticalImprovements.length > 0) {
    console.log(chalk.red.bold('\nCRITICAL PRIORITY:'));
    criticalImprovements.forEach((imp, idx) => {
      console.log(`${idx + 1}. ${imp.description}`);
      console.log(`   Benefit: ${imp.benefit}`);
    });
  }

  if (highImprovements.length > 0) {
    console.log(chalk.yellow.bold('\nHIGH PRIORITY:'));
    highImprovements.forEach((imp, idx) => {
      console.log(`${idx + 1}. ${imp.description}`);
      console.log(`   Benefit: ${imp.benefit}`);
    });
  }

  if (mediumImprovements.length > 0) {
    console.log(chalk.blue.bold('\nMEDIUM PRIORITY:'));
    mediumImprovements.forEach((imp, idx) => {
      console.log(`${idx + 1}. ${imp.description}`);
    });
  }

  if (lowImprovements.length > 0) {
    console.log(chalk.gray.bold('\nLOW PRIORITY:'));
    lowImprovements.forEach((imp, idx) => {
      console.log(`${idx + 1}. ${imp.description}`);
    });
  }

  console.log('\n📈 DETAILED TEST RESULTS');
  testResults.tests.forEach((test) => {
    const statusIcon = test.status === 'PASS' ? chalk.green('✓') : chalk.red('✗');
    console.log(`${statusIcon} ${test.name} (${test.duration}ms)`);
    if (test.endpoint) {
      console.log(`  ${chalk.gray(test.endpoint)}`);
    }
    if (test.status === 'FAIL') {
      console.log(`  ${chalk.red(test.message)}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(chalk.cyan.bold('UAT TESTING COMPLETE'));
  console.log('='.repeat(60) + '\n');
}

// ==================== MAIN EXECUTION ====================

async function main() {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║     DARITANA ARCHITECT MANAGEMENT - UAT TESTING           ║'));
  console.log(chalk.cyan.bold('║     Testing from Malaysian Architect Perspective          ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n'));

  try {
    await testAuthentication();
    await testProjects();
    await testRFI();
    await testChangeOrders();
    await testDrawings();
    await testSiteVisits();
    await testPunchList();
    await testPAMContracts();
    await testSettings();
    await checkFrontendAvailability();
    await malaysianArchitectReview();

    generateReport();
  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error during testing:'), error);
    process.exit(1);
  }
}

main();
