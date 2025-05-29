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
      } else if (type === 'template-content' && prompt.includes('interactive scenario')) {
        // Generate Interactive Scenarios with decision points
        const scenarioContent = `# ${moduleTopic} - Interactive Scenario

## 🎯 Learning Objectives
By the end of this scenario, you will be able to:
- Identify appropriate responses to challenging classroom situations
- Apply evidence-based strategies for ${category} 
- Make informed decisions that support children's development
- Reflect on the impact of different teaching approaches

## 📖 The Scenario

**Setting:** It's 10:30 AM in your preschool classroom. You have 16 children ages 3-5 engaged in various learning centers.

**The Situation:** 
Emma (age 4) has been building a tall block tower for the past 15 minutes. She's very focused and proud of her work. Suddenly, Tyler (age 3) runs past and accidentally knocks over her tower. Emma immediately starts crying loudly and yells "Tyler is mean! He broke my castle!" Tyler looks shocked and starts to tear up too.

Several other children stop their activities to watch. The situation is escalating quickly.

## 🤔 Decision Point 1: Your Immediate Response

**What do you do first?**

### Option A: Address Emma's Emotions First
*"Emma, I can see you're really upset. That tower took a lot of work. Let's take some deep breaths together."*

**Outcome:** Emma begins to calm down, but Tyler is still standing there looking confused and upset.

### Option B: Focus on Problem-Solving
*"Accidents happen! Emma and Tyler, let's work together to rebuild that tower even better!"*

**Outcome:** Emma gets more upset because you didn't acknowledge her feelings. She shouts "NO!" and throws blocks.

### Option C: Separate the Children
*"Emma, you need to use your inside voice. Tyler, come sit in the quiet corner for a few minutes."*

**Outcome:** Both children become more distressed. Tyler cries harder thinking he's in trouble, and Emma feels her feelings weren't heard.

**✅ Best Choice: Option A** - Acknowledging emotions first helps children feel heard and valued.

## 🤔 Decision Point 2: Helping Both Children

**After Emma has calmed down slightly, how do you help both children?**

### Option A: Facilitate Understanding
*"Tyler, come here. Emma, can you tell Tyler how you felt when your tower fell down? Tyler, it was an accident, but how can we help Emma feel better?"*

**Outcome:** Both children engage in problem-solving. Tyler offers to help rebuild, and Emma accepts.

### Option B: Give a Mini-Lesson
*"Class, everyone stop and listen. This is why we have a rule about walking feet in the classroom."*

**Outcome:** The teaching moment interrupts the natural resolution process and makes both children feel like they're in trouble.

### Option C: Distract and Redirect
*"Look everyone! Let's all do jumping jacks and then have snack time!"*

**Outcome:** The conflict isn't resolved, and children don't learn how to handle similar situations in the future.

**✅ Best Choice: Option A** - Children learn empathy, communication, and problem-solving skills.

## 🤔 Decision Point 3: Follow-Up Learning

**How do you extend this learning opportunity?**

### Option A: Individual Reflection
*Talk privately with each child later about what happened and how they felt.*

**Outcome:** Good individual processing, but misses the community learning opportunity.

### Option B: Group Discussion
*During circle time, discuss "What do we do when accidents happen?" without naming specific children.*

**Outcome:** All children learn strategies for handling similar situations and build classroom community.

### Option C: Move On
*The situation is resolved, so no follow-up is needed.*

**Outcome:** Missed opportunity to reinforce learning and build emotional intelligence skills.

**✅ Best Choice: Option B** - Builds community problem-solving skills and emotional intelligence.

## 🧠 Why These Choices Matter

**Emotional Validation:** Children need to feel heard before they can learn. When we acknowledge feelings first, we build trust and emotional safety.

**Teaching Moments:** Conflicts are opportunities to practice social-emotional skills in real, meaningful contexts.

**Community Building:** When children learn to solve problems together, they develop empathy and cooperation skills that last a lifetime.

## 💡 Key Takeaways
- Always validate feelings before problem-solving
- Use conflicts as learning opportunities, not just problems to fix
- Help children develop their own problem-solving skills rather than solving for them
- Follow up to reinforce learning and build community

## 🤝 Try This Next Time
When similar situations arise, remember the "Feel, Think, Act" approach:
1. **Feel:** "I can see you're upset..."
2. **Think:** "What do you think we could do about this?"
3. **Act:** Support children in implementing their solutions

## 📝 Reflection Questions
- How might your response change based on the children's developmental levels?
- What environmental factors could help prevent similar conflicts?
- How can you support both the "victim" and the "aggressor" in conflicts?
- What role does your own emotional regulation play in these moments?`;

        return res.json({
          suggestions: scenarioContent
        });
      } else {
        // Handle other template types with specific content generation
        let specificContent = '';
        
        if (prompt.includes('mini video lesson')) {
          specificContent = `# ${moduleTopic} - Mini Video Lesson Script

## 🎬 Video Hook (0-15 seconds)
*[Energetic music, teacher waving]*
"Hey there, amazing educators! Ready to transform your ${category} skills in just 3 minutes? Let's dive in!"

## 📚 Main Teaching Points (15 seconds - 2 minutes)
*[Visual: classroom scenes, bullet points on screen]*

**Key Strategy #1:** [Evidence-based approach for ${moduleTopic}]
- Quick tip that teachers can implement immediately
- Visual example from real preschool setting

**Key Strategy #2:** [Practical application]
- Step-by-step process teachers can follow
- Common mistake to avoid

**Key Strategy #3:** [Student engagement technique]
- How to make this work with different developmental levels
- Adaptation ideas for diverse learners

## ⚡ Action Challenge (2-2:30 minutes)
*[Call-to-action screen with timer]*
"Your challenge: Try ONE of these strategies in your classroom this week and notice what happens!"

## 🎯 Wrap-Up (2:30-3 minutes)
*[Encouraging teacher on screen]*
"Remember, small changes make big impacts. You've got this! Share your wins in the comments below."

## 🔗 Follow-Up Activities
- Practice worksheet with scenario examples
- Reflection journal prompts
- Quick self-assessment checklist`;
        } else if (prompt.includes('quiz and teachback')) {
          specificContent = `# ${moduleTopic} - Quiz & Teachback Session

## 📋 Quick Knowledge Check (5 questions)

**Question 1:** What is the most important first step when addressing ${moduleTopic} situations?
a) Set clear rules
b) Validate children's feelings
c) Remove the child from the situation
d) Call the parents

**Answer: B** - Research shows that emotional validation must come before problem-solving for effective learning.

**Question 2:** Which developmental factor is most important to consider with ${moduleTopic}?
a) Age of the child
b) Time of day
c) Individual temperament and experiences
d) Classroom size

**Answer: C** - Every child brings unique experiences and temperament that affect their responses.

[Continue with 3 more targeted questions...]

## 🎓 Teachback Challenge

**Your Task:** Explain to a colleague (or practice out loud) how you would handle this situation:

*"A 4-year-old child is consistently having meltdowns during transition times, affecting the whole class dynamic."*

**Include in your explanation:**
- What you would observe first
- How you would respond in the moment
- What long-term strategies you would implement
- How you would communicate with parents

## ✅ Self-Assessment Checklist
After your teachback, check if you included:
□ Acknowledged the child's developmental needs
□ Mentioned specific, actionable strategies
□ Considered environmental factors
□ Planned for parent communication
□ Showed understanding of underlying causes

## 🚀 Next Steps
Based on your teachback, identify one area to focus on improving in your practice.`;
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