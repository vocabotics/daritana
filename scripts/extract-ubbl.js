#!/usr/bin/env node
/**
 * Simple UBBL PDF Text Processor (CommonJS)
 * Extracts text content from UBBL-1984-2022.pdf
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

class UBBLExtractor {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.outputDir = './ubbl-processed';
    this.clauses = [];
  }

  async init() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(`${this.outputDir}/data`, { recursive: true });
    } catch (error) {
      console.log('Directories already exist or created successfully');
    }
  }

  async extractText() {
    console.log('📖 Extracting text from PDF...');
    const dataBuffer = await fs.readFile(this.pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Save raw text for analysis
    await fs.writeFile(`${this.outputDir}/raw-text.txt`, data.text);
    console.log(`✅ Extracted ${data.text.length} characters of text`);
    
    return data;
  }

  async parseBasicStructure(pdfData) {
    console.log('🏗️ Parsing UBBL structure...');
    
    const lines = pdfData.text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let currentPart = null;
    let clauseCount = 0;
    let inTableOfContents = false;

    console.log(`Processing ${lines.length} lines...`);

    // Look for key sections and structure
    const sections = {
      parts: [],
      clauses: [],
      content_sections: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      // Detect parts
      const partMatch = line.match(/^PART\s+([IVX]+)\s*[-–]?\s*(.*)$/i);
      if (partMatch) {
        currentPart = {
          number: this.romanToNumber(partMatch[1]),
          roman: partMatch[1],
          title: partMatch[2].trim() || nextLine.trim()
        };
        sections.parts.push(currentPart);
        console.log(`Found ${partMatch[1]}: ${currentPart.title}`);
        continue;
      }

      // Detect clause patterns
      const clauseMatch = line.match(/^(\d+[A-Z]?)\.?\s+(.*)$/);
      if (clauseMatch && currentPart) {
        const clauseNum = clauseMatch[1];
        const title = clauseMatch[2].trim();
        
        if (title.length > 5) { // Filter out noise
          sections.clauses.push({
            number: clauseNum,
            title: title,
            part: currentPart.number,
            part_title: currentPart.title
          });
          clauseCount++;
          
          if (clauseCount <= 10) { // Show first 10 for debugging
            console.log(`  Clause ${clauseNum}: ${title.substring(0, 60)}...`);
          }
        }
      }

      // Look for table of contents
      if (line.toLowerCase().includes('table of contents') || line.toLowerCase().includes('contents')) {
        inTableOfContents = true;
      }
    }

    console.log(`\n📊 Extraction Summary:`);
    console.log(`- Found ${sections.parts.length} parts`);
    console.log(`- Found ${sections.clauses.length} potential clauses`);
    
    // Save structured data
    await fs.writeFile(
      `${this.outputDir}/data/ubbl-basic-structure.json`,
      JSON.stringify(sections, null, 2)
    );

    return sections;
  }

  async extractDetailedContent(pdfData) {
    console.log('📝 Extracting detailed content...');
    
    const lines = pdfData.text.split('\n').map(line => line.trim());
    const detailedClauses = [];
    let currentClause = null;
    let currentPart = null;
    let collectingContent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line || line.length < 3) continue;

      // Detect parts
      const partMatch = line.match(/^PART\s+([IVX]+)\s*[-–]?\s*(.*)$/i);
      if (partMatch) {
        currentPart = {
          number: this.romanToNumber(partMatch[1]),
          title: partMatch[2].trim()
        };
        collectingContent = false;
        continue;
      }

      // Detect clause start
      const clauseMatch = line.match(/^(\d+[A-Z]?)\.?\s*(.*)$/);
      if (clauseMatch && currentPart) {
        // Save previous clause
        if (currentClause && currentClause.content.trim()) {
          detailedClauses.push(currentClause);
        }

        const clauseNum = clauseMatch[1];
        const title = clauseMatch[2].trim();

        currentClause = {
          id: `ubbl-${clauseNum.toLowerCase()}`,
          clause_number: clauseNum,
          part_number: currentPart.number,
          part_title_en: currentPart.title,
          title_en: title,
          title_ms: title, // Placeholder
          content_en: '',
          content_ms: '', // Placeholder
          content: ''
        };

        collectingContent = true;
        continue;
      }

      // Collect content for current clause
      if (collectingContent && currentClause && line) {
        // Stop if we hit another clause or section
        if (line.match(/^(\d+[A-Z]?)\./) || line.match(/^PART\s+[IVX]+/i)) {
          i--; // Back up to process this line properly
          collectingContent = false;
          continue;
        }

        currentClause.content += line + ' ';
        currentClause.content_en += line + ' ';
      }
    }

    // Add the last clause
    if (currentClause && currentClause.content.trim()) {
      detailedClauses.push(currentClause);
    }

    // Clean up content
    detailedClauses.forEach(clause => {
      clause.content = clause.content.trim();
      clause.content_en = clause.content_en.trim();
      clause.content_ms = clause.content_en; // Placeholder
      
      // Add metadata
      clause.applicable_building_types = ['residential', 'commercial', 'industrial', 'institutional'];
      clause.calculation_required = this.requiresCalculation(clause.content_en);
      clause.keywords = this.generateKeywords(clause);
      clause.created_at = new Date().toISOString();
      clause.updated_at = new Date().toISOString();
    });

    console.log(`✅ Extracted ${detailedClauses.length} detailed clauses`);

    return detailedClauses;
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

  requiresCalculation(text) {
    const calcKeywords = ['calculate', 'minimum', 'maximum', 'percentage', 'ratio', 'formula', 'area', 'volume', 'height', 'width'];
    return calcKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  generateKeywords(clause) {
    const text = `${clause.title_en} ${clause.content_en}`.toLowerCase();
    const commonWords = ['the', 'and', 'or', 'of', 'in', 'to', 'for', 'shall', 'be', 'a', 'an'];
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 8);
  }

  async process() {
    console.log('🚀 Starting UBBL PDF extraction...');
    
    await this.init();
    const pdfData = await this.extractText();
    const basicStructure = await this.parseBasicStructure(pdfData);
    const detailedClauses = await this.extractDetailedContent(pdfData);

    // Export final results
    const results = {
      extraction_date: new Date().toISOString(),
      source_file: this.pdfPath,
      total_text_length: pdfData.text.length,
      basic_structure: basicStructure,
      detailed_clauses: detailedClauses,
      summary: {
        parts_found: basicStructure.parts.length,
        clauses_extracted: detailedClauses.length,
        avg_clause_length: Math.round(
          detailedClauses.reduce((sum, c) => sum + c.content_en.length, 0) / detailedClauses.length
        )
      }
    };

    await fs.writeFile(
      `${this.outputDir}/data/ubbl-extracted-complete.json`,
      JSON.stringify(results, null, 2)
    );

    // Export just the clauses in the format we need
    await fs.writeFile(
      `${this.outputDir}/data/ubbl-clauses-only.json`,
      JSON.stringify(detailedClauses, null, 2)
    );

    console.log(`\n🎉 Extraction Complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Parts: ${results.summary.parts_found}`);
    console.log(`  - Clauses: ${results.summary.clauses_extracted}`);
    console.log(`  - Avg clause length: ${results.summary.avg_clause_length} chars`);
    console.log(`📁 Output: ${this.outputDir}/data/`);

    return results;
  }
}

// CLI usage
if (require.main === module) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node extract-ubbl.js <path-to-ubbl-pdf>');
    process.exit(1);
  }
  
  const extractor = new UBBLExtractor(pdfPath);
  extractor.process().catch(console.error);
}

module.exports = UBBLExtractor;