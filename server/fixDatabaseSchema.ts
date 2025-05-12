import { pool } from './db';

async function fixDatabaseSchema() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Starting database schema fix...');
    
    // Check if columns exist before adding them
    const userTableColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const userColumnsToAdd = [];
    
    // Check for bear_bucks column
    if (!userTableColumns.rows.some(row => row.column_name === 'bear_bucks')) {
      userColumnsToAdd.push('ADD COLUMN bear_bucks INTEGER DEFAULT 0');
    }
    
    // Check for points column
    if (!userTableColumns.rows.some(row => row.column_name === 'points')) {
      userColumnsToAdd.push('ADD COLUMN points INTEGER DEFAULT 0');
    }
    
    // Check for level column
    if (!userTableColumns.rows.some(row => row.column_name === 'level')) {
      userColumnsToAdd.push('ADD COLUMN level INTEGER DEFAULT 1');
    }
    
    // Check for streak column
    if (!userTableColumns.rows.some(row => row.column_name === 'streak')) {
      userColumnsToAdd.push('ADD COLUMN streak INTEGER DEFAULT 0');
    }
    
    // Check for last_active column
    if (!userTableColumns.rows.some(row => row.column_name === 'last_active')) {
      userColumnsToAdd.push('ADD COLUMN last_active TIMESTAMP');
    }
    
    // Check for achievement_count column
    if (!userTableColumns.rows.some(row => row.column_name === 'achievement_count')) {
      userColumnsToAdd.push('ADD COLUMN achievement_count INTEGER DEFAULT 0');
    }
    
    // Add columns to users table if needed
    if (userColumnsToAdd.length > 0) {
      const alterUserTableSQL = `ALTER TABLE users ${userColumnsToAdd.join(', ')}`;
      await client.query(alterUserTableSQL);
      console.log('Added new columns to users table:', userColumnsToAdd);
    } else {
      console.log('No new columns needed for users table');
    }
    
    // Check user_progress table
    const progressTableColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_progress'
    `);
    
    // Add points_earned column if it doesn't exist
    if (!progressTableColumns.rows.some(row => row.column_name === 'points_earned')) {
      await client.query(`
        ALTER TABLE user_progress 
        ADD COLUMN points_earned INTEGER DEFAULT 0
      `);
      console.log('Added points_earned column to user_progress table');
    } else {
      console.log('No new columns needed for user_progress table');
    }
    
    // Check if achievements table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    // Create achievements table if it doesn't exist
    if (!existingTables.includes('achievements')) {
      await client.query(`
        CREATE TABLE achievements (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          category TEXT NOT NULL,
          required_points INTEGER,
          required_modules INTEGER,
          level INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created achievements table');
    }
    
    // Create user_achievements table if it doesn't exist
    if (!existingTables.includes('user_achievements')) {
      await client.query(`
        CREATE TABLE user_achievements (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          achievement_id INTEGER NOT NULL REFERENCES achievements(id),
          earned_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created user_achievements table');
    }
    
    // Create store_items table if it doesn't exist
    if (!existingTables.includes('store_items')) {
      await client.query(`
        CREATE TABLE store_items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          category TEXT NOT NULL,
          bear_bucks_cost INTEGER NOT NULL,
          level_required INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created store_items table');
    }
    
    // Create user_items table if it doesn't exist
    if (!existingTables.includes('user_items')) {
      await client.query(`
        CREATE TABLE user_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          item_id INTEGER NOT NULL REFERENCES store_items(id),
          acquired TIMESTAMP DEFAULT NOW(),
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created user_items table');
    }
    
    // Create spin_game_rewards table if it doesn't exist
    if (!existingTables.includes('spin_game_rewards')) {
      await client.query(`
        CREATE TABLE spin_game_rewards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          reward_type TEXT NOT NULL,
          reward_amount INTEGER,
          item_id INTEGER REFERENCES store_items(id),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created spin_game_rewards table');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database schema update completed successfully!');
    
  } catch (error) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error updating database schema:', error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run the function
fixDatabaseSchema()
  .then(() => {
    console.log('Database schema fix complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix database schema:', error);
    process.exit(1);
  });