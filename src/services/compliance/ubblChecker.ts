// UBBL (Uniform Building By-Laws) Compliance Checker for Malaysia
// Based on UBBL 1984 (Amended 2012)

export interface UBBLRequirement {
  id: string
  category: string
  clause: string
  description: string
  requirement: string
  minValue?: number
  maxValue?: number
  unit?: string
  applicableFor?: string[]
  exceptions?: string[]
}

export interface ComplianceResult {
  compliant: boolean
  clause: string
  description: string
  actualValue?: number | string
  requiredValue?: number | string
  severity: 'critical' | 'major' | 'minor'
  recommendation?: string
}

export interface BuildingSpecs {
  type: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'mixed'
  occupancy: number
  floors: number
  height: number // in meters
  plotArea: number // in sqm
  builtUpArea: number // in sqm
  setbackFront: number // in meters
  setbackRear: number // in meters
  setbackSide: number // in meters
  parkingSpaces: number
  fireExits: number
  staircaseWidth: number // in meters
  corridorWidth: number // in meters
  ceilingHeight: number // in meters
  windowArea: number // percentage of floor area
  ventilationArea: number // percentage of floor area
  state: string
  zone: string
}

// UBBL Requirements Database
const UBBL_REQUIREMENTS: UBBLRequirement[] = [
  // Part III: Space, Light and Ventilation
  {
    id: 'UBBL-39',
    category: 'Space Standards',
    clause: 'By-law 39',
    description: 'Minimum floor area for habitable rooms',
    requirement: 'Minimum 11 sqm for habitable rooms',
    minValue: 11,
    unit: 'sqm',
    applicableFor: ['residential']
  },
  {
    id: 'UBBL-40',
    category: 'Space Standards',
    clause: 'By-law 40',
    description: 'Minimum ceiling height',
    requirement: 'Minimum 2.5m for habitable rooms',
    minValue: 2.5,
    unit: 'meters',
    applicableFor: ['residential', 'commercial']
  },
  {
    id: 'UBBL-41',
    category: 'Natural Lighting',
    clause: 'By-law 41',
    description: 'Natural lighting requirements',
    requirement: 'Window area minimum 10% of floor area',
    minValue: 10,
    unit: 'percentage',
    applicableFor: ['residential', 'commercial']
  },
  {
    id: 'UBBL-42',
    category: 'Natural Ventilation',
    clause: 'By-law 42',
    description: 'Natural ventilation requirements',
    requirement: 'Openable window area minimum 5% of floor area',
    minValue: 5,
    unit: 'percentage',
    applicableFor: ['residential', 'commercial']
  },
  
  // Part V: Structural Requirements
  {
    id: 'UBBL-78',
    category: 'Structural',
    clause: 'By-law 78',
    description: 'Dead and imposed loads',
    requirement: 'Residential floors: 1.5 kN/sqm, Commercial: 2.5-5.0 kN/sqm',
    minValue: 1.5,
    unit: 'kN/sqm',
    applicableFor: ['residential', 'commercial', 'industrial']
  },
  
  // Part VII: Fire Requirements
  {
    id: 'UBBL-165',
    category: 'Fire Safety',
    clause: 'By-law 165',
    description: 'Fire resistance of elements',
    requirement: 'Minimum 1-hour fire rating for structural elements',
    minValue: 60,
    unit: 'minutes',
    applicableFor: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'UBBL-166',
    category: 'Fire Safety',
    clause: 'By-law 166',
    description: 'Means of escape - staircase width',
    requirement: 'Minimum 1.0m for buildings up to 4 storeys',
    minValue: 1.0,
    unit: 'meters',
    applicableFor: ['residential', 'commercial']
  },
  {
    id: 'UBBL-167',
    category: 'Fire Safety',
    clause: 'By-law 167',
    description: 'Travel distance to exit',
    requirement: 'Maximum 45m travel distance to exit',
    maxValue: 45,
    unit: 'meters',
    applicableFor: ['residential', 'commercial', 'industrial']
  },
  
  // Building Setback Requirements
  {
    id: 'UBBL-33',
    category: 'Setback',
    clause: 'By-law 33',
    description: 'Front building setback',
    requirement: 'Minimum 6m from road reserve',
    minValue: 6,
    unit: 'meters',
    applicableFor: ['residential', 'commercial']
  },
  {
    id: 'UBBL-34',
    category: 'Setback',
    clause: 'By-law 34',
    description: 'Rear building setback',
    requirement: 'Minimum 3m from rear boundary',
    minValue: 3,
    unit: 'meters',
    applicableFor: ['residential', 'commercial']
  },
  {
    id: 'UBBL-35',
    category: 'Setback',
    clause: 'By-law 35',
    description: 'Side building setback',
    requirement: 'Minimum 1.5m from side boundary',
    minValue: 1.5,
    unit: 'meters',
    applicableFor: ['residential', 'commercial']
  },
  
  // Parking Requirements
  {
    id: 'UBBL-PARKING-1',
    category: 'Parking',
    clause: 'Schedule 7',
    description: 'Residential parking requirement',
    requirement: '1 space per unit (low-cost), 2 spaces per unit (medium/high-cost)',
    minValue: 1,
    unit: 'spaces/unit',
    applicableFor: ['residential']
  },
  {
    id: 'UBBL-PARKING-2',
    category: 'Parking',
    clause: 'Schedule 7',
    description: 'Commercial parking requirement',
    requirement: '1 space per 25 sqm GFA',
    minValue: 0.04,
    unit: 'spaces/sqm',
    applicableFor: ['commercial']
  },
  
  // Disability Access
  {
    id: 'UBBL-34A',
    category: 'Accessibility',
    clause: 'By-law 34A',
    description: 'Facilities for disabled persons',
    requirement: 'Ramps, accessible toilets, and parking required',
    minValue: 1,
    unit: 'compliance',
    applicableFor: ['commercial', 'institutional']
  }
]

