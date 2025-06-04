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
    timeout: 30000, // 30 seconds
  };

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
   * Generate text content using OpenAI API
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

      const response = await this.client.chat.completions.create(completionConfig);

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
        throw new Error(`OpenAI generation failed: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred during OpenAI generation');
    }
  }

  /**
   * Generate assessment question content using specialized prompt
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
        },
      });

      const result = JSON.parse(response.content);

      // Validate the response structure
      if (!result.text || !Array.isArray(result.options) || result.options.length !== 4) {
        throw new Error('Invalid question structure generated');
      }

      if (typeof result.correctAnswer !== 'number' || result.correctAnswer < 0 || result.correctAnswer > 3) {
        throw new Error('Invalid correct answer index');
      }

      return {
        text: result.text,
        options: result.options,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation || '',
        miniLesson: result.miniLesson || '',
        tags: Array.isArray(result.tags) ? result.tags : [],
      };

    } catch (error) {
      console.error('Assessment question generation error:', error);
      throw new Error('Failed to generate assessment question. Please try again.');
    }
  }

  /**
   * Check content appropriateness using OpenAI moderation
   */
  public async moderateContent(content: string): Promise<boolean> {
    try {
      const moderation = await this.client.moderations.create({
        input: content,
      });
      
      return !moderation.results[0].flagged;
    } catch (error) {
      console.error('Content moderation error:', error);
      // Default to allowing content if moderation fails
      return true;
    }
  }
}

// Export singleton instance for easy access
export const openAIService = OpenAIService.getInstance(); 