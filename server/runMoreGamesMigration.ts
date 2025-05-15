import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db';

// Get the directory name equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMoreGamesMigration() {
  try {
    console.log('Starting additional games migration script...');
    
    // Read the migration file
    const migrationFilePath = path.join(__dirname, 'migrations', 'add_more_games.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL directly with the pool
    await pool.query(migrationSql);
    
    console.log('Additional games migration completed successfully!');
    
    // Check how many games we have now
    const gamesResult = await pool.query('SELECT COUNT(*), type FROM educational_games GROUP BY type');
    
    console.log('Current games in database:');
    gamesResult.rows.forEach(row => {
      console.log(`- ${row.type}: ${row.count} games`);
    });
    
    // Get all games to display their titles
    const allGamesResult = await pool.query('SELECT id, title, type, category, difficulty, points_value FROM educational_games ORDER BY id');
    
    console.log('\nAvailable games:');
    allGamesResult.rows.forEach(game => {
      console.log(`${game.id}. ${game.title} (${game.type}, ${game.category}, ${game.difficulty}) - ${game.points_value} points`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error running additional games migration:', error);
    process.exit(1);
  }
}

runMoreGamesMigration();