/**
 * Enterprise Project Management Types
 * Sprint 3.4: Microsoft Project-level capabilities
 */

// ============= GANTT CHART TYPES =============
export interface GanttTask {
  id: string;
  wbsCode: string;
  name: string;
  type: 'task' | 'milestone' | 'summary' | 'phase';
  
  // Scheduling
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  percentComplete: number;
  actualStart?: Date;
  actualEnd?: Date;
  
  // Dependencies
  predecessors: TaskDependency[];
  successors: TaskDependency[];
  
  // Constraints
  constraint?: TaskConstraint;
  deadline?: Date;
  
  // Resources
  resources: ResourceAssignment[];
  cost: number;
  actualCost: number;
  
  // Hierarchy
  parentId?: string;
  children?: string[];
  level: number;
  
  // Critical Path
  isCritical: boolean;
  totalFloat: number;
  freeFloat: number;
  
  // Baselines
  baselines: TaskBaseline[];
  
  // Custom fields
  customFields?: Record<string, any>;
}

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'FS' | 'SS' | 'SF' | 'FF'; // Finish-Start, Start-Start, etc.
  lag: number; // in days (can be negative for lead)
}

export interface TaskConstraint {
  type: 'ASAP' | 'ALAP' | 'MSO' | 'MFO' | 'SNET' | 'SNLT' | 'FNET' | 'FNLT';
  date?: Date;
}

export interface TaskBaseline {
  number: number; // 0-10
  startDate: Date;
  endDate: Date;
  duration: number;
  cost: number;
  work: number;
  savedDate: Date;
}

// ============= RESOURCE MANAGEMENT =============
export interface Resource {
  id: string;
  name: string;
  type: 'work' | 'material' | 'cost' | 'equipment';
  
  // Work resource specific
  email?: string;
  department?: string;
  skills?: Skill[];
  availability?: ResourceAvailability[];
  maxUnits: number; // 100% = 1.0
  
  // Cost information
  standardRate: number;
  overtimeRate: number;
  perUseRate: number;
  costAccrual: 'start' | 'prorated' | 'end';
  
  // Calendar
  calendarId: string;
  workingDays: WorkingDay[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  certified: boolean;
  expiryDate?: Date;
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  taskId: string;
  units: number; // percentage (1.0 = 100%)
  work: number; // total hours
  actualWork: number;
  remainingWork: number;
  
  // Contour
  workContour: 'flat' | 'back-loaded' | 'front-loaded' | 'double-peak' | 'early-peak' | 'late-peak' | 'bell' | 'turtle';
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Cost
  cost: number;
  actualCost: number;
  
  // Leveling
  levelingDelay: number;
  canLevel: boolean;
}

export interface ResourceAvailability {
  fromDate: Date;
  toDate: Date;
  maxUnits: number;
}

export interface WorkingDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isWorking: boolean;
  workingHours?: TimeRange[];
}

export interface TimeRange {
  start: string; // "09:00"
  end: string; // "17:00"
}

// ============= PORTFOLIO MANAGEMENT =============
export interface Portfolio {
  id: string;
  name: string;
  description: string;
  owner: string;
  
  // Projects
  projectIds: string[];
  programs: Program[];
  
  // Metrics
  totalBudget: number;
  totalActualCost: number;
  roi: number;
  npv: number;
  irr: number;
  
  // Health
  healthScore: number;
  riskScore: number;
  
  // Strategic alignment
  strategicGoals: StrategicGoal[];
  prioritizationModel: PrioritizationModel;
}

export interface Program {
  id: string;
  name: string;
  projectIds: string[];
  
  // Benefits
  expectedBenefits: Benefit[];
  realizedBenefits: Benefit[];
  
  // Milestones
  milestones: ProgramMilestone[];
  
  // Dependencies
  dependencies: CrossProjectDependency[];
}

export interface StrategicGoal {
  id: string;
  name: string;
  weight: number;
  alignmentScore: number;
}

export interface PrioritizationModel {
  criteria: PrioritizationCriterion[];
  method: 'weighted-scoring' | 'ahp' | 'value-vs-complexity' | 'moscow';
}

export interface PrioritizationCriterion {
  name: string;
  weight: number;
  score: number;
}

export interface Benefit {
  id: string;
  name: string;
  type: 'financial' | 'strategic' | 'operational';
  value: number;
  realized: boolean;
  realizationDate?: Date;
}

export interface ProgramMilestone {
  id: string;
  name: string;
  date: Date;
  projectId?: string;
  status: 'pending' | 'achieved' | 'missed';
}

export interface CrossProjectDependency {
  id: string;
  fromProjectId: string;
  fromTaskId: string;
  toProjectId: string;
  toTaskId: string;
  type: 'FS' | 'SS' | 'SF' | 'FF';
  lag: number;
}

// ============= ADVANCED PLANNING =============
export interface WBSNode {
  id: string;
  code: string;
  name: string;
  description: string;
  parentId?: string;
  children: string[];
  deliverable?: string;
  responsibleParty: string;
  level: number;
  type: 'phase' | 'deliverable' | 'work-package' | 'activity';
}

export interface PERTAnalysis {
  taskId: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  expected: number; // (O + 4M + P) / 6
  standardDeviation: number;
  variance: number;
  confidenceLevels: {
    p50: number;
    p80: number;
    p90: number;
    p95: number;
  };
}

export interface MonteCarloSimulation {
  id: string;
  projectId: string;
  iterations: number;
  
  // Results
  scheduleProbability: ProbabilityDistribution;
  costProbability: ProbabilityDistribution;
  
  // Sensitivity
  tornadoDiagram: SensitivityFactor[];
  
