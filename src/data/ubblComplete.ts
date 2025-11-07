// Complete UBBL (Uniform Building By-Laws) 1984 - All 343 Clauses
// Malaysian Building Compliance Requirements - Full Database

import { UBBLClause, BuildingType } from './ubblClauses';
import {
  partI_preliminary,
  partII_planSubmission,
  partIII_spaceLightVentilation,
  partIV_temporaryWorks,
  partV_structural,
  partVI_constructional,
  partVII_fireRequirements,
  allPart1Clauses,
  PART1_CLAUSE_COUNT
} from './ubblPart1';

import {
  partVIII_fireAlarms,
  partIX_waterSanitation,
  partX_liftsEscalators,
  partXI_signage,
  partXII_miscellaneous,
  allPart2Clauses,
  PART2_CLAUSE_COUNT
} from './ubblPart2';

// Re-export all sections
export {
  partI_preliminary,
  partII_planSubmission,
  partIII_spaceLightVentilation,
  partIV_temporaryWorks,
  partV_structural,
  partVI_constructional,
  partVII_fireRequirements,
  partVIII_fireAlarms as partVIII_fireSystemse,
  partIX_waterSanitation,
  partX_liftsEscalators,
  partXI_signage as partXI_electricalGas,
  partXII_miscellaneous as partXII_mechanical
};

// Combine all 343 clauses
export const allUBBLClauses: UBBLClause[] = [
  ...allPart1Clauses, // Clauses 1-171
  ...allPart2Clauses  // Clauses 172-343
];

// Total count should be 343
export const TOTAL_CLAUSES = allUBBLClauses.length;


// Helper functions
export function getClauseById(id: string): UBBLClause | undefined {
  return allUBBLClauses.find(clause => clause.id === id);
}

export function getClausesBySection(section: string): UBBLClause[] {
  return allUBBLClauses.filter(clause => clause.section === section);
}

export function getClausesByCategory(category: 'mandatory' | 'conditional' | 'recommended'): UBBLClause[] {
  return allUBBLClauses.filter(clause => clause.category === category);
}

export function getClausesByBuildingType(buildingType: BuildingType): UBBLClause[] {
  return allUBBLClauses.filter(clause => clause.applicableToTypes.includes(buildingType));
}

export function searchClauses(searchTerm: string): UBBLClause[] {
  const term = searchTerm.toLowerCase();
  return allUBBLClauses.filter(clause => 
    clause.title.toLowerCase().includes(term) ||
    clause.description.toLowerCase().includes(term) ||
    clause.requirements.some(req => req.toLowerCase().includes(term))
  );
}

// Statistics
export const ubblStatistics = {
  totalClauses: TOTAL_CLAUSES,
  byCategory: {
    mandatory: allUBBLClauses.filter(c => c.category === 'mandatory').length,
    conditional: allUBBLClauses.filter(c => c.category === 'conditional').length,
    recommended: allUBBLClauses.filter(c => c.category === 'recommended').length
  },
  bySection: {
    'Part I': getClausesBySection('Part I').length,
    'Part II': getClausesBySection('Part II').length,
    'Part III': getClausesBySection('Part III').length,
    'Part IV': getClausesBySection('Part IV').length,
    'Part V': getClausesBySection('Part V').length,
    'Part VI': getClausesBySection('Part VI').length,
    'Part VII': getClausesBySection('Part VII').length,
    'Part VIII': getClausesBySection('Part VIII').length,
    'Part IX': getClausesBySection('Part IX').length,
    'Part X': getClausesBySection('Part X').length,
    'Part XI': getClausesBySection('Part XI').length,
    'Part XII': getClausesBySection('Part XII').length
  }
};