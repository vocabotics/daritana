import { create } from 'zustand';
import { 
  ubblSections, 
  checkCompliance, 
  type UBBLSection,
  type BuildingType,
  type ComplianceResult,
  type Violation,
  TOTAL_UBBL_CLAUSES 
} from '@/data/ubblClauses';
import { allUBBLClauses, getClausesBySection, getClausesByBuildingType } from '@/data/ubblComplete';
import { sampleUBBLClausesWithExplainers, ubblRealDataMetadata } from '@/data/ubblRealData';
import { allUBBLClausesWithExplainers, TOTAL_CLAUSES_WITH_EXPLAINERS } from '@/data/generated/allUBBLExplainers';
import type { UBBLClause, UBBLExplainer } from '@/types/ubbl';

interface ComplianceCheck {
  id: string;
  projectId: string;
  projectName: string;
  checkDate: Date;
  buildingType: BuildingType;
  buildingHeight: number;
  floorArea: number;
  occupancy: number;
  result: ComplianceResult;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  reviewer?: string;
  comments?: string;
  attachments?: string[];
}

interface ComplianceReport {
  id: string;
  projectId: string;
  generatedDate: Date;
  complianceScore: number;
  totalClauses: number;
  applicableClauses: number;
  violations: Violation[];
  recommendations: string[];
  certifiedBy?: string;
  validUntil?: Date;
}

interface UBBLComplianceState {
  // Data
  sections: UBBLSection[];
  complianceChecks: ComplianceCheck[];
  reports: ComplianceReport[];
  selectedCheck: ComplianceCheck | null;
  richClauses: UBBLClause[]; // Rich clauses with explainers
  selectedClause: UBBLClause | null;
  
  // UI State
  isLoading: boolean;
  searchQuery: string;
  filterBySection: string | null;
  filterByCategory: 'all' | 'mandatory' | 'conditional' | 'recommended';
  explainerLanguage: 'en' | 'ms';
  
  // Actions
  runComplianceCheck: (params: {
    projectId: string;
    projectName: string;
    buildingType: BuildingType;
    buildingHeight: number;
    floorArea: number;
    occupancy: number;
  }) => Promise<ComplianceCheck>;
  
