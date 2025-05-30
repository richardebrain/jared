#!/usr/bin/env node

/**
 * Analyze Missing Videos from CSV Import
 * 
 * This script analyzes why some videos weren't imported and provides
 * detailed reporting on the missing entries.
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
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /eclkc\.ohs\.acf\.hhs\.gov/, // Head Start videos
    /players\.brightcove\.net/, // Brightcove videos
    /connectmodules\.dec-sped\.org/, // CONNECT module videos
    /challengingbehavior\.cbcs\.usf\.edu/, // PBS videos
    /www\.cdc\.gov/ // CDC videos
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && pattern.source.includes('youtube')) {
      return match[1];
    } else if (match) {
      // For non-YouTube videos, create a unique identifier
      return `external-${url.split('/').pop() || Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  return null;
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

async function analyzeMissingVideos() {
  try {
    console.log('🔍 Analyzing missing videos from CSV import...');
    
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'Video-Library-8-2024 22.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Total lines in CSV: ${lines.length}`);
    console.log(`📊 Video entries to process: ${lines.length - 1}`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let missingTitle = 0;
    let missingUrl = 0;
    let invalidUrl = 0;
    let nonYouTubeCount = 0;
    
    const skippedEntries = [];
    const nonYouTubeEntries = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skippedCount++;
        continue;
      }
      
      const fields = processCSVLine(line);
      const [topic, subtopic, citation, title, videoUrl, duration, year, standards, practices] = fields;
      
      if (!title) {
        missingTitle++;
        skippedEntries.push({ line: i + 1, reason: 'Missing title', data: fields.slice(0, 5) });
        skippedCount++;
        continue;
      }
      
      if (!videoUrl) {
        missingUrl++;
        skippedEntries.push({ line: i + 1, reason: 'Missing URL', title, data: fields.slice(0, 5) });
        skippedCount++;
        continue;
      }
      
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        invalidUrl++;
        skippedEntries.push({ line: i + 1, reason: 'Invalid URL format', title, url: videoUrl });
        skippedCount++;
        continue;
      }
      
      // Check if it's a non-YouTube video
      if (videoId.startsWith('external-') || !videoUrl.includes('youtube')) {
        nonYouTubeCount++;
        nonYouTubeEntries.push({ 
          line: i + 1, 
          title, 
          url: videoUrl, 
          topic, 
          subtopic,
          source: extractSource(videoUrl)
        });
        // Don't skip these, just track them
      }
      
      processedCount++;
    }
    
    console.log('\n📈 Import Analysis Results:');
    console.log(`✅ Successfully processed: ${processedCount} videos`);
    console.log(`❌ Skipped entries: ${skippedCount} videos`);
    console.log(`🎥 Non-YouTube videos: ${nonYouTubeCount} videos`);
    
    console.log('\n📊 Breakdown of skipped entries:');
    console.log(`   Missing titles: ${missingTitle}`);
    console.log(`   Missing URLs: ${missingUrl}`);
    console.log(`   Invalid URL format: ${invalidUrl}`);
    
    if (skippedEntries.length > 0) {
      console.log('\n❌ Sample skipped entries:');
      skippedEntries.slice(0, 10).forEach(entry => {
        console.log(`   Line ${entry.line}: ${entry.reason}`);
        if (entry.title) console.log(`      Title: ${entry.title}`);
        if (entry.url) console.log(`      URL: ${entry.url}`);
      });
    }
    
    if (nonYouTubeEntries.length > 0) {
      console.log('\n🌐 Non-YouTube video sources found:');
      const sources = {};
      nonYouTubeEntries.forEach(entry => {
        sources[entry.source] = (sources[entry.source] || 0) + 1;
      });
      
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} videos`);
      });
      
      console.log('\n📝 Sample non-YouTube entries:');
      nonYouTubeEntries.slice(0, 5).forEach(entry => {
        console.log(`   Line ${entry.line}: ${entry.title}`);
        console.log(`      Source: ${entry.source}`);
        console.log(`      URL: ${entry.url}`);
      });
    }
    
    console.log(`\n🎯 Potential total if all videos were included: ${processedCount + nonYouTubeCount} videos`);
    
    return {
      processed: processedCount,
      skipped: skippedCount,
      nonYouTube: nonYouTubeCount,
      total: lines.length - 1
    };
    
  } catch (error) {
    console.error('❌ Error analyzing videos:', error);
    throw error;
  }
}

function extractSource(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('eclkc.ohs.acf.hhs.gov')) return 'Head Start ECLKC';
  if (url.includes('brightcove.net')) return 'Brightcove/AAP';
  if (url.includes('connectmodules.dec-sped.org')) return 'DEC CONNECT';
  if (url.includes('challengingbehavior.cbcs.usf.edu')) return 'NCPMI/PBS';
  if (url.includes('cdc.gov')) return 'CDC';
  if (url.includes('vimeo.com')) return 'Vimeo';
  return 'Other';
}

// Run the analysis
analyzeMissingVideos()
  .then(results => {
    console.log(`\n🎉 Analysis complete!`);
    console.log(`Current import captures ${Math.round((results.processed / results.total) * 100)}% of available videos`);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });