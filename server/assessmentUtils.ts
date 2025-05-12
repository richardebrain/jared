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
  const recommendations = allModules
    .filter(module => {
      // Check if this module matches any of our recommended topics
      return recommendedModuleTitles.some(title => 
        module.title.includes(title) || module.description.includes(title)
      );
    })
    .map(module => module.id);
  
  // If we don't have enough recommendations, add some general modules
  if (recommendations.length < 3) {
    const generalModules = allModules
      .filter(module => !recommendations.includes(module.id))
      .slice(0, 3 - recommendations.length)
      .map(module => module.id);
      
    recommendations.push(...generalModules);
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