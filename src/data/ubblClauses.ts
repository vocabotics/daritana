// Complete UBBL (Uniform Building By-Laws) 1984 - All 343 Clauses
// Malaysian Building Compliance Requirements

export interface UBBLSection {
  id: string;
  title: string;
  clauses: UBBLClause[];
}

export interface UBBLClause {
  id: string;
  section: string;
  title: string;
  description: string;
  requirements: string[];
  category: 'mandatory' | 'conditional' | 'recommended';
  applicableToTypes: BuildingType[];
  penalties?: string;
  references?: string[];
}

export type BuildingType = 
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'institutional'
  | 'assembly'
  | 'mixed-use'
  | 'high-rise'
  | 'low-rise';

// Import all clauses from complete database
import { 
  partI_preliminary,
  partII_planSubmission,
  partIII_spaceLightVentilation,
  partIV_temporaryWorks,
  partV_structural,
  partVI_constructional,
  partVII_fireRequirements,
  partVIII_fireSystemse,
  partIX_waterSanitation,
  partX_liftsEscalators,
  partXI_electricalGas,
  partXII_mechanical,
  allUBBLClauses,
  TOTAL_CLAUSES
} from './ubblComplete';

// Export all sections with complete clauses
export const ubblSections: UBBLSection[] = [
  {
    id: 'part-i',
    title: 'PART I - PRELIMINARY',
    clauses: partI_preliminary || []
  },
  {
    id: 'part-ii',
    title: 'PART II - SUBMISSION OF PLANS FOR APPROVAL',
    clauses: partII_planSubmission || []
  },
  {
    id: 'part-iii',
    title: 'PART III - SPACE, LIGHT AND VENTILATION',
    clauses: partIII_spaceLightVentilation || []
  },
  {
    id: 'part-iv',
    title: 'PART IV - TEMPORARY WORKS',
    clauses: partIV_temporaryWorks || []
  },
  {
    id: 'part-v',
    title: 'PART V - STRUCTURAL REQUIREMENTS',
    clauses: partV_structural || []
  },
  {
    id: 'part-vi',
    title: 'PART VI - CONSTRUCTIONAL REQUIREMENTS',
    clauses: partVI_constructional || []
  },
  {
    id: 'part-vii',
    title: 'PART VII - FIRE REQUIREMENTS',
    clauses: partVII_fireRequirements || []
  },
  {
    id: 'part-viii',
    title: 'PART VIII - FIRE ALARMS, DETECTION & EXTINGUISHMENT',
    clauses: partVIII_fireSystemse || []
  },
  {
    id: 'part-ix',
    title: 'PART IX - WATER SUPPLY, PLUMBING & SANITATION',
    clauses: partIX_waterSanitation || []
  },
  {
    id: 'part-x',
    title: 'PART X - LIFTS AND ESCALATORS',
    clauses: partX_liftsEscalators || []
  },
  {
    id: 'part-xi',
    title: 'PART XI - ELECTRICAL AND GAS',
    clauses: partXI_electricalGas || []
  },
  {
    id: 'part-xii',
    title: 'PART XII - MECHANICAL VENTILATION & AIR-CONDITIONING',
    clauses: partXII_mechanical || []
  }
];


// Re-export complete clauses count
export const TOTAL_UBBL_CLAUSES = TOTAL_CLAUSES;

// Export categories for filtering
export const UBBL_CATEGORIES = [
  'Preliminary',
  'Plan Submission',
  'Space, Light & Ventilation',
  'Temporary Works',
  'Structural Requirements',
  'Constructional Requirements',
  'Fire Requirements',
  'Fire Safety Systems',
  'Water & Sanitation',
  'Lifts & Escalators',
  'Electrical & Gas',
  'Mechanical Systems'
];

// Compliance checking functions
export function checkCompliance(
  buildingType: BuildingType,
  buildingHeight: number,
  floorArea: number,
  occupancy: number
): ComplianceResult {
  const applicableClauses: UBBLClause[] = [];
  const violations: Violation[] = [];
  
  // Filter applicable clauses from complete database
  allUBBLClauses.forEach(clause => {
    if (clause.applicableToTypes.includes(buildingType)) {
      applicableClauses.push(clause);
    }
  });
  
  // Special checks for high-rise buildings (>30m or >10 floors)
  if (buildingHeight > 30) {
    // Add high-rise specific requirements
    const highRiseSpecific = applicableClauses.filter(c => 
      c.id.includes('lift') || 
      c.id.includes('fire') || 
      c.id.includes('sprinkler')
    );
    highRiseSpecific.forEach(clause => {
      if (clause.category === 'conditional') {
        clause.category = 'mandatory';
      }
    });
  }
  
  // Check for specific violations based on parameters
  if (buildingType === 'high-rise' && buildingHeight > 30 && !hasFireRefugeFloor(buildingHeight)) {
    violations.push({
      clauseId: 'ubbl-144',
      description: 'Fire refuge floor required every 20 floors',
      severity: 'critical',
      requiredAction: 'Add fire refuge floors at appropriate intervals'
    });
  }
  
  if (occupancy > 50 && !hasAdequateExits(floorArea, occupancy)) {
    violations.push({
      clauseId: 'ubbl-138',
      description: 'Insufficient emergency exits for occupancy load',
      severity: 'critical',
      requiredAction: 'Provide minimum two exits with adequate width'
    });
  }
  
  if (floorArea > 1000 && buildingType === 'industrial' && !hasLoadingBay()) {
    violations.push({
      clauseId: 'ubbl-37',
      description: 'Loading bay required for industrial buildings',
      severity: 'major',
      requiredAction: 'Provide adequate loading/unloading facilities'
    });
  }
  
  return {
    applicableClauses,
    violations,
    complianceScore: calculateComplianceScore(applicableClauses, violations),
    recommendations: generateRecommendations(buildingType, applicableClauses)
  };
}

