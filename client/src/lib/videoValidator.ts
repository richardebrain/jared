/**
 * Client-side utility for validating YouTube videos
 * This can be used from the browser console to check all videos in the library
 */

import { VideoResource } from '@shared/videoResources';

/**
 * Checks if a YouTube video is valid/available
 * @param youtubeId The YouTube video ID to check
 * @returns Promise that resolves to true if the video is valid, false otherwise
 */
export const checkYouTubeVideo = async (youtubeId: string): Promise<boolean> => {
  try {
    // Clean the ID by trimming any whitespace
    const cleanId = youtubeId.trim();
    
    // Use the YouTube oEmbed API to check if the video exists
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`,
      { method: 'GET' }
    );
    
    return response.ok;
  } catch (error) {
    console.error(`Error checking YouTube video ${youtubeId}:`, error);
    return false;
  }
};

/**
 * Validates all videos in the provided array
 * @param videos Array of video resources to validate
 * @returns Object containing validation results
 */
export const validateAllVideos = async (videos: VideoResource[]) => {
  const results = {
    total: videos.length,
    available: 0,
    unavailable: [] as Array<{
      id: string;
      title: string;
      youtubeId: string;
    }>
  };
  
  console.log(`Validating ${videos.length} videos...`);
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`Checking video ${i+1}/${videos.length}: ${video.title}`);
    
    const isValid = await checkYouTubeVideo(video.youtubeId);
    
    if (isValid) {
      results.available++;
      console.log(`✅ Video ${video.id} is valid`);
    } else {
      results.unavailable.push({
        id: video.id,
        title: video.title,
        youtubeId: video.youtubeId
      });
      console.warn(`❌ Video ${video.id} is INVALID: "${video.title}" (${video.youtubeId})`);
    }
    
    // Add a small delay to avoid rate limiting
    if (i < videos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n=== VALIDATION RESULTS ===');
  console.log(`Total videos checked: ${results.total}`);
  console.log(`Available videos: ${results.available}`);
  console.log(`Unavailable videos: ${results.unavailable.length}`);
  
  if (results.unavailable.length > 0) {
    console.log('\nUnavailable videos:');
    results.unavailable.forEach(video => {
      console.log(`- ${video.id}: "${video.title}" (${video.youtubeId})`);
    });
  }
  
  return results;
};

// Make the functions available globally for console access
declare global {
  interface Window {
    validateAllVideos: (videos?: VideoResource[]) => Promise<any>;
    checkYouTubeVideo: (youtubeId: string) => Promise<boolean>;
    videoResourcesData?: VideoResource[];
  }
}

// Expose functions for the browser console
if (typeof window !== 'undefined') {
  window.validateAllVideos = async (videos) => {
    // Use passed videos array or try to find videos in the global scope
    const videosToValidate = videos || window.videoResourcesData;
    
    if (!videosToValidate || !Array.isArray(videosToValidate) || videosToValidate.length === 0) {
      console.error('No videos found to validate! Make sure you run this on a page with videos loaded.');
      return null;
    }
    
    return await validateAllVideos(videosToValidate);
  };
  
  window.checkYouTubeVideo = checkYouTubeVideo;
}

export default {
  checkYouTubeVideo,
  validateAllVideos
};