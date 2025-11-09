/**
 * SMS Service
 * Multi-provider SMS with Twilio support
 */

import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

class SMSService {
  private client: any;
  private fromNumber: string;
  private enabled: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.enabled = !!accountSid && !!authToken;

    if (this.enabled) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async send(options: SMSOptions): Promise<boolean> {
    if (!this.enabled) {
      console.warn('SMS service not configured');
      return false;
    }

    try {
      await this.client.messages.create({
        body: options.message,
        from: options.from || this.fromNumber,
        to: options.to,
      });
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  // SMS templates
  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    return this.send({
      to,
      message: `Your Daritana verification code is: ${code}. Valid for 10 minutes.`,
    });
  }

  async send2FACode(to: string, code: string): Promise<boolean> {
    return this.send({
      to,
      message: `Your Daritana 2FA code is: ${code}. Do not share this code.`,
    });
  }

  async sendPasswordResetCode(to: string, code: string): Promise<boolean> {
    return this.send({
      to,
      message: `Your password reset code is: ${code}. Valid for 15 minutes.`,
    });
  }

  async sendProjectNotification(to: string, projectName: string, message: string): Promise<boolean> {
    return this.send({
      to,
      message: `[${projectName}] ${message}`,
    });
  }
}

export const smsService = new SMSService();
export default smsService;
