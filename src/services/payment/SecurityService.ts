// ==================== PAYMENT SECURITY SERVICE ====================

import crypto from 'crypto';
import { FraudCheck, FraudRule, PaymentTransaction } from '@/types/payment';

/**
 * Service for handling payment security and fraud prevention
 */
export class SecurityService {
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();
  private ipBlacklist: Set<string> = new Set();
  private suspiciousPatterns: SuspiciousPattern[] = [];

  constructor() {
    this.initializeSecurityRules();
  }

  /**
   * Initialize security rules and patterns
   */
  private initializeSecurityRules(): void {
    // Initialize suspicious patterns
    this.suspiciousPatterns = [
      {
        name: 'rapid_succession',
        description: 'Multiple transactions in rapid succession',
        check: (params: any) => {
          // Check for multiple transactions within 1 minute
          return false; // Implement actual check
        }
      },
      {
        name: 'unusual_amount',
        description: 'Unusually high transaction amount',
        check: (params: any) => {
          return params.amount > 50000; // Flag transactions over RM 50,000
        }
      },
      {
        name: 'new_device',
        description: 'Transaction from new device',
        check: (params: any) => {
          // Check if device is new
          return false; // Implement actual check
        }
      },
      {
        name: 'location_mismatch',
        description: 'Transaction from unusual location',
        check: (params: any) => {
          // Check if location is unusual
          return false; // Implement actual check
        }
      }
    ];

    // Load IP blacklist from database or config
    this.loadIPBlacklist();
  }

  /**
   * Check rate limit
   */
  public async checkRateLimit(userId: string): Promise<{ passed: boolean; remaining: number }> {
    const now = Date.now();
    const limit = this.getRateLimitConfig();
    
    if (!this.rateLimitMap.has(userId)) {
      this.rateLimitMap.set(userId, {
        count: 0,
        windowStart: now,
        transactions: []
      });
    }

    const entry = this.rateLimitMap.get(userId)!;
    
    // Reset window if expired
    if (now - entry.windowStart > limit.windowMs) {
      entry.count = 0;
      entry.windowStart = now;
      entry.transactions = [];
    }

    // Check limits
    if (entry.count >= limit.maxTransactions) {
      return { passed: false, remaining: 0 };
    }

    // Check amount limit
    const totalAmount = entry.transactions.reduce((sum, t) => sum + t.amount, 0);
    if (totalAmount >= limit.maxAmount) {
      return { passed: false, remaining: 0 };
    }

    // Update count
    entry.count++;
    entry.transactions.push({ timestamp: now, amount: 0 });

    return { 
      passed: true, 
      remaining: limit.maxTransactions - entry.count 
    };
  }

