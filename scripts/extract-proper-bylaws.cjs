#!/usr/bin/env node
/**
 * Proper UBBL By-Laws Extractor
 * Extracts only the actual 258 by-laws, not miscellaneous content
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

class ProperUBBLExtractor {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.outputDir = './ubbl-clean-processed';
    this.bylaws = [];
    this.currentPart = null;
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(`${this.outputDir}/data`, { recursive: true });
      console.log('✅ Output directory ready');
    } catch (error) {
      console.log('📁 Directory already exists');
    }
  }

  async extractText() {
    console.log('📖 Extracting text from PDF...');
    const dataBuffer = await fs.readFile(this.pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Save raw text for debugging
    await fs.writeFile(`${this.outputDir}/raw-text-debug.txt`, data.text);
    console.log(`✅ Extracted ${data.text.length} characters of text`);
    
    return data;
  }

  async parseProperBylaws(pdfData) {
    console.log('🏗️ Parsing actual UBBL by-laws...');
    
    const lines = pdfData.text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let inBylawsSection = false;
    let currentBylaw = null;
    let bylawNumber = 0;
    
    console.log(`Processing ${lines.length} lines to find by-laws...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      const prevLine = i > 0 ? lines[i - 1] : '';
      
      // Skip headers, footers, page numbers, table of contents
      if (this.isSkippableLine(line)) {
        continue;
      }

      // Detect start of actual by-laws section
      if (line.match(/^UNIFORM\s+BUILDING\s+BY-LAWS\s+1984/i) || 
          line.match(/^PART\s+I\s*[-–]?\s*PRELIMINARY/i)) {
        inBylawsSection = true;
        console.log('📍 Found start of by-laws section');
        continue;
      }

      if (!inBylawsSection) continue;

      // Detect parts (PART I, PART II, etc.)
      const partMatch = line.match(/^PART\s+([IVX]+)\s*[-–]?\s*(.*)$/i);
      if (partMatch) {
        this.currentPart = {
          number: this.romanToNumber(partMatch[1]),
          roman: partMatch[1],
          title: partMatch[2].trim() || nextLine.trim()
        };
        console.log(`📖 Part ${this.currentPart.roman}: ${this.currentPart.title}`);
        continue;
      }

      // Detect actual by-law numbers (1., 2., 3., etc. or 123A., 45B., etc.)
      const bylawMatch = line.match(/^(\d+[A-Z]?)\.?\s+(.*)$/);
      
      if (bylawMatch && this.currentPart && this.isActualBylaw(line, nextLine, prevLine)) {
        // Save previous by-law
        if (currentBylaw && currentBylaw.content_en && currentBylaw.content_en.trim()) {
          this.bylaws.push(currentBylaw);
        }

        bylawNumber++;
        const number = bylawMatch[1];
        let title = bylawMatch[2].trim();
        
        // If title is very short, check next line
        if (title.length < 10 && nextLine && nextLine.length > 10 && !nextLine.match(/^\d+[A-Z]?\./)) {
          title = nextLine.trim();
        }

        currentBylaw = {
          id: `ubbl-bylaw-${number}`,
          bylaw_number: number,
          sequence: bylawNumber,
          part_number: this.currentPart.number,
          part_roman: this.currentPart.roman,
          part_title_en: this.currentPart.title,
          title_en: title,
          content_en: '',
          content_lines: [],
          page_reference: this.estimatePageNumber(i, lines.length)
        };

        console.log(`  📜 By-law ${number}: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
        continue;
      }

      // Add content to current by-law
      if (currentBylaw && line && !this.isNewBylawStart(line)) {
        // Stop if we hit another by-law or part
        if (line.match(/^(\d+[A-Z]?)\./) || line.match(/^PART\s+[IVX]+/i)) {
          i--; // Go back to process this line
          continue;
        }

        currentBylaw.content_en += line + ' ';
        currentBylaw.content_lines.push(line);
      }
    }

    // Add the last by-law
    if (currentBylaw && currentBylaw.content_en && currentBylaw.content_en.trim()) {
      this.bylaws.push(currentBylaw);
    }

    // Clean up content
    this.bylaws.forEach(bylaw => {
      bylaw.content_en = bylaw.content_en.trim();
      
      // Remove duplicate title from content
      if (bylaw.content_en.startsWith(bylaw.title_en)) {
        bylaw.content_en = bylaw.content_en.substring(bylaw.title_en.length).trim();
      }
      
      // Set Bahasa placeholders
      bylaw.title_ms = bylaw.title_en; // Will be properly translated later
      bylaw.content_ms = bylaw.content_en; // Will be properly translated later
      
      // Add metadata
      bylaw.keywords = this.extractKeywords(bylaw);
      bylaw.category = this.categorizeBylaw(bylaw);
      bylaw.complexity_level = this.assessComplexity(bylaw);
      bylaw.requires_calculation = this.requiresCalculation(bylaw);
      bylaw.has_exceptions = this.hasExceptions(bylaw);
      bylaw.applicable_building_types = this.inferBuildingTypes(bylaw);
      bylaw.priority_level = this.assessPriority(bylaw);
      bylaw.created_at = new Date().toISOString();
      bylaw.updated_at = new Date().toISOString();
    });

    console.log(`✅ Extracted ${this.bylaws.length} actual by-laws`);
    
    // Validate we have reasonable number (should be around 258)
    if (this.bylaws.length < 200 || this.bylaws.length > 300) {
      console.warn(`⚠️ Warning: Found ${this.bylaws.length} by-laws, expected around 258`);
    }

    return this.bylaws;
  }

  isSkippableLine(line) {
    // Skip common noise
    const skipPatterns = [
      /^Page\s+\d+/i,
      /^\d+$/,
      /^UNIFORM BUILDING BY-LAWS/i,
      /^UNDANG-UNDANG KECIL/i,
      /^Published by/i,
      /^Copyright/i,
      /^All rights reserved/i,
      /^ISBN/i,
      /^First Edition/i,
      /^No\./i,
      /^Aras/i,
      /^Kementerian/i,
      /^JABATAN/i,
      /^WJD\d+/,
      /^\s*$/,
      /^[\d\s\.]+$/,
      /^Table of Contents/i,
      /^Contents/i,
      /^Index/i,
      /^Appendix/i,
      /^Schedule/i,
      /^Form/i,
      /^Amendment/i,
      /^G\.N\./i
    ];
    
    return skipPatterns.some(pattern => pattern.test(line)) || 
           line.length < 3 ||
           line.match(/^[^\w]*$/); // Only punctuation/symbols
  }

  isActualBylaw(line, nextLine, prevLine) {
    // Must start with number + period + meaningful content
    if (!line.match(/^\d+[A-Z]?\.?\s+\w/)) return false;
    
    // Reject if it looks like a page number or index
    if (line.match(/^\d+\s*$/)) return false;
    
    // Reject if it's part of a list/table
    if (prevLine && prevLine.match(/^\d+[A-Z]?\.?\s/) && line.length < 30) return false;
    
    // Must have some meaningful content after the number
    const content = line.replace(/^\d+[A-Z]?\.?\s*/, '').trim();
    if (content.length < 5) return false;
    
    // Check if it looks like a proper by-law title
    const hasProperContent = content.match(/[A-Za-z]/) && 
                            !content.match(/^[\d\s\.\-]+$/) &&
                            content.length > 10;
    
    return hasProperContent;
  }

  isNewBylawStart(line) {
    return line.match(/^\d+[A-Z]?\.?\s+/) && this.isActualBylaw(line, '', '');
  }

  romanToNumber(roman) {
    const romanNumerals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    return roman.split('').reduce((acc, num, i) => {
      if (romanNumerals[num] < romanNumerals[roman[i + 1]]) {
        return acc - romanNumerals[num];
      } else {
        return acc + romanNumerals[num];
      }
    }, 0);
  }

  estimatePageNumber(lineIndex, totalLines) {
    // Rough estimation based on position in document
    return Math.floor((lineIndex / totalLines) * 500) + 1;
  }

  extractKeywords(bylaw) {
    const text = `${bylaw.title_en} ${bylaw.content_en}`.toLowerCase();
    const commonWords = ['the', 'and', 'or', 'of', 'in', 'to', 'for', 'shall', 'be', 'a', 'an', 'is', 'by', 'with', 'as', 'at', 'on', 'may', 'any', 'all', 'such', 'where', 'building', 'authority', 'person'];
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word) && /^[a-z]+$/.test(word))
      .slice(0, 8);
  }

  categorizeBylaw(bylaw) {
    const text = `${bylaw.title_en} ${bylaw.content_en}`.toLowerCase();
    
    if (text.match(/fire|flame|smoke|emergency|evacuation|sprinkler|alarm|extinguish/)) return 'fire_safety';
    if (text.match(/structural|load|foundation|beam|column|concrete|steel|strength/)) return 'structural';
    if (text.match(/plan|submission|approval|authority|application|permit/)) return 'plan_submission';
    if (text.match(/access|disabled|wheelchair|ramp|lift|stair|barrier/)) return 'accessibility';
    if (text.match(/ventilation|air|lighting|natural|artificial/)) return 'environmental';
    if (text.match(/space|room|area|dimension|height|width/)) return 'spatial_requirements';
    if (text.match(/drainage|water|plumbing|sanitary|sewage/)) return 'services';
    if (text.match(/temporary|demolition|construction|site/)) return 'construction_process';
    
    return 'general';
  }

  assessComplexity(bylaw) {
    const contentLength = bylaw.content_en.length;
    const hasCalculations = this.requiresCalculation(bylaw);
    const hasExceptions = this.hasExceptions(bylaw);
    const hasMultipleConditions = (bylaw.content_en.match(/and|or|if|unless|except|provided|where/gi) || []).length > 5;

    if (contentLength > 1000 && hasCalculations && hasExceptions && hasMultipleConditions) return 5;
    if (contentLength > 600 && hasCalculations && hasExceptions) return 4;
    if (contentLength > 300 && (hasCalculations || hasExceptions)) return 3;
    if (contentLength > 150) return 2;
    return 1;
  }

  requiresCalculation(bylaw) {
    const calcKeywords = ['calculate', 'computation', 'formula', 'minimum', 'maximum', 'percentage', 'ratio', 'area', 'volume', 'height', 'width', 'load', 'capacity', 'factor', 'coefficient'];
    const text = bylaw.content_en.toLowerCase();
    return calcKeywords.some(keyword => text.includes(keyword));
  }

  hasExceptions(bylaw) {
    const exceptionKeywords = ['except', 'unless', 'provided that', 'subject to', 'notwithstanding', 'however', 'but', 'save'];
    const text = bylaw.content_en.toLowerCase();
    return exceptionKeywords.some(keyword => text.includes(keyword));
  }

  inferBuildingTypes(bylaw) {
    const text = `${bylaw.title_en} ${bylaw.content_en}`.toLowerCase();
    const types = [];
    
    if (text.match(/residential|dwelling|house|apartment|flat/)) types.push('residential');
    if (text.match(/commercial|office|shop|retail|business/)) types.push('commercial');
    if (text.match(/industrial|factory|warehouse|manufacturing/)) types.push('industrial');
    if (text.match(/institutional|school|hospital|government|public/)) types.push('institutional');
    if (text.match(/assembly|theater|cinema|hall|auditorium/)) types.push('assembly');
    
    // If no specific types found, assume all
    return types.length > 0 ? types : ['residential', 'commercial', 'industrial', 'institutional'];
  }

  assessPriority(bylaw) {
    const text = `${bylaw.title_en} ${bylaw.content_en}`.toLowerCase();
    
    if (text.match(/fire|safety|emergency|structural|foundation|life|death|danger|critical/)) return 'critical';
    if (text.match(/access|health|ventilation|lighting|sanitation|drainage/)) return 'high';
    if (text.match(/plan|submission|approval|documentation|record/)) return 'standard';
    
    return 'standard';
  }

  async exportCleanBylaws() {
    console.log('📊 Exporting clean by-laws...');
    
    // Export JSON
    await fs.writeFile(
      `${this.outputDir}/data/clean-ubbl-bylaws.json`,
      JSON.stringify(this.bylaws, null, 2)
    );

    // Export TypeScript
    const tsContent = `// Clean UBBL By-laws (Actual ${this.bylaws.length} By-laws)
// Extracted from UBBL-1984-2022.pdf
// Generated on ${new Date().toISOString()}

export interface UBBLBylaw {
  id: string;
  bylaw_number: string;
  sequence: number;
  part_number: number;
  part_roman: string;
  part_title_en: string;
  title_en: string;
  title_ms: string;
  content_en: string;
  content_ms: string;
  page_reference: number;
  keywords: string[];
  category: string;
  complexity_level: number;
  requires_calculation: boolean;
  has_exceptions: boolean;
  applicable_building_types: string[];
  priority_level: string;
  created_at: string;
  updated_at: string;
}

export const cleanUBBLBylaws: UBBLBylaw[] = ${JSON.stringify(this.bylaws, null, 2)};

export const TOTAL_CLEAN_BYLAWS = ${this.bylaws.length};

// Helper functions
export const getBylawByNumber = (number: string): UBBLBylaw | undefined => {
  return cleanUBBLBylaws.find(b => b.bylaw_number === number);
};

export const getBylawsByPart = (partNumber: number): UBBLBylaw[] => {
  return cleanUBBLBylaws.filter(b => b.part_number === partNumber);
};

export const getBylawsByCategory = (category: string): UBBLBylaw[] => {
  return cleanUBBLBylaws.filter(b => b.category === category);
};

export const getCriticalBylaws = (): UBBLBylaw[] => {
  return cleanUBBLBylaws.filter(b => b.priority_level === 'critical');
};

export const getComplexBylaws = (): UBBLBylaw[] => {
  return cleanUBBLBylaws.filter(b => b.complexity_level >= 4);
};
`;

    await fs.writeFile(`${this.outputDir}/data/cleanUBBLBylaws.ts`, tsContent);

    // Export summary
    const summary = {
      total_bylaws: this.bylaws.length,
      by_part: this.getBylawsByPart(),
      by_category: this.getBylawsByCategory(),
      by_priority: this.getBylawsByPriority(),
      by_complexity: this.getBylawsByComplexity(),
      extraction_date: new Date().toISOString(),
      source: 'UBBL-1984-2022.pdf',
      method: 'Clean extraction of actual by-laws only'
    };

    await fs.writeFile(
      `${this.outputDir}/data/clean-summary.json`,
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ Exported ${this.bylaws.length} clean by-laws`);
    console.log(`📁 Files saved to ${this.outputDir}/data/`);

    return summary;
  }

  getBylawsByPart() {
    const byPart = {};
    this.bylaws.forEach(bylaw => {
      if (!byPart[bylaw.part_number]) byPart[bylaw.part_number] = 0;
      byPart[bylaw.part_number]++;
    });
    return byPart;
  }

  getBylawsByCategory() {
    const byCategory = {};
    this.bylaws.forEach(bylaw => {
      if (!byCategory[bylaw.category]) byCategory[bylaw.category] = 0;
      byCategory[bylaw.category]++;
    });
    return byCategory;
  }

  getBylawsByPriority() {
    const byPriority = { critical: 0, high: 0, standard: 0, low: 0 };
    this.bylaws.forEach(bylaw => {
      byPriority[bylaw.priority_level]++;
    });
    return byPriority;
  }

  getBylawsByComplexity() {
    const byComplexity = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.bylaws.forEach(bylaw => {
      byComplexity[bylaw.complexity_level]++;
    });
    return byComplexity;
  }

  async process() {
    console.log('🚀 Starting proper UBBL by-laws extraction...');
    
    await this.init();
    const pdfData = await this.extractText();
    await this.parseProperBylaws(pdfData);
    const summary = await this.exportCleanBylaws();
    
    console.log(`\n🎉 Clean Extraction Complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Total by-laws: ${summary.total_bylaws}`);
    console.log(`  - Parts covered: ${Object.keys(summary.by_part).length}`);
    console.log(`  - Categories: ${Object.keys(summary.by_category).length}`);
    console.log(`  - Critical priority: ${summary.by_priority.critical}`);
    console.log(`  - High complexity: ${summary.by_complexity[5] + summary.by_complexity[4]}`);
    console.log(`📁 Clean data: ${this.outputDir}/data/cleanUBBLBylaws.ts`);

    return summary;
  }
}

// CLI usage
if (require.main === module) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node extract-proper-bylaws.cjs <path-to-ubbl-pdf>');
    process.exit(1);
  }
  
  const extractor = new ProperUBBLExtractor(pdfPath);
  extractor.process().catch(console.error);
}

module.exports = ProperUBBLExtractor;