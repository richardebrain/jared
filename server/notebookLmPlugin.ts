/**
 * Notebook LM Plugin
 * 
 * This plugin provides functionality to restrict AI-generated content to 
 * only use information from approved data sources. It integrates with 
 * language models like Perplexity AI to ensure educational integrity.
 */

import axios from 'axios';
import { DataSource, DataSourceCategory, defaultEducationalSources } from '@shared/dataSources';

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
  prioritizedSources: [],
  excludedSources: [],
  allowGeneralKnowledge: false,
  requiredSources: ['raising-arizona-handbook', 'building-chapter-one'],
  relevanceThreshold: 0.7,
  categories: [
    DataSourceCategory.CURRICULUM,
    DataSourceCategory.EDUCATIONAL,
    DataSourceCategory.ASSESSMENT
  ],
  tags: []
};

let currentConfig: NotebookLmConfig = { ...defaultConfig };
let availableSources: DataSource[] = [...defaultEducationalSources];
let customSources: DataSource[] = [];

/**
 * Get the current configuration
 */
export function getConfig(): NotebookLmConfig {
  return currentConfig;
}

/**
 * Update the configuration
 */
export function updateConfig(config: Partial<NotebookLmConfig>): NotebookLmConfig {
  currentConfig = { ...currentConfig, ...config };
  return currentConfig;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): NotebookLmConfig {
  currentConfig = { ...defaultConfig };
  return currentConfig;
}

/**
 * Get all available data sources
 */
export function getAllDataSources(): DataSource[] {
  return [...availableSources, ...customSources];
}

/**
 * Get all available data sources based on current configuration
 */
export function getAvailableDataSources(): DataSource[] {
  return getAllDataSources().filter(source => {
    // Filter out explicitly excluded sources
    if (currentConfig.excludedSources.includes(source.id)) {
      return false;
    }
    
    // If source is disabled, filter it out
    if (!source.enabled) {
      return false;
    }
    
    // If strictMode is on, filter by categories
    if (currentConfig.useStrictMode && currentConfig.categories.length > 0) {
      if (!currentConfig.categories.includes(source.category)) {
        return false;
      }
    }
    
    // If tags are specified, filter by tags
    if (currentConfig.tags.length > 0) {
      const hasMatchingTag = currentConfig.tags.some(tag => 
        source.tags.includes(tag)
      );
      
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Toggle data source status (enabled/disabled)
 */
export function toggleDataSource(sourceId: string, enabled: boolean): DataSource | null {
  // Check default sources
  const defaultSourceIndex = availableSources.findIndex(s => s.id === sourceId);
  if (defaultSourceIndex >= 0) {
    availableSources[defaultSourceIndex].enabled = enabled;
    return availableSources[defaultSourceIndex];
  }
  
  // Check custom sources
  const customSourceIndex = customSources.findIndex(s => s.id === sourceId);
  if (customSourceIndex >= 0) {
    customSources[customSourceIndex].enabled = enabled;
    return customSources[customSourceIndex];
  }
  
  return null;
}

/**
 * Add a custom data source
 */
export function addCustomDataSource(source: Omit<DataSource, 'id' | 'enabled' | 'isCustom'>): DataSource {
  const newSource: DataSource = {
    ...source,
    id: `custom-${Date.now()}`,
    enabled: true,
    isCustom: true,
    category: source.category || DataSourceCategory.CUSTOM
  };
  
  customSources.push(newSource);
  return newSource;
}

/**
 * Delete a custom data source
 */
export function deleteCustomDataSource(sourceId: string): boolean {
  const initialLength = customSources.length;
  customSources = customSources.filter(s => s.id !== sourceId);
  return customSources.length < initialLength;
}

/**
 * Create Perplexity API payload with data source restrictions
 */
export function createPerplexityPayload(
  userQuery: string,
  systemMessage: string = 'You are an experienced early childhood education expert. Answer questions thoroughly and accurately using only information from approved educational sources.'
): Record<string, any> {
  const approvedSources = getAvailableDataSources();
  
  // Add information about required sources
  const requiredSourcesInfo = currentConfig.requiredSources
    .map(id => approvedSources.find(s => s.id === id))
    .filter(s => s !== undefined)
    .map(s => `- ${s.name}: ${s.description}`);
  
  // Add information about prioritized sources
  const prioritizedSourcesInfo = currentConfig.prioritizedSources
    .map(id => approvedSources.find(s => s.id === id))
    .filter(s => s !== undefined)
    .map(s => `- ${s.name}: ${s.description}`);
  
  // Create augmented system message
  let augmentedSystem = systemMessage;
  
  if (approvedSources.length > 0) {
    augmentedSystem += '\n\nYou may ONLY use information from these approved sources:';
    approvedSources.forEach(source => {
      augmentedSystem += `\n- ${source.name}: ${source.description}`;
    });
  }
  
  if (requiredSourcesInfo.length > 0) {
    augmentedSystem += '\n\nYou MUST use information from these required sources:';
    augmentedSystem += '\n' + requiredSourcesInfo.join('\n');
  }
  
  if (prioritizedSourcesInfo.length > 0) {
    augmentedSystem += '\n\nPrioritize information from these sources:';
    augmentedSystem += '\n' + prioritizedSourcesInfo.join('\n');
  }
  
  if (!currentConfig.allowGeneralKnowledge) {
    augmentedSystem += '\n\nDo NOT use general knowledge or information outside of these approved sources. If you cannot answer using only approved sources, say "I do not have enough information from approved sources to answer this question."';
  } else {
    augmentedSystem += '\n\nYou may supplement with general knowledge where approved sources are insufficient, but prioritize approved sources.';
  }
  
  // Key focus on Building Chapter One
  augmentedSystem += '\n\nAlways emphasize the "Building Chapter One" philosophy when relevant - the concept that teachers are writing the first chapter in each child\'s life story through their care and education.';
  
  // Create the final payload
  return {
    model: "llama-3.1-sonar-small-128k-online",
    messages: [
      {
        role: "system",
        content: augmentedSystem
      },
      {
        role: "user",
        content: userQuery
      }
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 2048,
    search_recency_filter: "month",
    return_related_questions: false
  };
}

/**
 * Enhanced version of generateLessonContent that uses the plugin
 */
export async function generateRestrictedLessonContent(prompt: string): Promise<any> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }
    
    const systemMessage = `You are BearyAI, an expert early childhood educator with deep knowledge of teaching practices and child development. 
Generate detailed, practical, and insightful answers specific to each question asked by teachers.
Your responses should be:
1. Unique and tailored to the specific question being asked
2. Based on approved educational sources and early childhood education best practices
3. Directly applicable to classroom settings with preschool children
4. Structured with concrete examples teachers can implement immediately
5. Warm, supportive, and encouraging in tone

Tailor each response specifically to the question asked without generic templated answers.
Always emphasize the "Building Chapter One" philosophy - the concept that teachers are writing the first chapter in each child's life story through their care and education.`;
    
    // Add uniqueness to each request by adding the timestamp to ensure different responses
    const uniquePrompt = `${prompt}\n\nRequest ID: ${Date.now()}`;
    
    const payload = createPerplexityPayload(uniquePrompt, systemMessage);
    
    console.log("Sending BearyAI request with prompt:", prompt.substring(0, 100) + "...");
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const generatedContent = response.data.choices[0].message.content;
    const citations = response.data.citations || [];
    
    return {
      content: generatedContent,
      citations: citations
    };
  } catch (error) {
    console.error('Error generating restricted lesson content:', error);
    throw error;
  }
}