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

// Available voice options for OpenAI TTS
const AVAILABLE_VOICES = [
  { name: 'nova', label: 'Nova (Warm & Professional)', language: 'en-US' },
  { name: 'alloy', label: 'Alloy (Neutral & Clear)', language: 'en-US' },
  { name: 'echo', label: 'Echo (Confident & Dynamic)', language: 'en-US' },
  { name: 'fable', label: 'Fable (Engaging & Storytelling)', language: 'en-US' },
  { name: 'onyx', label: 'Onyx (Deep & Authoritative)', language: 'en-US' },
  { name: 'shimmer', label: 'Shimmer (Friendly & Upbeat)', language: 'en-US' }
];

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    res.json({ voices: AVAILABLE_VOICES });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate source content (Step 1)
router.post('/generate-source-content', async (req, res) => {
  try {
    const { request } = req.body;

    if (!request || typeof request !== 'string') {
      return res.status(400).json({ error: 'Content request is required and must be a string' });
    }

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content generator specializing in creating educational materials for early childhood education. Generate detailed, well-structured documents based on user requests. These could be:

- Educational handbooks or policy documents
- Training materials and guidelines
- Dialogue examples between educators
- Lists of best practices or procedures
- Case studies or scenarios
- Reference materials for teachers

Create content that is clear, professional, and directly applicable to early childhood education settings.`
        },
        {
          role: "user",
          content: `Generate a detailed textual document based on the following request. This could be a set of rules, a handbook section, a dialogue between educators, a list of facts, training material, or any other relevant educational content.

Ensure the output is well-structured, clear, and relevant to early childhood education. Make it comprehensive enough to serve as source material for analysis and discussion.

Request: "${request}"

Please generate the document:`
        }
      ],
      max_tokens: 2500,
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    res.json({ content });

  } catch (error) {
    console.error('Error generating source content:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'OpenAI API key is not configured. Please contact your administrator.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate source content. Please try again.' 
    });
  }
});

// Generate analytical podcast script (Step 2)
router.post('/generate-script', async (req, res) => {
  try {
    const { sourceContent, podcastTopic, length = 5 } = req.body;

    if (!sourceContent || typeof sourceContent !== 'string') {
      return res.status(400).json({ error: 'Source content is required to generate the podcast script' });
    }

    const scriptLength = parseInt(length);
    if (scriptLength < 3 || scriptLength > 15) {
      return res.status(400).json({ error: 'Podcast length must be between 3 and 15 minutes' });
    }

    // Calculate word count based on length - heavily optimized for TTS limits
    // Conservative approach to ensure scripts stay under 3800 characters
    const wordsPerMinute = scriptLength <= 5 ? 100 : 90; // Even more conservative for longer scripts
    const targetWords = scriptLength * wordsPerMinute;
    const minWords = Math.ceil(targetWords * 0.7);
    const maxWords = Math.floor(targetWords * 0.9); // Much more conservative

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator specializing in early childhood education. Create engaging, informative podcast scripts in interview format for teachers, directors, and education professionals. Your scripts should be:

- Professional yet conversational in tone
- Feature a 'HOST' and an 'EXPERT' in interview format
- Include clear sections: Introduction, Main Discussion, Key Takeaways, and Conclusion
- Focus on practical, actionable insights
- Be appropriate for audio consumption
- Include natural speaking patterns and transitions

Format the script clearly with speaker labels (e.g., 'HOST:', 'EXPERT:') and natural pauses indicated by ellipses where appropriate.`
        },
        {
          role: "user",
          content: `Create an analytical podcast script (approximately ${scriptLength} minutes, MAXIMUM ${Math.min(maxWords, 400)} words) that discusses and analyzes the provided source content.

CRITICAL: Keep the entire script under 3500 characters for audio compatibility.

The script should feature:
- HOST: Introduces the source content and guides discussion
- EXPERT: Provides analytical insights and interpretations

Structure:
- Brief intro referencing the source document (1-2 sentences)
- 3-4 analytical exchanges discussing key points from the source
- Quick conclusion with takeaways (1-2 sentences)

Topic Context: ${podcastTopic || 'Analysis of educational content'}

--- SOURCE CONTENT TO ANALYZE ---
${sourceContent}
--------------------------------

Requirements:
- Each response must be 1-3 sentences maximum
- Focus on analyzing and interpreting the source content
- Provide practical insights for educators
- Keep under ${Math.min(maxWords, 400)} words total

Generate the analytical podcast script:`
        }
      ],
      max_tokens: 2000,
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
    const { script, voice = 'nova' } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script is required and must be a string' });
    }

    // Validate voice selection
    const selectedVoice = AVAILABLE_VOICES.find(v => v.name === voice);
    if (!selectedVoice) {
      return res.status(400).json({ error: 'Invalid voice selection' });
    }

    // OpenAI TTS has a strict 4096 character limit - implement hard truncation
    const MAX_TTS_LENGTH = 3500; // Conservative limit to ensure compatibility
    let processedScript = script;

    if (script.length > MAX_TTS_LENGTH) {
      console.log(`Script too long: ${script.length} characters, truncating to ${MAX_TTS_LENGTH}`);
      
      // Hard truncate with smart ending
      processedScript = script.substring(0, MAX_TTS_LENGTH);
      
      // Try to end at a natural breakpoint within the last 200 characters
      const searchEnd = Math.max(MAX_TTS_LENGTH - 200, MAX_TTS_LENGTH * 0.8);
      const endSection = processedScript.substring(searchEnd);
      
      const lastSentence = endSection.lastIndexOf('.');
      const lastQuestion = endSection.lastIndexOf('?');
      const lastExclamation = endSection.lastIndexOf('!');
      
      const bestEnd = Math.max(lastSentence, lastQuestion, lastExclamation);
      
      if (bestEnd > 0) {
        processedScript = processedScript.substring(0, searchEnd + bestEnd + 1);
      } else {
        // Force end with period
        processedScript = processedScript.trim() + '.';
      }
      
      // Final safety check
      if (processedScript.length > MAX_TTS_LENGTH) {
        processedScript = processedScript.substring(0, MAX_TTS_LENGTH - 1) + '.';
      }
      
      console.log(`Script truncated from ${script.length} to ${processedScript.length} characters`);
    }

    console.log(`Final script length: ${processedScript.length} characters`);
    
    // Double-check character count before API call
    if (processedScript.length > 4000) {
      throw new Error(`Script still too long: ${processedScript.length} characters`);
    }

    // Generate audio using OpenAI's text-to-speech
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice.name as any, // Use selected voice
      input: processedScript,
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

    if (error instanceof Error && error.message.includes('maximum context length')) {
      return res.status(400).json({ 
        error: 'Script is too long for audio generation. Please try a shorter podcast length.' 
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