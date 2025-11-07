// Enhanced UBBL Types for World-Class Compliance System
// Supporting bilingual content, AI integration, and academic features

export interface UBBLClause {
  id: string;
  clause_number: string; // e.g., "12.3.4", "123A"
  part_number: number; // 1-12
  part_title_en: string;
  part_title_ms: string;
  section_number?: string;
  subsection_number?: string;
  
  // Bilingual Content
  title_en: string;
  title_ms: string;
  content_en: string;
  content_ms: string;
  
  // PDF References
  pdf_page_start?: number;
  pdf_page_end?: number;
  pdf_section_reference?: string;
  pdf_bookmark?: string;
  
  // Legal Information
  effective_date: Date;
  last_amended?: Date;
  amendment_history: UBBLAmendment[];
  
  // Application Scope
  applicable_building_types: BuildingType[];
  applicable_building_heights?: { min?: number; max?: number };
  applicable_occupancies: string[];
  geographic_scope: string[];
  
  // Complexity Indicators
  calculation_required: boolean;
  has_exceptions: boolean;
  complexity_level: 1 | 2 | 3 | 4 | 5;
  
  // Relationships
  parent_clause_id?: string;
  related_clauses: string[];
  superseded_by?: string;
  
  // Metadata
  keywords: string[];
  tags: string[];
  priority_level: 'critical' | 'high' | 'standard' | 'low';
  
