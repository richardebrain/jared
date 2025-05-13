import { User, LearningModule } from "@shared/schema";

// Function to generate a prompt for the AI based on learning style and classroom challenge
export function generateLessonPrompt(
  user: User,
  module: LearningModule,
  challenge: string
): string {
  const learningStyle = user.learningStyle?.preferred || 'visual';
  
  // Create a style-specific instruction
  let styleInstruction = '';
  
  switch (learningStyle) {
    case 'visual':
      styleInstruction = 'Include descriptions of visual aids, diagrams, and color-coding systems. Use descriptive language that creates mental images.';
      break;
    case 'auditory':
      styleInstruction = 'Include discussion points, dialogue examples, and verbal cues. Focus on how concepts sound and can be explained verbally.';
      break;
    case 'reading':
      styleInstruction = 'Include written frameworks, lists, and text-based resources. Provide written examples and reflection questions.';
      break;
    case 'kinesthetic':
      styleInstruction = 'Include hands-on activities, role-play scenarios, and practical applications. Focus on physical movements and tactile experiences.';
      break;
    default:
      styleInstruction = 'Balance visual elements, discussions, reading materials, and hands-on activities.';
  }
  
  // Generate the prompt
  return `
You are an expert early childhood education mentor for preschool teachers who specializes in personalized, HIGHLY INTERACTIVE and FUN instruction. 
Create an EXTREMELY engaging, GAME-LIKE lesson on "${module.title}" tailored to a teacher with a ${learningStyle} learning style
who is facing this classroom challenge: "${challenge}".

The lesson MUST feel like playing an interactive video game rather than traditional learning. It must be entertaining, visually stimulating, and use multimedia elements while teaching real ECE concepts.

The lesson should be structured in JSON format with the following sections:
- introduction: A brief, upbeat introduction to the topic that connects it to the specific challenge. Include a fun "quest" framing and a catchy theme.
- keyConcepts: An array of 3-5 key concepts related to the topic, each presented as an "achievement" to unlock with playful icons like 🏆, 🌟, 🔑, etc.
- strategies: An array of 4-6 practical strategies, each with a catchy title and description. Frame these as special "power-ups" or "tools" for their teaching toolkit with emoji icons.
- activities: An array of 3-4 HIGHLY INTERACTIVE activities with creative title, description, timeEstimate, and steps (array of strings). These MUST be genuinely fun and playful while teaching the concepts. Include at least one activity that uses digital tools or online resources.
- gameElements: An array of 3-4 game-like elements such as points systems, challenges, rewards, or "boss levels" that make implementing the strategies feel like playing a game
- reflectionQuestions: An array of 3-4 reflection questions, each with a text field, framed as "level-up" opportunities with fun icons
- funFacts: An array of 3-4 surprising or interesting facts about the topic that will help teachers remember key points
- videoResources: An array of 2-3 professional training videos from reputable ECE sources like NAEYC, Head Start, PBS Teachers, or state education departments. Include title, description, videoLength (string), and url.
- interactiveResources: An array of 2-3 interactive tools, games, or assessments related to the topic with title, description, type (game, tool, assessment), and url.
- printableResources: An array of 1-2 downloadable materials a teacher could print for their classroom with title, description, and url.

${styleInstruction}

For ${learningStyle} learners specifically:
- Create content that fills knowledge gaps in their preferred way of learning through multiple modalities
- Include specific "Did You Know?" sections that highlight facts most teachers don't know but should
- Add "Eureka Moments" where complex concepts suddenly make sense through ${learningStyle} explanations
- Include Easter eggs like the phrase "Breathe, Smile, Be Present" hidden in the content
- Use bright, engaging visuals and multimedia content that keeps attention

IMPORTANT: For video resources, ONLY use legitimate sources from professional ECE organizations like:
- Head Start Early Childhood Learning & Knowledge Center (https://eclkc.ohs.acf.hhs.gov)
- NAEYC (https://www.naeyc.org)
- CDC's Learn the Signs. Act Early. (https://www.cdc.gov/ncbddd/actearly/)
- ZERO TO THREE (https://www.zerotothree.org)
- Vanderbilt IRIS Center (https://iris.peabody.vanderbilt.edu)
- PBS Teachers (https://az.pbslearningmedia.org)
- State education departments
- Well-established universities with ECE departments

Incorporate Raising Arizona Preschool's motto: "Every Genius that ever was had a Mentor" into your content.
Include references to developmentally appropriate practices and the Arizona Early Learning Standards where relevant.

BE SUPER CREATIVE! The lesson should feel like playing an engaging video game rather than working while still being educational and evidence-based.
Format your response as a JSON object without any additional text before or after.
`;
}

