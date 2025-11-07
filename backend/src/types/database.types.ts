/**
 * Database Types for Daritana Architecture Platform
 * Auto-generated from PostgreSQL schema
 */

// ============================================
// CORE TYPES - User Management & Authentication
// ============================================

export interface Organization {
  id: string;
  code: string;
  name: string;
  type: 'architecture_firm' | 'interior_design' | 'contractor' | 'client_company';
  registration_number?: string;
  tax_id?: string;
  address?: Address;
  contact_info?: ContactInfo;
  settings: Record<string, any>;
  subscription_tier: string;
  subscription_expires_at?: Date;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  organization_id?: string;
  email: string;
  username?: string;
  password_hash?: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  ic_number?: string; // Malaysian IC
  professional_id?: string; // LAM/PAM registration
  avatar_url?: string;
  department?: string;
  position?: string;
  permissions: Permission[];
  preferences: UserPreferences;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: Date;
  last_activity_at?: Date;
  password_changed_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'client' | 'staff' | 'contractor' | 'project_lead' | 'designer' | 'admin' | 'super_admin';

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash?: string;
  device_info?: DeviceInfo;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  refresh_expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  last_accessed_at: Date;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  resource: string;
  action: string;
  conditions: Record<string, any>;
  created_at: Date;
}

// ============================================
// PROJECT TYPES - Project Management
// ============================================

export interface Project {
  id: string;
  organization_id: string;
  project_code: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  phase?: string;
  client_id?: string;
  project_lead_id?: string;
  designer_id?: string;
  
  // Location & Site
  address: Address;
  coordinates?: { lat: number; lng: number };
  land_area_sqm?: number;
  built_up_area_sqm?: number;
  
  // Timeline
  start_date?: Date;
  target_completion_date?: Date;
  actual_completion_date?: Date;
  
  // Financial
  budget_amount?: number;
  currency: string;
  contract_value?: number;
  
  // Malaysian Compliance
  submission_type?: string;
  local_authority?: string;
  approval_status?: string;
  approval_reference?: string;
  
  // Settings & Metadata
  settings: ProjectSettings;
  tags: string[];
  priority: Priority;
  risk_level: RiskLevel;
  metadata: Record<string, any>;
  is_active: boolean;
  is_archived: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'renovation' | 'interior_design' | 'landscape';
export type ProjectStatus = 'planning' | 'design' | 'approval' | 'construction' | 'completed' | 'on_hold' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  responsibilities: string[];
  access_level: 'read' | 'write' | 'admin';
  joined_at: Date;
  left_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id?: string;
  task_code?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  
  // Assignment
  assigned_to?: string;
  assigned_by?: string;
  
  // Timeline
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  completed_at?: Date;
  
  // Progress
  progress_percentage: number;
  checklist: ChecklistItem[];
  
  // Dependencies
  dependencies: string[];
  blocks: string[];
  
  // Context
  location?: string;
  tags: string[];
  labels: Label[];
  
  // Metadata
  metadata: Record<string, any>;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type TaskType = 'task' | 'milestone' | 'phase' | 'deliverable';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed' | 'cancelled';

export interface DesignBrief {
  id: string;
  project_id: string;
  version: number;
  title: string;
  
  // Requirements
  client_requirements?: string;
  design_style?: string;
  color_preferences: string[];
  material_preferences: string[];
  
  // Spatial
  space_planning?: SpacePlanning;
  room_requirements?: RoomRequirements;
  functional_requirements?: string;
  
  // Technical
  technical_specs?: TechnicalSpecs;
  sustainability_requirements?: string;
  accessibility_requirements?: string;
  
  // Budget & Timeline
  design_budget?: number;
  material_budget?: number;
  timeline_requirements?: string;
  
  // Inspiration
  mood_boards: MoodBoard[];
  reference_projects: string[];
  
  // Approval
  status: BriefStatus;
  approved_by?: string;
  approved_at?: Date;
  
  metadata: Record<string, any>;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type BriefStatus = 'draft' | 'review' | 'approved' | 'revision' | 'rejected';

export interface ProjectTimeline {
  id: string;
  project_id: string;
  phase: string;
  milestone: string;
  description?: string;
  planned_start?: Date;
  planned_end?: Date;
  actual_start?: Date;
  actual_end?: Date;
  status: string;
  dependencies: string[];
  deliverables: Deliverable[];
  responsible_party?: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
  notes?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// FINANCE TYPES - Financial Management
// ============================================

export interface Quotation {
  id: string;
  organization_id: string;
  project_id?: string;
  quotation_number: string;
  version: number;
  client_id?: string;
  
