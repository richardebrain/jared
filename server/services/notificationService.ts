import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../logger";
import { storage } from "../storage";
import sgMail from "@sendgrid/mail";

// Set up SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn("SendGrid API key not set. Email notifications will not be sent.");
}

interface CredentialInfo {
  name: string;
  expirationDate: Date;
  daysUntilExpiration: number;
}

/**
 * Send notification for a credential that is about to expire
 * @param userId - User ID
 * @param credentialName - Name of the credential (e.g., "Fingerprint Card")
 * @param expirationDate - Date when the credential expires
 */
export async function sendCredentialExpirationNotification(
  userId: number,
  credentialInfo: CredentialInfo
): Promise<boolean> {
  try {
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      logger.error(`User not found for credential notification: ${userId}`);
      return false;
    }

    // If SendGrid is not configured, log the notification instead
    if (!process.env.SENDGRID_API_KEY) {
      logger.info(`[MOCK EMAIL] Credential expiration notification for ${user.email}:`);
      logger.info(`Your ${credentialInfo.name} expires in ${credentialInfo.daysUntilExpiration} days (${credentialInfo.expirationDate.toLocaleDateString()}).`);
      
      // Return true to indicate success even though no email was sent
      return true;
    }

    // Format date for display
    const formattedDate = credentialInfo.expirationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare email
    const msg = {
      to: user.email,
      from: 'notifications@mentormeapp.com', // Replace with your verified sender
      subject: `Important: Your ${credentialInfo.name} is expiring soon`,
      text: `Hello ${user.firstName},

Your ${credentialInfo.name} will expire on ${formattedDate} (in ${credentialInfo.daysUntilExpiration} days).

Please take action to renew this credential before it expires to ensure compliance with your school's requirements.

You can update your credential information in your profile settings.

Thanks,
The MentorMe Team`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a5568;">Credential Expiration Notice</h2>
        </div>
        
        <p style="margin-bottom: 20px;">Hello ${user.firstName},</p>
        
        <div style="background-color: ${credentialInfo.daysUntilExpiration <= 7 ? '#fed7d7' : '#feebc8'}; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: ${credentialInfo.daysUntilExpiration <= 7 ? '#e53e3e' : '#dd6b20'};">
            Your ${credentialInfo.name} will expire on ${formattedDate} (in ${credentialInfo.daysUntilExpiration} days).
          </p>
        </div>
        
        <p>Please take action to renew this credential before it expires to ensure compliance with your school's requirements.</p>
        
        <p>You can update your credential information in your profile settings.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1;">
          <p style="font-size: 14px; color: #718096;">Thanks,<br>The MentorMe Team</p>
        </div>
      </div>
      `,
    };

    // Send email
    await sgMail.send(msg);
    logger.info(`Sent credential expiration notification to ${user.email} for ${credentialInfo.name}`);
    
    return true;
  } catch (error) {
    logger.error("Error sending credential notification:", error);
    return false;
  }
}

/**
 * Check for credentials expiring soon and send notifications
 * @param daysThreshold - Days threshold for notification (default: 30)
 */
export async function checkAndNotifyExpiringCredentials(daysThreshold: number = 30): Promise<void> {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    const today = new Date();
    
    // Check each user for expiring credentials
    for (const user of allUsers) {
      const credentialsToCheck = [
        { 
          type: 'fingerprintExpiration', 
          name: 'Fingerprint Card', 
          date: user.fingerprintExpiration 
        },
        { 
          type: 'cprExpiration', 
          name: 'CPR Certification', 
          date: user.cprExpiration 
        },
        { 
          type: 'firstAidExpiration', 
          name: 'First Aid Certification', 
          date: user.firstAidExpiration 
        },
        { 
          type: 'foodHandlerExpiration', 
          name: 'Food Handler Card', 
          date: user.foodHandlerExpiration 
        },
      ];
      
      // Check each credential
      for (const credential of credentialsToCheck) {
        if (!credential.date) continue;
        
        const expirationDate = new Date(credential.date);
        if (expirationDate < today) continue; // Already expired
        
        // Calculate days until expiration
        const timeDiff = expirationDate.getTime() - today.getTime();
        const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // If within threshold, send notification
        if (daysUntilExpiration <= daysThreshold) {
          await sendCredentialExpirationNotification(user.id, {
            name: credential.name,
            expirationDate,
            daysUntilExpiration
          });
        }
      }
    }
    
    logger.info("Completed credential expiration check and notifications");
  } catch (error) {
    logger.error("Error in credential expiration check:", error);
  }
}