import express, { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { db } from '../db';
import { 
  assessments, 
  assessmentResponses, 
  assessmentConfig, 
  assessmentDomains,
  assessmentQuestions,
  questionAvailability,
  users,
  schools,
  assessmentResults,
  learningPaths,
  assessmentRetakePermissions
} from '@shared/schema';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import type { 
  Assessment, 
  InsertAssessment, 
  AssessmentConfig, 
  AssessmentDomain,
  User 
} from '@shared/schema';
import { QuestionSelectionService } from '../services/assessment/QuestionSelectionService';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const router = Router();

/**
 * Assessment Session Management API
 * 
 * Handles creation, validation, and tracking of assessment sessions for educators.
 * Ensures one-time assessment integrity and comprehensive data persistence.
 */

const questionSelectionService = new QuestionSelectionService();

// Middleware to require eligible educator roles (teachers, school directors, and owners)
const requireEligibleEducatorRole = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = req.session.userId as number;
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user[0];
    
    // Allow teachers, school administrators, and platform owners to take initial assessments
    // This enables testing and provides assessment access for educators in leadership roles
    const isEligible = !userData.isAdmin || userData.isSchoolAdmin || userData.isOwner;
    
    if (!isEligible) {
      return res.status(403).json({ 
        message: "Assessment access restricted", 
        details: "Initial assessments are available for teachers, school directors, and platform owners. System administrators should use administrative tools."
      });
    }

    // Store user data for use in subsequent middleware/routes
    req.user = userData;
    next();
  } catch (error) {
    console.error('Error in educator role validation:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to load assessment configuration
async function loadAssessmentConfig(schoolId?: number | null): Promise<AssessmentConfig> {
  try {
    // First try to get school-specific config
    if (schoolId) {
      const schoolConfig = await db.select()
        .from(assessmentConfig)
        .where(eq(assessmentConfig.schoolId, schoolId))
        .limit(1);

      if (schoolConfig && schoolConfig.length > 0) {
        return schoolConfig[0];
      }
    }

    // Fall back to platform-wide config (schoolId = null)
    const platformConfig = await db.select()
      .from(assessmentConfig)
      .where(isNull(assessmentConfig.schoolId))
      .limit(1);

    if (platformConfig && platformConfig.length > 0) {
      return platformConfig[0];
    }

    // If no config exists, return default values
    return {
      id: 0,
      schoolId: null,
      questionCount: 40,
      timePerQuestion: 60,
      startingDifficulty: 3,
      minDomainCoverage: 1,
      updatedBy: null,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error loading assessment configuration:', error);
    // Return default config on error
    return {
      id: 0,
      schoolId: null,
      questionCount: 40,
      timePerQuestion: 60,
      startingDifficulty: 3,
      minDomainCoverage: 1,
      updatedBy: null,
      updatedAt: new Date()
    };
  }
}

// Helper function to check assessment retake permissions
async function checkRetakePermissions(userId: number): Promise<{ 
  allowed: boolean; 
  existingAssessment?: Assessment;
  needsPermission?: boolean;
  hasValidPermission?: boolean;
}> {
  try {
    const existingAssessments = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial')
      ))
      .orderBy(desc(assessments.createdAt))
      .limit(1);

    // If no existing assessment, allow first attempt
    if (!existingAssessments || existingAssessments.length === 0) {
      return { allowed: true };
    }

    // Check for valid retake permission
    const validPermission = await db.select()
      .from(assessmentRetakePermissions)
      .where(and(
        eq(assessmentRetakePermissions.userId, userId),
        eq(assessmentRetakePermissions.status, 'approved'),
        eq(assessmentRetakePermissions.used, false)
      ))
      .orderBy(desc(assessmentRetakePermissions.requestedAt))
      .limit(1);

    if (validPermission && validPermission.length > 0) {
      const permission = validPermission[0];
      // Check if permission has expired
      if (permission.expiresAt && new Date() > new Date(permission.expiresAt)) {
        return {
          allowed: false,
          existingAssessment: existingAssessments[0],
          needsPermission: true,
          hasValidPermission: false
        };
      }
      return { 
        allowed: true,
        hasValidPermission: true
      };
    }

    return {
      allowed: false,
      existingAssessment: existingAssessments[0],
      needsPermission: true,
      hasValidPermission: false
    };
  } catch (error) {
    console.error('Error checking retake permissions:', error);
    throw error;
  }
}

/**
 * POST /api/assessment/session/start
 * 
 * Starts a new assessment session for eligible educators (teachers, school directors, owners).
 * Validates one-time rule and loads configuration.
 */
router.post('/start', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const user = req.user as User;

    console.log(`Assessment session start requested by user ${userId}`);

    // Check assessment retake permissions
    const retakeCheck = await checkRetakePermissions(userId);
    if (!retakeCheck.allowed) {
      console.log(`Assessment retake not permitted for user ${userId}`);
      
      if (retakeCheck.needsPermission) {
        return res.status(403).json({
          message: "Assessment retake requires admin approval",
          details: "You have already completed your initial assessment. To retake the assessment, please request permission from your school administrator.",
          existingAssessment: {
            id: retakeCheck.existingAssessment?.id,
            completed: retakeCheck.existingAssessment?.completed,
            completedAt: retakeCheck.existingAssessment?.completedAt,
            createdAt: retakeCheck.existingAssessment?.createdAt
          },
          requiresPermission: true
        });
      }
      
      return res.status(409).json({
        message: "Assessment already completed",
        details: "You have already completed your initial assessment.",
        existingAssessment: {
          id: retakeCheck.existingAssessment?.id,
          completed: retakeCheck.existingAssessment?.completed,
          completedAt: retakeCheck.existingAssessment?.completedAt,
          createdAt: retakeCheck.existingAssessment?.createdAt
        }
      });
    }

    // If using a retake permission, mark it as used
    if (retakeCheck.hasValidPermission) {
      await db.update(assessmentRetakePermissions)
        .set({ 
          used: true, 
          usedAt: new Date() 
        })
        .where(and(
          eq(assessmentRetakePermissions.userId, userId),
          eq(assessmentRetakePermissions.status, 'approved'),
          eq(assessmentRetakePermissions.used, false)
        ));
      console.log(`Marked retake permission as used for user ${userId}`);
    }

    // Load assessment configuration
    const config = await loadAssessmentConfig(user.schoolId);
    console.log(`Loaded assessment config for user ${userId}:`, {
      questionCount: config.questionCount,
      timePerQuestion: config.timePerQuestion,
      startingDifficulty: config.startingDifficulty
    });

    // Load assessment domains for domain weighting
    const domains = await db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true))
      .orderBy(asc(assessmentDomains.displayOrder));

    if (!domains || domains.length === 0) {
      console.error('No active assessment domains found');
      return res.status(500).json({
        message: "Assessment configuration error",
        details: "No active assessment domains available. Please contact support."
      });
    }

    // Create new assessment session
    const newAssessment: InsertAssessment = {
      userId: userId,
      type: 'initial',
      currentDifficulty: config.startingDifficulty || 3,
      difficultyProgression: [config.startingDifficulty || 3],
      domainCoverage: {},
      completed: false,
      overallScore: null,
      results: {},
      domainScores: {},
      strengthAreas: [],
      growthAreas: [],
      incorrectAnswers: {},
      recommendedModules: [],
      personalizedLearningPath: [],
      assessmentType: 'INITIAL_ADAPTIVE'
    };

    const insertedAssessment = await db.insert(assessments)
      .values(newAssessment)
      .returning();

    if (!insertedAssessment || insertedAssessment.length === 0) {
      throw new Error('Failed to create assessment session');
    }

    const assessment = insertedAssessment[0];
    console.log(`Assessment session ${assessment.id} created for user ${userId}`);

    // Return session configuration and metadata
    res.status(201).json({
      success: true,
      message: "Assessment session started successfully",
      session: {
        assessmentId: assessment.id,
        userId: userId,
        type: assessment.type,
        startedAt: assessment.createdAt,
        currentDifficulty: assessment.currentDifficulty,
        config: {
          questionCount: config.questionCount || 40,
          timePerQuestion: config.timePerQuestion || 60,
          startingDifficulty: config.startingDifficulty || 3,
          minDomainCoverage: config.minDomainCoverage || 1
        },
        domains: domains.map(domain => ({
          id: domain.id,
          name: domain.name,
          description: domain.description,
          questionWeight: domain.questionWeight,
          displayOrder: domain.displayOrder
        })),
        progress: {
          questionsAnswered: 0,
          totalQuestions: config.questionCount || 40,
          currentSequence: 1,
          domainCoverage: {}
        }
      }
    });

  } catch (error) {
    console.error('Error starting assessment session:', error);
    res.status(500).json({
      message: "Failed to start assessment session",
      details: "An internal error occurred while creating your assessment session. Please try again."
    });
  }
});

