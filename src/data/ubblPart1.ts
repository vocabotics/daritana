// UBBL Part 1 - Clauses 1-171
// Malaysian Uniform Building By-Laws 1984

import { UBBLClause, BuildingType } from './ubblClauses';

// PART I - PRELIMINARY (By-laws 1-2)
export const partI_preliminary: UBBLClause[] = [
  {
    id: 'ubbl-1',
    section: 'Part I',
    title: 'Citation',
    description: 'These By-laws may be cited as the Uniform Building By-Laws 1984',
    requirements: ['All buildings must comply with UBBL 1984'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-2',
    section: 'Part I',
    title: 'Interpretation',
    description: 'Definitions of terms used throughout the by-laws',
    requirements: ['Understanding and application of defined terms'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  }
];

// PART II - SUBMISSION OF PLANS FOR APPROVAL (By-laws 3-17)
export const partII_planSubmission: UBBLClause[] = [
  {
    id: 'ubbl-3',
    section: 'Part II',
    title: 'Submission of plans',
    description: 'Plans shall be submitted to the local authority for approval before commencement',
    requirements: [
      'Submit complete architectural plans',
      'Include structural drawings',
      'Provide M&E drawings',
      'Submit calculations and specifications'
    ],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-4',
    section: 'Part II',
    title: 'Scale of plans',
    description: 'Plans shall be drawn to appropriate scales',
    requirements: [
      'Site plan at 1:500 or larger',
      'Floor plans at 1:100',
      'Sections and elevations at 1:100',
      'Details at 1:20 or larger'
    ],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-5',
    section: 'Part II',
    title: 'Specification of materials',
    description: 'Complete specifications of materials to be used',
    requirements: ['Material specifications', 'Quality standards', 'Test certificates'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-6',
    section: 'Part II',
    title: 'Supervision of work',
    description: 'Qualified person shall supervise the construction work',
    requirements: ['Appointment of qualified supervisor', 'Regular site inspections', 'Compliance certificates'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-7',
    section: 'Part II',
    title: 'Notice of commencement',
    description: 'Written notice before commencement of building operations',
    requirements: ['7 days notice to local authority', 'Appointment of builder', 'Site preparation details'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-8',
    section: 'Part II',
    title: 'Setting out of building',
    description: 'Building shall be set out according to approved plans',
    requirements: ['Boundary demarcation', 'Building line compliance', 'Site survey verification'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-9',
    section: 'Part II',
    title: 'Inspection of site',
    description: 'Local authority may inspect site at any reasonable time',
    requirements: ['Allow access for inspection', 'Maintain site records', 'Compliance documentation'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-10',
    section: 'Part II',
    title: 'Testing of materials',
    description: 'Materials may be tested to ensure compliance',
    requirements: ['Provide samples for testing', 'Test certificates', 'Approved testing laboratories'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-11',
    section: 'Part II',
    title: 'Power to order demolition',
    description: 'Non-compliant work may be ordered to be demolished',
    requirements: ['Compliance with approved plans', 'Rectification of defects', 'Safety requirements'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-12',
    section: 'Part II',
    title: 'Deviation from approved plans',
    description: 'No deviation without prior written approval',
    requirements: ['Submit revised plans', 'Approval before changes', 'As-built drawings'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-13',
    section: 'Part II',
    title: 'Temporary permits',
    description: 'Temporary permits for temporary buildings',
    requirements: ['Limited duration', 'Safety compliance', 'Removal after expiry'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'assembly']
  },
  {
    id: 'ubbl-14',
    section: 'Part II',
    title: 'Certificate of completion',
    description: 'Certificate of completion and compliance (CCC)',
    requirements: ['Final inspection', 'All works completed', 'Compliance verification'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-15',
    section: 'Part II',
    title: 'Occupation permit',
    description: 'No occupation without certificate of fitness',
    requirements: ['Safety inspection passed', 'All services operational', 'Fire certificate obtained'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-16',
    section: 'Part II',
    title: 'Fees',
    description: 'Payment of prescribed fees',
    requirements: ['Plan submission fees', 'Inspection fees', 'Certificate fees'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-17',
    section: 'Part II',
    title: 'Appeals',
    description: 'Right to appeal to State Authority',
    requirements: ['Written appeal within 30 days', 'Grounds for appeal', 'Supporting documentation'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  }
];

// PART III - SPACE, LIGHT AND VENTILATION (By-laws 18-43)
export const partIII_spaceLightVentilation: UBBLClause[] = [
  {
    id: 'ubbl-18',
    section: 'Part III',
    title: 'Open spaces to be provided',
    description: 'Every building shall have adequate open space',
    requirements: ['Front open space minimum 6m', 'Rear open space minimum 3m', 'Side open space minimum 2m'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-19',
    section: 'Part III',
    title: 'Splayed corner',
    description: 'Corner lots shall have splayed corners',
    requirements: ['45-degree splay', 'Minimum 3m x 3m', 'Clear of obstructions'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'mixed-use']
  },
  {
    id: 'ubbl-20',
    section: 'Part III',
    title: 'Back lane',
    description: 'Provision of back lanes where required',
    requirements: ['Minimum width 6m', 'Proper drainage', 'Vehicle access'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'mixed-use']
  },
  {
    id: 'ubbl-21',
    section: 'Part III',
    title: 'Access from street',
    description: 'Every building shall have proper access from street',
    requirements: ['Direct access to public road', 'Minimum width 6m', 'Emergency vehicle access'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-22',
    section: 'Part III',
    title: 'Projections over street',
    description: 'Limitations on projections over public streets',
    requirements: ['No projection below 2.5m height', 'Maximum projection 600mm', 'Structural safety'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-23',
    section: 'Part III',
    title: 'Verandah way',
    description: 'Provision of verandah ways in commercial areas',
    requirements: ['Minimum width 2.5m', 'Minimum height 3m', 'Weather protection'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-24',
    section: 'Part III',
    title: 'Arcade',
    description: 'Requirements for arcades',
    requirements: ['Minimum width 3m', 'Minimum height 3.5m', 'Public access'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-25',
    section: 'Part III',
    title: 'Site coverage',
    description: 'Maximum site coverage limitations',
    requirements: ['Residential maximum 75%', 'Commercial maximum 80%', 'Industrial maximum 70%'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'mixed-use']
  },
  {
    id: 'ubbl-26',
    section: 'Part III',
    title: 'Plinth level',
    description: 'Minimum plinth level above ground',
    requirements: ['Minimum 150mm above ground', 'Flood-prone areas 600mm', 'Proper drainage'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-27',
    section: 'Part III',
    title: 'Ceiling height',
    description: 'Minimum ceiling heights for different spaces',
    requirements: ['Habitable rooms 2.75m', 'Bathrooms 2.4m', 'Corridors 2.4m'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-28',
    section: 'Part III',
    title: 'Room sizes',
    description: 'Minimum sizes for habitable rooms',
    requirements: ['Master bedroom 11 sqm', 'Other bedrooms 9 sqm', 'Living room 14 sqm'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'mixed-use']
  },
  {
    id: 'ubbl-29',
    section: 'Part III',
    title: 'Kitchen',
    description: 'Requirements for kitchen spaces',
    requirements: ['Minimum area 6.5 sqm', 'Proper ventilation', 'Fire-resistant materials'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-30',
    section: 'Part III',
    title: 'Bathroom and water closet',
    description: 'Sanitary facilities requirements',
    requirements: ['Minimum area 2.5 sqm', 'Waterproof finishes', 'Adequate ventilation'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-31',
    section: 'Part III',
    title: 'Natural lighting',
    description: 'Provision of natural light to habitable rooms',
    requirements: ['Window area minimum 10% of floor area', 'Direct daylight access', 'Light wells if required'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-32',
    section: 'Part III',
    title: 'Natural ventilation',
    description: 'Natural ventilation requirements',
    requirements: ['Openable windows minimum 5% of floor area', 'Cross ventilation', 'Permanent ventilation openings'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-33',
    section: 'Part III',
    title: 'Mechanical ventilation',
    description: 'Where natural ventilation is inadequate',
    requirements: ['Minimum air changes per hour', 'Emergency ventilation', 'Smoke extraction systems'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-34',
    section: 'Part III',
    title: 'Air wells',
    description: 'Requirements for air wells',
    requirements: ['Minimum area 6 sqm', 'Open to sky', 'Proper drainage'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-35',
    section: 'Part III',
    title: 'Lighting of common areas',
    description: 'Artificial lighting in common areas',
    requirements: ['Staircases minimum 50 lux', 'Corridors minimum 50 lux', 'Emergency lighting'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-36',
    section: 'Part III',
    title: 'Refuse disposal',
    description: 'Provision for refuse storage and disposal',
    requirements: ['Dedicated refuse chamber', 'Proper ventilation', 'Easy collection access'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-37',
    section: 'Part III',
    title: 'Loading and unloading bay',
    description: 'Provision of loading bays for commercial buildings',
    requirements: ['Adequate size for vehicles', 'Off-street location', 'Does not obstruct traffic'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'mixed-use']
  },
  {
    id: 'ubbl-38',
    section: 'Part III',
    title: 'Car parking',
    description: 'Provision of adequate car parking spaces',
    requirements: ['Residential 1 space per unit', 'Commercial 1 per 50 sqm', 'Disabled parking provision'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-39',
    section: 'Part III',
    title: 'Landscaping',
    description: 'Provision of landscaped areas',
    requirements: ['Minimum 10% of site area', 'Tree planting', 'Maintenance plan'],
    category: 'recommended',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-40',
    section: 'Part III',
    title: 'Boundary wall',
    description: 'Height limitations for boundary walls',
    requirements: ['Front maximum 1.5m', 'Side and rear maximum 2.5m', 'See-through above 1m for front'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-41',
    section: 'Part III',
    title: 'Swimming pool',
    description: 'Requirements for swimming pools',
    requirements: ['Safety barriers 1.2m high', 'Non-slip surfaces', 'Proper filtration system'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-42',
    section: 'Part III',
    title: 'Pedestrian walkway',
    description: 'Provision of pedestrian walkways',
    requirements: ['Minimum width 1.5m', 'Non-slip surface', 'Barrier-free design'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-43',
    section: 'Part III',
    title: 'Facilities for disabled',
    description: 'Provision of facilities for disabled persons',
    requirements: ['Ramps maximum 1:12 gradient', 'Disabled toilets', 'Accessible routes'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  }
];

// PART IV - TEMPORARY WORKS (By-laws 44-49)
export const partIV_temporaryWorks: UBBLClause[] = [
  {
    id: 'ubbl-44',
    section: 'Part IV',
    title: 'Hoardings',
    description: 'Temporary hoardings during construction',
    requirements: ['Minimum height 2.4m', 'Structurally stable', 'Painted or covered'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-45',
    section: 'Part IV',
    title: 'Scaffolding',
    description: 'Requirements for scaffolding',
    requirements: ['Designed by qualified person', 'Regular inspection', 'Safety compliance'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-46',
    section: 'Part IV',
    title: 'Catch platforms',
    description: 'Safety catch platforms for high-rise construction',
    requirements: ['Every 10 floors or 30m', 'Minimum 1.5m projection', 'Strong enough to catch falling debris'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-47',
    section: 'Part IV',
    title: 'Site safety',
    description: 'General site safety requirements',
    requirements: ['Safety officer appointment', 'Safety equipment provision', 'Regular safety audits'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-48',
    section: 'Part IV',
    title: 'Protection of public',
    description: 'Measures to protect public during construction',
    requirements: ['Covered walkways', 'Warning signs', 'Night lighting'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-49',
    section: 'Part IV',
    title: 'Demolition',
    description: 'Requirements for demolition works',
    requirements: ['Demolition plan submission', 'Dust control measures', 'Debris disposal plan'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  }
];

// PART V - STRUCTURAL REQUIREMENTS (By-laws 50-87)
export const partV_structural: UBBLClause[] = [
  {
    id: 'ubbl-50',
    section: 'Part V',
    title: 'General structural requirements',
    description: 'Buildings shall be structurally safe and stable',
    requirements: ['Structural calculations', 'Factor of safety', 'Design to codes'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-51',
    section: 'Part V',
    title: 'Loads',
    description: 'Design for dead, live and wind loads',
    requirements: ['Dead load calculations', 'Live load as per MS 1553', 'Wind load as per MS 1553'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-52',
    section: 'Part V',
    title: 'Foundations',
    description: 'Foundation design requirements',
    requirements: ['Soil investigation', 'Adequate bearing capacity', 'Settlement limits'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-53',
    section: 'Part V',
    title: 'Piling',
    description: 'Requirements for pile foundations',
    requirements: ['Pile test required', 'Working load test', 'Integrity test'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-54',
    section: 'Part V',
    title: 'Basement',
    description: 'Requirements for basement construction',
    requirements: ['Waterproofing', 'Retaining wall design', 'Drainage system'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-55',
    section: 'Part V',
    title: 'Columns',
    description: 'Column design and spacing requirements',
    requirements: ['Minimum dimensions', 'Reinforcement details', 'Fire rating'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-56',
    section: 'Part V',
    title: 'Beams',
    description: 'Beam design requirements',
    requirements: ['Span-depth ratio', 'Reinforcement requirements', 'Deflection limits'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-57',
    section: 'Part V',
    title: 'Slabs',
    description: 'Slab design and thickness requirements',
    requirements: ['Minimum thickness', 'Reinforcement spacing', 'Cover requirements'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-58',
    section: 'Part V',
    title: 'Walls',
    description: 'Load-bearing wall requirements',
    requirements: ['Minimum thickness 150mm', 'Slenderness ratio', 'Lateral support'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-59',
    section: 'Part V',
    title: 'Staircases',
    description: 'Structural requirements for staircases',
    requirements: ['Design loads', 'Support conditions', 'Deflection limits'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-60',
    section: 'Part V',
    title: 'Cantilever structures',
    description: 'Requirements for cantilever elements',
    requirements: ['Maximum projection', 'Back-span ratio', 'Deflection control'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-61',
    section: 'Part V',
    title: 'Roofs',
    description: 'Roof structure requirements',
    requirements: ['Wind uplift resistance', 'Waterproofing', 'Drainage provisions'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-62',
    section: 'Part V',
    title: 'Parapets',
    description: 'Parapet wall requirements',
    requirements: ['Minimum height 1m', 'Structural stability', 'Coping details'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-63',
    section: 'Part V',
    title: 'Retaining walls',
    description: 'Design of retaining structures',
    requirements: ['Stability analysis', 'Drainage provisions', 'Movement joints'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-64',
    section: 'Part V',
    title: 'Swimming pool structure',
    description: 'Structural requirements for pools',
    requirements: ['Water pressure design', 'Crack control', 'Waterproofing system'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-65',
    section: 'Part V',
    title: 'Water tanks',
    description: 'Structural design of water tanks',
    requirements: ['Liquid pressure design', 'Overflow provisions', 'Access for maintenance'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-66',
    section: 'Part V',
    title: 'Lift shafts',
    description: 'Structural requirements for lift shafts',
    requirements: ['Vertical loads', 'Guide rail support', 'Machine room loads'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-67',
    section: 'Part V',
    title: 'Earthquake resistance',
    description: 'Seismic design considerations',
    requirements: ['Seismic zone compliance', 'Ductility requirements', 'Lateral force resistance'],
    category: 'conditional',
    applicableToTypes: ['high-rise', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-68',
    section: 'Part V',
    title: 'Wind resistance',
    description: 'Design for wind forces',
    requirements: ['Basic wind speed', 'Pressure coefficients', 'Dynamic effects for tall buildings'],
    category: 'mandatory',
    applicableToTypes: ['high-rise', 'industrial']
  },
  {
    id: 'ubbl-69',
    section: 'Part V',
    title: 'Progressive collapse',
    description: 'Prevention of progressive collapse',
    requirements: ['Alternate load paths', 'Tie forces', 'Key element design'],
    category: 'mandatory',
    applicableToTypes: ['high-rise', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-70',
    section: 'Part V',
    title: 'Durability',
    description: 'Durability requirements for structures',
    requirements: ['Concrete cover', 'Crack width limits', 'Corrosion protection'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-71',
    section: 'Part V',
    title: 'Precast concrete',
    description: 'Requirements for precast elements',
    requirements: ['Connection design', 'Tolerance requirements', 'Lifting provisions'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial', 'high-rise']
  },
  {
    id: 'ubbl-72',
    section: 'Part V',
    title: 'Prestressed concrete',
    description: 'Design of prestressed elements',
    requirements: ['Tendon layout', 'Stress limitations', 'Anchorage zones'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-73',
    section: 'Part V',
    title: 'Steel structures',
    description: 'Requirements for steel construction',
    requirements: ['Connection design', 'Fire protection', 'Corrosion protection'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial', 'high-rise']
  },
  {
    id: 'ubbl-74',
    section: 'Part V',
    title: 'Composite structures',
    description: 'Design of composite steel-concrete',
    requirements: ['Shear connectors', 'Construction sequence', 'Deflection control'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'high-rise']
  },
  {
    id: 'ubbl-75',
    section: 'Part V',
    title: 'Timber structures',
    description: 'Requirements for timber construction',
    requirements: ['Timber grading', 'Connection design', 'Termite protection'],
    category: 'conditional',
    applicableToTypes: ['residential', 'low-rise']
  },
  {
    id: 'ubbl-76',
    section: 'Part V',
    title: 'Masonry structures',
    description: 'Design of masonry construction',
    requirements: ['Wall thickness', 'Mortar strength', 'Movement joints'],
    category: 'conditional',
    applicableToTypes: ['residential', 'low-rise']
  },
  {
    id: 'ubbl-77',
    section: 'Part V',
    title: 'Glass structures',
    description: 'Structural use of glass',
    requirements: ['Safety glass requirements', 'Support conditions', 'Impact resistance'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-78',
    section: 'Part V',
    title: 'Aluminium structures',
    description: 'Requirements for aluminium construction',
    requirements: ['Alloy specifications', 'Connection design', 'Corrosion considerations'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-79',
    section: 'Part V',
    title: 'Expansion joints',
    description: 'Movement joint requirements',
    requirements: ['Maximum spacing', 'Joint width calculation', 'Waterproofing details'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-80',
    section: 'Part V',
    title: 'Vibration control',
    description: 'Control of structural vibrations',
    requirements: ['Frequency limits', 'Acceleration limits', 'Damping provisions'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-81',
    section: 'Part V',
    title: 'Fatigue',
    description: 'Fatigue considerations for structures',
    requirements: ['Stress range limits', 'Detail categories', 'Inspection requirements'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'high-rise']
  },
  {
    id: 'ubbl-82',
    section: 'Part V',
    title: 'Impact loads',
    description: 'Design for impact forces',
    requirements: ['Vehicle impact', 'Crane loads', 'Equipment loads'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial']
  },
  {
    id: 'ubbl-83',
    section: 'Part V',
    title: 'Blast resistance',
    description: 'Design for explosion effects',
    requirements: ['Blast load assessment', 'Structural hardening', 'Progressive collapse prevention'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-84',
    section: 'Part V',
    title: 'Renovation works',
    description: 'Structural requirements for renovations',
    requirements: ['Existing structure assessment', 'Strengthening methods', 'Temporary support'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-85',
    section: 'Part V',
    title: 'Change of use',
    description: 'Structural implications of change of use',
    requirements: ['Load reassessment', 'Structural adequacy check', 'Strengthening if required'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-86',
    section: 'Part V',
    title: 'Structural inspection',
    description: 'Periodic structural inspections',
    requirements: ['Inspection schedule', 'Qualified inspector', 'Inspection reports'],
    category: 'mandatory',
    applicableToTypes: ['high-rise', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-87',
    section: 'Part V',
    title: 'Structural maintenance',
    description: 'Maintenance of structural elements',
    requirements: ['Maintenance schedule', 'Repair procedures', 'Records keeping'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  }
];

// PART VI - CONSTRUCTIONAL REQUIREMENTS (By-laws 88-136)
export const partVI_constructional: UBBLClause[] = [
  {
    id: 'ubbl-88',
    section: 'Part VI',
    title: 'Materials quality',
    description: 'Quality requirements for construction materials',
    requirements: ['Malaysian Standards compliance', 'Test certificates', 'Approved suppliers'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-89',
    section: 'Part VI',
    title: 'Concrete quality',
    description: 'Concrete mix and strength requirements',
    requirements: ['Minimum grade C25', 'Mix design approval', 'Cube test results'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-90',
    section: 'Part VI',
    title: 'Steel reinforcement',
    description: 'Requirements for reinforcement bars',
    requirements: ['MS standards compliance', 'Mill certificates', 'Proper storage'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-91',
    section: 'Part VI',
    title: 'Brickwork',
    description: 'Requirements for brick construction',
    requirements: ['Brick strength', 'Mortar mix', 'Bonding patterns'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'low-rise']
  },
  {
    id: 'ubbl-92',
    section: 'Part VI',
    title: 'Blockwork',
    description: 'Requirements for block construction',
    requirements: ['Block strength', 'Joint thickness', 'Reinforcement requirements'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'low-rise']
  },
  {
    id: 'ubbl-93',
    section: 'Part VI',
    title: 'Plastering',
    description: 'Requirements for plaster work',
    requirements: ['Mix proportions', 'Thickness requirements', 'Surface preparation'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-94',
    section: 'Part VI',
    title: 'Floor finishes',
    description: 'Requirements for floor finishes',
    requirements: ['Non-slip requirements', 'Level tolerances', 'Joint details'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-95',
    section: 'Part VI',
    title: 'Wall finishes',
    description: 'Requirements for wall finishes',
    requirements: ['Surface preparation', 'Adhesion requirements', 'Joint treatments'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-96',
    section: 'Part VI',
    title: 'Ceiling finishes',
    description: 'Requirements for ceiling finishes',
    requirements: ['Support system', 'Access panels', 'Fire rating if required'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-97',
    section: 'Part VI',
    title: 'Roofing',
    description: 'Requirements for roof coverings',
    requirements: ['Weather resistance', 'Wind uplift resistance', 'Maintenance access'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-98',
    section: 'Part VI',
    title: 'Waterproofing',
    description: 'Waterproofing requirements',
    requirements: ['Wet areas waterproofing', 'Basement waterproofing', 'Roof waterproofing'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-99',
    section: 'Part VI',
    title: 'Dampproofing',
    description: 'Damp proof course requirements',
    requirements: ['DPC at plinth level', 'Wall-floor junctions', 'Material specifications'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-100',
    section: 'Part VI',
    title: 'Thermal insulation',
    description: 'Thermal insulation requirements',
    requirements: ['Roof insulation', 'Wall insulation where required', 'U-value compliance'],
    category: 'recommended',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-101',
    section: 'Part VI',
    title: 'Sound insulation',
    description: 'Acoustic requirements',
    requirements: ['Party wall insulation', 'Floor impact sound', 'Mechanical equipment isolation'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-102',
    section: 'Part VI',
    title: 'Windows',
    description: 'Requirements for windows',
    requirements: ['Safety glass where required', 'Hardware quality', 'Weather sealing'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-103',
    section: 'Part VI',
    title: 'Doors',
    description: 'Requirements for doors',
    requirements: ['Fire rating where required', 'Hardware specifications', 'Accessibility compliance'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-104',
    section: 'Part VI',
    title: 'Ironmongery',
    description: 'Door and window hardware requirements',
    requirements: ['Quality standards', 'Security requirements', 'Fire rated hardware'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-105',
    section: 'Part VI',
    title: 'Glazing',
    description: 'Requirements for glass installation',
    requirements: ['Safety glass locations', 'Thickness requirements', 'Manifestation requirements'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-106',
    section: 'Part VI',
    title: 'Curtain walling',
    description: 'Requirements for curtain wall systems',
    requirements: ['Wind load resistance', 'Water penetration resistance', 'Thermal movement'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-107',
    section: 'Part VI',
    title: 'Cladding',
    description: 'External cladding requirements',
    requirements: ['Fire rating', 'Weather resistance', 'Fixing details'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-108',
    section: 'Part VI',
    title: 'Partitions',
    description: 'Internal partition requirements',
    requirements: ['Fire rating where required', 'Sound insulation', 'Structural stability'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-109',
    section: 'Part VI',
    title: 'Suspended ceilings',
    description: 'Requirements for suspended ceiling systems',
    requirements: ['Support system design', 'Seismic restraint', 'Access for services'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-110',
    section: 'Part VI',
    title: 'Raised floors',
    description: 'Requirements for raised floor systems',
    requirements: ['Load capacity', 'Fire rating', 'Grounding provisions'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-111',
    section: 'Part VI',
    title: 'Balustrades',
    description: 'Requirements for balustrades and handrails',
    requirements: ['Minimum height 1m', 'Maximum gap 100mm', 'Load resistance'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-112',
    section: 'Part VI',
    title: 'Staircases construction',
    description: 'Construction requirements for stairs',
    requirements: ['Riser height 150-180mm', 'Tread width 250-300mm', 'Handrails both sides if width >1.2m'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-113',
    section: 'Part VI',
    title: 'Ramps',
    description: 'Construction requirements for ramps',
    requirements: ['Maximum gradient 1:12', 'Non-slip surface', 'Handrails required'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-114',
    section: 'Part VI',
    title: 'Ladders',
    description: 'Requirements for fixed ladders',
    requirements: ['Cage required above 3m', 'Rung spacing', 'Landing platforms'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial']
  },
  {
    id: 'ubbl-115',
    section: 'Part VI',
    title: 'Lift pits',
    description: 'Construction of lift pits',
    requirements: ['Waterproofing', 'Drainage provisions', 'Access ladder'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-116',
    section: 'Part VI',
    title: 'Machine rooms',
    description: 'Construction requirements for machine rooms',
    requirements: ['Ventilation', 'Temperature control', 'Lifting beam'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-117',
    section: 'Part VI',
    title: 'Sanitary facilities',
    description: 'Construction of toilets and bathrooms',
    requirements: ['Waterproof finishes', 'Floor gradient to drains', 'Ventilation provisions'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-118',
    section: 'Part VI',
    title: 'Kitchen construction',
    description: 'Requirements for kitchen areas',
    requirements: ['Fire resistant finishes', 'Grease trap provisions', 'Exhaust system'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-119',
    section: 'Part VI',
    title: 'Laboratory construction',
    description: 'Special requirements for laboratories',
    requirements: ['Chemical resistant finishes', 'Emergency shower', 'Fume cupboards'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'industrial']
  },
  {
    id: 'ubbl-120',
    section: 'Part VI',
    title: 'Clean rooms',
    description: 'Construction requirements for clean rooms',
    requirements: ['Sealed surfaces', 'HEPA filtration', 'Pressure differentials'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-121',
    section: 'Part VI',
    title: 'Cold rooms',
    description: 'Construction of cold storage rooms',
    requirements: ['Insulation requirements', 'Vapor barriers', 'Emergency release'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-122',
    section: 'Part VI',
    title: 'Strong rooms',
    description: 'Construction of vaults and strong rooms',
    requirements: ['Reinforced construction', 'Security provisions', 'Ventilation'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-123',
    section: 'Part VI',
    title: 'Server rooms',
    description: 'Construction requirements for IT rooms',
    requirements: ['Raised floors', 'Temperature control', 'Fire suppression'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-124',
    section: 'Part VI',
    title: 'Auditoriums',
    description: 'Construction requirements for auditoriums',
    requirements: ['Acoustic treatment', 'Sight lines', 'Emergency exits'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'assembly']
  },
  {
    id: 'ubbl-125',
    section: 'Part VI',
    title: 'Sports facilities',
    description: 'Construction of sports areas',
    requirements: ['Impact resistant finishes', 'Appropriate flooring', 'Safety padding'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'assembly']
  },
  {
    id: 'ubbl-126',
    section: 'Part VI',
    title: 'Medical facilities',
    description: 'Construction requirements for healthcare',
    requirements: ['Hygienic finishes', 'Medical gas provisions', 'Radiation protection'],
    category: 'conditional',
    applicableToTypes: ['institutional']
  },
  {
    id: 'ubbl-127',
    section: 'Part VI',
    title: 'Parking structures',
    description: 'Construction of car parks',
    requirements: ['Ventilation requirements', 'Drainage provisions', 'Height clearance'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-128',
    section: 'Part VI',
    title: 'Loading docks',
    description: 'Construction of loading areas',
    requirements: ['Dock levelers', 'Bumpers', 'Weather protection'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-129',
    section: 'Part VI',
    title: 'Mezzanine floors',
    description: 'Construction of mezzanine levels',
    requirements: ['Structural adequacy', 'Access provisions', 'Edge protection'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-130',
    section: 'Part VI',
    title: 'Atriums',
    description: 'Construction requirements for atriums',
    requirements: ['Smoke control', 'Sprinkler protection', 'Natural lighting'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-131',
    section: 'Part VI',
    title: 'Skylights',
    description: 'Requirements for skylights',
    requirements: ['Safety glazing', 'Fall protection', 'Weatherproofing'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-132',
    section: 'Part VI',
    title: 'Chimneys',
    description: 'Construction of chimneys and flues',
    requirements: ['Fire rating', 'Height requirements', 'Structural stability'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial']
  },
  {
    id: 'ubbl-133',
    section: 'Part VI',
    title: 'Solar installations',
    description: 'Requirements for solar panels',
    requirements: ['Structural support', 'Wind resistance', 'Electrical safety'],
    category: 'recommended',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-134',
    section: 'Part VI',
    title: 'Green roofs',
    description: 'Construction of vegetated roofs',
    requirements: ['Waterproofing system', 'Drainage layers', 'Load considerations'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-135',
    section: 'Part VI',
    title: 'Rainwater harvesting',
    description: 'Construction of rainwater systems',
    requirements: ['Storage tanks', 'Filtration', 'Overflow provisions'],
    category: 'recommended',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-136',
    section: 'Part VI',
    title: 'Waste management',
    description: 'Construction of waste facilities',
    requirements: ['Bin centers', 'Wash down provisions', 'Ventilation'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'mixed-use', 'high-rise']
  }
];

// PART VII - FIRE REQUIREMENTS (By-laws 137-171)
export const partVII_fireRequirements: UBBLClause[] = [
  {
    id: 'ubbl-137',
    section: 'Part VII',
    title: 'Fire resistance periods',
    description: 'Minimum fire resistance ratings for elements',
    requirements: ['Structural frame 1-4 hours', 'Floors 1-2 hours', 'External walls 1-2 hours'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-138',
    section: 'Part VII',
    title: 'Means of escape',
    description: 'Provision of adequate escape routes',
    requirements: ['Two independent escape routes', 'Maximum travel distance 45m', 'Protected staircases'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-139',
    section: 'Part VII',
    title: 'Fire fighting access',
    description: 'Access provisions for fire brigade',
    requirements: ['Fire engine access road 6m wide', 'Fire fighting shaft', 'Fireman switch'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-140',
    section: 'Part VII',
    title: 'Compartmentation',
    description: 'Division of building into fire compartments',
    requirements: ['Maximum compartment size 2000 sqm', 'Compartment walls 2-hour rating', 'Protected openings'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-141',
    section: 'Part VII',
    title: 'Fire doors',
    description: 'Requirements for fire rated doors',
    requirements: ['FD30, FD60, FD120 ratings', 'Self-closing devices', 'Smoke seals'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-142',
    section: 'Part VII',
    title: 'Protected staircases',
    description: 'Requirements for escape staircases',
    requirements: ['Fire rated enclosure', 'Pressurization for high-rise', 'Emergency lighting'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-143',
    section: 'Part VII',
    title: 'Emergency exits',
    description: 'Provision and marking of emergency exits',
    requirements: ['Minimum width 1000mm', 'Panic hardware', 'Exit signage'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-144',
    section: 'Part VII',
    title: 'Fire refuge areas',
    description: 'Refuge floors in tall buildings',
    requirements: ['Every 20 floors', 'Open to air', 'Assembly area'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-145',
    section: 'Part VII',
    title: 'External escape',
    description: 'External escape staircases',
    requirements: ['Weather protection', 'Non-slip surfaces', 'Adequate lighting'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'low-rise']
  },
  {
    id: 'ubbl-146',
    section: 'Part VII',
    title: 'Escape windows',
    description: 'Windows as secondary means of escape',
    requirements: ['Minimum opening 850mm x 500mm', 'Maximum sill height 1100mm', 'Escape ladder provision'],
    category: 'conditional',
    applicableToTypes: ['residential', 'low-rise']
  },
  {
    id: 'ubbl-147',
    section: 'Part VII',
    title: 'Assembly areas',
    description: 'Safe assembly points',
    requirements: ['Away from building', 'Adequate size', 'Clear marking'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-148',
    section: 'Part VII',
    title: 'Fire spread prevention',
    description: 'Prevention of fire spread between buildings',
    requirements: ['Boundary distance requirements', 'Unprotected area limits', 'Fire walls'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-149',
    section: 'Part VII',
    title: 'Roof fire rating',
    description: 'Fire resistance of roof coverings',
    requirements: ['Non-combustible materials', 'Fire rating designation', 'Roof access'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-150',
    section: 'Part VII',
    title: 'Fire stopping',
    description: 'Sealing of service penetrations',
    requirements: ['Fire rated sealants', 'Dampers in ducts', 'Pipe collars'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-151',
    section: 'Part VII',
    title: 'Smoke control',
    description: 'Smoke extraction and control systems',
    requirements: ['Smoke vents', 'Pressurization systems', 'Smoke curtains'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-152',
    section: 'Part VII',
    title: 'Emergency lighting',
    description: 'Emergency lighting requirements',
    requirements: ['3-hour duration', 'Minimum 1 lux', 'Monthly testing'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-153',
    section: 'Part VII',
    title: 'Exit signage',
    description: 'Emergency exit signs',
    requirements: ['Illuminated signs', 'Directional arrows', 'Visible from all points'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-154',
    section: 'Part VII',
    title: 'Fire lifts',
    description: 'Dedicated fire fighting lifts',
    requirements: ['Fire rated shaft', 'Independent power', 'Fireman control'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-155',
    section: 'Part VII',
    title: 'Dry risers',
    description: 'Dry riser installations',
    requirements: ['Buildings 18-30m height', 'Landing valves', 'Inlet box at ground'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-156',
    section: 'Part VII',
    title: 'Wet risers',
    description: 'Wet riser installations',
    requirements: ['Buildings over 30m', 'Pumps and tanks', 'Landing valves each floor'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-157',
    section: 'Part VII',
    title: 'Hose reels',
    description: 'Fire hose reel systems',
    requirements: ['30m coverage', 'Flow rate 0.5 l/s', 'Annual testing'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-158',
    section: 'Part VII',
    title: 'Hydrants',
    description: 'External fire hydrant provisions',
    requirements: ['Within 90m of building', 'Minimum flow 1500 l/min', 'Clear access'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-159',
    section: 'Part VII',
    title: 'Portable extinguishers',
    description: 'Portable fire extinguisher provision',
    requirements: ['Maximum travel 15m', 'Appropriate types', 'Annual servicing'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-160',
    section: 'Part VII',
    title: 'Kitchen fire suppression',
    description: 'Commercial kitchen fire systems',
    requirements: ['Wet chemical system', 'Hood protection', 'Gas shut-off'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-161',
    section: 'Part VII',
    title: 'Electrical fire safety',
    description: 'Electrical installation fire safety',
    requirements: ['Fire rated cables', 'Emergency cut-off', 'Circuit protection'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-162',
    section: 'Part VII',
    title: 'Gas safety',
    description: 'Gas installation fire safety',
    requirements: ['Emergency shut-off valves', 'Ventilation', 'Gas detection'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-163',
    section: 'Part VII',
    title: 'Hazardous materials',
    description: 'Storage of hazardous materials',
    requirements: ['Separate storage', 'Fire rated construction', 'Ventilation systems'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-164',
    section: 'Part VII',
    title: 'Boiler rooms',
    description: 'Fire safety in boiler rooms',
    requirements: ['2-hour fire rating', 'Ventilation', 'Emergency shut-off'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-165',
    section: 'Part VII',
    title: 'Generator rooms',
    description: 'Fire safety for generator rooms',
    requirements: ['Fire rated enclosure', 'Fuel storage safety', 'Ventilation'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-166',
    section: 'Part VII',
    title: 'Transformer rooms',
    description: 'Fire safety for electrical rooms',
    requirements: ['3-hour fire rating', 'Automatic suppression', 'No combustibles'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-167',
    section: 'Part VII',
    title: 'Car park ventilation',
    description: 'Smoke ventilation in car parks',
    requirements: ['6 air changes per hour', 'Smoke detection', 'Extract fans'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-168',
    section: 'Part VII',
    title: 'Atrium smoke control',
    description: 'Smoke management in atriums',
    requirements: ['Smoke reservoir', 'Natural or mechanical venting', 'Sprinkler protection'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-169',
    section: 'Part VII',
    title: 'Fire command center',
    description: 'Central fire control room',
    requirements: ['Ground floor location', 'Fire panel', 'Communications'],
    category: 'mandatory',
    applicableToTypes: ['high-rise', 'institutional']
  },
  {
    id: 'ubbl-170',
    section: 'Part VII',
    title: 'Fire drill requirements',
    description: 'Regular fire drill exercises',
    requirements: ['Quarterly drills', 'Records keeping', 'Training program'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-171',
    section: 'Part VII',
    title: 'Fire certificate',
    description: 'Fire certificate requirements',
    requirements: ['Annual inspection', 'System testing', 'Compliance verification'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  }
];

// Combine all clauses from Part 1
export const allPart1Clauses = [
  ...partI_preliminary,
  ...partII_planSubmission,
  ...partIII_spaceLightVentilation,
  ...partIV_temporaryWorks,
  ...partV_structural,
  ...partVI_constructional,
  ...partVII_fireRequirements
];

// Export count
export const PART1_CLAUSE_COUNT = allPart1Clauses.length; // Should be 171