// ==================== PAYMENT NOTIFICATION SERVICE ====================

import { NotificationRecord } from '@/types/payment';

/**
 * Service for handling payment-related notifications
 */
export class NotificationService {
  
  /**
   * Send payment link to user
   */
  public async sendPaymentLink(params: {
    userId: string;
    paymentUrl: string;
    amount: number;
    expiryTime: Date;
  }): Promise<void> {
    const message = `
      Please complete your payment of RM ${params.amount.toFixed(2)}.
      
      Click here to pay: ${params.paymentUrl}
      
      This link will expire at ${params.expiryTime.toLocaleString('en-MY')}.
      
      If you have any questions, please contact our support team.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'Payment Required - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });

    // Also send WhatsApp if enabled
    await this.sendWhatsAppNotification({
      recipient: params.userId,
      message: `Payment link for RM ${params.amount.toFixed(2)}: ${params.paymentUrl}`
    });
  }

  /**
   * Send JomPay payment details
   */
  public async sendJomPayDetails(params: {
    userId: string;
    billerCode: string;
    ref1: string;
    ref2?: string;
    amount: number;
    expiryDate: Date;
  }): Promise<void> {
    const message = `
      JomPay Payment Details
      ----------------------
      Amount: RM ${params.amount.toFixed(2)}
      Biller Code: ${params.billerCode}
      Reference 1: ${params.ref1}
      ${params.ref2 ? `Reference 2: ${params.ref2}` : ''}
      
      Payment Due: ${params.expiryDate.toLocaleString('en-MY')}
      
      How to pay:
      1. Login to your online banking
      2. Select JomPay
      3. Enter the Biller Code and Reference numbers
      4. Confirm the amount and complete payment
      
      You will receive a confirmation once payment is received.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'JomPay Payment Instructions - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send bank transfer instructions
   */
  public async sendBankTransferInstructions(params: {
    userId: string;
    bankDetails: {
      bankName: string;
      accountNo: string;
      accountName: string;
      duitNowId?: string;
    };
    amount: number;
    referenceNo: string;
  }): Promise<void> {
    let message = `
      Bank Transfer Instructions
      --------------------------
      Amount: RM ${params.amount.toFixed(2)}
      Reference No: ${params.referenceNo}
      
      Bank Details:
      Bank: ${params.bankDetails.bankName}
      Account Name: ${params.bankDetails.accountName}
      Account No: ${params.bankDetails.accountNo}
    `;

    if (params.bankDetails.duitNowId) {
      message += `
      
      DuitNow ID: ${params.bankDetails.duitNowId}
      
      For instant transfer, you can use DuitNow with the ID above.
      `;
    }

    message += `
      
      IMPORTANT: Please include the reference number in your transfer description.
      
      Send proof of payment to support@daritana.com or WhatsApp to 012-3456789.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'Bank Transfer Instructions - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send payment success notification
   */
  public async sendPaymentSuccess(params: {
    userId: string;
    amount: number;
    referenceNo: string;
  }): Promise<void> {
    const message = `
      Payment Successful!
      -------------------
      
      Your payment of RM ${params.amount.toFixed(2)} has been received.
      
      Reference No: ${params.referenceNo}
      Date: ${new Date().toLocaleString('en-MY')}
      
      Thank you for your payment. You can download your receipt from your dashboard.
      
      If you have any questions, please contact our support team.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'Payment Received - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });

    // Send WhatsApp confirmation
    await this.sendWhatsAppNotification({
      recipient: params.userId,
      message: `✅ Payment of RM ${params.amount.toFixed(2)} received. Ref: ${params.referenceNo}`
    });
  }

  /**
   * Send payment failed notification
   */
  public async sendPaymentFailed(params: {
    userId: string;
    amount: number;
    referenceNo: string;
    reason: string;
  }): Promise<void> {
    const message = `
      Payment Failed
      --------------
      
      Your payment of RM ${params.amount.toFixed(2)} could not be processed.
      
      Reference No: ${params.referenceNo}
      Reason: ${params.reason}
      
      Please try again or use an alternative payment method.
      
      If you continue to experience issues, please contact our support team:
      - Email: support@daritana.com
      - WhatsApp: 012-3456789
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'Payment Failed - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send payment reminder
   */
  public async sendPaymentReminder(params: {
    userId: string;
    amount: number;
    dueDate: Date;
    invoiceNo: string;
    reminderType: 'first' | 'second' | 'final' | 'overdue';
  }): Promise<void> {
    const reminderMessages = {
      first: 'This is a friendly reminder',
      second: 'Second reminder',
      final: 'FINAL NOTICE',
      overdue: 'OVERDUE NOTICE'
    };

    const urgencyMessages = {
      first: 'at your earliest convenience',
      second: 'as soon as possible',
      final: 'immediately to avoid service disruption',
      overdue: 'immediately to avoid late fees and service suspension'
    };

    const message = `
      ${reminderMessages[params.reminderType]}: Payment Due
      
      Invoice No: ${params.invoiceNo}
      Amount Due: RM ${params.amount.toFixed(2)}
      Due Date: ${params.dueDate.toLocaleDateString('en-MY')}
      
      Please make payment ${urgencyMessages[params.reminderType]}.
      
      Payment Options:
      - Online Banking (FPX)
      - Credit/Debit Card
      - E-Wallets (GrabPay, Touch'n Go, Boost)
      - JomPay
      - Bank Transfer
      
      Login to your dashboard to make payment: https://daritana.com/payments
      
      If you have already made payment, please disregard this notice.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: `${reminderMessages[params.reminderType]} - Payment Due - Daritana Architect`,
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send refund notification
   */
  public async sendRefundNotification(params: {
    userId: string;
    amount: number;
    originalTransactionRef: string;
    refundRef: string;
    status: 'initiated' | 'processing' | 'completed' | 'failed';
  }): Promise<void> {
    const statusMessages = {
      initiated: 'has been initiated',
      processing: 'is being processed',
      completed: 'has been completed',
      failed: 'could not be processed'
    };

    const message = `
      Refund ${statusMessages[params.status]}
      
      Refund Amount: RM ${params.amount.toFixed(2)}
      Original Transaction: ${params.originalTransactionRef}
      Refund Reference: ${params.refundRef}
      
      ${params.status === 'completed' 
        ? 'The refund will be credited to your original payment method within 5-7 business days.'
        : params.status === 'failed'
        ? 'Please contact our support team for assistance.'
        : 'You will receive another notification once the refund is completed.'}
      
      For any questions, please contact:
      - Email: support@daritana.com
      - WhatsApp: 012-3456789
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: `Refund ${statusMessages[params.status]} - Daritana Architect`,
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send invoice
   */
  public async sendInvoice(params: {
    userId: string;
    invoiceNo: string;
    amount: number;
    dueDate: Date;
    pdfUrl: string;
  }): Promise<void> {
    const message = `
      Invoice ${params.invoiceNo}
      
      Total Amount: RM ${params.amount.toFixed(2)}
      Due Date: ${params.dueDate.toLocaleDateString('en-MY')}
      
      Please find your invoice attached or download it from: ${params.pdfUrl}
      
      Payment Options:
      - Online Banking (FPX)
      - Credit/Debit Card
      - E-Wallets
      - JomPay
      - Bank Transfer
      
      To make payment online, login to your dashboard: https://daritana.com/payments
      
      Thank you for your business!
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: `Invoice ${params.invoiceNo} - Daritana Architect`,
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send receipt
   */
  public async sendReceipt(params: {
    userId: string;
    receiptNo: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    pdfUrl: string;
  }): Promise<void> {
    const message = `
      Payment Receipt
      ---------------
      
      Receipt No: ${params.receiptNo}
      Amount Paid: RM ${params.amount.toFixed(2)}
      Payment Date: ${params.paymentDate.toLocaleString('en-MY')}
      Payment Method: ${params.paymentMethod}
      
      Your receipt is attached or can be downloaded from: ${params.pdfUrl}
      
      Thank you for your payment!
      
      This is an auto-generated receipt. No signature is required.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: `Receipt ${params.receiptNo} - Daritana Architect`,
      message,
      sentAt: new Date(),
      status: 'sent'
    });
  }

  /**
   * Send fraud alert
   */
  public async sendFraudAlert(params: {
    userId: string;
    transactionRef: string;
    reason: string;
  }): Promise<void> {
    const message = `
      SECURITY ALERT: Suspicious Activity Detected
      
      We detected unusual activity on your account related to transaction ${params.transactionRef}.
      
      Reason: ${params.reason}
      
      If you did not initiate this transaction, please contact us immediately:
      - Emergency Hotline: 03-12345678
      - Email: security@daritana.com
      
      Your account has been temporarily secured. You may need to verify your identity to continue.
      
      If this was you, you can verify the transaction in your dashboard.
    `;

    await this.sendNotification({
      type: 'email',
      recipient: params.userId,
      subject: 'URGENT: Security Alert - Daritana Architect',
      message,
      sentAt: new Date(),
      status: 'sent'
    });

    // Also send SMS for urgent alerts
    await this.sendSMSNotification({
      recipient: params.userId,
      message: `SECURITY ALERT: Suspicious transaction detected. Ref: ${params.transactionRef}. Call 03-12345678 if not you.`
    });
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(params: {
    recipient: string;
    message: string;
  }): Promise<void> {
    // Integrate with WhatsApp Business API
    console.log('Sending WhatsApp:', params);
    
    // Example using WhatsApp Business API
    try {
      const response = await fetch('https://api.whatsapp.com/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: params.recipient,
          type: 'text',
          text: {
            body: params.message
          }
        })
      });
      
      if (!response.ok) {
        console.error('WhatsApp send failed:', await response.text());
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(params: {
    recipient: string;
    message: string;
  }): Promise<void> {
    // Integrate with SMS gateway (e.g., Twilio, Nexmo)
    console.log('Sending SMS:', params);
    
    // Example using a Malaysian SMS gateway
    try {
      const response = await fetch('https://api.smsgateway.my/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SMS_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: params.recipient,
          message: params.message
        })
      });
      
      if (!response.ok) {
        console.error('SMS send failed:', await response.text());
      }
    } catch (error) {
      console.error('SMS send error:', error);
    }
  }

  /**
   * Send notification (generic)
   */
  private async sendNotification(notification: NotificationRecord): Promise<void> {
    // In production, this would send actual notifications
    console.log('Sending notification:', notification);
    
    // Store notification record
    await this.storeNotificationRecord(notification);
  }

  /**
   * Store notification record
   */
  private async storeNotificationRecord(notification: NotificationRecord): Promise<void> {
    // Store in database
    console.log('Storing notification record:', notification);
  }
}