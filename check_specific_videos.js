// Test specific videos that may be problematic
// Run this with Node.js to validate specific YouTube IDs

import https from 'https';

// The video IDs we want to test
const videoIdsToTest = [
  // Video IDs from our videoResources.ts that appear to be problematic
  "kBzZENz7BlA",   // Already replaced, but used as example
  "lJbGk2qc3-g",   // Just a random test
  "cistNfEvPHk",   // ID with a leading space
  "TpSzVg7YfX0",   // Another potential issue
  "mNXv8UVmRBA",   // Another potential issue
  "e7m2aSQW2o0",   // Another potential issue
  "P6sIrUZQwFM",   // Another potential issue
];

// Check if a YouTube video exists/is available
function checkYouTubeVideo(videoId) {
  return new Promise((resolve) => {
    const cleanVideoId = videoId.trim();
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanVideoId}&format=json`;
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ id: cleanVideoId, available: true });
      } else {
        resolve({ id: cleanVideoId, available: false, status: res.statusCode });
      }
    }).on('error', (e) => {
      resolve({ id: cleanVideoId, available: false, error: e.message });
    });
  });
}

// Check all the videos in our list
async function main() {
  console.log("Testing specific YouTube videos for availability...\n");
  
  for (const videoId of videoIdsToTest) {
    try {
      const result = await checkYouTubeVideo(videoId);
      if (result.available) {
        console.log(`✅ Video '${result.id}' is available`);
      } else {
        console.log(`❌ Video '${result.id}' is NOT available`);
      }
    } catch (error) {
      console.error(`Error checking video ${videoId}:`, error);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

main();