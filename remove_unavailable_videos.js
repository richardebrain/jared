/**
 * Script to verify all videos in the library and generate a clean list
 * of only working videos. This script verifies each video using the YouTube
 * oEmbed API and removes any unavailable videos.
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

// Parse the video resources data
const videoResourcesRegex = /export const videoResourcesData: VideoResource\[] = \[([\s\S]*?)\];/;
const videoResourcesMatch = fileContent.match(videoResourcesRegex);

if (!videoResourcesMatch) {
  console.error("Failed to parse video resources from file.");
  process.exit(1);
}

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

// Extract each video object from the file content
const videoSectionContent = videoResourcesMatch[1];
const videoRegex = /\{[\s\S]*?id:\s*["']([^"']+)["'][\s\S]*?title:\s*["']([^"']+)["'][\s\S]*?youtubeId:\s*["']([^"']+)["'][\s\S]*?\}/g;
const videoMatches = [...videoSectionContent.matchAll(videoRegex)];

// Process each video
async function processVideos() {
  const videos = [];

  // Extract information for each video
  for (const match of videoMatches) {
    const videoEntry = {
      id: match[1],
      title: match[2],
      youtubeId: match[3],
      fullContent: match[0]
    };
    videos.push(videoEntry);
  }

  console.log(`Found ${videos.length} videos in the resources file.`);

  // Check each video for availability
  const results = [];
  const availableVideos = [];
  const unavailableVideos = [];

  console.log("Checking video availability...");
  
  for (const video of videos) {
    try {
      const result = await checkYouTubeVideo(video.youtubeId);
      const status = result.available ? '✅' : '❌';
      console.log(`${status} Video ${video.id} (${video.youtubeId}) - "${video.title}"`);
      
      results.push({
        ...video,
        available: result.available
      });
      
      if (result.available) {
        availableVideos.push(video);
      } else {
        unavailableVideos.push(video);
      }
    } catch (error) {
      console.error(`Error checking video ${video.id}:`, error);
      unavailableVideos.push(video);
    }
  }

  console.log(`\nResults: ${availableVideos.length} available, ${unavailableVideos.length} unavailable`);

  // Create new content with only available videos
  let newContent = fileContent.replace(
    /export const videoResourcesData: VideoResource\[] = \[([\s\S]*?)\];/,
    `export const videoResourcesData: VideoResource[] = [\n${availableVideos.map(v => v.fullContent).join(',\n')}\n];`
  );

  // Write the new content to the file
  fs.writeFileSync(videoResourcesFile, newContent);
  console.log(`\nUpdated ${videoResourcesFile} with ${availableVideos.length} working videos.`);
  
  // Write the list of unavailable videos for reference
  const unavailableVideosFile = path.join(__dirname, 'unavailable_videos.json');
  fs.writeFileSync(unavailableVideosFile, JSON.stringify(unavailableVideos, null, 2));
  console.log(`Wrote list of ${unavailableVideos.length} unavailable videos to ${unavailableVideosFile}`);
}

// Run the process
processVideos().catch(error => {
  console.error("Error processing videos:", error);
  process.exit(1);
});