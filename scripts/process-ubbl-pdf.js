#!/usr/bin/env node
/**
 * UBBL PDF Processing Script
 * Extracts structured data from UBBL-1984-2022.pdf
 * Converts to database-ready format with bilingual support
 */

import fs from 'fs/promises';
import path from 'path';
import pdf2pic from 'pdf2pic';
import PDFParser from 'pdf-parse';
import OpenAI from 'openai';
import { createWriteStream } from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class UBBLProcessor {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.outputDir = './ubbl-processed';
    this.clauses = [];
    this.currentPart = null;
    this.pageMapping = new Map();
  }

  async init() {
    // Create output directories
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(`${this.outputDir}/images`, { recursive: true });
    await fs.mkdir(`${this.outputDir}/data`, { recursive: true });
    await fs.mkdir(`${this.outputDir}/sql`, { recursive: true });
  }

  async extractText() {
    console.log('📖 Extracting text from PDF...');
    const dataBuffer = await fs.readFile(this.pdfPath);
    const data = await PDFParser(dataBuffer);
    
    // Save raw text for analysis
    await fs.writeFile(`${this.outputDir}/raw-text.txt`, data.text);
    
    return data;
  }

  async extractImages() {
    console.log('🖼️ Extracting images from PDF...');
    const convert = pdf2pic.fromPath(this.pdfPath, {
      density: 300,
      saveFilename: 'page',
      savePath: `${this.outputDir}/images`,
      format: 'png',
      width: 2550,
      height: 3300
    });
    
    // Convert all pages to images for AI analysis
    const results = await convert.bulk(-1, { responseType: 'image' });
    console.log(`✅ Extracted ${results.length} page images`);
    
    return results;
  }

  async parseStructure(pdfData) {
    console.log('🏗️ Parsing UBBL structure...');
    
    const lines = pdfData.text.split('\n').filter(line => line.trim());
    let currentClause = null;
    let pageNumber = 1;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect page numbers
      if (/^Page \d+/.test(trimmedLine) || /^\d+$/.test(trimmedLine)) {
        pageNumber = parseInt(trimmedLine.match(/\d+/)[0]);
        continue;
      }
      
      // Detect parts (PART I, PART II, etc.)
      const partMatch = trimmedLine.match(/^PART\s+([IVX]+)\s*[-–]\s*(.+)$/i);
      if (partMatch) {
        this.currentPart = {
          number: this.romanToNumber(partMatch[1]),
          title_en: partMatch[2],
          clauses: []
        };
        continue;
      }
      
      // Detect clause numbers (12.3, 123A, etc.)
      const clauseMatch = trimmedLine.match(/^(\d+[A-Z]?(?:\.\d+)*)\s*[-–]?\s*(.*)$/);
      if (clauseMatch && this.currentPart) {
        if (currentClause) {
          this.clauses.push(currentClause);
        }
        
        currentClause = {
          clause_number: clauseMatch[1],
          part_number: this.currentPart.number,
          part_title_en: this.currentPart.title_en,
          title_en: clauseMatch[2] || '',
          content_en: '',
          pdf_page_start: pageNumber,
          lines: []
        };
        continue;
      }
      
      // Add content to current clause
      if (currentClause && trimmedLine) {
        if (!currentClause.title_en && trimmedLine.length < 200) {
          currentClause.title_en = trimmedLine;
        } else {
          currentClause.content_en += trimmedLine + ' ';
          currentClause.lines.push({
            text: trimmedLine,
            page: pageNumber
          });
        }
      }
    }
    
    // Add last clause
    if (currentClause) {
      this.clauses.push(currentClause);
    }
    
    console.log(`✅ Parsed ${this.clauses.length} clauses`);
    return this.clauses;
  }

  async translateContent() {
    console.log('🌐 Translating content to Bahasa Malaysia...');
    
    const batchSize = 10;
    for (let i = 0; i < this.clauses.length; i += batchSize) {
      const batch = this.clauses.slice(i, i + batchSize);
      
      console.log(`Translating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.clauses.length/batchSize)}`);
      
      const translations = await this.translateBatch(batch);
      
      // Apply translations
      batch.forEach((clause, index) => {
        if (translations[index]) {
          clause.title_ms = translations[index].title_ms;
          clause.content_ms = translations[index].content_ms;
          clause.part_title_ms = translations[index].part_title_ms;
        }
      });
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async translateBatch(clauses) {
    const prompt = `
Translate the following UBBL (Uniform Building By-Laws) clauses from English to formal Bahasa Malaysia legal language.
Maintain the legal terminology and structure. Return as JSON array with same structure.

${JSON.stringify(clauses.map(c => ({
  clause_number: c.clause_number,
  part_title_en: c.part_title_en,
  title_en: c.title_en,
  content_en: c.content_en.slice(0, 1000) // Limit for API
})), null, 2)}
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal translator specializing in Malaysian building regulations. Translate accurately while preserving legal meaning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Translation error:', error);
      return clauses.map(c => ({
        title_ms: c.title_en,
        content_ms: c.content_en,
        part_title_ms: c.part_title_en
      }));
    }
  }

  async generateEmbeddings() {
    console.log('🤖 Generating AI embeddings...');
    
    for (const clause of this.clauses) {
      try {
        // Generate embeddings for English content
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: `${clause.title_en} ${clause.content_en}`
        });
        
        clause.embedding_en = embeddingResponse.data[0].embedding;
        
        // Generate for Malay content if available
        if (clause.content_ms) {
          const embeddingResponseMs = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: `${clause.title_ms} ${clause.content_ms}`
          });
          
          clause.embedding_ms = embeddingResponseMs.data[0].embedding;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error generating embedding for clause ${clause.clause_number}:`, error);
      }
    }
  }

  async generateExplainers() {
    console.log('📝 Generating rich explainers...');
    
    for (const clause of this.clauses.slice(0, 10)) { // Limit for demo
      const explainer = await this.generateClauseExplainer(clause);
      clause.explainer = explainer;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async generateClauseExplainer(clause) {
    const prompt = `
Create a comprehensive, educational explainer for this UBBL clause:

Clause ${clause.clause_number}: ${clause.title_en}
Content: ${clause.content_en}

Generate a JSON response with:
1. simplified_explanation: Easy-to-understand version for students
2. technical_notes: Professional implementation details
3. examples: 2-3 real-world application examples
4. common_violations: What typically goes wrong
5. best_practices: How to ensure compliance
6. calculation_needed: Boolean if calculations are required
7. related_concepts: Array of related building concepts

Focus on Malaysian building practices and regulations.
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a Malaysian building regulations expert and educator. Create practical, actionable guidance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error(`Error generating explainer for clause ${clause.clause_number}:`, error);
      return {
        simplified_explanation: clause.content_en,
        technical_notes: '',
        examples: [],
        common_violations: [],
        best_practices: [],
        calculation_needed: false,
        related_concepts: []
      };
    }
  }

  async generateSQLInserts() {
    console.log('🗄️ Generating SQL insert statements...');
    
    let sql = `-- UBBL Clauses Data Import
-- Generated from ${this.pdfPath}
-- Total clauses: ${this.clauses.length}

`;

    // Generate clause inserts
    for (const clause of this.clauses) {
      const sqlValues = {
        clause_number: this.escapeSql(clause.clause_number),
        part_number: clause.part_number,
        part_title_en: this.escapeSql(clause.part_title_en),
        part_title_ms: this.escapeSql(clause.part_title_ms || clause.part_title_en),
        title_en: this.escapeSql(clause.title_en),
        title_ms: this.escapeSql(clause.title_ms || clause.title_en),
        content_en: this.escapeSql(clause.content_en),
        content_ms: this.escapeSql(clause.content_ms || clause.content_en),
        pdf_page_start: clause.pdf_page_start || 1,
        applicable_building_types: "'{\"residential\", \"commercial\", \"industrial\", \"institutional\"}'",
        calculation_required: clause.explainer?.calculation_needed || false,
        keywords: `'{${this.generateKeywords(clause).map(k => `"${k}"`).join(", ")}}'`
      };

      sql += `INSERT INTO ubbl_clauses (
  clause_number, part_number, part_title_en, part_title_ms,
  title_en, title_ms, content_en, content_ms,
  pdf_page_start, applicable_building_types, calculation_required, keywords
) VALUES (
  '${sqlValues.clause_number}', ${sqlValues.part_number}, '${sqlValues.part_title_en}', '${sqlValues.part_title_ms}',
  '${sqlValues.title_en}', '${sqlValues.title_ms}', '${sqlValues.content_en}', '${sqlValues.content_ms}',
  ${sqlValues.pdf_page_start}, ${sqlValues.applicable_building_types}, ${sqlValues.calculation_required}, ${sqlValues.keywords}
);\n\n`;

      // Generate explainer inserts if available
      if (clause.explainer) {
        sql += `INSERT INTO ubbl_explainers (clause_id, language, explanation_html, simplified_explanation, technical_notes, examples, common_violations, best_practices) VALUES (
  (SELECT id FROM ubbl_clauses WHERE clause_number = '${sqlValues.clause_number}'),
  'en',
  '${this.escapeSql(this.formatAsHtml(clause.explainer))}',
  '${this.escapeSql(clause.explainer.simplified_explanation)}',
  '${this.escapeSql(clause.explainer.technical_notes)}',
  '${JSON.stringify(clause.explainer.examples)}'::jsonb,
  '${JSON.stringify(clause.explainer.common_violations)}'::jsonb,
  '${JSON.stringify(clause.explainer.best_practices)}'::jsonb
);\n\n`;
      }

      // Generate knowledge vector inserts if available
      if (clause.embedding_en) {
        sql += `INSERT INTO ubbl_knowledge_vectors (clause_id, content_embedding_en, content_text_en, content_type) VALUES (
  (SELECT id FROM ubbl_clauses WHERE clause_number = '${sqlValues.clause_number}'),
  '[${clause.embedding_en.join(',')}]'::vector,
  '${this.escapeSql(clause.title_en + ' ' + clause.content_en)}',
  'clause'
);\n\n`;
      }
    }

    await fs.writeFile(`${this.outputDir}/sql/ubbl-data.sql`, sql);
    console.log(`✅ Generated SQL file with ${this.clauses.length} clauses`);
  }

  async exportStructuredData() {
    console.log('📊 Exporting structured data...');
    
    // Export JSON
    await fs.writeFile(
      `${this.outputDir}/data/ubbl-structured.json`,
      JSON.stringify(this.clauses, null, 2)
    );

    // Export CSV for Excel
    const csv = this.convertToCSV(this.clauses);
    await fs.writeFile(`${this.outputDir}/data/ubbl-clauses.csv`, csv);

    // Export TypeScript types
    await this.generateTypeScriptTypes();

    console.log('✅ Exported structured data files');
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

  escapeSql(str) {
    if (!str) return '';
    return str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  generateKeywords(clause) {
    const text = `${clause.title_en} ${clause.content_en}`.toLowerCase();
    const commonWords = ['the', 'and', 'or', 'of', 'in', 'to', 'for', 'shall', 'be', 'a', 'an', 'is', 'by'];
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10);
  }

  formatAsHtml(explainer) {
    let html = `<div class="ubbl-explainer">`;
    html += `<h3>Simplified Explanation</h3><p>${explainer.simplified_explanation}</p>`;
    
    if (explainer.technical_notes) {
      html += `<h3>Technical Notes</h3><p>${explainer.technical_notes}</p>`;
    }
    
    if (explainer.examples.length > 0) {
      html += `<h3>Examples</h3><ul>`;
      explainer.examples.forEach(ex => html += `<li>${ex}</li>`);
      html += `</ul>`;
    }
    
    html += `</div>`;
    return html;
  }

  convertToCSV(data) {
    const headers = ['clause_number', 'part_number', 'title_en', 'title_ms', 'content_en', 'content_ms', 'pdf_page_start'];
    const csvContent = [
      headers.join(','),
      ...data.map(clause => 
        headers.map(header => `"${(clause[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  async generateTypeScriptTypes() {
    const types = `
// Generated TypeScript types for UBBL system
export interface UBBLClause {
  clause_number: string;
  part_number: number;
  part_title_en: string;
  part_title_ms: string;
  title_en: string;
  title_ms: string;
  content_en: string;
  content_ms: string;
  pdf_page_start?: number;
  applicable_building_types: string[];
  calculation_required: boolean;
  keywords: string[];
  explainer?: UBBLExplainer;
}

export interface UBBLExplainer {
  simplified_explanation: string;
  technical_notes: string;
  examples: string[];
  common_violations: string[];
  best_practices: string[];
  calculation_needed: boolean;
  related_concepts: string[];
}
`;
    
    await fs.writeFile(`${this.outputDir}/data/types.ts`, types);
  }

  async process() {
    console.log('🏗️ Starting UBBL PDF processing...');
    
    await this.init();
    const pdfData = await this.extractText();
    await this.extractImages();
    await this.parseStructure(pdfData);
    await this.translateContent();
    await this.generateEmbeddings();
    await this.generateExplainers();
    await this.generateSQLInserts();
    await this.exportStructuredData();
    
    console.log(`🎉 Processing complete! Generated ${this.clauses.length} structured clauses.`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node process-ubbl-pdf.js <path-to-ubbl-pdf>');
    process.exit(1);
  }
  
  const processor = new UBBLProcessor(pdfPath);
  processor.process().catch(console.error);
}

export default UBBLProcessor;