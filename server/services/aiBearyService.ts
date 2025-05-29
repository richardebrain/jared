import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface BearyResponse {
  message: string;
  isAppropriate: boolean;
  category: 'ece' | 'classroom_management' | 'child_development' | 'curriculum' | 'general' | 'inappropriate';
}

export class AIBearyService {
  private static readonly SYSTEM_PROMPT = `You are AI Beary, a friendly and knowledgeable Early Childhood Education (ECE) assistant for preschool teachers. Your role is to provide helpful, evidence-based guidance on:

- Early childhood development and learning
- Classroom management strategies  
- Curriculum planning and activities
- Child behavior and guidance techniques
- Educational best practices
- Professional development topics
- Safety and health in early childhood settings
- Working with families and communication

IMPORTANT GUIDELINES:
- Keep responses warm, supportive, and professional
- Base advice on current ECE research and best practices
- Be specific and actionable in your suggestions
- If asked about topics outside ECE, politely redirect to educational content
- Never provide medical, legal, or therapeutic advice
- Always encourage teachers to consult their director or relevant professionals for serious concerns
- Use a friendly, encouraging tone that builds teacher confidence

Respond as AI Beary with helpful, practical advice for preschool teachers.`;

  static async processQuery(userQuery: string, moduleContext?: string): Promise<BearyResponse> {
    try {
      // Content filtering check
      const isAppropriate = await this.checkContentAppropriateness(userQuery);
      
      if (!isAppropriate) {
        return {
          message: "I'm here to help with early childhood education topics! Let's focus on teaching strategies, child development, or classroom activities. What would you like to know about working with young children?",
          isAppropriate: false,
          category: 'inappropriate'
        };
      }

      // Generate context-aware response
      const contextPrompt = moduleContext 
        ? `The teacher is currently working on: ${moduleContext}. Please provide relevant guidance related to this topic when appropriate.`
        : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: `${this.SYSTEM_PROMPT}\n\n${contextPrompt}` },
          { role: "user", content: userQuery }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content || "I'm having trouble processing that question right now. Could you try rephrasing it?";
      
      // Categorize the response
      const category = this.categorizeQuery(userQuery);

      return {
        message: `🐻 **AI Beary says:** ${aiResponse}`,
        isAppropriate: true,
        category
      };

    } catch (error) {
      console.error('AI Beary service error:', error);
      return {
        message: "🐻 **AI Beary says:** I'm having a little technical hiccup right now! While I get back on track, feel free to reach out to your director for immediate guidance. I'll be back to help soon!",
        isAppropriate: true,
        category: 'general'
      };
    }
  }

  private static async checkContentAppropriateness(query: string): Promise<boolean> {
    // Basic content filtering
    const inappropriateKeywords = [
      'violent', 'harmful', 'illegal', 'inappropriate', 'sexual', 'offensive'
    ];
    
    const lowerQuery = query.toLowerCase();
    
    // Check for obviously inappropriate content
    if (inappropriateKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return false;
    }

    // Use OpenAI moderation API for additional filtering
    try {
      const moderation = await openai.moderations.create({
        input: query
      });
      
      return !moderation.results[0].flagged;
    } catch (error) {
      console.error('Moderation check failed:', error);
      // Default to allowing the content if moderation fails
      return true;
    }
  }

  private static categorizeQuery(query: string): BearyResponse['category'] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('behavior') || lowerQuery.includes('management') || lowerQuery.includes('discipline')) {
      return 'classroom_management';
    }
    
    if (lowerQuery.includes('development') || lowerQuery.includes('milestone') || lowerQuery.includes('age')) {
      return 'child_development';
    }
    
    if (lowerQuery.includes('lesson') || lowerQuery.includes('activity') || lowerQuery.includes('curriculum')) {
      return 'curriculum';
    }
    
    if (lowerQuery.includes('ece') || lowerQuery.includes('preschool') || lowerQuery.includes('early childhood')) {
      return 'ece';
    }
    
    return 'general';
  }
}