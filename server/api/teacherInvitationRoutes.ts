import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { eq, and } from 'drizzle-orm';
import { teacherInvitations } from '@shared/schema';
import { db } from '../db';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

const router = express.Router();

// Environment variables for email configuration
// Environment variables for email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const APP_URL = process.env.APPURL || 'https://9fac84b7-b39a-4102-b631-449a67e3932d-00-1yk3ro8w0zxc5.worf.replit.dev';
const INVITE_EXPIRY_DAYS = 7; // Invitations expire after 7 days
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Authentication middleware to verify user is logged in
const requireAuth = (req, res, next) => {


  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Get user from session ID
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - No user ID in session' });
  }
  
  storage.getUser(userId)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized - User not found' });
      }
      
      req.user = user;
      next();
    })
    .catch(err => {
      console.error('Auth middleware error:', err);
      res.status(500).json({ message: 'Server error authenticating user' });
    });
};

// Middleware to verify user is a school owner or admin
const requireOwnerOrAdmin = async (req, res, next) => {
  const user = req.user;
  console.log('Authenticating user...',user)

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (!user.schoolId) {
    return res.status(403).json({ message: 'Forbidden - User not associated with a school' });
  }
  
  const school = await storage.getSchool(user.schoolId);
  if (!school) {
    return res.status(404).json({ message: 'School not found' });
  }
  
  // Check if user is an owner or admin
  if (!user.isOwner && !user.isSchoolAdmin && !user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden - Only school owners and admins can invite teachers' });
  }
  
  req.school = school;
  next();
};

// Helper function to create and send email invitations
async function sendInvitationEmail(invitation, school) {
  // Use test mode if SendGrid API key is not configured
  const TEST_MODE = !SENDGRID_API_KEY;

  const inviteUrl = `${APP_URL}/register?token=${invitation.invitationToken}&email=${encodeURIComponent(invitation.email)}`;

  if (TEST_MODE) {
    console.log('SendGrid API key not found, running in test mode');
    console.log('TEST MODE - Would have sent invitation to:', invitation.email);
    console.log('TEST MODE - Invitation link:', inviteUrl);
    return { 
      success: true, 
      testMode: true,
      messageId: `test-${Date.now()}`
    };
  }

  try {
    // Custom welcome message
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Welcome to MentorMePreK – Your New Superpower for PreK Teaching!</h2>
        <p>Hello Super Teachers!</p>
        <p>Congratulations! You've just received your golden ticket (aka this email invite) to join the MentorMePreK app—your new secret weapon for becoming the absolute best PreK teacher out there.</p>
        <ul>
          <li>Personalized support for that one tricky little learner who keeps you on your toes.</li>
          <li>Classroom music that magically sets the perfect mood.</li>
          <li>The best, research-backed learning modules in Early Childhood Education.</li>
        </ul>
        <p>All this is right at your fingertips, ready to help you grow, shine, and maybe even have a little fun while you're at it.</p>
        <p><strong>But here's the catch: you need to sign in within 5 days to activate your account and unlock all these superpowers.</strong></p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Activate Your Account</a>
        </div>
        <p>So, what are you waiting for? Click that link, dive in, and let's make this PreK year legendary!</p>
        <p>Welcome aboard,<br>The MentorMePreK Team</p>
        <p style="font-size: 12px; color: #718096;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `;
    const msg = {
      to: invitation.email,
      from: EMAIL_USER || 'jared@mentormeprek.com',
      subject: 'Welcome to MentorMePreK – Your New Superpower for PreK Teaching!',
      html,
    };
    const info = await sgMail.send(msg);
    console.log('Invitation email sent:', info[0]?.headers['x-message-id'] || info[0]?.messageId);
    return { success: true, messageId: info[0]?.headers['x-message-id'] || info[0]?.messageId };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, message: error.message };
  }
}

// API routes

// Upload multiple teacher email addresses and send invitations
router.post('/upload', requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { emails, schoolId } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'No email addresses provided' });
    }

    // Validate school
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const school = await storage.getSchool(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Create a unique token for each email address and send invitation
    const results = [];
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    for (const email of emails) {
      try {
        // Validate email
        const emailValidator = z.string().email();
        const validatedEmail = emailValidator.parse(email);

        // Check for existing invitations
        const existingInvitations = await db.select()
          .from(teacherInvitations)
          .where(and(
            eq(teacherInvitations.email, validatedEmail),
            eq(teacherInvitations.schoolId, schoolId)
          ));

        if (existingInvitations.length > 0) {
          results.push({
            email: validatedEmail,
            success: false,
            message: 'Invitation already exists for this email'
          });
          continue;
        }

        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation in database
        const invitation = {
          schoolId,
          email: validatedEmail,
          invitationToken: token,
          invitedByUserId: req.user.id,
          status: 'pending',
          expiresAt: expiryDate,
        };

        const [insertedInvitation] = await db
          .insert(teacherInvitations)
          .values(invitation)
          .returning();

        // Send invitation email
        const emailResult = await sendInvitationEmail(insertedInvitation, school);

        // Update invitation status based on email sending result
        if (emailResult.success) {
          await db
            .update(teacherInvitations)
            .set({status:'sent'})
            .where(eq(teacherInvitations.id, insertedInvitation.id));

          results.push({
            email: validatedEmail,
            success: true,
            message: 'Invitation sent successfully'
          });
        } else {
          await db
            .update(teacherInvitations)
            .set({status:'error'})
            .where(eq(teacherInvitations.id, insertedInvitation.id));

          results.push({
            email: validatedEmail,
            success: false,
            message: 'Failed to send invitation email'
          });
        }
      } catch (error) {
        results.push({
          email,
          success: false,
          message: error.message || 'Invalid email address'
        });
      }
    }

    res.status(200).json({
      success: results.some(r => r.success),
      invitations: results
    });
  } catch (error) {
    console.error('Error uploading teacher invitations:', error);
    res.status(500).json({ 
      message: 'Failed to process invitations',
      error: error.message 
    });
  }
});