  generateReport: (checkId: string) => Promise<ComplianceReport>;
  searchClauses: (query: string) => UBBLClause[];
  getClauseById: (id: string) => UBBLClause | undefined;
  getApplicableClauses: (buildingType: BuildingType) => UBBLClause[];
  updateCheckStatus: (checkId: string, status: ComplianceCheck['status']) => void;
  addViolation: (checkId: string, violation: Violation) => void;
  resolveViolation: (checkId: string, violationClauseId: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterSection: (section: string | null) => void;
  setFilterCategory: (category: typeof filterByCategory) => void;
  exportReport: (reportId: string) => Promise<Blob>;
  
  // Rich Explainer Actions
  selectClause: (clauseId: string) => void;
  getExplainerForClause: (clauseId: string, language?: 'en' | 'ms') => UBBLExplainer | null;
  setExplainerLanguage: (language: 'en' | 'ms') => void;
  searchRichClauses: (query: string) => UBBLClause[];
  getClausesWithExplainers: () => UBBLClause[];
  getClausesWithCalculators: () => UBBLClause[];
}

export const useUBBLComplianceStore = create<UBBLComplianceState>((set, get) => ({
  // Initial data
  sections: ubblSections,
  complianceChecks: generateMockChecks(),
  reports: generateMockReports(),
  selectedCheck: null,
  richClauses: allUBBLClausesWithExplainers,
  selectedClause: null,
  
  // UI State
  isLoading: false,
  searchQuery: '',
  filterBySection: null,
  filterByCategory: 'all',
  explainerLanguage: 'en',
  
  // Actions
  runComplianceCheck: async (params) => {
    set({ isLoading: true });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = checkCompliance(
      params.buildingType,
      params.buildingHeight,
      params.floorArea,
      params.occupancy
    );
    
    const newCheck: ComplianceCheck = {
      id: `check-${Date.now()}`,
      projectId: params.projectId,
      projectName: params.projectName,
      checkDate: new Date(),
      buildingType: params.buildingType,
      buildingHeight: params.buildingHeight,
      floorArea: params.floorArea,
      occupancy: params.occupancy,
      result,
      status: result.violations.length > 0 ? 'failed' : 'completed',
      reviewer: 'System Auto-Check'
    };
    
    set(state => ({
      complianceChecks: [...state.complianceChecks, newCheck],
      selectedCheck: newCheck,
      isLoading: false
    }));
    
    return newCheck;
  },
  
  generateReport: async (checkId) => {
    const check = get().complianceChecks.find(c => c.id === checkId);
    if (!check) throw new Error('Compliance check not found');
    
    set({ isLoading: true });
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const report: ComplianceReport = {
      id: `report-${Date.now()}`,
      projectId: check.projectId,
      generatedDate: new Date(),
      complianceScore: check.result.complianceScore,
      totalClauses: TOTAL_UBBL_CLAUSES,
      applicableClauses: check.result.applicableClauses.length,
      violations: check.result.violations,
      recommendations: check.result.recommendations,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Valid for 90 days
    };
    
    set(state => ({
      reports: [...state.reports, report],
      isLoading: false
    }));
    
    return report;
  },
  
  searchClauses: (query) => {
    const lowerQuery = query.toLowerCase();
    
    return allUBBLClauses.filter(clause => 
      clause.title.toLowerCase().includes(lowerQuery) ||
      clause.description.toLowerCase().includes(lowerQuery) ||
      clause.requirements.some(r => r.toLowerCase().includes(lowerQuery)) ||
      clause.id.toLowerCase().includes(lowerQuery)
    );
  },
  
  getClauseById: (id) => {
    return allUBBLClauses.find(c => c.id === id);
  },
  
  getApplicableClauses: (buildingType) => {
    return getClausesByBuildingType(buildingType);
  },
  
  updateCheckStatus: (checkId, status) => {
    set(state => ({
      complianceChecks: state.complianceChecks.map(check =>
        check.id === checkId ? { ...check, status } : check
      )
    }));
  },
  
  addViolation: (checkId, violation) => {
    set(state => ({
      complianceChecks: state.complianceChecks.map(check =>
        check.id === checkId
          ? {
              ...check,
              result: {
                ...check.result,
                violations: [...check.result.violations, violation],
                complianceScore: Math.max(
                  0,
                  check.result.complianceScore - (violation.severity === 'critical' ? 15 : 5)
                )
              },
              status: 'failed' as const
            }
          : check
      )
    }));
  },
  
  resolveViolation: (checkId, violationClauseId) => {
    set(state => ({
      complianceChecks: state.complianceChecks.map(check =>
        check.id === checkId
          ? {
              ...check,
              result: {
                ...check.result,
                violations: check.result.violations.filter(v => v.clauseId !== violationClauseId),
                complianceScore: Math.min(100, check.result.complianceScore + 10)
              },
              status: check.result.violations.length <= 1 ? 'completed' as const : 'failed' as const
            }
          : check
      )
    }));
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterSection: (section) => set({ filterBySection: section }),
  setFilterCategory: (category) => set({ filterByCategory: category }),
  
  exportReport: async (reportId) => {
    const report = get().reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');
    
    // Generate PDF blob (mock)
    const reportContent = `
UBBL COMPLIANCE REPORT
======================
Project ID: ${report.projectId}
Generated: ${report.generatedDate.toLocaleDateString()}
Valid Until: ${report.validUntil?.toLocaleDateString() || 'N/A'}

COMPLIANCE SCORE: ${report.complianceScore}%
Total UBBL Clauses: ${report.totalClauses}
Applicable Clauses: ${report.applicableClauses}

VIOLATIONS (${report.violations.length}):
${report.violations.map(v => `- ${v.clauseId}: ${v.description}`).join('\n')}

RECOMMENDATIONS:
${report.recommendations.map(r => `- ${r}`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    return blob;
  },

  // Rich Explainer Actions Implementation
  selectClause: (clauseId) => {
    const clause = get().richClauses.find(c => c.id === clauseId);
    set({ selectedClause: clause || null });
  },

  getExplainerForClause: (clauseId, language = 'en') => {
    const clause = get().richClauses.find(c => c.id === clauseId);
    if (!clause || !clause.explainers) return null;
    
    return clause.explainers.find(e => e.language === language) || clause.explainers[0] || null;
  },

  setExplainerLanguage: (language) => {
    set({ explainerLanguage: language });
  },

  searchRichClauses: (query) => {
    const lowerQuery = query.toLowerCase();
    const { richClauses } = get();
    
    return richClauses.filter(clause => 
      clause.title_en.toLowerCase().includes(lowerQuery) ||
      clause.title_ms.toLowerCase().includes(lowerQuery) ||
      clause.content_en.toLowerCase().includes(lowerQuery) ||
      clause.content_ms.toLowerCase().includes(lowerQuery) ||
      clause.keywords.some(k => k.toLowerCase().includes(lowerQuery)) ||
      clause.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      clause.clause_number.toLowerCase().includes(lowerQuery)
    );
  },

  getClausesWithExplainers: () => {
    return get().richClauses.filter(clause => 
      clause.explainers && clause.explainers.length > 0
    );
  },

  getClausesWithCalculators: () => {
    return get().richClauses.filter(clause => 
      clause.calculators && clause.calculators.length > 0
    );
  }
}));

// Mock data generators
function generateMockChecks(): ComplianceCheck[] {
  return [
    {
      id: 'check-1',
      projectId: 'proj-1',
      projectName: 'KLCC Tower Renovation',
      checkDate: new Date('2024-01-15'),
      buildingType: 'high-rise',
      buildingHeight: 88,
      floorArea: 50000,
      occupancy: 2000,
      result: {
        applicableClauses: [],
        violations: [
          {
            clauseId: 'ubbl-139',
            description: 'Inadequate fire fighting access width',
            severity: 'critical',
            requiredAction: 'Widen access road to minimum 6m'
          }
        ],
        complianceScore: 85,
        recommendations: [
          'Install additional fire hydrants',
          'Upgrade emergency lighting system'
        ]
      },
      status: 'failed',
      reviewer: 'Ahmad Ibrahim',
      comments: 'Fire safety improvements required'
    },
    {
      id: 'check-2',
      projectId: 'proj-2',
      projectName: 'Penang Heritage Shop',
      checkDate: new Date('2024-02-01'),
      buildingType: 'commercial',
      buildingHeight: 12,
      floorArea: 800,
      occupancy: 50,
      result: {
        applicableClauses: [],
        violations: [],
        complianceScore: 98,
        recommendations: [
          'Consider installing CCTV system',
          'Upgrade to LED emergency lighting'
        ]
      },
      status: 'completed',
      reviewer: 'Sarah Tan'
    }
  ];
}

function generateMockReports(): ComplianceReport[] {
  return [
    {
      id: 'report-1',
      projectId: 'proj-1',
      generatedDate: new Date('2024-01-20'),
      complianceScore: 85,
      totalClauses: TOTAL_UBBL_CLAUSES,
      applicableClauses: 156,
      violations: [
        {
          clauseId: 'ubbl-139',
          description: 'Inadequate fire fighting access width',
          severity: 'critical',
          requiredAction: 'Widen access road to minimum 6m'
        }
      ],
      recommendations: [
        'Install additional fire hydrants',
        'Upgrade emergency lighting system',
        'Conduct fire drill training'
      ],
      certifiedBy: 'Ir. Ahmad Ibrahim',
      validUntil: new Date('2024-04-20')
    }
  ];
}