  // Rich Content
  explainers?: UBBLExplainer[];
  calculators?: UBBLCalculator[];
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface UBBLExplainer {
  id: string;
  clause_id: string;
  language: 'en' | 'ms';
  
  // Rich Content
  explanation_html: string;
  simplified_explanation?: string; // For students/beginners
  technical_notes?: string; // For professionals
  
  // Examples and Cases
  examples: UBBLExample[];
  case_studies: UBBLCaseStudy[];
  common_violations: UBBLViolation[];
  best_practices: UBBLBestPractice[];
  
  // Visual Content
  diagrams: UBBLDiagram[];
  photos: UBBLPhoto[];
  videos: UBBLVideo[];
  
  // Academic Content
  learning_objectives: string[];
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  estimated_read_time: number; // minutes
  
  // Authorship
  author_name?: string;
  reviewer_name?: string;
  review_date?: Date;
  version: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface UBBLCalculator {
  id: string;
  clause_id: string;
  calculator_type: CalculatorType;
  
  // Calculator Configuration
  name_en: string;
  name_ms: string;
  description_en?: string;
  description_ms?: string;
  
  // Input/Output Configuration
  input_parameters: CalculatorParameter[];
  calculation_formula: string; // JavaScript formula
  validation_rules: Record<string, any>;
  output_format: CalculatorOutput;
  
  // Units and Measurements
  default_units: 'metric' | 'imperial';
  supported_units: Record<string, boolean>;
  
  // UI Configuration
  ui_layout?: Record<string, any>;
  help_text_en?: string;
  help_text_ms?: string;
  
  // Features
  save_calculations: boolean;
  export_pdf: boolean;
  share_link: boolean;
  
  // Status
  is_active: boolean;
  version: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface UBBLAmendment {
  id: string;
  clause_id: string;
  
  amendment_number: string;
  amendment_date: Date;
  effective_date: Date;
  
  // Changes
  change_type: 'added' | 'modified' | 'deleted' | 'superseded';
  old_content_en?: string;
  new_content_en?: string;
  old_content_ms?: string;
  new_content_ms?: string;
  
  // Legal References
  gazette_reference?: string;
  legal_authority?: string;
  reason_for_change?: string;
  
  // Impact Assessment
  affected_projects: string[];
  transition_period?: number; // months
  
  created_at: Date;
}

export interface UBBLCitation {
  id: string;
  clause_id: string;
  
  // Citation Formats
  apa_format: string;
  mla_format: string;
  chicago_format: string;
  ieee_format: string;
  malaysian_legal_format?: string;
  
  // Digital References
  doi?: string;
  permalink: string;
  qr_code?: string;
  
  // Usage Statistics
  citation_count: number;
  last_cited?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// Supporting Types

export interface UBBLExample {
  id?: string;
  title: string;
  description: string;
  scenario: string;
  solution: string;
  building_type?: BuildingType;
  location?: string; // Malaysian state/city
  project_size?: string;
  images?: string[];
}

export interface UBBLCaseStudy {
  id?: string;
  title: string;
  project_name: string;
  location: string;
  building_type: BuildingType;
  challenge: string;
  solution: string;
  outcome: string;
  lessons_learned: string[];
  images?: string[];
  documents?: string[];
}

export interface UBBLViolation {
  id?: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  common_causes: string[];
  how_to_avoid: string[];
  penalty?: string;
  examples?: string[];
}

export interface UBBLBestPractice {
  id?: string;
  title: string;
  description: string;
  implementation_steps: string[];
  benefits: string[];
  cost_implications?: string;
  time_savings?: string;
  examples?: string[];
}

export interface UBBLDiagram {
  id?: string;
  title: string;
  description?: string;
  image_url: string;
  alt_text: string;
  annotations?: DiagramAnnotation[];
}

export interface UBBLPhoto {
  id?: string;
  title: string;
  description?: string;
  image_url: string;
  alt_text: string;
  location?: string;
  photographer?: string;
  date_taken?: Date;
}

export interface UBBLVideo {
  id?: string;
  title: string;
  description?: string;
  video_url: string;
  duration?: number; // seconds
  language: 'en' | 'ms' | 'both';
  subtitles?: string[];
}

export interface DiagramAnnotation {
  x: number;
  y: number;
  label: string;
  description?: string;
}

export interface CalculatorParameter {
  name: string;
  label_en: string;
  label_ms: string;
  type: 'number' | 'text' | 'select' | 'boolean' | 'date';
  required: boolean;
  default_value?: any;
  min_value?: number;
  max_value?: number;
  options?: { value: any; label_en: string; label_ms: string }[];
  unit?: string;
  help_text_en?: string;
  help_text_ms?: string;
}

export interface CalculatorOutput {
  type: 'number' | 'text' | 'table' | 'chart';
  label_en: string;
  label_ms: string;
  unit?: string;
  format?: string; // e.g., "0.00", "currency"
  description_en?: string;
  description_ms?: string;
}

export type CalculatorType = 
  | 'area_calculation'
  | 'height_calculation'
  | 'occupancy_calculation'
  | 'parking_calculation'
  | 'staircase_calculation'
  | 'exit_width_calculation'
  | 'ventilation_calculation'
  | 'lighting_calculation'
  | 'structural_load_calculation'
  | 'fire_rating_calculation'
  | 'energy_compliance';

export type BuildingType = 
  | 'residential_low_rise'
  | 'residential_high_rise'
  | 'commercial_retail'
  | 'commercial_office'
  | 'commercial_hotel'
  | 'industrial_light'
  | 'industrial_heavy'
  | 'institutional_school'
  | 'institutional_hospital'
  | 'institutional_government'
  | 'assembly_theater'
  | 'assembly_sports'
  | 'assembly_religious'
  | 'mixed_use'
  | 'special_purpose';

// AI and Advanced Features

export interface UBBLKnowledgeVector {
  id: string;
  clause_id: string;
  content_embedding_en: number[];
  content_embedding_ms?: number[];
  content_text_en: string;
  content_text_ms?: string;
  content_type: 'clause' | 'explainer' | 'example';
  semantic_tags: string[];
  confidence_score: number;
  embedding_model: string;
  last_processed: Date;
  created_at: Date;
}

export interface AIComplianceCheck {
  id: string;
  project_id: string;
  building_type: BuildingType;
  building_details: Record<string, any>;
  
  // AI Analysis Results
  applicable_clauses: string[];
  compliance_score: number;
  violations: AIViolation[];
  recommendations: AIRecommendation[];
  confidence_level: number;
  
  // Processing Details
  ai_model_used: string;
  processing_time: number;
  tokens_used: number;
  
  created_at: Date;
}

export interface AIViolation {
  clause_id: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  explanation: string;
  suggested_fix: string;
  confidence: number;
  references: string[];
}

export interface AIRecommendation {
  type: 'compliance' | 'optimization' | 'best_practice';
  title: string;
  description: string;
  implementation_steps: string[];
  estimated_cost?: string;
  estimated_time?: string;
  priority: 'high' | 'medium' | 'low';
  related_clauses: string[];
}

// Academic Features

export interface UBBLLearningModule {
  id: string;
  title_en: string;
  title_ms: string;
  description_en: string;
  description_ms: string;
  
  // Content Structure
  learning_objectives: string[];
  prerequisite_modules: string[];
  estimated_duration: number; // minutes
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  
  // Associated Clauses
  primary_clauses: string[];
  supporting_clauses: string[];
  
  // Content
  lessons: UBBLLesson[];
  assessments: UBBLAssessment[];
  resources: UBBLResource[];
  
  // Academic Integration
  university_programs: string[];
  course_codes: string[];
  credit_hours?: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface UBBLLesson {
  id: string;
  module_id: string;
  order: number;
  title_en: string;
  title_ms: string;
  content_html_en: string;
  content_html_ms: string;
  
  // Interactive Elements
  interactive_elements: InteractiveElement[];
  media_resources: MediaResource[];
  
  // Assessment
  self_check_questions: Question[];
  
  estimated_duration: number; // minutes
}

export interface UBBLAssessment {
  id: string;
  module_id: string;
  type: 'quiz' | 'assignment' | 'practical' | 'case_study';
  title_en: string;
  title_ms: string;
  description_en: string;
  description_ms: string;
  
  questions: Question[];
  passing_score: number;
  max_attempts: number;
  time_limit?: number; // minutes
  
  grading_rubric?: GradingRubric;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'calculation';
  question_text_en: string;
  question_text_ms: string;
  
  // For multiple choice
  options?: { id: string; text_en: string; text_ms: string; correct: boolean }[];
  
  // For calculations
  calculation_data?: CalculatorParameter[];
  
  points: number;
  explanation_en?: string;
  explanation_ms?: string;
  related_clauses: string[];
}

export interface InteractiveElement {
  id: string;
  type: 'calculator' | 'diagram' | 'simulation' | '3d_model' | 'ar_viewer';
  title: string;
  description: string;
  config: Record<string, any>;
}

export interface MediaResource {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | '3d_model';
  title: string;
  url: string;
  alt_text?: string;
  transcript?: string;
  language: 'en' | 'ms' | 'both';
}

export interface UBBLResource {
  id: string;
  type: 'document' | 'link' | 'tool' | 'template';
  title_en: string;
  title_ms: string;
  description_en?: string;
  description_ms?: string;
  url: string;
  file_type?: string;
  file_size?: number;
  language: 'en' | 'ms' | 'both';
}

export interface GradingRubric {
  criteria: RubricCriterion[];
  total_points: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  levels: RubricLevel[];
  weight: number;
}

export interface RubricLevel {
  name: string;
  description: string;
  points: number;
}

// API Response Types

export interface UBBLSearchResult {
  clauses: UBBLClause[];
  total_count: number;
  search_metadata: {
    query: string;
    language: 'en' | 'ms' | 'both';
    filters: Record<string, any>;
    sort_by: string;
    sort_order: 'asc' | 'desc';
    search_time: number;
  };
  suggestions: string[];
}

export interface UBBLComplianceReport {
  id: string;
  project_id: string;
  building_details: Record<string, any>;
  
  // Compliance Results
  overall_score: number;
  applicable_clauses: UBBLClause[];
  compliance_status: 'compliant' | 'partial' | 'non_compliant';
  
  // Issues and Recommendations
  violations: UBBLViolation[];
  recommendations: AIRecommendation[];
  
  // Report Metadata
  generated_by: 'ai' | 'manual' | 'hybrid';
  generated_at: Date;
  language: 'en' | 'ms' | 'both';
  format: 'pdf' | 'html' | 'json';
  
  // Academic Features
  educational_notes?: string[];
  related_learning_modules?: string[];
  
  // Professional Features
  submission_ready: boolean;
  authority_specific_notes?: Record<string, string[]>;
  estimated_approval_time?: number; // days
}

export interface UniversityIntegration {
  university_id: string;
  university_name: string;
  contact_email: string;
  
  // Course Integration
  integrated_courses: CourseIntegration[];
  
  // Access Control
  student_access_level: 'basic' | 'standard' | 'premium';
  faculty_access_level: 'standard' | 'premium' | 'full';
  
  // Features
  custom_branding: boolean;
  assessment_integration: boolean;
  grade_book_sync: boolean;
  lms_integration: boolean;
  
  // Billing
  subscription_type: 'free' | 'educational' | 'enterprise';
  student_count: number;
  faculty_count: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface CourseIntegration {
  course_id: string;
  course_name: string;
  course_code: string;
  instructor: string;
  semester: string;
  
  // UBBL Integration
  assigned_modules: string[];
  custom_assessments: string[];
  
  // Statistics
  student_enrollment: number;
  completion_rate: number;
  average_score: number;
  
  active: boolean;
}

// Export all types as a namespace
export * from './ubbl';