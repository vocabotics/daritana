#!/usr/bin/env node
/**
 * Simple UBBL By-law Extractor
 * Focused extraction of actual by-laws (should be around 258)
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

class SimpleBylawExtractor {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.outputDir = './ubbl-bylaws-clean';
    this.bylaws = [];
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log('✅ Ready');
    } catch (error) {
      console.log('✅ Ready');
    }
  }

  async extractText() {
    console.log('📖 Reading PDF...');
    const dataBuffer = await fs.readFile(this.pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async findBylaws(text) {
    console.log('🔍 Finding by-laws...');
    
    // Split into lines and clean
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const bylaws = [];
    let currentPart = null;
    let collectingContent = false;
    let currentBylaw = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip obvious noise
      if (this.isNoise(line)) continue;
      
      // Detect PART headers
      const partMatch = line.match(/^PART\s+([IVX]+)\s*[-–]?\s*(.*)$/i);
      if (partMatch) {
        currentPart = {
          number: this.romanToNumber(partMatch[1]),
          title: partMatch[2].trim() || lines[i + 1]?.trim() || 'Unknown'
        };
        console.log(`📖 ${partMatch[1]}: ${currentPart.title}`);
        continue;
      }
      
      // Detect by-law numbers (must be clear pattern)
      const bylawMatch = line.match(/^(\d+[A-Z]?)\.\s+(.+)$/);
      if (bylawMatch && currentPart && this.looksLikeBylaw(line)) {
        // Save previous
        if (currentBylaw) {
          bylaws.push(currentBylaw);
        }
        
        // Start new bylaw
        const num = bylawMatch[1];
        const title = bylawMatch[2].trim();
        
        currentBylaw = {
          id: `bylaw-${num}`,
          number: num,
          part_number: currentPart.number,
          part_title: currentPart.title,
          title: title,
          content: '',
          lines: []
        };
        
        console.log(`  📜 ${num}. ${title.substring(0, 50)}...`);
        collectingContent = true;
        continue;
      }
      
      // Collect content for current bylaw
      if (collectingContent && currentBylaw && line) {
        // Stop if we hit another bylaw or part
        if (line.match(/^\d+[A-Z]?\.\s+/) || line.match(/^PART\s+[IVX]+/i)) {
          i--; // Back up
          collectingContent = false;
          continue;
        }
        
        currentBylaw.content += line + ' ';
        currentBylaw.lines.push(line);
      }
    }
    
    // Add last bylaw
    if (currentBylaw) {
      bylaws.push(currentBylaw);
    }
    
    // Clean up
    bylaws.forEach(bylaw => {
      bylaw.content = bylaw.content.trim();
      // Remove title repetition from content
      if (bylaw.content.startsWith(bylaw.title)) {
        bylaw.content = bylaw.content.substring(bylaw.title.length).trim();
      }
    });
    
    console.log(`✅ Found ${bylaws.length} by-laws`);
    return bylaws;
  }
  
  isNoise(line) {
    const noisePatterns = [
      /^Page\s+\d+/i,
      /^\d+$/,
      /^UNIFORM BUILDING/i,
      /^UNDANG-UNDANG/i,
      /^Published/i,
      /^Copyright/i,
      /^ISBN/i,
      /^WJD/i,
      /^Table of Contents/i,
      /^Amendment/i,
      /^G\.N\./i
    ];
    
    return noisePatterns.some(p => p.test(line)) || 
           line.length < 5 || 
           /^[\d\s\.\-]+$/.test(line);
  }
  
  looksLikeBylaw(line) {
    // Must start with number + period + meaningful text
    if (!line.match(/^\d+[A-Z]?\.\s+\w/)) return false;
    
    // Must have substantial content
    const content = line.replace(/^\d+[A-Z]?\.\s*/, '');
    return content.length > 15 && content.match(/[a-zA-Z]/);
  }
  
  romanToNumber(roman) {
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    return roman.split('').reduce((total, char, i) => {
      const current = values[char];
      const next = values[roman[i + 1]];
      return current < next ? total - current : total + current;
    }, 0);
  }

  async generateRichExplainers(bylaws) {
    console.log('🎨 Generating rich explainers...');
    
    return bylaws.map(bylaw => ({
      ...bylaw,
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
        learning_objectives: this.generateLearningObjectives(bylaw)
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
    const length = bylaw.content.length;
    const hasCalculations = this.requiresCalculation(bylaw);
    const hasExceptions = bylaw.content.toLowerCase().includes('except') || bylaw.content.toLowerCase().includes('unless');
    
    if (length > 800 && hasCalculations && hasExceptions) return 5;
    if (length > 500 && (hasCalculations || hasExceptions)) return 4;
    if (length > 250) return 3;
    if (length > 100) return 2;
    return 1;
  }
  
  requiresCalculation(bylaw) {
    const calcWords = ['calculate', 'minimum', 'maximum', 'formula', 'ratio', 'percentage', 'area', 'volume'];
    const text = bylaw.content.toLowerCase();
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
    const category = this.categorize(bylaw);
    const base = "This by-law requires that ";
    
    switch (category) {
      case 'fire_safety':
        return base + "proper fire safety measures be implemented to protect building occupants and allow safe evacuation.";
      case 'structural':
        return base + "the building structure meets safety standards and can support all intended loads safely.";
      case 'submission':
        return base + "building plans and documents be properly submitted to authorities for approval before construction.";
      case 'accessibility':
        return base + "the building be accessible to all users, including persons with disabilities.";
      case 'services':
        return base + "building services like plumbing and drainage be properly designed and installed.";
      case 'environmental':
        return base + "adequate natural lighting and ventilation be provided for occupant health and comfort.";
      case 'spatial':
        return base + "building spaces meet minimum size and layout requirements for their intended use.";
      default:
        return base + "specific building standards be followed to ensure safety, health, and proper functionality.";
    }
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
    html += `<p>${bylaw.content}</p>`;
    
    html += `<h4>Key Compliance Points</h4>`;
    html += `<ul>`;
    html += `<li>Review requirements during design phase</li>`;
    html += `<li>Ensure all specifications are met</li>`;
    html += `<li>Document compliance in submissions</li>`;
    html += `<li>Coordinate with relevant professionals</li>`;
    html += `</ul>`;
    
    if (category === 'fire_safety') {
      html += `<div class="category-info fire-safety">
        <h4>🔥 Fire Safety Category</h4>
        <p>This by-law is part of fire safety requirements. Consider:</p>
        <ul>
          <li>Fire department consultation may be required</li>
          <li>Regular maintenance and testing of systems</li>
          <li>Staff training for emergency procedures</li>
        </ul>
      </div>`;
    }
    
    if (category === 'structural') {
      html += `<div class="category-info structural">
        <h4>🏗️ Structural Category</h4>
        <p>This by-law affects structural integrity. Consider:</p>
        <ul>
          <li>Professional engineer certification required</li>
          <li>Structural calculations must be submitted</li>
          <li>Material specifications must be followed</li>
        </ul>
      </div>`;
    }
    
    html += `</div>`;
    return html;
  }
  
  generateExamples(bylaw) {
    const category = this.categorize(bylaw);
    const examples = [];
    
    if (category === 'fire_safety') {
      examples.push({
        title: "Office Building Fire Safety",
        scenario: "A 15-story office building in KL requires fire safety compliance",
        application: `Implementation of ${bylaw.title.toLowerCase()} through proper fire safety systems`,
        location: "Kuala Lumpur",
        building_type: "Commercial Office"
      });
    } else if (category === 'structural') {
      examples.push({
        title: "Residential Development Structure",
        scenario: "A housing development in Johor needs structural compliance",
        application: `Ensuring ${bylaw.title.toLowerCase()} through proper structural design`,
        location: "Johor Bahru",
        building_type: "Residential"
      });
    } else {
      examples.push({
        title: `General Application of By-law ${bylaw.number}`,
        scenario: "A typical building project requiring compliance",
        application: `Following the requirements of ${bylaw.title.toLowerCase()}`,
        location: "Malaysia",
        building_type: "General"
      });
    }
    
    return examples;
  }
  
  generateCommonIssues(bylaw) {
    return [
      {
        issue: `Non-compliance with ${bylaw.title.toLowerCase()}`,
        causes: ["Inadequate planning", "Cost-cutting measures", "Lack of professional consultation"],
        solutions: ["Early compliance review", "Professional consultation", "Adequate budget allocation"],
        consequences: "Approval delays, rectification costs, potential safety risks"
      }
    ];
  }
  
  generateBestPractices(bylaw) {
    return [
      {
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
      }
    ];
  }
  
  generateReferences(bylaw) {
    return {
      official: `UBBL 1984, Part ${bylaw.part_number}, By-law ${bylaw.number}`,
      related_bylaws: [], // Would be populated with actual related by-laws
      standards: [], // Would be populated with related Malaysian Standards
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
  
  async exportResults(enrichedBylaws) {
    console.log('📁 Exporting results...');
    
    // JSON export
    await fs.writeFile(
      `${this.outputDir}/clean-ubbl-bylaws.json`,
      JSON.stringify(enrichedBylaws, null, 2)
    );
    
    // TypeScript export
    const tsContent = `// Clean UBBL By-laws with Rich Explainers
// Extracted ${enrichedBylaws.length} actual by-laws from UBBL-1984-2022.pdf
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
  };
  timestamps: {
    created: string;
    updated: string;
  };
}

export const cleanUBBLBylaws: UBBLBylaw[] = ${JSON.stringify(enrichedBylaws, null, 2)};

export const TOTAL_BYLAWS = ${enrichedBylaws.length};

// Helper functions
export const getBylawByNumber = (num: string) => cleanUBBLBylaws.find(b => b.number === num);
export const getBylawsByPart = (part: number) => cleanUBBLBylaws.filter(b => b.part_number === part);
export const getBylawsByCategory = (cat: string) => cleanUBBLBylaws.filter(b => b.category === cat);
export const getCriticalBylaws = () => cleanUBBLBylaws.filter(b => b.priority === 'critical');
export const getComplexBylaws = () => cleanUBBLBylaws.filter(b => b.complexity >= 4);

export default cleanUBBLBylaws;
`;
    
    await fs.writeFile(`${this.outputDir}/cleanUBBLBylaws.ts`, tsContent);
    
    // Summary
    const summary = {
      total: enrichedBylaws.length,
      by_part: this.groupBy(enrichedBylaws, 'part_number'),
      by_category: this.groupBy(enrichedBylaws, 'category'),
      by_priority: this.groupBy(enrichedBylaws, 'priority'),
      by_complexity: this.groupBy(enrichedBylaws, 'complexity'),
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
    console.log('🚀 Starting clean by-law extraction...');
    
    await this.init();
    const text = await this.extractText();
    const bylaws = await this.findBylaws(text);
    const enriched = await this.generateRichExplainers(bylaws);
    const summary = await this.exportResults(enriched);
    
    console.log(`\n🎉 Complete!`);
    console.log(`📊 Found ${summary.total} by-laws`);
    console.log(`📁 Output: ${this.outputDir}/cleanUBBLBylaws.ts`);
    
    return summary;
  }
}

// Run
if (require.main === module) {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: node simple-bylaw-extractor.cjs <pdf-path>');
    process.exit(1);
  }
  
  new SimpleBylawExtractor(pdfPath).process().catch(console.error);
}

module.exports = SimpleBylawExtractor;