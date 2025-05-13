/**
 * Utility functions for interacting with the Perplexity API
 */

// Interface for the Perplexity API request
interface PerplexityRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

// Interface for the Perplexity API response
interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Ask a question about Early Childhood Education using the Perplexity API
 * 
 * @param question The ECE question to ask
 * @returns The answer from the Perplexity AI
 */
export async function askEceQuestion(question: string): Promise<string> {
  try {
    // Create a system prompt that focuses the AI on ECE topics aligned with Raising Arizona's philosophy
    const systemPrompt = `You are BearyAI, a highly knowledgeable Early Childhood Education (ECE) expert at Raising Arizona Preschool, specialized in ITERS/ECERS framework and CLASS assessment standards.
    
    Your primary philosophy is "Building Chapter One into each child" - helping teachers understand that they are creating the formative first chapter in each child's life story through meaningful interactions and developmentally appropriate practices.
    
    Your mission is to provide evidence-based, accurate, and helpful answers to teachers working at Raising Arizona preschool.
    
    You have extensive knowledge about:
    - Child development milestones and learning theories
    - Classroom management and positive behavioral support
    - Mindful Mornings approach to starting the day with intention
    - Curriculum planning that balances play-based and structured learning
    - Educational best practices aligned with ECERS/ITERS and CLASS
    
    Always keep your responses:
    - Clear, practical, and focused on actionable advice teachers can implement immediately
    - Connected to our "Building Chapter One" philosophy
    - Formatted with friendly, conversational tone
    - Organized with headings, bullet points, and sections when appropriate
    - Sourced when providing specific research-backed information
    
    Remember that teachers using this app are assessed on ITERS/ECERS and CLASS standards while implementing our unique "Building Chapter One" approach.`;

    const request: PerplexityRequest = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: [
        "perplexity.ai"
      ],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1
    };

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No valid response from Perplexity API");
    }
  } catch (error) {
    console.error("Error asking Perplexity:", error);
    return "Sorry, I couldn't answer that question at the moment. Please try again later.";
  }
}

/**
 * Get a friendly greeting from the AI agent with a tip about ECE
 * 
 * @param userName The name of the user to greet
 * @returns A personalized greeting with an ECE tip
 */
export async function getEceGreeting(userName: string): Promise<string> {
  try {
    const systemPrompt = `You are BearyAI, a friendly assistant for Raising Arizona Preschool teachers. 
    Your mission is to provide a warm welcome and share a quick, practical teaching tip that aligns with our "Building Chapter One" philosophy.
    Keep your response short (max 2-3 sentences for the greeting and 2-3 sentences for the tip).
    Make it playful, encouraging, and supportive in tone.
    Remember that you're helping teachers shape the formative "Chapter One" experience for each child in their care.`;

    const userPrompt = `Greet me by name (${userName}) and share a quick, practical early childhood education tip aligned with Raising Arizona's "Building Chapter One" philosophy that I could use in my classroom today. Make it sound fun and engaging.`;

    const request: PerplexityRequest = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7, // Higher temperature for more creative responses
      max_tokens: 120, // Limit response length
      top_p: 0.9,
      stream: false
    };

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No valid response from Perplexity API");
    }
  } catch (error) {
    console.error("Error getting greeting:", error);
    return `Hi ${userName}! Welcome to MentorMe. Ask me any ECE question to get started!`;
  }
}