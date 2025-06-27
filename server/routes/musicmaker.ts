import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, songs, insertSongSchema } from '../../shared/schema';
import { eq, sql, desc } from 'drizzle-orm';

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

    // Call GoAPI to generate the song using Udio music generation
    try {
      const response = await fetch('https://api.goapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'X-API-Key': process.env.GOAPI_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'music-u',
          task_type: 'generate_music',
          input: {
            gpt_description_prompt: `Create a fun, educational children's song about: ${prompt}. Make it appropriate for preschoolers with simple words and a catchy melody. Use upbeat, cheerful music that kids will love to sing along with.`,
            negative_tags: 'scary, violent, inappropriate, adult content',
            lyrics_type: 'generate',
            seed: -1
          },
          config: {
            service_mode: 'public',
            webhook_config: {
              endpoint: '',
              secret: ''
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GoAPI error:', response.status, errorData);
        return res.status(500).json({ 
          error: 'Failed to generate song. Please try again.',
          details: 'Music generation service error'
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

      // Handle GoAPI task response format
      if (result.code === 200 && result.data) {
        const taskData = result.data;
        
        if (taskData.status === 'completed' && taskData.output?.audio_url) {
          // Song is ready immediately
          res.json({
            success: true,
            audioUrl: taskData.output.audio_url,
            status: 'completed'
          });
        } else if (taskData.task_id) {
          // Song is being processed
          res.json({
            success: true,
            taskId: taskData.task_id,
            status: taskData.status || 'processing'
          });
        } else {
          res.status(500).json({ 
            error: 'Song generation started but no task ID received',
            details: 'Please try again'
          });
        }
      } else {
        console.error('Unexpected GoAPI response:', result);
        res.status(500).json({ 
          error: result.message || 'Unexpected response from music generation service',
          details: 'Please check your API configuration'
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
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!process.env.GOAPI_KEY) {
      return res.status(500).json({ 
        error: 'Music generation service not configured' 
      });
    }

    const response = await fetch(`https://api.goapi.ai/api/v1/task/${taskId}`, {
      headers: {
        'X-API-Key': process.env.GOAPI_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GoAPI status check failed:', response.status, errorData);
      return res.status(500).json({ 
        error: 'Failed to check song status' 
      });
    }

    const result = await response.json();
    
    // Handle GoAPI task response format
    if (result.code === 200 && result.data) {
      const taskData = result.data;
      
      if (taskData.status === 'completed' && taskData.output?.songs?.length > 0) {
        // Song is completed - get the first song's audio URL
        const firstSong = taskData.output.songs[0];
        const audioUrl = firstSong.audio_url || firstSong.song_url;
        
        try {
          // Check if this song is already saved
          const existingSongs = await db.select()
            .from(songs)
            .where(eq(songs.taskId, taskId));
          
          if (existingSongs.length === 0) {
            // Save the completed song to database
            await db.insert(songs).values({
              userId,
              title: firstSong.title || firstSong.name || 'Custom Song',
              prompt: taskData.input?.prompt || 'Generated Song',
              audioUrl,
              taskId,
              status: 'completed'
            });
            
            console.log('Song saved to database:', taskId);
          }
        } catch (saveError) {
          console.error('Failed to save song to database:', saveError);
          // Continue with response even if save fails
        }
        
        res.json({
          status: 'completed',
          audioUrl
        });
      } else if (taskData.status === 'failed') {
        res.json({
          status: 'failed',
          error: taskData.error?.message || 'Song generation failed'
        });
      } else {
        // Still processing
        res.json({
          status: taskData.status || 'processing'
        });
      }
    } else {
      console.error('Unexpected status response:', result);
      res.status(500).json({
        error: 'Unexpected response from music service'
      });
    }

  } catch (error) {
    console.error('Error checking song status:', error);
    res.status(500).json({ error: 'Failed to check song status' });
  }
});

// Get user's saved songs
router.get('/songs', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userSongs = await db.select()
      .from(songs)
      .where(eq(songs.userId, userId))
      .orderBy(desc(songs.createdAt));

    res.json(userSongs);
  } catch (error) {
    console.error('Error fetching user songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

export { router as musicmakerRouter };