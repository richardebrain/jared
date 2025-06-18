import { db } from "./db";
import { sql } from "drizzle-orm";

export async function addEceRenewalDateColumn() {
  try {
    console.log("Adding ECE hours renewal date column...");
    
    // Add the ece_hours_renewal_date column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS ece_hours_renewal_date DATE
    `);
    
    console.log("ECE hours renewal date column added successfully");
    
    // Set default renewal dates for existing users based on their first login or created date
    await db.execute(sql`
      UPDATE users 
      SET ece_hours_renewal_date = COALESCE(last_active::date, created_at::date)
      WHERE ece_hours_renewal_date IS NULL
    `);
    
    console.log("Default ECE renewal dates set for existing users");
    
  } catch (error) {
    console.error("Error adding ECE renewal date column:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addEceRenewalDateColumn()
    .then(() => {
      console.log("ECE renewal date migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}