# EP-001-08: Weighted Adaptive Question Selection Service

## Task Definition

**Epic**: EP-001 Initial Assessment System  
**Task**: EP-001-08 Weighted Adaptive Question Selection Service  
**Priority**: High  
**Dependencies**: EP-001-07 (Assessment Session Management)  
**Blocks**: EP-001-09 (Answer Processing and Evaluation)  

### Overview

Implement the core intelligent question selection algorithm that drives the adaptive assessment experience. This service manages the complex logic of selecting the most appropriate next question based on weighted domain distribution, 6-level difficulty progression, dual-level availability controls, comprehensive fallback strategies, and **automatic timer-driven progression** to ensure assessments always complete regardless of frontend connectivity.

### Scope

**In Scope:**
- Weighted domain selection algorithm with target allocation tracking
- 6-level adaptive difficulty progression (levels 1-6)
- **Backend timer management with automatic question progression**
- **Frontend synchronization recovery for out-of-sync scenarios**
- Dual-level availability checking (platform + school level)
- Question pool management with approval status validation
- **Timeout enforcement with automatic progression to next question**
- Comprehensive fallback strategy implementation
- Performance optimization for real-time question selection
- Algorithm testing and validation framework

**Out of Scope:**
- Question content creation or AI generation
- Assessment session management (handled by EP-001-07)
- Answer processing and scoring (handled by EP-001-09)
- Admin UI for question management (future task)

### Functional Requirements

#### FR-001: Weighted Domain Selection Algorithm
- **Requirement**: Implement sophisticated domain weighting system ensuring proper question distribution
- **Details**:
  - Calculate target questions per domain based on question weights
  - Track actual questions asked per domain during assessment
  - Prioritize domains under their target allocation
  - Ensure minimum coverage requirement (1 question per domain)
  - Handle edge cases when domains have insufficient questions

#### FR-002: 6-Level Adaptive Difficulty System
- **Requirement**: Implement adaptive difficulty progression with 6 distinct levels
- **Details**:
  - Start at Medium level (3) for all assessments
  - Adjust difficulty after each question based on correctness
  - Implement progression rules: +1 for correct, -1 for incorrect
  - Maintain difficulty bounds (1-6, no overflow/underflow)
  - Track difficulty progression throughout assessment

#### FR-003: Backend Timer Management and Automatic Progression
- **Requirement**: Maintain server-side timers that automatically progress assessments regardless of frontend state
- **Details**:
  - **Always Ticking Clock**: Server maintains authoritative timer for each active assessment
  - **Automatic Question Progression**: After timeout, automatically select and present next question
  - **No Late Answers**: Reject any answer submissions after question timeout has occurred
  - **Assessment Completion**: Continue automatic progression until all questions are completed via timeout
  - **Timer Persistence**: Maintain timer state across server restarts and frontend disconnections
  - **Concurrent Timer Management**: Handle multiple simultaneous assessment timers efficiently

#### FR-004: Frontend Synchronization Recovery
- **Requirement**: Provide mechanism for frontend to recover current assessment state when out of sync
- **Details**:
  - **Current Question Endpoint**: API to retrieve currently active question and remaining time
  - **Progress Synchronization**: Return current question sequence, domain coverage, difficulty level
  - **Timer Synchronization**: Provide exact remaining time for current question
  - **State Validation**: Verify frontend and backend are synchronized on same question
  - **Recovery Handling**: Handle scenarios where frontend missed question transitions

#### FR-005: Dual-Level Availability Control
- **Requirement**: Respect both platform and school-level question availability settings
- **Details**:
  - Check platform-level enabled/disabled status
  - Apply school-specific availability overrides
  - Handle missing school configurations with platform defaults
  - Validate question approval status before selection
  - Log availability issues for debugging

#### FR-006: Question Pool Management
- **Requirement**: Efficiently manage question pools with approval and availability validation
- **Details**:
  - Pre-filter questions by availability status
  - Validate question approval before selection
  - Handle incomplete question data gracefully
  - Track question usage across concurrent sessions
  - Optimize database queries for performance

#### FR-007: Comprehensive Fallback Strategy
- **Requirement**: Implement robust fallback mechanisms to ensure algorithm never fails
- **Details**:
  - Try adjacent difficulty levels (±1) within same domain
  - Fall back to any domain at current difficulty if needed
  - Expand to any available difficulty if domain exhausted
  - Log fallback usage for analysis and optimization
  - Ensure graceful degradation without assessment failure

