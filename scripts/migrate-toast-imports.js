#!/usr/bin/env node

/**
 * Automated script to migrate toast imports from sonner to our utility
 * 
 * Usage: node scripts/migrate-toast-imports.js
 * 
 * This will:
 * 1. Find all files importing from 'sonner'
 * 2. Replace with our toast utility
 * 3. Update common toast patterns
 * 4. Generate migration report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
let filesModified = 0;
let replacementsMade = 0;

const migrations = [
  {
    pattern: /import\s+{\s*toast\s*}\s+from\s+['"]sonner['"]/g,
    replacement: "import { toast, notifications } from '@/utils/toast'",
    description: 'Update toast import'
  },
  {
    pattern: /toast\.success\(['"]Project created['"]\)/g,
    replacement: 'notifications.project.created()',
    description: 'Project created notification'
  },
  {
    pattern: /toast\.success\(['"]Project updated['"]\)/g,
    replacement: 'notifications.project.updated()',
    description: 'Project updated notification'
  },
  {
    pattern: /toast\.success\(['"]Project deleted['"]\)/g,
    replacement: 'notifications.project.deleted()',
    description: 'Project deleted notification'
  },
  {
    pattern: /toast\.success\(['"]Task created['"]\)/g,
    replacement: 'notifications.task.created()',
    description: 'Task created notification'
  },
  {
    pattern: /toast\.success\(['"]Saved['"]\)/g,
    replacement: 'notifications.generic.saved()',
    description: 'Generic saved notification'
  },
  {
    pattern: /toast\.success\(['"]Copied to clipboard['"]\)/g,
    replacement: 'notifications.generic.copied()',
    description: 'Copied notification'
  },
];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileChanged = false;
  let fileReplacements = 0;

  for (const migration of migrations) {
    const matches = content.match(migration.pattern);
    if (matches) {
      newContent = newContent.replace(migration.pattern, migration.replacement);
      fileChanged = true;
      fileReplacements += matches.length;
      console.log(`  ✓ ${migration.description} (${matches.length}x)`);
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    replacementsMade += fileReplacements;
    return true;
  }
  return false;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('from \'sonner\'') || content.includes('from "sonner"')) {
        console.log(`\nProcessing: ${filePath.replace(srcDir, 'src')}`);
        processFile(filePath);
      }
    }
  }
}

console.log('🚀 Starting toast import migration...\n');
console.log('Scanning src directory for sonner imports...\n');

walkDirectory(srcDir);

console.log('\n' + '='.repeat(60));
console.log('📊 Migration Complete!');
console.log('='.repeat(60));
console.log(`Files modified: ${filesModified}`);
console.log(`Replacements made: ${replacementsMade}`);
console.log('\n✅ Toast imports have been migrated to new utility!');
console.log('\n📝 Next steps:');
console.log('  1. Review changes with: git diff');
console.log('  2. Test the application');
console.log('  3. Commit changes if everything works');
