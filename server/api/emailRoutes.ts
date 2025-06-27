import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { 
  sendSimplePasswordResetEmail
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
  body('resetCode').trim().isLength({ min: 1 }).withMessage('Reset code is required'),
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
 * POST /api/email/password-reset
 * Send password reset email
 */
router.post('/password-reset', passwordResetEmailValidation, async (req: Request, res: Response) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, firstName, resetCode } = req.body;
    
    await sendSimplePasswordResetEmail(email, firstName, resetCode);

    res.json({ 
      success: true, 
      message: "Password reset email sent successfully" 
    });
  } catch (error) {
    logger.error("Password reset email error:", error);
    res.status(500).json({ 
      error: "Failed to send password reset email" 
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