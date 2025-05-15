import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db';

// Get the directory name equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runGameMigration() {
  try {
    console.log('Starting games migration script...');
    
    // Read the migration file
    const migrationFilePath = path.join(__dirname, 'migrations', 'add_games_tables.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL directly with the pool
    await pool.query(migrationSql);
    
    console.log('Games migration completed successfully!');
    
    // Verify the tables were created
    const result = await pool.query(`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'educational_games'
    )`);
    
    const tableExists = result.rows[0]?.exists || false;
    console.log(`Table educational_games exists: ${tableExists}`);
    
    // Check if we have any games inserted
    const games = await pool.query('SELECT COUNT(*) FROM educational_games');
    const gameCount = games.rows[0]?.count || 0;
    console.log(`Number of games: ${gameCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error running games migration:', error);
    process.exit(1);
  }
}

runGameMigration();