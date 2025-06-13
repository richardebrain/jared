import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
    const allowedTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
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
    
    // Mock PowerPoint parsing - in production, use proper PPTX parsing library
    const mockSlides = [
      {
        slideNumber: 1,
        title: 'Introduction to Early Childhood Development',
        content: 'Welcome to our comprehensive training on early childhood development. In this module, we will explore the fundamental principles that guide how children grow and learn during their most formative years.',
        notes: 'Start with an engaging introduction that sets the tone for learning. Encourage participants to think about their own experiences with children.'
      },
      {
        slideNumber: 2,
        title: 'Key Developmental Milestones',
        content: 'Children reach important milestones in physical, cognitive, emotional, and social development. Understanding these milestones helps teachers provide appropriate support and activities.',
        notes: 'Reference the developmental charts and encourage teachers to observe children in their care.'
      },
      {
        slideNumber: 3,
        title: 'Creating Supportive Learning Environments',
        content: 'The physical and emotional environment plays a crucial role in child development. Safe, nurturing spaces promote exploration and learning.',
        notes: 'Show examples of well-designed classroom spaces and discuss how environment affects behavior.'
      },
      {
        slideNumber: 4,
        title: 'Communication Strategies',
        content: 'Effective communication with young children requires patience, clarity, and understanding of their developmental stage. Use positive language and active listening.',
        notes: 'Practice examples of positive vs negative communication. Role-play common scenarios.'
      },
      {
        slideNumber: 5,
        title: 'Assessment and Documentation',
        content: 'Regular observation and documentation help track child progress and inform curriculum planning. Use various assessment methods appropriate for young children.',
        notes: 'Discuss portfolio development and authentic assessment strategies.'
      }
    ];

    // Clean up uploaded file after processing
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }, 1000);

    res.json({
      success: true,
      slides: mockSlides,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        slideCount: mockSlides.length,
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

export default router;