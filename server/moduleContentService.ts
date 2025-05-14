/**
 * Module Content Service
 * 
 * This service provides functionality to check and fix modules
 * with inadequate educational content.
 */

import { LearningModule } from '@shared/schema';
import { storage } from './storage';
import { 
  hasAdequateContent, 
  generateDefaultModuleContent, 
  generateModuleContent 
} from './moduleContentTemplates';

/**
 * Interface for a module content check result
 */
export interface ModuleContentCheckResult {
  moduleId: number;
  title: string;
  hasAdequateContent: boolean;
  contentLength: number;
  contentType?: string;  // Added to help debugging
  hasVideo: boolean;
  hasQuiz: boolean;
  quizQuestionCount: number;
  hasLearningObjectives: boolean;
  fixed: boolean;
  error?: string;  // Added to capture any errors during check
}

/**
 * Check if a module has adequate educational content
 * 
 * @param module The module to check
 * @returns Content check result
 */
export function checkModuleContent(module: LearningModule): ModuleContentCheckResult {
  // Convert content to string, handling both string and object types
  let contentString = '';
  
  if (typeof module.content === 'string') {
    contentString = module.content;
  } else if (typeof module.content === 'object' && module.content !== null) {
    try {
      contentString = typeof module.content.toString === 'function' 
        ? module.content.toString()
        : JSON.stringify(module.content);
    } catch (error) {
      console.error('Error converting module content to string:', error);
      contentString = '';
    }
  }
  
  // Log content type for debugging
  console.log(`Module ${module.id} content type: ${typeof module.content}`);
  if (typeof module.content === 'object' && module.content !== null) {
    try {
      const keys = Object.keys(module.content);
      console.log('Content object keys:', keys.length > 0 ? keys : '[empty object]');
    } catch (error) {
      console.log('Unable to get content object keys:', error);
    }
  }
  
  // Check for video embeds in content
  const hasVideo = 
    contentString.includes('youtube.com/embed/') || 
    contentString.includes('youtu.be/');
  
  // Safely check for quiz structure
  const hasQuiz = 
    module.quiz !== null && 
    module.quiz !== undefined && 
    typeof module.quiz === 'object' &&
    module.quiz.questions !== undefined &&
    Array.isArray(module.quiz.questions) && 
    module.quiz.questions.length > 0;
                 
  // Count quiz questions
  const quizQuestionCount = 
    hasQuiz && 
    module.quiz && 
    module.quiz.questions ? 
    module.quiz.questions.length : 0;
  
  // Check for learning objectives in content
  const hasLearningObjectives = 
    contentString.includes('Learning Objectives') || 
    contentString.includes('learning objectives') || 
    contentString.includes('objectives');
  
  // Check if content is adequate using helper from templates
  const isAdequate = Boolean(hasAdequateContent(module));
  
  return {
    moduleId: module.id,
    title: module.title,
    hasAdequateContent: isAdequate,
    contentLength: contentString.length,
    contentType: typeof module.content,
    hasVideo,
    hasQuiz,
    quizQuestionCount,
    hasLearningObjectives,
    fixed: false // Will be set to true if fixed
  };
}

/**
 * Check all modules for adequate content
 * 
 * @returns Promise with array of content check results
 */
export async function checkAllModulesContent(): Promise<ModuleContentCheckResult[]> {
  try {
    const modules = await storage.getAllModules();
    return modules.map(module => checkModuleContent(module));
  } catch (error) {
    console.error('Error checking modules content:', error);
    throw error;
  }
}

/**
 * Fix a module with inadequate content
 * 
 * @param moduleId ID of the module to fix
 * @returns Promise with the fixed module
 */
export async function fixModuleContent(moduleId: number): Promise<LearningModule> {
  try {
    // Get the module to fix
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      throw new Error(`Module with ID ${moduleId} not found`);
    }
    
    // Don't fix if content is already adequate
    if (Boolean(hasAdequateContent(module))) {
      return module;
    }
    
    // Generate new content structure
    const contentStructure = generateDefaultModuleContent(module);
    
    // Generate HTML content
    const htmlContent = generateModuleContent(contentStructure);
    
    // Update the module with new content and quiz
    const updatedModule = {
      ...module,
      content: htmlContent,
      quiz: contentStructure.quiz,
    };
    
    // Save the updated module
    return await storage.updateModule(moduleId, updatedModule);
  } catch (error) {
    console.error(`Error fixing module ${moduleId} content:`, error);
    throw error;
  }
}

/**
 * Fix all modules with inadequate content
 * 
 * @returns Promise with results of the fix operation
 */
export async function fixAllModulesContent(): Promise<{
  totalModules: number;
  fixedModules: number;
  skippedModules: number;
  results: ModuleContentCheckResult[];
}> {
  try {
    // Get all modules
    const modules = await storage.getAllModules();
    const results: ModuleContentCheckResult[] = [];
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Check and fix each module if needed
    for (const module of modules) {
      const checkResult = checkModuleContent(module);
      
      if (!checkResult.hasAdequateContent) {
        // Fix the module
        await fixModuleContent(module.id);
        checkResult.fixed = true;
        fixedCount++;
      } else {
        skippedCount++;
      }
      
      results.push(checkResult);
    }
    
    return {
      totalModules: modules.length,
      fixedModules: fixedCount,
      skippedModules: skippedCount,
      results
    };
  } catch (error) {
    console.error('Error fixing all modules content:', error);
    throw error;
  }
}