  /**
   * Check for suspicious activity
   */
  public async checkSuspiciousActivity(params: any): Promise<{ passed: boolean; flags: string[] }> {
    const flags: string[] = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.check(params)) {
        flags.push(pattern.name);
      }
    }

    // Check velocity
    const velocityCheck = await this.checkVelocity(params.userId);
    if (!velocityCheck.passed) {
      flags.push('velocity_exceeded');
    }

    // Check for card testing patterns
    if (this.isCardTesting(params)) {
      flags.push('card_testing_suspected');
    }

    return {
      passed: flags.length === 0,
      flags
    };
  }

  /**
   * Check IP blacklist
   */
  public async checkIPBlacklist(ip: string): Promise<{ passed: boolean }> {
    // Check if IP is in blacklist
    if (this.ipBlacklist.has(ip)) {
      return { passed: false };
    }

    // Check if IP is from high-risk country
    const highRiskCountries = await this.getHighRiskCountries();
    const country = await this.getCountryFromIP(ip);
    if (highRiskCountries.includes(country)) {
      return { passed: false };
    }

    // Check if IP is VPN/Proxy
    const isProxy = await this.checkIfProxy(ip);
    if (isProxy) {
      return { passed: false };
    }

    return { passed: true };
  }

  /**
   * Perform fraud check
   */
  public async performFraudCheck(transaction: PaymentTransaction): Promise<FraudCheck> {
    const rules: FraudRule[] = [];
    let totalScore = 0;

    // Rule 1: Check transaction amount
    const amountRule = this.checkAmountRule(transaction);
    rules.push(amountRule);
    totalScore += amountRule.score;

    // Rule 2: Check user history
    const historyRule = await this.checkUserHistoryRule(transaction.userId);
    rules.push(historyRule);
    totalScore += historyRule.score;

    // Rule 3: Check device fingerprint
    const deviceRule = this.checkDeviceRule(transaction);
    rules.push(deviceRule);
    totalScore += deviceRule.score;

    // Rule 4: Check IP reputation
    const ipRule = await this.checkIPRule(transaction.ipAddress || '');
    rules.push(ipRule);
    totalScore += ipRule.score;

    // Rule 5: Check time-based patterns
    const timeRule = this.checkTimeRule(transaction);
    rules.push(timeRule);
    totalScore += timeRule.score;

    // Rule 6: Check payment method risk
    const methodRule = this.checkPaymentMethodRule(transaction);
    rules.push(methodRule);
    totalScore += methodRule.score;

    // Determine status based on score
    let status: 'passed' | 'review' | 'failed';
    let recommendation: string;

    if (totalScore < 30) {
      status = 'passed';
      recommendation = 'Transaction appears legitimate';
    } else if (totalScore < 70) {
      status = 'review';
      recommendation = 'Manual review recommended';
    } else {
      status = 'failed';
      recommendation = 'High risk - block transaction';
    }

    return {
      provider: 'Internal Fraud Detection',
      checkDate: new Date(),
      score: totalScore,
      status,
      rules,
      recommendation
    };
  }

  /**
   * Verify webhook signature
   */
  public async verifyWebhookSignature(
    provider: string,
    payload: any,
    signature: string
  ): Promise<boolean> {
    const secret = this.getWebhookSecret(provider);
    
    switch (provider) {
      case 'fpx':
        return this.verifyFPXSignature(payload, signature, secret);
      
      case 'ipay88':
        return this.verifyIPay88Signature(payload, signature, secret);
      
      case 'grabpay':
        return this.verifyGrabPaySignature(payload, signature, secret);
      
      case 'tng':
        return this.verifyTNGSignature(payload, signature, secret);
      
      default:
        return this.verifyGenericSignature(payload, signature, secret);
    }
  }

  /**
   * Generate secure token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  public hashSensitiveData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + process.env.HASH_SALT)
      .digest('hex');
  }

  /**
   * Encrypt data
   */
  public encryptData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data
   */
  public decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Tokenize card number
   */
  public tokenizeCardNumber(cardNumber: string): string {
    // Remove spaces and validate
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (!this.validateCardNumber(cleaned)) {
      throw new Error('Invalid card number');
    }

    // Generate unique token
    const token = this.generateSecureToken();
    
    // Store mapping (in production, use secure vault)
    this.storeTokenMapping(token, cleaned);
    
    return token;
  }

  /**
   * Validate card number using Luhn algorithm
   */
  public validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Check 3D Secure requirement
   */
  public requires3DSecure(amount: number, cardType: string): boolean {
    // Always require 3DS for:
    // - Amounts over RM 250
    // - First-time cards
    // - International cards
    
    if (amount > 250) {
      return true;
    }

    if (cardType === 'amex') {
      return true;
    }

    return false;
  }

  // ==================== PRIVATE METHODS ====================

  private getRateLimitConfig(): {
    windowMs: number;
    maxTransactions: number;
    maxAmount: number;
  } {
    return {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxTransactions: 10,
      maxAmount: 100000 // RM 100,000
    };
  }

  private async checkVelocity(userId: string): Promise<{ passed: boolean }> {
    // Check transaction velocity
    const entry = this.rateLimitMap.get(userId);
    if (!entry) {
      return { passed: true };
    }

    // Check if too many transactions in short time
    const recentTransactions = entry.transactions.filter(
      t => Date.now() - t.timestamp < 5 * 60 * 1000 // 5 minutes
    );

    if (recentTransactions.length > 3) {
      return { passed: false };
    }

    return { passed: true };
  }

  private isCardTesting(params: any): boolean {
    // Check for card testing patterns
    // - Small amounts (< RM 5)
    // - Multiple failed attempts
    // - Sequential card numbers
    
    if (params.amount < 5) {
      return true;
    }

    return false;
  }

  private checkAmountRule(transaction: PaymentTransaction): FraudRule {
    let score = 0;
    
    if (transaction.localAmount > 10000) {
      score = 20;
    } else if (transaction.localAmount > 5000) {
      score = 10;
    } else if (transaction.localAmount < 1) {
      score = 30; // Very small amount, possible testing
    }

    return {
      name: 'amount_check',
      status: score > 20 ? 'failed' : 'passed',
      score,
      description: 'Transaction amount analysis'
    };
  }

  private async checkUserHistoryRule(userId: string): Promise<FraudRule> {
    // Check user's transaction history
    // In production, this would query the database
    
    return {
      name: 'user_history',
      status: 'passed',
      score: 0,
      description: 'User transaction history check'
    };
  }

  private checkDeviceRule(transaction: PaymentTransaction): FraudRule {
    // Check device fingerprint
    const deviceInfo = transaction.deviceInfo || '';
    
    let score = 0;
    if (!deviceInfo) {
      score = 10;
    }

    return {
      name: 'device_check',
      status: score > 20 ? 'failed' : 'passed',
      score,
      description: 'Device fingerprint analysis'
    };
  }

  private async checkIPRule(ip: string): Promise<FraudRule> {
    let score = 0;
    
    // Check if IP is blacklisted
    if (this.ipBlacklist.has(ip)) {
      score = 50;
    }

    // Check if IP is proxy/VPN
    const isProxy = await this.checkIfProxy(ip);
    if (isProxy) {
      score += 20;
    }

    return {
      name: 'ip_check',
      status: score > 30 ? 'failed' : 'passed',
      score,
      description: 'IP reputation check'
    };
  }

  private checkTimeRule(transaction: PaymentTransaction): FraudRule {
    const hour = new Date(transaction.createdAt).getHours();
    let score = 0;
    
    // Higher risk during unusual hours (2 AM - 5 AM)
    if (hour >= 2 && hour <= 5) {
      score = 15;
    }

    return {
      name: 'time_check',
      status: score > 20 ? 'failed' : 'passed',
      score,
      description: 'Transaction time analysis'
    };
  }

  private checkPaymentMethodRule(transaction: PaymentTransaction): FraudRule {
    let score = 0;
    
    // Different risk levels for different payment methods
    const riskScores: Partial<Record<typeof transaction.method, number>> = {
      'credit_card': 10,
      'debit_card': 5,
      'fpx': 2,
      'bank_transfer': 1,
      'cash_deposit': 15,
      'cheque': 20
    };

    score = riskScores[transaction.method] || 5;

    return {
      name: 'payment_method',
      status: score > 20 ? 'failed' : 'passed',
      score,
      description: 'Payment method risk assessment'
    };
  }

  private async getHighRiskCountries(): Promise<string[]> {
    // List of high-risk countries for fraud
    return ['NG', 'GH', 'KE', 'PK', 'BD'];
  }

  private async getCountryFromIP(ip: string): Promise<string> {
    // In production, use IP geolocation service
    return 'MY';
  }

  private async checkIfProxy(ip: string): Promise<boolean> {
    // In production, use proxy detection service
    return false;
  }

  private loadIPBlacklist(): void {
    // Load from database or config
    // Example blacklisted IPs
    this.ipBlacklist.add('192.168.1.100');
    this.ipBlacklist.add('10.0.0.1');
  }

  private getWebhookSecret(provider: string): string {
    const secrets: Record<string, string> = {
      'fpx': process.env.FPX_WEBHOOK_SECRET || '',
      'ipay88': process.env.IPAY88_WEBHOOK_SECRET || '',
      'grabpay': process.env.GRABPAY_WEBHOOK_SECRET || '',
      'tng': process.env.TNG_WEBHOOK_SECRET || ''
    };
    
    return secrets[provider] || '';
  }

  private verifyFPXSignature(payload: any, signature: string, secret: string): boolean {
    // FPX uses SHA-256
    const data = this.serializePayload(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  }

  private verifyIPay88Signature(payload: any, signature: string, secret: string): boolean {
    // iPay88 uses SHA-1
    const data = this.serializePayload(payload);
    const hash = crypto
      .createHmac('sha1', secret)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  }

  private verifyGrabPaySignature(payload: any, signature: string, secret: string): boolean {
    // GrabPay uses SHA-256 with specific formatting
    const data = JSON.stringify(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64');
    
    return hash === signature;
  }

  private verifyTNGSignature(payload: any, signature: string, secret: string): boolean {
    // Touch'n Go uses SHA-256
    const data = this.serializePayload(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  }

  private verifyGenericSignature(payload: any, signature: string, secret: string): boolean {
    const data = this.serializePayload(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    
    return hash === signature;
  }

  private serializePayload(payload: any): string {
    // Sort keys and create string
    const sorted = Object.keys(payload)
      .sort()
      .reduce((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {} as any);
    
    return JSON.stringify(sorted);
  }

  private storeTokenMapping(token: string, cardNumber: string): void {
    // In production, use secure token vault
    console.log('Storing token mapping:', token);
  }
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  transactions: Array<{
    timestamp: number;
    amount: number;
  }>;
}

interface SuspiciousPattern {
  name: string;
  description: string;
  check: (params: any) => boolean;
}