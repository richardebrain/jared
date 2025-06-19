import { db } from "./db";
import { sql } from "drizzle-orm";

async function addDefaultEceSettings() {
  try {
    console.log("Adding default ECE reporting settings...");
    
    // Insert default settings for school ID 1 (Raising Arizona)
    await db.execute(sql`
      INSERT INTO ece_reporting_settings (school_id, reporting_emails, frequency, is_active)
      VALUES (1, '["laura@raisingarizona.com"]', 'monthly', true)
      ON CONFLICT (school_id) DO NOTHING
    `);
    
    console.log("Default ECE reporting settings added successfully");
    
  } catch (error) {
    console.error("Error adding default ECE settings:", error);
    throw error;
  }
}

// Run the script
addDefaultEceSettings()
  .then(() => {
    console.log("ECE settings script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });