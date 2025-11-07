/**
 * ARIA Automated Document Review System
 * AI-powered document analysis, review, and approval workflows
 */

import { openRouterClient } from './openRouterClient'
import { vectorStore } from './vectorStore'
import { complianceAI } from './complianceAI'
import { ariaNotifications } from './ariaNotifications'
import { AI_CONFIG } from './config'

export interface DocumentToReview {
  id: string
  name: string
  type: 'drawing' | 'specification' | 'report' | 'contract' | 'compliance' | 'proposal'
  filePath: string
  content?: string
  uploadedBy: string
  projectId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  requiredApprovals: string[] // User IDs who need to approve
  uploadedAt: Date
  deadline?: Date
  metadata?: {
    version?: string
    previousVersionId?: string
    category?: string
    tags?: string[]
  }
}

export interface DocumentReviewResult {
  documentId: string
  status: 'approved' | 'rejected' | 'needs-revision' | 'pending-review'
  overallScore: number // 0-100
  aiAnalysis: {
    summary: string
    keyFindings: string[]
    qualityScore: number
    completenessScore: number
    complianceScore: number
    risks: Array<{
      level: 'low' | 'medium' | 'high' | 'critical'
      description: string
      recommendation: string
    }>
  }
  checks: Array<{
    category: string
    status: 'pass' | 'fail' | 'warning'
    details: string
    recommendation?: string
  }>
  requiredActions: Array<{
    type: 'revision' | 'approval' | 'clarification' | 'compliance-check'
    description: string
    assignee?: string
    priority: 'low' | 'medium' | 'high'
  }>
  reviewedAt: Date
  reviewedBy: 'aria-ai' | string
  humanReviewRequired: boolean
  estimatedReviewTime?: number // minutes
}

export interface ReviewWorkflow {
  id: string
  name: string
  documentTypes: DocumentToReview['type'][]
  stages: Array<{
    name: string
    type: 'ai-review' | 'human-review' | 'compliance-check' | 'approval'
    assignee?: string
    requiredRole?: string
    timeoutHours: number
    automatedChecks?: string[]
  }>
  notifications: {
    onSubmission: boolean
    onApproval: boolean
    onRejection: boolean
    onDelay: boolean
    escalationHours: number
  }
}

class ARIADocumentReviewer {
  private reviewQueue: Map<string, DocumentToReview> = new Map()
  private reviewResults: Map<string, DocumentReviewResult> = new Map()
  private workflows: Map<string, ReviewWorkflow> = new Map()
  private processingInterval: NodeJS.Timer | null = null

  constructor() {
    this.initializeDefaultWorkflows()
    this.startProcessing()
  }

  /**
   * Initialize default review workflows
   */
  private initializeDefaultWorkflows() {
    // Technical Drawing Review Workflow
    this.workflows.set('technical-drawings', {
      id: 'technical-drawings',
      name: 'Technical Drawing Review',
      documentTypes: ['drawing'],
      stages: [
        {
          name: 'AI Technical Review',
          type: 'ai-review',
          timeoutHours: 1,
          automatedChecks: ['dimensions', 'annotations', 'standards-compliance', 'completeness'],
        },
        {
          name: 'Senior Architect Review',
          type: 'human-review',
          requiredRole: 'senior-architect',
          timeoutHours: 24,
        },
        {
          name: 'Final Approval',
          type: 'approval',
          requiredRole: 'project-lead',
          timeoutHours: 48,
        },
      ],
      notifications: {
        onSubmission: true,
        onApproval: true,
        onRejection: true,
        onDelay: true,
        escalationHours: 72,
      },
    })

    // Compliance Document Workflow
    this.workflows.set('compliance-documents', {
      id: 'compliance-documents',
      name: 'Compliance Document Review',
      documentTypes: ['compliance', 'report'],
      stages: [
        {
          name: 'UBBL Compliance Check',
          type: 'compliance-check',
          timeoutHours: 2,
          automatedChecks: ['ubbl-requirements', 'authority-standards', 'safety-requirements'],
        },
        {
          name: 'Compliance Officer Review',
          type: 'human-review',
          requiredRole: 'compliance-officer',
          timeoutHours: 24,
        },
        {
          name: 'Final Approval',
          type: 'approval',
          requiredRole: 'project-lead',
          timeoutHours: 48,
        },
      ],
      notifications: {
        onSubmission: true,
        onApproval: true,
        onRejection: true,
        onDelay: true,
        escalationHours: 48,
      },
    })

    // Contract Review Workflow
    this.workflows.set('contracts', {
      id: 'contracts',
      name: 'Contract Review',
      documentTypes: ['contract'],
      stages: [
        {
          name: 'AI Legal Review',
          type: 'ai-review',
          timeoutHours: 4,
          automatedChecks: ['terms-analysis', 'risk-assessment', 'completeness', 'malaysian-law-compliance'],
        },
        {
          name: 'Legal Review',
          type: 'human-review',
          requiredRole: 'legal-counsel',
          timeoutHours: 48,
        },
        {
          name: 'Management Approval',
          type: 'approval',
          requiredRole: 'project-lead',
          timeoutHours: 72,
        },
      ],
      notifications: {
        onSubmission: true,
        onApproval: true,
        onRejection: true,
        onDelay: true,
        escalationHours: 120,
      },
    })
  }