/**
 * GET /api/assessment/session/status
 * 
 * Returns current session state and progress.
 * Validates session ownership.
 */
router.get('/status', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;

    // Find the user's active assessment session
    const activeAssessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, false)
      ))
      .orderBy(desc(assessments.createdAt))
      .limit(1);

    if (!activeAssessment || activeAssessment.length === 0) {
      return res.status(404).json({
        message: "No active assessment session found",
        details: "You don't have an active assessment session. Please start a new assessment."
      });
    }

    const assessment = activeAssessment[0];

    // Get responses count and current sequence
    const responses = await db.select({
      count: sql<number>`count(*)`,
      maxSequence: sql<number>`max(${assessmentResponses.questionSequence})`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessment.id));

    const responsesData = responses[0];
    const questionsAnswered = Number(responsesData.count) || 0;
    const currentSequence = Number(responsesData.maxSequence) + 1 || 1;

    // Load configuration for total questions
    const user = req.user as User;
    const config = await loadAssessmentConfig(user.schoolId);

    // Check if assessment is complete
    const isComplete = questionsAnswered >= (config.questionCount || 40);

    // Get current question if assessment is not complete
    let currentQuestion: any = null;
    if (!isComplete) {
      try {
        // Get current difficulty and domain coverage
        const currentDifficulty = assessment.currentDifficulty || config.startingDifficulty || 3;
        const domainCoverage = new Map(Object.entries(assessment.domainCoverage || {}).map(([k, v]) => [parseInt(k), v as number]));
        
        console.log(`Fetching question for assessment ${assessment.id}, difficulty: ${currentDifficulty}, domain coverage:`, domainCoverage);
        
        // Use the proper QuestionSelectionService to get next question
        // This service automatically excludes already-used questions and handles fallbacks
        const selectedQuestionResult = await questionSelectionService.selectNextQuestion(
          assessment.id,
          currentDifficulty,
          domainCoverage,
          false // not auto progression
        );

        const selectedQuestion = selectedQuestionResult.question;
        
        console.log(`Selected question using QuestionSelectionService: ${selectedQuestion.id}, fallback level: ${selectedQuestionResult.fallbackLevel}`);
        
        // Get domain name for the question
        let domainName = 'Unknown Domain';
        const domainIdAsNumber = typeof selectedQuestion.domainId === 'string' 
          ? parseInt(selectedQuestion.domainId) 
          : selectedQuestion.domainId;
        
        if (domainIdAsNumber && !isNaN(domainIdAsNumber)) {
          try {
            const domain = await db.select()
              .from(assessmentDomains)
              .where(eq(assessmentDomains.id, domainIdAsNumber))
              .limit(1);
            
            domainName = domain.length > 0 ? domain[0].name : 'Unknown Domain';
          } catch (domainError) {
            console.error('Error fetching domain:', domainError);
            domainName = `Domain ${selectedQuestion.domainId}`;
          }
        } else {
          console.log(`Domain ID '${selectedQuestion.domainId}' is not a valid number, using as-is`);
          domainName = `Domain ${selectedQuestion.domainId}`;
        }
        
        currentQuestion = {
          id: selectedQuestion.id,
          text: selectedQuestion.text,
          options: JSON.parse(selectedQuestion.options),
          domain: selectedQuestion.domainId,
          domainName: domainName,
          difficulty: parseInt(selectedQuestion.difficulty),
          sequence: currentSequence,
          explanation: selectedQuestion.explanation,
          tags: selectedQuestion.tags ? JSON.parse(selectedQuestion.tags) : [],
          selectionReason: selectedQuestionResult.selectionReason,
          fallbackLevel: selectedQuestionResult.fallbackLevel
        };
        
        console.log(`Successfully created current question object with proper exclusion logic`);
        
      } catch (questionError) {
        console.error('Error loading current question with QuestionSelectionService:', questionError);
        
        // Check if it's a "question pool exhausted" error
        if (questionError.message && questionError.message.includes('question pool exhausted')) {
          // Don't mark assessment as complete - instead return a specific error for frontend handling
          console.log(`Assessment ${assessment.id} has exhausted question pool after ${questionsAnswered} questions`);
          
          return res.status(422).json({
            success: false,
            error: "question_pool_exhausted",
            message: "No more unique questions available",
            details: {
              questionsAnswered: questionsAnswered,
              reason: "You have answered all available unique questions in the question pool. The assessment cannot continue as there are no more questions that haven't been asked yet.",
              totalQuestionsInPool: "Limited question pool"
            }
          });
        }
        
        // For other errors, return error response
        throw questionError;
      }
    }

    res.status(200).json({
      success: true,
      session: {
        assessmentId: assessment.id,
        userId: userId,
        type: assessment.type,
        startedAt: assessment.createdAt,
        currentDifficulty: assessment.currentDifficulty,
        difficultyProgression: assessment.difficultyProgression,
        domainCoverage: assessment.domainCoverage,
        progress: {
          questionsAnswered: questionsAnswered,
          totalQuestions: config.questionCount || 40,
          currentSequence: currentSequence,
          percentComplete: Math.round((questionsAnswered / (config.questionCount || 40)) * 100)
        },
        config: {
          questionCount: config.questionCount || 40,
          timePerQuestion: config.timePerQuestion || 60,
          startingDifficulty: config.startingDifficulty || 3
        },
        currentQuestion: currentQuestion
      }
    });

  } catch (error) {
    console.error('Error retrieving assessment session status:', error);
    res.status(500).json({
      message: "Failed to retrieve session status",
      details: "An error occurred while checking your assessment progress."
    });
  }
});

