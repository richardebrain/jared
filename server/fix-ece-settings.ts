import { db } from "./db";
import { sql } from "drizzle-orm";

async function addDefaultEceSettings() {
  try {
    console.log("Adding default ECE reporting settings...");
    
    // Check if settings already exist for school ID 1
    const existingSettings = await db.execute(sql`
      SELECT id FROM ece_reporting_settings WHERE school_id = 1
    `);
    
    if (existingSettings.rows.length === 0) {
      // Insert default settings for school ID 1 (Raising Arizona)
      await db.execute(sql`
        INSERT INTO ece_reporting_settings (school_id, reporting_emails, frequency, is_active)
        VALUES (1, '["laura@raisingarizona.com"]', 'monthly', true)
      `);
      console.log("Default ECE settings inserted successfully");
    } else {
      console.log("ECE settings already exist for school ID 1");
    }
    
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