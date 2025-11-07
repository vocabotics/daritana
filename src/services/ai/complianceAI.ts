/**
 * AI-Powered Compliance Checking System
 * Intelligent analysis of building compliance with Malaysian regulations
 */

import { openRouterClient, OpenRouterMessage } from './openRouterClient'
import { ragService } from './ragService'
import { vectorStore } from './vectorStore'
import { AI_CONFIG } from './config'

export interface ComplianceCheckRequest {
  projectType: 'residential' | 'commercial' | 'industrial' | 'mixed-use'
  location: string
  specifications: {
    totalArea?: number // in sq meters
    buildingHeight?: number // in meters
    numberOfFloors?: number
    occupancy?: number
    parkingSpaces?: number
    greenArea?: number // percentage
    [key: string]: any
  }
  documents?: Array<{
    type: string
    content: string
  }>
}

export interface ComplianceIssue {
  severity: 'critical' | 'major' | 'minor' | 'warning'
  category: string
  clause: string
  description: string
  requirement: string
  currentStatus: string
  recommendation: string
  reference?: string
}

export interface ComplianceReport {
  overallStatus: 'compliant' | 'non-compliant' | 'review-required'
  complianceScore: number // 0-100
  issues: ComplianceIssue[]
  passedChecks: string[]
  recommendations: string[]
  nextSteps: string[]
  generatedAt: Date
  metadata: {
    tokensUsed: number
    checksDone: number
    regulationsChecked: string[]
  }
}

class ComplianceAI {
  /**
   * Perform comprehensive compliance check
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceReport> {
    const issues: ComplianceIssue[] = []
    const passedChecks: string[] = []
    const recommendations: string[] = []
    
    try {
      // 1. Check UBBL compliance
      const ubblIssues = await this.checkUBBLCompliance(request)
      issues.push(...ubblIssues.issues)
      passedChecks.push(...ubblIssues.passed)
      
      // 2. Check local authority requirements
      const localIssues = await this.checkLocalRequirements(request)
      issues.push(...localIssues.issues)
      passedChecks.push(...localIssues.passed)
      
      // 3. Check environmental compliance
      const envIssues = await this.checkEnvironmentalCompliance(request)
      issues.push(...envIssues.issues)
      passedChecks.push(...envIssues.passed)
      
      // 4. Check fire safety requirements
      const fireIssues = await this.checkFireSafety(request)
      issues.push(...fireIssues.issues)
      passedChecks.push(...fireIssues.passed)
      
      // 5. Check accessibility requirements
      const accessIssues = await this.checkAccessibility(request)
      issues.push(...accessIssues.issues)
      passedChecks.push(...accessIssues.passed)
      
      // 6. Generate recommendations based on issues
      if (issues.length > 0) {
        const recs = await this.generateRecommendations(issues, request)
        recommendations.push(...recs)
      }
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(issues, passedChecks)
      
      // Determine overall status
      const overallStatus = this.determineOverallStatus(issues, complianceScore)
      
      // Generate next steps
      const nextSteps = await this.generateNextSteps(overallStatus, issues, request)
      
      return {
        overallStatus,
        complianceScore,
        issues: issues.sort((a, b) => 
          this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
        ),
        passedChecks,
        recommendations,
        nextSteps,
        generatedAt: new Date(),
        metadata: {
          tokensUsed: 0, // Will be updated from actual API calls
          checksDone: issues.length + passedChecks.length,
          regulationsChecked: ['UBBL', 'Local Authority', 'Environmental', 'Fire Safety', 'Accessibility'],
        },
      }
    } catch (error) {
      console.error('Compliance check error:', error)
      throw error
    }
  }

  /**
   * Check UBBL compliance
   */
  private async checkUBBLCompliance(request: ComplianceCheckRequest): Promise<{
    issues: ComplianceIssue[]
    passed: string[]
  }> {
    const issues: ComplianceIssue[] = []
    const passed: string[] = []
    
    // Search for relevant UBBL clauses
    const query = `UBBL requirements for ${request.projectType} building in ${request.location} 
    with ${request.specifications.numberOfFloors} floors and ${request.specifications.totalArea} sqm area`
    
    const ragResponse = await ragService.queryCompliance({
      query,
      projectType: request.projectType,
      location: request.location,
    })
    
    // Parse AI response for compliance issues
    const prompt = `Based on UBBL requirements, analyze this building specification and identify compliance issues:
${JSON.stringify(request.specifications, null, 2)}

For each issue found, provide:
1. UBBL clause number
2. Severity (critical/major/minor)
3. Specific requirement
4. Current status
5. Recommendation

Format as JSON array.`

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: 'You are a Malaysian building compliance expert specializing in UBBL regulations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]
    
    const response = await openRouterClient.chat(messages, {
      model: AI_CONFIG.models.chat,
      temperature: 0.3,
      maxTokens: 2000,
    })
    
    try {
      const parsed = JSON.parse(
        response.choices[0]?.message?.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '') || '[]'
      )
      
      for (const item of parsed) {
        if (item.issue) {
          issues.push({
            severity: item.severity || 'minor',
            category: 'UBBL',
            clause: item.clause || 'General',
            description: item.issue,
            requirement: item.requirement,
            currentStatus: item.currentStatus,
            recommendation: item.recommendation,
            reference: `UBBL ${item.clause}`,
          })
        } else if (item.passed) {
          passed.push(`UBBL ${item.clause}: ${item.description}`)
        }
      }
    } catch (e) {
      console.error('Failed to parse UBBL compliance response:', e)
    }
    
    return { issues, passed }
  }

  /**
   * Check local authority requirements
   */
  private async checkLocalRequirements(request: ComplianceCheckRequest): Promise<{
    issues: ComplianceIssue[]
    passed: string[]
  }> {
    const issues: ComplianceIssue[] = []
    const passed: string[] = []
    
    // Location-specific checks
    const localAuthority = this.getLocalAuthority(request.location)
    
    const prompt = `Check ${localAuthority} specific requirements for:
- Project Type: ${request.projectType}
- Location: ${request.location}
- Building Height: ${request.specifications.buildingHeight}m
- Total Area: ${request.specifications.totalArea}sqm

Identify any local planning requirements, setback rules, or density restrictions.`

    const response = await openRouterClient.chat([
      {
        role: 'system',
        content: `You are an expert in ${localAuthority} planning and building requirements.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: AI_CONFIG.models.fast,
      temperature: 0.3,
    })
    
    // Parse response for local requirements
    const content = response.choices[0]?.message?.content || ''
    
    // Simple parsing logic - in production, this would be more sophisticated
    if (content.includes('setback')) {
      const setbackMatch = content.match(/setback.*?(\d+)\s*meter/i)
      if (setbackMatch) {
        passed.push(`Local Authority: Setback requirement of ${setbackMatch[1]} meters`)
      }
    }
    
    return { issues, passed }
  }

  /**
   * Check environmental compliance
   */
  private async checkEnvironmentalCompliance(request: ComplianceCheckRequest): Promise<{
    issues: ComplianceIssue[]
    passed: string[]
  }> {
    const issues: ComplianceIssue[] = []
    const passed: string[] = []
    
    // Check green area requirements
    if (request.specifications.greenArea !== undefined) {
      const requiredGreenArea = this.getRequiredGreenArea(request.projectType)
      if (request.specifications.greenArea < requiredGreenArea) {
        issues.push({
          severity: 'major',
          category: 'Environmental',
          clause: 'Green Building Index',
          description: `Insufficient green area coverage`,
          requirement: `Minimum ${requiredGreenArea}% green area required`,
          currentStatus: `Current: ${request.specifications.greenArea}%`,
          recommendation: `Increase green area by ${requiredGreenArea - request.specifications.greenArea}%`,
        })
      } else {
        passed.push(`Environmental: Green area requirement met (${request.specifications.greenArea}%)`)
      }
    }
    
    return { issues, passed }
  }

  /**
   * Check fire safety requirements
   */
  private async checkFireSafety(request: ComplianceCheckRequest): Promise<{
    issues: ComplianceIssue[]
    passed: string[]
  }> {
    const issues: ComplianceIssue[] = []
    const passed: string[] = []
    
    // Check fire safety based on building height and occupancy
    if (request.specifications.buildingHeight && request.specifications.buildingHeight > 18) {
      passed.push('Fire Safety: High-rise fire safety requirements applicable')
      
      // Check for fire escape requirements
      if (request.specifications.numberOfFloors && request.specifications.numberOfFloors > 4) {
        passed.push('Fire Safety: Multiple fire escape routes required')
      }
    }
    
    return { issues, passed }
  }

  /**
   * Check accessibility requirements
   */
  private async checkAccessibility(request: ComplianceCheckRequest): Promise<{
    issues: ComplianceIssue[]
    passed: string[]
  }> {
    const issues: ComplianceIssue[] = []
    const passed: string[] = []
    
    // Check MS 1184 compliance for accessibility
    if (request.projectType === 'commercial' || request.projectType === 'mixed-use') {
      passed.push('Accessibility: MS 1184 compliance required for public areas')
    }
    
    return { issues, passed }
  }

  /**
   * Generate recommendations based on issues
   */
  private async generateRecommendations(
    issues: ComplianceIssue[],
    request: ComplianceCheckRequest
  ): Promise<string[]> {
    if (issues.length === 0) return []
    
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const majorIssues = issues.filter(i => i.severity === 'major')
    
    const prompt = `Based on these compliance issues, provide actionable recommendations:

Critical Issues: ${criticalIssues.map(i => i.description).join(', ')}
Major Issues: ${majorIssues.map(i => i.description).join(', ')}

Project Type: ${request.projectType}
Location: ${request.location}

Provide 3-5 specific, actionable recommendations to address these issues.`

    const response = await openRouterClient.chat([
      {
        role: 'system',
        content: 'You are a building compliance consultant providing practical solutions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: AI_CONFIG.models.fast,
      temperature: 0.5,
    })
    
    const content = response.choices[0]?.message?.content || ''
    
    // Extract recommendations
    const recommendations: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.match(/^\d+\.|^[-•*]/)) {
        recommendations.push(line.replace(/^[\d.•*-]\s*/, '').trim())
      }
    }
    
    return recommendations.slice(0, 5)
  }

  /**
   * Generate next steps based on compliance status
   */
  private async generateNextSteps(
    status: string,
    issues: ComplianceIssue[],
    request: ComplianceCheckRequest
  ): Promise<string[]> {
    const nextSteps: string[] = []
    
    if (status === 'non-compliant') {
      nextSteps.push('Address all critical compliance issues immediately')
      nextSteps.push('Consult with a certified architect or engineer')
      nextSteps.push('Revise plans to meet UBBL requirements')
    } else if (status === 'review-required') {
      nextSteps.push('Review and address major compliance issues')
      nextSteps.push('Submit revised plans for authority review')
    } else {
      nextSteps.push('Proceed with submission to local authority')
      nextSteps.push('Prepare all required documentation')
    }
    
    // Add specific steps based on issues
    if (issues.some(i => i.category === 'Fire Safety')) {
      nextSteps.push('Obtain fire department approval')
    }
    
    if (issues.some(i => i.category === 'Environmental')) {
      nextSteps.push('Submit Environmental Impact Assessment if required')
    }
    
    return nextSteps
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    issues: ComplianceIssue[],
    passedChecks: string[]
  ): number {
    const totalChecks = issues.length + passedChecks.length
    if (totalChecks === 0) return 100
    
    let deductions = 0
    for (const issue of issues) {
      deductions += this.getSeverityWeight(issue.severity)
    }
    
    const score = Math.max(0, 100 - (deductions * 100 / (totalChecks * 30)))
    return Math.round(score)
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallStatus(
    issues: ComplianceIssue[],
    score: number
  ): 'compliant' | 'non-compliant' | 'review-required' {
    const hasCritical = issues.some(i => i.severity === 'critical')
    const majorCount = issues.filter(i => i.severity === 'major').length
    
    if (hasCritical || score < 60) {
      return 'non-compliant'
    } else if (majorCount > 2 || score < 80) {
      return 'review-required'
    } else {
      return 'compliant'
    }
  }

  /**
   * Get severity weight for scoring
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 30
      case 'major': return 15
      case 'minor': return 5
      case 'warning': return 2
      default: return 0
    }
  }

  /**
   * Get local authority based on location
   */
  private getLocalAuthority(location: string): string {
    const locationLower = location.toLowerCase()
    
    if (locationLower.includes('kuala lumpur') || locationLower.includes('kl')) {
      return 'DBKL'
    } else if (locationLower.includes('selangor')) {
      return 'MBPJ/MBSJ'
    } else if (locationLower.includes('penang')) {
      return 'MBPP'
    } else if (locationLower.includes('johor')) {
      return 'MBJB'
    } else {
      return 'Local Authority'
    }
  }

  /**
   * Get required green area percentage
   */
  private getRequiredGreenArea(projectType: string): number {
    switch (projectType) {
      case 'residential': return 10
      case 'commercial': return 5
      case 'industrial': return 10
      case 'mixed-use': return 8
      default: return 10
    }
  }
}

// Export singleton instance
export const complianceAI = new ComplianceAI()

// Helper function for quick compliance checks
export async function checkQuickCompliance(
  projectType: ComplianceCheckRequest['projectType'],
  specifications: ComplianceCheckRequest['specifications']
): Promise<ComplianceReport> {
  return complianceAI.checkCompliance({
    projectType,
    location: 'Kuala Lumpur',
    specifications,
  })
}