// Helper functions for compliance checking
function hasFireRefugeFloor(buildingHeight: number): boolean {
  // Mock check - in real implementation would check actual plans
  const floors = Math.floor(buildingHeight / 3); // Assuming 3m per floor
  return floors <= 20; // Simplified check
}

function hasAdequateExits(floorArea: number, occupancy: number): boolean {
  // Mock check - in real implementation would check actual plans
  const requiredExits = occupancy > 50 ? 2 : 1;
  return true; // Simplified - would check actual plan
}

function hasLoadingBay(): boolean {
  // Mock check - in real implementation would check actual plans
  return false; // Force a violation for demo
}

export interface ComplianceResult {
  applicableClauses: UBBLClause[];
  violations: Violation[];
  complianceScore: number;
  recommendations: string[];
}

export interface Violation {
  clauseId: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  requiredAction: string;
}

function calculateComplianceScore(
  applicableClauses: UBBLClause[],
  violations: Violation[]
): number {
  if (applicableClauses.length === 0) return 100;
  
  const totalWeight = applicableClauses.length;
  const violationWeight = violations.reduce((sum, v) => {
    switch (v.severity) {
      case 'critical': return sum + 3;
      case 'major': return sum + 2;
      case 'minor': return sum + 1;
      default: return sum;
    }
  }, 0);
  
  const score = Math.max(0, 100 - (violationWeight / totalWeight) * 100);
  return Math.round(score);
}

function generateRecommendations(
  buildingType: BuildingType,
  applicableClauses: UBBLClause[]
): string[] {
  const recommendations: string[] = [];
  
  // General recommendations based on building type
  switch (buildingType) {
    case 'high-rise':
      recommendations.push('Ensure fire refuge floors at every 20 floors');
      recommendations.push('Provide pressurized staircases');
      recommendations.push('Install building management system');
      recommendations.push('Consider helipad for buildings above 60m');
      break;
    case 'industrial':
      recommendations.push('Consider additional ventilation for hazardous materials');
      recommendations.push('Provide adequate loading bay access');
      recommendations.push('Install industrial safety equipment');
      recommendations.push('Ensure proper waste management systems');
      break;
    case 'assembly':
      recommendations.push('Ensure adequate emergency exits for occupancy load');
      recommendations.push('Provide assembly point signage');
      recommendations.push('Install public address system');
      recommendations.push('Consider crowd control measures');
      break;
    case 'commercial':
      recommendations.push('Ensure disabled access to all floors');
      recommendations.push('Provide adequate parking facilities');
      recommendations.push('Install energy-efficient systems');
      break;
    case 'residential':
      recommendations.push('Ensure natural light and ventilation in all habitable rooms');
      recommendations.push('Provide adequate recreational spaces');
      recommendations.push('Consider rainwater harvesting');
      break;
  }
  
  // Specific recommendations based on applicable clauses
  if (applicableClauses.some(c => c.id.includes('fire'))) {
    recommendations.push('Conduct regular fire drills and training');
    recommendations.push('Maintain fire equipment certification');
  }
  
  if (applicableClauses.some(c => c.id.includes('disabled'))) {
    recommendations.push('Ensure all facilities are accessible to disabled persons');
  }
  
  if (applicableClauses.some(c => c.id.includes('energy'))) {
    recommendations.push('Consider solar panels and green building features');
  }
  
  return recommendations;
}

// Summary statistics
export function getComplianceStatistics() {
  return {
    totalClauses: TOTAL_UBBL_CLAUSES,
    totalSections: ubblSections.length,
    mandatoryClauses: allUBBLClauses.filter(c => c.category === 'mandatory').length,
    conditionalClauses: allUBBLClauses.filter(c => c.category === 'conditional').length,
    recommendedClauses: allUBBLClauses.filter(c => c.category === 'recommended').length
  };
}