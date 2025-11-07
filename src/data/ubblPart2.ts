// UBBL Part 2 - Clauses 172-343
// Malaysian Uniform Building By-Laws 1984

import { UBBLClause, BuildingType } from './ubblClauses';

// PART VIII - FIRE ALARMS, FIRE DETECTION, FIRE EXTINGUISHMENT (By-laws 172-224)
export const partVIII_fireAlarms: UBBLClause[] = [
  {
    id: 'ubbl-172',
    section: 'Part VIII',
    title: 'Fire alarm systems',
    description: 'Installation of fire alarm systems',
    requirements: ['Addressable systems for large buildings', 'Zone indication', 'Battery backup'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-173',
    section: 'Part VIII',
    title: 'Smoke detectors',
    description: 'Smoke detection systems',
    requirements: ['Point detectors', 'Beam detectors for large spaces', 'Regular testing'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-174',
    section: 'Part VIII',
    title: 'Heat detectors',
    description: 'Heat detection systems',
    requirements: ['Rate of rise detectors', 'Fixed temperature', 'Kitchen areas'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-175',
    section: 'Part VIII',
    title: 'Manual call points',
    description: 'Break glass alarm points',
    requirements: ['Maximum travel 30m', 'Height 1.4m', 'Exit routes'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-176',
    section: 'Part VIII',
    title: 'Fire alarm sounders',
    description: 'Audible alarm devices',
    requirements: ['Minimum 65dB', '5dB above ambient', 'Visual alarms where required'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-177',
    section: 'Part VIII',
    title: 'Voice alarm systems',
    description: 'Public address for evacuation',
    requirements: ['Clear intelligibility', 'Zone paging', 'Override facility'],
    category: 'conditional',
    applicableToTypes: ['assembly', 'high-rise', 'institutional']
  },
  {
    id: 'ubbl-178',
    section: 'Part VIII',
    title: 'Fire telephone systems',
    description: 'Emergency communication systems',
    requirements: ['Fire telephone points', 'Master handset', 'Protected cabling'],
    category: 'conditional',
    applicableToTypes: ['high-rise', 'institutional']
  },
  {
    id: 'ubbl-179',
    section: 'Part VIII',
    title: 'Sprinkler systems',
    description: 'Automatic sprinkler installation',
    requirements: ['Design to MS 1910', 'Water supply adequacy', 'Pump provisions'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-180',
    section: 'Part VIII',
    title: 'Sprinkler coverage',
    description: 'Areas requiring sprinkler protection',
    requirements: ['Full coverage except exempted areas', 'Concealed spaces', 'Loading docks'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-181',
    section: 'Part VIII',
    title: 'Sprinkler types',
    description: 'Types of sprinkler heads',
    requirements: ['Standard spray', 'Sidewall', 'ESFR for storage'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-182',
    section: 'Part VIII',
    title: 'Water supplies',
    description: 'Water supply for fire systems',
    requirements: ['Town main', 'Storage tanks', 'Dual supply for critical buildings'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-183',
    section: 'Part VIII',
    title: 'Fire pumps',
    description: 'Fire pump installations',
    requirements: ['Duty and standby pumps', 'Diesel backup', 'Automatic starting'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-184',
    section: 'Part VIII',
    title: 'Water storage tanks',
    description: 'Fire fighting water storage',
    requirements: ['Capacity calculations', 'Separate storage', 'Level monitoring'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-185',
    section: 'Part VIII',
    title: 'Pump rooms',
    description: 'Fire pump room requirements',
    requirements: ['Direct access', '2-hour fire rating', 'Ventilation'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-186',
    section: 'Part VIII',
    title: 'Deluge systems',
    description: 'Deluge sprinkler systems',
    requirements: ['High hazard areas', 'Open sprinklers', 'Detection activation'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-187',
    section: 'Part VIII',
    title: 'Pre-action systems',
    description: 'Pre-action sprinkler systems',
    requirements: ['Double interlock', 'Computer rooms', 'Valuable storage'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-188',
    section: 'Part VIII',
    title: 'Foam systems',
    description: 'Foam fire suppression',
    requirements: ['Flammable liquid storage', 'Foam concentrate', 'Proportioning'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-189',
    section: 'Part VIII',
    title: 'Gas suppression',
    description: 'Clean agent suppression systems',
    requirements: ['FM200, CO2, Inert gas', 'Room integrity', 'Warning alarms'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-190',
    section: 'Part VIII',
    title: 'Water mist systems',
    description: 'Water mist fire suppression',
    requirements: ['High pressure pumps', 'Special nozzles', 'Heritage buildings'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-191',
    section: 'Part VIII',
    title: 'Fire detection zones',
    description: 'Zoning of detection systems',
    requirements: ['Floor-wise zones', 'Maximum 2000 sqm', 'Clear identification'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-192',
    section: 'Part VIII',
    title: 'Cause and effect',
    description: 'Integration of fire systems',
    requirements: ['Detection/suppression logic', 'Lift recall', 'ACMV shutdown'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-193',
    section: 'Part VIII',
    title: 'Fire panel location',
    description: 'Fire alarm panel positioning',
    requirements: ['Main entrance location', '24-hour access', 'Repeater panels'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-194',
    section: 'Part VIII',
    title: 'Battery backup',
    description: 'Emergency power for fire systems',
    requirements: ['24-hour standby', '30-minute alarm', 'Auto charging'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-195',
    section: 'Part VIII',
    title: 'System monitoring',
    description: 'Fire system supervision',
    requirements: ['24/7 monitoring', 'Fault indication', 'Remote monitoring'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-196',
    section: 'Part VIII',
    title: 'Testing and commissioning',
    description: 'System testing requirements',
    requirements: ['Witness testing', 'Commissioning certificates', 'As-built drawings'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-197',
    section: 'Part VIII',
    title: 'Maintenance requirements',
    description: 'Fire system maintenance',
    requirements: ['Monthly testing', 'Annual inspection', 'Service contracts'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-198',
    section: 'Part VIII',
    title: 'Spare parts',
    description: 'Spare parts provision',
    requirements: ['Critical spares on site', 'Sprinkler heads', 'Detection devices'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-199',
    section: 'Part VIII',
    title: 'Training requirements',
    description: 'Fire system operation training',
    requirements: ['Building management training', 'User training', 'Documentation'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-200',
    section: 'Part VIII',
    title: 'Record keeping',
    description: 'Fire system records',
    requirements: ['Test records', 'Maintenance logs', 'Incident reports'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-201',
    section: 'Part VIII',
    title: 'Integration with BMS',
    description: 'Building management system integration',
    requirements: ['Status monitoring', 'Alarm reporting', 'System control'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-202',
    section: 'Part VIII',
    title: 'Aspirating detection',
    description: 'Very early smoke detection',
    requirements: ['High sensitivity', 'Clean rooms', 'Data centers'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'industrial']
  },
  {
    id: 'ubbl-203',
    section: 'Part VIII',
    title: 'Linear heat detection',
    description: 'Linear heat sensing cable',
    requirements: ['Cable trays', 'Conveyor protection', 'Tunnels'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-204',
    section: 'Part VIII',
    title: 'Flame detectors',
    description: 'UV/IR flame detection',
    requirements: ['High ceiling spaces', 'Outdoor areas', 'Fuel storage'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-205',
    section: 'Part VIII',
    title: 'Video fire detection',
    description: 'Video analytics for fire detection',
    requirements: ['Large open spaces', 'Early warning', 'Visual verification'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'assembly']
  },
  {
    id: 'ubbl-206',
    section: 'Part VIII',
    title: 'Duct smoke detection',
    description: 'Smoke detection in air ducts',
    requirements: ['Supply and return ducts', 'Shutdown control', 'Sampling tubes'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-207',
    section: 'Part VIII',
    title: 'Elevator recall',
    description: 'Lift recall on fire alarm',
    requirements: ['Designated floor recall', 'Alternate floor', 'Fireman control'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-208',
    section: 'Part VIII',
    title: 'Door release',
    description: 'Automatic door release systems',
    requirements: ['Fail-safe operation', 'Manual override', 'Battery backup'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-209',
    section: 'Part VIII',
    title: 'Pressurization fans',
    description: 'Staircase pressurization control',
    requirements: ['Automatic start', 'Pressure relief', 'Status monitoring'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-210',
    section: 'Part VIII',
    title: 'Smoke dampers',
    description: 'Automatic smoke damper control',
    requirements: ['Fusible link or motorized', 'Position indication', 'Reset capability'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-211',
    section: 'Part VIII',
    title: 'Emergency power',
    description: 'Emergency power for life safety',
    requirements: ['Generator backup', 'UPS systems', 'Automatic transfer'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-212',
    section: 'Part VIII',
    title: 'Lightning protection',
    description: 'Lightning protection systems',
    requirements: ['Risk assessment', 'Air terminals', 'Down conductors'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-213',
    section: 'Part VIII',
    title: 'Earthing systems',
    description: 'Electrical earthing requirements',
    requirements: ['Earth resistance <1 ohm', 'Earth pit', 'Bonding'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-214',
    section: 'Part VIII',
    title: 'Cable fire rating',
    description: 'Fire rated cable requirements',
    requirements: ['Circuit integrity', 'Low smoke', 'Halogen free'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-215',
    section: 'Part VIII',
    title: 'Control interfaces',
    description: 'Fire system control interfaces',
    requirements: ['Graphical display', 'Touch screen', 'Remote access'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-216',
    section: 'Part VIII',
    title: 'Mass notification',
    description: 'Mass notification systems',
    requirements: ['Multiple communication modes', 'Wide area coverage', 'Integration capability'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'assembly']
  },
  {
    id: 'ubbl-217',
    section: 'Part VIII',
    title: 'Refuge area systems',
    description: 'Systems for refuge areas',
    requirements: ['Two-way communication', 'Fresh air supply', 'Status indication'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-218',
    section: 'Part VIII',
    title: 'Helipad systems',
    description: 'Helipad fire safety systems',
    requirements: ['Foam system', 'Wind indicator', 'Lighting'],
    category: 'conditional',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-219',
    section: 'Part VIII',
    title: 'Tunnel fire systems',
    description: 'Fire systems for tunnels',
    requirements: ['Deluge systems', 'Ventilation control', 'Emergency exits'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-220',
    section: 'Part VIII',
    title: 'Car park systems',
    description: 'Basement car park fire systems',
    requirements: ['CO detection', 'Jet fans', 'Sprinkler protection'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-221',
    section: 'Part VIII',
    title: 'Archive protection',
    description: 'Archive and record protection',
    requirements: ['Gas suppression', 'Environmental control', 'Early detection'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'commercial']
  },
  {
    id: 'ubbl-222',
    section: 'Part VIII',
    title: 'Kitchen suppression',
    description: 'Commercial kitchen systems',
    requirements: ['Wet chemical', 'Hood and duct protection', 'Manual activation'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-223',
    section: 'Part VIII',
    title: 'Paint booth systems',
    description: 'Paint booth fire protection',
    requirements: ['Explosion proof', 'Deluge system', 'Ventilation interlock'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-224',
    section: 'Part VIII',
    title: 'Emergency communication',
    description: 'Emergency communication systems',
    requirements: ['Fire brigade connection', 'Emergency phones', 'Radio coverage'],
    category: 'mandatory',
    applicableToTypes: ['high-rise', 'institutional']
  }
];

// PART IX - FIRE ALARMS, WATER SUPPLY & SANITATION (By-laws 225-246)
export const partIX_waterSanitation: UBBLClause[] = [
  {
    id: 'ubbl-225',
    section: 'Part IX',
    title: 'Water supply connection',
    description: 'Connection to public water supply',
    requirements: ['Approved meter', 'Backflow prevention', 'Adequate pressure'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-226',
    section: 'Part IX',
    title: 'Storage tanks',
    description: 'Water storage tank requirements',
    requirements: ['Adequate capacity', 'Mosquito proofing', 'Overflow provisions'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-227',
    section: 'Part IX',
    title: 'Pumping systems',
    description: 'Water pump installations',
    requirements: ['Duty and standby', 'Pressure control', 'Suction tank'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-228',
    section: 'Part IX',
    title: 'Pipe materials',
    description: 'Approved pipe materials',
    requirements: ['UPVC, GI, copper', 'Pressure rating', 'Joint methods'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-229',
    section: 'Part IX',
    title: 'Pipe sizing',
    description: 'Water pipe sizing requirements',
    requirements: ['Flow calculations', 'Velocity limits', 'Pressure loss'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-230',
    section: 'Part IX',
    title: 'Sanitary appliances',
    description: 'Requirements for sanitary fittings',
    requirements: ['Water closets', 'Wash basins', 'Urinals'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-231',
    section: 'Part IX',
    title: 'Drainage systems',
    description: 'Sanitary drainage requirements',
    requirements: ['Separate systems', 'Adequate gradients', 'Inspection chambers'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-232',
    section: 'Part IX',
    title: 'Soil and waste pipes',
    description: 'Soil and waste pipe requirements',
    requirements: ['100mm soil pipes', 'Vent pipes', 'Anti-siphonage'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-233',
    section: 'Part IX',
    title: 'Traps and seals',
    description: 'Requirements for traps',
    requirements: ['75mm water seal', 'Self-cleansing', 'Access for cleaning'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-234',
    section: 'Part IX',
    title: 'Grease traps',
    description: 'Grease trap installations',
    requirements: ['Commercial kitchens', 'Sizing calculations', 'Regular cleaning'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-235',
    section: 'Part IX',
    title: 'Septic tanks',
    description: 'Septic tank requirements',
    requirements: ['Capacity calculations', 'Two compartments', 'Soakaway system'],
    category: 'conditional',
    applicableToTypes: ['residential', 'low-rise']
  },
  {
    id: 'ubbl-236',
    section: 'Part IX',
    title: 'Sewage treatment',
    description: 'On-site sewage treatment',
    requirements: ['Treatment standards', 'Discharge quality', 'Maintenance'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-237',
    section: 'Part IX',
    title: 'Storm water drainage',
    description: 'Surface water drainage',
    requirements: ['Separate from foul', 'Adequate capacity', 'Silt traps'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-238',
    section: 'Part IX',
    title: 'Roof drainage',
    description: 'Roof water disposal',
    requirements: ['Gutters and downpipes', 'Overflow provisions', 'Rainwater harvesting'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-239',
    section: 'Part IX',
    title: 'Subsoil drainage',
    description: 'Subsoil drain requirements',
    requirements: ['Perforated pipes', 'Filter material', 'Outlet provisions'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-240',
    section: 'Part IX',
    title: 'Hot water systems',
    description: 'Hot water supply requirements',
    requirements: ['Storage or instantaneous', 'Temperature control', 'Safety valves'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-241',
    section: 'Part IX',
    title: 'Water quality',
    description: 'Potable water quality',
    requirements: ['Testing requirements', 'Treatment if necessary', 'Cross-connection control'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  },
  {
    id: 'ubbl-242',
    section: 'Part IX',
    title: 'Industrial waste',
    description: 'Industrial effluent treatment',
    requirements: ['Pre-treatment', 'Discharge standards', 'Monitoring'],
    category: 'mandatory',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-243',
    section: 'Part IX',
    title: 'Medical waste',
    description: 'Healthcare waste disposal',
    requirements: ['Segregation', 'Special treatment', 'Licensed disposal'],
    category: 'conditional',
    applicableToTypes: ['institutional']
  },
  {
    id: 'ubbl-244',
    section: 'Part IX',
    title: 'Swimming pool water',
    description: 'Pool water treatment',
    requirements: ['Filtration system', 'Chemical treatment', 'Backwash disposal'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-245',
    section: 'Part IX',
    title: 'Water conservation',
    description: 'Water saving measures',
    requirements: ['Low flow fixtures', 'Dual flush WCs', 'Sensor taps'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-246',
    section: 'Part IX',
    title: 'Plumbing maintenance',
    description: 'Maintenance access provisions',
    requirements: ['Access panels', 'Isolation valves', 'Service ducts'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  }
];

// PART X - LIFTS AND ESCALATORS (By-laws 247-254)
export const partX_liftsEscalators: UBBLClause[] = [
  {
    id: 'ubbl-247',
    section: 'Part X',
    title: 'Lift requirements',
    description: 'General lift installation requirements',
    requirements: ['MS 1184 compliance', 'Load testing', 'Safety certificates'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-248',
    section: 'Part X',
    title: 'Number of lifts',
    description: 'Minimum number of lifts required',
    requirements: ['Traffic analysis', 'Waiting time <30s', 'One goods lift'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-249',
    section: 'Part X',
    title: 'Lift capacity',
    description: 'Lift car capacity requirements',
    requirements: ['Minimum 630kg', 'Wheelchair accessible', 'Stretcher lift for hospitals'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-250',
    section: 'Part X',
    title: 'Escalators',
    description: 'Escalator installation requirements',
    requirements: ['MS standards', 'Emergency stop', 'Safety devices'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-251',
    section: 'Part X',
    title: 'Moving walks',
    description: 'Travelator requirements',
    requirements: ['Speed limits', 'Handrails', 'Emergency stops'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-252',
    section: 'Part X',
    title: 'Lift maintenance',
    description: 'Maintenance and inspection',
    requirements: ['Monthly maintenance', 'Annual inspection', 'Service records'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-253',
    section: 'Part X',
    title: 'Emergency operation',
    description: 'Emergency lift operation',
    requirements: ['ARD system', 'Fireman control', 'Emergency power'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-254',
    section: 'Part X',
    title: 'Disabled access lifts',
    description: 'Platform lifts for disabled',
    requirements: ['Wheelchair platforms', 'Controls at suitable height', 'Audio/visual signals'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  }
];

// PART XI - ADVERTISEMENT SIGNS & HOARDINGS (By-laws 255-261)
export const partXI_signage: UBBLClause[] = [
  {
    id: 'ubbl-255',
    section: 'Part XI',
    title: 'Advertisement signs',
    description: 'Requirements for signage',
    requirements: ['Structural safety', 'Electrical safety', 'Maintenance access'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'mixed-use']
  },
  {
    id: 'ubbl-256',
    section: 'Part XI',
    title: 'Projecting signs',
    description: 'Signs projecting over public way',
    requirements: ['Minimum clearance 2.5m', 'Maximum projection', 'Wind load design'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-257',
    section: 'Part XI',
    title: 'Illuminated signs',
    description: 'Requirements for lit signage',
    requirements: ['Electrical certification', 'Light intensity limits', 'Timer controls'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'mixed-use']
  },
  {
    id: 'ubbl-258',
    section: 'Part XI',
    title: 'Roof signs',
    description: 'Signs on building roofs',
    requirements: ['Structural analysis', 'Lightning protection', 'Aviation clearance'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-259',
    section: 'Part XI',
    title: 'Billboard structures',
    description: 'Large advertising structures',
    requirements: ['Foundation design', 'Wind resistance', 'Periodic inspection'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-260',
    section: 'Part XI',
    title: 'Digital displays',
    description: 'LED and digital signage',
    requirements: ['Brightness control', 'Content restrictions', 'Electrical safety'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-261',
    section: 'Part XI',
    title: 'Temporary signs',
    description: 'Temporary advertising',
    requirements: ['Time limitations', 'Removal requirements', 'Safety provisions'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'mixed-use']
  }
];

// PART XII - MISCELLANEOUS (By-laws 262-343)
export const partXII_miscellaneous: UBBLClause[] = [
  {
    id: 'ubbl-262',
    section: 'Part XII',
    title: 'Telecommunications',
    description: 'Telecommunication infrastructure',
    requirements: ['Riser provisions', 'Equipment rooms', 'Cable management'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-263',
    section: 'Part XII',
    title: 'Security systems',
    description: 'Building security provisions',
    requirements: ['CCTV systems', 'Access control', 'Intrusion detection'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-264',
    section: 'Part XII',
    title: 'Building automation',
    description: 'Building management systems',
    requirements: ['Integrated controls', 'Energy monitoring', 'Remote access'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-265',
    section: 'Part XII',
    title: 'Energy efficiency',
    description: 'Energy conservation measures',
    requirements: ['Insulation standards', 'Efficient lighting', 'OTTV compliance'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-266',
    section: 'Part XII',
    title: 'Green building',
    description: 'Sustainable building features',
    requirements: ['GBI certification', 'Water efficiency', 'Indoor air quality'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-267',
    section: 'Part XII',
    title: 'Acoustic requirements',
    description: 'Sound control measures',
    requirements: ['STC ratings', 'Equipment isolation', 'Reverberation control'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-268',
    section: 'Part XII',
    title: 'Vibration control',
    description: 'Vibration isolation requirements',
    requirements: ['Equipment mounting', 'Structural isolation', 'Monitoring'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'high-rise']
  },
  {
    id: 'ubbl-269',
    section: 'Part XII',
    title: 'Indoor air quality',
    description: 'Air quality standards',
    requirements: ['Ventilation rates', 'Filtration', 'CO2 monitoring'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-270',
    section: 'Part XII',
    title: 'Pest control',
    description: 'Pest prevention measures',
    requirements: ['Physical barriers', 'Treatment provisions', 'Regular inspection'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-271',
    section: 'Part XII',
    title: 'Mailbox provisions',
    description: 'Mail delivery facilities',
    requirements: ['Individual mailboxes', 'Parcel lockers', 'Central location'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'mixed-use']
  },
  {
    id: 'ubbl-272',
    section: 'Part XII',
    title: 'Bicycle facilities',
    description: 'Bicycle parking and amenities',
    requirements: ['Secure parking', 'Shower facilities', 'Changing rooms'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-273',
    section: 'Part XII',
    title: 'Electric vehicle charging',
    description: 'EV charging infrastructure',
    requirements: ['Power provisions', 'Parking allocation', 'Future proofing'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'residential', 'mixed-use', 'high-rise']
  },
  {
    id: 'ubbl-274',
    section: 'Part XII',
    title: 'Facade maintenance',
    description: 'Building facade access',
    requirements: ['BMU systems', 'Anchor points', 'Maintenance schedule'],
    category: 'mandatory',
    applicableToTypes: ['high-rise']
  },
  {
    id: 'ubbl-275',
    section: 'Part XII',
    title: 'Window cleaning',
    description: 'Window cleaning provisions',
    requirements: ['Access equipment', 'Safety restraints', 'Water points'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-276',
    section: 'Part XII',
    title: 'Antenna installations',
    description: 'Radio and TV antennas',
    requirements: ['Structural support', 'Lightning protection', 'Cable routes'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'high-rise']
  },
  {
    id: 'ubbl-277',
    section: 'Part XII',
    title: 'Satellite dishes',
    description: 'Satellite dish installations',
    requirements: ['Designated locations', 'Size limits', 'Wind loading'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'mixed-use']
  },
  {
    id: 'ubbl-278',
    section: 'Part XII',
    title: 'Flag poles',
    description: 'Flag pole installations',
    requirements: ['Height restrictions', 'Lighting', 'Structural design'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-279',
    section: 'Part XII',
    title: 'Art installations',
    description: 'Public art requirements',
    requirements: ['Structural safety', 'Public access', 'Maintenance'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-280',
    section: 'Part XII',
    title: 'Water features',
    description: 'Fountains and water features',
    requirements: ['Water treatment', 'Safety barriers', 'Pump rooms'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-281',
    section: 'Part XII',
    title: 'Playground equipment',
    description: 'Children playground safety',
    requirements: ['Safety standards', 'Impact surfaces', 'Age appropriate'],
    category: 'conditional',
    applicableToTypes: ['residential', 'institutional']
  },
  {
    id: 'ubbl-282',
    section: 'Part XII',
    title: 'Gymnasium facilities',
    description: 'Fitness facility requirements',
    requirements: ['Ventilation', 'Floor loading', 'Safety equipment'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-283',
    section: 'Part XII',
    title: 'Sauna and steam rooms',
    description: 'Sauna/steam room requirements',
    requirements: ['Waterproofing', 'Ventilation', 'Temperature controls'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-284',
    section: 'Part XII',
    title: 'Prayer rooms',
    description: 'Religious facility provisions',
    requirements: ['Ablution areas', 'Orientation', 'Separate entrances'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-285',
    section: 'Part XII',
    title: 'Childcare facilities',
    description: 'Childcare center requirements',
    requirements: ['Safety measures', 'Outdoor play area', 'Kitchen facilities'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-286',
    section: 'Part XII',
    title: 'Elderly facilities',
    description: 'Senior citizen amenities',
    requirements: ['Grab bars', 'Non-slip surfaces', 'Emergency call systems'],
    category: 'conditional',
    applicableToTypes: ['residential', 'institutional']
  },
  {
    id: 'ubbl-287',
    section: 'Part XII',
    title: 'Pet facilities',
    description: 'Pet-friendly provisions',
    requirements: ['Pet relief areas', 'Washing stations', 'Waste disposal'],
    category: 'conditional',
    applicableToTypes: ['residential', 'mixed-use']
  },
  {
    id: 'ubbl-288',
    section: 'Part XII',
    title: 'Smoking areas',
    description: 'Designated smoking zones',
    requirements: ['Open air or ventilated', 'Away from entrances', 'Ash receptacles'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-289',
    section: 'Part XII',
    title: 'Emergency shelter',
    description: 'Emergency assembly areas',
    requirements: ['Adequate space', 'Weather protection', 'Communications'],
    category: 'mandatory',
    applicableToTypes: ['institutional', 'assembly', 'high-rise']
  },
  {
    id: 'ubbl-290',
    section: 'Part XII',
    title: 'First aid rooms',
    description: 'Medical emergency facilities',
    requirements: ['Minimum size', 'Equipment', 'Accessibility'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-291',
    section: 'Part XII',
    title: 'Lactation rooms',
    description: 'Nursing mother facilities',
    requirements: ['Privacy', 'Comfortable seating', 'Refrigeration'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-292',
    section: 'Part XII',
    title: 'Multi-purpose halls',
    description: 'Community hall requirements',
    requirements: ['Flexible space', 'AV systems', 'Storage'],
    category: 'conditional',
    applicableToTypes: ['residential', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-293',
    section: 'Part XII',
    title: 'Meeting rooms',
    description: 'Conference room standards',
    requirements: ['Acoustic treatment', 'AV provisions', 'Natural light'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-294',
    section: 'Part XII',
    title: 'Library facilities',
    description: 'Reading room requirements',
    requirements: ['Quiet zones', 'Adequate lighting', 'Study spaces'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'residential']
  },
  {
    id: 'ubbl-295',
    section: 'Part XII',
    title: 'Cafeteria facilities',
    description: 'Dining facility standards',
    requirements: ['Kitchen provisions', 'Seating capacity', 'Ventilation'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'industrial']
  },
  {
    id: 'ubbl-296',
    section: 'Part XII',
    title: 'Retail spaces',
    description: 'Shop unit requirements',
    requirements: ['Shopfront design', 'Service provisions', 'Storage'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-297',
    section: 'Part XII',
    title: 'ATM installations',
    description: 'Automated teller machines',
    requirements: ['Security provisions', 'Accessibility', 'Lighting'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'mixed-use']
  },
  {
    id: 'ubbl-298',
    section: 'Part XII',
    title: 'Vending machines',
    description: 'Vending machine areas',
    requirements: ['Power supply', 'Ventilation', 'Waste bins'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-299',
    section: 'Part XII',
    title: 'Storage rooms',
    description: 'General storage requirements',
    requirements: ['Ventilation', 'Shelving', 'Security'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-300',
    section: 'Part XII',
    title: 'Utility rooms',
    description: 'Service room requirements',
    requirements: ['Access for maintenance', 'Ventilation', 'Drainage'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-301',
    section: 'Part XII',
    title: 'Electrical rooms',
    description: 'Electrical service rooms',
    requirements: ['Fire rating', 'Ventilation', 'Access control'],
    category: 'mandatory',
    applicableToTypes: ['commercial', 'industrial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-302',
    section: 'Part XII',
    title: 'Generator provisions',
    description: 'Standby generator requirements',
    requirements: ['Acoustic enclosure', 'Fuel storage', 'Exhaust system'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-303',
    section: 'Part XII',
    title: 'Solar panel systems',
    description: 'Photovoltaic installations',
    requirements: ['Structural loading', 'Electrical safety', 'Access for maintenance'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-304',
    section: 'Part XII',
    title: 'Rainwater harvesting',
    description: 'Rainwater collection systems',
    requirements: ['Storage capacity', 'Treatment', 'Distribution'],
    category: 'recommended',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-305',
    section: 'Part XII',
    title: 'Grey water recycling',
    description: 'Water recycling systems',
    requirements: ['Treatment standards', 'Separate piping', 'Signage'],
    category: 'recommended',
    applicableToTypes: ['commercial', 'institutional', 'high-rise']
  },
  {
    id: 'ubbl-306',
    section: 'Part XII',
    title: 'Waste sorting',
    description: 'Recycling facilities',
    requirements: ['Separate bins', 'Collection areas', 'Signage'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'institutional', 'mixed-use']
  },
  {
    id: 'ubbl-307',
    section: 'Part XII',
    title: 'Composting facilities',
    description: 'Organic waste management',
    requirements: ['Ventilation', 'Pest control', 'Collection system'],
    category: 'recommended',
    applicableToTypes: ['residential', 'institutional']
  },
  {
    id: 'ubbl-308',
    section: 'Part XII',
    title: 'Chemical storage',
    description: 'Hazardous material storage',
    requirements: ['Bunding', 'Ventilation', 'Safety equipment'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-309',
    section: 'Part XII',
    title: 'Gas cylinder storage',
    description: 'LPG cylinder storage',
    requirements: ['Open air location', 'Safety distances', 'Signage'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial', 'institutional']
  },
  {
    id: 'ubbl-310',
    section: 'Part XII',
    title: 'Fuel storage',
    description: 'Diesel/petrol storage',
    requirements: ['Double wall tanks', 'Leak detection', 'Fire suppression'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'commercial']
  },
  {
    id: 'ubbl-311',
    section: 'Part XII',
    title: 'Cold storage',
    description: 'Refrigerated storage',
    requirements: ['Insulation', 'Temperature monitoring', 'Backup cooling'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-312',
    section: 'Part XII',
    title: 'Document storage',
    description: 'Archive room requirements',
    requirements: ['Fire rating', 'Climate control', 'Security'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-313',
    section: 'Part XII',
    title: 'IT infrastructure',
    description: 'Data center requirements',
    requirements: ['Cooling systems', 'UPS', 'Fire suppression'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-314',
    section: 'Part XII',
    title: 'Broadcasting facilities',
    description: 'Radio/TV studio requirements',
    requirements: ['Acoustic isolation', 'Technical power', 'HVAC control'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-315',
    section: 'Part XII',
    title: 'Photography studios',
    description: 'Photo studio requirements',
    requirements: ['Lighting control', 'Backdrop systems', 'Power provisions'],
    category: 'conditional',
    applicableToTypes: ['commercial']
  },
  {
    id: 'ubbl-316',
    section: 'Part XII',
    title: 'Workshop spaces',
    description: 'Workshop facility standards',
    requirements: ['Ventilation', 'Power tools', 'Safety equipment'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-317',
    section: 'Part XII',
    title: 'Exhibition spaces',
    description: 'Gallery and exhibition requirements',
    requirements: ['Lighting systems', 'Climate control', 'Security'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-318',
    section: 'Part XII',
    title: 'Performance venues',
    description: 'Theater and stage requirements',
    requirements: ['Stage equipment', 'Acoustic design', 'Backstage facilities'],
    category: 'conditional',
    applicableToTypes: ['assembly', 'institutional']
  },
  {
    id: 'ubbl-319',
    section: 'Part XII',
    title: 'Cinema requirements',
    description: 'Movie theater standards',
    requirements: ['Projection rooms', 'Sound systems', 'Emergency exits'],
    category: 'conditional',
    applicableToTypes: ['assembly', 'commercial']
  },
  {
    id: 'ubbl-320',
    section: 'Part XII',
    title: 'Sports courts',
    description: 'Indoor sports facilities',
    requirements: ['Court markings', 'Lighting levels', 'Ventilation'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'assembly', 'residential']
  },
  {
    id: 'ubbl-321',
    section: 'Part XII',
    title: 'Bowling alleys',
    description: 'Bowling facility requirements',
    requirements: ['Lane specifications', 'Pin setters', 'Return systems'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'assembly']
  },
  {
    id: 'ubbl-322',
    section: 'Part XII',
    title: 'Spa facilities',
    description: 'Spa and wellness centers',
    requirements: ['Treatment rooms', 'Hygiene standards', 'Privacy'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-323',
    section: 'Part XII',
    title: 'Barber and salon',
    description: 'Hair salon requirements',
    requirements: ['Washing facilities', 'Ventilation', 'Chemical storage'],
    category: 'conditional',
    applicableToTypes: ['commercial']
  },
  {
    id: 'ubbl-324',
    section: 'Part XII',
    title: 'Laundry facilities',
    description: 'Laundry room requirements',
    requirements: ['Drainage', 'Ventilation', 'Hot water supply'],
    category: 'conditional',
    applicableToTypes: ['residential', 'commercial', 'institutional']
  },
  {
    id: 'ubbl-325',
    section: 'Part XII',
    title: 'Dry cleaning',
    description: 'Dry cleaning facility standards',
    requirements: ['Chemical storage', 'Ventilation systems', 'Waste disposal'],
    category: 'conditional',
    applicableToTypes: ['commercial']
  },
  {
    id: 'ubbl-326',
    section: 'Part XII',
    title: 'Car wash facilities',
    description: 'Vehicle washing requirements',
    requirements: ['Water recycling', 'Oil separators', 'Drainage'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'industrial']
  },
  {
    id: 'ubbl-327',
    section: 'Part XII',
    title: 'Petrol stations',
    description: 'Fuel dispensing requirements',
    requirements: ['Underground tanks', 'Vapor recovery', 'Fire systems'],
    category: 'conditional',
    applicableToTypes: ['commercial']
  },
  {
    id: 'ubbl-328',
    section: 'Part XII',
    title: 'Bus terminals',
    description: 'Public transport facilities',
    requirements: ['Passenger amenities', 'Information systems', 'Accessibility'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'assembly']
  },
  {
    id: 'ubbl-329',
    section: 'Part XII',
    title: 'Taxi stands',
    description: 'Taxi waiting areas',
    requirements: ['Weather protection', 'Queuing systems', 'Lighting'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional', 'assembly']
  },
  {
    id: 'ubbl-330',
    section: 'Part XII',
    title: 'Helipad facilities',
    description: 'Helicopter landing requirements',
    requirements: ['Obstacle clearance', 'Fire fighting', 'Lighting systems'],
    category: 'conditional',
    applicableToTypes: ['high-rise', 'institutional']
  },
  {
    id: 'ubbl-331',
    section: 'Part XII',
    title: 'Marina facilities',
    description: 'Boat docking requirements',
    requirements: ['Mooring systems', 'Utilities supply', 'Safety equipment'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'residential']
  },
  {
    id: 'ubbl-332',
    section: 'Part XII',
    title: 'Quarantine rooms',
    description: 'Isolation facility requirements',
    requirements: ['Negative pressure', 'Anteroom', 'HEPA filtration'],
    category: 'conditional',
    applicableToTypes: ['institutional']
  },
  {
    id: 'ubbl-333',
    section: 'Part XII',
    title: 'Mortuary facilities',
    description: 'Mortuary requirements',
    requirements: ['Refrigeration', 'Ventilation', 'Viewing rooms'],
    category: 'conditional',
    applicableToTypes: ['institutional']
  },
  {
    id: 'ubbl-334',
    section: 'Part XII',
    title: 'Animal facilities',
    description: 'Veterinary and animal care',
    requirements: ['Kennels', 'Examination rooms', 'Isolation areas'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-335',
    section: 'Part XII',
    title: 'Agricultural buildings',
    description: 'Farm building requirements',
    requirements: ['Natural ventilation', 'Storage', 'Processing areas'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-336',
    section: 'Part XII',
    title: 'Greenhouse structures',
    description: 'Greenhouse requirements',
    requirements: ['Climate control', 'Irrigation', 'Structural design'],
    category: 'conditional',
    applicableToTypes: ['commercial', 'institutional']
  },
  {
    id: 'ubbl-337',
    section: 'Part XII',
    title: 'Aquaculture facilities',
    description: 'Fish farming requirements',
    requirements: ['Water systems', 'Aeration', 'Waste treatment'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-338',
    section: 'Part XII',
    title: 'Food processing',
    description: 'Food factory requirements',
    requirements: ['Hygiene standards', 'Temperature control', 'Waste management'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-339',
    section: 'Part XII',
    title: 'Pharmaceutical facilities',
    description: 'Drug manufacturing standards',
    requirements: ['Clean rooms', 'Quality control', 'Controlled substances'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-340',
    section: 'Part XII',
    title: 'Biotechnology labs',
    description: 'Biotech facility requirements',
    requirements: ['Containment levels', 'Decontamination', 'Waste treatment'],
    category: 'conditional',
    applicableToTypes: ['industrial', 'institutional']
  },
  {
    id: 'ubbl-341',
    section: 'Part XII',
    title: 'Nuclear facilities',
    description: 'Radiation control requirements',
    requirements: ['Shielding', 'Monitoring systems', 'Decontamination'],
    category: 'conditional',
    applicableToTypes: ['institutional', 'industrial']
  },
  {
    id: 'ubbl-342',
    section: 'Part XII',
    title: 'Explosive storage',
    description: 'Magazine requirements',
    requirements: ['Blast resistance', 'Lightning protection', 'Security'],
    category: 'conditional',
    applicableToTypes: ['industrial']
  },
  {
    id: 'ubbl-343',
    section: 'Part XII',
    title: 'Final inspection',
    description: 'Final compliance verification',
    requirements: ['All systems tested', 'Documentation complete', 'Certificate issuance'],
    category: 'mandatory',
    applicableToTypes: ['residential', 'commercial', 'industrial', 'institutional', 'assembly', 'mixed-use', 'high-rise', 'low-rise']
  }
];

// Combine all clauses from Part 2
export const allPart2Clauses = [
  ...partVIII_fireAlarms,
  ...partIX_waterSanitation,
  ...partX_liftsEscalators,
  ...partXI_signage,
  ...partXII_miscellaneous
];

// Export count
export const PART2_CLAUSE_COUNT = allPart2Clauses.length; // Should be 172 (343-171)