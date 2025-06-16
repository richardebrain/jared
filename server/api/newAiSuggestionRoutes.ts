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
import { videoResourcesData } from '../../shared/videoResources';
import { expandedVideoResources, findVideosByTopic } from '../../shared/expandedVideoResources';

// Initialize OpenAI for teacher tools
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

/**
 * AI section generation endpoint with custom guidance support
 * Generates or regenerates module sections based on topic and optional guidance
 */
router.post('/generate-section', async (req, res) => {
  try {
    const { 
      topic, 
      sectionType, 
      sectionTitle, 
      targetAudience, 
      difficulty, 
      templateContext, 
      dependsOn,
      customGuidance 
    } = req.body;
    
    if (!topic || !sectionType || !sectionTitle) {
      return res.status(400).json({ 
        message: 'Topic, section type, and section title are required' 
      });
    }

    console.log("Generating AI section content:", { 
      topic, 
      sectionType, 
      sectionTitle, 
      customGuidance: customGuidance ? "provided" : "none"
    });

    // Build context-aware prompt
    let basePrompt = `Create educational content for early childhood educators on the topic: "${topic}".

Section Type: ${sectionType}
Section Title: ${sectionTitle}
Target Audience: ${targetAudience || 'preschool teachers'}
Difficulty Level: ${difficulty || 'intermediate'}
Template Context: ${templateContext || 'professional development module'}

`;

    // Add custom guidance if provided
    if (customGuidance) {
      basePrompt += `IMPORTANT GUIDANCE: ${customGuidance}\n\n`;
    }

    // Generate content based on section type
    let generatedContent;
    
    switch (sectionType) {
      case 'text':
        generatedContent = await generateTextSection(basePrompt, topic, sectionTitle);
        break;
      case 'quiz':
        generatedContent = await generateQuizSection(basePrompt, topic, sectionTitle);
        break;
      case 'matching':
        generatedContent = await generateMatchingSection(basePrompt, topic, sectionTitle);
        break;
      case 'scenario':
        generatedContent = await generateScenarioSection(basePrompt, topic, sectionTitle);
        break;
      case 'video':
        generatedContent = await generateVideoSection(basePrompt, topic, sectionTitle);
        break;
      default:
        generatedContent = await generateTextSection(basePrompt, topic, sectionTitle);
    }

    res.json(generatedContent);
  } catch (error) {
    console.error('Error generating section content:', error);
    res.status(500).json({ 
      message: 'Failed to generate section content',
      error: error.message 
    });
  }
});

// Helper functions for generating different section types
async function generateTextSection(basePrompt: string, topic: string, sectionTitle: string) {
  const prompt = `${basePrompt}Generate comprehensive educational text content that includes:
- Clear explanations and key concepts
- Practical examples for classroom use
- Evidence-based strategies
- Actionable takeaways for teachers

Format the content with proper headings and structure. Make it engaging and practical.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  
  return {
    blocks: [{
      type: 'text',
      title: sectionTitle,
      content: content,
      preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
    }]
  };
}

async function generateQuizSection(basePrompt: string, topic: string, sectionTitle: string) {
  const prompt = `${basePrompt}Generate 3-5 multiple choice quiz questions that test understanding of key concepts. Each question should have:
- A clear, practical question relevant to early childhood education
- 4 answer options (A, B, C, D)
- One correct answer
- A brief explanation of why the answer is correct

Format as JSON with this structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation text"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 1500,
    temperature: 0.7,
  });

  const content = JSON.parse(response.choices[0].message.content);
  
  return {
    blocks: [{
      type: 'quiz',
      title: sectionTitle,
      content: content,
      preview: `Quiz with ${content.questions?.length || 0} questions about ${topic}`
    }]
  };
}

