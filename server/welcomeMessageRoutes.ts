import { db } from "./db";
import { sql, eq, and, desc, asc } from "drizzle-orm";
import { users } from "@shared/schema";
import { runWelcomeMessageMigration } from "./welcomeMessageMigration";

// Run the migration when this file is imported
runWelcomeMessageMigration().catch(error => {
  console.error("Error running welcome message migration:", error);
});

export function registerWelcomeMessageRoutes(app) {
  // Get a user's messages
  app.get("/api/messages", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;

      // Fetch messages for the user
      const messages = await db.execute(sql`
        SELECT 
          tm.*,
          s.first_name as sender_first_name,
          s.last_name as sender_last_name,
          s.profile_picture as sender_profile_picture
        FROM teacher_messages tm
        LEFT JOIN users s ON tm.sender_id = s.id
        WHERE tm.recipient_id = ${userId}
        ORDER BY tm.created_at DESC
        LIMIT 20
      `);

      // Update the has_unread_messages flag
      await db.execute(sql`
        UPDATE users
        SET has_unread_messages = EXISTS (
          SELECT 1 FROM teacher_messages 
          WHERE recipient_id = ${userId} AND is_read = false
        )
        WHERE id = ${userId}
      `);

      // Format the response
      const formattedMessages = messages.rows.map(msg => ({
        id: msg.id,
        createdAt: msg.created_at,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        messageType: msg.message_type,
        title: msg.title,
        content: msg.content,
        isRead: msg.is_read,
        isImportant: msg.is_important,
        sender: {
          firstName: msg.sender_first_name,
          lastName: msg.sender_last_name,
          profilePicture: msg.sender_profile_picture
        }
      }));

      return res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark a message as read
  app.post("/api/messages/:id/read", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;
      const messageId = req.params.id;

      // Update the message to mark it as read
      await db.execute(sql`
        UPDATE teacher_messages
        SET is_read = true
        WHERE id = ${messageId} AND recipient_id = ${userId}
      `);

      // Update the has_unread_messages flag
      await db.execute(sql`
        UPDATE users
        SET has_unread_messages = EXISTS (
          SELECT 1 FROM teacher_messages 
          WHERE recipient_id = ${userId} AND is_read = false
        )
        WHERE id = ${userId}
      `);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get the user's shout-outs (core value recognition)
  app.get("/api/shoutouts", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;

      // Fetch recent shout-outs where the user is the nominee
      const shoutouts = await db.execute(sql`
        SELECT 
          cvs.*,
          n.first_name as nominator_first_name,
          n.last_name as nominator_last_name,
          n.profile_picture as nominator_profile_picture
        FROM core_value_shoutouts cvs
        LEFT JOIN users n ON cvs.nominator_id = n.id
        WHERE cvs.nominee_id = ${userId}
        ORDER BY cvs.created_at DESC
        LIMIT 10
      `);

      // Format the shout-outs
      const formattedShoutouts = shoutouts.rows.map(shoutout => ({
        id: shoutout.id,
        createdAt: new Date(shoutout.created_at),
        nominatorId: shoutout.nominator_id,
        nomineeId: shoutout.nominee_id,
        coreValue: shoutout.core_value,
        description: shoutout.description,
        pointsAwarded: shoutout.points_awarded,
        nominator: {
          firstName: shoutout.nominator_first_name,
          lastName: shoutout.nominator_last_name,
          profilePicture: shoutout.nominator_profile_picture
        }
      }));

      return res.json(formattedShoutouts);
    } catch (error) {
      console.error("Error fetching shout-outs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new shout-out (core value recognition)
  app.post("/api/shoutouts", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;
      const { nomineeId, coreValue, description } = req.body;

      if (!nomineeId || !coreValue || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if the user is authorized to create shout-outs (admin, school admin, or owner)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res.status(403).json({ message: "Not authorized to create shout-outs" });
      }

      // Create the shout-out
      const result = await db.execute(sql`
        INSERT INTO core_value_shoutouts (
          nominator_id, nominee_id, core_value, description, points_awarded
        )
        VALUES (
          ${userId}, ${nomineeId}, ${coreValue}, ${description}, 5
        )
        RETURNING id
      `);

      const shoutoutId = result.rows[0].id;

      // Add points to the nominee
      await db.execute(sql`
        UPDATE users
        SET points = points + 5,
            lifetime_points = lifetime_points + 5
        WHERE id = ${nomineeId}
      `);

      // Create a system message for the shout-out
      await db.execute(sql`
        INSERT INTO teacher_messages (
          sender_id, recipient_id, message_type, title, content, is_important
        )
        VALUES (
          ${userId}, 
          ${nomineeId}, 
          'shoutout', 
          'Core Value Shout-Out: ${coreValue}', 
          ${description}, 
          true
        )
      `);

      // Update the nominee's unread messages flag
      await db.execute(sql`
        UPDATE users
        SET has_unread_messages = true
        WHERE id = ${nomineeId}
      `);

      return res.json({ 
        success: true, 
        id: shoutoutId, 
        message: "Shout-out created successfully" 
      });
    } catch (error) {
      console.error("Error creating shout-out:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all messages sent by a user
  app.get("/api/messages/sent", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;

      // Check if the user is authorized (admin, school admin, or owner)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res.status(403).json({ message: "Not authorized to view sent messages" });
      }

      // Get the user's school ID
      const schoolId = user.schoolId;

      // Fetch messages sent by the user
      const messages = await db.execute(sql`
        SELECT 
          tm.*,
          r.first_name as recipient_first_name,
          r.last_name as recipient_last_name,
          r.profile_picture as recipient_profile_picture
        FROM teacher_messages tm
        LEFT JOIN users r ON tm.recipient_id = r.id
        WHERE tm.sender_id = ${userId}
        AND r.school_id = ${schoolId}
        ORDER BY tm.created_at DESC
        LIMIT 50
      `);

      // Format the response
      const formattedMessages = messages.rows.map(msg => ({
        id: msg.id,
        createdAt: msg.created_at,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        messageType: msg.message_type,
        title: msg.title,
        content: msg.content,
        isRead: msg.is_read,
        isImportant: msg.is_important,
        recipient: {
          firstName: msg.recipient_first_name,
          lastName: msg.recipient_last_name,
          profilePicture: msg.recipient_profile_picture
        }
      }));

      return res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get team members for a school
  app.get("/api/school/team-members", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;

      // Check if the user is authorized (admin, school admin, or owner)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res.status(403).json({ message: "Not authorized to view team members" });
      }

      // Get the user's school ID
      const schoolId = user.schoolId;

      // Fetch all users in the same school
      const teamMembers = await db.query.users.findMany({
        where: eq(users.schoolId, schoolId),
        orderBy: [asc(users.lastName), asc(users.firstName)]
      });

      // Format the response
      const formattedMembers = teamMembers.map(member => ({
        id: member.id,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        profilePicture: member.profilePicture,
        jobTitle: member.jobTitle || "Teacher",
        createdAt: member.createdAt,
        isAdmin: member.isAdmin,
        isSchoolAdmin: member.isSchoolAdmin
      }));

      return res.json(formattedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send a new message
  app.post("/api/messages/send", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;
      const { recipientId, title, content, messageType, important } = req.body;

      if (!recipientId || !title || !content || !messageType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if the user is authorized (admin, school admin, or owner)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res.status(403).json({ message: "Not authorized to send messages" });
      }

      // Create the message
      const result = await db.execute(sql`
        INSERT INTO teacher_messages (
          sender_id, recipient_id, message_type, title, content, is_important
        )
        VALUES (
          ${userId}, ${recipientId}, ${messageType}, ${title}, ${content}, ${!!important}
        )
        RETURNING id
      `);

      const messageId = result.rows[0].id;

      // Update the recipient's unread messages flag
      await db.execute(sql`
        UPDATE users
        SET has_unread_messages = true
        WHERE id = ${recipientId}
      `);

      return res.json({ 
        success: true, 
        id: messageId, 
        message: "Message sent successfully" 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a message
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;
      const messageId = req.params.id;

      // Check if the user is authorized (admin, school admin, or owner)
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
        return res.status(403).json({ message: "Not authorized to delete messages" });
      }

      // Delete the message if the user is the sender
      await db.execute(sql`
        DELETE FROM teacher_messages
        WHERE id = ${messageId} AND sender_id = ${userId}
      `);

      return res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a user's certification information
  app.post("/api/user/certifications", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId;
      const { fingerprintExpiration, cprExpiration, firstAidExpiration, teacherId } = req.body;
      
      let targetUserId = userId;
      
      // If teacherId is provided and the user is an admin, school admin, or owner,
      // allow updating another user's certifications
      if (teacherId && teacherId !== userId) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId)
        });
        
        if (!user || (!user.isAdmin && !user.isSchoolAdmin && !user.isOwner)) {
          return res.status(403).json({ message: "Not authorized to update other users' certifications" });
        }
        
        targetUserId = teacherId;
      }
      
      // Update the user's certification information
      await db.execute(sql`
        UPDATE users
        SET 
          fingerprint_expiration = ${fingerprintExpiration ? new Date(fingerprintExpiration) : null},
          cpr_expiration = ${cprExpiration ? new Date(cprExpiration) : null},
          first_aid_expiration = ${firstAidExpiration ? new Date(firstAidExpiration) : null}
        WHERE id = ${targetUserId}
      `);
      
      return res.json({ success: true, message: "Certification information updated" });
    } catch (error) {
      console.error("Error updating certifications:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}