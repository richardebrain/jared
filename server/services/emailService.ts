import sgMail from "@sendgrid/mail";
import { logger } from "../logger";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.info("SendGrid email service initialized");
} else {
  logger.warn("SENDGRID_API_KEY not found. Email service will run in test mode.");
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core email sending function
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // If SendGrid is not configured, log the email and return success
    if (!process.env.SENDGRID_API_KEY) {
      logger.info("[EMAIL TEST MODE] Would send email:");
      logger.info(`To: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info(`From: ${options.from || "noreply@mentorme.app"}`);
      if (options.text) logger.info(`Text: ${options.text.substring(0, 100)}...`);
      return true;
    }
    const msg: sgMail.MailDataRequired = {
      to: options.to,
      from: options.from || "jared@mentormeprek.com",
      subject: options.subject,
      text: options.text,
      html: options.html,
      // replyTo: options.replyTo,
      // attachments: options.attachments,
    };

    const res = await sgMail.send(msg);
    console.log(res,'res -->')
    logger.info(`Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    return true;

  } catch (error) {
    logger.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, firstName: string, schoolName: string): Promise<boolean> {
  const template = createWelcomeEmailTemplate(firstName, schoolName);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send teacher invitation email
 */
export async function sendTeacherInvitation(
  email: string,
  schoolName: string,
  inviteUrl: string,
  inviterName?: string
): Promise<boolean> {
  const template = createInvitationEmailTemplate(schoolName, inviteUrl, inviterName);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send credential expiration notification
 */
export async function sendCredentialExpirationEmail(
  email: string,
  firstName: string,
  credentialName: string,
  expirationDate: Date,
  daysUntilExpiration: number
): Promise<boolean> {
  const template = createCredentialExpirationTemplate(
    firstName,
    credentialName,
    expirationDate,
    daysUntilExpiration
  );
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
): Promise<boolean> {
  const template = createPasswordResetTemplate(firstName, resetUrl);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send module completion certificate
 */
export async function sendModuleCompletionEmail(
  email: string,
  firstName: string,
  moduleName: string,
  pointsEarned: number,
  certificateUrl?: string
): Promise<boolean> {
  const template = createModuleCompletionTemplate(firstName, moduleName, pointsEarned, certificateUrl);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send bulk email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [], failed: [] };
  
  for (const email of recipients) {
    const success = await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });
    
    if (success) {
      results.success.push(email);
    } else {
      results.failed.push(email);
    }
  }
  
  logger.info(`Bulk email complete: ${results.success.length} sent, ${results.failed.length} failed`);
  return results;
}

// Email Template Functions

function createWelcomeEmailTemplate(firstName: string, schoolName: string): EmailTemplate {
  const subject = `Welcome to ${schoolName}'s Professional Development Platform!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to MentorMe!</h1>
        <p style="font-size: 18px; color: #34495e; margin-bottom: 25px;">
          Hi ${firstName},
        </p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
          Welcome to ${schoolName}'s professional development platform! We're excited to support your growth as an early childhood educator.
        </p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
          Your learning journey starts now. Explore interactive modules, earn points, and unlock achievements as you advance your skills.
        </p>
        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="font-size: 14px; color: #2c3e50; margin: 0;">
            💡 <strong>Tip:</strong> Complete your profile and start with the CORE Values module to begin earning points!
          </p>
        </div>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
          Happy learning!<br>
          The MentorMe Team
        </p>
      </div>
    </div>
  `;
  
  const text = `Welcome to ${schoolName}'s Professional Development Platform!
  
Hi ${firstName},

Welcome to ${schoolName}'s professional development platform! We're excited to support your growth as an early childhood educator.

Your learning journey starts now. Explore interactive modules, earn points, and unlock achievements as you advance your skills.

Tip: Complete your profile and start with the CORE Values module to begin earning points!

Happy learning!
The MentorMe Team`;

  return { subject, html, text };
}

function createInvitationEmailTemplate(schoolName: string, inviteUrl: string, inviterName?: string): EmailTemplate {
  const subject = `Join ${schoolName} on MentorMe - Professional Development Platform`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">You're Invited!</h1>
        <p style="font-size: 18px; color: #34495e; margin-bottom: 25px;">
          ${inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join'} ${schoolName} on MentorMe.
        </p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
          MentorMe is a professional development platform designed specifically for early childhood educators. Join your team and start your learning journey today!
        </p>
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color: #3498db; word-break: break-all;">${inviteUrl}</a>
        </p>
      </div>
    </div>
  `;
  
  const text = `You're Invited to Join ${schoolName} on MentorMe!

${inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join'} ${schoolName} on MentorMe.

MentorMe is a professional development platform designed specifically for early childhood educators. Join your team and start your learning journey today!

Accept your invitation by visiting: ${inviteUrl}`;

  return { subject, html, text };
}

function createCredentialExpirationTemplate(
  firstName: string,
  credentialName: string,
  expirationDate: Date,
  daysUntilExpiration: number
): EmailTemplate {
  const subject = `${credentialName} Expiring Soon - Action Required`;
  const formattedDate = expirationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 30px; border-radius: 10px;">
        <h1 style="color: #856404; margin-bottom: 20px;">⚠️ Credential Expiration Notice</h1>
        <p style="font-size: 18px; color: #856404; margin-bottom: 25px;">
          Hi ${firstName},
        </p>
        <p style="font-size: 16px; color: #856404; line-height: 1.6; margin-bottom: 25px;">
          Your <strong>${credentialName}</strong> expires in <strong>${daysUntilExpiration} days</strong> on ${formattedDate}.
        </p>
        <p style="font-size: 16px; color: #856404; line-height: 1.6; margin-bottom: 25px;">
          Please renew this credential before it expires to maintain your teaching eligibility and compliance with regulations.
        </p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="font-size: 14px; color: #495057; margin: 0;">
            📅 <strong>Expiration Date:</strong> ${formattedDate}<br>
            ⏰ <strong>Days Remaining:</strong> ${daysUntilExpiration}
          </p>
        </div>
        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
          Contact your administrator if you need assistance with renewal.<br>
          The MentorMe Team
        </p>
      </div>
    </div>
  `;
  
  const text = `Credential Expiration Notice

Hi ${firstName},

Your ${credentialName} expires in ${daysUntilExpiration} days on ${formattedDate}.

Please renew this credential before it expires to maintain your teaching eligibility and compliance with regulations.

Expiration Date: ${formattedDate}
Days Remaining: ${daysUntilExpiration}

Contact your administrator if you need assistance with renewal.
The MentorMe Team`;

  return { subject, html, text };
}

function createPasswordResetTemplate(firstName: string, resetUrl: string): EmailTemplate {
  const subject = "Reset Your MentorMe Password";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h1>
        <p style="font-size: 18px; color: #34495e; margin-bottom: 25px;">
          Hi ${firstName},
        </p>
        <p style="font-size: 16px; color: #34495e; line-height: 1.6; margin-bottom: 25px;">
          We received a request to reset your MentorMe password. Click the button below to create a new password.
        </p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
          This link will expire in 1 hour for security reasons.<br><br>
          If you didn't request this reset, please ignore this email.<br><br>
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </div>
  `;
  
  const text = `Password Reset Request

Hi ${firstName},

We received a request to reset your MentorMe password. Visit the following link to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.`;

  return { subject, html, text };
}

function createModuleCompletionTemplate(
  firstName: string,
  moduleName: string,
  pointsEarned: number,
  certificateUrl?: string
): EmailTemplate {
  const subject = `🎉 Congratulations! You completed "${moduleName}"`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #155724; margin-bottom: 20px;">🎉 Module Completed!</h1>
        <p style="font-size: 18px; color: #155724; margin-bottom: 25px;">
          Congratulations, ${firstName}!
        </p>
        <p style="font-size: 16px; color: #155724; line-height: 1.6; margin-bottom: 25px;">
          You have successfully completed <strong>"${moduleName}"</strong> and earned <strong>${pointsEarned} points</strong>!
        </p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="font-size: 14px; color: #495057; margin: 0;">
            🏆 <strong>Points Earned:</strong> ${pointsEarned}<br>
            📚 <strong>Module:</strong> ${moduleName}
          </p>
        </div>
        ${certificateUrl ? `
        <div style="margin: 30px 0;">
          <a href="${certificateUrl}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Download Certificate
          </a>
        </div>
        ` : ''}
        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
          Keep up the great work! Continue exploring more modules to advance your skills.<br>
          The MentorMe Team
        </p>
      </div>
    </div>
  `;
  
  const text = `Module Completed!

Congratulations, ${firstName}!

You have successfully completed "${moduleName}" and earned ${pointsEarned} points!

Points Earned: ${pointsEarned}
Module: ${moduleName}

${certificateUrl ? `Download your certificate: ${certificateUrl}` : ''}

Keep up the great work! Continue exploring more modules to advance your skills.
The MentorMe Team`;

  return { subject, html, text };
}