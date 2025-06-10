import { Router } from 'express';
import { OpenAIService } from '../services/OpenAIService';

const router = Router();

/**
 * Generate personalized story for children ages 2-5
 * Creates simple, fun stories with child's name incorporated naturally
 */
router.post('/generate', async (req, res) => {
  try {
    const { childName, topic, language, storyTitle } = req.body;
    
    if (!childName || !topic) {
      return res.status(400).json({ 
        message: 'Child name and topic are required' 
      });
    }
    
    console.log("Generating personalized story for:", { childName, topic, language, storyTitle });
    
    // Create age-appropriate story prompt
    const prompt = `Create a simple, fun story for a child named ${childName} who is between 2-5 years old about ${topic}.

IMPORTANT GUIDELINES:
- Use simple words that 2-5 year olds understand
- Keep sentences short (5-8 words maximum)
- Make it happy and positive
- Include the child's name ${childName} naturally throughout the story
- Use repetitive phrases that children love
- Include sounds, actions, and emotions
- Make it 4-6 short paragraphs
- End with ${childName} feeling proud and happy
- Use present tense to make it immediate and engaging
- Include simple dialogue if appropriate

The story should teach about ${topic} in a fun, gentle way that doesn't lecture but shows through ${childName}'s adventures.

${language !== 'en' ? `Write the story in ${language} language, keeping the same simple, child-friendly style.` : ''}

Make this story special for ${childName}!`;

    const openaiService = OpenAIService.getInstance();
    const result = await openaiService.generateContent({ prompt });
    const story = result.content;
    
    // Clean up the story formatting
    const cleanedStory = story
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/^Story:|^Title:.*\n/gim, '') // Remove title prefixes
      .trim();

    res.json({ story: cleanedStory });
  } catch (error) {
    console.error('Error generating personalized story:', error);
    res.status(500).json({ 
      message: 'Failed to generate story',
      error: error.message 
    });
  }
});

/**
 * Generate dramatic audio narration for stories
 * Uses child-friendly voices with expressive storytelling
 */
router.post('/generate-audio', async (req, res) => {
  try {
    const { story, voice, language, childName } = req.body;
    
    if (!story) {
      return res.status(400).json({ 
        message: 'Story text is required' 
      });
    }
    
    console.log("Generating story audio for:", { voice, language, childName });
    
    // Enhance the story text for dramatic reading
    const enhancedText = `${story}
    
The End! 
What a wonderful story about ${childName}!`;

    // Use the existing voice service for story narration
    const { VoiceService } = await import('../services/voiceService');
    const voiceService = new VoiceService();
    
    const audioBuffer = await voiceService.generateSpeech(
      enhancedText,
      'child-friendly',
      {
        stability: 0.8,
        similarityBoost: 0.9,
        style: 0.2,
        useSpeakerBoost: true
      }
    );

    if (!audioBuffer) {
      throw new Error('Failed to generate audio');
    }

    // Save audio to temporary file and return URL
    const fs = await import('fs');
    const path = await import('path');
    const audioFilename = `story-${Date.now()}.mp3`;
    const audioPath = path.join(process.cwd(), 'uploads', audioFilename);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    fs.writeFileSync(audioPath, audioBuffer);
    const audioUrl = `/uploads/${audioFilename}`;

    res.json({ 
      audioUrl: audioUrl,
      duration: 0
    });
  } catch (error) {
    console.error('Error generating story audio:', error);
    res.status(500).json({ 
      message: 'Failed to generate audio',
      error: error.message 
    });
  }
});

export default router;