// ============================================
// Construction Monitoring Types
// ============================================

export interface ConstructionSite {
  id: string;
  project_id: string;
  organization_id: string;
  site_code: string;
  site_name: string;
  site_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'mixed';
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  site_area_sqm?: number;
  site_boundaries?: any; // GeoJSON
  site_manager_id?: string;
  safety_officer_id?: string;
  quality_inspector_id?: string;
  groundbreaking_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  handover_date?: string;
  status: 'planning' | 'site_prep' | 'foundation' | 'structure' | 'mep' | 'finishing' | 'inspection' | 'completed' | 'handed_over';
  is_active: boolean;
  weather_station_id?: string;
  iot_enabled: boolean;
  iot_devices?: IoTDevice[];
  whatsapp_group_id?: string;
  whatsapp_group_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConstructionPhase {
  id: string;
  site_id: string;
  phase_code: string;
  phase_name: string;
  phase_type: string;
  sequence_order: number;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  progress_percentage: number;
  weight_factor: number;
  predecessor_phases?: string[];
  successor_phases?: string[];
  key_milestones?: Milestone[];
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';
  delay_reasons?: string[];
  quality_checkpoints?: QualityCheckpoint[];
  inspection_required: boolean;
  inspection_status?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProgressUpdate {
  id: string;
  site_id: string;
  phase_id?: string;
  update_type: 'daily' | 'hourly' | 'milestone' | 'incident' | 'weather' | 'automated';
  recorded_at: string;
  recorded_by?: string;
  overall_progress?: number;
  phase_progress?: number;
  work_completed?: string;
  work_planned_next?: string;
  workers_present?: number;
  workers_by_trade?: Record<string, number>;
  contractor_teams?: ContractorTeam[];
  equipment_on_site?: EquipmentStatus[];
  equipment_utilization?: number;
  materials_received?: MaterialDelivery[];
  materials_used?: MaterialUsage[];
  material_issues?: string[];
  weather_conditions?: WeatherCondition;
  weather_delays?: boolean;
  weather_impact_hours?: number;
  issues_encountered?: string[];
  safety_incidents?: number;
  quality_issues?: number;
  ai_progress_verification?: number;
  ai_anomalies_detected?: string[];
  ai_recommendations?: string[];
  ai_confidence_score?: number;
  photos?: string[];
  videos?: string[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Material {
  id: string;
  site_id: string;
  material_code: string;
  material_name: string;
  category?: string;
  unit_of_measure?: string;
  planned_quantity?: number;
  ordered_quantity?: number;
  delivered_quantity?: number;
  used_quantity?: number;
  waste_quantity?: number;
  remaining_quantity?: number;
  supplier_name?: string;
  supplier_contact?: Record<string, any>;
  purchase_order_number?: string;
  expected_delivery?: string;
  actual_delivery?: string;
  delivery_note_number?: string;
  qr_code?: string;
  quality_cert_number?: string;
  test_results?: Record<string, any>;
  approved_by?: string;
  rejection_reason?: string;
  unit_cost?: number;
  total_cost?: number;
  currency: string;
  storage_location?: string;
  storage_conditions?: string;
  status: 'planned' | 'ordered' | 'in_transit' | 'delivered' | 'in_use' | 'completed' | 'rejected';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  site_id: string;
  worker_id: string;
  name: string;
  ic_number?: string;
  passport_number?: string;
  company_name?: string;
  trade?: string;
  skill_level?: 'apprentice' | 'skilled' | 'supervisor' | 'master';
  safety_card_number?: string;
  safety_card_expiry?: string;
  medical_cert_expiry?: string;
  safety_training?: SafetyTraining[];
  ppe_issued?: PPEItem[];
  total_days_worked: number;
  last_check_in?: string;
  last_check_out?: string;
  productivity_score?: number;
  quality_score?: number;
  safety_violations: number;
  fingerprint_enrolled: boolean;
  face_enrolled: boolean;
  is_active: boolean;
  blacklisted: boolean;
  blacklist_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkerAttendance {
  id: string;
  site_id: string;
  worker_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  overtime_hours?: number;
  work_location?: string;
  tasks_assigned?: string[];
  tasks_completed?: string[];
  check_in_method?: 'biometric' | 'qr' | 'manual';
  check_in_photo_url?: string;
  check_in_location?: {
    lat: number;
    lng: number;
  };
  safety_briefing_attended: boolean;
  ppe_check_passed: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Inspection {
  id: string;
  site_id: string;
  phase_id?: string;
  inspection_type: string;
  inspection_code: string;
  scheduled_date?: string;
  actual_date?: string;
  inspector_name?: string;
  inspector_company?: string;
  inspector_id?: string;
  checklist_template?: ChecklistTemplate;
  checklist_results?: ChecklistResult;
  total_items_checked?: number;
  items_passed?: number;
  items_failed?: number;
  critical_issues: number;
  major_issues: number;
  minor_issues: number;
  compliance_score?: number;
  safety_score?: number;
  quality_score?: number;
  corrective_actions?: CorrectiveAction[];
  preventive_actions?: PreventiveAction[];
  deadline_for_actions?: string;
  report_url?: string;
  photos?: string[];
  certificates_issued?: Certificate[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'reinspection_required';
  reinspection_date?: string;
  signed_by?: string;
  signature_url?: string;
  signed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SiteMedia {
  id: string;
  site_id: string;
  progress_update_id?: string;
  media_type: 'photo' | 'video' | 'panorama' | 'timelapse' | 'drone';
  file_name: string;
  file_size?: number;
  mime_type?: string;
  storage_url: string;
  thumbnail_url?: string;
  captured_at: string;
  captured_by?: string;
  device_info?: Record<string, any>;
  capture_location?: {
    lat: number;
    lng: number;
  };
  capture_area?: string;
  view_angle?: string;
  ai_processed: boolean;
  ai_processed_at?: string;
  ai_detected_objects?: AIDetectedObjects;
  ai_progress_detected?: number;
  ai_safety_issues?: AISafetyIssue[];
  ai_quality_issues?: AIQualityIssue[];
  ai_comparison_baseline?: string;
  ai_change_percentage?: number;
  tags?: string[];
  phase?: string;
  area?: string;
  is_verified: boolean;
  verified_by?: string;
  verification_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Equipment {
  id: string;
  site_id: string;
  equipment_code: string;
  equipment_name: string;
  category?: string;
  model?: string;
  serial_number?: string;
  ownership_type?: 'owned' | 'rented' | 'leased';
  owner_company?: string;
  rental_rate_per_day?: number;
  current_location?: string;
  gps_tracker_id?: string;
  last_gps_update?: string;
  total_hours_used: number;
  fuel_consumption_total?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_hours_remaining?: number;
  operational_status: 'available' | 'in_use' | 'maintenance' | 'breakdown' | 'off_site';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EquipmentUsage {
  id: string;
  equipment_id: string;
  site_id: string;
  usage_date: string;
  operator_id?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number;
  idle_hours?: number;
  productive_hours?: number;
  tasks_performed?: string[];
  work_area?: string;
  fuel_consumed?: number;
  breakdowns: number;
  breakdown_details?: BreakdownDetail[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WeatherLog {
  id: string;
  site_id: string;
  recorded_at: string;
  temperature_celsius?: number;
  humidity_percent?: number;
  wind_speed_kmh?: number;
  wind_direction?: string;
  rainfall_mm?: number;
  precipitation_type?: string;
  weather_condition?: string;
  visibility_km?: number;
  uv_index?: number;
  air_quality_index?: number;
  work_impact: 'none' | 'minor' | 'moderate' | 'severe' | 'stop_work';
  affected_activities?: string[];
  delay_hours?: number;
  data_source?: 'api' | 'manual' | 'iot_sensor';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Incident {
  id: string;
  site_id: string;
  incident_code: string;
  incident_type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical' | 'fatal';
  occurred_at: string;
  reported_at: string;
  reported_by?: string;
  location?: string;
  description: string;
  people_involved?: PersonInvolved[];
  injuries: number;
  fatalities: number;
  root_cause?: string;
  contributing_factors?: string[];
  investigation_status?: string;
  investigator_name?: string;
  immediate_actions?: string[];
  corrective_actions?: CorrectiveAction[];
  preventive_measures?: string[];
  reported_to_authorities: boolean;
  authority_reference?: string;
  insurance_claim_number?: string;
  estimated_cost?: number;
  actual_cost?: number;
  downtime_hours?: number;
  photos?: string[];
  reports?: IncidentReport[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  closed_at?: string;
  closed_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  site_id: string;
  message_id: string;
  from_number: string;
  from_name?: string;
  to_number?: string;
  message_type?: string;
  message_text?: string;
  media_url?: string;
  processed: boolean;
  processed_at?: string;
  ai_category?: string;
  ai_sentiment?: string;
  ai_entities?: Record<string, any>;
  ai_action_required: boolean;
  ai_priority?: string;
  linked_to_update?: string;
  linked_to_incident?: string;
  received_at: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIPrediction {
  id: string;
  site_id: string;
  prediction_type: string;
  prediction_date: string;
  model_name?: string;
  model_version?: string;
  training_date?: string;
  predicted_value: any;
  confidence_score?: number;
  probability_distribution?: Record<string, number>;
  contributing_factors?: Record<string, any>;
  risk_factors?: Record<string, any>;
  recommendations?: string[];
  mitigation_strategies?: MitigationStrategy[];
  actual_value?: any;
  accuracy_score?: number;
  validated_at?: string;
  alert_level?: 'info' | 'warning' | 'critical';
  alert_sent: boolean;
  alert_acknowledged: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================
// Supporting Types
// ============================================

export interface IoTDevice {
  device_id: string;
  device_type: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  last_reading?: string;
}

export interface Milestone {
  name: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
}

export interface QualityCheckpoint {
  name: string;
  criteria: string;
  passed?: boolean;
  checked_date?: string;
  checked_by?: string;
}

export interface ContractorTeam {
  company: string;
  trade: string;
  workers: number;
  supervisor: string;
}

export interface EquipmentStatus {
  equipment_id: string;
  equipment_name: string;
  status: string;
  location: string;
}

export interface MaterialDelivery {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  delivery_note: string;
}

export interface MaterialUsage {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  area: string;
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: string;
  visibility: number;
}

export interface SafetyTraining {
  training_name: string;
  completion_date: string;
  certificate_number: string;
  expiry_date?: string;
}

export interface PPEItem {
  item_type: string;
  issued_date: string;
  size?: string;
  condition: string;
}

export interface ChecklistTemplate {
  name: string;
  version: string;
  categories: ChecklistCategory[];
}

export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  description: string;
  requirement: string;
  critical: boolean;
}

export interface ChecklistResult {
  template_id: string;
  results: ItemResult[];
}

export interface ItemResult {
  item_id: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
  evidence?: string[];
}

export interface CorrectiveAction {
  id: string;
  description: string;
  responsible_party: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PreventiveAction {
  id: string;
  description: string;
  implementation_date: string;
  effectiveness_review?: string;
}

export interface Certificate {
  type: string;
  number: string;
  issued_date: string;
  expiry_date?: string;
}

export interface AIDetectedObjects {
  workers?: number;
  equipment?: string[];
  materials?: string[];
  safety_equipment?: string[];
  vehicles?: string[];
  hazards?: string[];
}

export interface AISafetyIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  confidence: number;
}

export interface AIQualityIssue {
  type: string;
  severity: 'minor' | 'major' | 'critical';
  location: string;
  description: string;
  confidence: number;
}

export interface BreakdownDetail {
  time: string;
  duration_minutes: number;
  issue: string;
  resolution?: string;
}

export interface PersonInvolved {
  name: string;
  role: string;
  company?: string;
  injury_type?: string;
  medical_treatment?: string;
}

export interface IncidentReport {
  type: string;
  file_url: string;
  submitted_to: string;
  submitted_date: string;
}

export interface MitigationStrategy {
  strategy: string;
  cost_estimate: number;
  time_impact_days: number;
  effectiveness_score: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface ConstructionDashboard {
  site: ConstructionSite;
  overall_progress: number;
  phases: ConstructionPhase[];
  recent_updates: ProgressUpdate[];
  statistics: {
    workers_present: number;
    equipment_active: number;
    materials: {
      materials_delivered: number;
      materials_in_transit: number;
      materials_low_stock: number;
    };
    incidents_this_week: number;
  };
  weather: WeatherLog | null;
  progress_trend: ProgressTrend[];
  upcoming_inspections: Inspection[];
  ai_predictions: AIPrediction[];
}

export interface ProgressTrend {
  date: string;
  progress: number;
}

export interface WorkerStatistics {
  total_workers: number;
  workers_today: number;
  avg_hours_per_day: number;
  total_hours_worked: number;
}

export interface EquipmentStatistics {
  category: string;
  count: number;
  avg_utilization: number;
}

export interface MaterialStatistics {
  total_materials: number;
  delivered: number;
  ordered: number;
  critical_stock: number;
  total_material_value: number;
}

export interface SafetyStatistics {
  total_incidents: number;
  critical_incidents: number;
  safety_incidents: number;
  incidents_today: number;
}