import { Router } from 'express';
import { 
  generateTeachingStrategies, 
  generateAssessmentQuestions, 
  generateQuizQuestions 
} from './dynamicAiSuggestions';

const router = Router();

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
    
    // Generate topic-specific content based on request type
    if (type === 'strategies' || type === 'teaching') {
      // Generate teaching strategies specific to the module topic and difficulty level
      const strategies = generateTeachingStrategies(
        moduleTopic, 
        difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
      );
      
      if (strategies && strategies.length > 0) {
        return res.json({
          suggestions: strategies.join('\n\n')
        });
      } else {
        // Fallback content for teaching strategies
        const fallbackContent = `
# ${moduleTopic} Teaching Strategies (${difficultyLevel} level)

## Strategy 1: Environment Setup
Create a supportive learning environment that promotes ${moduleTopic} through intentional space arrangement and material selection.

## Strategy 2: Interactive Activities
Design hands-on activities that engage children in exploring ${moduleTopic} concepts through play and discovery.

## Strategy 3: Assessment Integration
Use observation and documentation to track children's progress and understanding of ${moduleTopic}.

## Strategy 4: Family Engagement
Connect with families to support ${moduleTopic} learning at home and strengthen the home-school partnership.

## Strategy 5: Differentiation
Adapt ${moduleTopic} activities to meet diverse learning styles and developmental levels in your classroom.
`;
        return res.json({
          suggestions: fallbackContent
        });
      }
    } else if (type === 'questions') {
      // Generate assessment questions specific to the module topic and difficulty level
      const questions = generateAssessmentQuestions(
        moduleTopic, 
        difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
      );
      return res.json({
        suggestions: questions.join('\n')
      });
    } else if (type === 'quiz') {
      // Generate quiz questions specific to the module topic and difficulty level
      const quizQuestions = generateQuizQuestions(
        moduleTopic, 
        difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
      );
      return res.json({
        quizQuestions: quizQuestions
      });
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
        
        return res.json({
          suggestions: podcastContent
        });
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
    } else if (type === 'teaching' || !type) {
      // Handle teaching type and unrecognized types with generic teaching content
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

export default router;