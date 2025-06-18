import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import yauzl from 'yauzl';
import { promisify } from 'util';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/powerpoint';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    // Also check file extension as backup
    const allowedExtensions = ['.ppt', '.pptx'];
    const fileExtension = file.originalname.toLowerCase().substr(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log('File rejected:', { mimetype: file.mimetype, extension: fileExtension });
      cb(new Error('Invalid file type. Only PowerPoint files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Parse PowerPoint file and extract content
 * This is a mock implementation - in production you'd use a library like officegen or node-pptx
 */
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Extract actual content from PowerPoint file
    const slides = await extractPowerPointContent(filePath);

    // Clean up uploaded file after processing
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }, 1000);

    res.json({
      success: true,
      slides,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        slideCount: slides.length,
        processingDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('PowerPoint parsing error:', error);
    res.status(500).json({ 
      error: 'Failed to process PowerPoint file',
      details: error.message 
    });
  }
});

/**
 * Extract actual content from PowerPoint files including text, notes, and video links
 */
async function extractPowerPointContent(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const slides: any[] = [];
    
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(new Error(`Failed to open PowerPoint file: ${err.message}`));
        return;
      }

      const slideFiles: { [key: string]: Buffer } = {};
      const noteFiles: { [key: string]: Buffer } = {};
      const relationshipFiles: { [key: string]: Buffer } = {};
      
      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        const fileName = entry.fileName;

        // Extract slide content files
        if (fileName.match(/ppt\/slides\/slide\d+\.xml$/)) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.readEntry();
              return;
            }

            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(chunk));
            readStream.on('end', () => {
              slideFiles[fileName] = Buffer.concat(chunks);
              zipfile.readEntry();
            });
          });
        }
        // Extract notes content
        else if (fileName.match(/ppt\/notesSlides\/notesSlide\d+\.xml$/)) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.readEntry();
              return;
            }

            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(chunk));
            readStream.on('end', () => {
              noteFiles[fileName] = Buffer.concat(chunks);
              zipfile.readEntry();
            });
          });
        }
        // Extract relationship files for video links
        else if (fileName.match(/ppt\/slides\/_rels\/slide\d+\.xml\.rels$/)) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.readEntry();
              return;
            }

            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(chunk));
            readStream.on('end', () => {
              relationshipFiles[fileName] = Buffer.concat(chunks);
              zipfile.readEntry();
            });
          });
        }
        else {
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        try {
          // Process extracted content
          const slideNumbers = Object.keys(slideFiles)
            .map(f => parseInt(f.match(/slide(\d+)\.xml$/)?.[1] || '0'))
            .filter(n => n > 0)
            .sort((a, b) => a - b);

          for (const slideNum of slideNumbers) {
            const slideFile = `ppt/slides/slide${slideNum}.xml`;
            const noteFile = `ppt/notesSlides/notesSlide${slideNum}.xml`;
            const relsFile = `ppt/slides/_rels/slide${slideNum}.xml.rels`;

            const slideContent = slideFiles[slideFile];
            const noteContent = noteFiles[noteFile];
            const relsContent = relationshipFiles[relsFile];

            if (slideContent) {
              const slide = parseSlideContent(slideContent.toString(), slideNum);
              
              // Add notes if available
              if (noteContent) {
                slide.notes = parseNotesContent(noteContent.toString());
              }

              // Extract video links if available
              if (relsContent) {
                slide.videoLinks = extractVideoLinks(relsContent.toString());
              }

              slides.push(slide);
            }
          }

          resolve(slides);
        } catch (parseError) {
          reject(new Error(`Failed to parse PowerPoint content: ${parseError.message}`));
        }
      });

      zipfile.on('error', (err) => {
        reject(new Error(`Error reading PowerPoint file: ${err.message}`));
      });
    });
  });
}

/**
 * Parse slide XML content to extract text and title
 */
function parseSlideContent(xmlContent: string, slideNumber: number) {
  // Extract title from slide
  const titleMatch = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/);
  let title = titleMatch ? titleMatch[1].trim() : `Slide ${slideNumber}`;

  // Extract all text content
  const textMatches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
  const allText = textMatches
    .map(match => match.replace(/<\/?[^>]+>/g, '').trim())
    .filter(text => text.length > 0)
    .join(' ');

  // If we have multiple text elements, use the first as title and rest as content
  if (textMatches.length > 1) {
    const texts = textMatches
      .map(match => match.replace(/<\/?[^>]+>/g, '').trim())
      .filter(text => text.length > 0);
    
    title = texts[0];
    const content = texts.slice(1).join(' ');
    
    return {
      slideNumber,
      title,
      content: content || allText,
      notes: '',
      videoLinks: []
    };
  }

  return {
    slideNumber,
    title,
    content: allText,
    notes: '',
    videoLinks: []
  };
}

/**
 * Parse notes XML content
 */
function parseNotesContent(xmlContent: string): string {
  const textMatches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
  return textMatches
    .map(match => match.replace(/<\/?[^>]+>/g, '').trim())
    .filter(text => text.length > 0)
    .join(' ');
}

/**
 * Extract video links from relationship files
 */
function extractVideoLinks(relsContent: string): string[] {
  const videoLinks: string[] = [];
  
  // Look for external links that might be videos
  const linkMatches = relsContent.match(/Target="([^"]*(?:youtube|vimeo|video)[^"]*)"/gi) || [];
  
  for (const match of linkMatches) {
    const url = match.replace(/Target="([^"]*)"/, '$1');
    if (url && (url.includes('youtube') || url.includes('vimeo') || url.includes('video'))) {
      videoLinks.push(url);
    }
  }

  // Look for hyperlinks in the main content
  const hyperlinkMatches = relsContent.match(/Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/hyperlink"[^>]*Target="([^"]*)"/gi) || [];
  
  for (const match of hyperlinkMatches) {
    const url = match.match(/Target="([^"]*)"/)?.[1];
    if (url && (url.includes('youtube') || url.includes('vimeo') || url.includes('.mp4') || url.includes('.mov'))) {
      videoLinks.push(url);
    }
  }

  return [...new Set(videoLinks)]; // Remove duplicates
}

export default router;