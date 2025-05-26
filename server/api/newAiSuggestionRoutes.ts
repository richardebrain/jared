import { Router } from 'express';
import { 
  generateAITeachingStrategies,
  generateAIAssessmentQuestions,
  generateAIQuizQuestions,
  generateTeachingStrategies, 
  generateAssessmentQuestions, 
  generateQuizQuestions 
} from './dynamicAiSuggestions';

const router = Router();

/**
 * AI suggestion generation endpoint for module creator
 * This endpoint generates contextually relevant suggestions based on the module topic
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    console.log("Received AI suggestion request:", { prompt, type });
    
    // Extract difficulty level from the prompt
    let difficultyLevel = "intermediate";
    if (prompt.toLowerCase().includes("beginner level")) {
      difficultyLevel = "beginner";
    } else if (prompt.toLowerCase().includes("advanced level")) {
      difficultyLevel = "advanced";
    }
    
    // Extract module topic - either from direct format or quoted title
    let moduleTopic = "";
    
    // First try to extract from simplified format (Topic - level)
    const directFormatMatch = prompt.match(/^(.*?)\s*-\s*(?:beginner|intermediate|advanced)/i);
    if (directFormatMatch) {
      moduleTopic = directFormatMatch[1].trim();
      console.log("Direct format detected, module topic:", moduleTopic);
    } else {
      // Otherwise extract from quotes
      const titleMatch = prompt.match(/\"([^\"]+)\"/);
      if (titleMatch) {
        moduleTopic = titleMatch[1].trim();
        console.log("Quoted format detected, module topic:", moduleTopic);
      } else {
        // Last resort - use the whole prompt as topic
        moduleTopic = prompt.trim();
        console.log("Using full prompt as module topic:", moduleTopic);
      }
    }
    
    // Log the extracted module title for debugging
    console.log(`Module title for ${type} generation: ${moduleTopic}`);
    
    // Generate topic-specific content based on request type using AI first, with fallback
    if (type === 'strategies') {
      try {
        // Use AI for dynamic, contextual strategies
        const strategies = await generateAITeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n')
        });
      } catch (error) {
        console.log('AI strategies failed, using fallback:', error);
        // Fallback to built-in strategies
        const strategies = generateTeachingStrategies(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: strategies.join('\n')
        });
      }
    } else if (type === 'questions') {
      try {
        // Use AI for dynamic, contextual assessment questions
        const questions = await generateAIAssessmentQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: questions.join('\n')
        });
      } catch (error) {
        console.log('AI questions failed, using fallback:', error);
        // Fallback to built-in questions
        const questions = generateAssessmentQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          suggestions: questions.join('\n')
        });
      }
    } else if (type === 'quiz') {
      try {
        // Use AI for dynamic, contextual quiz questions
        const quizQuestions = await generateAIQuizQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          quizQuestions: quizQuestions
        });
      } catch (error) {
        console.log('AI quiz failed, using fallback:', error);
        // Fallback to built-in quiz questions
        const quizQuestions = generateQuizQuestions(
          moduleTopic, 
          difficultyLevel as 'beginner' | 'intermediate' | 'advanced'
        );
        return res.json({
          quizQuestions: quizQuestions
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid suggestion type' });
    }
    
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return res.status(500).json({
      message: 'Error generating suggestions',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;