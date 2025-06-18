import { db } from "./db";
import { sql } from "drizzle-orm";

export async function addEceReportingTable() {
  try {
    console.log("Creating ECE reporting settings table...");
    
    // Create the ece_reporting_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ece_reporting_settings (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id),
        reporting_emails JSONB NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'monthly',
        is_active BOOLEAN DEFAULT true,
        last_report_sent TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create index for school-based lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ece_reporting_school_idx 
      ON ece_reporting_settings(school_id)
    `);
    
    console.log("ECE reporting settings table created successfully");
    
  } catch (error) {
    console.error("Error creating ECE reporting settings table:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addEceReportingTable()
    .then(() => {
      console.log("ECE reporting migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}