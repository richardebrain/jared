import { db } from '../../db';
import { eq } from 'drizzle-orm';

// Temporary placeholder for missing schema exports
const assessmentDomains = null;
const assessmentResponses = null;
type AssessmentDomain = any;

export interface DomainAllocation {
  domainId: number;
  domainName: string;
  questionWeight: number;
  targetQuestions: number;
  currentQuestions: number;
  deficit: number;
  priority: number; // Higher number = higher priority
}

export interface DomainSelectionResult {
  selectedDomainId: number;
  priority: number;
  allocation: DomainAllocation;
  reason: string;
}

/**
 * Domain Weighting Service
 * 
 * Manages the weighted domain selection algorithm to ensure proper question
 * distribution across ECE domains based on their relative importance weights.
 */
export class DomainWeightingService {

  /**
   * Calculate target allocation for each domain based on weights and current progress
   */
  async calculateDomainAllocation(
    domains: AssessmentDomain[],
    totalQuestions: number,
    currentDomainCoverage: Map<number, number>
  ): Promise<DomainAllocation[]> {
    // Calculate total weight to normalize allocations
    const totalWeight = domains.reduce((sum, domain) => sum + domain.questionWeight, 0);
    
    const allocations: DomainAllocation[] = domains.map(domain => {
      // Calculate target questions based on domain weight
      const targetQuestions = Math.ceil((domain.questionWeight / totalWeight) * totalQuestions);
      const currentQuestions = currentDomainCoverage.get(domain.id) || 0;
      const deficit = Math.max(0, targetQuestions - currentQuestions);
      
      // Priority calculation: higher deficit = higher priority
      // Also factor in the domain weight itself for tie-breaking
      const priority = deficit * 100 + domain.questionWeight;

      return {
        domainId: domain.id,
        domainName: domain.name,
        questionWeight: domain.questionWeight,
        targetQuestions,
        currentQuestions,
        deficit,
        priority
      };
    });

    // Sort by priority (highest first) for easy selection
    return allocations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get priority domains that are under their target allocation
   */
  getPriorityDomains(allocations: DomainAllocation[]): Array<{
    domainId: number;
    priority: number;
    allocation: DomainAllocation;
  }> {
    return allocations
      .filter(allocation => allocation.deficit > 0)
      .map(allocation => ({
        domainId: allocation.domainId,
        priority: allocation.priority,
        allocation
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select optimal domain based on current progress and target allocations
   */
  selectOptimalDomain(
    allocations: DomainAllocation[],
    availableDomains: number[] // Domain IDs that have available questions
  ): DomainSelectionResult | null {
    // Filter allocations to only include domains with available questions
    const availableAllocations = allocations.filter(allocation => 
      availableDomains.includes(allocation.domainId)
    );

    if (availableAllocations.length === 0) {
      return null;
    }

    // Priority 1: Domains with deficits (under target allocation)
    const deficitDomains = availableAllocations.filter(allocation => allocation.deficit > 0);
    
    if (deficitDomains.length > 0) {
      // Select domain with highest priority (highest deficit + weight)
      const selectedDomain = deficitDomains[0];
      return {
        selectedDomainId: selectedDomain.domainId,
        priority: selectedDomain.priority,
        allocation: selectedDomain,
        reason: `Domain deficit: ${selectedDomain.deficit} questions needed (target: ${selectedDomain.targetQuestions}, current: ${selectedDomain.currentQuestions})`
      };
    }

    // Priority 2: All domains are at or above target - select domain with highest weight
    const highestWeightDomain = availableAllocations.reduce((prev, current) => 
      current.questionWeight > prev.questionWeight ? current : prev
    );

    return {
      selectedDomainId: highestWeightDomain.domainId,
      priority: highestWeightDomain.priority,
      allocation: highestWeightDomain,
      reason: `All domains balanced - selected highest weight domain (weight: ${highestWeightDomain.questionWeight})`
    };
  }

  /**
   * Get current domain coverage for an assessment
   */
  async getCurrentDomainCoverage(assessmentId: number): Promise<Map<number, number>> {
    const responses = await db.select({
      domainId: assessmentResponses.domainId,
      count: assessmentResponses.id // We'll count these in the application
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

    // Group by domain and count questions
    const domainCounts = new Map<number, number>();
    
    for (const response of responses) {
      // domainId is now stored as integer in the database
      const domainId = response.domainId as number;
      if (domainId && !isNaN(domainId)) {
        domainCounts.set(domainId, (domainCounts.get(domainId) || 0) + 1);
      }
    }

    return domainCounts;
  }

  /**
   * Update domain coverage after a question is answered
   */
  async updateDomainCoverage(
    currentCoverage: Map<number, number>,
    domainId: number
  ): Promise<Map<number, number>> {
    const updatedCoverage = new Map(currentCoverage);
    updatedCoverage.set(domainId, (updatedCoverage.get(domainId) || 0) + 1);
    return updatedCoverage;
  }

  /**
   * Validate that domain coverage meets minimum requirements
   */
  validateDomainCoverage(
    allocations: DomainAllocation[],
    minDomainCoverage: number = 1
  ): {
    isValid: boolean;
    missingDomains: string[];
    recommendations: string[];
  } {
    const missingDomains: string[] = [];
    const recommendations: string[] = [];

    for (const allocation of allocations) {
      if (allocation.currentQuestions < minDomainCoverage) {
        missingDomains.push(allocation.domainName);
        recommendations.push(
          `Domain "${allocation.domainName}" needs ${minDomainCoverage - allocation.currentQuestions} more questions`
        );
      }
    }

    return {
      isValid: missingDomains.length === 0,
      missingDomains,
      recommendations
    };
  }

  /**
   * Calculate domain balance score (0-100, higher is better)
   */
  calculateBalanceScore(allocations: DomainAllocation[]): number {
    if (allocations.length === 0) return 100;

    // Calculate variance in allocation percentages
    const targetPercentages = allocations.map(allocation => 
      allocation.targetQuestions > 0 ? allocation.currentQuestions / allocation.targetQuestions : 1
    );

    const averagePercentage = targetPercentages.reduce((sum, pct) => sum + pct, 0) / targetPercentages.length;
    const variance = targetPercentages.reduce((sum, pct) => sum + Math.pow(pct - averagePercentage, 2), 0) / targetPercentages.length;
    
    // Convert variance to score (lower variance = higher score)
    const maxVariance = 1; // Theoretical maximum variance
    const normalizedVariance = Math.min(variance / maxVariance, 1);
    
    return Math.round((1 - normalizedVariance) * 100);
  }

  /**
   * Get detailed domain statistics for analysis
   */
  getDomainStatistics(allocations: DomainAllocation[]): {
    totalWeight: number;
    totalTargetQuestions: number;
    totalCurrentQuestions: number;
    balanceScore: number;
    domainDetails: Array<{
      domainName: string;
      weight: number;
      targetQuestions: number;
      currentQuestions: number;
      completionPercentage: number;
      deficit: number;
      status: 'under' | 'balanced' | 'over';
    }>;
  } {
    const totalWeight = allocations.reduce((sum, allocation) => sum + allocation.questionWeight, 0);
    const totalTargetQuestions = allocations.reduce((sum, allocation) => sum + allocation.targetQuestions, 0);
    const totalCurrentQuestions = allocations.reduce((sum, allocation) => sum + allocation.currentQuestions, 0);
    const balanceScore = this.calculateBalanceScore(allocations);

    const domainDetails = allocations.map(allocation => {
      const completionPercentage = allocation.targetQuestions > 0 
        ? Math.round((allocation.currentQuestions / allocation.targetQuestions) * 100)
        : 100;
      
      let status: 'under' | 'balanced' | 'over';
      if (allocation.currentQuestions < allocation.targetQuestions) {
        status = 'under';
      } else if (allocation.currentQuestions === allocation.targetQuestions) {
        status = 'balanced';
      } else {
        status = 'over';
      }

      return {
        domainName: allocation.domainName,
        weight: allocation.questionWeight,
        targetQuestions: allocation.targetQuestions,
        currentQuestions: allocation.currentQuestions,
        completionPercentage,
        deficit: allocation.deficit,
        status
      };
    });

    return {
      totalWeight,
      totalTargetQuestions,
      totalCurrentQuestions,
      balanceScore,
      domainDetails
    };
  }

  /**
   * Predict final domain distribution based on current progress
   */
  predictFinalDistribution(
    allocations: DomainAllocation[],
    remainingQuestions: number
  ): DomainAllocation[] {
    if (remainingQuestions <= 0) {
      return allocations;
    }

    // Calculate predicted questions per domain if we continue current weighting
    const totalDeficit = allocations.reduce((sum, allocation) => sum + allocation.deficit, 0);
    
    if (totalDeficit === 0) {
      // All domains balanced, distribute remaining questions by weight
      const totalWeight = allocations.reduce((sum, allocation) => sum + allocation.questionWeight, 0);
      
      return allocations.map(allocation => {
        const additionalQuestions = Math.floor((allocation.questionWeight / totalWeight) * remainingQuestions);
        return {
          ...allocation,
          currentQuestions: allocation.currentQuestions + additionalQuestions,
          deficit: Math.max(0, allocation.targetQuestions - allocation.currentQuestions - additionalQuestions)
        };
      });
    }

    // Distribute remaining questions to address deficits
    return allocations.map(allocation => {
      const deficitProportion = allocation.deficit / totalDeficit;
      const additionalQuestions = Math.floor(deficitProportion * remainingQuestions);
      const finalQuestions = allocation.currentQuestions + additionalQuestions;
      
      return {
        ...allocation,
        currentQuestions: finalQuestions,
        deficit: Math.max(0, allocation.targetQuestions - finalQuestions)
      };
    });
  }
} 