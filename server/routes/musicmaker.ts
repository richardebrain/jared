import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Generate a week code (YYYY-WW format)
function getWeekCode(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
}

// Check for inappropriate content
function containsInappropriateContent(text: string): boolean {
  const inappropriateWords = [
    'violence', 'violent', 'kill', 'death', 'hate', 'scary', 'nightmare',
    'monster', 'ghost', 'devil', 'hell', 'damn', 'stupid', 'dumb', 'idiot',
    'fight', 'punch', 'kick', 'hurt', 'pain', 'blood', 'gun', 'weapon'
  ];
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
}

// Get song generation status for current user
router.get('/status', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentWeek = getWeekCode();
    
    // Check user's current song usage using raw SQL
    const userResult = await db.execute(sql`
      SELECT song_requests_this_week, last_song_week 
      FROM users 
      WHERE id = ${userId}
    `);
    
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0] as any;
    
    // Handle missing columns gracefully
    const songRequestsThisWeek = Number(userData.song_requests_this_week) || 0;
    const lastSongWeek = String(userData.last_song_week) || '';
    
    const usedThisWeek = lastSongWeek === currentWeek && songRequestsThisWeek >= 1;

    res.json({
      usedThisWeek,
      requestsThisWeek: lastSongWeek === currentWeek ? songRequestsThisWeek : 0,
      currentWeek
    });
  } catch (error) {
    console.error('Error fetching song status:', error);
    res.status(500).json({ error: 'Failed to fetch song status' });
  }
});

// Generate a new song
router.post('/generate', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { prompt } = z.object({
      prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long')
    }).parse(req.body);

    // Check for inappropriate content
    if (containsInappropriateContent(prompt)) {
      return res.status(400).json({ 
        error: 'Content not appropriate for children. Please try a different theme.' 
      });
    }

    const currentWeek = getWeekCode();
    
    // Check user's current usage using raw SQL
    const userResult = await db.execute(sql`
      SELECT song_requests_this_week, last_song_week 
      FROM users 
      WHERE id = ${userId}
    `);
    
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0] as any;
    const songRequestsThisWeek = Number(userData.song_requests_this_week) || 0;
    const lastSongWeek = String(userData.last_song_week) || '';
    
    // Check if user has already used their weekly allowance
    if (lastSongWeek === currentWeek && songRequestsThisWeek >= 1) {
      return res.status(429).json({ 
        error: 'You have already generated your song for this week. Please try again next week.' 
      });
    }

    // Check if GOAPI_KEY is available
    if (!process.env.GOAPI_KEY) {
      return res.status(500).json({ 
        error: 'Music generation service not configured' 
      });
    }

    // Call GoAPI to generate the song using the music endpoint
    try {
      // Test multiple possible endpoint formats
      const endpoints = [
        'https://api.goapi.ai/api/v1/music',
        'https://api.goapi.ai/api/suno/v1/music',
        'https://api.goapi.ai/v1/music',
        'https://goapi.ai/api/v1/music'
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'X-API-Key': process.env.GOAPI_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: `Create a fun, educational children's song about: ${prompt}. Make it appropriate for preschoolers with simple words and a catchy melody.`,
              make_instrumental: false,
              wait_audio: true
            })
          });

          if (response.ok) {
            break; // Found working endpoint
          } else {
            lastError = await response.text();
            console.log(`Endpoint ${endpoint} failed with status ${response.status}: ${lastError}`);
            response = null;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed with error:`, err.message);
          lastError = err.message;
          response = null;
        }
      }

      if (!response || !response.ok) {
        console.error('All GoAPI endpoints failed. Last error:', lastError);
        return res.status(503).json({ 
          error: 'Music generation service is temporarily unavailable. Please check your GoAPI configuration or try again later.',
          details: 'Unable to connect to music generation API'
        });
      }

      const result = await response.json();
      
      // Update user's usage count using raw SQL
      try {
        const newRequestCount = lastSongWeek === currentWeek ? songRequestsThisWeek + 1 : 1;
        await db.execute(sql`
          UPDATE users 
          SET song_requests_this_week = ${newRequestCount}, last_song_week = ${currentWeek}
          WHERE id = ${userId}
        `);
      } catch (updateError) {
        console.warn('Failed to update user song usage:', updateError);
        // Continue with song generation even if usage tracking fails
      }

      if (result.status === 'completed' && result.data?.[0]?.audio_url) {
        // Song is ready immediately
        res.json({
          success: true,
          audioUrl: result.data[0].audio_url,
          status: 'completed'
        });
      } else if (result.task_id) {
        // Song is being processed
        res.json({
          success: true,
          taskId: result.task_id,
          status: 'processing'
        });
      } else {
        res.status(500).json({ 
          error: 'Unexpected response from music generation service' 
        });
      }

    } catch (apiError) {
      console.error('GoAPI request failed:', apiError);
      res.status(500).json({ 
        error: 'Music generation service unavailable. Please try again later.' 
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0]?.message || 'Invalid input' 
      });
    }
    
    console.error('Error generating song:', error);
    res.status(500).json({ error: 'Failed to generate song' });
  }
});

// Check status of a specific task
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!process.env.GOAPI_KEY) {
      return res.status(500).json({ 
        error: 'Music generation service not configured' 
      });
    }

    const response = await fetch(`https://api.goapi.ai/api/suno/v1/music/${taskId}`, {
      headers: {
        'X-API-Key': process.env.GOAPI_KEY
      }
    });

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Failed to check song status' 
      });
    }

    const result = await response.json();
    
    if (result.status === 'completed' && result.data?.[0]?.audio_url) {
      res.json({
        status: 'completed',
        audioUrl: result.data[0].audio_url
      });
    } else if (result.status === 'failed') {
      res.json({
        status: 'failed',
        error: 'Song generation failed'
      });
    } else {
      res.json({
        status: 'processing'
      });
    }

  } catch (error) {
    console.error('Error checking song status:', error);
    res.status(500).json({ error: 'Failed to check song status' });
  }
});

export { router as musicmakerRouter };