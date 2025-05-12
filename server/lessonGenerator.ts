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
You are an expert early childhood education mentor for preschool teachers who specializes in personalized instruction. 
Create a detailed, engaging lesson on "${module.title}" tailored to a teacher with a ${learningStyle} learning style
who is facing this classroom challenge: "${challenge}".

The lesson should be structured in JSON format with the following sections:
- introduction: A brief introduction to the topic that connects it to the specific challenge
- keyConcepts: An array of 3-5 key concepts related to the topic
- strategies: An array of 4-6 practical strategies, each with a title and description
- activities: An array of 2-3 interactive activities with title, description, timeEstimate, and steps (array of strings)
- reflectionQuestions: An array of 3-4 reflection questions, each with a text field
- resources: An array of additional resources with title, description, type (video, article, audio), and url

${styleInstruction}

Incorporate Raising Arizona Preschool's motto: "Every Genius that ever was had a Mentor" into your content.
Include references to developmentally appropriate practices and the Arizona Early Learning Standards where relevant.

Ensure all content is factually accurate, evidence-based, and follows best practices in early childhood education.
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
  
  // Create basic content based on extracted information
  return {
    introduction: `This lesson on ${moduleTitle} will help you address challenges with ${challenge}. As someone with a ${learningStyle} learning style, you'll find this content specially designed to match how you learn best.`,
    keyConcepts: [
      "Understanding developmental milestones related to this challenge",
      "Creating supportive classroom environments",
      "Using positive reinforcement effectively",
      "Building strong teacher-child relationships",
      "Communicating effectively with families"
    ],
    strategies: [
      {
        title: "Proactive Classroom Management",
        description: "Establish clear routines and expectations before challenges arise."
      },
      {
        title: "Positive Behavior Guidance",
        description: "Focus on reinforcing desired behaviors rather than punishing unwanted ones."
      },
      {
        title: "Environmental Modifications",
        description: "Adjust the physical space to promote desired behaviors and reduce triggers."
      },
      {
        title: "Individualized Approaches",
        description: "Tailor your strategies to each child's unique needs and developmental level."
      }
    ],
    activities: [
      {
        title: "Classroom Scenario Analysis",
        description: "Analyze common classroom situations and practice applying strategies.",
        timeEstimate: "15-20 minutes",
        steps: [
          "Review the provided scenario related to your challenge",
          "Identify potential causes and triggers",
          "Select appropriate strategies to address the situation",
          "Role-play or write out your response",
          "Reflect on potential outcomes"
        ]
      },
      {
        title: "Strategy Implementation Plan",
        description: "Create a concrete plan to implement new strategies in your classroom.",
        timeEstimate: "20-30 minutes",
        steps: [
          "Select 2-3 strategies that resonate with you",
          "Identify specific situations where you'll apply each strategy",
          "List materials or preparations needed",
          "Set measurable goals for implementation",
          "Create a timeline for implementation and assessment"
        ]
      }
    ],
    reflectionQuestions: [
      {
        text: "How does this challenge relate to the developmental stages of children in your classroom?"
      },
      {
        text: "Which strategy do you think will be most effective in your specific classroom context and why?"
      },
      {
        text: "What potential barriers might you face when implementing these strategies, and how will you address them?"
      },
      {
        text: "How will you know if your approach is working, and what adjustments might you need to make?"
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
        title: "Classroom Management Strategies for Early Childhood",
        description: "Video demonstration of effective management techniques",
        type: "video",
        url: "https://www.youtube.com/watch?v=5pAXdCQnJ8Y"
      }
    ]
  };
}