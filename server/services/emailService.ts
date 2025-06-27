import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email send');
    return;
  }

  const msg = {
    to: email,
    from: 'support@mentorme-ece.com', // This should be verified in SendGrid
    templateId: 'd-your-template-id', // You'll need to create this template in SendGrid
    dynamicTemplateData: {
      firstName,
      resetCode: resetToken,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Simple fallback email without template
export async function sendSimplePasswordResetEmail(email: string, firstName: string, resetToken: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email send');
    return;
  }

  const msg = {
    to: email,
    from: 'support@mentorme-ece.com',
    subject: 'Password Reset Request - MentorMe ECE',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested a password reset for your MentorMe ECE account. Use the code below to reset your password:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1f2937; font-size: 24px; letter-spacing: 2px; margin: 0;">${resetToken}</h3>
        </div>
        <p>This code will expire in 30 minutes for security purposes.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          MentorMe ECE Platform<br>
          Professional Development for Early Childhood Educators
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Simple password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending simple password reset email:', error);
    throw error;
  }
}

export async function sendAdminPasswordResetEmail(email: string, firstName: string, newPassword: string) {
  if (!sgMail) {
    throw new Error('SendGrid email service not configured');
  }

  const msg = {
    to: email,
    from: 'support@mentorme-ece.com',
    subject: 'Password Reset - MentorMe ECE',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset Complete</h2>
        <p>Hi ${firstName},</p>
        <p>Your password has been reset by an administrator. Here is your new temporary password:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1f2937; font-size: 24px; letter-spacing: 2px; margin: 0; font-family: monospace;">${newPassword}</h3>
        </div>
        <p><strong>Important:</strong> Please log in with this password and change it to something you'll remember in your account settings.</p>
        <p>For security reasons, we recommend changing this password immediately after logging in.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          MentorMe ECE Platform<br>
          Professional Development for Early Childhood Educators
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending admin password reset email:', error);
    throw error;
  }
}