// Mock function - in production, this would call the Perplexity API
export async function generateLessonContent(prompt: string): Promise<any> {
  try {
    // Fetch from Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are an expert early childhood education mentor who creates personalized learning content for preschool teachers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Perplexity API error:", errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the response content as JSON
    try {
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      // Fallback to default content
      return generateDefaultLessonContent(prompt);
    }
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    // Fallback to default content in case of API failure
    return generateDefaultLessonContent(prompt);
  }
}

// Fallback function to generate default lesson content when API fails
function generateDefaultLessonContent(prompt: string): any {
  // Extract key phrases from the prompt
  const moduleTitle = prompt.match(/lesson on "([^"]+)"/)?.[1] || "Early Childhood Education";
  const learningStyle = prompt.match(/with a (\w+) learning style/)?.[1] || "visual";
  const challenge = prompt.match(/challenge: "([^"]+)"/)?.[1] || "classroom management";
  
  // Create fun game-like content based on learning style
  let styleSpecificActivity = {};
  let styleSpecificStrategy = {};
  
  switch(learningStyle) {
    case "visual":
      styleSpecificActivity = {
        title: "Classroom Design Challenge",
        description: "Create a visual map of your ideal classroom setup to address this challenge.",
        timeEstimate: "20-25 minutes",
        steps: [
          "Grab some colored markers and a large sheet of paper",
          "Draw your classroom layout with color-coded zones for different activities",
          "Use sticky notes to mark potential problem areas related to your challenge",
          "Use different colors to indicate solutions for each area",
          "Take a photo of your design to refer back to later"
        ]
      };
      styleSpecificStrategy = {
        title: "Visual Cue Power-Up",
        description: "Harness the power of visual signals and cues to communicate expectations without words."
      };
      break;
    case "auditory":
      styleSpecificActivity = {
        title: "Soundscape Solutions",
        description: "Create audio cues and verbal strategies for smoother classroom transitions.",
        timeEstimate: "15-20 minutes",
        steps: [
          "Record 3-4 different sound cues on your phone (bell, chime, etc.)",
          "Create a script for verbal directions that use rhythm and rhyming",
          "Practice your verbal cues with varying tones and volumes",
          "Role-play with a colleague responding to the audio cues",
          "Develop a plan for teaching children these audio signals"
        ]
      };
      styleSpecificStrategy = {
        title: "Sound System Mastery",
        description: "Leverage the power of songs, rhythms and verbal cues to transform your classroom management."
      };
      break;
    case "reading":
      styleSpecificActivity = {
        title: "Strategy Guidebook Creation",
        description: "Write a personalized quick-reference guide for your specific classroom challenges.",
        timeEstimate: "25-30 minutes",
        steps: [
          "Create a small notebook or digital document titled 'My Classroom Solutions'",
          "Write clear, step-by-step procedures for handling specific situations",
          "Include 'If/Then' scenarios for common challenges",
          "Add inspirational quotes that motivate you as a teacher",
          "Include a section for notes on what works and what needs adjustment"
        ]
      };
      styleSpecificStrategy = {
        title: "Text-to-Action Protocol",
        description: "Transform written classroom policies into effective daily practices through systematic implementation."
      };
      break;
    case "kinesthetic":
      styleSpecificActivity = {
        title: "Movement Strategy Relay",
        description: "Physically act out classroom techniques in a fun, movement-based practice session.",
        timeEstimate: "20-25 minutes",
        steps: [
          "Set up 4-5 stations around your room representing different classroom scenarios",
          "At each station, physically act out your response to that scenario",
          "Use props and move furniture as needed to fully engage with the space",
          "Practice different physical positions (sitting, standing, kneeling) to see what works best",
          "Create a physical 'anchor' gesture that helps you remember each strategy"
        ]
      };
      styleSpecificStrategy = {
        title: "Movement Magic Toolkit",
        description: "Use purposeful physical activities and gestures to redirect behavior and create classroom harmony."
      };
      break;
    default:
      styleSpecificActivity = {
        title: "Multi-Sensory Classroom Solutions",
        description: "Develop strategies that engage multiple senses for more effective learning.",
        timeEstimate: "20-25 minutes",
        steps: [
          "Identify 3 challenging classroom situations you face regularly",
          "For each situation, brainstorm a solution that incorporates visual elements",
          "Add an auditory component to each solution",
          "Include how you could incorporate movement or touch",
          "Create a quick-reference chart connecting situations to your multi-sensory solutions"
        ]
      };
      styleSpecificStrategy = {
        title: "Sensory Integration Power-Up",
        description: "Combine visual, auditory, and kinesthetic techniques for maximum classroom effectiveness."
      };
  }
  
  // Create basic content based on extracted information
  return {
    introduction: `Welcome to your adventure in ${moduleTitle}! This fun quest will help you conquer challenges with ${challenge}. As someone with a ${learningStyle} learning style, you'll find this content specially designed to match how you learn best. Remember, "Every Genius that ever was had a Mentor" - and today, you're building your genius teaching skills! Breathe, Smile, Be Present as we begin...`,
    
    keyConcepts: [
      "🏆 ACHIEVEMENT UNLOCK: Developmental Milestone Master - Understand key milestones related to this challenge",
      "🏆 ACHIEVEMENT UNLOCK: Environment Architect - Create supportive classroom spaces that prevent problems",
      "🏆 ACHIEVEMENT UNLOCK: Positive Reinforcement Wizard - Use effective techniques to encourage desired behaviors",
      "🏆 ACHIEVEMENT UNLOCK: Relationship Builder - Foster strong teacher-child connections that reduce challenges",
      "🏆 ACHIEVEMENT UNLOCK: Communication Champion - Partner effectively with families on consistent approaches"
    ],
    
    strategies: [
      {
        title: "🔮 Anticipation Spell",
        description: "Predict and prevent problems before they occur by reading classroom energy cues."
      },
      {
        title: "🛡️ Boundary Shield",
        description: "Create clear, consistent limits that make children feel secure and understood."
      },
      {
        title: "✨ Connection Charm",
        description: "Build genuine relationships that give you influence during challenging moments."
      },
      {
        title: "🌈 Redirection Rainbow",
        description: "Smoothly guide children from undesired to appropriate behaviors using engaging alternatives."
      },
      styleSpecificStrategy
    ],
    
    activities: [
      {
        title: "Classroom Challenge Simulator",
        description: "A role-playing game where you practice handling tricky situations with different strategies.",
        timeEstimate: "15-20 minutes",
        steps: [
          "Choose a specific challenging scenario from your classroom experience",
          "Write it down on a card with key details about the children involved",
          "Draw a 'Strategy Card' from your deck (the strategies section above)",
          "Role-play how you would handle the situation using that strategy",
          "Reflect on what worked well and what you might adapt next time",
          "Level up: Try the same scenario with a different strategy card!"
        ]
      },
      styleSpecificActivity
    ],
    
    gameElements: [
      {
        title: "Strategy Collector",
        description: "Each time you successfully implement a strategy, add it to your 'teaching toolkit' with notes on how it worked. Aim to collect all strategies with 3-star ratings."
      },
      {
        title: "Classroom Challenge Boss Battles",
        description: "Identify your top 3 recurring challenges as 'boss battles' to overcome. Track your progress in defeating each 'boss' by noting when your strategies succeed."
      },
      {
        title: "XP Tracker",
        description: "Award yourself experience points for each successful intervention. 1 XP for basic success, 3 XP for handling difficult situations, 5 XP for preventing problems before they start."
      },
      {
        title: "Teaching Level-Up System",
        description: "Every 20 XP, award yourself a 'level up' with a small reward. Track your journey from 'Novice' to 'Master Teacher' with specific milestones."
      }
    ],
    
    reflectionQuestions: [
      {
        text: "🔍 LEVEL-UP OPPORTUNITY: What specific developmental needs might be driving the challenging behaviors you're seeing?"
      },
      {
        text: "🔍 LEVEL-UP OPPORTUNITY: Which strategy feels most natural to your teaching style, and which one will stretch your skills in a good way?"
      },
      {
        text: "🔍 LEVEL-UP OPPORTUNITY: How could you adapt these approaches to fit your unique classroom community and personalities?"
      },
      {
        text: "🔍 LEVEL-UP OPPORTUNITY: What small victory will you celebrate first as you implement these strategies?"
      }
    ],
    
    funFacts: [
      {
        title: "Did You Know?",
        fact: "Children's challenging behaviors often peak right before they master a new developmental skill. What looks like defiance might actually be a sign of growth!"
      },
      {
        title: "Eureka Moment!",
        fact: "Studies show that teachers who use playful approaches to classroom management report less burnout and more job satisfaction than those using strict disciplinary methods."
      },
      {
        title: "Hidden Knowledge",
        fact: "The 3:1 ratio is magical in teaching - aim for at least three positive interactions for every correction or redirection you give a child to maintain a positive relationship."
      }
    ],
    
    resources: [
      {
        title: "NAEYC Position Statement on Developmentally Appropriate Practice",
        description: "Official guidance on best practices in early childhood education",
        type: "article",
        url: "https://www.naeyc.org/resources/position-statements/dap/contents"
      },
      {
        title: "Arizona Early Learning Standards Guide",
        description: "Comprehensive guide to state standards for early childhood education",
        type: "article",
        url: "https://www.azed.gov/ece/early-learning-standards"
      },
      {
        title: "Head Start Early Childhood Learning & Knowledge Center",
        description: "Free professional development videos on various ECE topics",
        type: "video_library",
        url: "https://eclkc.ohs.acf.hhs.gov/professional-development/article/practice-based-coaching-pbc"
      },
      {
        title: "CDC's Learn the Signs. Act Early.",
        description: "Free developmental milestone videos and resources",
        type: "video_library",
        url: "https://www.cdc.gov/ncbddd/actearly/index.html"
      },
      {
        title: "ZERO TO THREE Professional Development",
        description: "Research-based training videos for early childhood educators",
        type: "video",
        url: "https://www.zerotothree.org/resource/getting-started-with-mindfulness-a-toolkit-for-early-childhood-organizations/"
      },
      {
        title: "Classroom Management Strategies for Early Childhood",
        description: "Video demonstration of effective management techniques from Vanderbilt's IRIS Center",
        type: "video",
        url: "https://iris.peabody.vanderbilt.edu/module/ecbm/"
      },
      {
        title: "PBS Teacher Professional Development",
        description: "Educational videos and lesson plans from PBS Teachers",
        type: "video_library",
        url: "https://az.pbslearningmedia.org/collection/professional-development/"
      },
      {
        title: "Teacher Learning Styles Quiz",
        description: "Understand more about your own learning style and how it affects your teaching",
        type: "interactive",
        url: "https://www.educationplanner.org/students/self-assessments/learning-styles-quiz.shtml"
      }
    ]
  };
}