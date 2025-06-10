import { db } from "../db";

export async function addModuleDraftsTable() {
  try {
    // Create module_drafts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS module_drafts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        module_data JSONB NOT NULL,
        creation_method TEXT,
        ai_workflow_step TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index for user_id for faster queries
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_module_drafts_user_id ON module_drafts(user_id);
    `);

    // Create index for updated_at for ordering
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_module_drafts_updated_at ON module_drafts(updated_at);
    `);

    console.log("Module drafts table created successfully");
  } catch (error) {
    console.error("Error creating module drafts table:", error);
    throw error;
  }
}