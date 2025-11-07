// Financial Module Types
export interface Quotation {
  id: string;
  quotation_number: string;
  project_id: string;
  project?: Project;
  client_id: string;
  client?: User;
  prepared_by: string;
  preparedBy?: User;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'revised' | 'expired';
  valid_until: Date;
  subtotal: number;
  sst_amount: number;
  total_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  terms_and_conditions?: string;
  payment_terms?: string;
  notes?: string;
  revision_number: number;
  approved_by?: string;
  approvedByUser?: User;
  approved_at?: Date;
  rejected_reason?: string;
  sent_at?: Date;
  viewed_at?: Date;
  items: QuotationItem[];
  created_at: Date;
  updated_at: Date;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_code?: string;
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sst_rate: number;
  sst_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
  sort_order: number;
  is_optional?: boolean;
}

export interface ItemLibrary {
  id: string;
  item_code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  base_price: number;
  sst_rate: number;
  supplier?: string;
  brand?: string;
  specifications?: string;
  is_active: boolean;
  tags?: string[];
  image_url?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'staff' | 'contractor' | 'project_lead' | 'designer' | 'architect' | 'engineer' | 'quantity_surveyor' | 'site_supervisor';
  avatar?: string;
  permissions: string[];
  department?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  professionalRegistration?: {
    body: string;
    registrationNo: string;
    validUntil: Date;
  };
  availability?: {
    status: 'available' | 'busy' | 'away' | 'offline';
    nextAvailable?: Date;
  };
  resourceCapacity?: {
    maxProjects: number;
    currentProjects: number;
    utilizationRate: number;
  };
  mfaSettings?: MFASettings;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectCode: string;
  clientId: string;
  projectLeadId: string;
  teamMembers: TeamMember[];
  status: 'pre-design' | 'concept' | 'schematic' | 'design_development' | 'documentation' | 'tender' | 'construction' | 'post-completion' | 'maintenance' | 'completed' | 'on_hold';
  phase: ProjectPhase;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  budget: ProjectBudget;
  location: ProjectLocation;
  images: string[];
  designBrief?: DesignBrief;
  timeline: ProjectTimeline[];
  milestones: Milestone[];
  googleDriveFolder?: string;
  criticalPath: CriticalPath;
  riskRegister: Risk[];
  qualityMetrics: QualityMetrics;
  profitabilityAnalysis?: ProfitabilityAnalysis;
  approvalWorkflows: ApprovalWorkflow[];
  integrations: ProjectIntegrations;
}

export interface DesignBrief {
  id: string;
  projectId: string;
  requirements: string;
  pinterestBoard?: string;
  furnitureList: FurnitureItem[];
  budget: number;
  style: string;
  rooms: Room[];
  lastUpdated: Date;
  status: 'draft' | 'submitted' | 'approved' | 'revision_needed';
  // Southeast Asian Cultural Elements
  culturalPreferences?: CulturalPreferences;
  climateConsiderations?: ClimateDesignFeatures;
  localMaterials?: LocalMaterial[];
  spiritualRequirements?: SpiritualSpace[];
  entertainmentSpaces?: EntertainmentSpace[];
  traditionalElements?: TraditionalElement[];
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  description: string;
  budget: number;
  image?: string;
  supplier?: string;
  status: 'planned' | 'quoted' | 'ordered' | 'delivered';
  // Local sourcing and cultural relevance
  isLocallySourced?: boolean;
  artisanDetails?: ArtisanInfo;
  culturalSignificance?: string;
  material?: 'teak' | 'meranti' | 'bamboo' | 'rattan' | 'nyatoh' | 'rubberwood' | 'other';
  craftTechnique?: 'peranakan_carving' | 'malay_weaving' | 'chinese_joinery' | 'indian_inlay' | 'modern' | 'fusion';
}

export interface Room {
  id: string;
  name: string;
  dimensions: string;
  requirements: string;
  images: string[];
  // Cultural room specifications
  culturalFunction?: 'prayer_room' | 'ancestor_altar' | 'wet_kitchen' | 'dry_kitchen' | 'entertainment' | 'multi_generation' | 'standard';
  orientation?: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  privacyLevel?: 'public' | 'semi_private' | 'private' | 'family_only';
  ventilationType?: 'natural_cross' | 'mechanical' | 'hybrid' | 'tropical_passive';
  culturalElements?: string[];
}

