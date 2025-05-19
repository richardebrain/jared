import { useMemo } from 'react';

/**
 * Custom hook to ensure required training modules always appear in the required section
 * This solves the issue of modules appearing in the wrong location and ensures
 * all four required onboarding trainings are properly categorized
 */
export function useRequiredModules(modules: any[] = [], userProgress: any[] = [], assessments: any[] = []) {
  return useMemo(() => {
    if (!modules || !userProgress) return [];
    
    // Early return if arrays aren't loaded
    if (!Array.isArray(modules) || !Array.isArray(userProgress)) return [];
    
    // IMPORTANT: Always include all four required onboarding modules
    // Find the four required modules by title (case insensitive)
    const coreModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("core") && m.title.toLowerCase().includes("raising arizona")
    );
    
    const chapterOneModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("chapter 1") && m.title.toLowerCase().includes("building a human")
    );

    const mindfulMorningsModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("mindful morning")
    );
    
    const healthSafetyModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("health and safety")
    );
    
    // Create a list of always-required module IDs
    const requiredOnboardingIds = [];
    
    // Add the four required training modules
    if (coreModule?.id) requiredOnboardingIds.push(coreModule.id);
    if (chapterOneModule?.id) requiredOnboardingIds.push(chapterOneModule.id);
    if (mindfulMorningsModule?.id) requiredOnboardingIds.push(mindfulMorningsModule.id);
    if (healthSafetyModule?.id) requiredOnboardingIds.push(healthSafetyModule.id);
    
    // Alternate search with explicit IDs (as fallback)
    if (!coreModule && modules.find(m => m.id === 33)) {
      requiredOnboardingIds.push(33); // Raising Arizona's CORE id
    }
    
    if (!chapterOneModule && modules.find(m => m.id === 34)) {
      requiredOnboardingIds.push(34); // Chapter 1: Building a Human id
    }

    if (!mindfulMorningsModule && modules.find(m => m.id === 28)) {
      requiredOnboardingIds.push(28); // Mindful Mornings id
    }
    
    // Get modules marked as required from progress data
    const recommendedModuleIds = userProgress
      .filter(p => p.recommended)
      .map(p => p.moduleId);
    
    // Get assessment recommendations
    const assessmentModuleIds = assessments && assessments.length > 0
      ? assessments[0]?.recommendedModules || []
      : [];
    
    // Combine all sources of required modules (avoiding Set for compatibility)
    const allRequiredIds = [...requiredOnboardingIds, ...recommendedModuleIds, ...assessmentModuleIds];
    // Remove duplicates the traditional way
    const uniqueRequiredIds = allRequiredIds.filter((id, index) => allRequiredIds.indexOf(id) === index);
    
    // Match IDs with module data and include progress
    return uniqueRequiredIds.map(id => {
      const module = modules.find(m => m.id === id);
      if (!module) return null;
      
      const progress = Array.isArray(userProgress)
        ? userProgress.find(p => p.moduleId === id)?.progress || 0
        : 0;
        
      const completed = Array.isArray(userProgress)
        ? userProgress.find(p => p.moduleId === id)?.completed || false
        : false;
      
      return { module, progress, completed };
    }).filter(Boolean);
  }, [modules, userProgress, assessments]);
}