import { useMemo } from 'react';

/**
 * Custom hook to ensure required training modules always appear in the required section
 * This solves the issue of CORE and Chapter 1 modules appearing in the wrong location
 */
export function useRequiredModules(modules: any[] = [], userProgress: any[] = [], assessments: any[] = []) {
  return useMemo(() => {
    if (!modules || !userProgress) return [];
    
    // Early return if arrays aren't loaded
    if (!Array.isArray(modules) || !Array.isArray(userProgress)) return [];
    
    // IMPORTANT: Always include CORE and Chapter 1 modules as required
    // Find these critical modules by title (case insensitive for robustness)
    const coreModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("core") && m.title.toLowerCase().includes("raising arizona")
    );
    
    const chapterOneModule = modules.find(m => 
      m.title && m.title.toLowerCase().includes("chapter 1") && m.title.toLowerCase().includes("building a human")
    );
    
    // Create a list of always-required module IDs
    const alwaysRequiredIds = [];
    if (coreModule?.id) alwaysRequiredIds.push(coreModule.id);
    if (chapterOneModule?.id) alwaysRequiredIds.push(chapterOneModule.id);
    
    // Get modules marked as required from progress data
    const requiredModuleIds = userProgress
      .filter(p => p.recommended)
      .map(p => p.moduleId);
    
    // Get assessment recommendations
    const assessmentModuleIds = assessments && assessments.length > 0
      ? assessments[0]?.recommendedModules || []
      : [];
    
    // Combine all sources of required modules (using array spread instead of Set for compatibility)
    const allRequiredIds = [...alwaysRequiredIds, ...requiredModuleIds, ...assessmentModuleIds];
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