#### FR-008: Timeout Integration with Question Selection
- **Requirement**: Seamlessly integrate timeout handling with question selection for continuous flow
- **Details**:
  - **Automatic Next Question**: When timeout occurs, immediately select next question
  - **No Frontend Dependency**: Selection continues even without frontend interaction
  - **Timeout Response Recording**: Automatically record timeout as incorrect answer
  - **Continuous Assessment Flow**: Ensure assessment never stalls due to timeouts
  - **Timer Reset**: Start new timer immediately when next question is selected

### Technical Requirements

#### TR-001: Algorithm Performance
- **Requirement**: Question selection must complete within 2 seconds under normal load
- **Implementation**:
  - Pre-cached question pools by domain and difficulty
  - Optimized database indexing for availability queries
  - Efficient domain weight calculations
  - Minimal algorithm complexity (O(n) or better)

#### TR-002: Data Consistency
- **Requirement**: Ensure consistent question selection across concurrent sessions
- **Implementation**:
  - Thread-safe question pool management
  - Atomic domain coverage tracking
  - Consistent availability checking
  - Race condition prevention

#### TR-003: Configuration Management
- **Requirement**: Support dynamic configuration loading and caching
- **Implementation**:
  - School-level configuration overrides
  - Platform-wide default settings
  - Runtime configuration updates
  - Configuration validation

#### TR-004: Logging and Monitoring
- **Requirement**: Comprehensive logging for algorithm analysis and debugging
- **Implementation**:
  - Selection decision logging with reasoning
  - Fallback usage tracking
  - Performance metrics collection
  - Error condition monitoring

#### TR-005: Testing Framework
- **Requirement**: Extensive testing coverage for algorithm reliability
- **Implementation**:
  - Unit tests for all algorithm components
  - Integration tests with real question pools
  - Edge case and stress testing
  - Performance benchmarking

### Algorithm Specifications

#### Weighted Domain Selection Algorithm

```typescript
interface DomainSelection {
  // 1. Calculate target allocation
  calculateTargetAllocation(domains: Domain[], totalQuestions: number): Map<number, number>
  
  // 2. Track current progress
  getCurrentCoverage(assessmentId: number): Map<number, number>
  
  // 3. Identify priority domains
  getPriorityDomains(targets: Map<number, number>, current: Map<number, number>): number[]
  
  // 4. Select optimal domain
  selectDomain(priorityDomains: number[], currentDifficulty: number): number | null
}
```

**Algorithm Steps:**
1. **Target Calculation**: `targetQuestions = Math.ceil((domainWeight / totalWeight) * totalQuestions)`
2. **Progress Tracking**: Query current domain coverage from assessmentResponses
3. **Priority Identification**: Domains where `current < target` get priority
4. **Domain Selection**: Select from priority domains with available questions at current difficulty

#### 6-Level Difficulty Progression

```typescript
interface DifficultyProgression {
  // Difficulty adjustment rules
  adjustDifficulty(currentLevel: number, wasCorrect: boolean): number
  
  // Boundary enforcement
  enforceBounds(level: number): number // Ensure 1 <= level <= 6
  
  // Progression tracking
  trackProgression(assessmentId: number, newLevel: number): void
}
```

**Progression Rules:**
- **Correct Answer**: `newLevel = Math.min(currentLevel + 1, 6)`
- **Incorrect Answer**: `newLevel = Math.max(currentLevel - 1, 1)`
- **Starting Level**: Always level 3 (Medium)

#### Question Selection Fallback Strategy

```typescript
interface FallbackStrategy {
  // Primary selection attempt
  selectPrimary(domainId: number, difficulty: number): Question | null
  
  // Adjacent difficulty fallback
  selectAdjacent(domainId: number, difficulty: number): Question | null
  
  // Any domain fallback
  selectAnyDomain(difficulty: number): Question | null
  
  // Final fallback (any available)
  selectAnyAvailable(): Question | null
}
```

**Fallback Sequence:**
1. **Primary**: Exact domain + difficulty match
2. **Adjacent**: Same domain, difficulty ±1
3. **Cross-Domain**: Different domain, same difficulty
4. **Expanded**: Any domain, any difficulty
5. **Emergency**: Log error, but provide any available question

#### Backend Timer Management System

