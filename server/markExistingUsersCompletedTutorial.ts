import { db } from "./db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function markExistingUsersCompletedTutorial() {
  console.log("Marking existing users as having completed tutorial...");
  
  try {
    // Mark users who have been active for more than 7 days as having completed tutorial
    const result = await db.execute(sql`
      UPDATE users 
      SET has_completed_tutorial = true 
      WHERE created_at < NOW() - INTERVAL '7 days' 
      AND has_completed_tutorial = false
    `);

    console.log(`Updated ${result.rowCount} users to mark tutorial as completed`);
    
    // Also mark specific users who we know have been using the platform
    const specificUsers = await db.execute(sql`
      UPDATE users 
      SET has_completed_tutorial = true 
      WHERE username IN ('nbook', 'lbook', 'tpecina', 'kpecina', 'admin')
      AND has_completed_tutorial = false
    `);
    
    console.log(`Updated ${specificUsers.rowCount} specific users to mark tutorial as completed`);
    
  } catch (error) {
    console.error("Error marking users as completed tutorial:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  markExistingUsersCompletedTutorial()
    .then(() => {
      console.log("Tutorial completion update completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Tutorial completion update failed:", error);
      process.exit(1);
    });
}

export { markExistingUsersCompletedTutorial };