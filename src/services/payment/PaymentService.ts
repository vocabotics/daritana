// ==================== MAIN PAYMENT PROCESSING SERVICE ====================

import { 
  PaymentTransaction, 
  PaymentMethod, 
  PaymentStatus,
  PaymentPurpose,
  PaymentInvoice,
  RefundRequest,
  PaymentWebhook,
  WebhookEvent,
  FPXBank,
  CardTransaction,
  EWalletTransaction,
  JomPayBill,
  BankTransferDetails,
  PaymentSecurityConfig,
  AMLCheck,
  FraudCheck
} from '@/types/payment';
import { FPXGateway } from './fpx/FPXGateway';
import { NotificationService } from './NotificationService';
import { SecurityService } from './SecurityService';
import { ComplianceService } from './ComplianceService';

/**
 * Main payment processing service for Malaysian payment ecosystem
 */
export class PaymentService {
  private fpxGateway: FPXGateway | null = null;
  private notificationService: NotificationService;
  private securityService: SecurityService;
  private complianceService: ComplianceService;
  private webhookHandlers: Map<WebhookEvent, Function[]> = new Map();

  constructor() {
    this.notificationService = new NotificationService();
    this.securityService = new SecurityService();
    this.complianceService = new ComplianceService();
    this.initializePaymentGateways();
  }