```typescript
interface TimerManagementService {
  /**
   * Start assessment timer for new session
   * @param assessmentId - Assessment session ID
   * @param timePerQuestion - Configured time limit per question
   * @returns Timer initialization result
   */
  startAssessmentTimer(assessmentId: number, timePerQuestion: number): Promise<TimerStart>;

  /**
   * Get current timer status for assessment
   * @param assessmentId - Assessment session ID
   * @returns Current timer state and remaining time
   */
  getCurrentTimerStatus(assessmentId: number): Promise<TimerStatus>;

  /**
   * Handle automatic question progression on timeout
   * @param assessmentId - Assessment session that timed out
   * @returns Next question selected automatically
   */
  handleAutomaticProgression(assessmentId: number): Promise<AutoProgressionResult>;

  /**
   * Validate if answer submission is within time limit
   * @param assessmentId - Assessment session ID
   * @param submissionTime - When answer was submitted
   * @returns Whether submission is valid (not late)
   */
  validateSubmissionTiming(assessmentId: number, submissionTime: Date): Promise<boolean>;
}

interface TimerStatus {
  assessmentId: number;
  currentQuestionId: string;
  questionStartTime: Date;
  timePerQuestion: number;
  remainingTime: number; // milliseconds remaining
  isActive: boolean;
  nextAutoProgressionTime: Date;
}
```

#### Frontend Synchronization Recovery

```typescript
interface SynchronizationService {
  /**
   * Get current assessment state for frontend sync recovery
   * @param assessmentId - Assessment session ID
   * @returns Complete current state including active question and timing
   */
  getCurrentAssessmentState(assessmentId: number): Promise<AssessmentSyncState>;

  /**
   * Validate frontend is synchronized with backend state
   * @param assessmentId - Assessment session ID
   * @param frontendQuestionId - Question ID frontend thinks is current
   * @returns Synchronization validation result
   */
  validateFrontendSync(
    assessmentId: number, 
    frontendQuestionId: string
  ): Promise<SyncValidationResult>;

  /**
   * Handle frontend reconnection and state recovery
   * @param assessmentId - Assessment session ID
   * @returns Recovery information for frontend to catch up
   */
  handleFrontendReconnection(assessmentId: number): Promise<ReconnectionRecovery>;
}

interface AssessmentSyncState {
  assessmentId: number;
  currentQuestion: AssessmentQuestion;
  questionSequence: number;
  remainingTime: number;
  domainCoverage: Map<number, number>;
  currentDifficulty: number;
  questionsCompleted: number;
  totalQuestions: number;
  isComplete: boolean;
  serverTimestamp: Date;
}
```

#### Automatic Progression Algorithm

```typescript
interface AutoProgressionManager {
  /**
   * Execute automatic progression when question times out
   * @param assessmentId - Assessment session
   * @returns Result of automatic progression
   */
  executeAutoProgression(assessmentId: number): Promise<ProgressionResult>;

  /**
   * Schedule next automatic progression
   * @param assessmentId - Assessment session
   * @param nextQuestionId - Question that was just presented
   * @param timePerQuestion - Time limit for the question
   * @returns Scheduled progression handle
   */
  scheduleNextProgression(
    assessmentId: number,
    nextQuestionId: string,
    timePerQuestion: number
  ): Promise<ScheduledProgression>;

  /**
   * Cancel scheduled progression (when answer received in time)
   * @param assessmentId - Assessment session
   * @returns Cancellation result
   */
  cancelScheduledProgression(assessmentId: number): Promise<boolean>;
}

interface ProgressionResult {
  wasTimeout: boolean;
  timeoutQuestionId: string;
  nextQuestion: AssessmentQuestion | null; // null if assessment complete
  difficultyAdjustment: number;
  domainCoverageUpdate: Map<number, number>;
  assessmentComplete: boolean;
}
```

### Database Schema Requirements

#### New Indexes Required
```sql
-- Optimize question selection queries
CREATE INDEX idx_questions_domain_difficulty ON assessmentQuestions(domainId, difficulty);
CREATE INDEX idx_questions_availability ON assessmentQuestions(enabled, approved);
CREATE INDEX idx_question_availability_school ON questionAvailability(schoolId, questionId, enabled);

-- Optimize domain coverage tracking
CREATE INDEX idx_responses_assessment_domain ON assessmentResponses(assessmentId, domainId);
CREATE INDEX idx_responses_sequence ON assessmentResponses(assessmentId, questionSequence);
```