export class UBBLComplianceChecker {
  private requirements: UBBLRequirement[]

  constructor() {
    this.requirements = UBBL_REQUIREMENTS
  }

  // Main compliance check function
  checkCompliance(specs: BuildingSpecs): ComplianceResult[] {
    const results: ComplianceResult[] = []
    
    // Filter applicable requirements based on building type
    const applicableRequirements = this.requirements.filter(req => 
      !req.applicableFor || req.applicableFor.includes(specs.type)
    )

    // Check each requirement
    for (const req of applicableRequirements) {
      const result = this.checkRequirement(req, specs)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  private checkRequirement(req: UBBLRequirement, specs: BuildingSpecs): ComplianceResult | null {
    let actualValue: number | string | undefined
    let compliant = true
    let recommendation: string | undefined

    switch (req.id) {
      case 'UBBL-40':
        actualValue = specs.ceilingHeight
        compliant = specs.ceilingHeight >= (req.minValue || 2.5)
        if (!compliant) {
          recommendation = `Increase ceiling height to minimum ${req.minValue}m`
        }
        break

      case 'UBBL-41':
        actualValue = specs.windowArea
        compliant = specs.windowArea >= (req.minValue || 10)
        if (!compliant) {
          recommendation = `Increase window area to minimum ${req.minValue}% of floor area`
        }
        break

      case 'UBBL-42':
        actualValue = specs.ventilationArea
        compliant = specs.ventilationArea >= (req.minValue || 5)
        if (!compliant) {
          recommendation = `Increase openable window area to minimum ${req.minValue}% of floor area`
        }
        break

      case 'UBBL-166':
        actualValue = specs.staircaseWidth
        compliant = specs.staircaseWidth >= (req.minValue || 1.0)
        if (!compliant) {
          recommendation = `Increase staircase width to minimum ${req.minValue}m`
        }
        break

      case 'UBBL-33':
        actualValue = specs.setbackFront
        compliant = specs.setbackFront >= (req.minValue || 6)
        if (!compliant) {
          recommendation = `Increase front setback to minimum ${req.minValue}m from road reserve`
        }
        break

      case 'UBBL-34':
        actualValue = specs.setbackRear
        compliant = specs.setbackRear >= (req.minValue || 3)
        if (!compliant) {
          recommendation = `Increase rear setback to minimum ${req.minValue}m`
        }
        break

      case 'UBBL-35':
        actualValue = specs.setbackSide
        compliant = specs.setbackSide >= (req.minValue || 1.5)
        if (!compliant) {
          recommendation = `Increase side setback to minimum ${req.minValue}m`
        }
        break

      case 'UBBL-PARKING-1':
        if (specs.type === 'residential') {
          const requiredSpaces = specs.occupancy * (req.minValue || 1)
          actualValue = specs.parkingSpaces
          compliant = specs.parkingSpaces >= requiredSpaces
          if (!compliant) {
            recommendation = `Provide minimum ${requiredSpaces} parking spaces for ${specs.occupancy} units`
          }
        }
        break

      case 'UBBL-PARKING-2':
        if (specs.type === 'commercial') {
          const requiredSpaces = Math.ceil(specs.builtUpArea * (req.minValue || 0.04))
          actualValue = specs.parkingSpaces
          compliant = specs.parkingSpaces >= requiredSpaces
          if (!compliant) {
            recommendation = `Provide minimum ${requiredSpaces} parking spaces for ${specs.builtUpArea} sqm GFA`
          }
        }
        break

      default:
        return null
    }

    if (actualValue === undefined) {
      return null
    }

    return {
      compliant,
      clause: req.clause,
      description: req.description,
      actualValue,
      requiredValue: req.minValue || req.maxValue,
      severity: this.getSeverity(req.category),
      recommendation
    }
  }

  private getSeverity(category: string): 'critical' | 'major' | 'minor' {
    switch (category) {
      case 'Fire Safety':
      case 'Structural':
        return 'critical'
      case 'Space Standards':
      case 'Setback':
      case 'Accessibility':
        return 'major'
      default:
        return 'minor'
    }
  }

  // Generate compliance report
  generateReport(specs: BuildingSpecs): {
    summary: string
    totalChecks: number
    passed: number
    failed: number
    criticalIssues: number
    results: ComplianceResult[]
  } {
    const results = this.checkCompliance(specs)
    const passed = results.filter(r => r.compliant).length
    const failed = results.filter(r => !r.compliant).length
    const criticalIssues = results.filter(r => !r.compliant && r.severity === 'critical').length

    return {
      summary: failed === 0 ? 'COMPLIANT' : criticalIssues > 0 ? 'NON-COMPLIANT (CRITICAL)' : 'NON-COMPLIANT',
      totalChecks: results.length,
      passed,
      failed,
      criticalIssues,
      results
    }
  }

  // Get recommendations for specific building type
  getRecommendations(buildingType: string): string[] {
    const recommendations: string[] = []

    switch (buildingType) {
      case 'residential':
        recommendations.push(
          'Ensure minimum 11 sqm for all habitable rooms',
          'Maintain 2.5m minimum ceiling height',
          'Provide 10% window area to floor area ratio',
          'Include 2 parking spaces per unit for medium/high-cost housing',
          'Maintain 6m front setback from road reserve'
        )
        break
      case 'commercial':
        recommendations.push(
          'Provide disability access features',
          'Ensure 1-hour fire rating for structural elements',
          'Maintain maximum 45m travel distance to exits',
          'Provide 1 parking space per 25 sqm GFA',
          'Include proper fire escape routes and signage'
        )
        break
    }

    return recommendations
  }
}