import { Router } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { 
  generateAITeachingStrategies,
  generateAIAssessmentQuestions,
  generateAIQuizQuestions,
  generateTeachingStrategies, 
  generateAssessmentQuestions, 
  generateQuizQuestions 
} from './dynamicAiSuggestions';

// Initialize OpenAI for teacher tools
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

// Audio generation function using OpenAI's text-to-speech
async function generatePodcastAudio(scriptContent: string, topicName: string) {
  // Extract dialogue from the script for audio generation
  const dialogueMatches = scriptContent.match(/\*\*(Sarah|Mike):\*\* "(.*?)"/g) || [];
  const segments: { speaker: string; text: string }[] = [];
  
  dialogueMatches.forEach(match => {
    const speakerMatch = match.match(/\*\*(Sarah|Mike):\*\*/);
    const textMatch = match.match(/"(.*?)"/);
    
    if (speakerMatch && textMatch) {
      segments.push({
        speaker: speakerMatch[1],
        text: textMatch[1]
      });
    }
  });

  // Create audio files for each speaker
  const audioFiles: string[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const voice = segment.speaker === 'Sarah' ? 'nova' : 'onyx'; // Different voices for hosts
    
    try {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: segment.text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const filename = `podcast_${topicName}_${timestamp}_segment_${i}.mp3`;
      const filepath = path.join('uploads', filename);
      
      // Ensure uploads directory exists
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      audioFiles.push(filename);
    } catch (error) {
      console.error(`Error generating audio for segment ${i}:`, error);
    }
  }

  // For now, return the first audio file (we could combine them later)
  const primaryAudioFile = audioFiles[0];
  
  return {
    audioUrl: `/uploads/${primaryAudioFile}`,
    filename: primaryAudioFile,
    segments: audioFiles
  };
}

