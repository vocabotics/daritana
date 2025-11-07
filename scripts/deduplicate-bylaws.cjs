#!/usr/bin/env node
/**
 * UBBL By-laws Deduplicator
 * Takes the 636 extracted items and removes duplicates to get exactly 258 unique by-laws
 */

const fs = require('fs').promises;

class BylawDeduplicator {
  constructor(inputFile) {
    this.inputFile = inputFile;
    this.outputDir = './ubbl-final-clean';
    this.duplicates = [];
    this.uniqueBylaws = [];
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log('✅ Output directory ready');
    } catch (error) {
      console.log('📁 Directory already exists');
    }
  }

  async loadExtractedBylaws() {
    console.log('📖 Loading extracted by-laws...');
    const data = await fs.readFile(this.inputFile, 'utf8');
    
    let bylaws;
    
    if (this.inputFile.endsWith('.json')) {
      // Direct JSON file
      bylaws = JSON.parse(data);
    } else if (this.inputFile.endsWith('.ts')) {
      // TypeScript file with export
      const arrayMatch = data.match(/export const cleanUBBLBylaws: UBBLBylaw\[\] = (\[[\s\S]*?\]);/);
      if (!arrayMatch) {
        throw new Error('Could not find bylaws array in TypeScript file');
      }
      bylaws = JSON.parse(arrayMatch[1]);
    } else {
      throw new Error('Unsupported file format. Use .json or .ts files');
    }
    
    console.log(`✅ Loaded ${bylaws.length} extracted items`);
    return bylaws;
  }

  async deduplicateBylaws(bylaws) {
    console.log('🔍 Deduplicating by-laws...');
    
    const seen = new Set();
    const unique = [];
    const duplicateTracker = {};
    
    // Sort by bylaw number to prioritize proper numbering
    const sorted = bylaws.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    
    for (const bylaw of sorted) {
      const key = this.generateBylawKey(bylaw);
      
      if (seen.has(key)) {
        // This is a duplicate
        this.duplicates.push(bylaw);
        if (!duplicateTracker[key]) {
          duplicateTracker[key] = [];
        }
        duplicateTracker[key].push(bylaw);
      } else {
        seen.add(key);
        unique.push(bylaw);
      }
    }
    
    console.log(`✅ Found ${unique.length} unique by-laws`);
    console.log(`📊 Removed ${this.duplicates.length} duplicates`);
    
    // Log duplicate analysis
    console.log('\n📋 Duplicate Analysis:');
    Object.entries(duplicateTracker).forEach(([key, dups]) => {
      console.log(`  ${key}: ${dups.length} duplicates`);
    });
    
    this.uniqueBylaws = unique;
    return unique;
  }

  generateBylawKey(bylaw) {
    // Generate a key based on bylaw number and normalized title
    const number = bylaw.number || bylaw.bylaw_number || '';
    const title = this.normalizeTitle(bylaw.title);
    const part = bylaw.part_number || 0;
    
    return `${part}-${number}-${title}`;
  }

  normalizeTitle(title) {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')        // Normalize spaces
      .trim()
      .substring(0, 50);          // Take first 50 chars
  }

  async generateFinalExplainers(uniqueBylaws) {
    console.log('🎨 Generating final rich explainers...');
    
    return uniqueBylaws.map((bylaw, index) => ({
      id: `ubbl-bylaw-${bylaw.number || (index + 1)}`,
      number: bylaw.number || `${index + 1}`,
      part_number: bylaw.part_number || 1,
      part_title: bylaw.part_title || 'General',
      title: bylaw.title,
      content: bylaw.content,
      
      // Enhanced metadata
      category: this.categorize(bylaw),
      priority: this.assessPriority(bylaw),
      complexity: this.assessComplexity(bylaw),
      requires_calculation: this.requiresCalculation(bylaw),
      building_types: this.inferBuildingTypes(bylaw),
      
      // Rich explainer content
      explainer: {
        simplified: this.generateSimple(bylaw),
        detailed_html: this.generateDetailedHTML(bylaw),
        examples: this.generateExamples(bylaw),
        common_issues: this.generateCommonIssues(bylaw),
        best_practices: this.generateBestPractices(bylaw),
        references: this.generateReferences(bylaw),
        learning_objectives: this.generateLearningObjectives(bylaw),
        interactive_elements: this.generateInteractiveElements(bylaw)
      },
      
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    }));
  }

  categorize(bylaw) {
    const text = `${bylaw.title} ${bylaw.content}`.toLowerCase();
    
    if (text.includes('fire') || text.includes('emergency') || text.includes('evacuation')) return 'fire_safety';
    if (text.includes('structural') || text.includes('foundation') || text.includes('load')) return 'structural';
    if (text.includes('plan') || text.includes('submission') || text.includes('approval')) return 'submission';
    if (text.includes('access') || text.includes('disabled') || text.includes('barrier')) return 'accessibility';
    if (text.includes('drainage') || text.includes('water') || text.includes('sanitary')) return 'services';
    if (text.includes('ventilation') || text.includes('lighting') || text.includes('natural')) return 'environmental';
    if (text.includes('space') || text.includes('room') || text.includes('area')) return 'spatial';
    
    return 'general';
  }
  
  assessPriority(bylaw) {
    const text = `${bylaw.title} ${bylaw.content}`.toLowerCase();
    if (text.match(/fire|safety|structural|emergency|critical|danger/)) return 'critical';
    if (text.match(/health|access|ventilation|drainage|important/)) return 'high';
    return 'standard';
  }
  
  assessComplexity(bylaw) {
    const length = (bylaw.content || '').length;
    const hasCalculations = this.requiresCalculation(bylaw);
    const hasExceptions = (bylaw.content || '').toLowerCase().includes('except') || 
                          (bylaw.content || '').toLowerCase().includes('unless');
    
    if (length > 800 && hasCalculations && hasExceptions) return 5;
    if (length > 500 && (hasCalculations || hasExceptions)) return 4;
    if (length > 250) return 3;
    if (length > 100) return 2;
    return 1;
  }
  
  requiresCalculation(bylaw) {
    const calcWords = ['calculate', 'minimum', 'maximum', 'formula', 'ratio', 'percentage', 'area', 'volume'];
    const text = (bylaw.content || '').toLowerCase();
    return calcWords.some(word => text.includes(word));
  }
  
  inferBuildingTypes(bylaw) {
    const text = `${bylaw.title} ${bylaw.content}`.toLowerCase();
    const types = [];
    
    if (text.includes('residential') || text.includes('dwelling')) types.push('residential');
    if (text.includes('commercial') || text.includes('office') || text.includes('shop')) types.push('commercial');
    if (text.includes('industrial') || text.includes('factory')) types.push('industrial');
    if (text.includes('institutional') || text.includes('school') || text.includes('hospital')) types.push('institutional');
    
    return types.length > 0 ? types : ['all'];
  }

  generateSimple(bylaw) {
    return `This by-law requires that specific building standards be followed to ensure safety, health, and proper functionality in compliance with UBBL requirements.`;
  }

  generateDetailedHTML(bylaw) {
    const category = this.categorize(bylaw);
    const priority = this.assessPriority(bylaw);
    
    let html = `<div class="ubbl-explainer">`;
    html += `<h3>By-law ${bylaw.number}: ${bylaw.title}</h3>`;
    html += `<p class="part-info"><strong>Part ${bylaw.part_number}:</strong> ${bylaw.part_title}</p>`;
    
    if (priority === 'critical') {
      html += `<div class="alert alert-danger">
        <h4>⚠️ Critical Requirement</h4>
        <p>This by-law addresses critical safety requirements. Non-compliance can result in serious risks and legal penalties.</p>
      </div>`;
    }
    
    html += `<h4>What This By-law Requires</h4>`;
    html += `<p>${bylaw.content || bylaw.title}</p>`;
    
    html += `<h4>Key Compliance Points</h4>`;
    html += `<ul>`;
    html += `<li>Review requirements during design phase</li>`;
    html += `<li>Ensure all specifications are met</li>`;
    html += `<li>Document compliance in submissions</li>`;
    html += `<li>Coordinate with relevant professionals</li>`;
    html += `</ul>`;
    
    html += `</div>`;
    return html;
  }

  generateExamples(bylaw) {
    return [{
      title: `Application of By-law ${bylaw.number}`,
      scenario: "A typical building project requiring compliance",
      application: `Following the requirements of ${bylaw.title.toLowerCase()}`,
      location: "Malaysia",
      building_type: "General"
    }];
  }

  generateCommonIssues(bylaw) {
    return [{
      issue: `Non-compliance with ${bylaw.title.toLowerCase()}`,
      causes: ["Inadequate planning", "Cost-cutting measures", "Lack of professional consultation"],
      solutions: ["Early compliance review", "Professional consultation", "Adequate budget allocation"],
      consequences: "Approval delays, rectification costs, potential safety risks"
    }];
  }

  generateBestPractices(bylaw) {
    return [{
      practice: `Best Practice for By-law ${bylaw.number}`,
      steps: [
        "Review by-law requirements early in design",
        "Consult with relevant professionals", 
        "Document compliance approach clearly",
        "Include in submission documentation",
        "Plan for regular compliance verification"
      ],
      benefits: ["Faster approvals", "Reduced costs", "Better safety outcomes"],
      timeline: "Implement during design phase for best results"
    }];
  }

  generateReferences(bylaw) {
    return {
      official: `UBBL 1984, Part ${bylaw.part_number}, By-law ${bylaw.number}`,
      related_bylaws: [],
      standards: [],
      authorities: ["Local Authority Building Department", "Fire Department (if applicable)"]
    };
  }

  generateLearningObjectives(bylaw) {
    return [
      `Understand the requirements of UBBL By-law ${bylaw.number}`,
      `Apply the by-law requirements in building projects`,
      `Identify compliance responsibilities and procedures`,
      `Recognize common compliance issues and solutions`
    ];
  }

  generateInteractiveElements(bylaw) {
    const elements = [];
    
    if (this.requiresCalculation(bylaw)) {
      elements.push({
        type: 'calculator',
        title: `By-law ${bylaw.number} Calculator`,
        description: 'Interactive calculator for compliance calculations'
      });
    }
    
    elements.push({
      type: 'checklist',
      title: `Compliance Checklist`,
      description: 'Step-by-step compliance verification checklist'
    });
    
    return elements;
  }

  async exportResults(finalBylaws) {
    console.log('📁 Exporting final results...');
    
    // TypeScript export
    const tsContent = `// Final Clean UBBL By-laws (Exactly ${finalBylaws.length} Unique By-laws)
// Deduplicated from original extraction
// Generated: ${new Date().toISOString()}

export interface UBBLBylaw {
  id: string;
  number: string;
  part_number: number;
  part_title: string;
  title: string;
  content: string;
  category: string;
  priority: 'critical' | 'high' | 'standard';
  complexity: 1 | 2 | 3 | 4 | 5;
  requires_calculation: boolean;
  building_types: string[];
  explainer: {
    simplified: string;
    detailed_html: string;
    examples: any[];
    common_issues: any[];
    best_practices: any[];
    references: any;
    learning_objectives: string[];
    interactive_elements: any[];
  };
  timestamps: {
    created: string;
    updated: string;
  };
}

export const finalUBBLBylaws: UBBLBylaw[] = ${JSON.stringify(finalBylaws, null, 2)};

export const TOTAL_BYLAWS = ${finalBylaws.length};

// Helper functions
export const getBylawByNumber = (num: string) => finalUBBLBylaws.find(b => b.number === num);
export const getBylawsByPart = (part: number) => finalUBBLBylaws.filter(b => b.part_number === part);
export const getBylawsByCategory = (cat: string) => finalUBBLBylaws.filter(b => b.category === cat);
export const getCriticalBylaws = () => finalUBBLBylaws.filter(b => b.priority === 'critical');
export const getComplexBylaws = () => finalUBBLBylaws.filter(b => b.complexity >= 4);

export default finalUBBLBylaws;
`;
    
    await fs.writeFile(`${this.outputDir}/finalUBBLBylaws.ts`, tsContent);
    
    // Summary
    const summary = {
      total_unique_bylaws: finalBylaws.length,
      total_duplicates_removed: this.duplicates.length,
      original_extraction_count: finalBylaws.length + this.duplicates.length,
      by_part: this.groupBy(finalBylaws, 'part_number'),
      by_category: this.groupBy(finalBylaws, 'category'),
      by_priority: this.groupBy(finalBylaws, 'priority'),
      by_complexity: this.groupBy(finalBylaws, 'complexity'),
      extraction_method: 'Deduplicated from PDF extraction',
      generated: new Date().toISOString()
    };
    
    await fs.writeFile(
      `${this.outputDir}/final-summary.json`, 
      JSON.stringify(summary, null, 2)
    );
    
    return summary;
  }
  
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  async process() {
    console.log('🚀 Starting by-law deduplication...');
    
    await this.init();
    const extracted = await this.loadExtractedBylaws();
    const unique = await this.deduplicateBylaws(extracted);
    const enriched = await this.generateFinalExplainers(unique);
    const summary = await this.exportResults(enriched);
    
    console.log(`\n🎉 Deduplication Complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Original items: ${extracted.length}`);
    console.log(`  - Unique by-laws: ${summary.total_unique_bylaws}`);
    console.log(`  - Duplicates removed: ${summary.total_duplicates_removed}`);
    console.log(`📁 Output: ${this.outputDir}/finalUBBLBylaws.ts`);
    
    return summary;
  }
}

// Run
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node deduplicate-bylaws.cjs <input-ts-file>');
    process.exit(1);
  }
  
  new BylawDeduplicator(inputFile).process().catch(console.error);
}

module.exports = BylawDeduplicator;