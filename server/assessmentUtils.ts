import { LearningModule } from "@shared/schema";

// Category to module mapping for recommendations
const CATEGORY_MODULE_MAP: Record<string, string[]> = {
  // ITERS/ECERS categories
  "Space and Furnishings": ["Creating Engaging Learning Environments", "Sensory Play"],
  "Personal Care Routines": ["Preschool Classroom Management", "Inclusive Practices"],
  "Language-Reasoning": ["Language Development in Early Childhood", "Building Math Foundations"],
  "Activities": ["Play-Based Learning Strategies", "Sensory Play in Early Childhood"],
  
  // CLASS categories
  "Emotional Support": ["Mindful Mornings", "Positive Behavior Support"],
  "Classroom Organization": ["Preschool Classroom Management", "Effective Parent-Teacher Communication"],
  "Instructional Support": ["Child Development Milestones", "Building Math Foundations"],
  
  // Knowledge categories
  "Child Development": ["Child Development Milestones", "Inclusive Practices for Diverse Learners"],
  "Curriculum": ["Play-Based Learning Strategies", "Building Math Foundations"],
  "Behavior Management": ["Positive Behavior Support in Preschool", "Mindful Mornings: Breathing Exercises"],
  "Literacy": ["Language Development in Early Childhood", "Sensory Play in Early Childhood"],
  "Social-Emotional": ["Mindful Mornings", "Positive Behavior Support"],
  
  // Experience categories
  "Experience Level": ["Effective Parent-Teacher Communication", "Inclusive Practices"],
  "Education": ["Child Development Milestones", "Language Development in Early Childhood"],
  "Professional Development": ["Inclusive Practices for Diverse Learners", "Effective Parent-Teacher Communication"],
  "Age Group Experience": ["Child Development Milestones", "Sensory Play in Early Childhood"],
  "Professional Goals": ["Preschool Classroom Management", "Mindful Mornings"]
};

/**
 * Generate module recommendations based on assessment results
 * 
 * @param strengthAreas Areas of strength identified in assessment
 * @param growthAreas Areas for growth identified in assessment
 * @param allModules All available learning modules
 * @returns Array of recommended module IDs
 */
export function generateModuleRecommendations(
  strengthAreas: string[], 
  growthAreas: string[],
  allModules: LearningModule[]
): number[] {
  const recommendedModuleTitles: string[] = [];
  
  // Focus more heavily on growth areas (75% of recommendations)
  growthAreas.forEach(area => {
    const moduleTypes = CATEGORY_MODULE_MAP[area] || [];
    recommendedModuleTitles.push(...moduleTypes);
  });
  
  // Include some modules from strength areas (25% of recommendations)
  // This helps build on existing strengths while addressing growth areas
  const strengthModules = strengthAreas
    .flatMap(area => CATEGORY_MODULE_MAP[area] || [])
    .slice(0, Math.max(1, Math.floor(recommendedModuleTitles.length / 3)));
    
  recommendedModuleTitles.push(...strengthModules);
  
  // Match module titles to actual modules in the database
  const matchedModules = allModules
    .filter(module => {
      // Check if this module matches any of our recommended topics
      return recommendedModuleTitles.some(title => 
        module.title.includes(title) || module.description.includes(title)
      );
    });
  
  // Separate modules by difficulty
  const beginnerModules = matchedModules.filter(module => module.difficulty === 'beginner');
  const intermediateModules = matchedModules.filter(module => module.difficulty === 'intermediate');
  const advancedModules = matchedModules.filter(module => module.difficulty === 'advanced');
  
  // Create a balanced set of recommendations with different difficulties
  const recommendations: number[] = [];
  
  // Add one module from each difficulty level (if available)
  if (beginnerModules.length > 0) {
    recommendations.push(beginnerModules[0].id);
  }
  
  if (intermediateModules.length > 0) {
    recommendations.push(intermediateModules[0].id);
  }
  
  if (advancedModules.length > 0) {
    recommendations.push(advancedModules[0].id);
  }
  
  // If we don't have modules from all difficulty levels, fill in with available modules
  const allRecommendedModules = [...matchedModules];
  
  // Remove modules already added to recommendations
  allRecommendedModules.sort((a, b) => {
    // First, prioritize matching content
    const aScore = recommendedModuleTitles.filter(title => 
      a.title.includes(title) || a.description.includes(title)
    ).length;
    
    const bScore = recommendedModuleTitles.filter(title => 
      b.title.includes(title) || b.description.includes(title)
    ).length;
    
    return bScore - aScore;
  });
  
  // Fill remaining slots with the best matches that aren't already recommended
  for (const module of allRecommendedModules) {
    if (!recommendations.includes(module.id) && recommendations.length < 3) {
      recommendations.push(module.id);
    }
  }
  
  // If we still don't have enough recommendations, add some general modules
  if (recommendations.length < 3) {
    // Group remaining modules by difficulty
    const remainingModules = allModules.filter(module => !recommendations.includes(module.id));
    const remainingBeginners = remainingModules.filter(m => m.difficulty === 'beginner');
    const remainingIntermediate = remainingModules.filter(m => m.difficulty === 'intermediate');
    const remainingAdvanced = remainingModules.filter(m => m.difficulty === 'advanced');
    
    // Add one from each difficulty that we're missing
    if (recommendations.length < 3 && !recommendations.some(id => 
        beginnerModules.some(m => m.id === id)) && remainingBeginners.length > 0) {
      recommendations.push(remainingBeginners[0].id);
    }
    
    if (recommendations.length < 3 && !recommendations.some(id => 
        intermediateModules.some(m => m.id === id)) && remainingIntermediate.length > 0) {
      recommendations.push(remainingIntermediate[0].id);
    }
    
    if (recommendations.length < 3 && !recommendations.some(id => 
        advancedModules.some(m => m.id === id)) && remainingAdvanced.length > 0) {
      recommendations.push(remainingAdvanced[0].id);
    }
    
    // If we still need more, add any modules
    const anyRemaining = remainingModules
      .slice(0, 3 - recommendations.length)
      .map(module => module.id);
      
    recommendations.push(...anyRemaining);
  }
  
  return recommendations;
}

/**
 * Calculate teacher level based on assessment score
 * 
 * @param overallScore Overall assessment score (0-100)
 * @returns Teacher level string
 */
export function calculateTeacherLevel(overallScore: number): string {
  if (overallScore >= 80) return "Master Lead Teacher";
  if (overallScore >= 60) return "Lead Teacher";
  if (overallScore >= 40) return "Associate Teacher";
  if (overallScore >= 20) return "Assistant Teacher";
  return "Teacher in Training";
}