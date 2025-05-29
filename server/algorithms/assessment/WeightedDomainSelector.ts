import { DomainAllocation } from '../services/DomainWeightingService';
import { AssessmentDomain } from '@shared/schema';

export interface DomainSelectionContext {
  currentSequence: number;
  totalQuestions: number;
  questionsRemaining: number;
  assessmentPhase: 'early' | 'mid' | 'final';
}

export interface DomainSelectionStrategy {
  name: string;
  description: string;
  isApplicable: (context: DomainSelectionContext) => boolean;
  selectDomain: (allocations: DomainAllocation[], context: DomainSelectionContext) => number | null;
}

/**
 * Weighted Domain Selector Algorithm
 * 
 * Implements sophisticated domain selection logic that balances weighted target
 * allocation with adaptive strategies based on assessment phase and progress.
 */
export class WeightedDomainSelector {
  private strategies: DomainSelectionStrategy[] = [
    new DeficitBasedStrategy(),
    new PhaseBalancedStrategy(),
    new WeightBasedStrategy(),
    new FinalPhaseStrategy()
  ];

  /**
   * Select the optimal domain based on current state and context
   */
  selectDomain(
    allocations: DomainAllocation[],
    context: DomainSelectionContext,
    availableDomains: number[]
  ): {
    selectedDomainId: number | null;
    strategy: string;
    reason: string;
    priority: number;
  } {
    // Filter allocations to only include available domains
    const availableAllocations = allocations.filter(allocation => 
      availableDomains.includes(allocation.domainId)
    );

    if (availableAllocations.length === 0) {
      return {
        selectedDomainId: null,
        strategy: 'none',
        reason: 'No domains have available questions',
        priority: 0
      };
    }

    // Try each strategy in order until one succeeds
    for (const strategy of this.strategies) {
      if (strategy.isApplicable(context)) {
        const selectedDomainId = strategy.selectDomain(availableAllocations, context);
        
        if (selectedDomainId !== null) {
          const selectedAllocation = availableAllocations.find(a => a.domainId === selectedDomainId);
          return {
            selectedDomainId,
            strategy: strategy.name,
            reason: `${strategy.description} - Selected domain ${selectedDomainId}`,
            priority: selectedAllocation?.priority || 0
          };
        }
      }
    }

    // Fallback: select any available domain
    const fallbackDomain = availableAllocations[0];
    return {
      selectedDomainId: fallbackDomain.domainId,
      strategy: 'fallback',
      reason: 'Fallback selection - first available domain',
      priority: fallbackDomain.priority
    };
  }

  /**
   * Calculate assessment phase based on progress
   */
  calculateAssessmentPhase(currentSequence: number, totalQuestions: number): 'early' | 'mid' | 'final' {
    const progress = currentSequence / totalQuestions;
    
    if (progress <= 0.5) {
      return 'early';
    } else if (progress <= 0.875) { // Up to question 35 of 40
      return 'mid';
    } else {
      return 'final';
    }
  }

  /**
   * Create selection context from current assessment state
   */
  createSelectionContext(
    currentSequence: number,
    totalQuestions: number
  ): DomainSelectionContext {
    const questionsRemaining = totalQuestions - currentSequence + 1;
    const assessmentPhase = this.calculateAssessmentPhase(currentSequence, totalQuestions);

    return {
      currentSequence,
      totalQuestions,
      questionsRemaining,
      assessmentPhase
    };
  }

  /**
   * Validate domain selection result
   */
  validateSelection(
    selectedDomainId: number,
    allocations: DomainAllocation[],
    context: DomainSelectionContext
  ): {
    isValid: boolean;
    warnings: string[];
    impact: {
      willMeetTarget: boolean;
      deficitReduction: number;
      balanceImprovement: number;
    };
  } {
    const warnings: string[] = [];
    const selectedAllocation = allocations.find(a => a.domainId === selectedDomainId);

    if (!selectedAllocation) {
      return {
        isValid: false,
        warnings: ['Selected domain not found in allocations'],
        impact: { willMeetTarget: false, deficitReduction: 0, balanceImprovement: 0 }
      };
    }

    // Check if selection will help meet targets
    const willMeetTarget = selectedAllocation.deficit > 0;
    const deficitReduction = selectedAllocation.deficit > 0 ? 1 : 0;

    // Calculate balance improvement (simplified)
    const totalDeficit = allocations.reduce((sum, a) => sum + a.deficit, 0);
    const balanceImprovement = totalDeficit > 0 ? (deficitReduction / totalDeficit) * 100 : 0;

    // Generate warnings
    if (!willMeetTarget && context.assessmentPhase === 'early') {
      warnings.push('Selecting domain that is already at target during early phase');
    }

    if (selectedAllocation.deficit === 0 && context.questionsRemaining < 5) {
      warnings.push('Selecting balanced domain with few questions remaining');
    }

    return {
      isValid: true,
      warnings,
      impact: {
        willMeetTarget,
        deficitReduction,
        balanceImprovement
      }
    };
  }
}

