/**
 * Email Service
 * Multi-provider email system with SendGrid and AWS SES support
 */

import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  variables?: Record<string, string>;
}

class EmailService {
  private transporter: any;
  private sesClient: SESClient | null = null;
  private provider: 'sendgrid' | 'ses' | 'smtp' = 'smtp';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const awsRegion = process.env.AWS_REGION;
    const smtpHost = process.env.SMTP_HOST;

    if (sendgridKey) {
      // SendGrid configuration
      this.provider = 'sendgrid';
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: sendgridKey,
        },
      });
    } else if (awsRegion && process.env.AWS_ACCESS_KEY_ID) {
      // AWS SES configuration
      this.provider = 'ses';
      this.sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    } else if (smtpHost) {
      // SMTP fallback
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const from = options.from || process.env.FROM_EMAIL || 'noreply@daritana.com';
      const fromName = process.env.FROM_NAME || 'Daritana Platform';

      if (this.provider === 'ses' && this.sesClient) {
        return await this.sendWithSES(options, from);
      } else if (this.transporter) {
        return await this.sendWithSMTP(options, from, fromName);
      }

      console.error('No email provider configured');
      return false;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  private async sendWithSES(options: EmailOptions, from: string): Promise<boolean> {
    if (!this.sesClient) return false;

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Html: options.html ? { Data: options.html } : undefined,
          Text: options.text ? { Data: options.text } : undefined,
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
    });

    await this.sesClient.send(command);
    return true;
  }

  private async sendWithSMTP(
    options: EmailOptions,
    from: string,
    fromName: string
  ): Promise<boolean> {
    await this.transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });
    return true;
  }

  // Email templates
  async sendWelcomeEmail(to: string, name: string, verificationUrl: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Welcome to Daritana!',
      html: this.getWelcomeTemplate(name, verificationUrl),
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Reset Your Password',
      html: this.getPasswordResetTemplate(resetUrl),
    });
  }

  async sendInvitation(to: string, organizationName: string, inviteUrl: string): Promise<boolean> {
    return this.send({
      to,
      subject: `Join ${organizationName} on Daritana`,
      html: this.getInvitationTemplate(organizationName, inviteUrl),
    });
  }

  async sendNotification(to: string, title: string, message: string, actionUrl?: string): Promise<boolean> {
    return this.send({
      to,
      subject: title,
      html: this.getNotificationTemplate(title, message, actionUrl),
    });
  }

  // Template generators
  private getWelcomeTemplate(name: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to Daritana, ${name}!</h1>
          <p>Thank you for joining Daritana Architect Management Platform.</p>
          <p>To get started, please verify your email address:</p>
          <a href="${verificationUrl}"
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Reset Your Password</h1>
          <p>We received a request to reset your password.</p>
          <p>Click the button below to choose a new password:</p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getInvitationTemplate(organizationName: string, inviteUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">You've Been Invited!</h1>
          <p>You've been invited to join <strong>${organizationName}</strong> on Daritana.</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${inviteUrl}"
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getNotificationTemplate(title: string, message: string, actionUrl?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">${title}</h1>
          <p>${message}</p>
          ${actionUrl ? `
            <a href="${actionUrl}"
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
              View Details
            </a>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
