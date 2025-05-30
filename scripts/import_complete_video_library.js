#!/usr/bin/env node

/**
 * Import Complete Professional Development Video Library
 * 
 * This script processes the comprehensive Video-Library-8-2024 22.csv file
 * and creates a complete video resources library for the platform.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractYouTubeId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function parseDuration(durationStr) {
  if (!durationStr) return 5; // Default 5 minutes
  
  // Handle formats like "6:30", "1:19:07", "25:50"
  const parts = durationStr.split(':').map(p => parseInt(p) || 0);
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 60 + parts[1];
  }
  
  return 5; // Default fallback
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
  
  // Extract key terms from description
  const keyTerms = ['assessment', 'development', 'behavior', 'learning', 'family', 'intervention'];
  keyTerms.forEach(term => {
    if (description && description.toLowerCase().includes(term)) {
      tags.push(term);
    }
  });
  
  return [...new Set(tags)]; // Remove duplicates
}

function processCSVLine(line) {
  // Split by comma but handle quoted fields
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
  
  fields.push(current.trim()); // Add the last field
  
  return fields.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

async function importCompleteVideoLibrary() {
  try {
    console.log('🎬 Starting complete video library import...');
    
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'Video-Library-8-2024 22.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Processing ${lines.length} lines from CSV...`);
    
    const videos = [];
    let videoIndex = 1;
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = processCSVLine(line);
      
      // Extract fields based on CSV structure
      const [topic, subtopic, citation, title, videoUrl, duration, year, standards, practices] = fields;
      
      if (!title || !videoUrl) continue;
      
      const youtubeId = extractYouTubeId(videoUrl);
      if (!youtubeId) continue;
      
      const video = {
        id: `prof-dev-${videoIndex}`,
        title: title.split(':')[0].trim() || `Professional Development Video ${videoIndex}`,
        description: title.includes(':') ? title.split(':').slice(1).join(':').trim() : title,
        youtubeId: youtubeId,
        category: categorizeVideo(topic, subtopic),
        tags: generateTags(topic, subtopic, title),
        duration: parseDuration(duration),
        source: "Professional Development Library",
        expertLevel: determineExpertLevel(topic, title),
        dateAdded: "2025-05-30",
        featured: i <= 20, // Feature first 20 videos
        citation: citation || '',
        standards: standards || '',
        practices: practices || '',
        year: year || '2024',
        topic: topic || '',
        subtopic: subtopic || ''
      };
      
      videos.push(video);
      videoIndex++;
    }
    
    console.log(`✅ Processed ${videos.length} professional development videos`);
    
    // Generate the complete video library file
    const outputContent = `// Complete Professional Development Video Library
// Imported from Video-Library-8-2024 22.csv
// Total videos: ${videos.length}

export interface ProfessionalVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
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
}

export const professionalVideoLibrary: ProfessionalVideo[] = ${JSON.stringify(videos, null, 2)};

export default professionalVideoLibrary;
`;
    
    const outputPath = path.join(__dirname, '..', 'shared', 'professionalVideoLibrary.ts');
    fs.writeFileSync(outputPath, outputContent);
    
    console.log(`🎯 Complete video library written to: ${outputPath}`);
    console.log(`📹 Total videos imported: ${videos.length}`);
    
    // Show category breakdown
    const categoryCount = {};
    videos.forEach(video => {
      video.category.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    
    console.log('\n📊 Category breakdown:');
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} videos`);
      });
    
    return videos.length;
    
  } catch (error) {
    console.error('❌ Error importing video library:', error);
    throw error;
  }
}

// Run the import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCompleteVideoLibrary()
    .then(count => {
      console.log(`\n🎉 Successfully imported ${count} professional development videos!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importCompleteVideoLibrary };