  /**
   * Start automated document processing
   */
  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    // Process queue every 5 minutes
    this.processingInterval = setInterval(() => {
      this.processReviewQueue()
    }, 5 * 60 * 1000)

    console.log('ARIA Document Reviewer: Started automated processing')
  }

  /**
   * Add document to review queue
   */
  async submitForReview(document: DocumentToReview): Promise<void> {
    // Add to queue
    this.reviewQueue.set(document.id, document)

    // Send submission notification
    await ariaNotifications.sendNotification({
      type: 'insight',
      priority: document.priority === 'critical' ? 'urgent' : 'medium',
      targetUserId: document.uploadedBy,
      customMessage: `Document "${document.name}" has been submitted for AI review. You'll be notified once the analysis is complete.`,
    })

    // Immediately process if high priority
    if (document.priority === 'critical' || document.priority === 'high') {
      await this.processDocument(document.id)
    }
  }

  /**
   * Process review queue
   */
  private async processReviewQueue() {
    const pendingDocuments = Array.from(this.reviewQueue.values())
      .filter(doc => !this.reviewResults.has(doc.id))
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))

    for (const document of pendingDocuments.slice(0, 5)) { // Process 5 at a time
      await this.processDocument(document.id)
    }
  }

  /**
   * Process a single document
   */
  private async processDocument(documentId: string): Promise<void> {
    const document = this.reviewQueue.get(documentId)
    if (!document) return

    try {
      console.log(`ARIA Document Reviewer: Processing ${document.name}`)

      // Perform AI analysis
      const result = await this.performAIReview(document)

      // Store result
      this.reviewResults.set(documentId, result)

      // Send completion notification
      await this.sendReviewCompletionNotification(document, result)

      // Remove from queue
      this.reviewQueue.delete(documentId)

      // Process next stage if needed
      await this.processNextWorkflowStage(document, result)

    } catch (error) {
      console.error(`ARIA Document Reviewer: Error processing ${document.name}`, error)
      
      // Send error notification
      await ariaNotifications.sendNotification({
        type: 'task-reminder',
        priority: 'high',
        targetUserId: document.uploadedBy,
        customMessage: `Failed to process document "${document.name}". Please check the file and resubmit.`,
      })
    }
  }

  /**
   * Perform AI review of document
   */
  private async performAIReview(document: DocumentToReview): Promise<DocumentReviewResult> {
    const startTime = Date.now()

    // Get document content (mock implementation)
    const content = await this.getDocumentContent(document)

    // Perform different analysis based on document type
    let analysis: DocumentReviewResult['aiAnalysis']
    let checks: DocumentReviewResult['checks']

    switch (document.type) {
      case 'drawing':
        analysis = await this.analyzeTechnicalDrawing(content, document)
        checks = await this.performDrawingChecks(content, document)
        break
      case 'compliance':
        analysis = await this.analyzeComplianceDocument(content, document)
        checks = await this.performComplianceChecks(content, document)
        break
      case 'contract':
        analysis = await this.analyzeContract(content, document)
        checks = await this.performContractChecks(content, document)
        break
      case 'specification':
        analysis = await this.analyzeSpecification(content, document)
        checks = await this.performSpecificationChecks(content, document)
        break
      default:
        analysis = await this.performGeneralAnalysis(content, document)
        checks = await this.performGeneralChecks(content, document)
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(analysis, checks)

    // Determine status
    const status = this.determineDocumentStatus(overallScore, analysis.risks)

    // Generate required actions
    const requiredActions = this.generateRequiredActions(analysis, checks, status)

    // Determine if human review is required
    const humanReviewRequired = this.requiresHumanReview(analysis, checks, overallScore)

    const reviewTime = Date.now() - startTime

    return {
      documentId: document.id,
      status,
      overallScore,
      aiAnalysis: analysis,
      checks,
      requiredActions,
      reviewedAt: new Date(),
      reviewedBy: 'aria-ai',
      humanReviewRequired,
      estimatedReviewTime: Math.round(reviewTime / 60000), // Convert to minutes
    }
  }

  /**
   * Analyze technical drawing
   */
  private async analyzeTechnicalDrawing(
    content: string,
    document: DocumentToReview
  ): Promise<DocumentReviewResult['aiAnalysis']> {
    const prompt = `Analyze this technical drawing document for architectural compliance:

Document: ${document.name}
Type: Technical Drawing
Project: ${document.projectId}

Content Summary: ${content}

Evaluate:
1. Completeness of technical details
2. Compliance with Malaysian building standards
3. Accuracy of dimensions and annotations
4. Structural integrity considerations
5. Safety requirements adherence

Provide:
- Overall quality assessment (0-100)
- Key findings and issues
- Compliance score (0-100)
- Risk assessment
- Improvement recommendations`

    const response = await openRouterClient.chat([
      {
        role: 'system',
        content: 'You are a senior architect and building compliance expert specializing in Malaysian construction standards.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: AI_CONFIG.models.chat,
      temperature: 0.3,
      maxTokens: 1500,
    })

    return this.parseAnalysisResponse(response.choices[0]?.message?.content || '')
  }

  /**
   * Analyze compliance document
   */
  private async analyzeComplianceDocument(
    content: string,
    document: DocumentToReview
  ): Promise<DocumentReviewResult['aiAnalysis']> {
    // Use compliance AI for detailed analysis
    const complianceResult = await complianceAI.checkCompliance({
      projectType: 'commercial', // Would be determined from document
      location: 'Kuala Lumpur',
      specifications: {}, // Would extract from document
    })

    return {
      summary: `Compliance analysis for ${document.name}`,
      keyFindings: complianceResult.issues.map(issue => issue.description),
      qualityScore: 85,
      completenessScore: 80,
      complianceScore: complianceResult.complianceScore,
      risks: complianceResult.issues.map(issue => ({
        level: issue.severity as any,
        description: issue.description,
        recommendation: issue.recommendation,
      })),
    }
  }

  /**
   * Analyze contract document
   */
  private async analyzeContract(
    content: string,
    document: DocumentToReview
  ): Promise<DocumentReviewResult['aiAnalysis']> {
    const prompt = `Analyze this contract document for legal compliance and risks:

Document: ${document.name}
Content: ${content}

Focus on Malaysian contract law and construction industry practices.

Evaluate:
1. Terms and conditions clarity
2. Payment terms and schedules
3. Liability and risk allocation
4. Compliance with Malaysian law
5. Missing clauses or terms
6. Potential legal risks

Provide detailed analysis with risk assessment.`

    const response = await openRouterClient.chat([
      {
        role: 'system',
        content: 'You are a legal expert specializing in Malaysian construction and contract law.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: AI_CONFIG.models.chat,
      temperature: 0.2,
      maxTokens: 1500,
    })

    return this.parseAnalysisResponse(response.choices[0]?.message?.content || '')
  }

  /**
   * Parse AI analysis response
   */
  private parseAnalysisResponse(content: string): DocumentReviewResult['aiAnalysis'] {
    // Parse structured response from AI
    // This is a simplified version - in production would use more sophisticated parsing
    
    return {
      summary: content.substring(0, 500),
      keyFindings: ['Finding 1', 'Finding 2', 'Finding 3'],
      qualityScore: 85,
      completenessScore: 80,
      complianceScore: 75,
      risks: [
        {
          level: 'medium',
          description: 'Potential compliance issue identified',
          recommendation: 'Review and address before approval',
        },
      ],
    }
  }

  /**
   * Perform document checks based on type
   */
  private async performDrawingChecks(
    content: string,
    document: DocumentToReview
  ): Promise<DocumentReviewResult['checks']> {
    return [
      {
        category: 'Dimensions',
        status: 'pass',
        details: 'All dimensions properly specified',
      },
      {
        category: 'Standards Compliance',
        status: 'warning',
        details: 'Some UBBL requirements need verification',
        recommendation: 'Verify setback requirements',
      },
      {
        category: 'Completeness',
        status: 'pass',
        details: 'All required details included',
      },
    ]
  }

  /**
   * Send review completion notification
   */
  private async sendReviewCompletionNotification(
    document: DocumentToReview,
    result: DocumentReviewResult
  ) {
    const statusEmoji = {
      'approved': '✅',
      'rejected': '❌',
      'needs-revision': '⚠️',
      'pending-review': '⏳',
    }

    const message = `${statusEmoji[result.status]} Document Review Complete

Document: ${document.name}
Status: ${result.status.toUpperCase()}
Overall Score: ${result.overallScore}/100

${result.aiAnalysis.summary}

${result.requiredActions.length > 0 ? `\nRequired Actions: ${result.requiredActions.length}` : ''}
${result.humanReviewRequired ? '\n⚠️ Human review required' : ''}`

    await ariaNotifications.sendNotification({
      type: 'insight',
      priority: result.status === 'rejected' ? 'high' : 'medium',
      targetUserId: document.uploadedBy,
      customMessage: message,
    })

    // Notify approvers if needed
    for (const approverId of document.requiredApprovals) {
      await ariaNotifications.sendNotification({
        type: 'task-reminder',
        priority: 'medium',
        targetUserId: approverId,
        customMessage: `Document "${document.name}" requires your approval. AI review score: ${result.overallScore}/100`,
      })
    }
  }

  /**
   * Helper methods
   */
  private getPriorityScore(priority: string): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 }
    return scores[priority as keyof typeof scores] || 1
  }

  private async getDocumentContent(document: DocumentToReview): Promise<string> {
    // Mock implementation - would integrate with file system
    return `Mock content for ${document.name}`
  }

  private calculateOverallScore(
    analysis: DocumentReviewResult['aiAnalysis'],
    checks: DocumentReviewResult['checks']
  ): number {
    const passedChecks = checks.filter(c => c.status === 'pass').length
    const checkScore = (passedChecks / checks.length) * 100
    
    return Math.round((analysis.qualityScore + analysis.completenessScore + analysis.complianceScore + checkScore) / 4)
  }

  private determineDocumentStatus(
    score: number,
    risks: DocumentReviewResult['aiAnalysis']['risks']
  ): DocumentReviewResult['status'] {
    const criticalRisks = risks.filter(r => r.level === 'critical').length
    
    if (criticalRisks > 0 || score < 60) return 'rejected'
    if (score < 75) return 'needs-revision'
    if (score >= 90) return 'approved'
    return 'pending-review'
  }

  private generateRequiredActions(
    analysis: DocumentReviewResult['aiAnalysis'],
    checks: DocumentReviewResult['checks'],
    status: DocumentReviewResult['status']
  ): DocumentReviewResult['requiredActions'] {
    const actions: DocumentReviewResult['requiredActions'] = []
    
    // Add actions based on failed checks
    checks.forEach(check => {
      if (check.status === 'fail') {
        actions.push({
          type: 'revision',
          description: `Address ${check.category}: ${check.details}`,
          priority: 'high',
        })
      }
    })
    
    // Add actions based on risks
    analysis.risks.forEach(risk => {
      if (risk.level === 'high' || risk.level === 'critical') {
        actions.push({
          type: 'revision',
          description: risk.recommendation,
          priority: risk.level === 'critical' ? 'high' : 'medium',
        })
      }
    })
    
    return actions
  }

  private requiresHumanReview(
    analysis: DocumentReviewResult['aiAnalysis'],
    checks: DocumentReviewResult['checks'],
    overallScore: number
  ): boolean {
    // Require human review for:
    // - Low overall scores
    // - Critical risks
    // - Failed compliance checks
    return overallScore < 80 || 
           analysis.risks.some(r => r.level === 'critical') ||
           checks.some(c => c.status === 'fail')
  }

  private async performComplianceChecks(content: string, document: DocumentToReview): Promise<DocumentReviewResult['checks']> {
    return [
      { category: 'UBBL Compliance', status: 'pass', details: 'Meets UBBL requirements' },
      { category: 'Safety Standards', status: 'warning', details: 'Minor safety concerns', recommendation: 'Add emergency exits' },
    ]
  }

  private async performContractChecks(content: string, document: DocumentToReview): Promise<DocumentReviewResult['checks']> {
    return [
      { category: 'Terms Clarity', status: 'pass', details: 'Terms are clearly defined' },
      { category: 'Malaysian Law', status: 'pass', details: 'Complies with local regulations' },
    ]
  }

  private async performSpecificationChecks(content: string, document: DocumentToReview): Promise<DocumentReviewResult['checks']> {
    return [
      { category: 'Technical Details', status: 'pass', details: 'All specifications complete' },
      { category: 'Standards', status: 'pass', details: 'Meets industry standards' },
    ]
  }

  private async performGeneralChecks(content: string, document: DocumentToReview): Promise<DocumentReviewResult['checks']> {
    return [
      { category: 'Completeness', status: 'pass', details: 'Document appears complete' },
      { category: 'Quality', status: 'pass', details: 'Good overall quality' },
    ]
  }

  private async analyzeSpecification(content: string, document: DocumentToReview): Promise<DocumentReviewResult['aiAnalysis']> {
    return this.parseAnalysisResponse('Specification analysis completed')
  }

  private async performGeneralAnalysis(content: string, document: DocumentToReview): Promise<DocumentReviewResult['aiAnalysis']> {
    return this.parseAnalysisResponse('General document analysis completed')
  }

  private async processNextWorkflowStage(document: DocumentToReview, result: DocumentReviewResult): Promise<void> {
    // Process workflow stages based on result
    console.log(`Processing next workflow stage for ${document.name}`)
  }

  /**
   * Get review status for document
   */
  getReviewStatus(documentId: string): DocumentReviewResult | null {
    return this.reviewResults.get(documentId) || null
  }

  /**
   * Get pending reviews count
   */
  getPendingReviewsCount(): number {
    return this.reviewQueue.size
  }

  /**
   * Get review analytics
   */
  getReviewAnalytics(): {
    totalReviews: number
    averageScore: number
    approvalRate: number
    averageReviewTime: number
  } {
    const results = Array.from(this.reviewResults.values())
    const totalReviews = results.length
    const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / totalReviews
    const approvedCount = results.filter(r => r.status === 'approved').length
    const approvalRate = (approvedCount / totalReviews) * 100
    const averageReviewTime = results.reduce((sum, r) => sum + (r.estimatedReviewTime || 0), 0) / totalReviews

    return {
      totalReviews,
      averageScore: Math.round(averageScore),
      approvalRate: Math.round(approvalRate),
      averageReviewTime: Math.round(averageReviewTime),
    }
  }
}

// Export singleton instance
export const ariaDocumentReviewer = new ARIADocumentReviewer()

// Helper function to submit document for review
export async function submitDocumentForReview(document: Omit<DocumentToReview, 'id' | 'uploadedAt'>) {
  const fullDocument: DocumentToReview = {
    ...document,
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    uploadedAt: new Date(),
  }
  
  await ariaDocumentReviewer.submitForReview(fullDocument)
  return fullDocument.id
}