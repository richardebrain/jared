/**
 * Notebook LM Plugin
 * 
 * This plugin provides functionality to restrict AI-generated content to 
 * only use information from approved data sources. It integrates with 
 * language models like Perplexity AI to ensure educational integrity.
 */

import { DataSource, getEnabledDataSources, getDataSourcesByTags, getDataSourcesByCategory, DataSourceCategory } from '@shared/dataSources';

/**
 * Configuration for the notebook LM plugin
 */
interface NotebookLmConfig {
  useStrictMode: boolean;            // If true, only uses explicitly allowed sources
  prioritizedSources: string[];      // IDs of sources that should be prioritized
  excludedSources: string[];         // IDs of sources that should be excluded
  allowGeneralKnowledge: boolean;    // If true, can use general knowledge in addition to sources
  requiredSources: string[];         // IDs of sources that must be included
  relevanceThreshold: number;        // 0-1 value for how relevant sources need to be
  categories: DataSourceCategory[];  // Categories of sources to include
  tags: string[];                    // Tags of sources to include
}

/**
 * Default configuration for the plugin
 */
const defaultConfig: NotebookLmConfig = {
  useStrictMode: true,
  prioritizedSources: ['naeyc', 'zero-to-three', 'class', 'iters', 'ecers'],
  excludedSources: [],
  allowGeneralKnowledge: false,
  requiredSources: ['raising-arizona-preschool'],
  relevanceThreshold: 0.7,
  categories: [
    DataSourceCategory.EDUCATIONAL,
    DataSourceCategory.CURRICULUM,
    DataSourceCategory.ASSESSMENT
  ],
  tags: ['early childhood', 'development', 'quality']
};

// Store current configuration
let currentConfig: NotebookLmConfig = { ...defaultConfig };

/**
 * Get the current configuration
 */
export function getConfig(): NotebookLmConfig {
  return { ...currentConfig };
}

/**
 * Update the configuration
 */
export function updateConfig(config: Partial<NotebookLmConfig>): NotebookLmConfig {
  currentConfig = {
    ...currentConfig,
    ...config
  };
  return { ...currentConfig };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): NotebookLmConfig {
  currentConfig = { ...defaultConfig };
  return { ...currentConfig };
}

/**
 * Get all available data sources based on current configuration
 */
export function getAvailableDataSources(): DataSource[] {
  const { categories, tags, excludedSources } = currentConfig;
  
  // Get sources by category and tags
  let sources = getEnabledDataSources();
  
  if (categories && categories.length > 0) {
    sources = sources.filter(source => 
      categories.includes(source.category)
    );
  }
  
  if (tags && tags.length > 0) {
    sources = sources.filter(source => 
      tags.some(tag => source.tags.includes(tag))
    );
  }
  
  // Filter out excluded sources
  sources = sources.filter(source => 
    !excludedSources.includes(source.id)
  );
  
  return sources;
}

/**
 * Create Perplexity API payload with data source restrictions
 */
export function createPerplexityPayload(
  userPrompt: string, 
  systemPrompt: string = "You are an expert early childhood education mentor who creates personalized learning content for preschool teachers."
): any {
  // Get available data sources based on current config
  const sources = getAvailableDataSources();
  const sourceUrls = sources
    .filter(s => s.url)
    .map(s => s.url)
    .filter(Boolean);
  
  // Add required context about data sources
  const sourceNames = sources.map(s => s.name).join(", ");
  const sourceContext = `Use information exclusively from these trusted educational sources: ${sourceNames}.`;
  
  // Create enhanced system prompt with source guidelines
  let enhancedSystemPrompt = systemPrompt;
  
  if (currentConfig.useStrictMode) {
    enhancedSystemPrompt = `${systemPrompt}\n\nIMPORTANT: ${sourceContext}`;
    
    if (!currentConfig.allowGeneralKnowledge) {
      enhancedSystemPrompt += "\nDo NOT use information from sources outside this list. If you don't have relevant information from these sources, acknowledge the limitation.";
    }
  }
  
  // Add required sources emphasis if needed
  if (currentConfig.requiredSources.length > 0) {
    const requiredSourceNames = sources
      .filter(s => currentConfig.requiredSources.includes(s.id))
      .map(s => s.name)
      .join(", ");
    
    enhancedSystemPrompt += `\n\nYou MUST incorporate information from these specific sources: ${requiredSourceNames}.`;
  }
  
  // Create the payload
  return {
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      {
        role: "system",
        content: enhancedSystemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 2500,
    // Add domain filtering if strict mode is enabled and we have source URLs
    ...(currentConfig.useStrictMode && sourceUrls.length > 0 ? {
      search_domain_filter: sourceUrls
    } : {}),
    stream: false
  };
}

/**
 * Enhanced version of generateLessonContent that uses the plugin
 */
export async function generateRestrictedLessonContent(prompt: string): Promise<any> {
  try {
    // Create payload with data source restrictions
    const payload = createPerplexityPayload(prompt);
    
    // Fetch from Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Perplexity API error:", errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract citations if present to verify sources being used
    const citations = data.citations || [];
    console.log("Content generated using these sources:", citations);
    
    // Parse the response content as JSON
    try {
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      throw new Error("Failed to parse response from language model");
    }
  } catch (error) {
    console.error("Error calling Perplexity API with restricted sources:", error);
    throw error;
  }
}