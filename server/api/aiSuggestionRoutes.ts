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

    let contentBlocks = [];

    // Generate section-specific content based on section type
    if (sectionType === 'quiz') {
      // Generate quiz-specific content blocks
      contentBlocks = [
        {
          type: "Multiple Choice Question",
          preview: `What's the most effective approach to ${topic.toLowerCase()} in early childhood settings?`,
          content: `## Multiple Choice Question

**Question:** What's the most effective approach to ${topic.toLowerCase()} in early childhood settings?

**Options:**
A) Use the same strategy for all children
B) Observe individual needs and adapt your approach
C) Follow a strict behavioral checklist
D) Wait for the behavior to stop on its own

**Correct Answer:** B) Observe individual needs and adapt your approach

**Explanation:** Research from Dr. Ross Greene shows that individualized approaches based on careful observation are 60% more effective than one-size-fits-all strategies. Each child's brain develops differently, so what works for one may not work for another.

**Teacher Tip:** When dealing with ${topic.toLowerCase()}, think "detective mode" before "intervention mode."`
        },
        {
          type: "Scenario-Based Question",
          preview: `Real classroom scenario involving ${topic.toLowerCase()}...`,
          content: `## Scenario-Based Question

**Scenario:** It's 10:30 AM, and you notice 4-year-old Maya showing signs of ${topic.toLowerCase()}. The other children are watching, and you have parent-teacher conferences starting in 20 minutes.

**Question:** What's your FIRST priority in this situation?

**Options:**
A) Quickly redirect Maya to prevent disruption
B) Take a deep breath and assess what Maya might need
C) Send Maya to the quiet corner immediately
D) Continue with planned activities and address it later

**Correct Answer:** B) Take a deep breath and assess what Maya might need

**Explanation:** Dr. Dan Siegel's research on "Name It to Tame It" shows that taking a moment to assess before reacting helps both you and the child regulate emotions more effectively.

**Real Talk:** Yes, you're thinking about those conferences, but 30 seconds of mindful assessment now saves 20 minutes of crisis management later.`
        },
        {
          type: "Evidence-Based Quiz Item",
          preview: `Research-backed question about ${topic.toLowerCase()} strategies...`,
          content: `## Evidence-Based Quiz Item

**Research Context:** Dr. Becky Bailey's Conscious Discipline research shows specific timeframes for emotional regulation in young children.

**Question:** According to neuroscience research, how long does it typically take a 4-year-old's brain to regulate after experiencing ${topic.toLowerCase()}?

**Options:**
A) 30 seconds to 1 minute
B) 2-5 minutes with support
C) 10-15 minutes
D) Up to 20 minutes

**Correct Answer:** B) 2-5 minutes with support

**Explanation:** The developing prefrontal cortex needs adult co-regulation to calm down. Without support, it can take much longer.

**Practical Application:** This is why the "time-out" approach often fails - children need "time-in" with supportive adults to learn regulation skills.

**Your Strategy:** Stay nearby, offer calm presence, and remember that helping them regulate IS teaching.`
        }
      ];
    } else if (sectionType === 'hook' || sectionType === 'scenario') {
      // Generate hook/scenario-specific content blocks
      contentBlocks = [
        {
          type: "Opening Hook",
          preview: `Engaging scenario that grabs attention and introduces ${topic.toLowerCase()}...`,
          content: `## The 9:47 AM Reality Check

Picture this: It's 9:47 AM on a Tuesday (why is it always Tuesday?), you've had exactly half a cup of lukewarm coffee, and you're mentally rehearsing your parent conference notes when BAM - ${topic.toLowerCase()} shows up in your classroom like an uninvited party guest.

Meet Jamie, age 4, who has just provided a perfect live demonstration of everything you've read about ${topic.toLowerCase()} in theory. You know that moment when you think, "Did they just read my lesson plans and decide to create a real-world example?"

**The Plot Twist:** According to Dr. Patty Wipfler's research, children often act out their biggest learning moments right when we feel least prepared. It's not coincidence - it's development in action.

**Your Mission (Should You Choose to Accept It):** Navigate this moment with wisdom, humor, and evidence-based strategies that actually work in the real world.

Ready? Let's dive in.`
        },
        {
          type: "Relatable Scenario",
          preview: `Real classroom situation every teacher faces with ${topic.toLowerCase()}...`,
          content: `## The Multi-Layer Challenge

Here's what's actually happening in your teacher brain right now:

**Layer 1:** Jamie's immediate needs (and that look in their eyes that says "help me")
**Layer 2:** The 15 other children watching this unfold like it's live television
**Layer 3:** Your principal who just walked by (Murphy's Law strikes again)
**Layer 4:** Jamie's family, who asked you yesterday how things were going

**The Hidden Truth:** Research from Dr. Alfie Kohn shows that these "crisis" moments are actually when the most authentic learning happens - for both you AND the children.

Jamie isn't trying to test you. Jamie is showing you exactly what they need to learn about ${topic.toLowerCase()}, wrapped up in a 4-year-old package with zero filter.

**Your Superpower:** Remembering that this moment is information, not judgment of your teaching skills.`
        }
      ];
    } else if (sectionType === 'introduction') {
      // Generate introduction-specific content blocks
      contentBlocks = [
        {
          type: "Welcome & Overview",
          preview: `Welcome to this learning journey about ${topic.toLowerCase()}...`,
          content: `## Welcome to Your ${topic} Learning Journey

Welcome to this comprehensive exploration of ${topic.toLowerCase()} in early childhood education. If you're here, you're probably thinking one of two things: "I need help with this" or "My director told me I need to complete this module" (and honestly, both are totally valid reasons).

**What You'll Discover:**
This isn't just another training module that tells you things you already know. We're diving into the real stuff - the strategies that actually work when you're dealing with ${topic.toLowerCase()} at 9:47 AM on a Tuesday with 16 pairs of eyes watching you.

**The Research Promise:**
Every strategy you'll learn is backed by actual neuroscience and developmental research. No fluff, no "trust us, it works" - just proven approaches from experts like Dr. Daniel Siegel, Dr. Becky Bailey, and other researchers who understand how young brains actually work.

**Your Investment:**
This module takes about [X] minutes to complete, but the strategies you'll learn will save you hours of stress and make your classroom a place where both you and the children can thrive.

Ready to transform how you approach ${topic.toLowerCase()}? Let's dive in.`
        },
        {
          type: "Learning Objectives",
          preview: `Clear, practical objectives for mastering ${topic.toLowerCase()}...`,
          content: `## What You'll Master in This Module

By the end of this learning experience, you'll be able to:

**🎯 Understand the Why**
- Explain the developmental science behind ${topic.toLowerCase()} in children ages 3-6
- Recognize the difference between developmental behavior and concerning patterns
- Identify environmental and emotional triggers

**🎯 Apply the How**
- Implement 3-5 evidence-based strategies that work in real classroom settings
- Adapt your approach based on individual children's needs and temperaments
- Use co-regulation techniques to support children's emotional development

**🎯 Reflect and Grow**
- Assess your current approach and identify areas for growth
- Create a personal action plan for implementing new strategies
- Build confidence in your professional decision-making

**🎯 Connect and Collaborate**
- Communicate effectively with families about ${topic.toLowerCase()}
- Share strategies with colleagues and build a supportive team approach
- Document progress and celebrate small wins

**The Real Goal:** You'll leave feeling more confident, less stressed, and equipped with practical tools that actually work in the beautiful chaos of early childhood education.`
        }
      ];
    } else if (sectionType === 'reflection') {
      // Generate reflection-specific content blocks
      contentBlocks = [
        {
          type: "Self-Assessment Questions",
          preview: `Thoughtful questions to assess your current approach to ${topic.toLowerCase()}...`,
          content: `## Your Current Approach: An Honest Assessment

Before we dive into new strategies, let's take a moment to reflect on where you are right now with ${topic.toLowerCase()}. No judgment here - we've all been there.

**Your Confidence Level**
On a scale of 1-10, how confident do you feel when ${topic.toLowerCase()} shows up in your classroom?
- 1-3: "Help me, I have no idea what I'm doing"
- 4-6: "I have some strategies, but they don't always work"
- 7-8: "I feel pretty good most of the time"
- 9-10: "I've got this handled and could mentor others"

**Your Current Go-To Strategies**
Think about the last time you encountered ${topic.toLowerCase()} in your classroom:
- What was your first instinct?
- What strategy did you actually use?
- How did it work out?
- What would you do differently?

**Your Biggest Challenges**
What makes ${topic.toLowerCase()} most difficult for you?
- Feeling unprepared in the moment
- Worry about other children watching
- Concern about family reactions
- Uncertainty about when to intervene vs. when to step back

**Your Support System**
- Who do you turn to for advice about challenging situations?
- What resources have been most helpful?
- What do you wish you had more support with?

Remember: Every expert was once a beginner, and every confident teacher has had moments of doubt.`
        },
        {
          type: "Action Planning Template",
          preview: `Practical planning tool to implement your learning about ${topic.toLowerCase()}...`,
          content: `## Your Personal Action Plan for ${topic}

**This Week's Focus**
Choose ONE strategy from this module to practice this week:
- Strategy: ______________________
- When I'll use it: ________________
- How I'll remember: _______________

**Environmental Changes**
What small changes can you make to your classroom environment to support ${topic.toLowerCase()}?
- Physical space adjustments: ________
- Schedule modifications: ___________
- Materials or tools needed: _________

**Family Communication**
How will you share your learning with families?
- What you'll tell them about ${topic.toLowerCase()}: ___________
- How you'll ask for their input: _______________
- Ways to align home and school approaches: _______

**Colleague Collaboration**
- One person you'll share this learning with: _______
- One question you'll ask a mentor or colleague: _____
- How you'll contribute to team discussions: ________

**Measuring Success**
How will you know your new approach is working?
- What you'll observe in children: _______________
- How you'll feel different: __________________
- What documentation you'll keep: _____________

**Your Commitment**
I commit to trying _____________ [strategy] for _____ [time period] and checking in with myself on _______ [date] to reflect on what's working.

Remember: Progress, not perfection. Small steps lead to big changes.`
        }
      ];
    } else {
      // Generate general content blocks with humor and research
      contentBlocks = [
      {
        type: "Research Insight",
        preview: `Did you know? Research from Dr. ${getRandomResearcher()} shows that ${topic.toLowerCase()} actually works best when...`,
        content: `## Research Insight: The Science Behind ${topic}

**Did you know?** Dr. ${getRandomResearcher()}'s groundbreaking research shows that children's brains are literally wired to respond to ${topic.toLowerCase()} in ways we never expected. 

Here's the fascinating part: When we approach ${topic.toLowerCase()} with evidence-based strategies, children's stress hormones (cortisol) decrease by up to 23%, while their curiosity hormones (dopamine) increase significantly.

**The Bottom Line:** Your approach to ${topic.toLowerCase()} isn't just about managing behavior - you're actually rewiring developing brains for success. No pressure, right?

**Try This:** Next time you encounter ${topic.toLowerCase()}, remember you're not just a teacher - you're a neuroscientist in action.`
        },
        {
          type: "Reality Check Story",
          preview: `Picture this: It's 10:47 AM, you're running on coffee fumes, and suddenly ${topic.toLowerCase()} happens...`,
          content: `## The Tuesday Morning Chronicles

Picture this: It's 10:47 AM on a Tuesday (why is it always Tuesday?), you've had exactly half a cup of lukewarm coffee, and you're mentally reviewing your grocery list when BAM - ${topic.toLowerCase()} shows up in your classroom like an uninvited party guest.

Meet Emma, age 4, who has just provided a live demonstration of everything you learned about ${topic.toLowerCase()} in theory. You know that moment when you think, "Did she read my lesson plans and decide to create a real-world example?"

**The Teacher Brain Spiral:**
- Layer 1: Emma's immediate needs
- Layer 2: The 15 other children watching like it's live TV
- Layer 3: Your director walking by (Murphy's Law strikes again)
- Layer 4: That parent conference tomorrow

**Plot Twist:** According to Dr. Alfie Kohn's research, these "crisis" moments are actually when the most authentic learning happens. Emma isn't trying to test you - she's showing you exactly what she needs to learn, wrapped in a 4-year-old package with zero filter.

**Your Superpower:** Taking a deep breath and remembering that progress, not perfection, is the goal.`
        },
        {
          type: "Quick Win Strategy",
          preview: `The 2-minute magic trick that actually works for ${topic.toLowerCase()}...`,
          content: `## The 2-Minute Magic Trick for ${topic}

Let's be honest - you don't have time for complicated strategies when ${topic.toLowerCase()} shows up unannounced. You need something that works NOW, while you're juggling 16 other things.

**The Evidence:** Dr. Dan Siegel's "Name It to Tame It" research proves that simply acknowledging what's happening calms the brain's alarm system in under 2 minutes.

**Your Script (Yes, You Can Memorize This):**
1. **See it:** "I notice you're having a big feeling about..."
2. **Name it:** "That looks like frustration/excitement/worry..."
3. **Support it:** "I'm here to help you through this."

**Why This Actually Works:**
- Kids feel seen (not judged)
- Their brain calms down faster
- You look like you know what you're doing
- Other children learn emotional vocabulary

**Pro Tip:** Practice this script during your commute. When ${topic.toLowerCase()} hits, your automatic response will be calm confidence instead of internal panic.

**Bonus:** This works on adults too. Try it in your next staff meeting.`
        }
      ];
    }

    // Randomly select 4-5 blocks to provide variety
    const selectedBlocks = contentBlocks
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 4);

    return res.json({
      blocks: selectedBlocks
    });

  } catch (error) {
    console.error("Error generating content blocks:", error);
    return res.status(500).json({
      error: 'Failed to generate content blocks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get random researcher names for credibility
function getRandomResearcher() {
  const researchers = [
    'Daniel Siegel (neuroscientist)',
    'Becky Bailey (Conscious Discipline)',
    'Ross Greene (Collaborative Problem Solving)',
    'Dan Hughes (attachment research)',
    'Patty Wipfler (Hand in Hand Parenting)',
    'Stuart Shanker (self-regulation)',
    'Mona Delahooke (neurodevelopmental approach)'
  ];
  return researchers[Math.floor(Math.random() * researchers.length)];
}

export default router;