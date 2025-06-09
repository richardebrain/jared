import express from 'express';
import { voiceService, NARRATOR_VOICES } from '../services/voiceService';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get available narrator voices
router.get('/voices', requireAuth, async (req, res) => {
  try {
    const voices = voiceService.getAvailableVoices();
    const isServiceAvailable = voiceService.isServiceAvailable();
    
    res.json({
      voices,
      available: isServiceAvailable,
      message: isServiceAvailable ? 'Voice service ready' : 'Voice service unavailable - check API key configuration'
    });
  } catch (error) {
    console.error('Error getting voices:', error);
    res.status(500).json({ error: 'Failed to retrieve voice options' });
  }
});

// Generate speech for text
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { text, voiceType = 'professional-female', settings = {} } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5000 characters allowed.' });
    }

    const audioBuffer = await voiceService.generateSpeech(text, voiceType, settings);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Failed to generate speech audio' });
    }

    // Set proper headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: 'Speech generation failed' });
  }
});

// Generate complete module narration
router.post('/generate-module', requireAuth, async (req, res) => {
  try {
    const { moduleContent, voiceType = 'professional-female' } = req.body;

    if (!moduleContent || !moduleContent.title || !moduleContent.sections) {
      return res.status(400).json({ error: 'Invalid module content structure' });
    }

    console.log(`Generating narration for module: ${moduleContent.title}`);
    
    const narration = await voiceService.generateModuleNarration(moduleContent, voiceType);
    
    // Convert audio buffers to base64 for JSON response
    const response = {
      intro: narration.intro ? narration.intro.toString('base64') : null,
      sections: narration.sections.map(section => ({
        title: section.title,
        audio: section.audio ? section.audio.toString('base64') : null
      })),
      outro: narration.outro ? narration.outro.toString('base64') : null,
      voiceUsed: NARRATOR_VOICES[voiceType]?.name || 'Unknown'
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating module narration:', error);
    res.status(500).json({ error: 'Module narration generation failed' });
  }
});

// Generate question narration
router.post('/generate-question', requireAuth, async (req, res) => {
  try {
    const { question, voiceType = 'friendly-female' } = req.body;

    if (!question || !question.question) {
      return res.status(400).json({ error: 'Question data is required' });
    }

    const narration = await voiceService.generateQuestionNarration(question, voiceType);
    
    const response = {
      question: narration.question ? narration.question.toString('base64') : null,
      explanation: narration.explanation ? narration.explanation.toString('base64') : null,
      voiceUsed: NARRATOR_VOICES[voiceType]?.name || 'Unknown'
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating question narration:', error);
    res.status(500).json({ error: 'Question narration generation failed' });
  }
});

// Test voice service endpoint
router.get('/test', requireAuth, async (req, res) => {
  try {
    const testText = "Hello! This is a test of the voice narration system for educational modules.";
    const audioBuffer = await voiceService.generateSpeech(testText, 'professional-female');
    
    if (!audioBuffer) {
      return res.status(500).json({ 
        error: 'Voice service test failed',
        available: false 
      });
    }

    res.json({
      message: 'Voice service test successful',
      available: true,
      testAudio: audioBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Voice service test error:', error);
    res.status(500).json({ 
      error: 'Voice service test failed',
      available: false,
      details: error.message 
    });
  }
});

export default router;