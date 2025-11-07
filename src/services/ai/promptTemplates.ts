/**
 * Prompt Templates Management System
 * Reusable, optimized prompts for various AI tasks
 */

export interface PromptTemplate {
  id: string
  name: string
  category: string
  description: string
  template: string
  variables: string[]
  examples?: Record<string, any>[]
  modelPreference?: string
  temperature?: number
  maxTokens?: number
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // Project Management Templates
  PROJECT_TIMELINE: {
    id: 'project_timeline',
    name: 'Project Timeline Generation',
    category: 'project_management',
    description: 'Generate detailed project timeline with milestones',
    template: `Create a comprehensive project timeline for a {{projectType}} project in {{location}}.

Project Details:
- Scope: {{scope}}
- Budget: {{currency}} {{budget}}
- Start Date: {{startDate}}
- Team Size: {{teamSize}}
- Special Requirements: {{requirements}}

Consider:
1. Malaysian construction seasons and weather patterns
2. Local authority approval timelines
3. Material procurement lead times
4. Public holidays and cultural events
5. Regulatory inspection points

Provide:
- Key milestones with dates
- Phase dependencies
- Critical path activities
- Risk buffer periods
- Resource allocation per phase`,
    variables: ['projectType', 'location', 'scope', 'currency', 'budget', 'startDate', 'teamSize', 'requirements'],
    temperature: 0.7,
    maxTokens: 2000,
  },

  RISK_ASSESSMENT: {
    id: 'risk_assessment',
    name: 'Project Risk Assessment',
    category: 'project_management',
    description: 'Comprehensive risk analysis for projects',
    template: `Conduct a thorough risk assessment for this {{projectType}} project:

Project Context:
{{projectContext}}

Analyze:
1. Technical risks (design, construction, materials)
2. Financial risks (budget overruns, payment delays)
3. Regulatory risks (compliance, approvals)
4. Environmental risks (weather, site conditions)
5. Market risks (material costs, labor availability)
6. Stakeholder risks (client changes, contractor issues)

For each risk provide:
- Probability (High/Medium/Low)
- Impact (Critical/Major/Minor)
- Mitigation strategies
- Contingency plans
- Early warning indicators
- Responsible party

Focus on Malaysian-specific considerations.`,
    variables: ['projectType', 'projectContext'],
    temperature: 0.6,
    maxTokens: 2500,
  },

  // Design Templates
  DESIGN_CONCEPT: {
    id: 'design_concept',
    name: 'Design Concept Generation',
    category: 'design',
    description: 'Generate creative design concepts',
    template: `Generate innovative design concepts for a {{spaceType}} with {{style}} style.

Client Requirements:
- Purpose: {{purpose}}
- Target Users: {{targetUsers}}
- Space Size: {{size}} sq meters
- Budget Range: {{currency}} {{minBudget}} - {{maxBudget}}
- Must-Have Features: {{features}}
- Cultural Preferences: {{culturalPrefs}}
- Climate Considerations: {{climate}}

Provide:
1. Overall design concept and philosophy
2. Color palette with hex codes
3. Material selections with local suppliers
4. Furniture recommendations
5. Lighting design approach
6. Space optimization strategies
7. Sustainability features
8. Cultural elements integration
9. Estimated cost breakdown
10. 3D visualization description`,
    variables: ['spaceType', 'style', 'purpose', 'targetUsers', 'size', 'currency', 'minBudget', 'maxBudget', 'features', 'culturalPrefs', 'climate'],
    temperature: 0.8,
    maxTokens: 2000,
  },

  MATERIAL_SELECTION: {
    id: 'material_selection',
    name: 'Material Selection Guide',
    category: 'design',
    description: 'Recommend appropriate materials for projects',
    template: `Recommend suitable materials for a {{projectType}} in {{location}} with {{style}} design.

Requirements:
- Climate: {{climate}}
- Budget Level: {{budgetLevel}}
- Durability Needs: {{durability}}
- Maintenance Preference: {{maintenance}}
- Sustainability Priority: {{sustainability}}

For each material category provide:
1. Primary recommendation with Malaysian supplier
2. Alternative options
3. Cost per unit (MYR)
4. Pros and cons
5. Installation requirements
6. Maintenance schedule
7. Lifespan estimate
8. Environmental impact

Categories to cover:
- Flooring
- Wall finishes
- Ceiling materials
- External cladding
- Roofing
- Insulation
- Windows and doors`,
    variables: ['projectType', 'location', 'style', 'climate', 'budgetLevel', 'durability', 'maintenance', 'sustainability'],
    temperature: 0.6,
    maxTokens: 2000,
  },

