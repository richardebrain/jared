#!/usr/bin/env node

/**
 * Enhanced Professional Development Video Library Import
 * 
 * This script imports ALL videos from the CSV including non-YouTube sources
 * with smart featured video selection for optimal loading performance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractVideoIdentifier(url) {
  if (!url) return null;
  
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return { type: 'youtube', id: match[1] };
  }
  
  // Professional platform patterns
  if (url.includes('eclkc.ohs.acf.hhs.gov')) {
    return { type: 'headstart', id: url.split('/').pop() || 'headstart-video' };
  }
  if (url.includes('connectmodules.dec-sped.org')) {
    return { type: 'connect', id: url.match(/video-(\d+-\d+)/)?.[1] || 'connect-video' };
  }
  if (url.includes('brightcove.net')) {
    return { type: 'brightcove', id: url.match(/videoId=(\w+)/)?.[1] || 'brightcove-video' };
  }
  if (url.includes('challengingbehavior.cbcs.usf.edu')) {
    return { type: 'ncpmi', id: 'pbs-video' };
  }
  if (url.includes('cdc.gov')) {
    return { type: 'cdc', id: 'cdc-video' };
  }
  if (url.includes('zerotothree.org')) {
    return { type: 'zerotothree', id: url.split('/').pop() || 'zerotothree-video' };
  }
  if (url.includes('pathways.org')) {
    return { type: 'pathways', id: 'pathways-video' };
  }
  
  // Generic external video
  return { type: 'external', id: url.split('/').pop() || 'external-video' };
}

function parseDuration(durationStr) {
  if (!durationStr) return 5;
  
  const parts = durationStr.split(':').map(p => parseInt(p) || 0);
  
  if (parts.length === 2) {
    return parts[0];
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1];
  }
  
  return 5;
}

function categorizeVideo(topic, subtopic) {
  const categories = [];
  
  if (topic) categories.push(topic.toLowerCase().replace(/\s+/g, '-'));
  if (subtopic) categories.push(subtopic.toLowerCase().replace(/\s+/g, '-'));
  
  return categories.length > 0 ? categories : ['professional-development'];
}

function determineExpertLevel(topic, description) {
  const beginner = ['basic', 'introduction', 'overview', 'getting started'];
  const advanced = ['advanced', 'complex', 'in-depth', 'specialist'];
  
  const text = `${topic} ${description}`.toLowerCase();
  
  if (beginner.some(word => text.includes(word))) return 'beginner';
  if (advanced.some(word => text.includes(word))) return 'advanced';
  
  return 'intermediate';
}

function generateTags(topic, subtopic, description) {
  const tags = ['professional-development'];
  
  if (topic) tags.push(topic.toLowerCase().replace(/\s+/g, '-'));
  if (subtopic) tags.push(subtopic.toLowerCase().replace(/\s+/g, '-'));
  
  const keyTerms = ['assessment', 'development', 'behavior', 'learning', 'family', 'intervention'];
  keyTerms.forEach(term => {
    if (description && description.toLowerCase().includes(term)) {
      tags.push(term);
    }
  });
  
  return [...new Set(tags)];
}

function shouldBeFeatured(index, topic, subtopic, videoIdentifier) {
  // Feature first 30 videos
  if (index < 30) return true;
  
  // Feature key assessment videos
  if (topic === 'Assessment' && videoIdentifier.type === 'youtube') return true;
  
  // Feature core development content
  if (topic === 'Development' && index < 50) return true;
  
  // Feature key professional sources
  if (['headstart', 'connect'].includes(videoIdentifier.type) && index < 100) return true;
  
  return false;
}

function processCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields.map(field => field.replace(/^"|"$/g, ''));
}

async function importEnhancedVideoLibrary() {
  try {
    console.log('🎬 Starting enhanced video library import...');
    
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'Video-Library-8-2024 22.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Processing ${lines.length} lines from CSV...`);
    
    const videos = [];
    let videoIndex = 1;
    let featuredCount = 0;
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = processCSVLine(line);
      const [topic, subtopic, citation, title, videoUrl, duration, year, standards, practices] = fields;
      
      if (!title || !videoUrl) continue;
      
      const videoIdentifier = extractVideoIdentifier(videoUrl);
      if (!videoIdentifier) continue;
      
      const isFeatured = shouldBeFeatured(videoIndex, topic, subtopic, videoIdentifier);
      if (isFeatured) featuredCount++;
      
      const video = {
        id: `prof-dev-${videoIndex}`,
        title: title.split(':')[0].trim() || `Professional Development Video ${videoIndex}`,
        description: title.includes(':') ? title.split(':').slice(1).join(':').trim() : title,
        videoType: videoIdentifier.type,
        videoId: videoIdentifier.id,
        youtubeId: videoIdentifier.type === 'youtube' ? videoIdentifier.id : null,
        externalUrl: videoIdentifier.type !== 'youtube' ? videoUrl : null,
        category: categorizeVideo(topic, subtopic),
        tags: generateTags(topic, subtopic, title),
        duration: parseDuration(duration),
        source: getSourceName(videoIdentifier.type),
        expertLevel: determineExpertLevel(topic, title),
        dateAdded: "2025-05-30",
        featured: isFeatured,
        citation: citation || '',
        standards: standards || '',
        practices: practices || '',
        year: year || '2024',
        topic: topic || '',
        subtopic: subtopic || '',
        platform: videoIdentifier.type
      };
      
      videos.push(video);
      videoIndex++;
    }
    
    console.log(`✅ Processed ${videos.length} professional development videos`);
    console.log(`⭐ Featured videos for fast loading: ${featuredCount}`);
    
    // Generate the enhanced video library file
    const outputContent = `// Enhanced Professional Development Video Library
// Imported from Video-Library-8-2024 22.csv with all platforms supported
// Total videos: ${videos.length}
// Featured videos: ${featuredCount}

export interface EnhancedProfessionalVideo {
  id: string;
  title: string;
  description: string;
  videoType: string; // 'youtube', 'headstart', 'connect', 'brightcove', etc.
  videoId: string;
  youtubeId: string | null;
  externalUrl: string | null;
  category: string[];
  tags: string[];
  duration: number;
  source: string;
  expertLevel: string;
  dateAdded: string;
  featured: boolean;
  citation: string;
  standards: string;
  practices: string;
  year: string;
  topic: string;
  subtopic: string;
  platform: string;
}

export const enhancedProfessionalVideoLibrary: EnhancedProfessionalVideo[] = ${JSON.stringify(videos, null, 2)};

// Featured videos for main library display (fast loading)
export const featuredProfessionalVideos = enhancedProfessionalVideoLibrary.filter(video => video.featured);

// YouTube-only videos for embedded playback
export const youtubeProfessionalVideos = enhancedProfessionalVideoLibrary.filter(video => video.videoType === 'youtube');

export default enhancedProfessionalVideoLibrary;
`;
    
    const outputPath = path.join(__dirname, '..', 'shared', 'enhancedProfessionalVideoLibrary.ts');
    fs.writeFileSync(outputPath, outputContent);
    
    console.log(`🎯 Enhanced video library written to: ${outputPath}`);
    console.log(`📹 Total videos imported: ${videos.length}`);
    console.log(`⭐ Featured videos: ${featuredCount}`);
    
    // Show platform breakdown
    const platformCount = {};
    videos.forEach(video => {
      platformCount[video.platform] = (platformCount[video.platform] || 0) + 1;
    });
    
    console.log('\n📊 Platform breakdown:');
    Object.entries(platformCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} videos`);
      });
    
    return { total: videos.length, featured: featuredCount };
    
  } catch (error) {
    console.error('❌ Error importing enhanced video library:', error);
    throw error;
  }
}

function getSourceName(type) {
  const sources = {
    youtube: 'YouTube',
    headstart: 'Head Start ECLKC',
    connect: 'DEC CONNECT',
    brightcove: 'American Academy of Pediatrics',
    ncpmi: 'NCPMI/PBS',
    cdc: 'CDC',
    zerotothree: 'Zero to Three',
    pathways: 'Pathways.org',
    external: 'Professional Development Library'
  };
  
  return sources[type] || 'Professional Development Library';
}

// Run the enhanced import
importEnhancedVideoLibrary()
  .then(result => {
    console.log(`\n🎉 Enhanced import complete!`);
    console.log(`📚 Total library: ${result.total} videos`);
    console.log(`⚡ Fast-loading featured collection: ${result.featured} videos`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Enhanced import failed:', error);
    process.exit(1);
  });