#### Configuration Schema
```sql
-- Assessment configuration with question selection settings
ALTER TABLE assessmentConfig ADD COLUMN IF NOT EXISTS questionSelectionStrategy VARCHAR(50) DEFAULT 'weighted_adaptive';
ALTER TABLE assessmentConfig ADD COLUMN IF NOT EXISTS minDomainCoverage INTEGER DEFAULT 1;
ALTER TABLE assessmentConfig ADD COLUMN IF NOT EXISTS maxDifficultyJump INTEGER DEFAULT 1;
```

### API Specifications

#### Question Selection Service Interface with Timer Integration

```typescript
interface QuestionSelectionService {
  /**
   * Select next question for assessment session with timer management
   * @param assessmentId - Active assessment session ID
   * @param currentDifficulty - Current difficulty level (1-6)
   * @param domainCoverage - Current questions per domain
   * @param isAutoProgression - Whether this is automatic progression due to timeout
   * @returns Selected question with timer initialization
   */
  selectNextQuestion(
    assessmentId: number,
    currentDifficulty: number,
    domainCoverage: Map<number, number>,
    isAutoProgression?: boolean
  ): Promise<SelectedQuestionWithTimer>;

  /**
   * Get current question for synchronization recovery
   * @param assessmentId - Assessment session ID
   * @returns Current question state with timing information
   */
  getCurrentQuestion(assessmentId: number): Promise<CurrentQuestionState>;

  /**
   * Handle automatic progression to next question on timeout
   * @param assessmentId - Assessment session that timed out
   * @returns Automatic progression result
   */
  handleTimeout(assessmentId: number): Promise<TimeoutHandlingResult>;

  /**
   * Get available question pool statistics
   * @param schoolId - School context for availability
   * @returns Pool statistics by domain and difficulty
   */
  getQuestionPoolStats(schoolId?: number): Promise<QuestionPoolStats>;

  /**
   * Validate algorithm configuration
   * @param config - Assessment configuration
   * @returns Validation results with recommendations
   */
  validateConfiguration(config: AssessmentConfig): ValidationResult;
}

interface SelectedQuestionWithTimer {
  question: AssessmentQuestion;
  selectionReason: string;
  fallbackLevel: number; // 0 = primary, 1+ = fallback depth
  domainAllocation: {
    target: number;
    current: number;
    priority: number;
  };
  timerInfo: {
    questionStartTime: Date;
    timePerQuestion: number;
    autoProgressionScheduled: Date;
    timerId: string;
  };
}

interface CurrentQuestionState {
  question: AssessmentQuestion;
  questionSequence: number;
  startTime: Date;
  remainingTime: number;
  timePerQuestion: number;
  domainCoverage: Map<number, number>;
  currentDifficulty: number;
  isTimedOut: boolean;
  serverTimestamp: Date;
}
```

### Implementation Files

#### Core Service Files with Timer Management
- `server/services/QuestionSelectionService.ts` - Main selection algorithm with timer integration
- `server/services/DomainWeightingService.ts` - Domain allocation logic  
- `server/services/DifficultyProgressionService.ts` - 6-level difficulty management
- `server/services/QuestionPoolService.ts` - Availability and pool management
- **`server/services/AssessmentTimerService.ts` - Backend timer management and automatic progression**
- **`server/services/SynchronizationService.ts` - Frontend sync recovery and state management**

#### Algorithm Components
- `server/algorithms/WeightedDomainSelector.ts` - Domain selection algorithm
- `server/algorithms/AdaptiveDifficultyManager.ts` - Difficulty progression rules
- `server/algorithms/FallbackStrategy.ts` - Comprehensive fallback logic
- `server/algorithms/AvailabilityChecker.ts` - Dual-level availability validation
- **`server/algorithms/AutoProgressionManager.ts` - Automatic timeout progression logic**
- **`server/algorithms/TimerManager.ts` - Server-side timer implementation**

#### Configuration and Utilities
- `server/config/QuestionSelectionConfig.ts` - Algorithm configuration
- `server/utils/AlgorithmLogger.ts` - Selection decision logging
- `server/utils/PerformanceMonitor.ts` - Algorithm performance tracking
- **`server/utils/TimerUtils.ts` - Timer calculation and validation utilities**

### Testing Requirements

#### Unit Test Coverage
- **Domain Weighting Algorithm**: 95% coverage
  - Target allocation calculations
  - Priority domain identification
  - Edge cases (empty domains, over-allocation)
- **Difficulty Progression**: 100% coverage
  - Boundary enforcement
  - Progression rules
  - Invalid input handling
- **Fallback Strategy**: 90% coverage
  - All fallback levels
  - Emergency scenarios
  - Logging verification
