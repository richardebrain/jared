import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * This migration script creates the video_quiz_completions table
 * which is needed for tracking and awarding points for video quiz completions.
 */
export async function createVideoQuizCompletionsTable() {
  console.log('Creating video_quiz_completions table...');
  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'video_quiz_completions'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('video_quiz_completions table already exists. Skipping creation.');
      return;
    }

    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS video_quiz_completions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        video_id TEXT NOT NULL,
        points_earned INTEGER NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create an index on user_id for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_video_quiz_completions_user_id ON video_quiz_completions(user_id);
    `);
    
    // Create a compound index on user_id and video_id
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_video_quiz_completions_user_video ON video_quiz_completions(user_id, video_id);
    `);
    
    console.log('video_quiz_completions table created successfully!');
  } catch (error) {
    console.error('Failed to create video_quiz_completions table:', error);
    throw error;
  }
}