#!/usr/bin/env node
/**
 * True UBBL By-laws Extractor
 * Extracts ONLY the actual numbered by-laws (1-258), filtering out all other content
 */

const fs = require('fs').promises;

class TrueBylawExtractor {
  constructor(inputFile) {
    this.inputFile = inputFile;
    this.outputDir = './ubbl-true-bylaws';
    this.bylaws = [];
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log('✅ Output directory ready');
    } catch (error) {
      console.log('📁 Directory already exists');
    }
  }

  async loadRawData() {
    console.log('📖 Loading extracted data...');
    const data = await fs.readFile(this.inputFile, 'utf8');
    const items = JSON.parse(data);
    console.log(`✅ Loaded ${items.length} items`);
    return items;
  }

  async filterTrueBylaws(items) {
    console.log('🔍 Filtering for true by-laws (numbered 1-258)...');
    
    const trueBylaws = [];
    const seen = new Set();
    
    for (const item of items) {
      const number = this.extractBylawNumber(item);
      
      // Only accept items that have proper by-law numbers (1-258)
      if (number && this.isValidBylawNumber(number) && !seen.has(number)) {
        // Clean up the item
        const cleanBylaw = this.cleanBylawItem(item, number);
        if (cleanBylaw && this.hasSubstantialContent(cleanBylaw)) {
          trueBylaws.push(cleanBylaw);
          seen.add(number);
          console.log(`  ✅ By-law ${number}: ${cleanBylaw.title.substring(0, 60)}...`);
        }
      }
    }
    
    // Sort by number
    trueBylaws.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    console.log(`✅ Found ${trueBylaws.length} true by-laws`);
    return trueBylaws;
  }

  extractBylawNumber(item) {
    // Try different properties that might contain the number
    const candidates = [
      item.number,
      item.bylaw_number,
      item.id?.match(/(\d+)/)?.[1],
      item.title?.match(/^(\d+)[A-Z]?\./)?.[1]
    ].filter(Boolean);
    
    return candidates[0];
  }

  isValidBylawNumber(numStr) {
    const num = parseInt(numStr);
    return num >= 1 && num <= 258;
  }

  cleanBylawItem(item, number) {
    // Standardize the bylaw structure
    return {
      id: `ubbl-bylaw-${number}`,
      number: number,
      part_number: item.part_number || 1,
      part_title: item.part_title || item.part_title_en || 'General',
      title: this.cleanTitle(item.title || item.title_en || ''),
      content: this.cleanContent(item.content || item.content_en || ''),
      
      // Enhanced metadata
      category: this.categorize(item),
      priority: this.assessPriority(item),
      complexity: this.assessComplexity(item),
      requires_calculation: this.requiresCalculation(item),
      building_types: this.inferBuildingTypes(item),
      
      // Generate rich explainers
      explainer: {
        simplified: this.generateSimple(item),
        detailed_html: this.generateDetailedHTML(item, number),
        examples: this.generateExamples(item, number),
        common_issues: this.generateCommonIssues(item, number),
        best_practices: this.generateBestPractices(item, number),
        references: this.generateReferences(item, number),
        learning_objectives: this.generateLearningObjectives(item, number),
        interactive_elements: this.generateInteractiveElements(item)
      },
      
      timestamps: {
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    };
  }

  cleanTitle(title) {
    // Remove by-law number prefix if it exists
    return title.replace(/^\d+[A-Z]?\.\s*/, '').trim();
  }

  cleanContent(content) {
    // Basic content cleaning
    return content.trim();
  }

  hasSubstantialContent(bylaw) {
    // Must have either a meaningful title or content
    const titleLength = (bylaw.title || '').length;
    const contentLength = (bylaw.content || '').length;
    return titleLength > 5 || contentLength > 10;
  }

  categorize(item) {
    const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
    
    if (text.match(/fire|flame|smoke|emergency|evacuation/)) return 'fire_safety';
    if (text.match(/structural|foundation|load|beam|column/)) return 'structural';
    if (text.match(/plan|submission|approval|authority/)) return 'submission';
    if (text.match(/access|disabled|barrier|ramp/)) return 'accessibility';
    if (text.match(/ventilation|lighting|air|natural/)) return 'environmental';
    if (text.match(/space|room|area|dimension|height/)) return 'spatial';
    if (text.match(/drainage|water|plumbing|sanitary/)) return 'services';
    
    return 'general';
  }

  assessPriority(item) {
    const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
    if (text.match(/fire|safety|structural|emergency|critical/)) return 'critical';
    if (text.match(/health|access|ventilation|drainage/)) return 'high';
    return 'standard';
  }

  assessComplexity(item) {
    const contentLength = (item.content || '').length;
    const hasCalculations = this.requiresCalculation(item);
    const hasExceptions = (item.content || '').toLowerCase().includes('except');
    
    if (contentLength > 500 && hasCalculations && hasExceptions) return 5;
    if (contentLength > 300 && hasCalculations) return 4;
    if (contentLength > 200) return 3;
    if (contentLength > 100) return 2;
    return 1;
  }

  requiresCalculation(item) {
    const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
    const calcWords = ['calculate', 'minimum', 'maximum', 'formula', 'ratio', 'percentage'];
    return calcWords.some(word => text.includes(word));
  }

  inferBuildingTypes(item) {
    const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
    const types = [];
    
    if (text.includes('residential')) types.push('residential');
    if (text.includes('commercial')) types.push('commercial');
    if (text.includes('industrial')) types.push('industrial');
    if (text.includes('institutional')) types.push('institutional');
    
    return types.length > 0 ? types : ['all'];
  }

  generateSimple(item) {
    const category = this.categorize(item);
    
    const explanations = {
      fire_safety: 'requires proper fire safety measures for building occupant protection',
      structural: 'ensures building structure meets safety standards and load requirements',
      submission: 'requires proper submission of building plans to authorities for approval',
      accessibility: 'ensures building accessibility for all users including disabled persons',
      environmental: 'requires adequate ventilation and lighting for occupant health',
      spatial: 'specifies minimum space and dimension requirements for building areas',
      services: 'requires proper installation of building services and utilities',
      general: 'establishes specific building standards for safety and functionality'
    };
    
    return `This by-law ${explanations[category] || explanations.general}.`;
  }

  generateDetailedHTML(item, number) {
    const category = this.categorize(item);
    const priority = this.assessPriority(item);
    const title = this.cleanTitle(item.title || item.title_en || '');
    const content = item.content || item.content_en || '';
    
    let html = `<div class="ubbl-explainer">`;
    html += `<h3>UBBL By-law ${number}: ${title}</h3>`;
    html += `<p class="part-info"><strong>Part ${item.part_number || 1}:</strong> ${item.part_title || 'General'}</p>`;
    
    if (priority === 'critical') {
      html += `<div class="alert alert-danger">
        <h4>⚠️ Critical Safety Requirement</h4>
        <p>This by-law addresses critical safety requirements. Non-compliance may result in serious risks.</p>
      </div>`;
    }
    
    html += `<h4>What This By-law Requires</h4>`;
    html += `<p>${content || 'This by-law establishes specific requirements for building compliance.'}</p>`;
    
    html += `<h4>Key Compliance Points</h4>`;
    html += `<ul>`;
    html += `<li>Review requirements during design phase</li>`;
    html += `<li>Ensure all specifications are properly met</li>`;
    html += `<li>Document compliance in building submissions</li>`;
    html += `<li>Coordinate with qualified professionals</li>`;
    html += `</ul>`;
    
    if (category === 'fire_safety') {
      html += `<div class="category-info">
        <h4>🔥 Fire Safety Requirements</h4>
        <p>Special considerations for fire safety compliance may include fire department consultation and regular system testing.</p>
      </div>`;
    }
    
    html += `</div>`;
    return html;
  }

  generateExamples(item, number) {
    const category = this.categorize(item);
    const title = this.cleanTitle(item.title || '');
    
    return [{
      title: `By-law ${number} Application Example`,
      scenario: `Building project requiring compliance with ${title.toLowerCase()}`,
      application: `Implementation of By-law ${number} requirements in a typical Malaysian building project`,
      location: "Malaysia",
      building_type: this.inferBuildingTypes(item)[0] || 'General'
    }];
  }

  generateCommonIssues(item, number) {
    return [{
      issue: `Non-compliance with By-law ${number}`,
      causes: ["Inadequate design planning", "Cost reduction measures", "Lack of professional guidance"],
      solutions: ["Early compliance assessment", "Professional consultation", "Proper budget planning"],
      consequences: "Approval delays, additional costs, potential safety risks"
    }];
  }

  generateBestPractices(item, number) {
    return [{
      practice: `Best Practice for By-law ${number}`,
      steps: [
        "Identify by-law requirements early in design",
        "Consult qualified professionals",
        "Document compliance strategy clearly",
        "Include requirements in construction specifications",
        "Verify compliance before submission"
      ],
      benefits: ["Faster approval process", "Reduced project costs", "Better safety outcomes"],
      timeline: "Implement during early design phase"
    }];
  }

  generateReferences(item, number) {
    return {
      official: `UBBL 1984, By-law ${number}`,
      related_standards: ["Malaysian Standards (MS)", "Building Code Requirements"],
      authorities: ["Local Authority", "Building Department", "Fire Department"],
      documentation: ["Building plans", "Structural drawings", "Compliance certificates"]
    };
  }

  generateLearningObjectives(item, number) {
    return [
      `Understand UBBL By-law ${number} requirements`,
      `Apply by-law standards in building design`,
      `Identify compliance verification methods`,
      `Recognize common compliance issues and solutions`
    ];
  }

  generateInteractiveElements(item) {
    const elements = [];
    
    if (this.requiresCalculation(item)) {
      elements.push({
        type: 'calculator',
        title: 'Compliance Calculator',
        description: 'Interactive tool for requirement calculations'
      });
    }
    
    elements.push({
      type: 'checklist',
      title: 'Compliance Checklist',
      description: 'Step-by-step verification checklist'
    });
    
    return elements;
  }

  async exportResults(trueBylaws) {
    console.log('📁 Exporting true by-laws...');
    
    // TypeScript export
    const tsContent = `// True UBBL By-laws (Numbered 1-${trueBylaws.length})
// Extracted from UBBL-1984-2022.pdf with comprehensive filtering
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

export const trueBylaws: UBBLBylaw[] = ${JSON.stringify(trueBylaws, null, 2)};

export const TOTAL_BYLAWS = ${trueBylaws.length};

// Helper functions
export const getBylawByNumber = (num: string): UBBLBylaw | undefined => {
  return trueBylaws.find(b => b.number === num);
};

export const getBylawsByPart = (part: number): UBBLBylaw[] => {
  return trueBylaws.filter(b => b.part_number === part);
};

export const getBylawsByCategory = (cat: string): UBBLBylaw[] => {
  return trueBylaws.filter(b => b.category === cat);
};

export const getCriticalBylaws = (): UBBLBylaw[] => {
  return trueBylaws.filter(b => b.priority === 'critical');
};

export const getComplexBylaws = (): UBBLBylaw[] => {
  return trueBylaws.filter(b => b.complexity >= 4);
};

export default trueBylaws;
`;
    
    await fs.writeFile(`${this.outputDir}/trueBylaws.ts`, tsContent);
    
    // Summary
    const summary = {
      total_true_bylaws: trueBylaws.length,
      expected_bylaws: 258,
      coverage_percentage: ((trueBylaws.length / 258) * 100).toFixed(1),
      by_part: this.groupBy(trueBylaws, 'part_number'),
      by_category: this.groupBy(trueBylaws, 'category'),
      by_priority: this.groupBy(trueBylaws, 'priority'),
      by_complexity: this.groupBy(trueBylaws, 'complexity'),
      extraction_method: 'Filtered for true numbered by-laws only (1-258)',
      generated: new Date().toISOString()
    };
    
    await fs.writeFile(
      `${this.outputDir}/summary.json`, 
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
    console.log('🚀 Extracting TRUE UBBL by-laws (numbered 1-258)...');
    
    await this.init();
    const rawItems = await this.loadRawData();
    const trueBylaws = await this.filterTrueBylaws(rawItems);
    const summary = await this.exportResults(trueBylaws);
    
    console.log(`\n🎉 True By-laws Extraction Complete!`);
    console.log(`📊 Results:`);
    console.log(`  - True by-laws found: ${summary.total_true_bylaws}`);
    console.log(`  - Expected total: ${summary.expected_bylaws}`);
    console.log(`  - Coverage: ${summary.coverage_percentage}%`);
    console.log(`📁 Output: ${this.outputDir}/trueBylaws.ts`);
    
    if (summary.total_true_bylaws < 200) {
      console.log(`\n⚠️  Warning: Found fewer by-laws than expected.`);
      console.log(`   This might indicate the need for different extraction criteria.`);
    }
    
    return summary;
  }
}

// Run
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node extract-true-bylaws.cjs <input-json-file>');
    process.exit(1);
  }
  
  new TrueBylawExtractor(inputFile).process().catch(console.error);
}

module.exports = TrueBylawExtractor;