- **Timer Management**: 100% coverage
  - Automatic progression logic
  - Timeout handling
  - Timer synchronization
  - Late submission rejection
- **Synchronization Recovery**: 95% coverage
  - Frontend sync validation
  - State recovery scenarios
  - Reconnection handling

#### Integration Test Scenarios
- **Full Assessment Flow**: Complete 40-question assessment with realistic question pool
- **Timeout Scenarios**: Multiple timeouts with automatic progression
- **Frontend Disconnection**: Test sync recovery after frontend reconnection
- **Concurrent Sessions**: Multiple users with overlapping question selections and timers
- **Configuration Changes**: Runtime configuration updates
- **Availability Changes**: School-level availability modifications

#### Performance Test Requirements
- **Selection Speed**: < 2 seconds for 99% of requests
- **Timer Management**: Support 100+ concurrent assessment timers
- **Automatic Progression**: < 1 second response time for timeout handling
- **Sync Recovery**: < 500ms response time for current state requests
- **Memory Usage**: < 100MB for question pool caching + timer management
- **Database Load**: < 5 queries per selection on average
- **Concurrent Load**: 50 simultaneous question selections with active timers

### Success Criteria

#### Functional Success
- ✅ Algorithm selects appropriate questions based on domain weights
- ✅ Difficulty progression follows 6-level adaptive rules
- ✅ Fallback strategy prevents selection failures
- ✅ Domain coverage meets target allocation (±5% variance)
- ✅ Availability controls respected at both platform and school levels

#### Performance Success
- ✅ Question selection completes within 2 seconds
- ✅ Algorithm handles 50+ concurrent selections
- ✅ Database query optimization reduces load
- ✅ Memory usage remains stable during extended operation

#### Quality Success
- ✅ 95%+ unit test coverage achieved
- ✅ Integration tests pass with real question pools
- ✅ Zero selection failures in stress testing
- ✅ Comprehensive logging enables debugging and analysis

### Risk Mitigation

#### Technical Risks
1. **Performance Degradation**
   - **Risk**: Complex algorithm + timer management impacts response time
   - **Mitigation**: Pre-cached question pools, optimized indexing, performance monitoring, efficient timer implementation

2. **Algorithm Failures**
   - **Risk**: Edge cases cause selection failures
   - **Mitigation**: Comprehensive fallback strategy, extensive testing, graceful degradation

3. **Timer Synchronization Issues**
   - **Risk**: Timer drift or inconsistency between frontend and backend
   - **Mitigation**: Server-authoritative timing, clock synchronization validation, recovery mechanisms

4. **Data Consistency Issues**
   - **Risk**: Concurrent access causes inconsistent selections or timer conflicts
   - **Mitigation**: Thread-safe implementations, atomic operations, proper locking

#### Business Risks
1. **Poor Question Distribution**
   - **Risk**: Algorithm doesn't follow domain weights properly
   - **Mitigation**: Extensive testing, monitoring, manual validation tools

2. **Difficulty Progression Issues**
   - **Risk**: Too aggressive or conservative difficulty changes
   - **Mitigation**: Configurable progression rules, A/B testing capability

3. **Assessment Interruption**
   - **Risk**: Users lose progress due to disconnection or timing issues
   - **Mitigation**: Robust state recovery, automatic progression, comprehensive logging

### Dependencies and Integration

#### Internal Dependencies
- **EP-001-07**: Assessment Session Management (session state, progress tracking)
- **Database Schema**: Enhanced indexes and configuration tables
- **Authentication**: User session and role validation

#### External Integration Points
- **Question Pool**: Validated assessment questions with approval status
- **School Configuration**: School-specific availability and timing settings
- **Logging System**: Algorithm decision logging and performance metrics

### Future Enhancements

#### Phase 2 Improvements
- **Machine Learning Integration**: Adaptive algorithm tuning based on user performance
- **Advanced Analytics**: Question effectiveness analysis and optimization
- **Dynamic Weighting**: Real-time domain weight adjustments based on user needs
- **Personalization**: Individual difficulty progression preferences

#### Scalability Considerations
- **Microservice Architecture**: Extract as independent question selection service
- **Caching Layer**: Redis-based question pool caching for high-scale deployments
- **Load Balancing**: Horizontal scaling for question selection processing
- **Database Sharding**: Support for large-scale question pools

This comprehensive task definition provides the foundation for implementing the sophisticated question selection algorithm that will drive the adaptive assessment experience while ensuring reliability, performance, and maintainability. 