/**
 * AI suggestion generation endpoint for module creator
 * This endpoint generates contextually relevant suggestions based on the module topic
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    console.log("Received AI suggestion request:", { prompt, type });
    
    // Extract difficulty level from the prompt
    let difficultyLevel = "intermediate";
    if (prompt.toLowerCase().includes("beginner level")) {
      difficultyLevel = "beginner";
    } else if (prompt.toLowerCase().includes("advanced level")) {
      difficultyLevel = "advanced";
    }
    
    // Extract module topic - either from direct format or quoted title
    let moduleTopic = "";
    
    // First try to extract from simplified format (Topic - level)
    const directFormatMatch = prompt.match(/^(.*?)\s*-\s*(?:beginner|intermediate|advanced)/i);
    if (directFormatMatch) {
      moduleTopic = directFormatMatch[1].trim();
      console.log("Direct format detected, module topic:", moduleTopic);
    } else {
      // Otherwise extract from quotes
      const titleMatch = prompt.match(/\"([^\"]+)\"/);
      if (titleMatch) {
        moduleTopic = titleMatch[1].trim();
        console.log("Quoted format detected, module topic:", moduleTopic);
      } else {
        // Last resort - use the whole prompt as topic
        moduleTopic = prompt.trim();
        console.log("Using full prompt as module topic:", moduleTopic);
      }
    }
    
    // Log the extracted module title for debugging
    console.log(`Module title for ${type} generation: ${moduleTopic}`);
    
    // Generate topic-specific content based on request type using AI first, with fallback
    if (type === 'strategies') {
      try {
        // Use AI for dynamic, contextual strategies
        const strategies = await generateAITeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n')
        });
      } catch (error) {
        console.log('AI strategies failed, using fallback:', error);
        // Fallback to built-in strategies
        const strategies = generateTeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n')
        });
      }
    } else if (type === 'questions') {
      try {
        // Use AI for dynamic, contextual assessment questions
        const questions = await generateAIAssessmentQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: questions.join('\n')
        });
      } catch (error) {
        console.log('AI questions failed, using fallback:', error);
        // Fallback to built-in questions
        const questions = generateAssessmentQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: questions.join('\n')
        });
      }
    } else if (type === 'quiz') {
      try {
        // Use AI for dynamic, contextual quiz questions
        const quizQuestions = await generateAIQuizQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          quizQuestions: quizQuestions
        });
      } catch (error) {
        console.log('AI quiz failed, using fallback:', error);
        // Fallback to built-in quiz questions
        const quizQuestions = generateQuizQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          quizQuestions: quizQuestions
        });
      }
    } else if (type === 'template-content') {
      // Generate complete template content for podcast and other templates
      const { templateType } = req.body;
      
      if (templateType === 'podcast-audio') {
        // Generate podcast-style content
        const podcastContent = `
# ${moduleTopic} - Podcast Audio Script

## Host Introduction
"Welcome to Early Childhood Educators Podcast! I'm your host Sarah, and I'm here with my co-host Mike. Today we're diving deep into ${moduleTopic} - a crucial topic for ${difficultyLevel} level educators."

## Main Discussion Points

### Opening Discussion
**Sarah:** "Mike, when we talk about ${moduleTopic} in early childhood settings, what's the first thing that comes to mind?"

**Mike:** "Great question, Sarah. For ${difficultyLevel} educators, ${moduleTopic} is really about creating those meaningful moments where children feel supported and engaged. It's not just about the activity itself, but how we facilitate the learning experience."

### Key Strategy Discussion
**Sarah:** "That's so true. I've found that with ${moduleTopic}, the environment we create is just as important as the content we deliver. Can you share some practical strategies our listeners can implement right away?"

**Mike:** "Absolutely. For ${difficultyLevel} level practice, I always recommend starting small. Focus on one aspect of ${moduleTopic} at a time, observe how children respond, and then build from there. It's about being intentional with our interactions."

### Real-World Application
**Sarah:** "I love that approach. Let's get practical - what would ${moduleTopic} look like in a typical preschool day?"

**Mike:** "Picture this: You're working with a group of 3-4 year olds. With ${moduleTopic}, you might notice opportunities throughout the day - during transitions, circle time, even during free play. The key is recognizing these teachable moments and responding appropriately."

### Common Challenges
**Sarah:** "Now let's be honest - every educator faces challenges with ${moduleTopic}. What are some common obstacles our listeners might encounter?"

**Mike:** "One thing I hear often is feeling overwhelmed by where to start. My advice? Remember that small, consistent actions make the biggest impact. Don't try to revolutionize everything at once."

## Reflection Prompts for Listeners

1. How are you currently approaching ${moduleTopic} in your classroom?
2. What's one small change you could make this week?
3. How might children in your care benefit from enhanced focus on ${moduleTopic}?

## Closing Thoughts
**Sarah:** "Before we wrap up, what's your top takeaway for educators just starting their journey with ${moduleTopic}?"

**Mike:** "Trust yourself and trust the process. Children are incredibly resilient and responsive. When we approach ${moduleTopic} with genuine care and intentionality, amazing things happen."

**Sarah:** "Beautifully said. Thank you all for listening, and remember - you're making a difference every single day!"

## Discussion Topics for Follow-Up
- How to involve families in ${moduleTopic}
- Adapting ${moduleTopic} for different age groups
- Measuring success and growth in ${moduleTopic}

## Key Insights Summary
- Start with small, intentional changes
- Focus on relationships and environment
- Observe and respond to children's cues
- Trust the process and your professional instincts
`;
        
        // Also generate actual audio using OpenAI's text-to-speech
        try {
          const audioResponse = await generatePodcastAudio(podcastContent, moduleTopic);
          return res.json({
            suggestions: podcastContent,
            audioUrl: audioResponse.audioUrl,
            audioFile: audioResponse.filename
          });
        } catch (audioError) {
          console.log('Audio generation failed, returning script only:', audioError);
          return res.json({
            suggestions: podcastContent
          });
        }
      } else {
        // Handle other template types with generic content generation
        const genericContent = `
# ${moduleTopic} Module Content

## Introduction
This module focuses on ${moduleTopic} for ${difficultyLevel} level early childhood educators.

## Learning Objectives
- Understand key concepts related to ${moduleTopic}
- Apply practical strategies in classroom settings
- Reflect on current practices and identify growth areas

## Main Content
Comprehensive content about ${moduleTopic} tailored for ${difficultyLevel} educators, including practical examples, evidence-based strategies, and real-world applications.

## Activities and Application
Hands-on activities and scenarios that help educators practice and implement ${moduleTopic} concepts in their daily work with children.

## Reflection and Assessment
Questions and prompts to help educators reflect on their learning and plan next steps for implementing ${moduleTopic} strategies.
`;
        
        return res.json({
          suggestions: genericContent
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid suggestion type' });
    }
    
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return res.status(500).json({
      message: 'Error generating suggestions',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Parent Response Generator endpoint
router.post('/parent-response', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user", 
        content: `As an early childhood education expert, help craft a professional, empathetic response to this parent communication scenario:

"${prompt}"

Please provide a thoughtful response that:
- Shows empathy and understanding for both the child and parent
- Uses positive, solution-focused language
- Maintains professional boundaries while being warm
- Offers specific, actionable suggestions when appropriate
- Demonstrates partnership in the child's development
- Is concise but thorough (2-3 paragraphs)

The response should sound natural and genuine, not overly formal.`
      }],
      temperature: 0.7,
    });

    const generatedResponse = response.choices[0].message.content;

    res.json({ response: generatedResponse });
  } catch (error) {
    console.error('Error generating parent response:', error);
    res.status(500).json({ 
      message: 'Error generating response',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;