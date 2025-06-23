import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixNatalieTutorial() {
  console.log("Fixing Natalie's tutorial completion status...");
  
  try {
    // Check Natalie's current record
    const [natalie] = await db.select().from(users).where(eq(users.id, 50)).limit(1);
    console.log('Natalie before update:', {
      id: natalie.id, 
      username: natalie.username, 
      hasCompletedTutorial: natalie.hasCompletedTutorial,
      createdAt: natalie.createdAt
    });

    // Update Natalie specifically to mark tutorial as completed
    const [updated] = await db.update(users)
      .set({ hasCompletedTutorial: true })
      .where(eq(users.id, 50))
      .returning();

    console.log('Natalie after update:', {
      id: updated.id, 
      username: updated.username, 
      hasCompletedTutorial: updated.hasCompletedTutorial
    });
    
  } catch (error) {
    console.error("Error fixing Natalie's tutorial:", error);
    throw error;
  }
}

// Run fix if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixNatalieTutorial()
    .then(() => {
      console.log("Natalie's tutorial fix completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Tutorial fix failed:", error);
      process.exit(1);
    });
}

export { fixNatalieTutorial };