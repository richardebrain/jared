/**
 * Import Video Library from CSV
 * 
 * This script processes the comprehensive video library CSV and integrates
 * it with the existing video resources for the AI module wizard.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function importVideoLibrary() {
  try {
    console.log('Reading video library CSV...');
    
    const csvPath = path.join(process.cwd(), 'attached_assets', 'Video-Library-8-2024 22.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} video records`);
    
    // Transform CSV data to match video resource format
    const videoResources = records.map((record, index) => {
      // Extract YouTube video ID from URL if it's a YouTube link
      let videoId = null;
      const youtubeUrl = record['Link to Video'];
      if (youtubeUrl && youtubeUrl.includes('youtube.com/watch?v=')) {
        const match = youtubeUrl.match(/v=([^&]+)/);
        videoId = match ? match[1] : null;
      }
      
      return {
        id: `imported-${index + 1}`,
        title: record['Title/Description']?.split(':')[0]?.trim() || 'Untitled Video',
        description: record['Title/Description'] || '',
        url: record['Link to Video'] || '',
        videoId: videoId,
        duration: record['Length of Video'] || '',
        category: record['Topic'] || 'General',
        subcategory: record['Subtopic'] || '',
        year: record['Year Created'] || '',
        citation: record['Suggested Citation'] || '',
        standards: record['EI/ECSE Standards'] || '',
        practices: record['DEC Recommended Practices'] || '',
        tags: [
          record['Topic']?.toLowerCase(),
          record['Subtopic']?.toLowerCase(),
          'professional-development',
          'early-childhood'
        ].filter(Boolean)
      };
    });
    
    // Update the video resources file
    const videoResourcesPath = path.join(process.cwd(), 'shared', 'videoResources.ts');
    const importedLibrary = `// Imported Video Library from CSV
export const importedVideoLibrary = ${JSON.stringify(videoResources, null, 2)};

// Export function to merge with existing videos
export function getAllVideoResources() {
  return [...videoResources, ...importedVideoLibrary];
}
`;
    
    fs.writeFileSync(videoResourcesPath.replace('.ts', '-imported.ts'), importedLibrary);
    
    console.log('Video library imported successfully!');
    console.log(`- Total videos: ${videoResources.length}`);
    console.log(`- Categories: ${[...new Set(videoResources.map(v => v.category))].join(', ')}`);
    console.log(`- YouTube videos: ${videoResources.filter(v => v.videoId).length}`);
    
    return videoResources;
    
  } catch (error) {
    console.error('Error importing video library:', error);
    throw error;
  }
}

// Run import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importVideoLibrary();
}

export { importVideoLibrary };