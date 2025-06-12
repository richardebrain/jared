import { Router } from 'express';
// OpenAI and Voice services temporarily disabled
// import { OpenAIService } from '../services/OpenAIService';
// import { VoiceUsageService } from '../services/voiceUsageService';

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

    // OpenAI service temporarily disabled
    // const openaiService = OpenAIService.getInstance();
    // const result = await openaiService.generateContent({ prompt });
    const story = `Here's a special story for ${childName}! (Story generation temporarily unavailable)`;
    
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
    const { text, voiceId, language, childName } = req.body;
    
    console.log('Voice generation request received:', { 
      textLength: text?.length, 
      voiceId, 
      language, 
      childName 
    });
    
    if (!text) {
      return res.status(400).json({ 
        message: 'Story text is required' 
      });
    }

    // Check authentication
    if (!req.session?.userId) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    // Check weekly usage limit (1 per week due to ElevenLabs costs)
    const usageCheck = await VoiceUsageService.canUseVoiceNarration(req.session.userId);
    
    if (!usageCheck.canUse) {
      const resetDate = usageCheck.resetDate.toLocaleDateString();
      return res.status(429).json({ 
        message: `Voice narration limit reached. You can use this feature again on ${resetDate}.`,
        usageCount: usageCheck.usageCount,
        resetDate: usageCheck.resetDate,
        limitType: 'weekly'
      });
    }
    
    console.log("Generating story audio for:", { voiceId, language, childName });
    
    // Enhance the story text for dramatic reading
    const enhancedText = `${text}

The End! 
What a wonderful story about ${childName}!`;

    // Use the existing voice service for story narration
    const { VoiceService } = await import('../services/voiceService');
    const voiceService = new VoiceService();
    
    // Map voiceId to voiceType for the voice service
    const voiceTypeMap = {
      'charlotte': 'child-friendly',
      'bella': 'professional-female', 
      'adam': 'professional-male',
      'dorothy': 'friendly-female',
      'callum': 'storyteller',
      'michael': 'storyteller'
    };
    
    const voiceType = voiceTypeMap[voiceId] || 'child-friendly';
    
    const audioBuffer = await voiceService.generateSpeech(
      enhancedText,
      voiceType,
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

    // Record usage after successful generation
    await VoiceUsageService.recordUsage(req.session.userId);

    res.json({ 
      audioUrl: audioUrl,
      duration: 0
    });
  } catch (error) {
    console.error('Error generating story audio:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(400).json({ 
      message: 'Failed to generate audio',
      error: error.message 
    });
  }
});

/**
 * Get current voice narration usage status for the authenticated user
 */
router.get('/voice-usage-status', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const usageCheck = await VoiceUsageService.canUseVoiceNarration(req.session.userId);
    const stats = await VoiceUsageService.getUsageStats(req.session.userId);

    res.json({
      canUse: usageCheck.canUse,
      usageCount: usageCheck.usageCount,
      resetDate: usageCheck.resetDate,
      weeklyLimit: 1,
      stats: stats
    });
  } catch (error) {
    console.error('Error checking voice usage status:', error);
    res.status(500).json({ 
      message: 'Error checking voice usage status',
      error: error.message 
    });
  }
});

export default router;