export interface ProjectTimeline {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'delayed' | 'cancelled';
  assignedTo: string[];
  dependencies: string[];
  predecessors: string[];
  successors: string[];
  category: 'design' | 'engineering' | 'client' | 'management' | 'construction' | 'approval' | 'procurement' | 'site_work';
  progress: number;
  isCritical: boolean;
  float: number;
  resources: ResourceAllocation[];
  checkpoints: QualityCheckpoint[];
  evidence?: Evidence[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  assignedBy: string;
  category: 'design' | 'engineering' | 'client' | 'management' | 'construction' | 'documentation' | 'coordination' | 'review';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked' | 'cancelled' | 'waiting_approval';
  dueDate: Date;
  estimatedHours: number;
  actualHours?: number;
  attachments: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  subtasks?: Subtask[];
  automationTriggers?: AutomationTrigger[];
  revisions?: Revision[];
  qualityChecks?: QualityCheck[];
  tags?: string[];
  recurring?: RecurringPattern;
  evidence?: Evidence[];
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
}

export interface Quotation {
  id: string;
  projectId: string;
  contractorId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  validUntil: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  items: QuotationItem[];
  attachments: string[];
  submittedAt: Date;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  contractorId: string;
  quotationId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  attachments: string[];
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Meeting {
  id: string;
  title: string;
  projectId: string;
  attendees: string[];
  date: Date;
  duration: number;
  location: string;
  agenda: string;
  linkedTasks: string[];
  notes?: string;
  recordings?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Approval {
  id: string;
  projectId: string;
  title: string;
  description: string;
  documents: string[];
  requiredApprovers: string[];
  approvals: ApprovalResponse[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  dueDate: Date;
}

export interface ApprovalResponse {
  userId: string;
  status: 'approved' | 'rejected' | 'pending';
  comments?: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'approval' | 'meeting' | 'deadline' | 'update' | 'daily_briefing' | 'progress_review' | 'quality_alert';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// ==================== PROJECT MANAGEMENT ENHANCEMENTS ====================

export interface TeamMember {
  userId: string;
  role: string;
  responsibility: string;
  joinedDate: Date;
  allocation: number; // percentage
  billableRate?: number;
  permissions: ProjectPermission[];
}

export interface ProjectPhase {
  current: string;
  startDate: Date;
  expectedEndDate: Date;
  deliverables: Deliverable[];
  approvalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  nextPhase?: string;
  phaseGates: PhaseGate[];
}

export interface PhaseGate {
  id: string;
  name: string;
  criteria: string[];
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  reviewDate?: Date;
  reviewers: string[];
  comments?: string;
}

export interface ProjectBudget {
  total: number;
  allocated: number;
  spent: number;
  committed: number;
  contingency: number;
  professionalFees: number;
  constructionCost: number;
  currency: string;
  breakdown: BudgetBreakdown[];
  cashFlow: CashFlow[];
}

export interface BudgetBreakdown {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  notes?: string;
}

export interface CashFlow {
  month: Date;
  planned: number;
  actual: number;
  cumulative: number;
}

export interface ProjectLocation {
  address: string;
  city: string;
  state: string;
  postcode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  siteConditions?: string;
  accessibility?: string;
  nearbyLandmarks?: string[];
  // Southeast Asian location specifics
  climateZone?: 'tropical_rainforest' | 'tropical_monsoon' | 'tropical_highland' | 'coastal_humid';
  culturalDistrict?: string;
  heritageZone?: boolean;
  floodRiskLevel?: 'low' | 'medium' | 'high';
  monsoonExposure?: 'direct' | 'partial' | 'sheltered';
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  date: Date;
  status: 'upcoming' | 'on_track' | 'at_risk' | 'completed' | 'missed';
  deliverables: string[];
  paymentLinked: boolean;
  paymentAmount?: number;
  clientApprovalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  dependencies: string[];
}

export interface CriticalPath {
  tasks: string[];
  totalDuration: number;
  startDate: Date;
  endDate: Date;
  buffer: number;
  lastCalculated: Date;
}

export interface Risk {
  id: string;
  category: 'technical' | 'financial' | 'schedule' | 'resource' | 'external' | 'quality';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskScore: number;
  mitigation: string;
  owner: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved' | 'accepted';
  reviewDate: Date;
}

export interface QualityMetrics {
  overallScore: number;
  defectRate: number;
  reworkPercentage: number;
  clientSatisfaction: number;
  onTimeDelivery: number;
  budgetAdherence: number;
  safetyIncidents: number;
  lastAssessment: Date;
}

export interface ProfitabilityAnalysis {
  revenue: number;
  directCosts: number;
  overheadAllocation: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  type: 'design' | 'change_order' | 'payment' | 'material' | 'document';
  stages: ApprovalStage[];
  currentStage: number;
  status: 'active' | 'completed' | 'cancelled';
  deadline: Date;
  escalationRules: EscalationRule[];
}

export interface ApprovalStage {
  order: number;
  name: string;
  approvers: string[];
  approvalType: 'any' | 'all' | 'specific';
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedBy?: string;
  approvedAt?: Date;
  documents?: string[];
}

export interface EscalationRule {
  triggerAfterHours: number;
  escalateTo: string;
  notificationType: 'email' | 'sms' | 'whatsapp' | 'all';
}

export interface ProjectIntegrations {
  googleDrive?: {
    folderId: string;
    syncEnabled: boolean;
    lastSync: Date;
  };
  pinterest?: {
    boardUrl: string;
    boardId: string;
  };
  accounting?: {
    system: string;
    projectCode: string;
    syncEnabled: boolean;
  };
  cad?: {
    software: string;
    projectPath: string;
    cloudEnabled: boolean;
  };
  communication?: {
    whatsappGroupId?: string;
    telegramGroupId?: string;
    slackChannelId?: string;
  };
}

export interface ResourceAllocation {
  resourceId: string;
  resourceType: 'human' | 'equipment' | 'material';
  quantity: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  cost: number;
  availability: 'available' | 'partial' | 'unavailable';
}

export interface QualityCheckpoint {
  id: string;
  name: string;
  criteria: string[];
  inspector: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  findings?: string;
  correctiveActions?: string[];
  evidence?: string[];
}

export interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'video' | 'signature';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  tags?: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
}

export interface AutomationTrigger {
  event: string;
  condition: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface Revision {
  version: number;
  changedBy: string;
  changedAt: Date;
  changes: string;
  reason: string;
}

export interface QualityCheck {
  id: string;
  checkType: string;
  passed: boolean;
  checkedBy: string;
  checkedAt: Date;
  comments?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: 'drawing' | 'document' | 'model' | 'report' | 'presentation';
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  dueDate: Date;
  submittedDate?: Date;
  approvedDate?: Date;
  files: string[];
  version: string;
}

export type ProjectPermission = 
  | 'view_project'
  | 'edit_project'
  | 'delete_project'
  | 'manage_team'
  | 'approve_designs'
  | 'approve_payments'
  | 'manage_budget'
  | 'create_tasks'
  | 'assign_tasks'
  | 'manage_timeline'
  | 'view_reports'
  | 'export_data';

// ==================== SOUTHEAST ASIAN CULTURAL DESIGN TYPES ====================

export interface CulturalPreferences {
  primaryCulture: 'malay' | 'chinese' | 'indian' | 'peranakan' | 'dayak' | 'iban' | 'kadazan' | 'orang_asli' | 'mixed' | 'contemporary';
  secondaryInfluences?: string[];
  religiousConsiderations?: 'islam' | 'buddhism' | 'hinduism' | 'christianity' | 'taoism' | 'none';
  fengShuiRequired?: boolean;
  vastuCompliance?: boolean;
  culturalColorPreferences?: ColorPalette;
  tabooElements?: string[];
  auspiciousElements?: string[];
  generationalLiving?: boolean;
  entertainmentStyle?: 'formal_hosting' | 'casual_gathering' | 'open_house' | 'private';
}

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  culturalMeaning?: { [color: string]: string };
  festivalColors?: { [festival: string]: string[] };
  avoidColors?: string[];
}

export interface ClimateDesignFeatures {
  ventilation_strategy: 'cross_ventilation' | 'stack_effect' | 'wind_tower' | 'mechanical_assist' | 'hybrid';
  sun_shading_required: boolean;
  rain_protection: 'elevated_design' | 'rain_gardens' | 'permeable_surfaces' | 'integrated_channels';
  humidity_control: 'natural_materials' | 'dehumidification' | 'moisture_barriers' | 'elevated_floors';
  thermal_comfort: 'high_ceilings' | 'thermal_mass' | 'insulation' | 'reflective_roofing';
  natural_lighting: boolean;
  outdoor_integration: boolean;
  climate_zone?: string;
  sustainability_priority?: 'low' | 'medium' | 'high';
  selected_shading_methods?: string[];
  effectiveness_score?: number;
  outdoorLiving: boolean;
  coveredOutdoorArea?: number; // in sqm
  naturalLightOptimization: boolean;
  monsoonAdaptations?: string[];
}

export interface LocalMaterial {
  id: string;
  name: string;
  type: 'timber' | 'stone' | 'textile' | 'metal' | 'ceramic' | 'natural_fiber' | 'composite';
  origin: string; // state or region
  supplier: string;
  sustainability: 'certified' | 'renewable' | 'reclaimed' | 'traditional' | 'standard';
  culturalRelevance?: string;
  climatesSuitability: 'excellent' | 'good' | 'moderate' | 'requires_treatment';
  maintenanceLevel: 'low' | 'medium' | 'high';
  costPerUnit: number;
  availability: 'readily_available' | 'seasonal' | 'special_order' | 'artisan_only';
}

export interface SpiritualSpace {
  id: string;
  type: 'prayer_room' | 'altar' | 'meditation' | 'pooja_room' | 'surau';
  religion?: string;
  orientation: string; // qibla, east-facing, etc.
  requirements: string[];
  size: number; // in sqm
  privacy: 'isolated' | 'semi_private' | 'integrated';
  specialFeatures?: string[]; // ablution area, bell, incense holder, etc.
}

export interface EntertainmentSpace {
  id: string;
  type: 'kenduri_area' | 'open_house_space' | 'mahjong_room' | 'karaoke' | 'outdoor_dining' | 'bbq_area';
  capacity: number;
  configuration: 'fixed' | 'flexible' | 'convertible';
  culturalEvents?: string[]; // Hari Raya, CNY, Deepavali, etc.
  specialRequirements?: string[];
}

export interface TraditionalElement {
  id: string;
  name: string;
  category: 'architectural' | 'decorative' | 'functional' | 'symbolic';
  origin: string; // Malay, Peranakan, Chinese, etc.
  description: string;
  placement?: string;
  materials?: string[];
  artisan?: ArtisanInfo;
  culturalStory?: string;
  maintenanceNotes?: string;
}

export interface ArtisanInfo {
  name: string;
  specialty: string;
  location: string;
  contact?: string;
  certifications?: string[];
  portfolioUrl?: string;
  leadTime?: number; // in days
  priceRange?: 'budget' | 'moderate' | 'premium' | 'luxury';
}

export interface MalaysianDesignStyle {
  id: string;
  name: string;
  category: 'traditional' | 'contemporary' | 'tropical_modern' | 'colonial' | 'fusion';
  description: string;
  keyElements: string[];
  colorSchemes: ColorPalette[];
  materials: LocalMaterial[];
  suitableFor: ('residential' | 'commercial' | 'hospitality' | 'institutional')[];
  culturalRoots?: string[];
  climateOptimized: boolean;
  examples?: string[]; // URLs to example projects
}

export interface CulturalDesignGuideline {
  id: string;
  culture: string;
  category: 'spatial' | 'material' | 'color' | 'symbolic' | 'functional';
  guideline: string;
  importance: 'mandatory' | 'recommended' | 'optional';
  explanation?: string;
  examples?: string[];
  avoidances?: string[];
}

export interface SeasonalDesign {
  season: 'monsoon' | 'dry' | 'festival' | 'year_round';
  considerations: string[];
  materialAdjustments?: string[];
  colorVariations?: ColorPalette;
  functionalAdaptations?: string[];
}

export interface HeritageCompliance {
  zoneType: 'unesco' | 'national_heritage' | 'state_heritage' | 'conservation' | 'none';
  restrictions: string[];
  allowedMaterials?: string[];
  prohibitedElements?: string[];
  approvalProcess?: string;
  consultationRequired?: string[];
}

// ==================== SCHEDULING & GANTT ====================

export interface GanttConfig {
  viewMode: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showDependencies: boolean;
  showCriticalPath: boolean;
  showMilestones: boolean;
  showResourceNames: boolean;
  showProgress: boolean;
  workingDays: number[];
  holidays: Holiday[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface Holiday {
  date: Date;
  name: string;
  type: 'federal' | 'state' | 'company';
}

export interface ResourceLeveling {
  method: 'automatic' | 'manual';
  constraints: ResourceConstraint[];
  optimizationGoal: 'duration' | 'cost' | 'resource_utilization';
  results?: LevelingResult[];
}

export interface ResourceConstraint {
  resourceId: string;
  maxAllocation: number;
  availability: AvailabilityPeriod[];
}

export interface AvailabilityPeriod {
  startDate: Date;
  endDate: Date;
  availability: number; // percentage
}

export interface LevelingResult {
  taskId: string;
  originalStart: Date;
  originalEnd: Date;
  leveledStart: Date;
  leveledEnd: Date;
  reason: string;
}

// ==================== PROCUREMENT & MATERIALS ====================

export interface ProcurementItem {
  id: string;
  projectId: string;
  category: string;
  name: string;
  description: string;
  specifications: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  suppliers: Supplier[];
  selectedSupplier?: string;
  purchaseOrder?: PurchaseOrder;
  deliveryTracking?: DeliveryTracking;
  qualityInspection?: QualityInspection;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  quotation?: SupplierQuotation;
  rating: number;
  leadTime: number;
  paymentTerms: string;
}

export interface SupplierQuotation {
  id: string;
  supplierId: string;
  unitPrice: number;
  totalPrice: number;
  validUntil: Date;
  deliveryTime: number;
  warranty?: string;
  notes?: string;
}

export interface PurchaseOrder {
  poNumber: string;
  supplierId: string;
  items: POItem[];
  totalAmount: number;
  orderDate: Date;
  expectedDelivery: Date;
  paymentTerms: string;
  status: 'draft' | 'approved' | 'sent' | 'acknowledged' | 'fulfilled' | 'cancelled';
  approvedBy?: string;
  approvalDate?: Date;
}

export interface POItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryTracking {
  expectedDate: Date;
  actualDate?: Date;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'delayed';
  trackingNumber?: string;
  carrier?: string;
  deliveryNotes?: string;
  receivedBy?: string;
}

export interface QualityInspection {
  inspectionDate: Date;
  inspector: string;
  status: 'passed' | 'failed' | 'conditional';
  findings: string;
  photos?: string[];
  certificateUrl?: string;
}

// ==================== DAILY OPERATIONS ====================

export interface DailyBriefing {
  id: string;
  date: Date;
  projectId: string;
  teamMembers: string[];
  agenda: BriefingItem[];
  actionItems: ActionItem[];
  generatedAt: Date;
  acknowledgedBy: AcknowledgedUser[];
}

export interface BriefingItem {
  category: 'task' | 'deadline' | 'meeting' | 'issue' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  assignedTo?: string[];
  dueTime?: Date;
}

export interface ActionItem {
  id: string;
  task: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  evidence?: string[];
}

export interface AcknowledgedUser {
  userId: string;
  acknowledgedAt: Date;
  platform: 'web' | 'mobile' | 'email' | 'whatsapp';
}

export interface ProgressReview {
  id: string;
  date: Date;
  projectId: string;
  reviewer: string;
  tasksCompleted: string[];
  tasksInProgress: string[];
  tasksDelayed: string[];
  issues: Issue[];
  evidenceUploaded: Evidence[];
  overallProgress: number;
  nextDayPriorities: string[];
  approvalStatus: 'pending' | 'approved' | 'needs_revision';
  approvedBy?: string;
  approvalComments?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'resource' | 'schedule' | 'quality' | 'client';
  raisedBy: string;
  raisedAt: Date;
  assignedTo?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolvedAt?: Date;
}

// ==================== REPORTING & ANALYTICS ====================

export interface ProjectReport {
  id: string;
  projectId: string;
  type: ReportType;
  generatedAt: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  format: 'pdf' | 'excel' | 'powerpoint' | 'interactive';
  distribution: string[];
  schedule?: ReportSchedule;
}

export type ReportType = 
  | 'progress'
  | 'financial'
  | 'resource_utilization'
  | 'quality'
  | 'risk'
  | 'client_satisfaction'
  | 'timeline_adherence'
  | 'executive_summary';

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
}

export interface KPI {
  id: string;
  name: string;
  category: string;
  formula: string;
  target: number;
  actual: number;
  trend: 'improving' | 'stable' | 'declining';
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
}

export interface ClientSatisfactionSurvey {
  id: string;
  projectId: string;
  clientId: string;
  sentDate: Date;
  completedDate?: Date;
  overallRating: number;
  categories: {
    communication: number;
    quality: number;
    timeliness: number;
    professionalism: number;
    value: number;
  };
  feedback?: string;
  improvements?: string[];
  wouldRecommend: boolean;
}

// ==================== COMPLIANCE TRACKING SYSTEM ====================

export interface ComplianceRule {
  id: string;
  code: string; // e.g., "UBBL-123.4"
  category: ComplianceCategory;
  title: string;
  description: string;
  requirement: string;
  applicableFor: ProjectType[];
  severity: 'mandatory' | 'recommended' | 'advisory';
  authority: ComplianceAuthority;
  lastUpdated: Date;
  effectiveDate: Date;
  supersededBy?: string;
  relatedClauses: string[];
  penalties?: CompliancePenalty[];
  checklistItems: ComplianceChecklistItem[];
}

export interface ComplianceChecklistItem {
  id: string;
  description: string;
  required: boolean;
  documentRequired?: string;
  calculationRequired?: string;
  inspectionRequired?: boolean;
}

export interface CompliancePenalty {
  type: 'fine' | 'suspension' | 'revocation' | 'warning';
  amount?: number;
  description: string;
  appealProcess?: string;
}

export type ComplianceCategory = 
  | 'building_planning'
  | 'structural_safety'
  | 'fire_safety'
  | 'accessibility'
  | 'environmental'
  | 'health_safety'
  | 'energy_efficiency'
  | 'heritage_conservation'
  | 'parking_traffic'
  | 'services_utilities'
  | 'general_provisions';

export type ComplianceAuthority = 
  | 'DBKL'
  | 'MBPJ'
  | 'MPSJ' 
  | 'MPK'
  | 'MPPP'
  | 'MBIP'
  | 'JKR'
  | 'BOMBA'
  | 'TNB'
  | 'IWK'
  | 'DOE'
  | 'DOSH'
  | 'PWD'
  | 'HERITAGE_DEPARTMENT'
  | 'STATE_AUTHORITY';

export type ProjectType = 
  | 'residential_low_rise'
  | 'residential_high_rise'
  | 'commercial_retail'
  | 'commercial_office'
  | 'industrial_light'
  | 'industrial_heavy'
  | 'institutional_education'
  | 'institutional_healthcare'
  | 'mixed_development'
  | 'renovation_alteration'
  | 'heritage_restoration';

export interface ProjectCompliance {
  id: string;
  projectId: string;
  projectType: ProjectType;
  applicableRules: string[]; // ComplianceRule IDs
  complianceChecks: ComplianceCheck[];
  overallStatus: ComplianceStatus;
  lastAssessment: Date;
  nextReviewDate: Date;
  assignedOfficer: string;
  submissionHistory: ComplianceSubmission[];
  exemptions: ComplianceExemption[];
  deviations: ComplianceDeviation[];
}

export interface ComplianceCheck {
  id: string;
  ruleId: string;
  status: ComplianceCheckStatus;
  checkedBy: string;
  checkedAt: Date;
  evidence: Evidence[];
  comments?: string;
  checklistResponses: ChecklistResponse[];
  calculatedValues?: ComplianceCalculation[];
  nonComplianceReason?: string;
  correctiveActions?: CorrectiveAction[];
  reviewRequired?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface ChecklistResponse {
  itemId: string;
  compliant: boolean;
  value?: string | number;
  document?: string;
  notes?: string;
}

export interface ComplianceCalculation {
  parameter: string;
  value: number;
  unit: string;
  requirement: number;
  compliant: boolean;
  formula?: string;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
  evidence?: Evidence[];
}

export type ComplianceCheckStatus = 
  | 'not_started'
  | 'in_progress' 
  | 'compliant'
  | 'non_compliant'
  | 'requires_review'
  | 'exempted'
  | 'not_applicable';

export type ComplianceStatus = 
  | 'fully_compliant'
  | 'mostly_compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'under_review'
  | 'pending_submission';

export interface ComplianceSubmission {
  id: string;
  submissionType: 'initial' | 'revision' | 'additional_info' | 'response';
  submittedTo: ComplianceAuthority;
  submittedBy: string;
  submittedAt: Date;
  documents: ComplianceDocument[];
  status: SubmissionStatus;
  trackingNumber?: string;
  response?: AuthorityResponse;
  fees?: SubmissionFee[];
}

export interface ComplianceDocument {
  id: string;
  type: DocumentType;
  title: string;
  url: string;
  version: string;
  uploadedBy: string;
  uploadedAt: Date;
  signed: boolean;
  signedBy?: string;
  signedAt?: Date;
  relatedRules: string[];
}

export type DocumentType = 
  | 'architectural_plan'
  | 'structural_plan'
  | 'mep_plan'
  | 'site_plan'
  | 'calculation_report'
  | 'specification'
  | 'compliance_checklist'
  | 'certificate'
  | 'approval_letter'
  | 'inspection_report'
  | 'test_report'
  | 'declaration'
  | 'supporting_document';

export type SubmissionStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'approved_with_conditions'
  | 'rejected'
  | 'requires_revision'
  | 'additional_info_required'
  | 'expired'
  | 'withdrawn';

export interface AuthorityResponse {
  id: string;
  authority: ComplianceAuthority;
  responseType: 'approval' | 'conditional_approval' | 'rejection' | 'clarification_request';
  responseDate: Date;
  comments: string;
  conditions?: AuthorityCondition[];
  nextSteps?: string;
  appealDeadline?: Date;
  documents: string[];
}

export interface AuthorityCondition {
  id: string;
  condition: string;
  category: 'technical' | 'procedural' | 'documentation';
  priority: 'mandatory' | 'advisory';
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  evidence?: Evidence[];
}

export interface SubmissionFee {
  type: 'application' | 'processing' | 'inspection' | 'certification' | 'penalty';
  amount: number;
  currency: string;
  description: string;
  paidAt?: Date;
  receiptNumber?: string;
}

export interface ComplianceExemption {
  id: string;
  ruleId: string;
  reason: string;
  justification: string;
  grantedBy: string;
  grantedAt: Date;
  validUntil?: Date;
  conditions?: string[];
  documents: string[];
}

export interface ComplianceDeviation {
  id: string;
  ruleId: string;
  deviationType: 'minor' | 'major' | 'alternative_solution';
  description: string;
  justification: string;
  proposedSolution: string;
  riskAssessment: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  conditions?: string[];
  monitoringRequired?: boolean;
}

export interface ComplianceAlert {
  id: string;
  projectId: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  ruleIds?: string[];
  triggeredBy: string;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actionRequired?: boolean;
  dueDate?: Date;
}

export type AlertType = 
  | 'non_compliance_detected'
  | 'submission_overdue'
  | 'approval_expiring'
  | 'inspection_required'
  | 'document_missing'
  | 'calculation_error'
  | 'rule_update'
  | 'authority_response'
  | 'corrective_action_overdue';

export interface ComplianceReport {
  id: string;
  projectId: string;
  type: ComplianceReportType;
  generatedAt: Date;
  generatedBy: string;
  reportPeriod?: {
    start: Date;
    end: Date;
  };
  summary: ComplianceSummary;
  details: any; // Report-specific data structure
  format: 'pdf' | 'excel' | 'json';
  url?: string;
  distribution: string[];
}

export type ComplianceReportType = 
  | 'compliance_status'
  | 'non_compliance_summary'
  | 'submission_tracking'
  | 'authority_correspondence'
  | 'corrective_actions'
  | 'exemptions_deviations'
  | 'inspection_schedule'
  | 'compliance_timeline';

export interface ComplianceSummary {
  totalRules: number;
  compliantRules: number;
  nonCompliantRules: number;
  pendingRules: number;
  exemptedRules: number;
  compliancePercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
}

export interface ComplianceTemplate {
  id: string;
  name: string;
  projectType: ProjectType;
  authority: ComplianceAuthority;
  applicableRules: string[];
  standardDocuments: DocumentTemplate[];
  checklistTemplate: ComplianceChecklistItem[];
  calculationTemplates: CalculationTemplate[];
  createdBy: string;
  createdAt: Date;
  version: string;
  active: boolean;
}

export interface DocumentTemplate {
  type: DocumentType;
  title: string;
  description: string;
  required: boolean;
  template?: string; // URL to template file
  instructions?: string;
}

export interface CalculationTemplate {
  id: string;
  name: string;
  description: string;
  parameters: CalculationParameter[];
  formula: string;
  unit: string;
  validationRules: ValidationRule[];
}

export interface CalculationParameter {
  name: string;
  description: string;
  type: 'number' | 'dimension' | 'area' | 'volume' | 'percentage';
  unit?: string;
  required: boolean;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
}

export interface ValidationRule {
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ==================== UBBL SPECIFIC TYPES ====================

export interface UBBLClause {
  id: string;
  clauseNumber: string; // e.g., "123.4.1"
  section: string;
  subSection?: string;
  title: string;
  content: string;
  applicableBuildings: ProjectType[];
  measurements?: UBBLMeasurement[];
  calculations?: UBBLCalculation[];
  exceptions?: string[];
  crossReferences: string[];
  lastAmended?: Date;
  effectiveDate: Date;
}

export interface UBBLMeasurement {
  parameter: string;
  minValue?: number;
  maxValue?: number;
  unit: string;
  condition?: string;
}

export interface UBBLCalculation {
  name: string;
  formula: string;
  parameters: string[];
  result: string;
  example?: string;
}

// ==================== MULTI-FACTOR AUTHENTICATION ====================

export interface MFASettings {
  isEnabled: boolean;
  primaryMethod: MFAMethod;
  backupMethods: MFAMethod[];
  backupCodes: BackupCode[];
  lastUpdated: Date;
  trustedDevices: TrustedDevice[];
  recoveryEmail?: string;
  recoveryPhone?: string;
}

export interface MFAMethod {
  id: string;
  type: MFAType;
  name: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  lastUsed?: Date;
  // Method-specific data
  phoneNumber?: string;
  email?: string;
  secretKey?: string; // For TOTP apps
  deviceId?: string;
}

export type MFAType = 
  | 'sms'
  | 'email'
  | 'totp' // Time-based One-Time Password (Google Authenticator, etc.)
  | 'push' // Push notification
  | 'hardware_key' // YubiKey, etc.
  | 'backup_codes';

export interface BackupCode {
  id: string;
  code: string;
  used: boolean;
  usedAt?: Date;
  usedFrom?: string; // IP address or device info
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  ipAddress: string;
  location?: string;
  addedAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAType;
  challengeCode: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isCompleted: boolean;
  completedAt?: Date;
  ipAddress: string;
  userAgent: string;
}

export interface MFAVerificationResult {
  success: boolean;
  method: MFAType;
  challengeId: string;
  remainingAttempts?: number;
  nextAttemptIn?: number; // seconds
  backupMethodsAvailable?: MFAType[];
  errorMessage?: string;
}

export interface MFASetupRequest {
  userId: string;
  method: MFAType;
  phoneNumber?: string;
  email?: string;
  deviceName?: string;
}

export interface MFASetupResponse {
  success: boolean;
  method: MFAType;
  qrCodeUrl?: string; // For TOTP setup
  secretKey?: string; // For manual TOTP entry
  backupCodes?: string[];
  verificationRequired: boolean;
  challengeId?: string;
}

export interface LoginAttempt {
  id: string;
  userId: string;
  success: boolean;
  ipAddress: string;
  location?: string;
  device: string;
  browser: string;
  mfaUsed: boolean;
  mfaMethod?: MFAType;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high';
  blockedReason?: string;
}

export interface SecurityAlert {
  id: string;
  userId: string;
  type: SecurityAlertType;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  metadata: Record<string, any>;
}

export type SecurityAlertType = 
  | 'suspicious_login'
  | 'new_device_login'
  | 'failed_mfa_attempts'
  | 'mfa_disabled'
  | 'backup_codes_used'
  | 'password_changed'
  | 'email_changed'
  | 'phone_changed'
  | 'account_locked';