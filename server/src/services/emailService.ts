import nodemailer from 'nodemailer';
import winston from 'winston';

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Email templates
const templates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Daritana Architect Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Daritana!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Daritana Architect Management. We're excited to have you on board!</p>
        <p>Get started by exploring your dashboard and creating your first project.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Daritana Team</p>
      </div>
    `
  }),
  
  resetPassword: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password - Daritana',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Daritana Team</p>
      </div>
    `
  }),
  
  projectInvitation: (projectName: string, inviterName: string, role: string, acceptLink: string) => ({
    subject: `You've been invited to join ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Project Invitation</h1>
        <p>${inviterName} has invited you to join <strong>${projectName}</strong> as a ${role}.</p>
        <p style="text-align: center;">
          <a href="${acceptLink}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
        </p>
        <p>This invitation will expire in 7 days.</p>
        <p>Best regards,<br>The Daritana Team</p>
      </div>
    `
  }),
  
  invoiceNotification: (clientName: string, invoiceNumber: string, amount: string, dueDate: string, viewLink: string) => ({
    subject: `Invoice ${invoiceNumber} - Daritana`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Invoice ${invoiceNumber}</h1>
        <p>Dear ${clientName},</p>
        <p>A new invoice has been generated for your project:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Amount:</strong> RM ${amount}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p style="text-align: center;">
          <a href="${viewLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Invoice</a>
        </p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>The Daritana Team</p>
      </div>
    `
  }),
  
  taskAssignment: (assigneeName: string, taskTitle: string, projectName: string, dueDate: string | null, viewLink: string) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Task Assignment</h1>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned a new task:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Task:</strong> ${taskTitle}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
        </div>
        <p style="text-align: center;">
          <a href="${viewLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Task</a>
        </p>
        <p>Best regards,<br>The Daritana Team</p>
      </div>
    `
  })
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

// Send email function
export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@daritana.com',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info('Email sent successfully', { messageId: info.messageId, to });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to, subject });
    return false;
  }
};

// Template-based email functions
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const { subject, html } = templates.welcome(name);
  return sendEmail(email, subject, html);
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const { subject, html } = templates.resetPassword(name, resetLink);
  return sendEmail(email, subject, html);
};

export const sendProjectInvitationEmail = async (
  email: string,
  projectName: string,
  inviterName: string,
  role: string,
  invitationToken: string
): Promise<boolean> => {
  const acceptLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;
  const { subject, html } = templates.projectInvitation(projectName, inviterName, role, acceptLink);
  return sendEmail(email, subject, html);
};

export const sendInvoiceEmail = async (
  email: string,
  clientName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  invoiceId: string
): Promise<boolean> => {
  const viewLink = `${process.env.FRONTEND_URL}/invoices/${invoiceId}`;
  const { subject, html } = templates.invoiceNotification(clientName, invoiceNumber, amount, dueDate, viewLink);
  return sendEmail(email, subject, html);
};

export const sendTaskAssignmentEmail = async (
  email: string,
  assigneeName: string,
  taskTitle: string,
  projectName: string,
  dueDate: string | null,
  taskId: string
): Promise<boolean> => {
  const viewLink = `${process.env.FRONTEND_URL}/tasks/${taskId}`;
  const { subject, html } = templates.taskAssignment(assigneeName, taskTitle, projectName, dueDate, viewLink);
  return sendEmail(email, subject, html);
};

// Batch email sending
export const sendBatchEmails = async (
  recipients: Array<{
    email: string;
    subject: string;
    html: string;
  }>
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const success = await sendEmail(recipient.email, recipient.subject, recipient.html);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
};

// Verify email configuration
export const verifyEmailConfiguration = async (): Promise<boolean> => {
  try {
    await getTransporter().verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', { error });
    return false;
  }
};