// ==================== FPX PAYMENT GATEWAY INTEGRATION ====================

import crypto from 'crypto';
import { 
  FPXConfiguration, 
  FPXBank, 
  FPXTransaction, 
  FPXRequest, 
  FPXResponse 
} from '@/types/payment';

/**
 * FPX Payment Gateway Integration for Malaysian Banks
 * Implements FPX RTO (Real Time Online) payment processing
 */
export class FPXGateway {
  private config: FPXConfiguration;
  private banks: Map<string, FPXBank> = new Map();
  private lastBankListUpdate: Date | null = null;

  // FPX Bank Codes
  private static readonly BANK_CODES = {
    // Individual Banks
    INDIVIDUAL: {
      'ABB0233': 'Affin Bank',
      'ABMB0212': 'Alliance Bank',
      'AMBB0209': 'AmBank',
      'BIMB0340': 'Bank Islam',
      'BKRM0602': 'Bank Rakyat',
      'BMMB0341': 'Bank Muamalat',
      'BSN0601': 'BSN',
      'CIMB0104': 'CIMB Bank',
      'HLB0224': 'Hong Leong Bank',
      'HSBC0223': 'HSBC Bank',
      'KFH0346': 'Kuwait Finance House',
      'MB2U0227': 'Maybank',
      'MBB0228': 'Maybank',
      'OCBC0229': 'OCBC Bank',
      'PBB0233': 'Public Bank',
      'RHB0218': 'RHB Bank',
      'SCB0216': 'Standard Chartered',
      'UOB0226': 'UOB Bank'
    },
    // Corporate Banks
    CORPORATE: {
      'ABB0234': 'Affin Bank Corporate',
      'ABMB0213': 'Alliance Bank Corporate',
      'AMBB0210': 'AmBank Corporate',
      'BIMB0342': 'Bank Islam Corporate',
      'BKRM0603': 'Bank Rakyat Corporate',
      'BMMB0342': 'Bank Muamalat Corporate',
      'CIMB0105': 'CIMB Bank Corporate',
      'HLB0225': 'Hong Leong Bank Corporate',
      'HSBC0224': 'HSBC Bank Corporate',
      'KFH0347': 'Kuwait Finance House Corporate',
      'MB2U0228': 'Maybank Corporate',
      'MBB0229': 'Maybank Corporate',
      'OCBC0230': 'OCBC Bank Corporate',
      'PBB0234': 'Public Bank Corporate',
      'RHB0219': 'RHB Bank Corporate',
      'SCB0217': 'Standard Chartered Corporate',
      'UOB0227': 'UOB Bank Corporate'
    }
  };

  // FPX URLs
  private static readonly URLS = {
    PRODUCTION: {
      AUTH: 'https://fpx.mepsfpx.com.my/FPXMain/seller2DReceiver.jsp',
      ENQUIRY: 'https://fpx.mepsfpx.com.my/FPXMain/RetrieveBankList',
      TRANSACTION: 'https://fpx.mepsfpx.com.my/FPXMain/sellerNVPTxnStatus.jsp',
      BANK_LIST: 'https://fpx.mepsfpx.com.my/FPXMain/getBankList'
    },
    SANDBOX: {
      AUTH: 'https://uat.mepsfpx.com.my/FPXMain/seller2DReceiver.jsp',
      ENQUIRY: 'https://uat.mepsfpx.com.my/FPXMain/RetrieveBankList',
      TRANSACTION: 'https://uat.mepsfpx.com.my/FPXMain/sellerNVPTxnStatus.jsp',
      BANK_LIST: 'https://uat.mepsfpx.com.my/FPXMain/getBankList'
    },
    UAT: {
      AUTH: 'https://uat.mepsfpx.com.my/FPXMain/seller2DReceiver.jsp',
      ENQUIRY: 'https://uat.mepsfpx.com.my/FPXMain/RetrieveBankList',
      TRANSACTION: 'https://uat.mepsfpx.com.my/FPXMain/sellerNVPTxnStatus.jsp',
      BANK_LIST: 'https://uat.mepsfpx.com.my/FPXMain/getBankList'
    }
  };

  constructor(config: FPXConfiguration) {
    this.config = config;
    this.initializeBankList();
  }

