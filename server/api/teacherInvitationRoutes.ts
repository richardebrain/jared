import { Router } from "express";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import { randomBytes } from "crypto";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { teacherInvitations } from "@shared/schema";
import { insertTeacherInvitationSchema } from "@shared/schema";
import { z } from "zod";
import { createTransport } from "nodemailer";

const router = Router();

// Email service setup
const transporter = createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Allow school owners and admins to upload a CSV/list of teacher emails
router.post("/api/teacher-invitations/upload", async (req, res) => {
  try {
    // Check if user is authenticated and is a school owner or admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserById(req.user.id);
    
    if (!user || (!user.isOwner && !user.isSchoolAdmin)) {
      return res.status(403).json({ message: "Forbidden - Only school owners and admins can invite teachers" });
    }

    // Validate request body with a custom schema
    const bodySchema = z.object({
      emails: z.array(z.string().email("Invalid email format")),
      schoolId: z.number().positive()
    });

    const validation = bodySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid data format", 
        errors: validation.error.issues 
      });
    }

    const { emails, schoolId } = validation.data;

    // Make sure the user belongs to the school they're inviting teachers to
    if (user.schoolId !== schoolId) {
      return res.status(403).json({ message: "You can only invite teachers to your own school" });
    }

    // Get school details for the invitation email
    const school = await storage.getSchoolById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Process each email
    const results = [];
    const baseUrl = req.protocol + '://' + req.get('host');
    
    for (const email of emails) {
      try {
        // Check if invitation already exists
        const existingInvitation = await db.select()
          .from(teacherInvitations)
          .where(eq(teacherInvitations.email, email))
          .limit(1);

        if (existingInvitation.length > 0 && existingInvitation[0].status === "pending") {
          results.push({
            email,
            status: 'skipped',
            message: 'Invitation already pending'
          });
          continue;
        }

        // Check if the user with this email already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          results.push({
            email,
            status: 'skipped',
            message: 'User already exists with this email'
          });
          continue;
        }

        // Create a secure invitation token
        const invitationToken = randomBytes(32).toString('hex');
        
        // Set expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Store invitation in database
        const invitation = await db.insert(teacherInvitations)
          .values({
            email,
            schoolId,
            invitedByUserId: user.id,
            invitationToken,
            expiresAt,
            status: "pending"
          })
          .returning();

        // Construct invitation link 
        const invitationLink = `${baseUrl}/register?token=${invitationToken}&email=${encodeURIComponent(email)}`;
        
        // Send email invitation
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `You've been invited to join ${school.name} on MentorMe`,
          html: `
            <div>
              <h2>Join ${school.name} on MentorMe</h2>
              <p>You've been invited by ${user.firstName} ${user.lastName} to join MentorMe - the professional development platform for early childhood educators.</p>
              <p>MentorMe provides personalized training to help you advance your teaching skills and career.</p>
              <a href="${invitationLink}" style="display:inline-block; background-color:#4F46E5; color:white; padding:12px 24px; text-decoration:none; border-radius:4px; margin:20px 0;">
                Accept Invitation & Create Account
              </a>
              <p>This invitation will expire in 7 days.</p>
              <p>If you have any questions, please contact ${user.firstName} at ${user.email}.</p>
            </div>
          `
        });

        results.push({
          email,
          status: 'sent',
          message: 'Invitation sent successfully'
        });
      } catch (error) {
        console.error(`Error processing invitation for ${email}:`, error);
        results.push({
          email,
          status: 'error',
          message: error.message || 'Failed to send invitation'
        });
      }
    }

    // Return results of the batch operation
    return res.status(200).json({
      message: `Processed ${emails.length} invitations`,
      results
    });
  } catch (error) {
    console.error("Error in teacher invitations upload:", error);
    return res.status(500).json({ message: "Failed to process invitations" });
  }
});

// Get all invitations for a school (for school owners/admins)
router.get("/api/teacher-invitations/school/:schoolId", async (req, res) => {
  try {
    // Check if user is authenticated and authorized
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserById(req.user.id);
    const schoolId = parseInt(req.params.schoolId);
    
    if (!user || (!user.isOwner && !user.isSchoolAdmin) || user.schoolId !== schoolId) {
      return res.status(403).json({ message: "Forbidden - Not authorized to view these invitations" });
    }

    // Get all invitations for the school
    const invitations = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.schoolId, schoolId));

    return res.status(200).json(invitations);
  } catch (error) {
    console.error("Error fetching teacher invitations:", error);
    return res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

// Route to verify invitation token (used during registration)
router.get("/api/teacher-invitations/verify", async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ message: "Missing token or email" });
    }

    // Find the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.invitationToken, token as string))
      .where(eq(teacherInvitations.email, email as string))
      .limit(1);

    if (!invitation) {
      return res.status(404).json({ message: "Invalid invitation" });
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      return res.status(400).json({ message: `Invitation has already been ${invitation.status}` });
    }

    const now = new Date();
    if (now > invitation.expiresAt) {
      // Mark as expired
      await db.update(teacherInvitations)
        .set({ status: "expired" })
        .where(eq(teacherInvitations.id, invitation.id));
        
      return res.status(400).json({ message: "Invitation has expired" });
    }

    // Get school details to return with verification
    const school = await storage.getSchoolById(invitation.schoolId);

    return res.status(200).json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        schoolId: invitation.schoolId,
        schoolName: school?.name || 'Unknown School'
      }
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return res.status(500).json({ message: "Failed to verify invitation" });
  }
});

// Route to mark an invitation as accepted (called during registration when a teacher account is created)
router.post("/api/teacher-invitations/accept", async (req, res) => {
  try {
    const { token, email, userId } = req.body;
    
    if (!token || !email || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find and update the invitation
    const [invitation] = await db.select()
      .from(teacherInvitations)
      .where(eq(teacherInvitations.invitationToken, token))
      .where(eq(teacherInvitations.email, email))
      .limit(1);

    if (!invitation) {
      return res.status(404).json({ message: "Invalid invitation" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: `Invitation has already been ${invitation.status}` });
    }

    // Mark invitation as accepted
    await db.update(teacherInvitations)
      .set({ 
        status: "accepted",
        acceptedAt: new Date()
      })
      .where(eq(teacherInvitations.id, invitation.id));

    // Update the school's teacher count
    await storage.incrementSchoolTeacherCount(invitation.schoolId);
        
    return res.status(200).json({
      message: "Invitation accepted successfully",
      schoolId: invitation.schoolId
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({ message: "Failed to accept invitation" });
  }
});

export default router;