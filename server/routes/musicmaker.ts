import { Router } from 'express';
import axios from 'axios';
import { storage } from '../storage';

const router = Router();

// Helper function to get current week code in YYYY-WW format
function getWeekCode(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const week = String(Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getUTCDay() + 1) / 7)).padStart(2, "0");
  return `${year}-${week}`;
}

// Content filter for inappropriate language
const inappropriateWords = [
  "damn", "hell", "stupid", "idiot", "shut up", "hate", "kill", "die", 
  "dumb", "loser", "suck", "crap", "piss", "fart", "butt", "poop"
];

function containsInappropriateContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
}

// Get user's song generation status
router.get('/status', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a director/admin
    if (!user.isSchoolAdmin && !user.isAdmin && !user.isOwner) {
      return res.status(403).json({ error: 'Director access required' });
    }

    const currentWeek = getWeekCode();
    let usedThisWeek = false;

    if (user.lastRequestWeekStart === currentWeek && user.songRequestsThisWeek >= 1) {
      usedThisWeek = true;
    }

    res.json({
      usedThisWeek,
      requestsThisWeek: user.songRequestsThisWeek || 0,
      currentWeek
    });

  } catch (error) {
    console.error('Error getting song status:', error);
    res.status(500).json({ error: 'Failed to get song status' });
  }
});

// Generate a new song
router.post('/generate', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Song prompt is required' });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is a director/admin
    if (!user.isSchoolAdmin && !user.isAdmin && !user.isOwner) {
      return res.status(403).json({ error: 'Director access required' });
    }

    // Check weekly limit
    const currentWeek = getWeekCode();
    if (user.lastRequestWeekStart !== currentWeek) {
      // New week, reset counter
      user.songRequestsThisWeek = 0;
      user.lastRequestWeekStart = currentWeek;
    }

    if (user.songRequestsThisWeek >= 1) {
      return res.status(429).json({ 
        error: 'Weekly song limit reached. You can generate one song per week.' 
      });
    }

    // Content filter
    if (containsInappropriateContent(prompt)) {
      return res.status(400).json({ 
        error: 'Please remove inappropriate language and try again.' 
      });
    }

    // Check for GoAPI key
    if (!process.env.GOAPI_KEY) {
      return res.status(500).json({ 
        error: 'Song generation service is not configured. Please contact support.' 
      });
    }

    // Call GoAPI Suno endpoint
    console.log('Generating song with prompt:', prompt);
    
    const goResponse = await axios.post(
      'https://api.goapi.ai/api/suno/v1/music',
      {
        custom_mode: false,
        input: { 
          gpt_description_prompt: `Create a fun, educational children's song about: ${prompt}. Make it upbeat, positive, and appropriate for preschool children aged 3-5.` 
        }
      },
      { 
        headers: { 
          'X-API-Key': process.env.GOAPI_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('GoAPI response:', goResponse.data);

    // Update user usage counter
    user.songRequestsThisWeek = (user.songRequestsThisWeek || 0) + 1;
    user.lastRequestWeekStart = currentWeek;
    
    await storage.updateUser(user.id, {
      songRequestsThisWeek: user.songRequestsThisWeek,
      lastRequestWeekStart: user.lastRequestWeekStart
    });

    // Return the audio URL or task ID from GoAPI response
    res.json({
      success: true,
      audioUrl: goResponse.data.audio_url || null,
      taskId: goResponse.data.task_id || null,
      status: goResponse.data.status || 'processing',
      message: 'Song generation started successfully!'
    });

  } catch (error) {
    console.error('Error generating song:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'Song generation service authentication failed. Please contact support.' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Song generation service is busy. Please try again in a moment.' 
      });
    }

    res.status(500).json({ 
      error: 'Song generation failed. Please try again later.',
      details: error.message
    });
  }
});

// Check song generation status (for async processing)
router.get('/status/:taskId', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { taskId } = req.params;
    
    if (!process.env.GOAPI_KEY) {
      return res.status(500).json({ 
        error: 'Song generation service is not configured.' 
      });
    }

    const goResponse = await axios.get(
      `https://api.goapi.ai/api/suno/v1/music/${taskId}`,
      { 
        headers: { 
          'X-API-Key': process.env.GOAPI_KEY 
        },
        timeout: 10000
      }
    );

    res.json({
      status: goResponse.data.status,
      audioUrl: goResponse.data.audio_url || null,
      progress: goResponse.data.progress || null
    });

  } catch (error) {
    console.error('Error checking song status:', error);
    res.status(500).json({ 
      error: 'Failed to check song status',
      details: error.message
    });
  }
});

export default router;