  // Compliance Templates
  UBBL_CHECK: {
    id: 'ubbl_check',
    name: 'UBBL Compliance Check',
    category: 'compliance',
    description: 'Check compliance with UBBL regulations',
    template: `Analyze this building specification for UBBL compliance:

Building Type: {{buildingType}}
Location: {{location}}
Specifications:
{{specifications}}

Check against UBBL requirements for:
1. Building setbacks (Part III)
2. Plot ratio and density (Part III)
3. Building height restrictions (Part III)
4. Natural lighting and ventilation (Part III, Section 39-44)
5. Fire safety requirements (Part VII)
6. Structural requirements (Part IV)
7. Sanitary facilities (Part V)
8. Open spaces and parking (Part III)

For each area:
- State the relevant UBBL clause
- Identify compliance status (Compliant/Non-compliant/Needs Review)
- Specify the requirement
- Note current specification
- Provide recommendations if non-compliant

Output format: Structured JSON`,
    variables: ['buildingType', 'location', 'specifications'],
    temperature: 0.3,
    maxTokens: 2500,
  },

  AUTHORITY_SUBMISSION: {
    id: 'authority_submission',
    name: 'Authority Submission Checklist',
    category: 'compliance',
    description: 'Generate submission requirements for local authorities',
    template: `Create a comprehensive submission checklist for {{authority}} approval of a {{projectType}} project.

Project Details:
- Location: {{address}}
- Land Title: {{landTitle}}
- Development Type: {{developmentType}}
- Total Built-Up Area: {{builtUpArea}} sq meters

Generate:
1. Required documents list with descriptions
2. Form numbers and where to obtain them
3. Technical drawing requirements
4. Professional endorsements needed
5. Fee calculation breakdown
6. Submission sequence and timeline
7. Common rejection reasons to avoid
8. Tips for faster approval

Format as actionable checklist with checkboxes.`,
    variables: ['authority', 'projectType', 'address', 'landTitle', 'developmentType', 'builtUpArea'],
    temperature: 0.4,
    maxTokens: 2000,
  },

  // Communication Templates
  CLIENT_UPDATE: {
    id: 'client_update',
    name: 'Client Project Update',
    category: 'communication',
    description: 'Generate professional client update emails',
    template: `Draft a professional project update email for the client.

Project: {{projectName}}
Current Phase: {{currentPhase}}
Update Period: {{period}}

Key Updates:
{{updates}}

Issues/Challenges:
{{issues}}

Tone: {{tone}}
Length: {{length}}

Include:
1. Executive summary
2. Progress against timeline
3. Budget status
4. Key achievements
5. Upcoming milestones
6. Action items requiring client input
7. Risk mitigation updates
8. Next steps

Make it clear, concise, and actionable.`,
    variables: ['projectName', 'currentPhase', 'period', 'updates', 'issues', 'tone', 'length'],
    temperature: 0.7,
    maxTokens: 1500,
  },

  VENDOR_NEGOTIATION: {
    id: 'vendor_negotiation',
    name: 'Vendor Negotiation Script',
    category: 'communication',
    description: 'Negotiation talking points for vendors',
    template: `Create negotiation talking points for discussing with {{vendorType}} vendor.

Current Quote: {{currency}} {{currentQuote}}
Target Price: {{currency}} {{targetPrice}}
Volume: {{volume}}
Timeline: {{timeline}}
Payment Terms: {{paymentTerms}}

Provide:
1. Opening position
2. Key negotiation levers
3. Value propositions to highlight
4. Concessions we can offer
5. Walk-away points
6. Alternative vendor mentions (ethically)
7. Win-win scenarios
8. Closing techniques

Consider Malaysian business culture and practices.`,
    variables: ['vendorType', 'currency', 'currentQuote', 'targetPrice', 'volume', 'timeline', 'paymentTerms'],
    temperature: 0.6,
    maxTokens: 1500,
  },