// Get all invitations for a school
router.get('/school/:schoolId', requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Validate user belongs to this school and has permission
    const user = req.user;
    
    if (user.schoolId !== parseInt(schoolId) && !user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to view invitations for this school' });
    }
    
    // Get school
    const school = await storage.getSchool(parseInt(schoolId));
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Get all invitations for the school
    const invitations = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.schoolId, parseInt(schoolId)))
      .orderBy(teacherInvitations.createdAt, 'desc');
    
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error getting teacher invitations:', error);
    res.status(500).json({ message: 'Failed to get invitations' });
  }
});

// Resend an invitation
router.post('/resend/:invitationId', requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    // Get the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.id, parseInt(invitationId)));
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user has permission (same school)
    if (invitation.schoolId !== req.user.schoolId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to resend this invitation' });
    }
    
    // Get school
    const school = await storage.getSchool(invitation.schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Update expiry date
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    
    // Update invitation status and expiry date
    await db
      .update(teacherInvitations)
      .set({ 
        status: 'pending',
        expiresAt: expiryDate,
        sentAt: now
      })
      .where(eq(teacherInvitations.id, invitation.id));
    
    // Get updated invitation
    const [updatedInvitation] = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.id, invitation.id));
    
    // Send invitation email
    const emailResult = await sendInvitationEmail(updatedInvitation, school);
    
    // Update invitation status based on email sending result
    if (emailResult.success) {
      await db
        .update(teacherInvitations)
        .set({ status: 'sent' })
        .where(eq(teacherInvitations.id, invitation.id));
      
      res.status(200).json({ 
        success: true,
        message: 'Invitation resent successfully'
      });
    } else {
      await db
        .update(teacherInvitations)
        .set({ status: 'error' })
        .where(eq(teacherInvitations.id, invitation.id));
      
      res.status(500).json({ 
        success: false,
        message: 'Failed to resend invitation email',
        error: emailResult.message
      });
    }
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to resend invitation',
      error: error.message
    });
  }
});

// Accept an invitation (used during registration)
router.post('/accept', async (req, res) => {
  try {
    const { token, email, userId } = req.body;
    
    if (!token || !email || !userId) {
      return res.status(400).json({ message: 'Token, email, and userId are required' });
    }
    
    // Find the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(and(
        eq(teacherInvitations.invitationToken, token),
        eq(teacherInvitations.email, email)
      ));
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({ message: 'Invitation has already been accepted' });
    }
    
    // Get school
    const school = await storage.getSchool(invitation.schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Update invitation status
    await db
      .update(teacherInvitations)
      .set({ 
        status: 'accepted',
        acceptedAt: new Date(),
        userId
      })
      .where(eq(teacherInvitations.id, invitation.id));
    
    // Update user's school ID
    await storage.updateUserSchool(userId, invitation.schoolId);
    
    // Increment school teacher count
    await storage.incrementSchoolTeacherCount(invitation.schoolId);
    
    res.status(200).json({ 
      success: true,
      message: 'Invitation accepted successfully',
      schoolId: invitation.schoolId,
      schoolName: school.name
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
});

// Cancel an invitation
router.delete('/:invitationId', requireAuth, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    // Get the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.id, parseInt(invitationId)));
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if user has permission (same school)
    if (invitation.schoolId !== req.user.schoolId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to cancel this invitation' });
    }
    
    // Delete the invitation
    await db
      .delete(teacherInvitations)
      .where(eq(teacherInvitations.id, invitation.id));
    
    res.status(200).json({ 
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
});

// Verify if a token is valid (used during registration)
router.get('/verify', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }
    
    // Find the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(and(
        eq(teacherInvitations.invitationToken, token.toString()),
        eq(teacherInvitations.email, email.toString())
      ));
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invitation has expired'
      });
    }

  
    
    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
  
      return res.status(400).json({ 
        valid: false,
        message: 'Invitation has already been accepted',
      });
    }
    
    // Get school
    const school = await storage.getSchool(invitation.schoolId);
    
    res.status(200).json({ 
      valid: true,
      schoolId: invitation.schoolId,
      schoolName: school?.name || 'Unknown School',
      email: invitation.email
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Failed to verify invitation',
      error: error.message
    });
  }
});

export default router;