  /**
   * Initialize bank list from static data
   */
  private async initializeBankList(): Promise<void> {
    // Initialize with static bank list
    Object.entries(FPXGateway.BANK_CODES.INDIVIDUAL).forEach(([code, name]) => {
      this.banks.set(code, {
        code,
        name,
        status: 'online',
        type: 'individual',
        lastChecked: new Date()
      });
    });

    Object.entries(FPXGateway.BANK_CODES.CORPORATE).forEach(([code, name]) => {
      this.banks.set(code, {
        code,
        name,
        status: 'online',
        type: 'corporate',
        lastChecked: new Date()
      });
    });

    // Update with real-time status
    await this.updateBankStatus();
  }

  /**
   * Update bank status from FPX
   */
  public async updateBankStatus(): Promise<void> {
    try {
      const url = this.getUrl('BANK_LIST');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          fpx_msgType: 'BE',
          fpx_msgToken: '01',
          fpx_sellerExId: this.config.exchangeId,
          fpx_version: this.config.version
        })
      });

      if (response.ok) {
        const data = await response.text();
        this.parseBankListResponse(data);
        this.lastBankListUpdate = new Date();
      }
    } catch (error) {
      console.error('Failed to update bank status:', error);
    }
  }

  /**
   * Parse bank list response
   */
  private parseBankListResponse(response: string): void {
    const lines = response.split('\n');
    lines.forEach(line => {
      const [code, status] = line.split(',');
      if (code && this.banks.has(code)) {
        const bank = this.banks.get(code)!;
        bank.status = status === '1' ? 'online' : 'offline';
        bank.lastChecked = new Date();
      }
    });
  }

  /**
   * Get available banks
   */
  public async getAvailableBanks(type: 'individual' | 'corporate' = 'individual'): Promise<FPXBank[]> {
    // Update bank status if older than 5 minutes
    if (!this.lastBankListUpdate || 
        (new Date().getTime() - this.lastBankListUpdate.getTime()) > 5 * 60 * 1000) {
      await this.updateBankStatus();
    }

    return Array.from(this.banks.values())
      .filter(bank => bank.type === type && bank.status === 'online')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create FPX payment request
   */
  public createPaymentRequest(params: {
    orderNo: string;
    amount: number;
    buyerEmail: string;
    buyerName: string;
    buyerBankId: string;
    productDesc: string;
    buyerPhone?: string;
    makerName?: string;
  }): FPXRequest {
    const txnTime = this.formatTimestamp(new Date());
    
    const request: FPXRequest = {
      msgType: 'AE',
      msgToken: '01',
      sellerExId: this.config.exchangeId,
      sellerExOrderNo: params.orderNo,
      sellerTxnTime: txnTime,
      sellerOrderNo: params.orderNo,
      sellerId: this.config.merchantId,
      sellerBankCode: '01',
      txnCurrency: 'MYR',
      txnAmount: params.amount.toFixed(2),
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName,
      buyerBankId: params.buyerBankId,
      productDesc: params.productDesc,
      version: this.config.version,
      checksum: ''
    };

    // Add optional fields
    if (params.makerName) {
      request.makerName = params.makerName;
    }

    // Generate checksum
    request.checksum = this.generateChecksum(request);

    return request;
  }

  /**
   * Generate secure checksum using SHA-256
   */
  private generateChecksum(data: FPXRequest | any): string {
    // Create checksum source string in specific order
    const checksumSource = [
      data.buyerAccNo || '',
      data.buyerBankBranch || '',
      data.buyerBankId || '',
      data.buyerEmail || '',
      data.buyerIban || '',
      data.buyerId || '',
      data.buyerName || '',
      data.makerName || '',
      data.msgToken || '',
      data.msgType || '',
      data.productDesc || '',
      data.sellerBankCode || '',
      data.sellerExId || '',
      data.sellerExOrderNo || '',
      data.sellerId || '',
      data.sellerOrderNo || '',
      data.sellerTxnTime || '',
      data.txnAmount || '',
      data.txnCurrency || '',
      data.version || ''
    ].join('|');

    // Add private key
    const sourceWithKey = checksumSource + '|' + this.getPrivateKey();

    // Generate SHA-256 hash
    return crypto
      .createHash('sha256')
      .update(sourceWithKey)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Verify FPX response checksum
   */
  public verifyResponseChecksum(response: FPXResponse): boolean {
    const receivedChecksum = response.fpx_checkSum;
    
    // Create checksum source string
    const checksumSource = [
      response.fpx_buyerBankBranch || '',
      response.fpx_buyerBankId || '',
      response.fpx_buyerIban || '',
      response.fpx_buyerId || '',
      response.fpx_buyerName || '',
      response.fpx_creditAuthCode || '',
      response.fpx_creditAuthNo || '',
      response.fpx_debitAuthCode || '',
      response.fpx_debitAuthNo || '',
      response.fpx_fpxTxnId || '',
      response.fpx_fpxTxnTime || '',
      response.fpx_makerName || '',
      response.fpx_msgToken || '',
      response.fpx_msgType || '',
      response.fpx_sellerBankCode || '',
      response.fpx_sellerExId || '',
      response.fpx_sellerExOrderNo || '',
      response.fpx_sellerId || '',
      response.fpx_sellerOrderNo || '',
      response.fpx_sellerTxnTime || '',
      response.fpx_txnAmount || '',
      response.fpx_txnCurrency || ''
    ].join('|');

    // Add public key
    const sourceWithKey = checksumSource + '|' + this.getPublicKey();

    // Generate SHA-256 hash
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(sourceWithKey)
      .digest('hex')
      .toUpperCase();

    return receivedChecksum === calculatedChecksum;
  }

  /**
   * Process FPX callback response
   */
  public processCallback(response: FPXResponse): FPXTransaction {
    // Verify checksum
    if (!this.verifyResponseChecksum(response)) {
      throw new Error('Invalid FPX response checksum');
    }

    // Map response to transaction
    const transaction: FPXTransaction = {
      fpxTxnId: response.fpx_fpxTxnId || '',
      fpxTxnTime: response.fpx_fpxTxnTime || '',
      fpxSellerOrderNo: response.fpx_sellerOrderNo || '',
      fpxSellerExOrderNo: response.fpx_sellerExOrderNo || '',
      fpxBuyerEmail: response.fpx_buyerEmail || '',
      fpxBuyerName: response.fpx_buyerName || '',
      fpxBuyerBankId: response.fpx_buyerBankId || '',
      fpxBuyerBankBranch: response.fpx_buyerBankBranch || '',
      fpxBuyerAccNo: '',
      fpxBuyerId: response.fpx_buyerId || '',
      fpxMakerName: response.fpx_makerName,
      fpxBuyerIban: response.fpx_buyerIban,
      fpxTxnCurrency: 'MYR',
      fpxTxnAmount: response.fpx_txnAmount || '',
      fpxChecksum: response.fpx_checkSum || '',
      fpxDebitAuthCode: response.fpx_debitAuthCode,
      fpxDebitAuthNo: response.fpx_debitAuthNo,
      fpxCreditAuthCode: response.fpx_creditAuthCode,
      fpxCreditAuthNo: response.fpx_creditAuthNo,
      status: this.mapResponseStatus(response.fpx_debitAuthCode || ''),
      statusDescription: this.getStatusDescription(response.fpx_debitAuthCode || '')
    };

    return transaction;
  }

  /**
   * Query transaction status
   */
  public async queryTransactionStatus(
    orderNo: string, 
    txnTime: string,
    amount: number
  ): Promise<FPXTransaction | null> {
    try {
      const url = this.getUrl('TRANSACTION');
      
      const params = {
        fpx_msgType: 'AE',
        fpx_msgToken: '01',
        fpx_sellerExId: this.config.exchangeId,
        fpx_sellerExOrderNo: orderNo,
        fpx_sellerTxnTime: txnTime,
        fpx_sellerOrderNo: orderNo,
        fpx_sellerId: this.config.merchantId,
        fpx_txnCurrency: 'MYR',
        fpx_txnAmount: amount.toFixed(2),
        fpx_version: this.config.version,
        fpx_checkSum: ''
      };

      // Generate checksum for query
      params.fpx_checkSum = this.generateChecksum(params);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params as any)
      });

      if (response.ok) {
        const data = await response.text();
        return this.parseTransactionResponse(data);
      }

      return null;
    } catch (error) {
      console.error('Failed to query transaction status:', error);
      return null;
    }
  }

  /**
   * Parse transaction response
   */
  private parseTransactionResponse(response: string): FPXTransaction | null {
    // Parse response (typically in query string format)
    const params = new URLSearchParams(response);
    
    const fpxResponse: FPXResponse = {
      fpx_msgType: params.get('fpx_msgType') || '',
      fpx_msgToken: params.get('fpx_msgToken') || '',
      fpx_sellerExId: params.get('fpx_sellerExId') || '',
      fpx_sellerExOrderNo: params.get('fpx_sellerExOrderNo') || '',
      fpx_sellerTxnTime: params.get('fpx_sellerTxnTime') || '',
      fpx_sellerOrderNo: params.get('fpx_sellerOrderNo') || '',
      fpx_buyerBankId: params.get('fpx_buyerBankId') || '',
      fpx_buyerName: params.get('fpx_buyerName') || '',
      fpx_txnCurrency: params.get('fpx_txnCurrency') || '',
      fpx_txnAmount: params.get('fpx_txnAmount') || '',
      fpx_checkSum: params.get('fpx_checkSum') || '',
      fpx_fpxTxnId: params.get('fpx_fpxTxnId'),
      fpx_fpxTxnTime: params.get('fpx_fpxTxnTime'),
      fpx_debitAuthCode: params.get('fpx_debitAuthCode'),
      fpx_debitAuthNo: params.get('fpx_debitAuthNo')
    };

    return this.processCallback(fpxResponse);
  }

  /**
   * Build payment URL
   */
  public buildPaymentUrl(request: FPXRequest): string {
    const url = this.getUrl('AUTH');
    const params = new URLSearchParams(request as any);
    return `${url}?${params.toString()}`;
  }

  /**
   * Map FPX response status code
   */
  private mapResponseStatus(code: string): FPXTransaction['status'] {
    const statusMap: Record<string, FPXTransaction['status']> = {
      '00': '00', // Successful
      '09': '09', // Pending
      '12': '12', // Invalid transaction
      '14': '14', // Invalid account
      '39': '39', // No credit account
      '45': '45', // Closed account
      '46': '46', // Inactive account
      '51': '51', // Insufficient funds
      '53': '53', // No savings account
      '54': '54', // Expired card
      '55': '55', // Invalid PIN
      '56': '56', // No card record
      '57': '57', // Transaction not permitted
      '58': '58', // Transaction not permitted to terminal
      '76': '76', // Invalid account
      '96': '96', // System malfunction
      '99': '99'  // Pending approval
    };

    return statusMap[code] || '96';
  }

  /**
   * Get status description
   */
  private getStatusDescription(code: string): string {
    const descriptions: Record<string, string> = {
      '00': 'Transaction Successful',
      '09': 'Transaction Pending',
      '12': 'Invalid Transaction',
      '14': 'Invalid Account Number',
      '39': 'No Credit Account',
      '45': 'Account Closed',
      '46': 'Account Inactive',
      '51': 'Insufficient Funds',
      '53': 'No Savings Account',
      '54': 'Expired Card',
      '55': 'Invalid PIN',
      '56': 'No Card Record',
      '57': 'Transaction Not Permitted',
      '58': 'Transaction Not Permitted to Terminal',
      '76': 'Invalid Account',
      '96': 'System Malfunction',
      '99': 'Pending Bank Approval'
    };

    return descriptions[code] || 'Unknown Error';
  }

  /**
   * Format timestamp for FPX
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day} ${hours}${minutes}${seconds}`;
  }

  /**
   * Get URL based on environment
   */
  private getUrl(type: keyof typeof FPXGateway.URLS.PRODUCTION): string {
    return FPXGateway.URLS[this.config.environment.toUpperCase() as keyof typeof FPXGateway.URLS][type];
  }

  /**
   * Get private key for checksum
   */
  private getPrivateKey(): string {
    // In production, this should be loaded from secure storage
    return process.env.FPX_PRIVATE_KEY || '';
  }

  /**
   * Get public key for verification
   */
  private getPublicKey(): string {
    // In production, this should be loaded from secure storage
    return process.env.FPX_PUBLIC_KEY || '';
  }

  /**
   * Validate amount
   */
  public validateAmount(amount: number): boolean {
    // FPX minimum is RM 1.00, maximum is RM 1,000,000.00
    return amount >= 1.00 && amount <= 1000000.00;
  }

  /**
   * Validate buyer email
   */
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize product description
   */
  public sanitizeProductDesc(desc: string): string {
    // Remove special characters that might break FPX
    return desc
      .replace(/[|&;<>]/g, '')
      .substring(0, 100); // FPX limit
  }
}