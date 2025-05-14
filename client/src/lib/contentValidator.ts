/**
 * Content validation utility for learning modules
 * This helps identify missing or inadequate content in learning modules
 */

import { checkYouTubeVideo } from './videoValidator';

/**
 * Interface for content validation information
 */
export interface ContentValidationInfo {
  moduleId: number;
  moduleName: string;
  hasLearningObjectives: boolean;
  hasStudyMaterials: boolean;
  studyMaterialLength: number; // Length in characters for the study materials
  hasVideo: boolean;
  videoWorking: boolean | null; // null means not checked yet
  videoId: string | null;
  hasQuiz: boolean;
  quizQuestionCount: number;
  status: 'complete' | 'incomplete' | 'error';
  issues: string[];
}

/**
 * Interface for the validation summary
 */
export interface ValidationSummary {
  totalModules: number;
  completeModules: number;
  incompleteModules: number;
  errorModules: number;
  missingObjectives: number;
  missingStudyMaterials: number;
  inadequateStudyMaterials: number; // Study materials too short
  missingVideos: number;
  brokenVideos: number;
  missingQuizzes: number;
  inadequateQuizzes: number; // Quizzes with too few questions
}

/**
 * Content validation thresholds
 */
export const CONTENT_VALIDATION_THRESHOLDS = {
  MIN_STUDY_MATERIAL_LENGTH: 500, // Minimum length in characters for study materials
  MIN_QUIZ_QUESTIONS: 5, // Minimum number of quiz questions
  RECOMMENDED_QUIZ_QUESTIONS: 6, // Including implementation question
};

/**
 * Check if study material is adequate based on its length
 * @param content Study material content
 * @returns boolean indicating if the content is adequate
 */
export function isStudyMaterialAdequate(content: string): boolean {
  if (!content) return false;
  
  // Remove HTML tags for accurate character count
  const plainText = content.replace(/<[^>]*>/g, '');
  
  return plainText.length >= CONTENT_VALIDATION_THRESHOLDS.MIN_STUDY_MATERIAL_LENGTH;
}

/**
 * Extract objectives from content if they exist
 * @param content Module content to check
 * @returns boolean indicating if learning objectives are present
 */
export function hasLearningObjectives(content: string): boolean {
  if (!content) return false;
  
  const objectivesPattern = /learning objectives|objectives|goals|by the end of this lesson/i;
  return objectivesPattern.test(content);
}

/**
 * Check if a module has adequate quiz questions
 * @param quiz Quiz object from the module
 * @returns boolean indicating if the quiz is adequate
 */
export function isQuizAdequate(quiz: any): boolean {
  if (!quiz || !quiz.questions) return false;
  
  return quiz.questions.length >= CONTENT_VALIDATION_THRESHOLDS.MIN_QUIZ_QUESTIONS;
}

/**
 * Extract YouTube video ID from module content
 * @param content Module content
 * @returns YouTube video ID or null if not found
 */
export function extractVideoId(content: string): string | null {
  if (!content) return null;
  
  // Look for YouTube embed codes or links
  const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = content.match(youtubePattern);
  
  return match ? match[1] : null;
}

/**
 * Check if a YouTube video ID is valid
 * @param videoId YouTube video ID to check
 * @returns Promise with validation result
 */
export async function checkVideoValidity(videoId: string): Promise<boolean> {
  if (!videoId) return false;
  
  try {
    return await checkYouTubeVideo(videoId);
  } catch (error) {
    console.error('Error validating video:', error);
    return false;
  }
}

/**
 * Validate a module's content
 * @param module Module object to validate
 * @returns Promise with validation info
 */
