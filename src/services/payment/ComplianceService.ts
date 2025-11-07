// ==================== PAYMENT COMPLIANCE SERVICE ====================

import { 
  AMLCheck, 
  ComplianceReport,
  PaymentTransaction,
  PaymentMethod,
  PaymentPurpose
} from '@/types/payment';

/**
 * Service for handling payment compliance and regulatory requirements
 */
export class ComplianceService {
  private sstRate: number = 0.06; // 6% SST
  private withholdingTaxRate: number = 0.10; // 10% withholding tax for non-residents
  private professionalTaxRate: number = 0.06; // 6% professional service tax

  /**
   * Perform AML (Anti-Money Laundering) check
   */
  public async performAMLCheck(userId: string): Promise<AMLCheck> {
    // Check against sanctions lists
    const sanctionsCheck = await this.checkSanctionsList(userId);
    
    // Check PEP (Politically Exposed Person) list
    const pepCheck = await this.checkPEPList(userId);
    
    // Check adverse media
    const adverseMediaCheck = await this.checkAdverseMedia(userId);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let status: 'clear' | 'review' | 'blocked' = 'clear';
    const matchedLists: string[] = [];
    
    if (sanctionsCheck.matched) {
      riskLevel = 'high';
      status = 'blocked';
      matchedLists.push('Sanctions List');
    }
    
    if (pepCheck.matched) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      status = status === 'blocked' ? 'blocked' : 'review';
      matchedLists.push('PEP List');
    }
    
