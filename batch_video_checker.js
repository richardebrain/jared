/**
 * Batch YouTube Video Checker
 * 
 * This script checks the availability of multiple YouTube videos at once
 * from our video resources library.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read videoResources.ts file
const videoResourcesFile = path.join(__dirname, 'shared', 'videoResources.ts');
const fileContent = fs.readFileSync(videoResourcesFile, 'utf8');

// Extract YouTube IDs using regex
const youtubeIdRegex = /youtubeId:\s*["']([^"']+)["']/g;
const allMatches = [...fileContent.matchAll(youtubeIdRegex)];

// Store YouTube IDs and their line numbers
const youtubeIds = allMatches.map(match => {
  return match[1].trim();
});

console.log(`Found ${youtubeIds.length} YouTube IDs in the video resources file.`);

// Function to check if a YouTube video is available
async function checkYouTubeVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ id: videoId, available: true });
      } else {
        resolve({ id: videoId, available: false });
      }
    }).on('error', () => {
      resolve({ id: videoId, available: false });
    });
  });
}

// Check all videos
async function checkAllVideos() {
  console.log(`Checking ${youtubeIds.length} videos for availability...`);
  
  const results = [];
  const unavailableVideos = [];
  const availableCount = { count: 0 };
  
  // Process videos in batches to avoid overwhelming the API
  const batchSize = 5;
  
  for (let i = 0; i < youtubeIds.length; i += batchSize) {
    const batch = youtubeIds.slice(i, i + batchSize);
    const batchPromises = batch.map(id => checkYouTubeVideo(id));
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.available) {
        availableCount.count++;
      } else {
        unavailableVideos.push(result.id);
      }
    });
    
    results.push(...batchResults);
    
    console.log(`Checked ${Math.min(i + batchSize, youtubeIds.length)}/${youtubeIds.length} videos. ${availableCount.count} available, ${unavailableVideos.length} unavailable.`);
    
    // Add a small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log("\n=== RESULTS ===");
  console.log(`Total videos checked: ${results.length}`);
  console.log(`Available videos: ${availableCount.count}`);
  console.log(`Unavailable videos: ${unavailableVideos.length}`);
  
  if (unavailableVideos.length > 0) {
    console.log("\nUnavailable videos (YouTube IDs):");
    unavailableVideos.forEach(id => {
      console.log(`- ${id}`);
    });
  }
}

// Start checking videos
checkAllVideos().catch(err => {
  console.error('Error running video checks:', err);
});