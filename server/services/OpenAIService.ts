import OpenAI from 'openai';

/**
 * Centralized OpenAI Service
 * 
 * This service consolidates all OpenAI API usage across the MentorMe application,
 * providing consistent configuration, error handling, and rate limiting.
 * 
 * Current Usage:
 * - Assessment question generation (EP-002-05)
 * - Teaching content generation (dynamicAiSuggestions.ts)
 * - AI assistant services (aiBearyService.ts)
 * - Lesson plan generation (routes.ts)
 * - Module content generation (newAiSuggestionRoutes.ts)
 * - Notebook LM integration (notebookLmRoutes.ts)
 */

interface OpenAIConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

interface GenerationRequest {
  prompt: string;
  config?: Partial<OpenAIConfig>;
  systemMessage?: string;
  responseFormat?: 'json' | 'text';
}

interface GenerationResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI;
  
  // Default configuration matching existing usage patterns
  private static readonly DEFAULT_CONFIG: OpenAIConfig = {
    model: "gpt-4o", // Latest model as per existing usage
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 15000, // Reduced to 15 seconds for better UX
  };

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OpenAIService.DEFAULT_CONFIG.timeout, // Apply timeout to client
    });
  }

  /**
   * Get singleton instance of OpenAI service
   */
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Create a timeout promise that rejects after specified milliseconds
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Generate text content using OpenAI API with timeout handling
   */
  public async generateContent({
    prompt,
    config = {},
    systemMessage,
    responseFormat = 'text'
  }: GenerationRequest): Promise<GenerationResponse> {
    const finalConfig = { ...OpenAIService.DEFAULT_CONFIG, ...config };
    
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      
      messages.push({ role: 'user', content: prompt });

      const completionConfig: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: finalConfig.model,
        messages,
        max_tokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
      };

      // Add response format if JSON is requested
      if (responseFormat === 'json') {
        completionConfig.response_format = { type: 'json_object' };
      }

      // Create the OpenAI request promise
      const openaiPromise = this.client.chat.completions.create(completionConfig);
      
      // Create timeout promise
      const timeoutPromise = this.createTimeoutPromise<OpenAI.Chat.Completions.ChatCompletion>(finalConfig.timeout!);

      // Race between the API call and timeout
      const response = await Promise.race([openaiPromise, timeoutPromise]);

      if (!response.choices[0]?.message?.content) {
        throw new Error('No content generated from OpenAI API');
      }

      return {
        content: response.choices[0].message.content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error instanceof Error) {
        // Handle timeout errors specifically
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
          throw new Error('AI service is taking longer than expected. Please try again with simpler guidance or try again later.');
        }
        
        // Handle rate limiting
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('AI service is currently busy. Please wait a moment and try again.');
        }
        
        // Handle authentication errors
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error('AI service configuration error. Please contact support.');
        }
        
        // Handle OpenAI service errors
        if (error.message.includes('503') || error.message.includes('service unavailable')) {
          throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
        }
        
        throw new Error(`AI generation failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during AI generation');
    }
  }

  /**
   * Generate assessment question content using specialized prompt with enhanced error handling
   */
  public async generateAssessmentQuestion({
    domainName,
    domainDescription,
    difficulty,
    userGuidance,
  }: {
    domainName: string;
    domainDescription: string;
    difficulty: number;
    userGuidance?: string;
  }): Promise<{
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    miniLesson: string;
    tags: string[];
  }> {
    const systemMessage = `You are an expert early childhood education assessment designer with deep knowledge of NAEYC standards, ECERS-R criteria, and CLASS assessment framework.

Your role is to create high-quality, developmentally appropriate assessment questions that accurately evaluate early childhood educators' professional knowledge and practical skills.`;

    const prompt = `Generate a Level ${difficulty} assessment question for the "${domainName}" domain.

DOMAIN CONTEXT: ${domainDescription}
DIFFICULTY LEVEL: ${difficulty} (Scale 1-6: 1=Very Easy, 2=Easy/Medium, 3=Medium, 4=Medium/Hard, 5=Hard, 6=Master)

${userGuidance ? `SPECIFIC GUIDANCE: ${userGuidance}` : ''}

REQUIREMENTS:
- Question tests practical knowledge relevant to early childhood educators
- Exactly 4 multiple choice options (A, B, C, D)
- Options include realistic distractors based on common misconceptions
- Correct answer represents evidence-based best practice
- Correct answer should be randomly placed into position (A, B, C, D)
- Correct answer shouldn't be obvious based on the length or level of detail
- The wrong answers should look and feel similar to the correct one
- Explanation references specific ECE standards or research
- Mini-lesson provides actionable professional development content
- Create realistic classroom/professional scenarios that ECE educators encounter
- Tags should include 3-5 relevant topic keywords

OUTPUT FORMAT: JSON object with:
{
  "text": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation of why this answer is correct",
  "miniLesson": "Educational content for professional development",
  "tags": ["tag1", "tag2", "tag3"]
}

The correctAnswer field should be the index (0-3) of the correct option in the options array.`;

    try {
      const response = await this.generateContent({
        prompt,
        systemMessage,
        responseFormat: 'json',
        config: {
          temperature: 0.8, // Higher creativity for question generation
          maxTokens: 1500,
          timeout: 20000, // Longer timeout for complex question generation
        },
      });

      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('AI returned invalid response format. Please try again.');
      }

      // Validate the response structure
      if (!result.text || typeof result.text !== 'string') {
        throw new Error('Generated question is missing valid text. Please try again.');
      }
      
      if (!Array.isArray(result.options) || result.options.length !== 4) {
        throw new Error('Generated question must have exactly 4 answer options. Please try again.');
      }

      if (typeof result.correctAnswer !== 'number' || result.correctAnswer < 0 || result.correctAnswer > 3) {
        throw new Error('Generated question has invalid correct answer. Please try again.');
      }

      // Validate that all options are strings
      if (!result.options.every((option: any) => typeof option === 'string' && option.trim().length > 0)) {
        throw new Error('Generated answer options are incomplete. Please try again.');
      }

      return {
        text: result.text.trim(),
        options: result.options.map((opt: string) => opt.trim()),
        correctAnswer: result.correctAnswer,
        explanation: (result.explanation || '').trim(),
        miniLesson: (result.miniLesson || '').trim(),
        tags: Array.isArray(result.tags) ? result.tags.filter((tag: any) => typeof tag === 'string') : [],
      };

    } catch (error) {
      console.error('Assessment question generation error:', error);
      
      if (error instanceof Error) {
        // Re-throw our custom error messages
        if (error.message.includes('AI service is taking longer than expected') ||
            error.message.includes('AI service is currently busy') ||
            error.message.includes('AI service is temporarily unavailable') ||
            error.message.includes('AI returned invalid response format') ||
            error.message.includes('Generated question')) {
          throw error;
        }
      }
      
      throw new Error('Failed to generate assessment question. The AI service may be temporarily unavailable. Please try again.');
    }
  }

  /**
   * Check content appropriateness using OpenAI moderation with timeout
   */
  public async moderateContent(content: string): Promise<boolean> {
    try {
      // Create moderation request with timeout
      const moderationPromise = this.client.moderations.create({
        input: content,
      });
      
      const timeoutPromise = this.createTimeoutPromise<OpenAI.Moderations.ModerationCreateResponse>(5000); // 5 second timeout for moderation
      
      const moderation = await Promise.race([moderationPromise, timeoutPromise]);
      
      return !moderation.results[0].flagged;
    } catch (error) {
      console.error('Content moderation error:', error);
      // Default to allowing content if moderation fails or times out
      return true;
    }
  }
}

// Export singleton instance for easy access
export const openAIService = OpenAIService.getInstance(); 