async function generateMatchingSection(basePrompt: string, topic: string, sectionTitle: string) {
  const prompt = `${basePrompt}Generate a matching exercise with 5-7 pairs of items that teachers need to match. Create practical, educational pairs related to early childhood development. 

Format as JSON:
{
  "instructions": "Match each item on the left with its corresponding item on the right",
  "pairs": [
    { "left": "Term or concept", "right": "Definition or example" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = JSON.parse(response.choices[0].message.content);
  
  return {
    blocks: [{
      type: 'matching',
      title: sectionTitle,
      content: content,
      preview: `Matching activity with ${content.pairs?.length || 0} pairs`
    }]
  };
}

async function generateScenarioSection(basePrompt: string, topic: string, sectionTitle: string) {
  const prompt = `${basePrompt}Generate 2-3 realistic classroom scenarios that teachers might encounter, along with appropriate responses and strategies. Make them practical and specific to early childhood education.

Format as JSON:
{
  "scenarios": [
    {
      "situation": "Detailed scenario description",
      "response": "Recommended teacher response",
      "rationale": "Why this response is effective"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 1500,
    temperature: 0.7,
  });

  const content = JSON.parse(response.choices[0].message.content);
  
  return {
    blocks: [{
      type: 'scenario',
      title: sectionTitle,
      content: content,
      preview: `${content.scenarios?.length || 0} classroom scenarios with responses`
    }]
  };
}

async function generateVideoSection(basePrompt: string, topic: string, sectionTitle: string) {
  // Find relevant videos from the library
  const relevantVideos = findRelevantVideos(topic, undefined, 3);
  
  return {
    blocks: [{
      type: 'video',
      title: sectionTitle,
      content: {
        selectedVideo: relevantVideos[0] || null,
        alternativeVideos: relevantVideos.slice(1),
        description: `Educational video content about ${topic}`
      },
      preview: `Video section about ${topic} with ${relevantVideos.length} available videos`
    }]
  };
}

// Helper function to find relevant videos from the comprehensive library
function findRelevantVideos(topic: string, category?: string, maxResults: number = 3) {
  const topicLower = topic.toLowerCase();
  const categoryLower = category?.toLowerCase() || '';
  
  // First try to find videos from the expanded CSV library
  let relevantVideos = findVideosByTopic(topic).slice(0, maxResults);
  
  // If not enough videos found, supplement with original library
  if (relevantVideos.length < maxResults) {
    const originalVideos = videoResourcesData.filter(video => {
      const titleMatch = video.title.toLowerCase().includes(topicLower);
      const descMatch = video.description.toLowerCase().includes(topicLower);
      const categoryMatch = video.category.some(cat => 
        cat.toLowerCase().includes(categoryLower) || 
        cat.toLowerCase().includes(topicLower)
      );
      const tagMatch = video.tags.some(tag => 
        tag.toLowerCase().includes(topicLower) ||
        tag.toLowerCase().includes(categoryLower)
      );
      
      return titleMatch || descMatch || categoryMatch || tagMatch;
    });
    
    // Add original videos to fill up to maxResults
    const needed = maxResults - relevantVideos.length;
    relevantVideos = [...relevantVideos, ...originalVideos.slice(0, needed)];
  }
  
  return relevantVideos.slice(0, maxResults);
}

// Helper function to extract topic from prompt
function extractTopicFromPrompt(prompt: string): string {
  // Look for common patterns in prompts
  const topicPatterns = [
    /about (.+?) for/i,
    /on (.+?) that/i,
    /regarding (.+?) to/i,
    /covering (.+?) in/i,
    /focused on (.+?)$/i,
    /teaching (.+?) to/i,
    /(.+?) training/i,
    /(.+?) strategies/i,
    /(.+?) techniques/i
  ];
  
  for (const pattern of topicPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: use first few words if no pattern matches
  const words = prompt.split(' ').slice(0, 3).join(' ');
  return words || 'early childhood education';
}

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
      } else if (type === 'template-content' && prompt.includes('interactive scenario')) {
        // Generate AI-powered Interactive Scenarios based on teacher's content
        try {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [{
              role: "system",
              content: `You are an expert early childhood education curriculum designer. Create an interactive training scenario that helps teachers practice evidence-based responses to real classroom situations.

REQUIREMENTS:
- Create a realistic preschool scenario (ages 3-5) about: ${moduleTopic}
- Include 3 decision points where teachers choose between different responses
- For each decision point, provide 3 options: one excellent, one poor, one mediocre
- Show immediate outcomes for each choice
- Clearly mark the best choice and explain why using ECE research
- Include follow-up reflection questions
- Make it practical and immediately applicable
- Focus on evidence-based practices and developmentally appropriate responses

STRUCTURE:
1. Learning Objectives (4 specific, measurable goals)
2. The Scenario (realistic classroom setting and situation)
3. Three Decision Points with options and outcomes
4. Why These Choices Matter (research-based explanations)
5. Key Takeaways (actionable strategies)
6. Reflection Questions (promote deeper thinking)

TONE: Professional but engaging, supportive of teacher growth, grounded in child development theory.`
            },
            {
              role: "user", 
              content: `Create an interactive scenario about "${moduleTopic}" for ${difficultyLevel} level ECE teachers. 

Context from teacher's module:
${req.body.moduleDescription || 'General early childhood education content'}

${req.body.sectionContent || 'Focus on evidence-based practices and developmentally appropriate responses'}

Create a realistic preschool scenario with multiple decision points where teachers choose between good and bad approaches. Make it practical and immediately applicable to classroom situations.`
            }],
            temperature: 0.7,
          });

          const scenarioContent = aiResponse.choices[0].message.content;
          
          return res.json({
            suggestions: scenarioContent
          });
        } catch (aiError) {
          console.error('AI scenario generation failed:', aiError);
          
          // Try again with a simpler AI prompt as backup
          try {
            const backupResponse = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [{
                role: "user",
                content: `Create a realistic preschool classroom scenario about "${moduleTopic}" with 3 decision points where teachers choose between good and bad approaches. Include specific character names, ages, classroom setting, and clear outcomes for each choice. Make it practical for ${difficultyLevel} level ECE teachers.`
              }],
              temperature: 0.8,
            });

            return res.json({
              suggestions: backupResponse.choices[0].message.content
            });
          } catch (backupError) {
            console.error('Backup AI generation also failed:', backupError);
          }
          
          // Only use specific hardcoded scenarios as last resort for critical topics
          let fallbackScenario = '';
          
          if (moduleTopic.toLowerCase().includes('biting')) {
            fallbackScenario = `# Handling Biting Incidents - Interactive Scenario

## 🎯 Learning Objectives
By the end of this scenario, you will be able to:
- Respond immediately and appropriately to biting incidents
- Support both the child who bit and the child who was bitten
- Implement prevention strategies based on understanding biting triggers
- Communicate effectively with parents about biting incidents

## 📖 The Scenario

**Setting:** It's 10:15 AM during free play time in your 3-year-old classroom. You have 12 children engaged in various activities.

**The Situation:** 
Maya (3 years old) has been playing with blocks near the dramatic play area. Jayden (also 3) approaches and tries to take a block from Maya's tower. Maya immediately bites Jayden on the shoulder. Jayden screams and starts crying. Several other children look over, and one starts crying too because they're scared.

## 🤔 Decision Point 1: Your Immediate Response

**What do you do first?**

### Option A: Focus on the Victim First
*Rush to Jayden, check the bite mark, comfort him, and get an ice pack while saying "Maya, we don't bite friends. That hurt Jayden."*

**Outcome:** ✅ Jayden feels supported and safe. Maya understands her action caused harm but doesn't feel abandoned.

### Option B: Discipline the Biter Immediately
*Immediately tell Maya "NO! Biting is bad! You need to sit in time-out right now!" and put her in the quiet corner.*

**Outcome:** ❌ Maya becomes more upset and doesn't learn alternative behaviors. Jayden still needs care and comfort.

### Option C: Separate and Lecture Both Children
*Pull both children aside and say "We need to talk about sharing and using our words instead of our teeth."*

**Outcome:** ⚠️ Addresses the behavior but doesn't prioritize the injured child's immediate needs or emotional state.

**✅ Best Choice: Option A** - Always attend to the injured child first while briefly acknowledging the biter's behavior.

## 🤔 Decision Point 2: Supporting Both Children

**After caring for Jayden's immediate needs, how do you help both children?**

### Option A: Facilitate Problem-Solving
*Bring Maya over and say "Maya, look at Jayden. He's crying because the bite hurt. When you want a toy, you can say 'Can I have that?' Let's practice together."*

**Outcome:** ✅ Maya learns alternative communication skills and sees the impact of her actions. Both children learn problem-solving.

### Option B: Make Maya Apologize
*Tell Maya "You need to say sorry to Jayden right now and give him a hug."*

**Outcome:** ❌ Forced apologies don't teach genuine empathy and may increase Maya's frustration.

### Option C: Remove Maya from the Activity
*Tell Maya "Since you bit, you can't play with toys for the rest of free time. You need to sit with me."*

**Outcome:** ⚠️ This is punishment without learning and doesn't address the underlying need or skill deficit.

**✅ Best Choice: Option A** - Focus on teaching skills and natural consequences rather than punishment.

## 🤔 Decision Point 3: Prevention and Follow-Up

**What steps do you take to prevent future biting incidents?**

### Option A: Increase Supervision and Teach Alternatives
*Shadow Maya during transitions and high-stress times, teach her to say "I'm mad" or "Help me," and create visual cues for problem-solving.*

**Outcome:** ✅ Addresses root causes and builds Maya's communication toolkit for future situations.

### Option B: Remove Maya from Group Activities
*Keep Maya separated from other children during play times until the biting stops completely.*

**Outcome:** ❌ Isolation prevents social skill development and may increase challenging behaviors.

### Option C: Create a Behavior Chart
*Make a sticker chart where Maya gets rewards for "no biting" days.*

**Outcome:** ⚠️ External rewards don't build internal motivation and may not address underlying triggers.

**✅ Best Choice: Option A** - Prevention through skill-building and environmental modifications.

## 🧠 Why These Choices Matter

**Safety First:** The injured child's physical and emotional needs take priority in any incident.

**Teaching Moments:** Biting is often a communication issue - children need alternative ways to express needs and frustrations.

**Development Understanding:** 3-year-olds are still developing language skills and emotional regulation. They need support, not shame.

**Prevention Focus:** Understanding triggers (transitions, frustration, tiredness) helps prevent future incidents.

## 💡 Key Takeaways
- Always care for the injured child first while briefly addressing the biter
- Biting is usually communication - teach alternatives like "Help me," "I'm mad," or "My turn"
- Shadow children who bite during high-risk times (transitions, when tired/hungry)
- Document incidents objectively and communicate with parents about strategies

## 🤝 Try This Next Time
Use the "STOP-LOOK-LISTEN" approach:
1. **STOP:** The unsafe behavior immediately
2. **LOOK:** Check on the injured child and assess the situation  
3. **LISTEN:** To what the child who bit was trying to communicate

## 📝 Reflection Questions
- What might have triggered Maya's biting? (frustration, language barriers, tiredness?)
- How can you modify the environment to reduce biting triggers?
- What communication tools can you teach children as alternatives to biting?
- How will you communicate this incident to both sets of parents?`;
          } else {
            fallbackScenario = `# ${moduleTopic} - Interactive Scenario

## 🎯 Learning Objectives
By the end of this scenario, you will be able to:
- Apply ${moduleTopic} strategies in real classroom situations
- Choose appropriate responses based on child development principles
- Reflect on the impact of different teaching approaches
- Build confidence in handling challenging moments

## 📖 Realistic Classroom Scenario
Create a realistic scenario about ${moduleTopic} for your specific classroom context.

## 🤔 Decision Points
Practice making decisions between different approaches for handling ${moduleTopic} situations.

*Note: Try the AI-powered scenario generator for more detailed content.*`;
          }

          return res.json({
            suggestions: fallbackScenario
          });
        }
      } else {
        // Handle other template types with specific content generation
        let specificContent = '';
        
        if (prompt.includes('mini video lesson')) {
          // Generate AI-powered mini video lesson scripts
          try {
            const videoResponse = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [{
                role: "system",
                content: `You are an expert early childhood education video content creator. Create a 3-minute video lesson script that's engaging, practical, and immediately actionable for preschool teachers.

REQUIREMENTS:
- 3-minute total duration with specific timing breakdowns
- Energetic, supportive tone that builds teacher confidence
- 3 specific, research-based strategies teachers can use immediately
- Visual cues and directions for video production
- Clear call-to-action and follow-up activities
- Focus on practical implementation, not theory

STRUCTURE:
1. Hook (0-15 seconds) - Grab attention with energy and promise
2. Main Content (15 seconds - 2:30 minutes) - 3 key strategies with examples
3. Challenge (2:30-2:45 minutes) - Specific action for teachers to try
4. Wrap-up (2:45-3:00 minutes) - Encouragement and next steps

Make it specific to the teacher's content, not generic advice.`
              },
              {
                role: "user",
                content: `Create a mini video lesson script for "${moduleTopic}" for ${difficultyLevel} level teachers.

Teacher's Content:
${req.body.moduleDescription || ''}

${req.body.sectionContent || ''}

Make this directly applicable to their specific content and classroom situations.`
              }],
              temperature: 0.7,
            });

            specificContent = videoResponse.choices[0].message.content;
          } catch (aiError) {
            console.error('AI video script generation failed:', aiError);
            specificContent = `# ${moduleTopic} - Mini Video Lesson Script

## 🎬 Video Hook (0-15 seconds)
*[Energetic music, teacher waving]*
"Hey there, amazing educators! Ready to transform your ${moduleTopic} skills in just 3 minutes? Let's dive in!"

## 📚 Main Teaching Points (15 seconds - 2 minutes)
*[Visual: classroom scenes, bullet points on screen]*
- Evidence-based strategies for ${moduleTopic}
- Practical tips for immediate implementation
- Real classroom examples and adaptations

*Note: AI content generation temporarily unavailable. Please try again.*`;
          }
        } else if (prompt.includes('quiz and teachback')) {
          // Generate AI-powered quiz and teachback sessions
          try {
            const quizResponse = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [{
                role: "system",
                content: `You are an expert early childhood education assessment designer. Create engaging quiz questions and teachback challenges that help teachers practice and demonstrate their understanding.

REQUIREMENTS:
- 5 multiple choice questions directly related to the teacher's content
- Questions should test practical application, not just knowledge recall
- Each answer should include research-based explanations
- Create a realistic teachback scenario that teachers can practice
- Include a detailed self-assessment checklist
- Focus on real classroom situations and evidence-based practices

STRUCTURE:
1. Knowledge Check (5 targeted questions with explanations)
2. Teachback Challenge (realistic scenario to explain/practice)
3. Self-Assessment Checklist (specific skills to demonstrate)
4. Next Steps (action planning for implementation)

Make questions specific to the teacher's actual content and learning objectives.`
              },
              {
                role: "user",
                content: `Create a quiz and teachback session for "${moduleTopic}" for ${difficultyLevel} level teachers.

Teacher's Content:
${req.body.moduleDescription || ''}

${req.body.sectionContent || ''}

Generate questions and scenarios that directly relate to their specific content and teaching context.`
              }],
              temperature: 0.7,
            });

            specificContent = quizResponse.choices[0].message.content;
          } catch (aiError) {
            console.error('AI quiz generation failed:', aiError);
            // Try simpler backup AI approach
            try {
              const backupQuiz = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{
                  role: "user",
                  content: `Create 5 multiple choice questions about "${moduleTopic}" for preschool teachers. Include a practical scenario they need to explain to a colleague. Make it specific to real classroom situations.`
                }],
                temperature: 0.7,
              });
              specificContent = backupQuiz.choices[0].message.content;
            } catch (backupError) {
              console.error('Backup quiz generation failed:', backupError);
              specificContent = `# ${moduleTopic} - Quiz & Teachback Session\n\nAI content generation is currently unavailable. Please try again later or contact support.`;
            }
          }
        } else if (prompt.includes('slide') || prompt.includes('storyboard')) {
          // Generate AI-powered slide/storyboard content
          try {
            const storyboardResponse = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [{
                role: "system",
                content: `You are an expert early childhood education visual content designer. Create detailed storyboard content that teachers can easily turn into slides, presentations, or visual materials.

REQUIREMENTS:
- 8-12 slides/frames with specific visual descriptions
- Each slide should have clear visual elements, text, and teaching notes
- Include engaging activities and interactive elements
- Provide specific directions for creating visuals (photos, drawings, etc.)
- Make content developmentally appropriate for preschool ages
- Include extension activities and discussion prompts

STRUCTURE:
1. Title Slide (attention-grabbing opening)
2. Learning Objectives (child-friendly goals)
3-8. Main Content Slides (key concepts with visuals)
9-10. Interactive Activities (hands-on engagement)
11. Reflection/Assessment (checking understanding)
12. Next Steps (extending learning)

Focus on visual storytelling and hands-on engagement.`
              },
              {
                role: "user",
                content: `Create a slide/storyboard sequence for "${moduleTopic}" for ${difficultyLevel} level teachers.

Teacher's Content:
${req.body.moduleDescription || ''}

${req.body.sectionContent || ''}

Create visual content that brings their specific material to life for preschool children.`
              }],
              temperature: 0.7,
            });

            specificContent = storyboardResponse.choices[0].message.content;
          } catch (aiError) {
            console.error('AI storyboard generation failed:', aiError);
            specificContent = `# ${moduleTopic} - Visual Storyboard

## 🎨 Slide Sequence
Visual storyboard will be generated based on your ${moduleTopic} content.

*Note: AI content generation temporarily unavailable. Please try again.*`;
          }
        } else if (prompt.includes('roleplay')) {
          // Generate AI-powered roleplay scenarios
          try {
            const roleplayResponse = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [{
                role: "system",
                content: `You are an expert early childhood education drama and roleplay specialist. Create engaging roleplay scenarios that help teachers practice real classroom situations.

REQUIREMENTS:
- 3-4 different roleplay scenarios with specific roles and scripts
- Include both teacher-child and teacher-parent interaction scenarios
- Provide multiple response options and coaching tips
- Make scenarios realistic and based on common classroom challenges
- Include debrief questions and learning objectives
- Focus on building confidence and practical skills

STRUCTURE:
1. Scenario Setup (context and roles)
2. Initial Scripts (starting dialogue for each role)
3. Decision Points (multiple response options)
4. Coaching Tips (what to focus on during practice)
5. Debrief Questions (reflection after roleplay)
6. Variations (adapting for different situations)

Make scenarios directly relevant to the teacher's specific content and challenges.`
              },
              {
                role: "user",
                content: `Create roleplay scenarios for "${moduleTopic}" for ${difficultyLevel} level teachers.

Teacher's Content:
${req.body.moduleDescription || ''}

${req.body.sectionContent || ''}

Generate realistic practice scenarios that help them apply their specific learning in safe roleplay situations.`
              }],
              temperature: 0.7,
            });

            specificContent = roleplayResponse.choices[0].message.content;
          } catch (aiError) {
            console.error('AI roleplay generation failed:', aiError);
            specificContent = `# ${moduleTopic} - Roleplay Scenarios

## 🎭 Practice Scenarios
Roleplay activities will be generated based on your ${moduleTopic} content.

*Note: AI content generation temporarily unavailable. Please try again.*`;
          }
        } else {
          // Default content for other types
          specificContent = `# ${moduleTopic} Module Content

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
Questions and prompts to help educators reflect on their learning and plan next steps for implementing ${moduleTopic} strategies.`;
        }
        
        return res.json({
          suggestions: specificContent
        });
      }
    } else if (type === 'teaching') {
      // Handle teaching strategies request
      try {
        // Use AI for dynamic, contextual strategies
        const strategies = await generateAITeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n\n')
        });
      } catch (error) {
        console.log('AI teaching strategies failed, using fallback:', error);
        // Fallback to built-in strategies
        const strategies = generateTeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n\n')
        });
      }
    } else {
      // For any unrecognized type, provide generic teaching content
      const genericTeachingContent = `
# ${moduleTopic} Teaching Strategies

## Overview
This module provides ${difficultyLevel} level strategies for implementing ${moduleTopic} in early childhood education settings.

## Key Teaching Strategies
- Create a supportive learning environment focused on ${moduleTopic}
- Use developmentally appropriate practices for ${difficultyLevel} educators
- Implement hands-on activities that engage children
- Foster positive relationships and communication
- Observe and document children's progress

## Practical Applications
- Daily classroom activities incorporating ${moduleTopic}
- Assessment strategies for measuring understanding
- Family engagement opportunities
- Professional development considerations

## Reflection Questions
- How can you implement ${moduleTopic} strategies in your current setting?
- What challenges might you face and how can you address them?
- How will you measure success in implementing these approaches?
`;
      
      return res.json({
        suggestions: genericTeachingContent
      });
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

// Module wizard section generation
router.post('/generate-section', async (req, res) => {
  try {
    const { prompt, sectionType, moduleTitle, moduleDescription } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Find relevant videos from the library
    const topic = moduleTitle || extractTopicFromPrompt(prompt);
    const relevantVideos = findRelevantVideos(topic, sectionType, 2);
    
    // Create video suggestions for the AI to include
    let videoContext = '';
    if (relevantVideos.length > 0) {
      videoContext = `\n\nSuggested videos from the library to include in your content:
${relevantVideos.map(video => 
  `- "${video.title}" (${video.duration} min) - ${video.description}
    YouTube ID: ${video.youtubeId}
    Categories: ${video.category.join(', ')}`
).join('\n')}

Please reference these specific videos in your content using their YouTube IDs to embed them.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert early childhood education content creator. Generate practical, engaging training content for preschool teachers. Focus on actionable strategies and real-world applications. Format your response in HTML suitable for display.

When relevant videos are provided, include them as embedded YouTube videos using this format:
<div class="video-container">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/[VIDEO_ID]" frameborder="0" allowfullscreen></iframe>
  <p class="video-description">[Video Title] - [Brief explanation of how it relates to the content]</p>
</div>

Always use the exact YouTube IDs provided in the video suggestions.`
        },
        {
          role: "user",
          content: prompt + videoContext
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    // Extract title from content or generate one
    const titleMatch = content?.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    const title = titleMatch ? titleMatch[1] : `Learning Section`;
    
    res.json({
      title,
      content,
      html: content,
      suggestedVideos: relevantVideos
    });
    
  } catch (error) {
    console.error('Section generation error:', error);
    
    // Check if it's an API key issue
    if (error.status === 401) {
      res.status(500).json({ 
        error: 'OpenAI API authentication failed. Please check your API key configuration.',
        title: 'Authentication Error',
        content: '<p>Unable to generate content due to API authentication issues.</p>'
      });
    } else if (error.status === 429) {
      res.status(500).json({ 
        error: 'OpenAI API rate limit exceeded. Please try again in a moment.',
        title: 'Rate Limit Error',
        content: '<p>API rate limit exceeded. Please wait a moment and try again.</p>'
      });
    } else {
      res.status(500).json({ 
        error: `Failed to generate section content: ${error.message || 'Unknown error'}`,
        title: 'Generated Section',
        content: '<p>Section content will be generated here. Please try again or edit manually.</p>'
      });
    }
  }
});

// Module wizard quiz generation
router.post('/generate-quiz', async (req, res) => {
  try {
    const { prompt, questionCount = 5 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating educational assessments for early childhood educators. Create ${questionCount} multiple choice questions that test practical understanding. Format as JSON with this structure: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..."}]}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const quizData = JSON.parse(content || '{"questions": []}');
    
    res.json(quizData);
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      questions: Array.from({length: questionCount}, (_, i) => ({
        question: `Question ${i + 1} will be generated here`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "A",
        explanation: "Explanation will be provided"
      }))
    });
  }
});

// Staff Meeting Agenda Generator endpoint
router.post('/generate-meeting-agenda', async (req, res) => {
  try {
    const { meetingType, duration, primaryFocus, attendees, schoolGoals, recentChallenges, upcomingEvents } = req.body;
    
    if (!meetingType || !duration || !primaryFocus) {
      return res.status(400).json({ 
        error: 'Meeting type, duration, and primary focus are required' 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert early childhood education director and meeting facilitator. Create comprehensive, engaging staff meeting agendas that promote professional growth, team collaboration, and positive outcomes for children and families.

REQUIREMENTS:
- Create a detailed agenda structure with time allocations
- Include interactive elements and energizers to keep engagement high
- Focus on actionable outcomes and clear next steps
- Incorporate evidence-based practices and professional development
- Make meetings productive, positive, and solution-focused
- Include specific discussion questions and activities
- Provide clear action items with assigned responsibilities

FORMAT AS JSON with this structure:
{
  "title": "Meeting title",
  "overview": "Brief meeting purpose",
  "totalDuration": "duration in minutes",
  "agendaItems": [
    {
      "title": "Item title",
      "duration": "time allocation",
      "type": "discussion|presentation|activity|break",
      "description": "detailed description",
      "facilitator": "who leads this",
      "materials": ["list of needed materials"],
      "discussionQuestions": ["key questions to explore"]
    }
  ],
  "actionItems": [
    {
      "task": "specific action needed",
      "assignee": "who is responsible", 
      "deadline": "when it's due",
      "priority": "High|Medium|Low"
    }
  ],
  "followUpPlanning": "plans for next meeting",
  "energizers": [
    {
      "name": "energizer name",
      "when": "when to use it",
      "howTo": "brief instructions",
      "timeNeeded": "duration"
    }
  ],
  "takeaways": ["key messages and insights"]
}`
        },
        {
          role: "user",
          content: `Create a ${duration}-minute ${meetingType} staff meeting agenda focused on: ${primaryFocus}

Meeting Details:
- Duration: ${duration} minutes
- Primary Focus: ${primaryFocus}
- Attendees: ${attendees || 'Teaching staff and administrators'}
- School Goals: ${schoolGoals || 'Supporting child development and family engagement'}
- Recent Challenges: ${recentChallenges || 'Standard classroom management and curriculum implementation'}
- Upcoming Events: ${upcomingEvents || 'Regular school activities and planning'}

Create an engaging, productive agenda that addresses the specific focus area while maintaining team morale and professional growth. Include interactive elements, clear action items, and practical strategies teachers can implement immediately.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log('AI raw response content:', content);
    
    const agendaData = JSON.parse(content || '{}');
    console.log('Parsed agenda data:', agendaData);
    
    res.json(agendaData);
    
  } catch (error) {
    console.error('Meeting agenda generation error:', error);
    
    // Check if it's an API key issue
    if (error.status === 401) {
      res.status(500).json({ 
        error: 'OpenAI API authentication failed. Please check your API key configuration.'
      });
    } else if (error.status === 429) {
      res.status(500).json({ 
        error: 'OpenAI API rate limit exceeded. Please try again in a moment.'
      });
    } else {
      res.status(500).json({ 
        error: `Failed to generate meeting agenda: ${error.message || 'Unknown error'}`
      });
    }
  }
});

export default router;