  // Critical tasks
  criticalityIndex: Map<string, number>; // taskId -> % times on critical path
}

export interface ProbabilityDistribution {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  percentiles: Map<number, number>; // percentile -> value
  histogram: HistogramBin[];
}

export interface HistogramBin {
  start: number;
  end: number;
  frequency: number;
  probability: number;
}

export interface SensitivityFactor {
  name: string;
  impact: number;
  correlation: number;
}

export interface Risk {
  id: string;
  projectId: string;
  name: string;
  category: 'technical' | 'schedule' | 'cost' | 'resource' | 'external';
  
  // Assessment
  probability: number; // 0-1
  impact: number; // 1-5
  score: number; // probability * impact
  
  // Response
  response: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  responsePlan: string;
  contingencyPlan: string;
  
  // Tracking
  status: 'identified' | 'analyzing' | 'responding' | 'monitoring' | 'closed';
  owner: string;
  identifiedDate: Date;
  expectedDate?: Date;
  actualDate?: Date;
  
  // Impact
  scheduleImpact?: number; // days
  costImpact?: number;
  qualityImpact?: string;
}

// ============= AGILE FEATURES =============
export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  name: string;
  goal: string;
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Capacity
  teamCapacity: number; // total hours
  velocity: number; // story points
  
  // Backlog
  stories: UserStory[];
  
  // Metrics
  plannedPoints: number;
  completedPoints: number;
  burndown: BurndownData[];
  
  // Ceremonies
  ceremonies: SprintCeremony[];
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  
  // Estimation
  storyPoints: number;
  tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  
  // Priority
  priority: 'critical' | 'high' | 'medium' | 'low';
  businessValue: number;
  
  // Sprint
  sprintId?: string;
  epicId?: string;
  
  // Status
  status: 'backlog' | 'ready' | 'in-progress' | 'review' | 'done';
  
  // Tasks
  tasks: string[]; // task IDs
}

export interface BurndownData {
  date: Date;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
}

export interface SprintCeremony {
  type: 'planning' | 'daily' | 'review' | 'retrospective';
  date: Date;
  duration: number; // minutes
  attendees: string[];
  notes?: string;
  actionItems?: ActionItem[];
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: 'open' | 'in-progress' | 'completed';
}

// ============= REPORTING & ANALYTICS =============
export interface Report {
  id: string;
  name: string;
  type: 'standard' | 'custom';
  category: 'project' | 'portfolio' | 'resource' | 'financial' | 'risk';
  
  // Configuration
  dataSource: DataSource[];
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: SortCriteria[];
  
  // Layout
  sections: ReportSection[];
  
  // Distribution
  schedule?: ReportSchedule;
  recipients?: string[];
  format: 'pdf' | 'excel' | 'html' | 'dashboard';
}

export interface DataSource {
  entity: string;
  fields: string[];
  joins?: DataJoin[];
}

export interface DataJoin {
  fromEntity: string;
  fromField: string;
  toEntity: string;
  toField: string;
  type: 'inner' | 'left' | 'right';
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'between' | 'in';
  value: any;
}

export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportSection {
  type: 'header' | 'summary' | 'table' | 'chart' | 'metric' | 'text';
  configuration: any; // Section-specific config
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  owner: string;
  
  // Layout
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  
  // Refresh
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  
  // Sharing
  isPublic: boolean;
  sharedWith: string[];
}

export interface DashboardLayout {
  type: 'grid' | 'freeform';
  columns: number;
  rows: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gantt' | 'kanban' | 'calendar' | 'custom';
  
  // Position
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Data
  dataSource: DataSource;
  configuration: any; // Widget-specific config
  
  // Interaction
  isDrillable: boolean;
  linkedDashboardId?: string;
}

// ============= EARNED VALUE MANAGEMENT =============
export interface EarnedValueMetrics {
  date: Date;
  
  // Basic metrics
  pv: number; // Planned Value (BCWS)
  ev: number; // Earned Value (BCWP)
  ac: number; // Actual Cost (ACWP)
  
  // Variances
  sv: number; // Schedule Variance (EV - PV)
  cv: number; // Cost Variance (EV - AC)
  
  // Indices
  spi: number; // Schedule Performance Index (EV / PV)
  cpi: number; // Cost Performance Index (EV / AC)
  
  // Forecasts
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  vac: number; // Variance at Completion (BAC - EAC)
  tcpi: number; // To-Complete Performance Index
  
  // Additional
  bac: number; // Budget at Completion
  percentComplete: number;
  percentSpent: number;
}

// ============= WORKFLOW AUTOMATION =============
export interface Workflow {
  id: string;
  name: string;
  description: string;
  
  // Design
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  
  // Execution
  isActive: boolean;
  version: number;
  
  // Audit
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  executionCount: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  configuration: any; // Trigger-specific config
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowAction {
  type: 'create-task' | 'update-field' | 'send-notification' | 'call-api' | 'run-script';
  configuration: any; // Action-specific config
  onError?: 'stop' | 'continue' | 'rollback';
}

// ============= INTEGRATION TYPES =============
export interface ProjectIntegration {
  id: string;
  type: 'ms-project' | 'jira' | 'primavera' | 'sap' | 'servicenow';
  
  // Connection
  connectionString: string;
  credentials: IntegrationCredentials;
  
  // Sync
  syncDirection: 'import' | 'export' | 'bidirectional';
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSync?: Date;
  
  // Mapping
  fieldMappings: FieldMapping[];
  
  // Status
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
}

export interface IntegrationCredentials {
  type: 'api-key' | 'oauth' | 'basic';
  data: any; // Encrypted credentials
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string; // JavaScript expression
}