/**
 * POST /api/assessment/session/answer
 * 
 * Processes answer submission and returns next question or completion status.
 * Validates session integrity and question sequence.
 */
router.post('/answer', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { assessmentId, questionId, selectedAnswer, responseTime, timedOut = false } = req.body;

    // Validate required fields
    if (!assessmentId || !questionId || (selectedAnswer === undefined && !timedOut)) {
      return res.status(400).json({
        message: "Invalid request data",
        details: "Assessment ID, question ID, and selected answer are required (unless timed out)."
      });
    }

    // Verify session ownership and status
    const assessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.id, assessmentId),
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, false)
      ))
      .limit(1);

    if (!assessment || assessment.length === 0) {
      return res.status(404).json({
        message: "Invalid assessment session",
        details: "Assessment session not found or already completed."
      });
    }

    // Get question details for validation and scoring
    const question = await db.select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.id, questionId))
      .limit(1);

    if (!question || question.length === 0) {
      return res.status(404).json({
        message: "Question not found",
        details: "The specified question could not be found."
      });
    }

    const questionData = question[0];
    
    // Determine current question sequence
    const existingResponses = await db.select({
      count: sql<number>`count(*)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

    const currentSequence = Number(existingResponses[0].count) + 1;

    // Calculate points based on correctness and difficulty
    const isCorrect = !timedOut && selectedAnswer === questionData.correctAnswer;
    let pointsEarned = 0;
    
    if (isCorrect) {
      // Points system: 5, 8, 10, 13, 15, 20 for difficulty levels 1-6
      const pointsMap = { '1': 5, '2': 8, '3': 10, '4': 13, '5': 15, '6': 20 };
      pointsEarned = pointsMap[questionData.difficulty as keyof typeof pointsMap] || 10;
    }

    // Store the response
    await db.insert(assessmentResponses).values({
      assessmentId: assessmentId,
      questionId: questionId,
      userId: userId,
      questionSequence: currentSequence,
      selectedAnswer: timedOut ? null : selectedAnswer,
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      timeSpent: responseTime || null,
      timedOut: timedOut,
      difficulty: questionData.difficulty,
      domainId: questionData.domainId
    });

    console.log(`Response recorded for assessment ${assessmentId}, question ${currentSequence}: ${isCorrect ? 'correct' : 'incorrect'}`);

    // CRITICAL: Update assessment state after each answer
    // This ensures the question selection algorithm has current state for next question
    const assessmentData = assessment[0];
    
    // Update difficulty based on correctness (using EP-001-08 difficulty progression)
    const currentDifficulty = assessmentData.currentDifficulty || 3;
    let newDifficulty = currentDifficulty;
    
    if (isCorrect && !timedOut) {
      // Increase difficulty for correct answers (max 6)
      newDifficulty = Math.min(6, currentDifficulty + 1);
    } else {
      // Decrease difficulty for incorrect or timed out answers (min 1)
      newDifficulty = Math.max(1, currentDifficulty - 1);
    }
    
    // Update difficulty progression array
    const difficultyProgression = [...(assessmentData.difficultyProgression || [currentDifficulty]), newDifficulty];
    
    // Update domain coverage
    const domainCoverage = { ...(assessmentData.domainCoverage || {}) };
    const domainIdAsString = questionData.domainId.toString();
    domainCoverage[domainIdAsString] = (domainCoverage[domainIdAsString] || 0) + 1;
    
    // Update the assessment record with new state
    await db.update(assessments)
      .set({
        currentDifficulty: newDifficulty,
        difficultyProgression: difficultyProgression,
        domainCoverage: domainCoverage
      })
      .where(eq(assessments.id, assessmentId));

    console.log(`Assessment ${assessmentId} state updated: difficulty ${currentDifficulty} -> ${newDifficulty}, domain coverage updated for domain ${domainIdAsString}`);

    // Check if assessment is complete
    const user = req.user as User;
    const config = await loadAssessmentConfig(user.schoolId);
    
    if (currentSequence >= (config.questionCount || 40)) {
      // Assessment complete - AUTOMATICALLY TRIGGER COMPLETION TO PREVENT RACE CONDITIONS
      console.log(`Assessment ${assessmentId} reached completion (${currentSequence}/${config.questionCount || 40} questions). Auto-completing...`);
      
      try {
        // Use the AnswerProcessingService to properly complete assessment and store results
        const { AnswerProcessingService } = await import('../services/assessment/AnswerProcessingService');
        const answerProcessingService = new AnswerProcessingService();
        
        // Complete assessment using the proper service (includes ResultsCompilationService and database storage)
        const completionResult = await answerProcessingService.completeAssessment(assessmentId);
        
        if (completionResult.success) {
          // Update assessment record with completion status
          await db.update(assessments)
            .set({
              completed: true,
              completedAt: new Date()
            })
            .where(eq(assessments.id, assessmentId));
          
          console.log(`Assessment ${assessmentId} auto-completed successfully with results stored in database`);
        } else {
          console.error(`Assessment ${assessmentId} auto-completion failed:`, completionResult.message);
        }
      } catch (completionError) {
        console.error(`Error during assessment ${assessmentId} auto-completion:`, completionError);
        // Continue with response even if completion processing fails - results can be generated later
      }
      
      return res.status(200).json({
        success: true,
        message: "Assessment completed! Final answer recorded successfully.",
        response: {
          questionSequence: currentSequence,
          isCorrect: isCorrect,
          pointsEarned: pointsEarned,
          timedOut: timedOut
        },
        assessment: {
          completed: true,
          totalQuestions: config.questionCount || 40,
          questionsAnswered: currentSequence,
          resultsReady: true // Indicate that results are being processed/ready
        }
      });
    }

    // Assessment continues - return progress update
    res.status(200).json({
      success: true,
      message: "Answer recorded successfully",
      response: {
        questionSequence: currentSequence,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        timedOut: timedOut
      },
      assessment: {
        completed: false,
        totalQuestions: config.questionCount || 40,
        questionsAnswered: currentSequence,
        nextSequence: currentSequence + 1,
        percentComplete: Math.round((currentSequence / (config.questionCount || 40)) * 100)
      }
    });

  } catch (error) {
    console.error('Error processing assessment answer:', error);
    res.status(500).json({
      message: "Failed to process answer",
      details: "An error occurred while recording your response. Please try again."
    });
  }
});

/**
 * POST /api/assessment/session/complete
 * 
 * Finalizes assessment session and calculates results.
 * Returns assessment results with strengths and growth areas only (for Teachers).
 * NOW PROPERLY STORES RESULTS IN DATABASE TO PREVENT RACE CONDITIONS
 */
router.post('/complete', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        message: "Assessment ID required",
        details: "Assessment ID must be provided to complete the assessment."
      });
    }

    // Verify session ownership and status
    const assessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.id, assessmentId),
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, false)
      ))
      .limit(1);

    if (!assessment || assessment.length === 0) {
      return res.status(404).json({
        message: "Invalid assessment session",
        details: "Assessment session not found or already completed."
      });
    }

    // Get all responses for results calculation
    const responses = await db.select()
      .from(assessmentResponses)
      .where(eq(assessmentResponses.assessmentId, assessmentId))
      .orderBy(asc(assessmentResponses.questionSequence));

    if (!responses || responses.length === 0) {
      return res.status(400).json({
        message: "No responses found",
        details: "Cannot complete assessment without any recorded responses."
      });
    }

    // Use the AnswerProcessingService to properly complete assessment and store results
    const { AnswerProcessingService } = await import('../services/assessment/AnswerProcessingService');
    const answerProcessingService = new AnswerProcessingService();
    
    // Complete assessment using the proper service (includes ResultsCompilationService and database storage)
    const completionResult = await answerProcessingService.completeAssessment(assessmentId);
    
    if (!completionResult.success) {
      return res.status(500).json({
        message: "Failed to complete assessment",
        details: completionResult.message || "An error occurred during assessment completion."
      });
    }

    // Update assessment record with completion status (additional to what AnswerProcessingService does)
    await db.update(assessments)
      .set({
        completed: true,
        completedAt: new Date()
      })
      .where(eq(assessments.id, assessmentId));

    console.log(`Assessment ${assessmentId} completed for user ${userId} with results stored in database`);

    // Extract key results for teacher display
    const results = completionResult.results;
    
    // Return simplified results for teachers (strengths and growth areas only)
    res.status(200).json({
      success: true,
      message: "Assessment completed successfully",
      results: {
        assessmentId: assessmentId,
        completed: true,
        completedAt: new Date(),
        overallScore: results.overallScore,
        totalQuestions: results.totalQuestions,
        totalCorrect: results.totalCorrect,
        accuracyRate: results.accuracyRate,
        totalTimeSeconds: results.totalTimeSeconds,
        strengthAreas: results.strengthAreas,
        growthAreas: results.growthAreas,
        summary: {
          message: results.strengthAreas && results.strengthAreas.length > 0 
            ? `Great work! You showed strength in ${results.strengthAreas.join(', ')}.`
            : "Thank you for completing your assessment.",
          nextSteps: results.growthAreas && results.growthAreas.length > 0
            ? `Consider focusing on: ${results.growthAreas.join(', ')}.`
            : "Continue building your professional development skills!"
        }
      }
    });

  } catch (error) {
    console.error('Error completing assessment session:', error);
    res.status(500).json({
      message: "Failed to complete assessment",
      details: "An error occurred while finalizing your assessment results. Please contact support."
    });
  }
});

/**
 * GET /api/assessment/session/results
 * 
 * Retrieves stored assessment results for the current user.
 * Returns comprehensive results with domain breakdown and learning path information.
 */
router.get('/results', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;

    // Get the most recent completed assessment for this user
    const userAssessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, true)
      ))
      .orderBy(desc(assessments.completedAt))
      .limit(1);

    if (!userAssessment || userAssessment.length === 0) {
      return res.status(404).json({
        message: "No completed assessment found",
        details: "You haven't completed an assessment yet, or your assessment results are being processed."
      });
    }

    const assessment = userAssessment[0];

    // Get stored results from assessmentResults table
    const storedResults = await db.select()
      .from(assessmentResults)
      .where(eq(assessmentResults.assessmentId, assessment.id))
      .limit(1);

    if (!storedResults || storedResults.length === 0) {
      return res.status(404).json({
        message: "Assessment results not found",
        details: "Your assessment results are still being processed. Please try again in a few moments."
      });
    }

    const results = storedResults[0];

    // Get learning path if available (from EP-001-10)
    const { learningPaths } = await import('@shared/schema');
    const learningPath = await db.select()
      .from(learningPaths)
      .where(eq(learningPaths.assessmentId, assessment.id))
      .limit(1);

    // Return comprehensive results for display
    res.status(200).json({
      success: true,
      assessment: {
        id: assessment.id,
        completedAt: assessment.completedAt,
        type: assessment.type
      },
      results: {
        overallScore: results.overallScore,
        totalQuestions: results.totalQuestions,
        totalCorrect: results.totalCorrect,
        accuracyRate: results.accuracyRate,
        totalTimeSeconds: results.totalTimeSeconds,
        strengthAreas: results.strengthAreas,
        growthAreas: results.growthAreas,
        domainBreakdown: results.domainBreakdown,
        personalizedSummary: results.personalizedSummary,
        immediateNextSteps: results.immediateNextSteps,
        primaryMiniLessons: results.primaryMiniLessons,
        estimatedImprovementTime: results.estimatedImprovementTime
      },
      learningPath: learningPath.length > 0 ? {
        domainGroups: learningPath[0].domainGroups,
        totalFailedQuestions: learningPath[0].totalFailedQuestions,
        totalDomains: learningPath[0].totalDomains,
        estimatedCompletionTime: learningPath[0].estimatedCompletionTime
      } : null
    });

  } catch (error) {
    console.error('Error retrieving assessment results:', error);
    res.status(500).json({
      message: "Failed to retrieve assessment results",
      details: "An error occurred while loading your results. Please try again."
    });
  }
});

/**
 * GET /api/assessment/session/abandon
 * 
 * Handles session abandonment (user leaves assessment incomplete).
 * Marks session as abandoned but preserves data for potential analysis.
 */
router.get('/abandon', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;

    // Find active assessment session
    const activeAssessment = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, false)
      ))
      .orderBy(desc(assessments.createdAt))
      .limit(1);

    if (!activeAssessment || activeAssessment.length === 0) {
      return res.status(404).json({
        message: "No active assessment session found",
        details: "You don't have an active assessment session to abandon."
      });
    }

    const assessment = activeAssessment[0];

    // Count responses to see progress made
    const responses = await db.select({
      count: sql<number>`count(*)`
    })
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessment.id));

    const questionsAnswered = Number(responses[0].count) || 0;

    // Mark assessment as completed but with special abandonment flag in results
    await db.update(assessments)
      .set({
        completed: true,
        completedAt: new Date(),
        results: {
          status: 'abandoned',
          questionsAnswered: questionsAnswered.toString(),
          abandonedAt: new Date().toISOString()
        },
        strengthAreas: [],
        growthAreas: [],
        notes: `Assessment abandoned after ${questionsAnswered} questions`
      })
      .where(eq(assessments.id, assessment.id));

    console.log(`Assessment ${assessment.id} abandoned by user ${userId} after ${questionsAnswered} questions`);

    res.status(200).json({
      success: true,
      message: "Assessment session abandoned",
      details: {
        assessmentId: assessment.id,
        questionsAnswered: questionsAnswered,
        abandonedAt: new Date(),
        note: "Assessment session has been marked as abandoned. You may be able to take a new assessment in the future."
      }
    });

  } catch (error) {
    console.error('Error abandoning assessment session:', error);
    res.status(500).json({
      message: "Failed to abandon session",
      details: "An error occurred while abandoning the assessment session."
    });
  }
});

/**
 * GET /api/assessment/session/status
 * 
 * Check user's assessment completion status and determine where to route them
 */
router.get('/status', requireEligibleEducatorRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;

    // Check for completed assessments
    const completedAssessments = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial'),
        eq(assessments.completed, true)
      ))
      .orderBy(desc(assessments.completedAt))
      .limit(1);

    // Check for any existing assessment results
    const assessmentResults = await db.select()
      .from(assessmentResults)
      .where(eq(assessmentResults.userId, userId))
      .orderBy(desc(assessmentResults.createdAt))
      .limit(1);

    const hasCompletedAssessment = completedAssessments.length > 0;
    const hasResults = assessmentResults.length > 0;

    return res.json({
      hasCompletedAssessment,
      hasResults,
      routeTo: hasCompletedAssessment || hasResults ? '/assessment/results' : '/assessment',
      lastCompletedAt: completedAssessments[0]?.completedAt || null,
      canRetake: false // Will be determined by permission system
    });

  } catch (error) {
    console.error('Error checking assessment status:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router; 