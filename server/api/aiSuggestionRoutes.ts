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

/**
 * AI section content generation endpoint
 * Generates contextual content for specific module sections
 */
router.post('/generate-section-content', async (req, res) => {
  try {
    const { 
      moduleTitle, 
      moduleDescription, 
      sectionTitle, 
      sectionType, 
      sectionIndex, 
      totalSections, 
      category,
      specificTopic,
      templateType
    } = req.body;
    
    if (!moduleTitle || !sectionTitle || !sectionType) {
      return res.status(400).json({ 
        message: 'Module title, section title, and section type are required' 
      });
    }
    
    console.log("Generating AI content for section:", { 
      moduleTitle, 
      sectionTitle, 
      sectionType, 
      sectionIndex, 
      totalSections,
      specificTopic,
      templateType
    });
    
    const topic = specificTopic || moduleDescription || moduleTitle;
    let content = '';
    let questions = [];
    let scenarios = [];
    
    // Handle template-specific section generation
    if (templateType === 'lightning' && sectionTitle.toLowerCase().includes('hook')) {
      // Generate Lightning template hook content
      content = `# ${sectionTitle}

## Quick Challenge Question
*"Have you ever noticed a child in your classroom who seems to struggle with ${topic.toLowerCase()}? What was your first instinct - to intervene immediately, step back and observe, or try a completely different approach?"*

## The Reality Check
Picture this: It's 10:30 AM, and you've just witnessed a situation involving ${topic.toLowerCase()} in your classroom. You have about 30 seconds to decide your next move. The children are watching, parents might be nearby, and your decision in this moment could make all the difference.

## Why This Matters Right Now
${topic} isn't just another professional development topic - it's happening in your classroom today. Whether you're dealing with it daily or preparing for when it does occur, having a clear, confident response strategy can transform both your teaching practice and the children's experience.

## Your 5-Minute Investment
In the next few minutes, you're going to discover:
- One powerful strategy that works immediately
- A simple decision framework you can use today
- Exactly what to say (and what not to say) in the moment

**Ready to dive in?** This isn't about perfect solutions - it's about practical confidence when it matters most.`;
    } else if (templateType === 'lightning' && sectionTitle.toLowerCase().includes('core strategy')) {
      // Generate Lightning template core strategy
      content = `# ${sectionTitle}

## The PAUSE Method for ${topic}
When dealing with ${topic.toLowerCase()}, remember: **P-A-U-S-E**

**P - Pause and Breathe**
Before reacting, take a conscious breath. This gives you clarity and models calm behavior.

**A - Assess the Situation**
Quickly scan: Is anyone in immediate danger? What emotions are present? What might have triggered this situation?

**U - Understand the Need**
What is the child trying to communicate through their behavior? What need are they expressing?

**S - Support with Intention**
Choose your response based on the child's need, not just the behavior you see.

**E - Evaluate and Adjust**
After responding, reflect: Did this approach work? What will you try differently next time?

## Practical Application
**In the moment:** "I see you're having a hard time with [specific situation]. Let's figure this out together."

**Your tone:** Calm, curious, supportive
**Your body language:** Get on their level, open posture
**Your mindset:** Problem-solving partner, not authority figure

## Quick Reference Card
Print or save this simple reminder:
1. Pause (breathe)
2. Assess (scan for safety and emotions)  
3. Understand (what's the underlying need?)
4. Support (respond to the need)
5. Evaluate (reflect and adjust)

This method works whether you have 30 seconds or 30 minutes to address ${topic.toLowerCase()}.`;
    } else if (templateType === 'lightning' && sectionTitle.toLowerCase().includes('action step')) {
      // Generate Lightning template action step
      content = `# ${sectionTitle}

## Your Immediate Action Plan

### Today - Before You Leave Work
- [ ] Practice the PAUSE method once during a calm moment
- [ ] Identify one area in your classroom that supports positive ${topic.toLowerCase()}
- [ ] Write down one phrase you'll use next time this situation arises

### This Week
- [ ] Try the PAUSE method with one challenging situation
- [ ] Notice and document what worked (and what didn't)
- [ ] Share this approach with one colleague or family member

### This Month
- [ ] Refine your approach based on what you've learned
- [ ] Create a simple visual reminder for yourself
- [ ] Celebrate one success story related to ${topic.toLowerCase()}

## Your Success Phrase
Choose ONE phrase to practice and use consistently:
- "I see you're having a hard time. Let's figure this out together."
- "That's a big feeling. I'm here to help you through it."
- "I notice [specific behavior]. What do you need right now?"

## Quick Win Strategy
For immediate impact: Focus on your voice tone and body language before worrying about perfect words. Children respond more to how you feel than what you say.

**Remember:** Progress, not perfection. Every small step you take in understanding ${topic.toLowerCase()} makes a difference in a child's experience.`;
    } else {
      // Generate content based on section type for other templates
      switch (sectionType) {
      case 'scenario':
      case 'hook':
        if (templateType !== 'lightning') {
          content = `# ${sectionTitle}

## Engaging Opening Scenario
Imagine you're in your classroom during a typical Tuesday morning. The children have just finished circle time, and you notice something happening that relates directly to ${topic.toLowerCase()}.

### The Situation
Sarah, a 4-year-old in your care, is experiencing exactly what this module addresses. Her response is immediate and genuine - the kind of moment that makes you pause and think, "This is exactly why I need to understand ${topic.toLowerCase()} better."

### The Challenge
You have multiple factors to consider:
- Sarah's immediate needs and emotional state
- The other children who are watching and learning
- The family's expectations and communication style
- Your own confidence in handling this situation effectively

### Your Opportunity
This isn't just about managing a moment - it's about creating a learning experience that supports Sarah's development while building your professional skills.

### Reflection Question
Before we dive deeper into strategies, take a moment to consider: What would your instinctive response be in this situation? What factors would influence your decision-making?

This scenario will serve as our foundation as we explore evidence-based approaches to ${topic.toLowerCase()}.`;
        }
        break;
      case 'introduction':
        content = `# ${sectionTitle}

Welcome to "${moduleTitle}" - a comprehensive learning experience designed to enhance your professional development in early childhood education.

## What You'll Learn
In this module, you'll explore key concepts and practical strategies related to ${moduleTitle.toLowerCase()}. This learning experience is structured to build your knowledge progressively while providing immediate applications for your classroom.

## Module Overview
${moduleDescription || `This module focuses on ${moduleTitle.toLowerCase()}, providing evidence-based approaches and real-world applications for early childhood educators.`}

## Learning Objectives
By the end of this module, you will be able to:
- Understand fundamental concepts related to ${moduleTitle.toLowerCase()}
- Apply practical strategies in your daily work with children
- Reflect on current practices and identify areas for growth
- Implement evidence-based approaches in your classroom setting

## How This Module Works
This module contains ${totalSections} sections, each designed to build upon previous learning while introducing new concepts and applications. Take your time with each section and reflect on how the content applies to your unique teaching environment.

Let's begin this learning journey together!`;
        break;
        
      case 'content':
      case 'text':
        content = `# ${sectionTitle}

## Key Concepts
This section explores essential concepts related to ${moduleTitle.toLowerCase()}, providing you with foundational knowledge that supports effective practice in early childhood education.

## Understanding the Framework
When working with ${moduleTitle.toLowerCase()}, it's important to consider the developmental needs of children and how our approaches can support their growth and learning.

## Evidence-Based Strategies
Research shows that effective implementation of ${moduleTitle.toLowerCase()} strategies includes:

### Strategy 1: Observation and Documentation
Carefully observe children's responses and document what works best in your specific context.

### Strategy 2: Environmental Considerations
Create supportive environments that facilitate positive outcomes related to ${moduleTitle.toLowerCase()}.

### Strategy 3: Family Partnership
Engage families as partners in supporting children's development and learning.

### Strategy 4: Individualized Approaches
Recognize that each child is unique and may benefit from different approaches.

## Practical Applications
Consider how these concepts apply in your daily work:
- During routine activities and transitions
- In your interactions with children and families
- When planning learning experiences
- While reflecting on your professional practice

## Reflection Prompt
How might you begin implementing these concepts in your current role? What supports or resources would be most helpful?`;

        questions = [
          {
            question: `What is a key principle when implementing ${moduleTitle.toLowerCase()} strategies?`,
            answers: [
              "Using the same approach for all children",
              "Focusing only on academic outcomes",
              "Observing and adapting to individual needs",
              "Following rigid procedures"
            ],
            correctAnswer: 2,
            explanation: "Observing and adapting to individual needs ensures that strategies are effective and responsive to each child's unique characteristics."
          },
          {
            question: `How can families support ${moduleTitle.toLowerCase()} at home?`,
            answers: [
              "By replicating classroom activities exactly",
              "Through partnership and communication with educators",
              "By avoiding any involvement",
              "Only during scheduled meetings"
            ],
            correctAnswer: 1,
            explanation: "Partnership and communication between families and educators creates consistency and support for children's development."
          }
        ];
        break;
        
      case 'video':
        content = `# ${sectionTitle}

## Video Learning Experience
This section features carefully selected video content that demonstrates key concepts related to ${moduleTitle.toLowerCase()}.

## Before Watching
Take a moment to consider your current understanding and experiences with ${moduleTitle.toLowerCase()}. What questions do you have? What challenges have you encountered?

## Key Points to Notice
As you watch, pay attention to:
- Specific strategies being demonstrated
- How children respond to different approaches
- Environmental factors that support success
- The educator's role and decision-making process

## Application Ideas
While watching, consider:
- How might you adapt these strategies for your specific context?
- What resources or supports would you need?
- How do these approaches align with your current practices?

## Discussion and Reflection
After watching, reflect on:
- What resonated most strongly with you?
- What questions emerged from this viewing?
- How might you begin implementing what you observed?

This video content is designed to bridge theory and practice, helping you visualize effective approaches in action.`;
        break;
        
      case 'activity':
      case 'interactive':
        content = `# ${sectionTitle}

## Interactive Learning Experience
This section provides hands-on activities designed to deepen your understanding of ${moduleTitle.toLowerCase()} through practical application.

## Activity Overview
Engage with realistic scenarios and challenges that early childhood educators commonly face. Through these activities, you'll practice decision-making, problem-solving, and strategy implementation.

## Learning Through Practice
Research shows that active engagement with content leads to deeper understanding and better retention. These activities are designed to:
- Connect theory to practice
- Provide safe spaces to explore different approaches
- Build confidence in your professional skills
- Encourage reflection and self-assessment

## How to Engage
As you work through these activities:
- Take your time to consider each scenario carefully
- Think about your own experiences and context
- Consider multiple perspectives and approaches
- Reflect on what you learn about yourself as an educator

## Real-World Application
After completing these activities, consider how you might apply what you've learned in your daily work with children and families.`;

        scenarios = [
          {
            scenario: `You notice a child in your classroom who seems to struggle with ${moduleTitle.toLowerCase()}. The child appears frustrated and is beginning to avoid related activities.`,
            responses: [
              "Observe the child more closely to understand their specific needs and interests",
              "Continue with the planned activities as scheduled",
              "Remove the child from these activities temporarily",
              "Focus on the children who are succeeding"
            ],
            correctResponse: 0,
            explanation: "Careful observation helps you understand the child's perspective and develop responsive strategies."
          }
        ];
        break;
        
      case 'assessment':
      case 'quiz':
        content = `# ${sectionTitle}

## Knowledge Check
This assessment helps you reflect on your understanding of key concepts related to ${moduleTitle.toLowerCase()}.

## Purpose of Assessment
This quiz is designed to:
- Help you identify areas of strength in your understanding
- Highlight concepts that may benefit from further exploration
- Provide immediate feedback on your learning
- Support your professional development journey

## Approach to Assessment
Take your time with each question and consider how the concepts apply to your specific context and experience. There's no penalty for incorrect answers - this is a learning opportunity.

## After the Assessment
Use your results to guide further learning and professional development. Consider which concepts you'd like to explore further and how you might apply new understanding in your work.`;

        questions = [
          {
            question: `What is the most important factor when implementing ${moduleTitle.toLowerCase()} strategies?`,
            answers: [
              "Following guidelines exactly as written",
              "Adapting approaches based on individual children's needs",
              "Using the same method for all situations",
              "Focusing primarily on outcomes"
            ],
            correctAnswer: 1,
            explanation: "Adapting approaches based on individual children's needs ensures that strategies are effective and responsive."
          },
          {
            question: `How can you support families in understanding ${moduleTitle.toLowerCase()}?`,
            answers: [
              "Provide written information only",
              "Schedule formal meetings exclusively",
              "Use multiple communication methods and involve families as partners",
              "Handle everything independently"
            ],
            correctAnswer: 2,
            explanation: "Using multiple communication methods and involving families as partners creates strong support systems for children."
          },
          {
            question: `What role does observation play in ${moduleTitle.toLowerCase()}?`,
            answers: [
              "It's only needed for documentation purposes",
              "It helps inform responsive teaching practices",
              "It's not particularly important",
              "It should only be done during formal assessments"
            ],
            correctAnswer: 1,
            explanation: "Observation helps inform responsive teaching practices by providing insight into children's needs, interests, and development."
          }
        ];
        break;
        
      case 'reflection':
        content = `# ${sectionTitle}

## Time for Reflection
Reflection is a crucial component of professional growth. This section provides space and prompts to help you process your learning about ${moduleTitle.toLowerCase()}.

## The Value of Reflection
Taking time to reflect helps you:
- Connect new learning to your existing knowledge and experience
- Identify practical applications for your specific context
- Recognize growth and areas for continued development
- Build confidence in your professional capabilities

## Reflection Prompts
Consider the following questions as you reflect on your learning:

### Understanding and Application
- What new insights have you gained about ${moduleTitle.toLowerCase()}?
- How do these concepts connect to your current practices?
- What surprised you most during this learning experience?

### Implementation Planning
- Which strategies are you most excited to try in your classroom?
- What supports or resources would help you implement new approaches?
- How might you adapt these concepts for your specific context?

### Professional Growth
- How has your confidence in this area changed?
- What questions do you still have?
- What would you like to learn more about?

## Moving Forward
Use your reflections to create a personal action plan. Consider small, manageable steps you can take to implement new learning in your daily practice.

## Sharing Your Learning
Consider how you might share your insights with colleagues, families, or your professional learning community.`;
        break;
        
      default:
        content = `# ${sectionTitle}

## Learning Focus
This section explores important aspects of ${moduleTitle.toLowerCase()}, providing practical insights for early childhood educators.

## Key Concepts
Understanding ${moduleTitle.toLowerCase()} involves considering multiple factors that influence children's development and learning experiences.

## Professional Application
As you engage with this content, consider how these concepts apply to your daily work with children, families, and colleagues.

## Evidence-Based Practice
The strategies and approaches presented here are grounded in research and best practices in early childhood education.

## Reflection and Growth
Take time to consider how this learning connects to your professional goals and development as an educator.`;
        break;
      }
    }
    
    return res.json({
      content,
      questions: questions.length > 0 ? questions : undefined,
      scenarios: scenarios.length > 0 ? scenarios : undefined
    });
    
  } catch (error) {
    console.error("Error generating section content:", error);
    return res.status(500).json({
      message: 'Error generating section content',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;