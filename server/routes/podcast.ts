import { Router } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const router = Router();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure audio directory exists
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Generate podcast script
router.post('/generate-script', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator specializing in early childhood education. Create engaging, informative podcast scripts for teachers, directors, and education professionals. Your scripts should be:

- Professional yet conversational in tone
- 300-500 words in length
- Include clear sections: Introduction, Main Content, Key Takeaways, and Conclusion
- Focus on practical, actionable insights
- Be appropriate for audio consumption
- Include natural speaking patterns and transitions

Format the script with clear speaker labels (HOST:) and natural pauses indicated by ellipses where appropriate.`
        },
        {
          role: "user",
          content: `Create a podcast script on the topic: "${prompt}". 

Make sure to:
- Start with an engaging hook
- Provide practical strategies or insights
- Include specific examples relevant to early childhood education
- End with clear action items or key takeaways
- Keep the tone professional but warm and approachable`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const script = completion.choices[0]?.message?.content;

    if (!script) {
      throw new Error('No script generated');
    }

    res.json({ script });

  } catch (error) {
    console.error('Error generating podcast script:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'OpenAI API key is not configured. Please contact your administrator.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate podcast script. Please try again.' 
    });
  }
});

// Generate podcast audio
router.post('/generate-audio', async (req, res) => {
  try {
    const { script } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script is required and must be a string' });
    }

    // Generate audio using OpenAI's text-to-speech
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // Professional, clear female voice suitable for educational content
      input: script,
      speed: 0.9 // Slightly slower for better comprehension
    });

    // Generate unique filename
    const filename = `podcast-${randomUUID()}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Convert the response to a buffer and save
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return the URL to access the audio file
    const audioUrl = `/audio/${filename}`;
    
    res.json({ audioUrl });

  } catch (error) {
    console.error('Error generating podcast audio:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'OpenAI API key is not configured. Please contact your administrator.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate podcast audio. Please try again.' 
    });
  }
});

// Clean up old audio files (optional endpoint for maintenance)
router.delete('/cleanup-audio', async (req, res) => {
  try {
    const files = fs.readdirSync(AUDIO_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.mp3')) {
        const filepath = path.join(AUDIO_DIR, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      }
    }

    res.json({ 
      message: `Cleaned up ${deletedCount} old audio files`,
      deletedCount 
    });

  } catch (error) {
    console.error('Error cleaning up audio files:', error);
    res.status(500).json({ 
      error: 'Failed to clean up audio files' 
    });
  }
});

export default router;