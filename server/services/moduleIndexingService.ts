import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ModuleIndexEntry {
  id: number;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  topicSummary: string;
  applicableScenarios: string[];
  learningObjectives: string[];
  difficulty: string;
  eceCategory?: string;
  duration: number;
  lastUpdated: Date;
}

export class ModuleIndexingService {
  private static moduleIndex: Map<number, ModuleIndexEntry> = new Map();
  
  /**
   * Process and index a new module for Beary AI knowledge base
   */
  static async indexModule(module: {
    id: number;
    title: string;
    description: string;
    content: string;
    category: string;
    difficulty: string;
    duration: number;
    eceCategory?: string;
  }): Promise<void> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not available - skipping module indexing');
        return;
      }

      console.log(`🧠 Indexing module for Beary AI: "${module.title}"`);

      // Extract content summary and learning objectives using AI
      const analysisPrompt = `
Analyze this Early Childhood Education module and extract key information for an AI assistant knowledge base:

Title: ${module.title}
Description: ${module.description}
Category: ${module.category}
Content: ${module.content.substring(0, 3000)}...

Extract the following information in JSON format:
{
  "keywords": ["array", "of", "key", "terms", "and", "concepts"],
  "topicSummary": "2-3 sentence summary of main topics covered",
  "applicableScenarios": ["scenarios", "where", "this", "module", "would", "be", "helpful"],
  "learningObjectives": ["what", "teachers", "will", "learn", "from", "this", "module"]
}

Focus on practical ECE applications, behavior management, curriculum planning, child development, and classroom strategies.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are an expert Early Childhood Education analyzer helping create a knowledge base for an AI teaching assistant." },
          { role: "user", content: analysisPrompt }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Create index entry
      const indexEntry: ModuleIndexEntry = {
        id: module.id,
        title: module.title,
        description: module.description,
        category: module.category,
        keywords: analysis.keywords || [],
        topicSummary: analysis.topicSummary || module.description,
        applicableScenarios: analysis.applicableScenarios || [],
        learningObjectives: analysis.learningObjectives || [],
        difficulty: module.difficulty,
        eceCategory: module.eceCategory,
        duration: module.duration,
        lastUpdated: new Date()
      };

      // Store in memory index
      this.moduleIndex.set(module.id, indexEntry);

      console.log(`✅ Successfully indexed module: "${module.title}" with ${analysis.keywords?.length || 0} keywords`);

    } catch (error) {
      console.error(`❌ Error indexing module "${module.title}":`, error);
    }
  }

  /**
   * Find relevant modules based on a user query
   */
  static findRelevantModules(query: string, limit: number = 3): ModuleIndexEntry[] {
    const queryLower = query.toLowerCase();
    const relevantModules: { module: ModuleIndexEntry; score: number }[] = [];

    for (const module of this.moduleIndex.values()) {
      let score = 0;

      // Check title match (highest weight)
      if (module.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Check keywords match
      for (const keyword of module.keywords) {
        if (queryLower.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(queryLower)) {
          score += 5;
        }
      }

      // Check scenarios match
      for (const scenario of module.applicableScenarios) {
        if (scenario.toLowerCase().includes(queryLower) || queryLower.includes(scenario.toLowerCase())) {
          score += 7;
        }
      }

      // Check description and topic summary
      if (module.description.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      if (module.topicSummary.toLowerCase().includes(queryLower)) {
        score += 4;
      }

      // Check learning objectives
      for (const objective of module.learningObjectives) {
        if (objective.toLowerCase().includes(queryLower) || queryLower.includes(objective.toLowerCase())) {
          score += 6;
        }
      }

      // Check category match
      if (module.category.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      // Check ECE category if available
      if (module.eceCategory && module.eceCategory.toLowerCase().includes(queryLower)) {
        score += 4;
      }

      if (score > 0) {
        relevantModules.push({ module, score });
      }
    }

    // Sort by relevance score and return top results
    return relevantModules
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.module);
  }

  /**
   * Initialize module index from existing modules
   */
  static async initializeFromDatabase(storage: any): Promise<void> {
    try {
      console.log('🚀 Initializing Beary AI module knowledge base...');
      
      // Get all visible modules
      const modules = await storage.getAllModules();
      
      for (const module of modules) {
        if (module.isVisible && module.content) {
          await this.indexModule({
            id: module.id,
            title: module.title,
            description: module.description,
            content: module.content,
            category: module.category,
            difficulty: module.difficulty,
            duration: module.duration,
            eceCategory: module.eceCategory
          });
        }
      }

      console.log(`📚 Beary AI knowledge base initialized with ${this.moduleIndex.size} modules`);
    } catch (error) {
      console.error('❌ Error initializing module index:', error);
    }
  }

  /**
   * Get module recommendations formatted for Beary AI responses
   */
  static formatModuleRecommendations(modules: ModuleIndexEntry[]): string {
    if (modules.length === 0) {
      return "";
    }

    let recommendations = "\n\n**📚 Recommended Training Modules:**\n\n";
    
    for (const module of modules) {
      recommendations += `**${module.title}**\n`;
      recommendations += `📝 ${module.description}\n`;
      recommendations += `⏱️ Duration: ${module.duration} minutes\n`;
      recommendations += `🎯 Difficulty: ${module.difficulty}\n`;
      if (module.eceCategory) {
        recommendations += `📋 ECE Category: ${module.eceCategory}\n`;
      }
      recommendations += `💡 Topics covered: ${module.topicSummary}\n`;
      recommendations += `\n*You can find this module in your **Modules** section of the platform.*\n\n`;
    }

    return recommendations;
  }

  /**
   * Get total indexed modules count
   */
  static getIndexedModuleCount(): number {
    return this.moduleIndex.size;
  }

  /**
   * Remove a module from the index (when deleted)
   */
  static removeFromIndex(moduleId: number): void {
    this.moduleIndex.delete(moduleId);
    console.log(`🗑️ Removed module ${moduleId} from Beary AI knowledge base`);
  }

  /**
   * Update an existing module in the index
   */
  static async updateModuleIndex(module: {
    id: number;
    title: string;
    description: string;
    content: string;
    category: string;
    difficulty: string;
    duration: number;
    eceCategory?: string;
  }): Promise<void> {
    // Remove old entry and add updated one
    this.removeFromIndex(module.id);
    await this.indexModule(module);
  }
}