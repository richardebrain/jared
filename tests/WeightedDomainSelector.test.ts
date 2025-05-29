import { describe, it, expect, beforeEach } from '@jest/globals';
import { WeightedDomainSelector } from '../server/algorithms/assessment/WeightedDomainSelector';
import type { DomainSelectionContext } from '../server/algorithms/assessment/WeightedDomainSelector';

// Define the DomainAllocation type based on usage
interface DomainAllocation {
  domainId: number;
  targetQuestions: number;
  currentQuestions: number;
  deficit: number;
  weight: number;
  priority: number;
}

describe('WeightedDomainSelector', () => {
  let selector: WeightedDomainSelector;

  beforeEach(() => {
    selector = new WeightedDomainSelector();
  });

  describe('calculateAssessmentPhase', () => {
    it('should identify early phase (≤50%)', () => {
      expect(selector.calculateAssessmentPhase(1, 40)).toBe('early');
      expect(selector.calculateAssessmentPhase(10, 40)).toBe('early');
      expect(selector.calculateAssessmentPhase(20, 40)).toBe('early');
    });

    it('should identify mid phase (50-87.5%)', () => {
      expect(selector.calculateAssessmentPhase(21, 40)).toBe('mid');
      expect(selector.calculateAssessmentPhase(30, 40)).toBe('mid');
      expect(selector.calculateAssessmentPhase(35, 40)).toBe('mid');
    });

    it('should identify final phase (>87.5%)', () => {
      expect(selector.calculateAssessmentPhase(36, 40)).toBe('final');
      expect(selector.calculateAssessmentPhase(39, 40)).toBe('final');
      expect(selector.calculateAssessmentPhase(40, 40)).toBe('final');
    });

    it('should handle different total question counts', () => {
      expect(selector.calculateAssessmentPhase(5, 20)).toBe('early'); // 25%
      expect(selector.calculateAssessmentPhase(10, 20)).toBe('early'); // 50%
      expect(selector.calculateAssessmentPhase(15, 20)).toBe('mid'); // 75%
      expect(selector.calculateAssessmentPhase(18, 20)).toBe('final'); // 90%
    });
  });

  describe('createSelectionContext', () => {
    it('should create correct context for early phase', () => {
      const context = selector.createSelectionContext(5, 40);
      
      expect(context.currentSequence).toBe(5);
      expect(context.totalQuestions).toBe(40);
      expect(context.questionsRemaining).toBe(36); // 40 - 5 + 1
      expect(context.assessmentPhase).toBe('early');
    });

    it('should create correct context for mid phase', () => {
      const context = selector.createSelectionContext(25, 40);
      
      expect(context.currentSequence).toBe(25);
      expect(context.totalQuestions).toBe(40);
      expect(context.questionsRemaining).toBe(16); // 40 - 25 + 1
      expect(context.assessmentPhase).toBe('mid');
    });

    it('should create correct context for final phase', () => {
      const context = selector.createSelectionContext(38, 40);
      
      expect(context.currentSequence).toBe(38);
      expect(context.totalQuestions).toBe(40);
      expect(context.questionsRemaining).toBe(3); // 40 - 38 + 1
      expect(context.assessmentPhase).toBe('final');
    });
  });

  describe('selectDomain', () => {
    const createMockAllocations = (): DomainAllocation[] => [
      {
        domainId: 1,
        targetQuestions: 10,
        currentQuestions: 5,
        deficit: 5,
        weight: 10,
        priority: 510 // deficit * 100 + weight
      },
      {
        domainId: 2,
        targetQuestions: 8,
        currentQuestions: 8,
        deficit: 0,
        weight: 8,
        priority: 8
      },
      {
        domainId: 3,
        targetQuestions: 6,
        currentQuestions: 3,
        deficit: 3,
        weight: 6,
        priority: 306
      },
      {
        domainId: 4,
        targetQuestions: 4,
        currentQuestions: 1,
        deficit: 3,
        weight: 4,
        priority: 304
      }
    ];

    it('should select domain with highest deficit (deficit-based strategy)', () => {
      const allocations = createMockAllocations();
      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };
      const availableDomains = [1, 2, 3, 4];

      const result = selector.selectDomain(allocations, context, availableDomains);

      expect(result.selectedDomainId).toBe(1); // Highest deficit (5)
      expect(result.strategy).toBe('deficit-based');
      expect(result.priority).toBe(510);
    });

    it('should handle no available domains', () => {
      const allocations = createMockAllocations();
      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };
      const availableDomains: number[] = []; // No available domains

      const result = selector.selectDomain(allocations, context, availableDomains);

      expect(result.selectedDomainId).toBe(null);
      expect(result.strategy).toBe('none');
      expect(result.reason).toBe('No domains have available questions');
      expect(result.priority).toBe(0);
    });

    it('should filter to only available domains', () => {
      const allocations = createMockAllocations();
      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };
      const availableDomains = [3, 4]; // Only domains 3 and 4 available

      const result = selector.selectDomain(allocations, context, availableDomains);

      expect(result.selectedDomainId).toBe(3); // Higher priority than 4 (306 vs 304)
      expect(result.strategy).toBe('deficit-based');
    });

    it('should use weight-based strategy when no deficits exist', () => {
      // Create allocations with no deficits to test weight-based strategy
      const balancedAllocations: DomainAllocation[] = [
        {
          domainId: 1,
          targetQuestions: 10,
          currentQuestions: 10,
          deficit: 0,
          weight: 10,
          priority: 10
        },
        {
          domainId: 2,
          targetQuestions: 8,
          currentQuestions: 8,
          deficit: 0,
          weight: 8,
          priority: 8
        }
      ];

      const context: DomainSelectionContext = {
        currentSequence: 35,
        totalQuestions: 40,
        questionsRemaining: 6,
        assessmentPhase: 'mid'
      };
      const availableDomains = [1, 2];

      const result = selector.selectDomain(balancedAllocations, context, availableDomains);

      expect(result.selectedDomainId).toBe(1); // Domain with highest weight
      expect(result.strategy).toBe('weight-based');
      expect(result.reason).toContain('Select highest weight domain when balanced');
    });
  });

  describe('validateSelection', () => {
    const mockAllocations: DomainAllocation[] = [
      {
        domainId: 1,
        targetQuestions: 10,
        currentQuestions: 5,
        deficit: 5,
        weight: 10,
        priority: 510
      },
      {
        domainId: 2,
        targetQuestions: 8,
        currentQuestions: 8,
        deficit: 0,
        weight: 8,
        priority: 8
      }
    ];

    it('should validate selection that reduces deficit', () => {
      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };

      const result = selector.validateSelection(1, mockAllocations, context);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.impact.willMeetTarget).toBe(true);
      expect(result.impact.deficitReduction).toBe(1);
      expect(result.impact.balanceImprovement).toBe(20); // 1/5 * 100
    });

    it('should warn about selecting balanced domain in early phase', () => {
      const context: DomainSelectionContext = {
        currentSequence: 5,
        totalQuestions: 40,
        questionsRemaining: 36,
        assessmentPhase: 'early'
      };

      const result = selector.validateSelection(2, mockAllocations, context);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Selecting domain that is already at target during early phase');
      expect(result.impact.willMeetTarget).toBe(false);
      expect(result.impact.deficitReduction).toBe(0);
    });

    it('should warn about selecting balanced domain with few questions remaining', () => {
      const context: DomainSelectionContext = {
        currentSequence: 38,
        totalQuestions: 40,
        questionsRemaining: 3,
        assessmentPhase: 'final'
      };

      const result = selector.validateSelection(2, mockAllocations, context);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Selecting balanced domain with few questions remaining');
    });

    it('should invalidate selection of non-existent domain', () => {
      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };

      const result = selector.validateSelection(999, mockAllocations, context);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Selected domain not found in allocations');
      expect(result.impact.willMeetTarget).toBe(false);
      expect(result.impact.deficitReduction).toBe(0);
      expect(result.impact.balanceImprovement).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single domain selection', () => {
      const singleDomainAllocation: DomainAllocation[] = [
        {
          domainId: 1,
          targetQuestions: 40,
          currentQuestions: 20,
          deficit: 20,
          weight: 40,
          priority: 2040
        }
      ];

      const context: DomainSelectionContext = {
        currentSequence: 21,
        totalQuestions: 40,
        questionsRemaining: 20,
        assessmentPhase: 'mid'
      };
      const availableDomains = [1];

      const result = selector.selectDomain(singleDomainAllocation, context, availableDomains);

      expect(result.selectedDomainId).toBe(1);
      expect(result.strategy).toBe('deficit-based');
    });

    it('should handle assessment phase boundaries correctly', () => {
      // Test exact boundary at 50% (20/40)
      expect(selector.calculateAssessmentPhase(20, 40)).toBe('early');
      expect(selector.calculateAssessmentPhase(21, 40)).toBe('mid');
      
      // Test exact boundary at 87.5% (35/40)
      expect(selector.calculateAssessmentPhase(35, 40)).toBe('mid');
      expect(selector.calculateAssessmentPhase(36, 40)).toBe('final');
    });

    it('should handle zero deficit situations', () => {
      const balancedAllocations: DomainAllocation[] = [
        {
          domainId: 1,
          targetQuestions: 10,
          currentQuestions: 10,
          deficit: 0,
          weight: 10,
          priority: 10
        }
      ];

      const context: DomainSelectionContext = {
        currentSequence: 10,
        totalQuestions: 40,
        questionsRemaining: 31,
        assessmentPhase: 'early'
      };

      const validation = selector.validateSelection(1, balancedAllocations, context);

      expect(validation.impact.balanceImprovement).toBe(0); // No deficit to improve
    });
  });
}); 