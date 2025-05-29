import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendTeacherInvitation, 
  sendCredentialExpirationEmail,
  sendPasswordResetEmail,
  sendModuleCompletionEmail,
  sendBulkEmail,
  EmailOptions 
} from "../services/emailService";
import { logger } from "../logger";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Validation middleware
const emailValidation = [
  body('to').isEmail().withMessage('Valid email address is required'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('html').optional().trim(),
  body('text').optional().trim(),
];

const bulkEmailValidation = [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('recipients.*').isEmail().withMessage('All recipients must be valid email addresses'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('htmlContent').trim().isLength({ min: 1 }).withMessage('HTML content is required'),
  body('textContent').optional().trim(),
];

const welcomeEmailValidation = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('schoolName').trim().isLength({ min: 1 }).withMessage('School name is required'),
];

const invitationEmailValidation = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('schoolName').trim().isLength({ min: 1 }).withMessage('School name is required'),
  body('inviteUrl').isURL().withMessage('Valid invite URL is required'),
  body('inviterName').optional().trim(),
];

const credentialEmailValidation = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('credentialName').trim().isLength({ min: 1 }).withMessage('Credential name is required'),
  body('expirationDate').isISO8601().withMessage('Valid expiration date is required'),
  body('daysUntilExpiration').isInt({ min: 0 }).withMessage('Days until expiration must be a positive integer'),
];

const passwordResetEmailValidation = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('resetUrl').isURL().withMessage('Valid reset URL is required'),
];

const moduleCompletionEmailValidation = [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('moduleName').trim().isLength({ min: 1 }).withMessage('Module name is required'),
  body('pointsEarned').isInt({ min: 0 }).withMessage('Points earned must be a positive integer'),
  body('certificateUrl').optional().isURL().withMessage('Certificate URL must be valid if provided'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: errors.array() 
    });
  }
  return null;
};

/**
 * POST /api/email/send
 * Send a custom email
 */
router.post('/send', requireAuth, emailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { to, subject, html, text, from, replyTo, attachments }: EmailOptions = req.body;
    
    const success = await sendEmail({
      to,
      subject,
      html,
      text,
      from,
      replyTo,
      attachments
    });

    if (success) {
      res.json({ 
        success: true, 
        message: "Email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send email" 
      });
    }
  } catch (error) {
    logger.error("Email send error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/welcome
 * Send welcome email to new user
 */
router.post('/welcome', requireAuth, welcomeEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, firstName, schoolName } = req.body;
    
    const success = await sendWelcomeEmail(email, firstName, schoolName);

    if (success) {
      res.json({ 
        success: true, 
        message: "Welcome email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send welcome email" 
      });
    }
  } catch (error) {
    logger.error("Welcome email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/invitation
 * Send teacher invitation email
 */
router.post('/invitation', requireAuth, invitationEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, schoolName, inviteUrl, inviterName } = req.body;
    
    const success = await sendTeacherInvitation(email, schoolName, inviteUrl, inviterName);

    if (success) {
      res.json({ 
        success: true, 
        message: "Invitation email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send invitation email" 
      });
    }
  } catch (error) {
    logger.error("Invitation email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/credential-expiration
 * Send credential expiration notification
 */
router.post('/credential-expiration', requireAuth, credentialEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, firstName, credentialName, expirationDate, daysUntilExpiration } = req.body;
    
    const success = await sendCredentialExpirationEmail(
      email, 
      firstName, 
      credentialName, 
      new Date(expirationDate), 
      daysUntilExpiration
    );

    if (success) {
      res.json({ 
        success: true, 
        message: "Credential expiration email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send credential expiration email" 
      });
    }
  } catch (error) {
    logger.error("Credential expiration email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/password-reset
 * Send password reset email
 */
router.post('/password-reset', passwordResetEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, firstName, resetUrl } = req.body;
    
    const success = await sendPasswordResetEmail(email, firstName, resetUrl);

    if (success) {
      res.json({ 
        success: true, 
        message: "Password reset email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send password reset email" 
      });
    }
  } catch (error) {
    logger.error("Password reset email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/module-completion
 * Send module completion email
 */
router.post('/module-completion', requireAuth, moduleCompletionEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, firstName, moduleName, pointsEarned, certificateUrl } = req.body;
    
    const success = await sendModuleCompletionEmail(
      email, 
      firstName, 
      moduleName, 
      pointsEarned, 
      certificateUrl
    );

    if (success) {
      res.json({ 
        success: true, 
        message: "Module completion email sent successfully" 
      });
    } else {
      res.status(500).json({ 
        error: "Failed to send module completion email" 
      });
    }
  } catch (error) {
    logger.error("Module completion email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * POST /api/email/bulk
 * Send bulk email to multiple recipients
 */
router.post('/bulk', requireAuth, bulkEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { recipients, subject, htmlContent, textContent } = req.body;
    
    const results = await sendBulkEmail(recipients, subject, htmlContent, textContent);

    res.json({ 
      success: true, 
      message: "Bulk email process completed",
      results: {
        totalSent: results.success.length,
        totalFailed: results.failed.length,
        successfulRecipients: results.success,
        failedRecipients: results.failed
      }
    });
  } catch (error) {
    logger.error("Bulk email error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

/**
 * GET /api/email/status
 * Check email service status
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const isConfigured = !!process.env.SENDGRID_API_KEY;
    
    res.json({
      emailServiceConfigured: isConfigured,
      provider: "SendGrid",
      testMode: !isConfigured
    });
  } catch (error) {
    logger.error("Email status check error:", error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

export default router;