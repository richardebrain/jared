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

## The Tuesday Morning Reality Check
Picture this: It's 9:47 AM on a Tuesday (why is it always Tuesday?), you've had exactly half a cup of coffee, and you're mentally rehearsing your grocery list when BAM - ${topic.toLowerCase()} shows up in your classroom like an uninvited party guest.

### The Situation That Writes Itself
Meet Jamie, age 4, who has just demonstrated a perfect real-world example of ${topic.toLowerCase()}. You know that moment when you think, "Did they just read my lesson plans and decide to provide a live demonstration?"

**What the Research Tells Us:** Dr. Patty Wipfler's research on Hand in Hand Parenting shows that children often act out their biggest learning moments right when we feel least prepared. It's not coincidence - it's development in action.

### The Multi-Layered Challenge (AKA: Real Life)
Here's what's actually happening in your teacher brain right now:
- **Layer 1:** Jamie's immediate needs (and that look in their eyes)
- **Layer 2:** The 15 other children watching this unfold like it's live television
- **Layer 3:** Your principal walking by at exactly this moment (Murphy's Law strikes again)
- **Layer 4:** Jamie's family, who asked you yesterday how things were going

### The Hidden Opportunity
**Plot twist:** According to Dr. Alfie Kohn's research on intrinsic motivation, these "crisis" moments are actually when the most authentic learning happens - for both you AND the children.

Jamie isn't trying to ruin your day. Jamie is showing you exactly what they need to learn, wrapped up in a 4-year-old package with no filter.

### Your Pre-Strategy Reality Check
Before we dive into the "what to do" part, let's get honest: What's your first instinct when ${topic.toLowerCase()} shows up uninvited? Are you a "freeze and pray" teacher, a "redirect immediately" teacher, or a "wonder what I did wrong" teacher?

**No judgment here** - we've all been there. Dr. Dan Hughes' PACE model (Playfulness, Acceptance, Curiosity, Empathy) reminds us that our first response sets the tone for everything that follows.

This scenario isn't just a teaching moment - it's a window into how ${topic.toLowerCase()} really works in the wild.`;
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

## The Real Deal About ${topic}
Let's be honest - as an early childhood educator, you've probably dealt with situations involving ${topic.toLowerCase()} more times than you've had lukewarm coffee (which, let's face it, is A LOT). But here's the thing: there's actual science behind what works, and it's pretty fascinating.

## What the Research Says (The Good Stuff)
**Did you know?** Neuroscientist Dr. Daniel Siegel's research shows that a child's brain doesn't fully develop the capacity for self-regulation until around age 25. So when you're dealing with ${topic.toLowerCase()}, you're literally working with a brain under construction - hard hat required!

### The Evidence-Based Toolkit
Based on research from leaders like Dr. Becky Bailey (Conscious Discipline) and Dr. Ross Greene (Collaborative Problem Solving):

**Strategy 1: The "Name It to Tame It" Approach**
Dr. Dan Siegel's research proves that simply naming emotions helps regulate the brain's amygdala. When dealing with ${topic.toLowerCase()}, try: "I see a frustrated body. Your brain is having big feelings right now."

**Strategy 2: The Environmental Detective Work**
Maria Montessori was onto something - the environment IS the third teacher. Notice what triggers ${topic.toLowerCase()} situations:
- Is it transition times? (Hint: it's almost always transition times)
- Too much visual stimulation?
- Hunger? (When in doubt, offer a snack)

**Strategy 3: The Family Partnership Power-Up**
Research by Dr. Joyce Epstein shows that when families and teachers align strategies, children make 40% more progress. Share what works at school and ask what works at home.

## The Plot Twist Nobody Tells You
Here's what veteran teachers know: Sometimes the "problem" behavior is actually communication. Children who struggle with ${topic.toLowerCase()} are often our most creative problem-solvers - they just need help channeling that energy.

## Your Monday Morning Game Plan
1. **The 2-Minute Reset**: Take two minutes to observe before reacting
2. **The Curiosity Question**: Ask yourself "What is this child trying to tell me?"
3. **The Partnership Play**: Connect with families about what you're seeing

**Pro Tip**: Remember Maslow before Bloom - a child's basic needs (safety, belonging, hunger) must be met before learning can happen.

## Reflection Prompt
How might you begin implementing these concepts in your current role? What supports or resources would be most helpful?

**Your Turn**: This week, try ONE of these strategies and notice what happens. Document it like a scientist - no judgment, just curiosity. What worked? What surprised you? What would you adjust next time?`;

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

/**
 * Generate diverse content blocks for drag-and-drop module building
 */
router.post('/generate-content-blocks', async (req, res) => {
  try {
    const { topic, sectionTitle, moduleTitle, sectionType } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('Generating content blocks for:', { topic, sectionTitle, moduleTitle, sectionType });

    // Check section type for specific content generation
    const isActivitySection = sectionTitle?.toLowerCase().includes('activity') || 
                             sectionTitle?.toLowerCase().includes('step-by-step') ||
                             sectionTitle?.toLowerCase().includes('guided') ||
                             sectionType === 'example';

    const isCaseStudySection = sectionTitle?.toLowerCase().includes('case study') || 
                              sectionTitle?.toLowerCase().includes('story') ||
                              (sectionTitle?.toLowerCase().includes('scenario') && !sectionTitle?.toLowerCase().includes('ai-guided')) ||
                              sectionType === 'story';

    const isWhyItMattersSection = sectionTitle?.toLowerCase().includes('why it matters') || 
                                 sectionTitle?.toLowerCase().includes('science') ||
                                 sectionTitle?.toLowerCase().includes('policy') ||
                                 sectionTitle?.toLowerCase().includes('research');

    const isHandsOnPracticeSection = sectionTitle?.toLowerCase().includes('hands-on practice') || 
                                    sectionTitle?.toLowerCase().includes('hands-on') ||
                                    sectionTitle?.toLowerCase().includes('ai-guided scenario') ||
                                    (sectionTitle?.toLowerCase().includes('practice') && !sectionTitle?.toLowerCase().includes('case study')) ||
                                    sectionType === 'simulation';

    const isReflectionSection = sectionTitle?.toLowerCase().includes('reflection') || 
                               sectionTitle?.toLowerCase().includes('action plan') ||
                               sectionTitle?.toLowerCase().includes('implementation') ||
                               sectionTitle?.toLowerCase().includes('review');

    console.log('Section detection:', {
      isActivitySection,
      isCaseStudySection, 
      isWhyItMattersSection,
      isHandsOnPracticeSection,
      isReflectionSection,
      sectionTitle: sectionTitle?.toLowerCase()
    });

    // Use OpenAI to generate topic-specific content blocks
    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let prompt;
    
    if (isCaseStudySection) {
      prompt = `
You are an expert early childhood education storyteller creating compelling case studies and hero's journey stories for "${topic}".

Create 3-4 emotionally engaging options that teachers can choose from:

OPTION 1: REALISTIC CASE STUDY
Create a detailed case study with:
- Real classroom scenario involving "${topic}"
- Specific teacher character facing challenges
- Children's names, ages, and behaviors
- Emotional stakes and tension
- Step-by-step problem-solving
- Successful resolution with lessons learned

OPTION 2: HERO'S JOURNEY STORY
Create an inspiring narrative with:
- Teacher protagonist facing "${topic}" challenge
- Call to adventure (the problem arises)
- Resistance and obstacles
- Mentor guidance or learning moment
- Transformation and growth
- Return with new wisdom to help others

OPTION 3: EMOTIONAL TRANSFORMATION STORY
Create a touching story about:
- Teacher's initial struggles with "${topic}"
- Personal doubts and fears
- Breakthrough moment
- Positive impact on children
- Renewed confidence and purpose

Each option should be a complete, standalone story (400-600 words) that teachers can directly use in their module sections.

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": "Story Option"
- "preview": Brief engaging description 
- "content": Complete formatted story text ready to use`;
    
    } else if (isWhyItMattersSection) {
      prompt = `
You are an expert early childhood education researcher explaining the importance of "${topic}" using varied levels of complexity.

Generate 4-6 content blocks with different complexity levels:

SIMPLE BLOCKS (2-3 blocks):
- Basic, easy-to-understand explanations
- Simple bullet points
- Practical "why this matters to you" content
- Quick facts teachers can remember

COMPLEX BLOCKS (2-3 blocks):
- Detailed research citations with specific researcher names
- Policy implications and regulatory connections
- Scientific explanations of child development
- Connection to licensing standards and quality frameworks

Mix simple and complex content so teachers can choose their preferred depth level.

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": "Why It Matters - Simple" or "Why It Matters - Research"
- "preview": Brief description indicating complexity level
- "content": Content matching the complexity level indicated in type`;
    
    } else if (isActivitySection) {
      prompt = `
You are an expert early childhood education instructor creating hands-on activities for "${topic}".

Generate 3-4 step-by-step guided activities that teachers can immediately implement in their classrooms related to "${topic}".

Each activity should include:
1. Clear step-by-step instructions (numbered steps)
2. Materials needed
3. Age group recommendations
4. Learning objectives
5. Assessment opportunities
6. Adaptations for different learning styles

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": "Guided Activity"
- "preview": Brief activity description
- "content": Complete activity instructions ready to use`;
    
    } else if (isHandsOnPracticeSection) {
      prompt = `
CRITICAL: Create ONLY formatted lists, checklists, and worksheets - ZERO narrative content allowed.

REQUIRED OUTPUT FORMAT:
- Start content with "CHECKLIST:" or "WORKSHEET:" or "AUDIT FORM:"
- Use ONLY bullet points with □ checkbox symbols
- Use ONLY numbered lists with blanks: _______
- Use ONLY Yes/No questions with □ YES □ NO format

EXAMPLES OF CORRECT FORMAT:

CHECKLIST: ECERS Environment Preparation
□ Remove clutter from learning centers
□ Organize materials at child height
□ Check safety equipment is visible
□ Update documentation boards
□ Prepare assessment materials

WORKSHEET: Pre-Assessment Planning
1. My biggest concern about ECERS is: _________________
2. I will prepare by: _______________________________
3. Materials I need to organize: ____________________

AUDIT FORM: Room Readiness Check
□ YES □ NO - Are learning centers clearly defined?
□ YES □ NO - Is documentation current and visible?
□ YES □ NO - Are materials age-appropriate and accessible?

NEVER include:
- Character names or stories
- "Imagine" scenarios  
- Narrative descriptions
- Conversational text

CREATE 3 different tools using ONLY the formats above.

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": Must be exactly "Checklist" or "Worksheet" or "Audit Form"
- "preview": Brief tool description (e.g., "Environment Preparation Checklist")
- "content": Must start with "CHECKLIST:" or "WORKSHEET:" or "AUDIT FORM:" followed by formatted lists only`;

    } else if (isReflectionSection) {
      prompt = `
You are creating a comprehensive reflection and action planning section for the "${topic}" training module.

Create a review of ALL previous sections with implementation planning:

SECTION 1: TRAINING REVIEW
- Quick bullet point summary of each previous section
- Key takeaways from the entire module
- Most important concepts to remember

SECTION 2: FILL-IN-THE-BLANKS ACTION PLANNING
Create specific prompts like:
"In my classroom, I will implement _____________ by ____________"
"The first change I'll make this week is ____________"
"To prepare for this, I need to ____________"
"I will know this is working when I see ____________"

SECTION 3: IMPLEMENTATION TIMELINE
- This week: ____________
- This month: ____________  
- This quarter: ____________

Make it practical and specific to their classroom implementation.

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": "Module Review" or "Action Planning" or "Implementation Timeline"
- "preview": Brief description of reflection focus
- "content": Complete review and planning content with fill-in-the-blanks`;
    
    } else {
      // Default generic content generation
      prompt = `
You are an expert early childhood education instructor creating educational content for "${topic}".

Generate 3-5 educational content blocks that help teachers understand and implement concepts related to "${topic}".

Each content block should include practical, actionable information that teachers can use immediately in their classrooms.

FORMAT: Return a JSON object with "blocks" array. Each block should have:
- "type": "Educational Content"
- "preview": Brief description of the content
- "content": Full detailed educational content

Focus specifically on "${topic}" - make each content block directly address this topic with practical implementation.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are an expert early childhood education content creator. Always return valid JSON format with a 'blocks' array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"blocks": []}');
    
    if (!result.blocks || result.blocks.length === 0) {
      throw new Error('No content blocks generated');
    }

    console.log(`Generated ${result.blocks.length} content blocks for topic: ${topic}`);
    
    return res.json({
      blocks: result.blocks
    });

  } catch (error) {
    console.error("Error generating content blocks:", error);
    
    // Topic-specific fallback content
    const contentBlocks = [
      {
        type: "Research Insight",
        preview: `Latest research findings about ${topic} in early childhood settings...`,
        content: `## Current Research on ${topic}\n\nRecent studies in early childhood education have revealed important insights about ${topic} that directly impact your daily practice.\n\n**Key Finding:** Children experiencing ${topic} show significant improvement when educators use specific, evidence-based approaches rather than generic classroom management techniques.\n\n**What This Means for You:** Your response to ${topic} situations should be tailored to the specific context and individual child's needs. Research shows that understanding the underlying causes of ${topic} leads to more effective interventions.\n\n**Implementation Strategy:**\n1. Observe patterns related to ${topic} in your classroom\n2. Document what triggers ${topic} behaviors or situations\n3. Apply targeted strategies based on current research\n4. Monitor outcomes and adjust approaches as needed\n\nThis research-backed approach to ${topic} creates more positive outcomes for both children and educators.`
      },
      {
        type: "Quick Strategy",
        preview: `Immediate technique for handling ${topic} situations...`,
        content: `## The 30-Second ${topic} Strategy\n\nWhen ${topic} appears in your classroom, you need an immediate, effective response.\n\n**The Strategy:** The "Pause, Assess, Respond" approach specifically designed for ${topic} situations.\n\n**Step 1 - Pause (5 seconds):** Take a breath and resist the urge to react immediately to ${topic}.\n\n**Step 2 - Assess (10 seconds):** Quickly evaluate what's driving the ${topic} behavior or situation.\n\n**Step 3 - Respond (15 seconds):** Use a targeted approach based on your assessment of the ${topic} context.\n\n**Your Script for ${topic}:**\n- "I notice you're dealing with ${topic}. Let's work through this together."\n- "I can see ${topic} is challenging right now. What do you need?"\n- "Let's find a way to handle ${topic} that works for everyone."\n\n**Why This Works:** This approach addresses ${topic} directly while maintaining your calm and showing children you're equipped to handle challenging situations.`
      }
    ];

    return res.json({
      blocks: contentBlocks
    });
  }
});

