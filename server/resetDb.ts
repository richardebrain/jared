import { db, pool } from "./db";
import { seedDatabase } from "./seedDb";
import * as schema from "@shared/schema";

async function resetDatabase() {
  console.log("Starting database reset");
  
  try {
    // Drop existing tables (in reverse order of creation to avoid foreign key constraints)
    console.log("Dropping existing tables...");
    await pool.query(`DROP TABLE IF EXISTS user_progress CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS assessments CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS meetings CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS store_items CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS user_items CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS discussion_threads CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS discussion_comments CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS comment_votes CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS core_values_shout_outs CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS learning_modules CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
    
    console.log("All tables dropped successfully");
    
    // Recreate schema by running the migration
    console.log("Recreating schema...");
    await pool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        language TEXT NOT NULL,
        native_language TEXT NOT NULL,
        time_zone TEXT NOT NULL,
        profile_picture TEXT,
        learning_style JSONB,
        bear_bucks INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        last_active TIMESTAMP,
        achievement_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Learning Modules table
      CREATE TABLE IF NOT EXISTS learning_modules (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration INTEGER NOT NULL,
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        difficulty TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- User Progress table
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        module_id INTEGER NOT NULL REFERENCES learning_modules(id),
        progress INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        recommended BOOLEAN DEFAULT FALSE,
        points_earned INTEGER DEFAULT 0,
        last_accessed TIMESTAMP DEFAULT NOW()
      );

      -- Meetings table
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        host_id INTEGER NOT NULL REFERENCES users(id),
        guest_id INTEGER REFERENCES users(id),
        time_zone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        meeting_link TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Assessments table
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        overall_score INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        results JSONB,
        domain_scores JSONB,
        strength_areas TEXT[],
        growth_areas TEXT[],
        question_count INTEGER,
        correct_count INTEGER,
        incorrect_answers JSONB,
        difficulty_level TEXT,
        time_spent INTEGER,
        personalized_learning_path JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("Schema recreated successfully");
    
    // Run the seed function to populate the database
    await seedDatabase();
    
    console.log("Database reset and seeded successfully");
  } catch (error) {
    console.error("Error resetting database:", error);
  }
}

resetDatabase().catch(err => {
  console.error("Error in resetDb script:", err);
});