/**
 * Deficit-Based Selection Strategy
 * 
 * Prioritizes domains with the highest deficit (under target allocation)
 */
class DeficitBasedStrategy implements DomainSelectionStrategy {
  name = 'deficit-based';
  description = 'Prioritize domains with highest deficit';

  isApplicable(context: DomainSelectionContext): boolean {
    // Always applicable - this is our primary strategy
    return true;
  }

  selectDomain(allocations: DomainAllocation[], context: DomainSelectionContext): number | null {
    // Find domains with deficits
    const deficitDomains = allocations.filter(allocation => allocation.deficit > 0);
    
    if (deficitDomains.length === 0) {
      return null; // No domains have deficits
    }

    // Sort by priority (deficit * 100 + weight) and select highest
    const sortedDeficitDomains = deficitDomains.sort((a, b) => b.priority - a.priority);
    return sortedDeficitDomains[0].domainId;
  }
}

/**
 * Phase-Balanced Selection Strategy
 * 
 * Adjusts selection based on assessment phase (early/mid/final)
 */
class PhaseBalancedStrategy implements DomainSelectionStrategy {
  name = 'phase-balanced';
  description = 'Phase-aware balanced selection';

  isApplicable(context: DomainSelectionContext): boolean {
    // Apply during mid and final phases when balance is critical
    return context.assessmentPhase === 'mid' || context.assessmentPhase === 'final';
  }

  selectDomain(allocations: DomainAllocation[], context: DomainSelectionContext): number | null {
    const { assessmentPhase, questionsRemaining } = context;

    if (assessmentPhase === 'mid') {
      // Mid phase: balance deficits while maintaining some flexibility
      const deficitDomains = allocations.filter(a => a.deficit > 0);
      if (deficitDomains.length > 0) {
        // Select domain with moderate deficit (not necessarily highest)
        const moderateDeficitDomains = deficitDomains.filter(a => a.deficit <= 3);
        if (moderateDeficitDomains.length > 0) {
          return moderateDeficitDomains.sort((a, b) => b.priority - a.priority)[0].domainId;
        }
        return deficitDomains.sort((a, b) => b.priority - a.priority)[0].domainId;
      }
    }

    if (assessmentPhase === 'final') {
      // Final phase: aggressive deficit reduction
      const criticalDeficits = allocations.filter(a => a.deficit >= questionsRemaining / 2);
      if (criticalDeficits.length > 0) {
        return criticalDeficits.sort((a, b) => b.deficit - a.deficit)[0].domainId;
      }
    }

    return null;
  }
}

/**
 * Weight-Based Selection Strategy
 * 
 * Falls back to selecting domains with highest weights when no deficits exist
 */
class WeightBasedStrategy implements DomainSelectionStrategy {
  name = 'weight-based';
  description = 'Select highest weight domain when balanced';

  isApplicable(context: DomainSelectionContext): boolean {
    // Apply when no other strategy works (all domains balanced)
    return true;
  }

  selectDomain(allocations: DomainAllocation[], context: DomainSelectionContext): number | null {
    // Select domain with highest question weight
    const sortedByWeight = allocations.sort((a, b) => b.questionWeight - a.questionWeight);
    return sortedByWeight[0].domainId;
  }
}

/**
 * Final Phase Strategy
 * 
 * Special handling for the last few questions of assessment
 */
class FinalPhaseStrategy implements DomainSelectionStrategy {
  name = 'final-phase';
  description = 'Emergency deficit reduction for final questions';

  isApplicable(context: DomainSelectionContext): boolean {
    return context.assessmentPhase === 'final' && context.questionsRemaining <= 3;
  }

  selectDomain(allocations: DomainAllocation[], context: DomainSelectionContext): number | null {
    // In final phase with few questions left, aggressively target any deficit
    const anyDeficit = allocations.filter(a => a.deficit > 0);
    
    if (anyDeficit.length > 0) {
      // Select domain with highest deficit urgency
      return anyDeficit.sort((a, b) => b.deficit - a.deficit)[0].domainId;
    }

    return null;
  }
} 