  // Analysis Templates
  COST_ANALYSIS: {
    id: 'cost_analysis',
    name: 'Cost Analysis Report',
    category: 'analysis',
    description: 'Detailed cost breakdown and analysis',
    template: `Perform detailed cost analysis for {{projectType}} project.

Initial Budget: {{currency}} {{budget}}
Current Spent: {{currency}} {{spent}}
Project Completion: {{completion}}%

Cost Categories:
{{costBreakdown}}

Analyze:
1. Cost variance by category
2. Burn rate analysis
3. Projected final cost
4. Cost-saving opportunities
5. Risk areas for overrun
6. Recommended contingency
7. Cash flow projection
8. Payment milestone alignment

Provide insights and actionable recommendations.`,
    variables: ['projectType', 'currency', 'budget', 'spent', 'completion', 'costBreakdown'],
    temperature: 0.5,
    maxTokens: 2000,
  },

  SUSTAINABILITY_ASSESSMENT: {
    id: 'sustainability_assessment',
    name: 'Sustainability Assessment',
    category: 'analysis',
    description: 'Evaluate project sustainability',
    template: `Evaluate sustainability aspects of this {{projectType}} project:

Project Description:
{{description}}

Location: {{location}}
Climate Zone: {{climateZone}}

Assess:
1. Energy efficiency measures
2. Water conservation strategies
3. Material sustainability (embodied carbon)
4. Waste reduction approaches
5. Indoor environmental quality
6. Site ecology preservation
7. Renewable energy potential
8. Green certification eligibility (GBI, LEED)

Provide:
- Current sustainability score (0-100)
- Improvement recommendations with ROI
- Certification pathway
- Long-term benefits analysis
- Malaysian green incentives applicable`,
    variables: ['projectType', 'description', 'location', 'climateZone'],
    temperature: 0.6,
    maxTokens: 2000,
  },
}

/**
 * Template Manager Class
 */
class PromptTemplateManager {
  private templates: Map<string, PromptTemplate>

  constructor() {
    this.templates = new Map(Object.entries(PROMPT_TEMPLATES))
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category)
  }

  /**
   * Fill template with variables
   */
  fillTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    let filled = template.template
    
    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      filled = filled.replace(regex, String(value))
    }
    
    // Check for missing variables
    const missing = filled.match(/{{(\w+)}}/g)
    if (missing) {
      console.warn(`Missing variables in template ${templateId}:`, missing)
    }
    
    return filled
  }

  /**
   * Validate variables for template
   */
  validateVariables(templateId: string, variables: Record<string, any>): {
    valid: boolean
    missing: string[]
    extra: string[]
  } {
    const template = this.getTemplate(templateId)
    if (!template) {
      return { valid: false, missing: [], extra: [] }
    }

    const required = new Set(template.variables)
    const provided = new Set(Object.keys(variables))
    
    const missing = template.variables.filter(v => !provided.has(v))
    const extra = Object.keys(variables).filter(v => !required.has(v))
    
    return {
      valid: missing.length === 0,
      missing,
      extra,
    }
  }

  /**
   * Add custom template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Remove template
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id)
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): PromptTemplate[] {
    const queryLower = query.toLowerCase()
    return this.getAllTemplates().filter(t => 
      t.name.toLowerCase().includes(queryLower) ||
      t.description.toLowerCase().includes(queryLower) ||
      t.category.toLowerCase().includes(queryLower)
    )
  }

  /**
   * Export templates as JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this.getAllTemplates(), null, 2)
  }

  /**
   * Import templates from JSON
   */
  importTemplates(json: string): void {
    try {
      const templates = JSON.parse(json) as PromptTemplate[]
      for (const template of templates) {
        this.addTemplate(template)
      }
    } catch (error) {
      console.error('Failed to import templates:', error)
      throw error
    }
  }
}

// Export singleton instance
export const promptTemplates = new PromptTemplateManager()

// Helper function to quickly fill and use a template
export function useTemplate(
  templateId: string,
  variables: Record<string, any>
): string {
  return promptTemplates.fillTemplate(templateId, variables)
}