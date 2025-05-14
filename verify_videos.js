//==== COPY AND PASTE THIS IN THE BROWSER CONSOLE TO TEST THE VIDEOS ====

// Helper function to test if a YouTube video is valid
async function isYouTubeVideoValid(videoId) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId.trim()}&format=json`);
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Get all videos from our data and test them
async function checkAllVideos() {
  // Access the videoResourcesData from our app's context
  const videos = window.app?.videoResourcesData || [];
  
  if (!videos.length) {
    console.error("Could not access video data. Make sure to run this on the Video Library page.");
    return;
  }
  
  console.log(`Testing ${videos.length} videos for availability...`);
  
  const results = {
    total: videos.length,
    available: 0,
    unavailable: [],
  };
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const isValid = await isYouTubeVideoValid(video.youtubeId);
    
    if (isValid) {
      results.available++;
      console.log(`✅ Video ${i+1}/${videos.length}: ${video.id} - "${video.title}" is available`);
    } else {
      results.unavailable.push({
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title
      });
      console.log(`❌ Video ${i+1}/${videos.length}: ${video.id} - "${video.title}" is UNAVAILABLE`);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log("\n===== RESULTS =====");
  console.log(`Total videos tested: ${results.total}`);
  console.log(`Available videos: ${results.available}`);
  console.log(`Unavailable videos: ${results.unavailable.length}`);
  
  if (results.unavailable.length > 0) {
    console.log("\nList of unavailable videos:");
    results.unavailable.forEach(video => {
      console.log(`- ${video.id}: "${video.title}" (YouTube ID: ${video.youtubeId})`);
    });
  }
  
  // Add the results to window for easier access
  window.videoCheckResults = results;
  
  return results;
}

// Set a global reference to make it easy to access from browser console
window.checkAllVideos = checkAllVideos;
window.isYouTubeVideoValid = isYouTubeVideoValid;

console.log("Video verification utilities loaded.");
console.log("To check all videos, run: checkAllVideos()");
console.log("To check a specific video, run: isYouTubeVideoValid('YOUTUBE_ID_HERE')");