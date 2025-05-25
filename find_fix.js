/**
 * Script to find and identify where the Laura account emergency fix is happening
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Search for specific patterns that might reveal where the emergency fix is happening
const searchPatterns = [
  'EMERGENCY FIX',
  'Temporarily boosting',
  'Laura',
  'lbook',
  'user.id === 5',
  'if (user.id === 5)',
  'points to 15'
];

// Get the content of files that match our patterns
function searchFiles() {
  console.log('Searching for files that might contain special handling for Laura\'s account...');
  
  searchPatterns.forEach(pattern => {
    try {
      console.log(`\nSearching for pattern: "${pattern}"`);
      const result = execSync(`grep -r "${pattern}" server/ --include="*.ts" --include="*.js"`, { encoding: 'utf8' });
      console.log(result || 'No results found');
    } catch (error) {
      console.log(`No matches found for pattern "${pattern}"`);
    }
  });
}

// Run the search
searchFiles();