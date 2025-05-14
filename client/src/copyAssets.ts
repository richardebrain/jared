import * as path from 'path';
import * as fs from 'fs';

// Create the public/assets directory if it doesn't exist
const publicAssetsPath = path.join(process.cwd(), 'client', 'public', 'assets');
if (!fs.existsSync(publicAssetsPath)) {
  fs.mkdirSync(publicAssetsPath, { recursive: true });
}

// Copy the song file from attached_assets to public/assets
const songSourcePath = path.join(process.cwd(), 'attached_assets', 'Sunrise paints the Glendale sky gold.mp3');
const songDestPath = path.join(publicAssetsPath, 'Sunrise paints the Glendale sky gold.mp3');

try {
  fs.copyFileSync(songSourcePath, songDestPath);
  console.log('Successfully copied song file to public assets');
} catch (error) {
  console.error('Error copying song file:', error);
}