  // Financial
  items: QuotationItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  
  // Terms
  payment_terms?: string;
  validity_period: number;
  valid_until?: Date;
  terms_conditions?: string;
  
  // Status
  status: QuotationStatus;
  sent_at?: Date;
  viewed_at?: Date;
  accepted_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'revised';

export interface Invoice {
  id: string;
  organization_id: string;
  project_id?: string;
  quotation_id?: string;
  invoice_number: string;
  client_id?: string;
  
  // Financial
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Payment
  payment_terms?: string;
  due_date?: Date;
  status: InvoiceStatus;
  paid_amount: number;
  balance_amount?: number;
  
  // Dates
  issued_date?: Date;
  sent_at?: Date;
  viewed_at?: Date;
  paid_at?: Date;
  
  // Malaysian Tax
  sst_registered: boolean;
  sst_number?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id?: string;
  payment_number: string;
  
  // Payment Details
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: Date;
  
  // Transaction
  transaction_id?: string;
  bank_reference?: string;
  payment_gateway?: string;
  gateway_response?: Record<string, any>;
  
  // Status
  status: PaymentStatus;
  
  // Receipt
  receipt_number?: string;
  receipt_url?: string;
  
  notes?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'credit_card' | 'fpx' | 'jompay' | 'ewallet' | 'other';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// ============================================
// COMPLIANCE TYPES - Malaysian Regulatory
// ============================================

export interface UBBLChecklist {
  id: string;
  project_id: string;
  category: string;
  clause_number: string;
  clause_title: string;
  description?: string;
  requirement: string;
  compliance_status: ComplianceStatus;
  evidence_required: string[];
  evidence_provided: Evidence[];
  reviewed_by?: string;
  reviewed_at?: Date;
  comments?: string;
  action_required?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type ComplianceStatus = 'pending' | 'compliant' | 'non_compliant' | 'not_applicable' | 'in_progress';

export interface AuthoritySubmission {
  id: string;
  project_id: string;
  submission_type: string; // BP, CCC, CP, OP
  authority: string; // DBKL, MBPJ, MBSA
  reference_number?: string;
  
  // Submission
  submission_date?: Date;
  submission_method?: string;
  portal_reference?: string;
  
  // Documents
  required_documents: RequiredDocument[];
  submitted_documents: SubmittedDocument[];
  
  // Status
  status: SubmissionStatus;
  current_stage?: string;
  expected_approval_date?: Date;
  actual_approval_date?: Date;
  
  // Fees
  submission_fee?: number;
  processing_fee?: number;
  total_fee?: number;
  payment_reference?: string;
  
  // Comments
  authority_comments?: string;
  rfi_details: RFIDetail[];
  internal_notes?: string;
  
  // Approval
  approval_number?: string;
  approval_conditions: string[];
  validity_period?: number;
  expires_at?: Date;
  
  metadata: Record<string, any>;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export type SubmissionStatus = 'preparing' | 'submitted' | 'in_review' | 'rfi' | 'approved' | 'rejected' | 'appealing';

export interface ProfessionalCompliance {
  id: string;
  project_id: string;
  board: 'LAM' | 'PAM' | 'BEM' | 'BQSM';
  registration_number?: string;
  scale_of_fees_version?: string;
  fee_calculation?: FeeCalculation;
  compliance_checklist: ComplianceItem[];
  submitted_by?: string;
  submitted_at?: Date;
  approved_by?: string;
  approved_at?: Date;
  certificate_number?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// DOCUMENT TYPES - Document Management
// ============================================

export interface Document {
  id: string;
  organization_id: string;
  project_id?: string;
  parent_id?: string; // For versioning
  
  // Document Info
  name: string;
  type: string;
  category?: string;
  mime_type?: string;
  file_size?: number;
  
  // Storage
  storage_provider: StorageProvider;
  storage_path: string;
  storage_url?: string;
  thumbnail_url?: string;
  
  // Version
  version: string;
  is_latest: boolean;
  version_notes?: string;
  
  // Security
  access_level: AccessLevel;
  encryption_key?: string;
  checksum?: string;
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  ocr_text?: string;
  
  // Sharing
  shared_with: string[];
  share_link?: string;
  share_expires_at?: Date;
  
  // Audit
  uploaded_by?: string;
  last_accessed_by?: string;
  last_accessed_at?: Date;
  download_count: number;
  
  // Status
  status: DocumentStatus;
  deleted_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

export type StorageProvider = 's3' | 'gcs' | 'local' | 'gdrive';
export type AccessLevel = 'public' | 'private' | 'restricted';
export type DocumentStatus = 'active' | 'archived' | 'deleted' | 'processing';

export interface DocumentApproval {
  id: string;
  document_id: string;
  approver_id: string;
  status: ApprovalStatus;
  comments?: string;
  conditions?: string;
  approved_at?: Date;
  signature_url?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional';

// ============================================
// INTEGRATION TYPES - External Systems
// ============================================

export interface GoogleDriveIntegration {
  id: string;
  user_id: string;
  organization_id: string;
  
