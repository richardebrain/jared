import OpenAI from "openai";
import { ModuleIndexingService } from "./moduleIndexingService";

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

PLATFORM NAVIGATION HELP:
When users ask about specific tasks or need help with creating content, direct them to the appropriate tools on the platform:

LESSON PLANNING & MODULES:
- "How do I create a lesson plan?" → Direct to: **Comprehensive Module Creator** (/comprehensive-module-creator)
- "How do I build training modules?" → Direct to: **Comprehensive Module Creator** (/comprehensive-module-creator)
- "How do I create learning content?" → Direct to: **Comprehensive Module Creator** (/comprehensive-module-creator)

ASSESSMENTS & EVALUATIONS:
- "How do I create an assessment?" → Direct to: **Assessment Builder** (/assessment-builder)
- "How do I evaluate teachers?" → Direct to: **Assessment Builder** (/assessment-builder)
- "How do I build a quiz?" → Direct to: **Assessment Builder** (/assessment-builder)

COMMUNICATION & NEWSLETTERS:
- "How do I create a newsletter?" → Direct to: **Newsletter Manager** (/newsletter-manager)
- "How do I communicate with parents?" → Direct to: **Newsletter Manager** (/newsletter-manager)
- "How do I publish updates?" → Direct to: **Newsletter Manager** (/newsletter-manager)

RECOGNITION & TEAM BUILDING:
- "How do I recognize teachers?" → Direct to: **Core Values Shout-Out** (/core-values-shout-out)
- "How do I nominate someone?" → Direct to: **Core Values Shout-Out** (/core-values-shout-out)
- "How do I celebrate achievements?" → Direct to: **Core Values Shout-Out** (/core-values-shout-out)

EDUCATIONAL GAMES & ACTIVITIES:
- "What games can I play?" → Direct to: **Educational Games Arcade** (/games)
- "How do I access learning games?" → Direct to: **Educational Games Arcade** (/games)
- "Where are the interactive activities?" → Direct to: **Educational Games Arcade** (/games)

VIDEO LIBRARY & RESOURCES:
- "Where can I find training videos?" → Direct to: **Video Library** (/video-library)
- "How do I watch educational content?" → Direct to: **Video Library** (/video-library)
- "Where are the learning resources?" → Direct to: **Video Library** (/video-library)

COMMUNITY & SHARING:
- "How do I share content?" → Direct to: **Community Modules** (/community-modules)
- "Where can I find shared resources?" → Direct to: **Community Modules** (/community-modules)
- "How do I collaborate with other teachers?" → Direct to: **Community Modules** (/community-modules)

SOCIAL LEARNING:
- "What's the social feed?" → Direct to: **EduTok** (/edutok)
- "How do I share quick tips?" → Direct to: **EduTok** (/edutok)
- "Where's the teacher social network?" → Direct to: **EduTok** (/edutok)

Always provide clickable links in this format: [Tool Name](/path) when directing users to specific tools.

IMPORTANT GUIDELINES:
- Keep responses warm, supportive, and professional
- Base advice on current ECE research and best practices
- Be specific and actionable in your suggestions
- When relevant, direct users to the appropriate platform tools with clickable links
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

      // Search for relevant modules based on the query
      const relevantModules = ModuleIndexingService.findRelevantModules(userQuery, 3);
      const moduleRecommendations = ModuleIndexingService.formatModuleRecommendations(relevantModules);

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return this.getFallbackResponse(userQuery, moduleContext, moduleRecommendations);
      }

      // Generate context-aware response
      const contextPrompt = moduleContext 
        ? `The teacher is currently working on: ${moduleContext}. Please provide relevant guidance related to this topic when appropriate.`
        : '';

      // Include module recommendations in the system prompt
      const moduleContextPrompt = relevantModules.length > 0 
        ? `\n\nIMPORTANT: Based on the user's question, I found ${relevantModules.length} relevant training modules in our platform. Include these module recommendations at the end of your response if they're relevant to the user's question: ${moduleRecommendations}`
        : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: `${this.SYSTEM_PROMPT}\n\n${contextPrompt}${moduleContextPrompt}` },
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        type: error.type,
        stack: error.stack
      });
      
      // Provide more specific error handling
      if (error.code === 'insufficient_quota' || error.status === 429) {
        return {
          message: "🐻 **AI Beary says:** I'm experiencing high demand right now! Please try again in a few minutes, or reach out to your director for immediate guidance.",
          isAppropriate: true,
          category: 'general'
        };
      }
      
      if (error.code === 'invalid_api_key' || error.status === 401) {
        return {
          message: "🐻 **AI Beary says:** I'm having trouble connecting to my knowledge base. Please contact your system administrator to resolve this issue.",
          isAppropriate: true,
          category: 'general'
        };
      }
      
      // Fallback to helpful ECE responses when AI is unavailable
      return this.getFallbackResponse(userQuery, moduleContext);
    }
  }

  private static getFallbackResponse(userQuery: string, moduleContext?: string, moduleRecommendations?: string): BearyResponse {
    const category = this.categorizeQuery(userQuery);
    let message = "🐻 **AI Beary says:** ";
    
    switch (category) {
      case 'classroom_management':
        message += "Great question about classroom management! Here are some key strategies: establish clear routines, use positive reinforcement, create visual schedules, and maintain consistent expectations. Remember that young children thrive with structure and predictability.";
        break;
      case 'child_development':
        message += "Child development is fascinating! Each child develops at their own pace, but we can support them by providing age-appropriate activities, following their interests, and celebrating small milestones. Observation is key to understanding where each child is in their development.";
        break;
      case 'curriculum':
        message += "When planning curriculum, think about hands-on experiences that engage multiple senses. Include plenty of play-based learning, incorporate children's interests, and remember that repetition helps young learners master concepts.";
        break;
      default:
        message += "That's a thoughtful question! While I'd love to give you a detailed response right now, I'm having some technical difficulties. Please reach out to your director or fellow teachers for guidance on this topic.";
    }
    
    if (moduleContext) {
      message += ` Since you're working on "${moduleContext}", consider how this relates to your current learning objectives.`;
    }
    
    return {
      message,
      isAppropriate: true,
      category
    };
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