export async function validateModuleContent(module: any): Promise<ContentValidationInfo> {
  const content = module.content || '';
  const videoId = extractVideoId(content);
  const issues: string[] = [];
  
  // Check for study materials
  const hasStudyMaterials = content.length > 0;
  const studyMaterialLength = content.length;
  const isStudyMaterialsAdequate = isStudyMaterialAdequate(content);
  
  if (!hasStudyMaterials) {
    issues.push('Module is missing study materials');
  } else if (!isStudyMaterialsAdequate) {
    issues.push(`Study materials are too short (${studyMaterialLength} chars)`);
  }
  
  // Check for learning objectives
  const hasObjectives = hasLearningObjectives(content);
  if (!hasObjectives) {
    issues.push('Module is missing learning objectives');
  }
  
  // Check for quiz
  const hasQuiz = module.quiz && Array.isArray(module.quiz.questions);
  const quizQuestionCount = hasQuiz ? module.quiz.questions.length : 0;
  const isQuizAdequateResult = isQuizAdequate(module.quiz);
  
  if (!hasQuiz) {
    issues.push('Module is missing a quiz');
  } else if (!isQuizAdequateResult) {
    issues.push(`Quiz has insufficient questions (${quizQuestionCount}/${CONTENT_VALIDATION_THRESHOLDS.MIN_QUIZ_QUESTIONS} minimum)`);
  }
  
  // Check for video
  let videoWorking: boolean | null = null;
  
  if (!videoId) {
    issues.push('Module is missing a video');
  } else {
    try {
      videoWorking = await checkVideoValidity(videoId);
      if (!videoWorking) {
        issues.push(`Video (ID: ${videoId}) is not working`);
      }
    } catch (error) {
      issues.push(`Error checking video (ID: ${videoId}): ${error}`);
      videoWorking = false;
    }
  }
  
  // Determine overall status
  let status: 'complete' | 'incomplete' | 'error' = 'complete';
  
  if (issues.length > 0) {
    status = 'incomplete';
  }
  
  if (!hasStudyMaterials || !hasQuiz || (videoId && !videoWorking)) {
    status = 'error'; // Critical issues
  }
  
  return {
    moduleId: module.id,
    moduleName: module.title,
    hasLearningObjectives: hasObjectives,
    hasStudyMaterials,
    studyMaterialLength,
    hasVideo: !!videoId,
    videoWorking,
    videoId,
    hasQuiz,
    quizQuestionCount,
    status,
    issues,
  };
}

/**
 * Validate multiple modules' content
 * @param modules Array of module objects to validate
 * @returns Promise with array of validation info and summary
 */
export async function validateAllModulesContent(modules: any[]): Promise<{
  results: ContentValidationInfo[],
  summary: ValidationSummary
}> {
  if (!modules || !Array.isArray(modules)) {
    throw new Error('Invalid modules data provided');
  }
  
  const results: ContentValidationInfo[] = [];
  
  for (const module of modules) {
    try {
      const validationInfo = await validateModuleContent(module);
      results.push(validationInfo);
    } catch (error) {
      console.error(`Error validating module ${module.id}:`, error);
      results.push({
        moduleId: module.id,
        moduleName: module.title || 'Unknown module',
        hasLearningObjectives: false,
        hasStudyMaterials: false,
        studyMaterialLength: 0,
        hasVideo: false,
        videoWorking: null,
        videoId: null,
        hasQuiz: false,
        quizQuestionCount: 0,
        status: 'error',
        issues: [`Error validating module: ${error}`],
      });
    }
  }
  
  // Generate summary
  const summary: ValidationSummary = {
    totalModules: results.length,
    completeModules: results.filter(r => r.status === 'complete').length,
    incompleteModules: results.filter(r => r.status === 'incomplete').length,
    errorModules: results.filter(r => r.status === 'error').length,
    missingObjectives: results.filter(r => !r.hasLearningObjectives).length,
    missingStudyMaterials: results.filter(r => !r.hasStudyMaterials).length,
    inadequateStudyMaterials: results.filter(r => 
      r.hasStudyMaterials && r.studyMaterialLength < CONTENT_VALIDATION_THRESHOLDS.MIN_STUDY_MATERIAL_LENGTH
    ).length,
    missingVideos: results.filter(r => !r.hasVideo).length,
    brokenVideos: results.filter(r => r.hasVideo && r.videoWorking === false).length,
    missingQuizzes: results.filter(r => !r.hasQuiz).length,
    inadequateQuizzes: results.filter(r => 
      r.hasQuiz && r.quizQuestionCount < CONTENT_VALIDATION_THRESHOLDS.MIN_QUIZ_QUESTIONS
    ).length,
  };
  
  return { results, summary };
}