    if (adverseMediaCheck.matched) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      status = status === 'clear' ? 'review' : status;
      matchedLists.push('Adverse Media');
    }
    
    return {
      provider: 'Internal AML System',
      checkDate: new Date(),
      status,
      riskLevel,
      matchedLists: matchedLists.length > 0 ? matchedLists : undefined,
      additionalInfo: this.generateAMLReport(userId, riskLevel)
    };
  }

  /**
   * Generate SST report
   */
  public async generateSSTReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    // Fetch transactions for the period
    const transactions = await this.fetchTransactions(startDate, endDate);
    
    // Calculate SST details
    const sstDetails = this.calculateSSTDetails(transactions);
    
    const report: ComplianceReport = {
      id: this.generateReportId(),
      reportType: 'sst',
      period: {
        start: startDate,
        end: endDate
      },
      generatedAt: new Date(),
      status: 'draft',
      sstDetails,
      reportUrl: await this.generateSSTReportPDF(sstDetails, startDate, endDate)
    };
    
    return report;
  }

  /**
   * Generate transaction report for Bank Negara
   */
  public async generateTransactionReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    // Fetch transactions for the period
    const transactions = await this.fetchTransactions(startDate, endDate);
    
    // Analyze transactions
    const transactionSummary = this.analyzeTransactions(transactions);
    
    // Check for suspicious transactions
    const suspiciousTransactions = await this.identifySuspiciousTransactions(transactions);
    
    const report: ComplianceReport = {
      id: this.generateReportId(),
      reportType: 'transaction_report',
      period: {
        start: startDate,
        end: endDate
      },
      generatedAt: new Date(),
      status: 'draft',
      transactionSummary: {
        ...transactionSummary,
        suspiciousTransactions: suspiciousTransactions.map(t => t.id)
      },
      reportUrl: await this.generateTransactionReportPDF(transactionSummary, startDate, endDate)
    };
    
    return report;
  }

  /**
   * Calculate SST for a transaction
   */
  public calculateSST(amount: number, isTaxable: boolean = true): number {
    if (!isTaxable) {
      return 0;
    }
    
    // SST is calculated on service fees, not the principal amount
    // For payment processing, SST applies to the processing fee
    return amount * this.sstRate;
  }

  /**
   * Calculate withholding tax
   */
  public calculateWithholdingTax(
    amount: number,
    isResident: boolean,
    serviceType: 'professional' | 'contractor' | 'other'
  ): number {
    if (isResident) {
      return 0; // No withholding tax for residents
    }
    
    // Different rates for different service types
    const rates: Record<string, number> = {
      'professional': 0.10,
      'contractor': 0.03,
      'other': 0.10
    };
    
    return amount * (rates[serviceType] || 0.10);
  }

  /**
   * Check if transaction requires reporting
   */
  public requiresReporting(transaction: PaymentTransaction): boolean {
    // Transactions above RM 50,000 require reporting
    if (transaction.localAmount >= 50000) {
      return true;
    }
    
    // Cash transactions above RM 25,000 require reporting
    if (transaction.method === 'cash_deposit' && transaction.localAmount >= 25000) {
      return true;
    }
    
    // Multiple transactions totaling RM 50,000 in a day
    // This would need to check daily totals
    
    return false;
  }

  /**
   * Validate business registration
   */
  public async validateBusinessRegistration(
    registrationNo: string,
    type: 'SSM' | 'ROC' | 'ROB'
  ): Promise<{
    valid: boolean;
    companyName?: string;
    status?: string;
  }> {
    // Validate with SSM (Companies Commission of Malaysia) API
    // In production, this would call the actual SSM API
    
    const isValid = this.validateRegistrationFormat(registrationNo, type);
    
    if (!isValid) {
      return { valid: false };
    }
    
    // Mock response
    return {
      valid: true,
      companyName: 'Example Company Sdn Bhd',
      status: 'Active'
    };
  }

  /**
   * Check GST/SST registration
   */
  public async checkTaxRegistration(
    registrationNo: string
  ): Promise<{
    registered: boolean;
    validFrom?: Date;
    validTo?: Date;
  }> {
    // Check with Royal Malaysian Customs Department
    // In production, this would call the actual API
    
    return {
      registered: true,
      validFrom: new Date('2020-01-01'),
      validTo: new Date('2025-12-31')
    };
  }

  /**
   * Generate compliance certificate
   */
  public async generateComplianceCertificate(
    projectId: string,
    period: { start: Date; end: Date }
  ): Promise<string> {
    // Generate a compliance certificate for the project
    // This certifies that all payments comply with Malaysian regulations
    
    const certificateData = {
      projectId,
      period,
      complianceChecks: [
        'AML/CFT Compliance',
        'SST Compliance',
        'Bank Negara Regulations',
        'Payment Services Act 2019',
        'Personal Data Protection Act'
      ],
      issuedDate: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      certificateNo: this.generateCertificateNo()
    };
    
    // Generate PDF certificate
    return this.generateCertificatePDF(certificateData);
  }

  /**
   * Submit report to authorities
   */
  public async submitReportToAuthorities(
    report: ComplianceReport
  ): Promise<{
    submitted: boolean;
    referenceNo?: string;
    error?: string;
  }> {
    // Submit to relevant authorities based on report type
    
    switch (report.reportType) {
      case 'sst':
        return this.submitToCustoms(report);
      
      case 'transaction_report':
        return this.submitToBankNegara(report);
      
      case 'aml':
        return this.submitToFIU(report); // Financial Intelligence Unit
      
      default:
        return { submitted: false, error: 'Unknown report type' };
    }
  }

  // ==================== PRIVATE METHODS ====================

  private async checkSanctionsList(userId: string): Promise<{ matched: boolean }> {
    // Check against UN, OFAC, EU sanctions lists
    // In production, integrate with sanctions screening service
    
    return { matched: false };
  }

  private async checkPEPList(userId: string): Promise<{ matched: boolean }> {
    // Check against PEP (Politically Exposed Person) database
    // In production, integrate with PEP screening service
    
    return { matched: false };
  }

  private async checkAdverseMedia(userId: string): Promise<{ matched: boolean }> {
    // Check for adverse media mentions
    // In production, integrate with media screening service
    
    return { matched: false };
  }

  private generateAMLReport(userId: string, riskLevel: string): string {
    return `AML Risk Assessment for User ${userId}: Risk Level - ${riskLevel}`;
  }

  private async fetchTransactions(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentTransaction[]> {
    // Fetch transactions from database
    // Mock implementation
    return [];
  }

  private calculateSSTDetails(transactions: PaymentTransaction[]): {
    totalSales: number;
    taxableSales: number;
    sstCollected: number;
    inputTax: number;
    netPayable: number;
  } {
    const totalSales = transactions.reduce((sum, t) => sum + t.localAmount, 0);
    const taxableSales = transactions
      .filter(t => this.isTaxableTransaction(t))
      .reduce((sum, t) => sum + t.localAmount, 0);
    
    const sstCollected = transactions.reduce((sum, t) => sum + (t.sst || 0), 0);
    const inputTax = 0; // Would calculate based on purchases
    const netPayable = sstCollected - inputTax;
    
    return {
      totalSales,
      taxableSales,
      sstCollected,
      inputTax,
      netPayable
    };
  }

  private isTaxableTransaction(transaction: PaymentTransaction): boolean {
    // Determine if transaction is SST taxable
    const exemptPurposes: PaymentPurpose[] = ['refund'];
    return !exemptPurposes.includes(transaction.purpose);
  }

  private analyzeTransactions(transactions: PaymentTransaction[]): {
    totalTransactions: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, number>;
    byPurpose: Record<PaymentPurpose, number>;
  } {
    const byMethod: Partial<Record<PaymentMethod, number>> = {};
    const byPurpose: Partial<Record<PaymentPurpose, number>> = {};
    
    transactions.forEach(t => {
      byMethod[t.method] = (byMethod[t.method] || 0) + 1;
      byPurpose[t.purpose] = (byPurpose[t.purpose] || 0) + 1;
    });
    
    return {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.localAmount, 0),
      byMethod: byMethod as Record<PaymentMethod, number>,
      byPurpose: byPurpose as Record<PaymentPurpose, number>
    };
  }

  private async identifySuspiciousTransactions(
    transactions: PaymentTransaction[]
  ): Promise<PaymentTransaction[]> {
    const suspicious: PaymentTransaction[] = [];
    
    for (const transaction of transactions) {
      // Check for suspicious patterns
      if (this.isSuspiciousTransaction(transaction)) {
        suspicious.push(transaction);
      }
    }
    
    return suspicious;
  }

  private isSuspiciousTransaction(transaction: PaymentTransaction): boolean {
    // Check for suspicious indicators
    
    // Large cash transactions
    if (transaction.method === 'cash_deposit' && transaction.localAmount >= 25000) {
      return true;
    }
    
    // Rapid succession of transactions
    // Would need to check transaction history
    
    // Unusual payment patterns
    // Would need to analyze user's normal behavior
    
    return false;
  }

  private validateRegistrationFormat(
    registrationNo: string,
    type: 'SSM' | 'ROC' | 'ROB'
  ): boolean {
    const patterns: Record<string, RegExp> = {
      'SSM': /^\d{12}$/,  // 12 digits for new SSM format
      'ROC': /^\d{6}-[A-Z]$/,  // Old ROC format
      'ROB': /^[A-Z]{2}\d{7}$/  // ROB format
    };
    
    return patterns[type]?.test(registrationNo) || false;
  }

  private generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT${timestamp}${random}`.toUpperCase();
  }

  private generateCertificateNo(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000);
    return `CERT${year}${String(random).padStart(5, '0')}`;
  }

  private async generateSSTReportPDF(
    sstDetails: any,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    // Generate PDF report
    // In production, use PDF generation library
    return `/reports/sst_${startDate.getTime()}_${endDate.getTime()}.pdf`;
  }

  private async generateTransactionReportPDF(
    summary: any,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    // Generate PDF report
    return `/reports/transactions_${startDate.getTime()}_${endDate.getTime()}.pdf`;
  }

  private async generateCertificatePDF(data: any): Promise<string> {
    // Generate PDF certificate
    return `/certificates/${data.certificateNo}.pdf`;
  }

  private async submitToCustoms(report: ComplianceReport): Promise<{
    submitted: boolean;
    referenceNo?: string;
    error?: string;
  }> {
    // Submit SST report to Royal Malaysian Customs
    // In production, integrate with MySST system
    
    try {
      // Mock API call
      const referenceNo = `CUSTOMS${Date.now()}`;
      
      return {
        submitted: true,
        referenceNo
      };
    } catch (error) {
      return {
        submitted: false,
        error: 'Failed to submit to Customs'
      };
    }
  }

  private async submitToBankNegara(report: ComplianceReport): Promise<{
    submitted: boolean;
    referenceNo?: string;
    error?: string;
  }> {
    // Submit transaction report to Bank Negara Malaysia
    // In production, integrate with BNM reporting system
    
    try {
      const referenceNo = `BNM${Date.now()}`;
      
      return {
        submitted: true,
        referenceNo
      };
    } catch (error) {
      return {
        submitted: false,
        error: 'Failed to submit to Bank Negara'
      };
    }
  }

  private async submitToFIU(report: ComplianceReport): Promise<{
    submitted: boolean;
    referenceNo?: string;
    error?: string;
  }> {
    // Submit suspicious transaction report to Financial Intelligence Unit
    
    try {
      const referenceNo = `FIU${Date.now()}`;
      
      return {
        submitted: true,
        referenceNo
      };
    } catch (error) {
      return {
        submitted: false,
        error: 'Failed to submit to FIU'
      };
    }
  }
}