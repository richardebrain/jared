/**
 * Process CSV Video Library and Add to Main Video Resources
 * Converts the comprehensive CSV library into the format used by the platform
 */

const fs = require('fs');
const path = require('path');

// Read the CSV file and extract video data
function processVideoLibrary() {
  const csvPath = path.join(__dirname, '..', 'attached_assets', 'Video-Library-8-2024 22.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const videoResources = [];
  let videoCount = 0;
  
  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handling commas in quoted fields)
    const fields = parseCSVLine(line);
    
    if (fields.length < 5) continue; // Skip incomplete rows
    
    const topic = fields[0] || 'General';
    const subtopic = fields[1] || '';
    const citation = fields[2] || '';
    const titleDesc = fields[3] || '';
    const linkToVideo = fields[4] || '';
    const duration = fields[5] || '';
    const year = fields[6] || '';
    const standards = fields[7] || '';
    const practices = fields[8] || '';
    
    // Extract title from title/description field
    const title = titleDesc.split(':')[0]?.trim() || 'Educational Video';
    const description = titleDesc.includes(':') ? titleDesc.split(':').slice(1).join(':').trim() : titleDesc;
    
    // Extract YouTube video ID if it's a YouTube link
    let youtubeId = '';
    if (linkToVideo.includes('youtube.com/watch?v=')) {
      const match = linkToVideo.match(/v=([^&]+)/);
      youtubeId = match ? match[1] : '';
    } else if (linkToVideo.includes('youtu.be/')) {
      const match = linkToVideo.match(/youtu\.be\/([^?]+)/);
      youtubeId = match ? match[1] : '';
    }
    
    // Only include videos with YouTube IDs for the main platform
    if (!youtubeId) continue;
    
    videoCount++;
    
    const videoResource = {
      id: `csv-video-${videoCount.toString().padStart(3, '0')}`,
      title: title.substring(0, 100), // Limit title length
      description: description.substring(0, 500), // Limit description length
      youtubeId: youtubeId,
      category: [topic, subtopic].filter(Boolean),
      tags: [
        topic.toLowerCase().replace(/\s+/g, '-'),
        subtopic.toLowerCase().replace(/\s+/g, '-'),
        'professional-development',
        'early-childhood',
        'education'
      ].filter(Boolean),
      duration: parseDuration(duration),
      source: 'Professional Development Library',
      expertLevel: 'intermediate',
      dateAdded: new Date().toISOString().split('T')[0],
      featured: false,
      citation: citation,
      standards: standards,
      practices: practices,
      year: year
    };
    
    videoResources.push(videoResource);
  }
  
  return videoResources;
}

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to parse duration
function parseDuration(durationStr) {
  if (!durationStr) return 5; // Default 5 minutes
  
  // Try to extract minutes from various formats
  const match = durationStr.match(/(\d+):(\d+)/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes + (seconds > 30 ? 1 : 0); // Round up if > 30 seconds
  }
  
  // Look for just minutes
  const minuteMatch = durationStr.match(/(\d+)/);
  if (minuteMatch) {
    return Math.max(1, parseInt(minuteMatch[1]));
  }
  
  return 5; // Default fallback
}

// Generate the additional video resources to append
const newVideos = processVideoLibrary();

console.log(`Processed ${newVideos.length} videos from CSV library`);

// Write to a separate file that can be imported
const outputContent = `// Auto-generated from CSV Video Library
export const csvVideoLibrary = ${JSON.stringify(newVideos, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'shared', 'csvVideoLibrary.ts'), outputContent);

console.log('CSV video library processed and saved to shared/csvVideoLibrary.ts');
console.log(`Total videos with YouTube IDs: ${newVideos.length}`);

// Display sample of categories
const categories = [...new Set(newVideos.map(v => v.category[0]))];
console.log(`Categories: ${categories.join(', ')}`);