import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db';
import { log } from './vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const sqlFilePath = path.join(__dirname, 'migration.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    log('Running database migration...', 'db-migration');
    await pool.query(sql);
    log('Migration completed successfully', 'db-migration');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();