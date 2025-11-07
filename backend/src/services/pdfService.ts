import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { Quotation, QuotationItem } from '../models';
import User from '../models/User';
import Project from '../models/Project';

// Register Handlebars helpers
Handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount || 0);
});

Handlebars.registerHelper('formatDate', (date: Date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('multiply', (a: number, b: number) => {
  return (a || 0) * (b || 0);
});

Handlebars.registerHelper('calculateItemTotal', (quantity: number, unitPrice: number, sstRate: number) => {
  const subtotal = (quantity || 0) * (unitPrice || 0);
  const sst = subtotal * ((sstRate || 0) / 100);
  return subtotal + sst;
});

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('or', (a: any, b: any) => a || b);

export class PDFService {
  private static instance: PDFService;
  private browser: puppeteer.Browser | null = null;

  private constructor() {}

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async generateQuotationPDF(quotationId: string): Promise<Buffer> {
    try {
      // Fetch quotation with all related data
      const quotation = await Quotation.findByPk(quotationId, {
        include: [
          {
            model: QuotationItem,
            as: 'items',
            order: [['sort_order', 'ASC']],
          },
          {
            model: User,
            as: 'client',
            attributes: ['id', 'email', 'firstName', 'lastName', 'phone'],
          },
          {
            model: User,
            as: 'preparedBy',
            attributes: ['id', 'email', 'firstName', 'lastName', 'phone'],
          },
          {
            model: Project,
            as: 'project',
          },
        ],
      });

      if (!quotation) {
        throw new Error('Quotation not found');
      }

      // Load and compile the template
      const templatePath = path.join(__dirname, '../templates/quotation.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // Prepare data for the template
      const templateData = {
        quotation: quotation.toJSON(),
        company: {
          name: 'Daritana Architect Management',
          address: 'Level 23, KLCC Tower 2',
          city: 'Kuala Lumpur, 50088',
          phone: '+60 3-2333 8888',
          email: 'info@daritana.my',
          website: 'www.daritana.my',
          registration: 'SSM: 202401234567-K',
        },
        generatedAt: new Date(),
      };

      // Generate HTML from template
      const html = template(templateData);

      // Generate PDF using Puppeteer
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      await page.close();

      return pdf;
    } catch (error) {
      console.error('Error generating quotation PDF:', error);
      throw error;
    }
  }

  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      // Similar implementation for invoice PDF
      // Fetch invoice data
      const invoice = await this.fetchInvoiceData(invoiceId);
      
      // Load invoice template
      const templatePath = path.join(__dirname, '../templates/invoice.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // Prepare template data
      const templateData = {
        invoice,
        company: {
          name: 'Daritana Architect Management',
          address: 'Level 23, KLCC Tower 2',
          city: 'Kuala Lumpur, 50088',
          phone: '+60 3-2333 8888',
          email: 'info@daritana.my',
          website: 'www.daritana.my',
          registration: 'SSM: 202401234567-K',
          bank: {
            name: 'Maybank',
            account: '5123 4567 8901',
            swift: 'MBBEMYKL',
          },
        },
        generatedAt: new Date(),
      };

      // Generate HTML and PDF
      const html = template(templateData);
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      await page.close();
      return pdf;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  async generateStatementPDF(clientId: string, fromDate: Date, toDate: Date): Promise<Buffer> {
    try {
      // Fetch statement data
      const statementData = await this.fetchStatementData(clientId, fromDate, toDate);
      
      // Load statement template
      const templatePath = path.join(__dirname, '../templates/statement.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // Generate HTML and PDF
      const html = template(statementData);
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      await page.close();
      return pdf;
    } catch (error) {
      console.error('Error generating statement PDF:', error);
      throw error;
    }
  }

  private async fetchInvoiceData(invoiceId: string): Promise<any> {
    // Implementation to fetch invoice data
    // This would include invoice details, items, payments, etc.
    return {};
  }

  private async fetchStatementData(clientId: string, fromDate: Date, toDate: Date): Promise<any> {
    // Implementation to fetch statement data
    // This would include all invoices, payments, and balances for the period
    return {
      client: {},
      transactions: [],
      summary: {},
      period: { fromDate, toDate },
    };
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}