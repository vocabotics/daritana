// AI-Powered UBBL Compliance Service
// World-class compliance checking with LLM integration

import OpenAI from 'openai';
import { 
  UBBLClause, 
  AIComplianceCheck, 
  AIViolation, 
  AIRecommendation,
  BuildingType,
  UBBLComplianceReport 
} from '@/types/ubbl';

interface ComplianceCheckRequest {
  project_id: string;
  building_type: BuildingType;
  building_details: {
    height: number;
    floor_area: number;
    occupancy: number;
    floors: number;
    location: string; // Malaysian state
    special_features?: string[];
    existing_building?: boolean;
    renovation_type?: string;
  };
  documents?: {
    plans: File[];
    calculations: File[];
    specifications: File[];
  };
  language: 'en' | 'ms' | 'both';
}

class AIComplianceService {
  private openai: OpenAI;
  private vectorStore: any; // Pinecone or similar
  private ubblClauses: Map<string, UBBLClause> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.initializeVectorStore();
    this.loadUBBLClauses();
  }

  async initializeVectorStore() {
    // Initialize vector database connection
    // This would connect to Pinecone, Chroma, or similar
    console.log('🔌 Initializing vector store...');
  }

  async loadUBBLClauses() {
    // Load UBBL clauses from database
    console.log('📚 Loading UBBL clauses...');
    // This would fetch from the database and populate the map
  }

  /**
   * Main compliance checking function
   * Uses AI to analyze building details against UBBL requirements
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<AIComplianceCheck> {
    console.log(`🤖 Starting AI compliance check for project ${request.project_id}`);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Identify applicable clauses using vector similarity
      const applicableClauses = await this.identifyApplicableClauses(request);
      
      // Step 2: Analyze compliance using GPT-4
      const complianceAnalysis = await this.analyzeCompliance(request, applicableClauses);
      
      // Step 3: Generate violations and recommendations
      const violations = await this.identifyViolations(request, applicableClauses);
      const recommendations = await this.generateRecommendations(request, violations);
      
      // Step 4: Calculate overall compliance score
      const complianceScore = this.calculateComplianceScore(applicableClauses, violations);
      
      const result: AIComplianceCheck = {
        id: `ai-check-${Date.now()}`,
        project_id: request.project_id,
        building_type: request.building_type,
        building_details: request.building_details,
        applicable_clauses: applicableClauses.map(c => c.id),
        compliance_score: complianceScore,
        violations,
        recommendations,
        confidence_level: this.calculateConfidenceLevel(complianceAnalysis),
        ai_model_used: 'gpt-4-1106-preview',
        processing_time: Date.now() - startTime,
        tokens_used: 0, // Track actual usage
        created_at: new Date()
      };

      console.log(`✅ Compliance check completed in ${result.processing_time}ms`);
      return result;

    } catch (error) {
      console.error('❌ AI compliance check failed:', error);
      throw error;
    }
  }

  /**
   * Identify applicable UBBL clauses using vector similarity search
   */
  async identifyApplicableClauses(request: ComplianceCheckRequest): Promise<UBBLClause[]> {
    // Create search query from building details
    const searchQuery = this.createSearchQuery(request);
    
    // Generate embedding for the search query
    const queryEmbedding = await this.generateEmbedding(searchQuery);
    
    // Perform vector similarity search
    const similarClauses = await this.vectorSearch(queryEmbedding, {
      building_type: request.building_type,
      top_k: 100
    });
    
    // Filter by exact applicability rules
    const applicableClauses = similarClauses.filter(clause => 
      this.isClauseApplicable(clause, request)
    );
    
    console.log(`📋 Identified ${applicableClauses.length} applicable clauses`);
    return applicableClauses;
  }

  /**
   * Use GPT-4 to analyze compliance in detail
   */
  async analyzeCompliance(
    request: ComplianceCheckRequest, 
    clauses: UBBLClause[]
  ): Promise<any> {
    const prompt = this.buildCompliancePrompt(request, clauses);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: `You are a world-class Malaysian building compliance expert and UBBL specialist. 
          Analyze the building details against UBBL requirements with extreme precision.
          Consider Malaysian climate, cultural practices, and local building standards.
          Provide detailed, actionable compliance analysis.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Identify specific violations using AI analysis
   */
  async identifyViolations(
    request: ComplianceCheckRequest,
    clauses: UBBLClause[]
  ): Promise<AIViolation[]> {
    const violations: AIViolation[] = [];
    
    // Batch process clauses for efficiency
    const batchSize = 10;
    for (let i = 0; i < clauses.length; i += batchSize) {
      const clauseBatch = clauses.slice(i, i + batchSize);
      const batchViolations = await this.processBatchViolations(request, clauseBatch);
      violations.push(...batchViolations);
    }
    
    // Sort by severity
    violations.sort((a, b) => {
      const severityOrder = { critical: 3, major: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    console.log(`⚠️ Identified ${violations.length} violations`);
    return violations;
  }

  async processBatchViolations(
    request: ComplianceCheckRequest,
    clauses: UBBLClause[]
  ): Promise<AIViolation[]> {
    const prompt = `
Analyze the following building against these UBBL clauses and identify specific violations:

Building Details:
${JSON.stringify(request.building_details, null, 2)}
Building Type: ${request.building_type}

UBBL Clauses to Check:
${clauses.map(c => `
Clause ${c.clause_number}: ${c.title_en}
Content: ${c.content_en}
Applicable Building Types: ${c.applicable_building_types.join(', ')}
`).join('\n')}

For each violation found, provide:
1. clause_id
2. severity (critical/major/minor)
3. description (what is violated)
4. explanation (why it's a violation)
5. suggested_fix (how to fix it)
6. confidence (0.0-1.0)
7. references (related clauses or sections)

Return as JSON array. If no violations, return empty array.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a UBBL compliance auditor. Be precise and thorough in identifying violations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error processing batch violations:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(
    request: ComplianceCheckRequest,
    violations: AIViolation[]
  ): Promise<AIRecommendation[]> {
    if (violations.length === 0) {
      return this.generateOptimizationRecommendations(request);
    }

    const prompt = `
Based on these UBBL violations, generate comprehensive recommendations:

Building: ${request.building_type}
Details: ${JSON.stringify(request.building_details, null, 2)}

Violations:
${violations.map(v => `
- ${v.description} (${v.severity})
  Fix: ${v.suggested_fix}
  Clause: ${v.clause_id}
`).join('\n')}

Generate recommendations for:
1. Immediate compliance fixes (high priority)
2. Design optimizations (medium priority) 
3. Best practices (low priority)

For each recommendation include:
- type: 'compliance', 'optimization', or 'best_practice'
- title
- description
- implementation_steps (array)
- estimated_cost (rough estimate)
- estimated_time (implementation time)
- priority: 'high', 'medium', 'low'
- related_clauses (array of clause IDs)

Return as JSON array with Malaysian context and practical implementation.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a Malaysian building consultant providing practical, cost-effective compliance solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    checkResult: AIComplianceCheck,
    format: 'pdf' | 'html' | 'json' = 'html',
    language: 'en' | 'ms' | 'both' = 'en'
  ): Promise<UBBLComplianceReport> {
    const applicableClauses = await this.getClausesByIds(checkResult.applicable_clauses);
    
    const report: UBBLComplianceReport = {
      id: `report-${Date.now()}`,
      project_id: checkResult.project_id,
      building_details: checkResult.building_details,
      overall_score: checkResult.compliance_score,
      applicable_clauses: applicableClauses,
      compliance_status: this.determineComplianceStatus(checkResult.compliance_score, checkResult.violations),
      violations: checkResult.violations.map(v => ({
        description: v.description,
        severity: v.severity,
        common_causes: [v.explanation],
        how_to_avoid: [v.suggested_fix],
        examples: []
      })),
      recommendations: checkResult.recommendations,
      generated_by: 'ai',
      generated_at: new Date(),
      language,
      format,
      submission_ready: this.isSubmissionReady(checkResult),
      estimated_approval_time: this.estimateApprovalTime(checkResult)
    };

    // Add educational notes for academic users
    if (this.isAcademicContext()) {
      report.educational_notes = await this.generateEducationalNotes(applicableClauses);
      report.related_learning_modules = await this.findRelatedLearningModules(applicableClauses);
    }

    return report;
  }

  // Helper Methods

  private createSearchQuery(request: ComplianceCheckRequest): string {
    const { building_details, building_type } = request;
    
    return `
    Building type: ${building_type}
    Height: ${building_details.height}m
    Floor area: ${building_details.floor_area} sqm
    Occupancy: ${building_details.occupancy} persons
    Floors: ${building_details.floors}
    Location: ${building_details.location}
    Special features: ${building_details.special_features?.join(', ') || 'none'}
    `.trim();
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    
    return response.data[0].embedding;
  }

  private async vectorSearch(embedding: number[], filters: any): Promise<UBBLClause[]> {
    // Implementation would use actual vector database
    // For now, return mock results
    return Array.from(this.ubblClauses.values()).slice(0, filters.top_k || 50);
  }

  private isClauseApplicable(clause: UBBLClause, request: ComplianceCheckRequest): boolean {
    // Check if clause applies to this building type
    if (!clause.applicable_building_types.includes(request.building_type)) {
      return false;
    }

    // Check height restrictions
    if (clause.applicable_building_heights) {
      const { min, max } = clause.applicable_building_heights;
      if (min && request.building_details.height < min) return false;
      if (max && request.building_details.height > max) return false;
    }

    return true;
  }

  private buildCompliancePrompt(request: ComplianceCheckRequest, clauses: UBBLClause[]): string {
    return `
Perform a comprehensive UBBL compliance analysis for this Malaysian building project:

PROJECT DETAILS:
- Building Type: ${request.building_type}
- Height: ${request.building_details.height}m
- Floor Area: ${request.building_details.floor_area} sqm  
- Occupancy: ${request.building_details.occupancy} persons
- Number of Floors: ${request.building_details.floors}
- Location: ${request.building_details.location}
- Special Features: ${request.building_details.special_features?.join(', ') || 'None'}

APPLICABLE UBBL CLAUSES:
${clauses.slice(0, 20).map(c => `
Clause ${c.clause_number}: ${c.title_en}
Requirements: ${c.content_en.substring(0, 300)}...
Critical: ${c.priority_level === 'critical' ? 'YES' : 'NO'}
`).join('\n')}

Analyze compliance and return detailed JSON with:
1. overall_compliance_percentage (0-100)
2. critical_issues (array of issues that must be fixed)
3. major_concerns (array of important but not critical issues)
4. minor_recommendations (array of optimization suggestions)
5. approval_likelihood ('high', 'medium', 'low')
6. estimated_review_time (days)
7. key_requirements_summary (top 10 most important requirements)

Focus on practical, actionable insights for Malaysian building practice.
`;
  }

  private calculateComplianceScore(clauses: UBBLClause[], violations: AIViolation[]): number {
    if (clauses.length === 0) return 100;

    let totalWeight = clauses.length;
    let penaltyPoints = 0;

    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          penaltyPoints += 20;
          break;
        case 'major':
          penaltyPoints += 10;
          break;
        case 'minor':
          penaltyPoints += 3;
          break;
      }
    });

    const score = Math.max(0, 100 - (penaltyPoints / totalWeight) * 100);
    return Math.round(score * 100) / 100;
  }

  private calculateConfidenceLevel(analysis: any): number {
    // Calculate based on analysis completeness and data quality
    return 0.85; // Mock value
  }

  private async getClausesByIds(clauseIds: string[]): Promise<UBBLClause[]> {
    return clauseIds
      .map(id => this.ubblClauses.get(id))
      .filter(clause => clause !== undefined) as UBBLClause[];
  }

  private determineComplianceStatus(score: number, violations: AIViolation[]): 'compliant' | 'partial' | 'non_compliant' {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    
    if (criticalViolations > 0) return 'non_compliant';
    if (score >= 90) return 'compliant';
    return 'partial';
  }

  private isSubmissionReady(checkResult: AIComplianceCheck): boolean {
    const criticalViolations = checkResult.violations.filter(v => v.severity === 'critical').length;
    return criticalViolations === 0 && checkResult.compliance_score >= 85;
  }

  private estimateApprovalTime(checkResult: AIComplianceCheck): number {
    const baseTime = 30; // 30 days base
    const violationPenalty = checkResult.violations.length * 2;
    const complexityPenalty = checkResult.building_details.height > 30 ? 15 : 0;
    
    return baseTime + violationPenalty + complexityPenalty;
  }

  private isAcademicContext(): boolean {
    // Determine if this is being used in an academic context
    return false; // Mock implementation
  }

  private async generateEducationalNotes(clauses: UBBLClause[]): Promise<string[]> {
    // Generate educational content for students
    return [
      'This analysis demonstrates the application of UBBL Part V structural requirements.',
      'Pay attention to the relationship between building height and fire safety requirements.',
      'Notice how occupancy calculations affect exit width requirements.'
    ];
  }

  private async findRelatedLearningModules(clauses: UBBLClause[]): Promise<string[]> {
    // Find related learning modules for academic integration
    return ['module-structural-basics', 'module-fire-safety', 'module-accessibility'];
  }

  private async generateOptimizationRecommendations(request: ComplianceCheckRequest): Promise<AIRecommendation[]> {
    // Generate recommendations even when no violations exist
    return [
      {
        type: 'optimization',
        title: 'Energy Efficiency Enhancement',
        description: 'Consider implementing additional energy-saving measures',
        implementation_steps: ['Install LED lighting', 'Upgrade insulation', 'Add solar panels'],
        estimated_cost: 'RM 50,000 - RM 100,000',
        estimated_time: '2-3 months',
        priority: 'medium',
        related_clauses: []
      }
    ];
  }
}

export default AIComplianceService;