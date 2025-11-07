#!/usr/bin/env node
/**
 * Simple UBBL PDF Text Processor
 * Extracts text content from UBBL-1984-2022.pdf
 * No AI dependencies - just direct text extraction
 */

import fs from 'fs/promises';
import PDFParser from 'pdf-parse';

class SimpleUBBLProcessor {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.outputDir = './ubbl-processed';
    this.clauses = [];
    this.currentPart = null;
  }

  async init() {
    // Create output directories
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(`${this.outputDir}/data`, { recursive: true });
  }

  async extractText() {
    console.log('📖 Extracting text from PDF...');
    const dataBuffer = await fs.readFile(this.pdfPath);
    const data = await PDFParser(dataBuffer);
    
    // Save raw text for analysis
    await fs.writeFile(`${this.outputDir}/raw-text.txt`, data.text);
    
    return data;
  }

  async parseStructure(pdfData) {
    console.log('🏗️ Parsing UBBL structure...');
    
    const lines = pdfData.text.split('\n').filter(line => line.trim());
    let currentClause = null;
    let pageNumber = 1;
    let inContent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // Skip headers, footers, page numbers
      if (this.isSkippableLine(line)) {
        continue;
      }
      
      // Detect page numbers
      const pageMatch = line.match(/^(\d+)$/);
      if (pageMatch && parseInt(pageMatch[1]) > pageNumber) {
        pageNumber = parseInt(pageMatch[1]);
        continue;
      }
      
      // Detect parts (PART I, PART II, etc.)
      const partMatch = line.match(/^PART\s+([IVX]+)\s*[-–]?\s*(.*)$/i);
      if (partMatch) {
        this.currentPart = {
          number: this.romanToNumber(partMatch[1]),
          title_en: partMatch[2].trim() || nextLine.trim(),
          clauses: []
        };
        console.log(`Found Part ${this.currentPart.number}: ${this.currentPart.title_en}`);
        continue;
      }
      
      // Detect clause numbers (1., 12., 123A., etc.)
      const clauseMatch = line.match(/^(\d+[A-Z]?)\.?\s*(.*)$/);
      if (clauseMatch && this.currentPart) {
        // Save previous clause
        if (currentClause) {
          this.clauses.push(currentClause);
        }
        
        const clauseNumber = clauseMatch[1];
        const titleText = clauseMatch[2].trim() || nextLine.trim();
        
        currentClause = {
          id: `ubbl-${clauseNumber.toLowerCase()}`,
          clause_number: clauseNumber,
          part_number: this.currentPart.number,
          part_title_en: this.currentPart.title_en,
          title_en: titleText,
          content_en: '',
          pdf_page: pageNumber,
          lines: []
        };
        
        console.log(`  Found Clause ${clauseNumber}: ${titleText.substring(0, 50)}...`);
        inContent = true;
        continue;
      }
      
      // Add content to current clause
      if (currentClause && inContent && line) {
        // Stop if we hit another clause or part
        if (line.match(/^(\d+[A-Z]?)\./) || line.match(/^PART\s+[IVX]+/i)) {
          i--; // Go back one line to process it properly
          inContent = false;
          continue;
        }
        
        currentClause.content_en += line + ' ';
        currentClause.lines.push({
          text: line,
          page: pageNumber
        });
      }
    }
    
    // Add last clause
    if (currentClause) {
      this.clauses.push(currentClause);
    }
    
    // Clean up content
    this.clauses.forEach(clause => {
      clause.content_en = clause.content_en.trim();
      
      // Generate keywords from title and content
      clause.keywords = this.generateKeywords(clause);
      
      // Set default applicable building types
      clause.applicable_building_types = [
        'residential_low_rise', 'residential_high_rise',
        'commercial_retail', 'commercial_office',
        'industrial_light', 'institutional_school'
      ];
      
      // Set default values
      clause.title_ms = clause.title_en; // Will be translated later
      clause.content_ms = clause.content_en; // Will be translated later
      clause.effective_date = new Date('1984-01-01');
      clause.amendment_history = [];
      clause.calculation_required = this.requiresCalculation(clause);
      clause.has_exceptions = this.hasExceptions(clause);
      clause.complexity_level = this.assessComplexity(clause);
      clause.priority_level = this.assessPriority(clause);
      clause.related_clauses = [];
      clause.tags = this.generateTags(clause);
      clause.created_at = new Date();
      clause.updated_at = new Date();
    });
    
    console.log(`✅ Parsed ${this.clauses.length} clauses across ${this.currentPart?.number || 'unknown'} parts`);
    return this.clauses;
  }

  async exportData() {
    console.log('📊 Exporting structured data...');
    
    // Export JSON
    await fs.writeFile(
      `${this.outputDir}/data/ubbl-clauses-extracted.json`,
      JSON.stringify(this.clauses, null, 2)
    );

    // Export TypeScript data file
    const tsContent = `// Extracted UBBL Clauses from PDF
// Generated on ${new Date().toISOString()}
// Total clauses: ${this.clauses.length}

import { UBBLClause } from '../src/types/ubbl';

export const extractedUBBLClauses: UBBLClause[] = ${JSON.stringify(this.clauses, null, 2)};

export const TOTAL_EXTRACTED_CLAUSES = ${this.clauses.length};
`;

    await fs.writeFile(
      `${this.outputDir}/data/ubbl-extracted.ts`,
      tsContent
    );

    // Export summary
    const summary = {
      total_clauses: this.clauses.length,
      parts: [...new Set(this.clauses.map(c => c.part_number))].sort(),
      extraction_date: new Date().toISOString(),
      source_file: this.pdfPath,
      statistics: {
        avg_content_length: Math.round(this.clauses.reduce((sum, c) => sum + c.content_en.length, 0) / this.clauses.length),
        clauses_by_part: this.getClausesByPart(),
        requires_calculation: this.clauses.filter(c => c.calculation_required).length,
        high_complexity: this.clauses.filter(c => c.complexity_level >= 4).length,
        critical_priority: this.clauses.filter(c => c.priority_level === 'critical').length
      }
    };

    await fs.writeFile(
      `${this.outputDir}/data/extraction-summary.json`,
      JSON.stringify(summary, null, 2)
    );

    console.log('✅ Exported structured data files');
    return summary;
  }

  // Helper methods
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

  isSkippableLine(line) {
    // Skip common headers, footers, and noise
    const skipPatterns = [
      /^UNIFORM BUILDING BY-LAWS/i,
      /^\d{4}$/,
      /^Page \d+/i,
      /^Published by/i,
      /^Copyright/i,
      /^All rights reserved/i,
      /^\s*$/
    ];
    
    return skipPatterns.some(pattern => pattern.test(line)) || line.length < 3;
  }

  generateKeywords(clause) {
    const text = `${clause.title_en} ${clause.content_en}`.toLowerCase();
    const commonWords = ['the', 'and', 'or', 'of', 'in', 'to', 'for', 'shall', 'be', 'a', 'an', 'is', 'by', 'with', 'as', 'at', 'on'];
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word) && /^[a-z]+$/.test(word))
      .slice(0, 10);
  }

  requiresCalculation(clause) {
    const calculationKeywords = ['calculate', 'computation', 'formula', 'minimum', 'maximum', 'percentage', 'ratio', 'area', 'volume', 'height', 'width', 'load', 'capacity'];
    const text = clause.content_en.toLowerCase();
    return calculationKeywords.some(keyword => text.includes(keyword));
  }

  hasExceptions(clause) {
    const exceptionKeywords = ['except', 'unless', 'provided that', 'subject to', 'notwithstanding', 'however'];
    const text = clause.content_en.toLowerCase();
    return exceptionKeywords.some(keyword => text.includes(keyword));
  }

  assessComplexity(clause) {
    const contentLength = clause.content_en.length;
    const hasCalculations = this.requiresCalculation(clause);
    const hasExceptions = this.hasExceptions(clause);
    const hasMultipleConditions = (clause.content_en.match(/and|or/gi) || []).length > 3;

    if (contentLength > 1000 || (hasCalculations && hasExceptions && hasMultipleConditions)) return 5;
    if (contentLength > 500 || (hasCalculations && hasExceptions)) return 4;
    if (contentLength > 250 || hasCalculations) return 3;
    if (contentLength > 100) return 2;
    return 1;
  }

  assessPriority(clause) {
    const criticalKeywords = ['fire', 'safety', 'structural', 'emergency', 'life', 'death', 'collapse', 'danger'];
    const highKeywords = ['access', 'ventilation', 'lighting', 'sanitation', 'health'];
    const text = clause.content_en.toLowerCase();

    if (criticalKeywords.some(keyword => text.includes(keyword))) return 'critical';
    if (highKeywords.some(keyword => text.includes(keyword))) return 'high';
    return 'standard';
  }

  generateTags(clause) {
    const tags = [];
    const text = clause.content_en.toLowerCase();

    // Building systems
    if (text.includes('fire') || text.includes('alarm')) tags.push('fire-safety');
    if (text.includes('structural') || text.includes('load') || text.includes('foundation')) tags.push('structural');
    if (text.includes('ventilation') || text.includes('air')) tags.push('ventilation');
    if (text.includes('lighting') || text.includes('illumination')) tags.push('lighting');
    if (text.includes('access') || text.includes('entrance') || text.includes('exit')) tags.push('accessibility');
    if (text.includes('parking') || text.includes('vehicle')) tags.push('parking');
    if (text.includes('sanitary') || text.includes('toilet') || text.includes('drainage')) tags.push('sanitation');

    // Building types
    if (text.includes('residential') || text.includes('dwelling')) tags.push('residential');
    if (text.includes('commercial') || text.includes('office') || text.includes('retail')) tags.push('commercial');
    if (text.includes('industrial') || text.includes('factory') || text.includes('warehouse')) tags.push('industrial');
    if (text.includes('institutional') || text.includes('school') || text.includes('hospital')) tags.push('institutional');

    return tags;
  }

  getClausesByPart() {
    const byPart = {};
    this.clauses.forEach(clause => {
      if (!byPart[clause.part_number]) byPart[clause.part_number] = 0;
      byPart[clause.part_number]++;
    });
    return byPart;
  }

  async process() {
    console.log('🏗️ Starting simple UBBL PDF processing...');
    
    await this.init();
    const pdfData = await this.extractText();
    await this.parseStructure(pdfData);
    const summary = await this.exportData();
    
    console.log(`🎉 Processing complete!`);
    console.log(`📊 Extracted ${summary.total_clauses} clauses from ${summary.parts.length} parts`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`📈 Statistics:`, summary.statistics);
    
    return summary;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node simple-ubbl-processor.js <path-to-ubbl-pdf>');
    process.exit(1);
  }
  
  const processor = new SimpleUBBLProcessor(pdfPath);
  processor.process().catch(console.error);
}

export default SimpleUBBLProcessor;