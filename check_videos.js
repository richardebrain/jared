// Script to check for unavailable YouTube videos
import https from 'https';
import fs from 'fs';

// Read the video resources file
const fileContent = fs.readFileSync('./shared/videoResources.ts', 'utf8');

// Extract all YouTube IDs using regex
const youtubeIdRegex = /youtubeId:\s*"([^"]+)"/g;
let match;
const youtubeIds = [];

while ((match = youtubeIdRegex.exec(fileContent)) !== null) {
  youtubeIds.push(match[1].trim());
}

console.log(`Found ${youtubeIds.length} YouTube IDs to check...`);

// Function to check if a YouTube video is available
function checkYouTubeVideo(videoId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ id: videoId, available: true });
      } else {
        resolve({ id: videoId, available: false });
      }
    }).on('error', (e) => {
      console.error(`Error checking video ${videoId}: ${e.message}`);
      resolve({ id: videoId, available: false, error: e.message });
    });
  });
}

// Check all videos with a small delay to avoid rate limiting
async function checkAllVideos() {
  const results = [];
  const unavailableVideos = [];
  
  for (let i = 0; i < youtubeIds.length; i++) {
    const id = youtubeIds[i];
    
    // Add a small delay between requests to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      const result = await checkYouTubeVideo(id);
      results.push(result);
      
      if (!result.available) {
        unavailableVideos.push(id);
        console.log(`🚫 Video unavailable: ${id}`);
      } else {
        process.stdout.write('.');
        if (i % 50 === 0 && i > 0) {
          process.stdout.write('\n');
        }
      }
    } catch (error) {
      console.error(`Error checking video ${id}:`, error);
    }
  }
  
  console.log('\n\nResults:');
  console.log(`Total videos checked: ${results.length}`);
  console.log(`Available videos: ${results.filter(r => r.available).length}`);
  console.log(`Unavailable videos: ${unavailableVideos.length}`);
  
  if (unavailableVideos.length > 0) {
    console.log('\nUnavailable Video IDs:');
    unavailableVideos.forEach(id => {
      console.log(`- ${id}`);
    });
  }
}

checkAllVideos();