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
    // Use the new server-side endpoint that uses the notebook LM plugin
    // This ensures the AI only uses approved data sources
    const response = await fetch("/api/bear-assistant/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error(`BearAI assistant error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.content) {
      return data.content;
    } else {
      throw new Error("No valid response from BearAI assistant");
    }
  } catch (error) {
    console.error("Error asking BearAI:", error);
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
    // Use the server-side endpoint that utilizes the notebook LM plugin
    const response = await fetch("/api/bear-assistant/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        question: `Greet me by name (${userName}) and share a quick, practical early childhood education tip aligned with Raising Arizona's "Building Chapter One" philosophy that I could use in my classroom today. Make it sound fun and engaging.`
      })
    });

    if (!response.ok) {
      throw new Error(`BearAI assistant error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.content) {
      return data.content;
    } else {
      throw new Error("No valid response from BearAI assistant");
    }
  } catch (error) {
    console.error("Error getting greeting:", error);
    return `Hi ${userName}! Welcome to MentorMe. Ask me any ECE question to get started!`;
  }
}