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

// Voice cloning endpoint
router.post('/clone-voice', requireAuth, async (req, res) => {
  try {
    const { voiceName, description } = req.body;
    const audioFile = req.file?.buffer;

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const voiceId = await voiceService.cloneVoice(audioFile, voiceName, description);
    
    if (!voiceId) {
      return res.status(500).json({ error: 'Voice cloning failed' });
    }

    res.json({ success: true, voiceId, message: 'Voice cloned successfully' });
  } catch (error) {
    console.error('Voice cloning error:', error);
    res.status(500).json({ error: 'Voice cloning failed' });
  }
});

// Multilingual speech generation
router.post('/generate-multilingual-speech', requireAuth, async (req, res) => {
  try {
    const { text, voiceType, targetLanguage = 'en' } = req.body;

    if (!text || !voiceType) {
      return res.status(400).json({ error: 'Text and voice type are required' });
    }

    const audioBuffer = await voiceService.generateMultilingualSpeech(text, voiceType, targetLanguage);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Multilingual speech generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Multilingual speech generation error:', error);
    res.status(500).json({ error: 'Multilingual speech generation failed' });
  }
});

// Sound effects generation
router.post('/generate-sound-effect', requireAuth, async (req, res) => {
  try {
    const { description, duration = 3 } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Sound description is required' });
    }

    const audioBuffer = await voiceService.generateSoundEffect(description, duration);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Sound effect generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Sound effect generation error:', error);
    res.status(500).json({ error: 'Sound effect generation failed' });
  }
});

// Pronunciation guide generation
router.post('/generate-pronunciation-guide', requireAuth, async (req, res) => {
  try {
    const { word, phonetic, voiceType = 'professional-female' } = req.body;

    if (!word || !phonetic) {
      return res.status(400).json({ error: 'Word and phonetic spelling are required' });
    }

    const audioBuffer = await voiceService.generatePronunciationGuide(word, phonetic, voiceType);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Pronunciation guide generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Pronunciation guide generation error:', error);
    res.status(500).json({ error: 'Pronunciation guide generation failed' });
  }
});

// Emotional storytelling narration
router.post('/generate-storytelling-narration', requireAuth, async (req, res) => {
  try {
    const { story, emotion = 'happy', voiceType = 'storyteller' } = req.body;

    if (!story) {
      return res.status(400).json({ error: 'Story text is required' });
    }

    const audioBuffer = await voiceService.generateStorytellingNarration(story, emotion, voiceType);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Storytelling narration generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Storytelling narration generation error:', error);
    res.status(500).json({ error: 'Storytelling narration generation failed' });
  }
});

// Personalized reading companion
router.post('/generate-personalized-reading', requireAuth, async (req, res) => {
  try {
    const { text, childName, readingLevel = 'beginner' } = req.body;

    if (!text || !childName) {
      return res.status(400).json({ error: 'Text and child name are required' });
    }

    const audioBuffer = await voiceService.generatePersonalizedReading(text, childName, readingLevel);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Personalized reading generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Personalized reading generation error:', error);
    res.status(500).json({ error: 'Personalized reading generation failed' });
  }
});

// Assessment feedback generation
router.post('/generate-assessment-feedback', requireAuth, async (req, res) => {
  try {
    const { score, totalQuestions, encouragement = true } = req.body;

    if (score === undefined || !totalQuestions) {
      return res.status(400).json({ error: 'Score and total questions are required' });
    }

    const audioBuffer = await voiceService.generateAssessmentFeedback(score, totalQuestions, encouragement);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Assessment feedback generation failed' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString()
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Assessment feedback generation error:', error);
    res.status(500).json({ error: 'Assessment feedback generation failed' });
  }
});

// Voice boost endpoint for Perfect Manager
router.post('/boost', requireAuth, async (req, res) => {
  try {
    const motivationalMessages = [
      "You are writing chapter one in children's lives - what an incredible honor and responsibility. Your energy, your presence, your care becomes part of their foundation. Today, you have the power to plant seeds of confidence, curiosity, and joy that will grow for a lifetime.",
      "The sacred work you do with our youngest learners is building tomorrow's leaders, innovators, and changemakers. Every moment of patience, every gentle word, every creative lesson you share is shaping the future. Your dedication matters more than you know.",
      "In early childhood education, you're not just teaching ABCs and 123s - you're teaching hearts to be brave, minds to be curious, and spirits to believe in themselves. You are a guardian of wonder, a cultivator of dreams. Keep shining your light.",
      "Remember, the children in your care will carry pieces of your kindness, your wisdom, and your belief in them for their entire lives. You are planting forests of possibility in young minds. Your work is both profound and beautiful.",
      "Every day you show up, you're choosing to invest in humanity's most precious resource - our children. Your patience builds their resilience, your encouragement fuels their confidence, and your love becomes their inner voice of strength.",
      "You have the extraordinary privilege of witnessing first steps, first words, first discoveries, and first friendships. You are the keeper of wonder, the protector of imagination, and the architect of lifelong learning. This is sacred work."
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    const audioBuffer = await voiceService.generateSpeech(randomMessage, 'professional-female', {
      stability: 0.75,
      similarityBoost: 0.8,
      style: 0.2
    });
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Failed to generate voice boost audio' });
    }

    // Set proper headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'no-cache'
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('Voice boost error:', error);
    res.status(500).json({ error: 'Voice boost generation failed' });
  }
});

// Voice reset endpoint for Perfect Manager (breathing exercise)
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const resetScript = `Welcome to your three-minute leadership reset. Find a comfortable position and close your eyes if you feel safe to do so. 

We'll practice a structured breathing pattern - breathe in for four counts, hold for six counts, and exhale for six counts. This rhythm helps activate your body's natural relaxation response.

Let's begin. Breathe in slowly through your nose... one, two, three, four. Now hold that breath... one, two, three, four, five, six. And slowly exhale through your mouth... one, two, three, four, five, six.

Excellent. Let's continue this pattern. Inhale for four... one, two, three, four. Hold for six... one, two, three, four, five, six. Exhale for six... one, two, three, four, five, six.

As you breathe, remember that taking this time for yourself isn't selfish - it's essential. You can't pour from an empty cup. By caring for yourself, you're better equipped to lead with clarity, patience, and wisdom.

Continue breathing... in for four, hold for six, out for six. Feel your shoulders relaxing, your mind clearing, your heart opening to the possibilities ahead.

You are exactly where you need to be, doing exactly what you're meant to do. Trust yourself, trust your team, and trust the process.

Take three more deep breaths on your own, and when you're ready, gently open your eyes. You are centered, you are strong, and you are ready to lead with purpose.`;

    const audioBuffer = await voiceService.generateSpeech(resetScript, 'professional-female', {
      stability: 0.8,
      similarityBoost: 0.7,
      style: 0.1
    });
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Failed to generate reset audio' });
    }

    // Set proper headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'no-cache'
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('Voice reset error:', error);
    res.status(500).json({ error: 'Voice reset generation failed' });
  }
});

export default router;