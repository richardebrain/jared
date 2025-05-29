import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Creates the early learning standards and lesson plans tables
 */
export async function createStandardsTables() {
  console.log("Creating Arizona Early Learning Standards tables...");

  try {
    // Create early_learning_standards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "early_learning_standards" (
        "id" SERIAL PRIMARY KEY,
        "standard_area" TEXT NOT NULL,
        "strand" TEXT NOT NULL,
        "standard_code" TEXT NOT NULL UNIQUE,
        "age_group" TEXT NOT NULL,
        "standard_text" TEXT NOT NULL,
        "description" TEXT,
        "keywords" TEXT[],
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for early_learning_standards
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "standards_area_strand_idx" ON "early_learning_standards" ("standard_area", "strand");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "standards_age_group_idx" ON "early_learning_standards" ("age_group");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "standards_keywords_idx" ON "early_learning_standards" USING GIN ("keywords");
    `);

    // Create lesson_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "lesson_plans" (
        "id" SERIAL PRIMARY KEY,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "school_id" INTEGER REFERENCES "schools"("id"),
        "title" TEXT NOT NULL,
        "description" TEXT,
        "age_group" TEXT NOT NULL,
        "duration" INTEGER,
        "objectives" TEXT[],
        "materials" TEXT[],
        "activities" JSONB,
        "assessment" TEXT,
        "notes" TEXT,
        "standards_referenced" INTEGER[],
        "is_public" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes for lesson_plans
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "lesson_plans_created_by_idx" ON "lesson_plans" ("created_by");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "lesson_plans_school_idx" ON "lesson_plans" ("school_id");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "lesson_plans_age_group_idx" ON "lesson_plans" ("age_group");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "lesson_plans_public_idx" ON "lesson_plans" ("is_public");
    `);

    console.log("Successfully created Arizona Early Learning Standards tables");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

// Run table creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createStandardsTables()
    .then(() => {
      console.log("Table creation completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Table creation failed:", error);
      process.exit(1);
    });
}