/**
 * Generate flashcards/key terms for educational content
 */
router.post('/generate-flashcards', async (req, res) => {
  try {
    const { moduleTitle, moduleDescription, sectionTitle, category, sectionType } = req.body;
    
    if (!moduleTitle) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    console.log('Generating flashcards for:', { moduleTitle, sectionTitle, category });

    const openai = new (await import("openai")).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are an expert early childhood education instructor creating key terms and definitions for a module about "${moduleTitle}".

Create 8-10 educational flashcards with key terms and clear, practical definitions that early childhood educators need to understand about "${moduleTitle}".

REQUIREMENTS:
- Focus specifically on "${moduleTitle}" concepts
- Use terminology relevant to early childhood education (ages 2-5)
- Include both theoretical concepts and practical applications
- Make definitions clear and actionable for teachers
- Include developmental considerations where appropriate

Format as JSON:
{
  "flashcards": [
    {
      "term": "Key Term",
      "definition": "Clear, practical definition that teachers can understand and apply immediately"
    }
  ]
}

Example topics to consider:
- Core concepts related to "${moduleTitle}"
- Developmental milestones relevant to the topic
- Assessment strategies
- Implementation techniques
- Safety considerations (if applicable)
- Evidence-based practices
- Professional terminology teachers should know
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert early childhood education curriculum designer specializing in professional development and key terminology."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"flashcards": []}');
    
    if (!result.flashcards || result.flashcards.length === 0) {
      throw new Error('No flashcards generated');
    }

    console.log(`Generated ${result.flashcards.length} flashcards for: ${moduleTitle}`);
    
    return res.json({
      flashcards: result.flashcards
    });

  } catch (error) {
    console.error("Error generating flashcards:", error);
    
    // Fallback flashcards with generic early childhood education terms
    const fallbackFlashcards = [
      {
        term: "Scaffolding",
        definition: "Providing temporary support and guidance to help children achieve tasks they couldn't complete independently"
      },
      {
        term: "Zone of Proximal Development",
        definition: "The difference between what a child can do alone and what they can achieve with guidance and support"
      },
      {
        term: "Emergent Curriculum",
        definition: "An educational approach that builds curriculum based on children's interests and developmental needs"
      },
      {
        term: "Positive Guidance",
        definition: "Teaching appropriate behavior through supportive, respectful interactions rather than punishment"
      },
      {
        term: "Developmentally Appropriate Practice",
        definition: "Teaching methods that are suitable for children's age, individual development, and cultural background"
      }
    ];
    
    return res.json({
      flashcards: fallbackFlashcards
    });
  }
});

// All content generation now handled by OpenAI in the main route above

export default router;