  /**
   * Initialize payment gateways
   */
  private async initializePaymentGateways(): Promise<void> {
    // Initialize FPX Gateway
    if (process.env.FPX_MERCHANT_ID) {
      this.fpxGateway = new FPXGateway({
        merchantId: process.env.FPX_MERCHANT_ID,
        exchangeId: process.env.FPX_EXCHANGE_ID || '',
        version: '7.0',
        environment: (process.env.FPX_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
        sellerOrderNo: '',
        sellerExId: process.env.FPX_SELLER_EX_ID || '',
        sellerName: process.env.FPX_SELLER_NAME || '',
        returnUrl: process.env.FPX_RETURN_URL || '',
        callbackUrl: process.env.FPX_CALLBACK_URL || '',
        indirectUrl: process.env.FPX_INDIRECT_URL || ''
      });
    }

    // Initialize other gateways (e-wallets, cards, etc.)
    // ...
  }

  // ==================== PAYMENT CREATION ====================

  /**
   * Create a new payment transaction
   */
  public async createPayment(params: {
    amount: number;
    currency: 'MYR' | 'USD' | 'SGD';
    method: PaymentMethod;
    purpose: PaymentPurpose;
    description: string;
    userId: string;
    userType: 'client' | 'contractor' | 'supplier' | 'staff';
    projectId?: string;
    invoiceId?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentTransaction> {
    // Validate payment parameters
    this.validatePaymentParams(params);

    // Perform security checks
    const securityCheck = await this.performSecurityChecks(params);
    if (!securityCheck.passed) {
      throw new Error(`Payment blocked: ${securityCheck.reason}`);
    }

    // Create transaction record
    const transaction: PaymentTransaction = {
      id: this.generateTransactionId(),
      referenceNo: this.generateReferenceNo(),
      projectId: params.projectId,
      userId: params.userId,
      userType: params.userType,
      method: params.method,
      purpose: params.purpose,
      amount: params.amount,
      currency: params.currency,
      localAmount: await this.convertToMYR(params.amount, params.currency),
      status: 'pending',
      description: params.description,
      invoiceId: params.invoiceId,
      metadata: params.metadata,
      createdAt: new Date(),
      createdBy: params.userId,
      notificationsSent: [],
      ipAddress: this.getClientIP(),
      deviceInfo: this.getDeviceInfo()
    };

    // Calculate fees
    const fees = this.calculateFees(transaction);
    transaction.gatewayFee = fees.gateway;
    transaction.processingFee = fees.processing;
    transaction.sst = fees.sst;
    transaction.netAmount = transaction.amount - fees.total;

    // Perform AML check for large transactions
    if (transaction.localAmount >= 50000) {
      transaction.amlCheck = await this.complianceService.performAMLCheck(params.userId);
    }

    // Perform fraud check
    transaction.fraudCheck = await this.securityService.performFraudCheck(transaction);
    transaction.riskScore = transaction.fraudCheck.score;

    // Save transaction to database
    await this.saveTransaction(transaction);

    // Process payment based on method
    await this.processPaymentByMethod(transaction, params);

    return transaction;
  }

  /**
   * Process payment based on method
   */
  private async processPaymentByMethod(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    switch (transaction.method) {
      case 'fpx':
        await this.processFPXPayment(transaction, params);
        break;
      
      case 'credit_card':
      case 'debit_card':
        await this.processCardPayment(transaction, params);
        break;
      
      case 'ewallet_grab':
      case 'ewallet_tng':
      case 'ewallet_boost':
      case 'ewallet_shopee':
        await this.processEWalletPayment(transaction, params);
        break;
      
      case 'jompay':
        await this.processJomPayPayment(transaction, params);
        break;
      
      case 'bank_transfer':
      case 'duitnow':
        await this.processBankTransfer(transaction, params);
        break;
      
      default:
        throw new Error(`Unsupported payment method: ${transaction.method}`);
    }
  }

  // ==================== FPX PAYMENT PROCESSING ====================

  /**
   * Process FPX payment
   */
  private async processFPXPayment(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    if (!this.fpxGateway) {
      throw new Error('FPX gateway not initialized');
    }

    // Create FPX request
    const fpxRequest = this.fpxGateway.createPaymentRequest({
      orderNo: transaction.referenceNo,
      amount: transaction.amount,
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName,
      buyerBankId: params.buyerBankId,
      productDesc: this.fpxGateway.sanitizeProductDesc(transaction.description),
      buyerPhone: params.buyerPhone
    });

    // Store FPX request in transaction
    transaction.gatewayResponse = fpxRequest;

    // Update transaction status
    transaction.status = 'processing';
    await this.updateTransaction(transaction);

    // Generate payment URL
    const paymentUrl = this.fpxGateway.buildPaymentUrl(fpxRequest);

    // Send payment link to user
    await this.notificationService.sendPaymentLink({
      userId: transaction.userId,
      paymentUrl,
      amount: transaction.amount,
      expiryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  }

  /**
   * Handle FPX callback
   */
  public async handleFPXCallback(response: any): Promise<PaymentTransaction> {
    if (!this.fpxGateway) {
      throw new Error('FPX gateway not initialized');
    }

    // Process callback
    const fpxTransaction = this.fpxGateway.processCallback(response);

    // Find original transaction
    const transaction = await this.findTransactionByReference(fpxTransaction.fpxSellerOrderNo);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction with FPX response
    transaction.fpxTransaction = fpxTransaction;
    transaction.gatewayTransactionId = fpxTransaction.fpxTxnId;

    // Update status based on FPX response
    if (fpxTransaction.status === '00') {
      transaction.status = 'captured';
      transaction.processedAt = new Date();
      await this.onPaymentSuccess(transaction);
    } else if (fpxTransaction.status === '09' || fpxTransaction.status === '99') {
      transaction.status = 'pending';
    } else {
      transaction.status = 'failed';
      await this.onPaymentFailed(transaction);
    }

    // Update transaction
    await this.updateTransaction(transaction);

    // Trigger webhook
    await this.triggerWebhook('payment.' + transaction.status, transaction);

    return transaction;
  }

  /**
   * Get available FPX banks
   */
  public async getAvailableFPXBanks(type: 'individual' | 'corporate' = 'individual'): Promise<FPXBank[]> {
    if (!this.fpxGateway) {
      throw new Error('FPX gateway not initialized');
    }
    return this.fpxGateway.getAvailableBanks(type);
  }

  // ==================== CARD PAYMENT PROCESSING ====================

  /**
   * Process card payment
   */
  private async processCardPayment(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    // Implement card payment processing
    // This would integrate with providers like iPay88, MOLPay, Stripe, etc.
    
    const cardTransaction: CardTransaction = {
      gatewayId: 'ipay88',
      transactionId: this.generateTransactionId(),
      cardType: params.cardType,
      maskedCardNo: this.maskCardNumber(params.cardNumber),
      cardHolder: params.cardHolder,
      amount: transaction.amount,
      currency: transaction.currency,
      status: 'processing',
      threeDSStatus: '2' // 3D Secure v2
    };

    transaction.cardTransaction = cardTransaction;
    transaction.status = 'processing';
    
    await this.updateTransaction(transaction);
  }

  // ==================== E-WALLET PAYMENT PROCESSING ====================

  /**
   * Process e-wallet payment
   */
  private async processEWalletPayment(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    const providerType = transaction.method.replace('ewallet_', '') as 'grab' | 'tng' | 'boost' | 'shopee';
    
    const ewalletTransaction: EWalletTransaction = {
      providerId: this.generateTransactionId(),
      providerType,
      referenceId: transaction.referenceNo,
      amount: transaction.amount,
      currency: 'MYR',
      status: 'pending',
      expiryTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      customerPhone: params.customerPhone,
      metadata: params.metadata
    };

    // Generate QR code or deep link based on provider
    if (providerType === 'grab') {
      ewalletTransaction.deepLink = await this.generateGrabPayLink(ewalletTransaction);
    } else if (providerType === 'tng') {
      ewalletTransaction.qrCode = await this.generateTNGQRCode(ewalletTransaction);
    }
    // ... other providers

    transaction.ewalletTransaction = ewalletTransaction;
    transaction.status = 'processing';
    
    await this.updateTransaction(transaction);
  }

  // ==================== JOMPAY PAYMENT PROCESSING ====================

  /**
   * Process JomPay payment
   */
  private async processJomPayPayment(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    const jompayBill: JomPayBill = {
      ref1: transaction.referenceNo,
      ref2: params.ref2,
      amount: transaction.amount,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      description: transaction.description,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      status: 'pending'
    };

    transaction.jompayBill = jompayBill;
    transaction.status = 'pending';
    
    await this.updateTransaction(transaction);

    // Send JomPay details to customer
    await this.notificationService.sendJomPayDetails({
      userId: transaction.userId,
      billerCode: process.env.JOMPAY_BILLER_CODE || '',
      ref1: jompayBill.ref1,
      ref2: jompayBill.ref2,
      amount: jompayBill.amount,
      expiryDate: jompayBill.expiryDate
    });
  }

  // ==================== BANK TRANSFER PROCESSING ====================

  /**
   * Process bank transfer
   */
  private async processBankTransfer(
    transaction: PaymentTransaction,
    params: any
  ): Promise<void> {
    const bankTransferDetails: BankTransferDetails = {
      bankName: process.env.COMPANY_BANK_NAME || 'Maybank',
      bankCode: process.env.COMPANY_BANK_CODE || 'MBB0228',
      accountNo: process.env.COMPANY_ACCOUNT_NO || '',
      accountName: process.env.COMPANY_ACCOUNT_NAME || '',
      transferType: params.transferType || 'instant',
      referenceNo: transaction.referenceNo
    };

    if (transaction.method === 'duitnow') {
      bankTransferDetails.duitNowId = process.env.COMPANY_DUITNOW_ID || '';
      bankTransferDetails.duitNowIdType = 'business';
    }

    transaction.bankTransferDetails = bankTransferDetails;
    transaction.status = 'pending';
    
    await this.updateTransaction(transaction);

    // Send bank transfer instructions
    await this.notificationService.sendBankTransferInstructions({
      userId: transaction.userId,
      bankDetails: bankTransferDetails,
      amount: transaction.amount,
      referenceNo: transaction.referenceNo
    });
  }

  // ==================== REFUND PROCESSING ====================

  /**
   * Process refund request
   */
  public async processRefund(params: {
    transactionId: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }): Promise<RefundRequest> {
    // Find original transaction
    const transaction = await this.findTransactionById(params.transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate refund amount
    if (params.amount > transaction.amount) {
      throw new Error('Refund amount exceeds original transaction amount');
    }

    // Create refund request
    const refundRequest: RefundRequest = {
      id: this.generateTransactionId(),
      transactionId: params.transactionId,
      amount: params.amount,
      reason: 'customer_request',
      description: params.reason,
      requestedBy: params.requestedBy,
      requestedAt: new Date(),
      status: 'pending'
    };

    // Save refund request
    await this.saveRefundRequest(refundRequest);

    // Process refund based on payment method
    await this.processRefundByMethod(transaction, refundRequest);

    return refundRequest;
  }

  /**
   * Process refund based on payment method
   */
  private async processRefundByMethod(
    transaction: PaymentTransaction,
    refundRequest: RefundRequest
  ): Promise<void> {
    switch (transaction.method) {
      case 'fpx':
        // FPX refunds must be processed through bank
        await this.processBankRefund(transaction, refundRequest);
        break;
      
      case 'credit_card':
      case 'debit_card':
        await this.processCardRefund(transaction, refundRequest);
        break;
      
      case 'ewallet_grab':
      case 'ewallet_tng':
      case 'ewallet_boost':
      case 'ewallet_shopee':
        await this.processEWalletRefund(transaction, refundRequest);
        break;
      
      default:
        await this.processBankRefund(transaction, refundRequest);
    }
  }

  // ==================== WEBHOOK HANDLING ====================

  /**
   * Register webhook handler
   */
  public registerWebhookHandler(event: WebhookEvent, handler: Function): void {
    if (!this.webhookHandlers.has(event)) {
      this.webhookHandlers.set(event, []);
    }
    this.webhookHandlers.get(event)!.push(handler);
  }

  /**
   * Process incoming webhook
   */
  public async processWebhook(params: {
    provider: string;
    event: string;
    payload: any;
    signature?: string;
  }): Promise<void> {
    // Verify webhook signature
    if (params.signature) {
      const isValid = await this.verifyWebhookSignature(
        params.provider,
        params.payload,
        params.signature
      );
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Create webhook record
    const webhook: PaymentWebhook = {
      id: this.generateTransactionId(),
      provider: params.provider,
      event: params.event as WebhookEvent,
      payload: params.payload,
      signature: params.signature,
      receivedAt: new Date(),
      status: 'processing',
      attempts: 1
    };

    // Save webhook
    await this.saveWebhook(webhook);

    // Process webhook based on provider and event
    await this.processWebhookByProvider(webhook);

    // Trigger registered handlers
    await this.triggerWebhook(webhook.event, webhook.payload);

    // Update webhook status
    webhook.status = 'processed';
    webhook.processedAt = new Date();
    await this.updateWebhook(webhook);
  }

  /**
   * Trigger webhook handlers
   */
  private async triggerWebhook(event: WebhookEvent, payload: any): Promise<void> {
    const handlers = this.webhookHandlers.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`Webhook handler error for ${event}:`, error);
      }
    }
  }

  // ==================== SECURITY & VALIDATION ====================

  /**
   * Validate payment parameters
   */
  private validatePaymentParams(params: any): void {
    // Validate amount
    if (params.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Validate currency
    if (!['MYR', 'USD', 'SGD'].includes(params.currency)) {
      throw new Error('Invalid currency');
    }

    // Validate payment method
    const validMethods: PaymentMethod[] = [
      'fpx', 'fpx_b2b', 'credit_card', 'debit_card',
      'ewallet_grab', 'ewallet_tng', 'ewallet_boost', 'ewallet_shopee',
      'jompay', 'bank_transfer', 'duitnow', 'cash_deposit', 'cheque'
    ];
    if (!validMethods.includes(params.method)) {
      throw new Error('Invalid payment method');
    }
  }

  /**
   * Perform security checks
   */
  private async performSecurityChecks(params: any): Promise<{ passed: boolean; reason?: string }> {
    // Check rate limits
    const rateLimitCheck = await this.securityService.checkRateLimit(params.userId);
    if (!rateLimitCheck.passed) {
      return { passed: false, reason: 'Rate limit exceeded' };
    }

    // Check for suspicious activity
    const suspiciousCheck = await this.securityService.checkSuspiciousActivity(params);
    if (!suspiciousCheck.passed) {
      return { passed: false, reason: 'Suspicious activity detected' };
    }

    // Check IP blacklist
    const ipCheck = await this.securityService.checkIPBlacklist(this.getClientIP());
    if (!ipCheck.passed) {
      return { passed: false, reason: 'IP address blocked' };
    }

    return { passed: true };
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(
    provider: string,
    payload: any,
    signature: string
  ): Promise<boolean> {
    return this.securityService.verifyWebhookSignature(provider, payload, signature);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `TXN${timestamp}${random}`.toUpperCase();
  }

  /**
   * Generate reference number
   */
  private generateReferenceNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000);
    return `REF${year}${month}${day}${String(random).padStart(5, '0')}`;
  }

  /**
   * Calculate fees
   */
  private calculateFees(transaction: PaymentTransaction): {
    gateway: number;
    processing: number;
    sst: number;
    total: number;
  } {
    let gatewayFee = 0;
    let processingFee = 0;

    // Calculate gateway fee based on method
    switch (transaction.method) {
      case 'fpx':
        gatewayFee = transaction.amount * 0.01; // 1%
        processingFee = 1.00; // RM 1.00 fixed
        break;
      case 'credit_card':
        gatewayFee = transaction.amount * 0.025; // 2.5%
        break;
      case 'ewallet_grab':
      case 'ewallet_tng':
        gatewayFee = transaction.amount * 0.015; // 1.5%
        break;
      default:
        gatewayFee = 0;
    }

    // Calculate SST (6% on fees)
    const sst = (gatewayFee + processingFee) * 0.06;

    return {
      gateway: gatewayFee,
      processing: processingFee,
      sst,
      total: gatewayFee + processingFee + sst
    };
  }

  /**
   * Convert currency to MYR
   */
  private async convertToMYR(amount: number, currency: string): Promise<number> {
    if (currency === 'MYR') return amount;
    
    // Get exchange rate (in production, this would call an API)
    const rates: Record<string, number> = {
      'USD': 4.70,
      'SGD': 3.50
    };
    
    return amount * (rates[currency] || 1);
  }

  /**
   * Mask card number
   */
  private maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const first6 = cleaned.substring(0, 6);
    const last4 = cleaned.substring(cleaned.length - 4);
    return `${first6}******${last4}`;
  }

  /**
   * Get client IP
   */
  private getClientIP(): string {
    // In production, this would get the actual client IP
    return '127.0.0.1';
  }

  /**
   * Get device info
   */
  private getDeviceInfo(): string {
    // In production, this would get actual device info
    return 'Web Browser';
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle successful payment
   */
  private async onPaymentSuccess(transaction: PaymentTransaction): Promise<void> {
    // Send success notification
    await this.notificationService.sendPaymentSuccess({
      userId: transaction.userId,
      amount: transaction.amount,
      referenceNo: transaction.referenceNo
    });

    // Update invoice if linked
    if (transaction.invoiceId) {
      await this.updateInvoicePayment(transaction.invoiceId, transaction.amount);
    }

    // Trigger success webhook
    await this.triggerWebhook('payment.success', transaction);
  }

  /**
   * Handle failed payment
   */
  private async onPaymentFailed(transaction: PaymentTransaction): Promise<void> {
    // Send failure notification
    await this.notificationService.sendPaymentFailed({
      userId: transaction.userId,
      amount: transaction.amount,
      referenceNo: transaction.referenceNo,
      reason: transaction.fpxTransaction?.statusDescription || 'Payment failed'
    });

    // Trigger failure webhook
    await this.triggerWebhook('payment.failed', transaction);
  }

  // ==================== DATABASE OPERATIONS (MOCK) ====================

  private async saveTransaction(transaction: PaymentTransaction): Promise<void> {
    // Save to database
    console.log('Saving transaction:', transaction);
  }

  private async updateTransaction(transaction: PaymentTransaction): Promise<void> {
    // Update in database
    console.log('Updating transaction:', transaction);
  }

  private async findTransactionById(id: string): Promise<PaymentTransaction | null> {
    // Find in database
    console.log('Finding transaction by ID:', id);
    return null;
  }

  private async findTransactionByReference(reference: string): Promise<PaymentTransaction | null> {
    // Find in database
    console.log('Finding transaction by reference:', reference);
    return null;
  }

  private async saveRefundRequest(refund: RefundRequest): Promise<void> {
    // Save to database
    console.log('Saving refund request:', refund);
  }

  private async saveWebhook(webhook: PaymentWebhook): Promise<void> {
    // Save to database
    console.log('Saving webhook:', webhook);
  }

  private async updateWebhook(webhook: PaymentWebhook): Promise<void> {
    // Update in database
    console.log('Updating webhook:', webhook);
  }

  private async updateInvoicePayment(invoiceId: string, amount: number): Promise<void> {
    // Update invoice payment status
    console.log('Updating invoice payment:', invoiceId, amount);
  }

  private async generateGrabPayLink(transaction: EWalletTransaction): Promise<string> {
    // Generate GrabPay deep link
    return `grabpay://pay?amount=${transaction.amount}&ref=${transaction.referenceId}`;
  }

  private async generateTNGQRCode(transaction: EWalletTransaction): Promise<string> {
    // Generate TNG QR code
    return `tngqr://${transaction.referenceId}/${transaction.amount}`;
  }

  private async processBankRefund(transaction: PaymentTransaction, refund: RefundRequest): Promise<void> {
    // Process bank refund
    console.log('Processing bank refund:', transaction, refund);
  }

  private async processCardRefund(transaction: PaymentTransaction, refund: RefundRequest): Promise<void> {
    // Process card refund
    console.log('Processing card refund:', transaction, refund);
  }

  private async processEWalletRefund(transaction: PaymentTransaction, refund: RefundRequest): Promise<void> {
    // Process e-wallet refund
    console.log('Processing e-wallet refund:', transaction, refund);
  }

  private async processWebhookByProvider(webhook: PaymentWebhook): Promise<void> {
    // Process webhook based on provider
    console.log('Processing webhook by provider:', webhook);
  }
}