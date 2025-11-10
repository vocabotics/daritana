#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * Generates sitemap.xml for SEO
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_APP_URL || 'https://daritana.com';

// Define routes with their properties
const routes = [
  // Main pages
  { url: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },

  // Dashboard and core features
  { url: '/dashboard', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() },
  { url: '/projects', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() },
  { url: '/tasks', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
  { url: '/kanban', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
  { url: '/timeline', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
  { url: '/calendar', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },

  // Team and collaboration
  { url: '/team', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },

  // Financial
  { url: '/financial', changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString() },
  { url: '/financial/invoices', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
  { url: '/financial/expenses', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },

  // Marketplace
  { url: '/marketplace', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },

  // Community
  { url: '/community', changefreq: 'daily', priority: 0.7, lastmod: new Date().toISOString() },

  // Files and documents
  { url: '/files', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },

  // Help and support
  { url: '/help', changefreq: 'monthly', priority: 0.6, lastmod: new Date().toISOString() },

  // Architect specific pages
  { url: '/architect/authority-tracking', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/ccc-tracking', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/dlp-management', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/meeting-minutes', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/payment-certificates', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/retention-tracking', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/architect/site-instructions', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },

  // Enterprise PM
  { url: '/enterprise-pm', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },
  { url: '/enterprise-pm/gantt', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/enterprise-pm/resources', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },
  { url: '/enterprise-pm/portfolio', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },

  // Admin (lower priority, less frequent)
  { url: '/admin', changefreq: 'monthly', priority: 0.4, lastmod: new Date().toISOString() },

  // Settings (lower priority)
  { url: '/settings', changefreq: 'monthly', priority: 0.5, lastmod: new Date().toISOString() },

  // HR Management
  { url: '/hr', changefreq: 'weekly', priority: 0.6, lastmod: new Date().toISOString() },

  // Learning Platform
  { url: '/learning', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },

  // Compliance
  { url: '/compliance', changefreq: 'weekly', priority: 0.7, lastmod: new Date().toISOString() },

  // Construction Monitor
  { url: '/construction', changefreq: 'daily', priority: 0.7, lastmod: new Date().toISOString() },
];

/**
 * Generate XML sitemap entry
 */
function generateUrlEntry(route) {
  const { url, changefreq, priority, lastmod } = route;
  const fullUrl = `${BASE_URL}${url}`;
  const date = lastmod.split('T')[0]; // Get just the date part

  return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

/**
 * Generate complete sitemap XML
 */
function generateSitemap() {
  const urlEntries = routes.map(generateUrlEntry).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;

  return sitemap;
}

/**
 * Write sitemap to public directory
 */
function writeSitemap() {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

  try {
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully!');
    console.log(`📍 Location: ${outputPath}`);
    console.log(`🔗 URLs: ${routes.length}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
writeSitemap();
