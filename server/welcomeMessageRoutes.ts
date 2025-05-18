import { db } from "./db";
import { teacherMessages, users, coreValuesShoutOuts } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { storage } from "./storage";

/**
 * Registers routes for the teacher welcome message system
 * Includes API endpoints for messages and certification alerts
 */
export function registerWelcomeMessageRoutes(app) {
  // Get unread messages for the current user
  app.get("/api/messages/unread", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      
      // Get unread messages from teacher_messages table
      const unreadMessages = await db.query.teacherMessages.findMany({
        where: and(
          eq(teacherMessages.recipientId, userId),
          eq(teacherMessages.isRead, false)
        ),
        orderBy: [desc(teacherMessages.createdAt)],
        with: {
          sender: {
            columns: {
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          }
        }
      });
      
      // Check if the user has any recent core value shout-outs
      const recentShoutOuts = await db.query.coreValuesShoutOuts.findMany({
        where: eq(coreValuesShoutOuts.nomineeId, userId),
        orderBy: [desc(coreValuesShoutOuts.createdAt)],
        limit: 5,
        with: {
          nominator: {
            columns: {
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          }
        }
      });
      
      // Convert any unread shout-outs to messages if they don't already exist as messages
      for (const shoutOut of recentShoutOuts) {
        // Only add shout-outs from the last 7 days
        const shoutOutDate = new Date(shoutOut.createdAt);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (shoutOutDate >= oneWeekAgo) {
          // Check if this shoutout already exists as a message
          const existingMessage = await db.query.teacherMessages.findFirst({
            where: and(
              eq(teacherMessages.messageType, "shoutout"),
              eq(teacherMessages.relatedId, shoutOut.id)
            )
          });
          
          if (!existingMessage) {
            // Create a new message for this shoutout
            await db.insert(teacherMessages).values({
              senderId: shoutOut.nominatorId,
              recipientId: shoutOut.nomineeId,
              schoolId: req.user.schoolId,
              messageType: "shoutout",
              title: `Core Value Shout-Out: ${shoutOut.coreValue}`,
              content: `${shoutOut.nominator.firstName} ${shoutOut.nominator.lastName} gave you a shout-out for demonstrating the "${shoutOut.coreValue}" core value!\n\n"${shoutOut.message}"`,
              isRead: false,
              important: true,
              relatedId: shoutOut.id,
            });
          }
        }
      }
      
      // Get certificate expiration alerts
      const user = await storage.getUser(userId);
      const certificationAlerts = [];
      
      if (user) {
        // Check for fingerprint expiration
        if (user.fingerprintExpiration) {
          const expirationDate = new Date(user.fingerprintExpiration);
          const today = new Date();
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
            certificationAlerts.push({
              id: 'fingerprint-' + userId,
              senderId: userId, // System alert
              recipientId: userId,
              schoolId: user.schoolId,
              messageType: "certification_reminder",
              title: "Fingerprint Clearance Expiring Soon",
              content: `Your fingerprint clearance will expire in ${daysUntilExpiration} days. Please renew it before it expires.`,
              isRead: false,
              important: true,
              createdAt: new Date().toISOString()
            });
          } else if (daysUntilExpiration <= 0) {
            certificationAlerts.push({
              id: 'fingerprint-expired-' + userId,
              senderId: userId, // System alert
              recipientId: userId,
              schoolId: user.schoolId,
              messageType: "certification_reminder",
              title: "Fingerprint Clearance Has Expired",
              content: "Your fingerprint clearance has expired. Please renew it as soon as possible.",
              isRead: false,
              important: true,
              createdAt: new Date().toISOString()
            });
          }
        }
        
        // Check for CPR certification expiration
        if (user.cprExpiration) {
          const expirationDate = new Date(user.cprExpiration);
          const today = new Date();
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
            certificationAlerts.push({
              id: 'cpr-' + userId,
              senderId: userId, // System alert
              recipientId: userId,
              schoolId: user.schoolId,
              messageType: "certification_reminder",
              title: "CPR Certification Expiring Soon",
              content: `Your CPR certification will expire in ${daysUntilExpiration} days. Please renew it before it expires.`,
              isRead: false,
              important: true,
              createdAt: new Date().toISOString()
            });
          } else if (daysUntilExpiration <= 0) {
            certificationAlerts.push({
              id: 'cpr-expired-' + userId,
              senderId: userId, // System alert
              recipientId: userId,
              schoolId: user.schoolId,
              messageType: "certification_reminder",
              title: "CPR Certification Has Expired",
              content: "Your CPR certification has expired. Please renew it as soon as possible.",
              isRead: false,
              important: true,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
      
      // Combine all messages and alerts
      const allMessages = [...unreadMessages, ...certificationAlerts];
      
      res.json(allMessages);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      res.status(500).json({ message: "Failed to fetch unread messages" });
    }
  });

  // Mark a message as read
  app.post("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify this message belongs to the user
      const message = await db.query.teacherMessages.findFirst({
        where: and(
          eq(teacherMessages.id, messageId),
          eq(teacherMessages.recipientId, userId)
        )
      });
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Mark the message as read
      await db.update(teacherMessages)
        .set({ isRead: true })
        .where(eq(teacherMessages.id, messageId));
      
      // Check if user has any remaining unread messages
      const unreadCount = await db.select({ count: db.fn.count() })
        .from(teacherMessages)
        .where(and(
          eq(teacherMessages.recipientId, userId),
          eq(teacherMessages.isRead, false)
        ));
      
      const hasUnreadMessages = unreadCount[0].count > 0;
      
      // Update user's hasUnreadMessages flag
      await db.update(users)
        .set({ hasUnreadMessages })
        .where(eq(users.id, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Send a message (for directors/owners)
  app.post("/api/messages/send", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only school admins, admins, and owners can send messages
    if (!req.user.isAdmin && !req.user.isSchoolAdmin && !req.user.isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const { recipientId, title, content, messageType, important } = req.body;
      
      if (!recipientId || !title || !content || !messageType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Ensure recipient exists and is in the same school
      const recipient = await storage.getUser(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      if (recipient.schoolId !== req.user.schoolId && !req.user.isAdmin && !req.user.isOwner) {
        return res.status(403).json({ message: "Cannot send messages to users in other schools" });
      }
      
      // Create the message
      const [newMessage] = await db.insert(teacherMessages)
        .values({
          senderId: req.user.id,
          recipientId: recipientId,
          schoolId: req.user.schoolId,
          messageType: messageType,
          title: title,
          content: content,
          isRead: false,
          important: important || false
        })
        .returning();
      
      // Update recipient's hasUnreadMessages flag
      await db.update(users)
        .set({ hasUnreadMessages: true })
        .where(eq(users.id, recipientId));
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get all messages for the current user
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      
      // Get all messages for the user
      const messages = await db.query.teacherMessages.findMany({
        where: eq(teacherMessages.recipientId, userId),
        orderBy: [desc(teacherMessages.createdAt)],
        with: {
          sender: {
            columns: {
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          }
        }
      });
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get all certifications for the current user
  app.get("/api/certifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const certifications = {
        fingerprintExpiration: user.fingerprintExpiration,
        cprExpiration: user.cprExpiration,
        firstAidExpiration: user.firstAidExpiration,
        foodHandlerExpiration: user.foodHandlerExpiration,
        jobTitle: user.jobTitle,
        designations: user.designations || []
      };
      
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  // Update certifications for the current user
  app.post("/api/update-certifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const {
        fingerprintExpiration,
        cprExpiration,
        firstAidExpiration,
        foodHandlerExpiration,
        jobTitle
      } = req.body;
      
      await db.update(users)
        .set({
          fingerprintExpiration: fingerprintExpiration || null,
          cprExpiration: cprExpiration || null,
          firstAidExpiration: firstAidExpiration || null,
          foodHandlerExpiration: foodHandlerExpiration || null,
          jobTitle: jobTitle || null
        })
        .where(eq(users.id, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating certifications:", error);
      res.status(500).json({ message: "Failed to update certifications" });
    }
  });

  // Get expiring certifications alert
  app.get("/api/certifications/expiring", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const expiringCertifications = [];
      const today = new Date();
      
      // Check fingerprint expiration
      if (user.fingerprintExpiration) {
        const expirationDate = new Date(user.fingerprintExpiration);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 30) {
          expiringCertifications.push({
            type: "fingerprint",
            expirationDate: user.fingerprintExpiration,
            daysRemaining: daysUntilExpiration,
            label: "Fingerprint Clearance"
          });
        }
      }
      
      // Check CPR certification expiration
      if (user.cprExpiration) {
        const expirationDate = new Date(user.cprExpiration);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 30) {
          expiringCertifications.push({
            type: "cpr",
            expirationDate: user.cprExpiration,
            daysRemaining: daysUntilExpiration,
            label: "CPR Certification"
          });
        }
      }
      
      // Check First Aid certification expiration
      if (user.firstAidExpiration) {
        const expirationDate = new Date(user.firstAidExpiration);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 30) {
          expiringCertifications.push({
            type: "firstAid",
            expirationDate: user.firstAidExpiration,
            daysRemaining: daysUntilExpiration,
            label: "First Aid Certification"
          });
        }
      }
      
      // Check Food Handler card expiration
      if (user.foodHandlerExpiration) {
        const expirationDate = new Date(user.foodHandlerExpiration);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= 30) {
          expiringCertifications.push({
            type: "foodHandler",
            expirationDate: user.foodHandlerExpiration,
            daysRemaining: daysUntilExpiration,
            label: "Food Handler Card"
          });
        }
      }
      
      res.json(expiringCertifications);
    } catch (error) {
      console.error("Error fetching expiring certifications:", error);
      res.status(500).json({ message: "Failed to fetch expiring certifications" });
    }
  });
}