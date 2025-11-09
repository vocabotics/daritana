import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// SendGrid setup
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your_sendgrid_api_key_here') {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// SMTP fallback setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@daritana.com';
const FROM_NAME = process.env.FROM_NAME || 'Daritana Platform';
const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:5174';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SendGrid or SMTP fallback
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try SendGrid first if configured
    if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your_sendgrid_api_key_here') {
      const msg = {
        to: options.to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to ${options.to}`);
      return true;
    }

    // Fallback to SMTP
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent via SMTP to ${options.to}:`, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `${PLATFORM_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Daritana!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for joining Daritana - Malaysia's leading architecture and project management platform.</p>
          <p>Please verify your email address to activate your account and start collaborating with your team.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create a Daritana account, you can safely ignore this email.</p>
          <p>Best regards,<br>The Daritana Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Daritana Architecture Management. All rights reserved.</p>
          <p>Kuala Lumpur, Malaysia</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Daritana!

    Hi ${name},

    Thank you for joining Daritana. Please verify your email address by clicking the link below:

    ${verificationUrl}

    This link will expire in 24 hours.

    Best regards,
    The Daritana Team
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your Daritana account',
    html,
    text,
  });
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  invitationToken: string,
  role: string
): Promise<boolean> {
  const invitationUrl = `${PLATFORM_URL}/accept-invitation?token=${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: #f7f7f7; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've been invited!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Daritana.</p>

          <div class="info-box">
            <p><strong>Organization:</strong> ${organizationName}</p>
            <p><strong>Your Role:</strong> ${role}</p>
            <p><strong>Invited by:</strong> ${inviterName}</p>
          </div>

          <p>Daritana is Malaysia's leading architecture and project management platform, helping teams collaborate on projects, manage clients, and streamline workflows.</p>

          <p style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </p>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${invitationUrl}</p>

          <p>This invitation will expire in 7 days.</p>

          <p>If you don't want to join this organization, you can safely ignore this email.</p>

          <p>Best regards,<br>The Daritana Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Daritana Architecture Management. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    You've been invited to Daritana!

    ${inviterName} has invited you to join ${organizationName} on Daritana.

    Organization: ${organizationName}
    Your Role: ${role}

    Accept the invitation by clicking: ${invitationUrl}

    This invitation expires in 7 days.

    Best regards,
    The Daritana Team
  `;

  return sendEmail({
    to: email,
    subject: `You've been invited to join ${organizationName} on Daritana`,
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${PLATFORM_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your Daritana password.</p>
          <p>Click the button below to choose a new password:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>

          <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
            </ul>
          </div>

          <p>For security reasons, we recommend:</p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication</li>
            <li>Not sharing your password with anyone</li>
          </ul>

          <p>If you need help, contact our support team.</p>

          <p>Best regards,<br>The Daritana Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Daritana Architecture Management. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request

    Hi ${name},

    We received a request to reset your Daritana password.

    Reset your password by clicking: ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request a password reset, please ignore this email.

    Best regards,
    The Daritana Team
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your Daritana password',
    html,
    text,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  email: string,
  name: string,
  notification: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${notification.title}</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>${notification.message}</p>
          ${
            notification.actionUrl && notification.actionText
              ? `
          <p style="text-align: center;">
            <a href="${notification.actionUrl}" class="button">${notification.actionText}</a>
          </p>
          `
              : ''
          }
          <p>Best regards,<br>The Daritana Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Daritana Architecture Management. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${notification.title}

    Hi ${name},

    ${notification.message}

    ${notification.actionUrl ? `View details: ${notification.actionUrl}` : ''}

    Best regards,
    The Daritana Team
  `;

  return sendEmail({
    to: email,
    subject: notification.title,
    html,
    text,
  });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