  // OAuth
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  
  // Drive
  drive_email?: string;
  root_folder_id?: string;
  project_folders: Record<string, string>;
  
  // Sync
  sync_enabled: boolean;
  sync_frequency: SyncFrequency;
  last_sync_at?: Date;
  sync_status?: string;
  
  permissions: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type SyncFrequency = 'realtime' | 'hourly' | 'daily';

export interface WhatsAppIntegration {
  id: string;
  organization_id: string;
  
  // API
  phone_number_id?: string;
  business_account_id?: string;
  access_token?: string;
  webhook_verify_token?: string;
  
  // Config
  default_template_namespace?: string;
  templates: WhatsAppTemplate[];
  
  // Status
  status?: string;
  last_webhook_at?: Date;
  
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TelegramIntegration {
  id: string;
  organization_id: string;
  
  // Bot
  bot_token?: string;
  bot_username?: string;
  webhook_url?: string;
  
  // Channels
  channels: TelegramChannel[];
  notification_chat_id?: string;
  
  // Status
  status?: string;
  last_webhook_at?: Date;
  
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentGateway {
  id: string;
  organization_id: string;
  
  // Gateway
  provider: PaymentProvider;
  merchant_id?: string;
  
  // Credentials (encrypted)
  api_key_encrypted?: string;
  secret_key_encrypted?: string;
  webhook_secret?: string;
  
  // Config
  currency: string;
  test_mode: boolean;
  auto_capture: boolean;
  webhook_url?: string;
  
  // FPX
  fpx_seller_id?: string;
  fpx_exchange_id?: string;
  
  // Status
  is_active: boolean;
  last_webhook_at?: Date;
  
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type PaymentProvider = 'stripe' | 'fpx' | 'jompay' | 'ipay88' | 'paypal' | 'razorpay';

// ============================================
// AUDIT TYPES - Audit & Logging
// ============================================

export interface AuditLog {
  id: string;
  organization_id?: string;
  user_id?: string;
  
  // Action
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  
  // Changes
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changes?: Record<string, any>;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  
  // Result
  status?: string;
  error_message?: string;
  
  // Compliance
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: Date;
  
  created_at: Date;
}

export interface PrivacyLog {
  id: string;
  user_id?: string;
  
  // Request
  request_type: PrivacyRequestType;
  request_details?: Record<string, any>;
  
  // Processing
  status?: string;
  processed_by?: string;
  processed_at?: Date;
  
  // Response
  response_details?: Record<string, any>;
  data_provided?: Record<string, any>;
  
  // Compliance
  pdpa_article?: string;
  retention_period?: number;
  
  created_at: Date;
  updated_at: Date;
}

export type PrivacyRequestType = 'access' | 'rectification' | 'deletion' | 'portability';

// ============================================
// AI TYPES - AI Assistant & Automation
// ============================================

export interface AIConversation {
  id: string;
  user_id: string;
  project_id?: string;
  
  // Conversation
  title?: string;
  context?: string;
  model: string;
  
  // Messages
  messages: AIMessage[];
  total_tokens: number;
  
  // Status
  status?: string;
  last_message_at?: Date;
  
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AITemplate {
  id: string;
  organization_id?: string;
  
  // Template
  name: string;
  category: string;
  description?: string;
  
  // Content
  prompt_template: string;
  variables: TemplateVariable[];
  example_output?: string;
  
  // Config
  model_config: ModelConfig;
  max_tokens: number;
  temperature: number;
  
  // Usage
  usage_count: number;
  last_used_at?: Date;
  
  // Status
  is_active: boolean;
  is_public: boolean;
  
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DailyOperation {
  id: string;
  organization_id: string;
  
  // Operation
  operation_type: OperationType;
  scheduled_time: string; // Time format
  timezone: string;
  
  // Config
  enabled: boolean;
  recipients: string[];
  channels: NotificationChannels;
  
  // Template
  template_id?: string;
  custom_prompt?: string;
  
  // Execution
  last_run_at?: Date;
  next_run_at?: Date;
  run_count: number;
  
  // Results
  last_result?: Record<string, any>;
  success_rate?: number;
  
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type OperationType = 'morning_todo' | 'evening_evidence' | 'daily_review';

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  
  // Notification
  type: string;
  title: string;
  message?: string;
  
  // Context
  resource_type?: string;
  resource_id?: string;
  action_url?: string;
  
  // Delivery
  channels: NotificationChannel[];
  priority?: string;
  
  // Status
  is_read: boolean;
  read_at?: Date;
  is_archived: boolean;
  
  // Scheduling
  scheduled_for?: Date;
  sent_at?: Date;
  
  metadata: Record<string, any>;
  created_at: Date;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'telegram';

export interface Comment {
  id: string;
  
  // Polymorphic
  resource_type: string;
  resource_id: string;
  
  // Comment
  user_id: string;
  parent_comment_id?: string;
  content: string;
  
  // Mentions
  mentions: string[];
  tags: string[];
  
  // Attachments
  attachments: Attachment[];
  
  // Reactions
  reactions: Record<string, number>;
  
  // Status
  is_edited: boolean;
  edited_at?: Date;
  is_deleted: boolean;
  deleted_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SUPPORTING TYPES
// ============================================

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
}

export interface DeviceInfo {
  device_type?: string;
  device_name?: string;
  os?: string;
  browser?: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  theme?: string;
  notifications?: NotificationPreferences;
  dashboard_layout?: any;
}

export interface NotificationPreferences {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  telegram?: boolean;
  in_app?: boolean;
}

export interface ProjectSettings {
  auto_numbering?: boolean;
  task_prefix?: string;
  default_view?: string;
  notification_settings?: NotificationSettings;
}

export interface NotificationSettings {
  task_assigned?: boolean;
  task_completed?: boolean;
  project_updates?: boolean;
  document_uploaded?: boolean;
  comment_mentions?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: Date;
}

export interface Label {
  name: string;
  color: string;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  ends_on?: Date;
  occurrences?: number;
}

export interface SpacePlanning {
  total_area?: number;
  zones?: Zone[];
  circulation?: CirculationPlan;
}

export interface Zone {
  name: string;
  area: number;
  function: string;
  requirements?: string[];
}

export interface CirculationPlan {
  main_entrance?: string;
  secondary_entrances?: string[];
  vertical_circulation?: string[];
  emergency_exits?: string[];
}

export interface RoomRequirements {
  rooms: Room[];
  total_rooms?: number;
  special_requirements?: string[];
}

export interface Room {
  name: string;
  type: string;
  area?: number;
  occupancy?: number;
  requirements?: string[];
}

export interface TechnicalSpecs {
  structural?: string;
  electrical?: string;
  plumbing?: string;
  hvac?: string;
  fire_safety?: string;
  it_infrastructure?: string;
}

export interface MoodBoard {
  id: string;
  name: string;
  images: string[];
  colors: string[];
  materials?: string[];
  description?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  type: string;
  status: string;
  due_date?: Date;
  completed_at?: Date;
}

export interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  notes?: string;
}

export interface InvoiceItem extends QuotationItem {
  tax_rate?: number;
  discount?: number;
}

export interface Evidence {
  type: string;
  description?: string;
  document_id?: string;
  url?: string;
  uploaded_at: Date;
  uploaded_by?: string;
}

export interface RequiredDocument {
  name: string;
  type: string;
  mandatory: boolean;
  template_url?: string;
  notes?: string;
}

export interface SubmittedDocument {
  document_id: string;
  name: string;
  type: string;
  submitted_at: Date;
  status?: string;
}

export interface RFIDetail {
  id: string;
  date: Date;
  request: string;
  response?: string;
  responded_at?: Date;
  documents?: string[];
}

export interface FeeCalculation {
  base_fee: number;
  percentage?: number;
  additional_services?: AdditionalService[];
  total: number;
}

export interface AdditionalService {
  service: string;
  fee: number;
  description?: string;
}

export interface ComplianceItem {
  requirement: string;
  status: ComplianceStatus;
  evidence?: string;
  notes?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: any[];
  status?: string;
}

export interface TelegramChannel {
  id: string;
  name: string;
  type: 'channel' | 'group';
  chat_id: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface TemplateVariable {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default_value?: any;
}

export interface ModelConfig {
  model: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface NotificationChannels {
  email?: EmailConfig;
  whatsapp?: WhatsAppConfig;
  telegram?: TelegramConfig;
  sms?: SMSConfig;
}

export interface EmailConfig {
  enabled: boolean;
  template_id?: string;
  subject?: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  template_name?: string;
  parameters?: any[];
}

export interface TelegramConfig {
  enabled: boolean;
  chat_id?: string;
  parse_mode?: string;
}

export interface SMSConfig {
  enabled: boolean;
  template?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// ============================================
// QUERY INTERFACES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface QueryOptions {
  pagination?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams;
  include?: string[];
  fields?: string[];
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  request_id: string;
  version?: string;
  pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}