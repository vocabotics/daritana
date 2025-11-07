// Malaysian Regulatory Compliance Type Definitions
// Extends the base platform with Malaysian-specific requirements

import { Project, User } from './index';

// ==================== REGULATORY COMPLIANCE ====================

export interface UBBLComplianceCheck {
  projectId: string;
  checkType: 'automatic' | 'manual' | 'hybrid';
  byLawSections: UBBLSection[];
  certificationLevel: 'self-certified' | 'professional-certified' | 'authority-verified';
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface UBBLSection {
  section: string;
  clause: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'pending_review' | 'not_applicable';
  evidence: string[]; // Drawing references, calculations
  reviewerNotes?: string;
  reviewerId?: string;
  lastChecked: Date;
}

// Key UBBL sections for automated checking
export const UBBL_SECTIONS = {
  SPACE_LIGHT_VENTILATION: {
    code: 'Part_III',
    bylaws: ['39', '40', '41', '42', '43', '44'],
    requirements: {
      naturalLighting: 0.1, // 10% of floor area
      naturalVentilation: 0.05, // 5% of floor area
      kitchenVentilation: 0.2, // 20% of kitchen floor area
      bathroomVentilation: 0.2, // 20% of bathroom floor area
    }
  },
  STRUCTURAL: {
    code: 'Part_V',
    bylaws: ['53-102'],
    loadings: {
      residential: 1.5, // kN/m²
      office: 2.5,
      retail: 4.0,
      parking: 2.5,
    }
  },
  FIRE_REQUIREMENTS: {
    code: 'Part_VII',
    bylaws: ['134-249'],
    escapeRoutes: {
      maxTravelDistance: 45, // meters
      minCorridorWidth: 1.2, // meters
      minStairWidth: 1.15, // meters
      maxDeadEnd: 15, // meters
    }
  }
};

// ==================== LOCAL AUTHORITY SUBMISSIONS ====================

export interface AuthoritySubmission {
  submissionId: string;
  projectId: string;
  authority: LocalAuthority;
  submissionType: SubmissionType;
  stage: SubmissionStage;
  documents: SubmissionDocument[];
  fees: SubmissionFee;
  timeline: SubmissionTimeline;
  tracking: TrackingInfo;
}

export type SubmissionType = 
  | 'BP' // Building Plan
  | 'CCC' // Certificate of Completion and Compliance
  | 'DO' // Development Order
  | 'CP' // Certificate of Fitness
  | 'Amendment'
  | 'Renewal';

export type SubmissionStage = 
  | 'pre-submission'
  | 'document-check'
  | 'technical-review'
  | 'committee-review'
  | 'payment-pending'
  | 'approved'
  | 'rejected'
  | 'additional-info-required';

export interface LocalAuthority {
  code: string; // e.g., 'DBKL', 'MBPJ', 'MBSA'
  name: string;
  state: MalaysianState;
  submissionPortal?: string;
  apiEndpoint?: string;
  specificRequirements: AuthorityRequirements;
}

export interface AuthorityRequirements {
  plotRatioCalculation: 'gross' | 'net';
  setbackRequirements: {
    front: number;
    side: number;
    rear: number;
  };
  densityLimit: number;
  heightRestriction: number;
  parkingRequirements: {
    residential: number; // per unit
    commercial: number; // per 100sqm
    handicapped: number; // percentage
  };
  greenRequirements?: {
    minimumGreenArea: number; // percentage
    treePreservation: boolean;
  };
}

export interface SubmissionDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  format: 'PDF' | 'DWG' | 'DXF';
  scale?: string;
  paperSize?: 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
  stampRequired: boolean;
  professionalStamp?: ProfessionalStamp;
  uploadDate: Date;
  status: 'uploaded' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export type DocumentType = 
  | 'location_plan'
  | 'site_plan'
  | 'floor_plan'
  | 'elevation'
  | 'section'
  | 'structural_plan'
  | 'mne_plan'
  | 'calculation'
  | 'report'
  | 'form';

// ==================== PROFESSIONAL REGISTRATION ====================

export interface ProfessionalStamp {
  professionalId: string;
  registrationBody: ProfessionalBody;
  registrationNumber: string;
  stampType: 'digital' | 'physical-scanned';
  validityPeriod: {
    startDate: Date;
    endDate: Date;
  };
  stampImage: string; // Base64 or URL
  digitalCertificate?: DigitalCertificate;
  usageLog: StampUsage[];
}

export type ProfessionalBody = 
  | 'PAM' // Pertubuhan Akitek Malaysia
  | 'BEM' // Board of Engineers Malaysia
  | 'IEM' // Institution of Engineers Malaysia
  | 'BQSM' // Board of Quantity Surveyors Malaysia
  | 'LJT' // Lembaga Juruukur Tanah
  | 'MSID' // Malaysian Society of Interior Designers
  | 'ACEM' // Association of Consulting Engineers Malaysia';

export interface DigitalCertificate {
  issuer: string;
  certificateHash: string;
  publicKey: string;
  algorithm: 'RSA' | 'ECDSA';
  blockchainRecord?: string;
}

export interface StampUsage {
  drawingId: string;
  documentId: string;
  timestamp: Date;
  ipAddress: string;
  verificationCode: string;
  purpose: 'submission' | 'certification' | 'approval';
}

// ==================== FIRE SAFETY (BOMBA) ====================

export interface BOMBACompliance {
  projectId: string;
  buildingCategory: BuildingCategory;
  occupancyType: string; // As per Seventh Schedule UBBL
  fireRequirements: FireRequirements;
  certificateStatus: 'pending' | 'approved' | 'conditional' | 'rejected';
  inspectionSchedule: FireInspection[];
  complianceOfficer?: {
    name: string;
    registrationNo: string;
  };
}

export type BuildingCategory = 
  | 'low-rise' // <4 floors
  | 'medium-rise' // 4-6 floors
  | 'high-rise' // >6 floors
  | 'super-high-rise' // >30 floors
  | 'special' // Assembly, institutional
  | 'hazardous'; // Industrial with hazardous materials

export interface FireRequirements {
  activeProtection: {
    sprinklerSystem: boolean;
    sprinklerType?: 'wet' | 'dry' | 'pre-action' | 'deluge';
    fireAlarmSystem: 'conventional' | 'addressable' | 'wireless';
    smokeDetection: 'point' | 'beam' | 'aspirating';
    fireHydrants: number;
    hosereels: number;
    fireExtinguishers: {
      type: string;
      quantity: number;
      locations: string[];
    }[];
  };
  passiveProtection: {
    fireRating: number; // hours
    compartmentSize: number; // square meters
    escapeRoutes: number;
    escapeStairs: {
      quantity: number;
      type: 'protected' | 'fire-fighting';
      pressurization: boolean;
    };
    assemblyPoints: string[];
    fireLift: boolean;
    refugeFloors?: number[];
  };
  emergencyLighting: {
    exitSigns: number;
    escapeRouteLighting: boolean;
    duration: number; // hours
  };
}

export interface FireInspection {
  inspectionId: string;
  scheduledDate: Date;
  actualDate?: Date;
  inspector?: string;
  type: 'initial' | 'progress' | 'final' | 'periodic';
  findings: string[];
  status: 'scheduled' | 'completed' | 'failed';
  certificateIssued?: string;
}

// ==================== ENVIRONMENTAL COMPLIANCE ====================

export interface EIARequirements {
  projectId: string;
  assessmentType: 'EIA' | 'PEIA' | 'TOR' | 'exempt';
  landArea: number; // hectares
  activities: ScheduledActivity[];
  environmentalImpacts: EnvironmentalImpact[];
  mitigationMeasures: MitigationMeasure[];
  publicConsultation?: PublicConsultation;
  approvalStatus: EIAStatus;
  conditions: string[];
  monitoringPlan?: EnvironmentalMonitoring;
}

export interface ScheduledActivity {
  category: string; // First or Second Schedule
  activity: string;
  threshold: string;
  applicable: boolean;
}

export interface EnvironmentalImpact {
  category: 'air' | 'water' | 'noise' | 'waste' | 'ecology' | 'social';
  impact: string;
  significance: 'low' | 'medium' | 'high';
  reversible: boolean;
}

export interface MitigationMeasure {
  impactId: string;
  measure: string;
  cost: number;
  timeline: string;
  effectiveness: 'low' | 'medium' | 'high';
  monitoringRequired: boolean;
}

export type EIAStatus = 
  | 'screening'
  | 'scoping'
  | 'assessment'
  | 'review'
  | 'approved'
  | 'approved-conditional'
  | 'rejected';

// ==================== CONTRACT MANAGEMENT (PAM 2018) ====================

export interface PAMContract2018 {
  contractId: string;
  projectId: string;
  contractType: 'with-quantities' | 'without-quantities';
  parties: ContractParties;
  contractSum: ContractSum;
  timeline: ContractTimeline;
  securities: ContractSecurities;
  insurance: ContractInsurance;
  certificates: ContractCertificates;
  variations: VariationOrder[];
}

export interface ContractParties {
  employer: ContractParty;
  contractor: ContractParty;
  architect: ContractParty;
  quantitySurveyor?: ContractParty;
  engineers: {
    structural?: ContractParty;
    mechanical?: ContractParty;
    electrical?: ContractParty;
    civil?: ContractParty;
  };
  nominatedSubcontractors?: ContractParty[];
}

export interface ContractParty {
  name: string;
  registrationNo?: string;
  address: string;
  representative: string;
  contact: {
    email: string;
    phone: string;
  };
}

export interface ContractSum {
  original: number;
  provisional: number;
  primeCoast: number;
  attendances: number;
  contingencies: number;
  variations: number;
  current: number;
  currency: 'MYR';
  breakdown?: BillOfQuantities;
}

export interface ContractTimeline {
  commencementDate: Date;
  originalCompletionDate: Date;
  revisedCompletionDate?: Date;
  extensions: ExtensionOfTime[];
  actualCompletionDate?: Date;
  defectsLiabilityPeriod: number; // months
  liquidatedDamages: number; // per day
  bonusForEarlyCompletion?: number; // per day
}

export interface ExtensionOfTime {
  eotNo: string;
  applicationDate: Date;
  reason: string;
  relevantEvent: string; // Clause reference
  daysRequested: number;
  daysGranted: number;
  approvalDate?: Date;
  newCompletionDate: Date;
}

export interface ContractSecurities {
  performanceBond: {
    amount: number; // typically 5% of contract sum
    type: 'bank-guarantee' | 'insurance-bond' | 'cash';
    provider: string;
    bondNo: string;
    validUntil: Date;
  };
  retentionSum: {
    percentage: number; // typically 10%
    limit: number; // typically 5% of contract sum
    firstMoiety: {
      percentage: 50;
      releaseCondition: 'practical-completion';
      released?: boolean;
    };
    secondMoiety: {
      percentage: 50;
      releaseCondition: 'defects-liability-expired';
      released?: boolean;
    };
  };
}

export interface VariationOrder {
  voNumber: string;
  date: Date;
  initiatedBy: 'architect' | 'employer' | 'contractor';
  description: string;
  reason: string;
  drawings?: string[];
  omissions: number;
  additions: number;
  netAmount: number;
  timeImplication?: number; // days
  status: 'draft' | 'submitted' | 'approved' | 'disputed';
  approvedBy?: string;
  approvalDate?: Date;
  supportingDocuments: string[];
}

// ==================== PAYMENT SYSTEMS ====================

export interface MalaysianPaymentIntegration {
  fpx: FPXIntegration;
  creditCard: CreditCardIntegration;
  eWallet: EWalletIntegration;
  corporatePayment: CorporatePaymentIntegration;
  taxCompliance: TaxCompliance;
}

export interface FPXIntegration {
  enabled: boolean;
  merchantId: string;
  banks: FPXBank[];
  transactionLimit: number;
  b2b?: boolean; // Corporate FPX
}

export interface FPXBank {
  code: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
}

export interface EWalletIntegration {
  providers: EWalletProvider[];
  qrCode: boolean;
  deepLink: boolean;
}

export interface EWalletProvider {
  name: 'GrabPay' | 'TouchNGo' | 'Boost' | 'MAE' | 'ShopeePay';
  merchantId: string;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
}

export interface CorporatePaymentIntegration {
  jompay: {
    billerCode: string;
    ref1Field: string; // Project reference
    ref2Field?: string; // Invoice reference
  };
  ibg: {
    enabled: boolean;
    bankAccount: string;
    bankCode: string;
    scheduledPayments: boolean;
  };
  corporateCreditCard: boolean;
}

export interface TaxCompliance {
  sstRegistration?: string;
  sstRate: number; // 0.06 for 6% Service Tax
  incomeTaxNo?: string;
  eInvoicing: {
    enabled: boolean;
    myInvoisId?: string;
    format: 'JSON' | 'XML';
  };
}

// ==================== LOCALIZATION ====================

export interface MalaysianLocalization {
  languages: SupportedLanguage[];
  measurements: MeasurementSystem;
  culturalConsiderations: CulturalDesignConsiderations;
  businessPractices: LocalBusinessPractices;
}

export interface SupportedLanguage {
  code: 'ms-MY' | 'en-MY' | 'zh-CN' | 'ta-MY';
  name: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
}

export interface MeasurementSystem {
  area: {
    primary: 'square-meter' | 'square-feet';
    display: 'metric' | 'imperial' | 'both';
    conversion: number;
  };
  floorAreaCalculation: {
    method: 'strata' | 'gross' | 'net' | 'carpet';
    strataInclusions: {
      balcony: number; // percentage included
      airconLedge: boolean;
      carpark: boolean;
    };
  };
}

export interface CulturalDesignConsiderations {
  religiousSpaces: {
    prayerRoom: {
      required: boolean;
      area: number; // minimum sqm
      qiblaDirection: number; // degrees from north
      ablutionArea: boolean;
      genderSeparation: boolean;
    };
  };
  fengShui: {
    considered: boolean;
    consultation?: string;
    recommendations: string[];
  };
  tropicalDesign: {
    orientation: string;
    crossVentilation: boolean;
    sunShading: {
      horizontal: number; // depth in mm
      vertical: number;
    };
    monsoonConsiderations: boolean;
  };
}

export interface LocalBusinessPractices {
  workingDays: string[]; // Different for different states
  publicHolidays: {
    federal: string[];
    state: string[];
  };
  paymentTerms: {
    standard: number; // days
    retention: number; // percentage
    progressPayment: boolean;
  };
  contractLanguage: 'english' | 'malay' | 'bilingual';
}

// ==================== ENUMS AND CONSTANTS ====================

export type MalaysianState = 
  | 'Johor'
  | 'Kedah'
  | 'Kelantan'
  | 'Melaka'
  | 'Negeri Sembilan'
  | 'Pahang'
  | 'Pulau Pinang'
  | 'Perak'
  | 'Perlis'
  | 'Selangor'
  | 'Terengganu'
  | 'Sabah'
  | 'Sarawak'
  | 'WP Kuala Lumpur'
  | 'WP Labuan'
  | 'WP Putrajaya';

export const AUTHORITY_CODES: Record<string, LocalAuthority> = {
  'DBKL': {
    code: 'DBKL',
    name: 'Dewan Bandaraya Kuala Lumpur',
    state: 'WP Kuala Lumpur',
    submissionPortal: 'https://submit.dbkl.gov.my',
    specificRequirements: {
      plotRatioCalculation: 'gross',
      setbackRequirements: { front: 6, side: 3, rear: 3 },
      densityLimit: 128,
      heightRestriction: 0,
      parkingRequirements: {
        residential: 2,
        commercial: 1,
        handicapped: 0.02
      }
    }
  },
  'MBPJ': {
    code: 'MBPJ',
    name: 'Majlis Bandaraya Petaling Jaya',
    state: 'Selangor',
    submissionPortal: 'https://epbt.mbpj.gov.my',
    specificRequirements: {
      plotRatioCalculation: 'net',
      setbackRequirements: { front: 6, side: 2, rear: 3 },
      densityLimit: 100,
      heightRestriction: 0,
      parkingRequirements: {
        residential: 2,
        commercial: 1.5,
        handicapped: 0.02
      }
    }
  }
  // Add more authorities as needed
};

// ==================== HELPER TYPES ====================

export interface SubmissionFee {
  calculationType: 'area-based' | 'unit-based' | 'fixed' | 'percentage';
  baseAmount: number;
  processingFee: number;
  inspectionFee?: number;
  totalAmount: number;
  currency: 'MYR';
  paymentStatus: 'pending' | 'paid' | 'verified' | 'refunded';
  paymentDate?: Date;
  receiptNo?: string;
  paymentMethod?: 'fpx' | 'credit-card' | 'bank-transfer' | 'counter';
}

export interface SubmissionTimeline {
  submittedDate: Date;
  acknowledgedDate?: Date;
  targetApprovalDate: Date; // Based on authority SLA
  actualApprovalDate?: Date;
  extensions?: {
    reason: string;
    days: number;
    approvedBy: string;
  }[];
  overdueAlert?: boolean;
}

export interface TrackingInfo {
  referenceNo: string;
  onlineTracking?: string;
  currentHandler?: string;
  lastUpdate: Date;
  nextAction?: string;
  publicComments?: string[];
  internalNotes?: string[];
}

export interface BillOfQuantities {
  preliminaries: number;
  substructure: number;
  superstructure: number;
  finishes: number;
  services: number;
  external: number;
  contingencies: number;
  professionalFees: number;
}

export interface ContractInsurance {
  contractorAllRisk: Insurance;
  publicLiability: Insurance;
  workmenCompensation: Insurance;
  professionalIndemnity?: Insurance;
}

export interface Insurance {
  policyNo: string;
  insurer: string;
  coverage: number;
  excess: number;
  validFrom: Date;
  validTo: Date;
  verified: boolean;
}

export interface ContractCertificates {
  interimPayments: PaymentCertificate[];
  practicalCompletion?: CompletionCertificate;
  makingGoodDefects?: Certificate;
  finalCertificate?: FinalCertificate;
}

export interface PaymentCertificate {
  certificateNo: string;
  date: Date;
  period: { from: Date; to: Date };
  workDone: number;
  materials: number;
  variations: number;
  totalClaim: number;
  retention: number;
  previousPayments: number;
  netPayment: number;
  status: 'draft' | 'issued' | 'paid';
}

export interface CompletionCertificate {
  certificateNo: string;
  date: Date;
  completionDate: Date;
  defectsLiabilityPeriod: number;
  defectsIdentified: string[];
  retentionRelease: number;
}

export interface Certificate {
  certificateNo: string;
  type: string;
  date: Date;
  details: string;
  attachments: string[];
}

export interface FinalCertificate {
  certificateNo: string;
  date: Date;
  finalSum: number;
  totalPayments: number;
  balance: number;
  retentionReleased: boolean;
}

export interface EnvironmentalMonitoring {
  parameters: {
    type: string;
    frequency: string;
    method: string;
    standard: string;
    limit: number;
  }[];
  reportingSchedule: string;
  responsibleParty: string;
}

export interface PublicConsultation {
  dates: Date[];
  venues: string[];
  attendance: number;
  feedback: string[];
  responseDocument?: string;
}