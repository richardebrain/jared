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
  schools
} from '@shared/schema';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';
import type { 
  Assessment, 
  InsertAssessment, 
  AssessmentConfig, 
  AssessmentDomain,
  User 
} from '@shared/schema';

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
 * Handles creation, validation, and tracking of assessment sessions for Teacher role users.
 * Ensures one-time assessment integrity and comprehensive data persistence.
 */

// Middleware to require Teacher role users only
const requireTeacherRole = async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Check if user is a Teacher (not admin, school admin, or owner)
    // Teachers are regular users who are not in administrative roles
    if (userData.isAdmin || userData.isSchoolAdmin || userData.isOwner) {
      return res.status(403).json({ 
        message: "Assessment access restricted", 
        details: "Initial assessments are only available for Teacher role users. Administrators should use different assessment tools."
      });
    }

    // Store user data for use in subsequent middleware/routes
    req.user = userData;
    next();
  } catch (error) {
    console.error('Error in Teacher role validation:', error);
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

// Helper function to check one-time assessment rule
async function checkOneTimeRule(userId: number): Promise<{ allowed: boolean; existingAssessment?: Assessment }> {
  try {
    const existingAssessments = await db.select()
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, 'initial')
      ))
      .orderBy(desc(assessments.createdAt))
      .limit(1);

    if (existingAssessments && existingAssessments.length > 0) {
      return {
        allowed: false,
        existingAssessment: existingAssessments[0]
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking one-time assessment rule:', error);
    throw error;
  }
}

/**
 * POST /api/assessment/session/start
 * 
 * Starts a new assessment session for Teacher role users.
 * Validates one-time rule and loads configuration.
 */
router.post('/start', requireTeacherRole, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const user = req.user as User;

    console.log(`Assessment session start requested by user ${userId}`);

    // Check one-time assessment rule
    const oneTimeCheck = await checkOneTimeRule(userId);
    if (!oneTimeCheck.allowed) {
      console.log(`One-time assessment rule violated for user ${userId}`);
      return res.status(409).json({
        message: "Assessment already completed",
        details: "You have already completed your initial assessment. Each teacher can only take the initial assessment once.",
        existingAssessment: {
          id: oneTimeCheck.existingAssessment?.id,
          completed: oneTimeCheck.existingAssessment?.completed,
          completedAt: oneTimeCheck.existingAssessment?.completedAt,
          createdAt: oneTimeCheck.existingAssessment?.createdAt
        }
      });
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
router.get('/status', requireTeacherRole, async (req: Request, res: Response) => {
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
        const domainCoverage = assessment.domainCoverage || {};
        
        console.log(`Fetching question for assessment ${assessment.id}, difficulty: ${currentDifficulty}`);
        
        // First, let's check if there are any questions at all
        const totalQuestions = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions);
        
        console.log(`Total questions in database: ${totalQuestions[0]?.count}`);
        
        // Check approved questions
        const approvedQuestions = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.isApproved, true));
        
        console.log(`Approved questions: ${approvedQuestions[0]?.count}`);
        
        // Check enabled questions  
        const enabledQuestions = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.isEnabled, true));
        
        console.log(`Enabled questions: ${enabledQuestions[0]?.count}`);
        
        // Check questions at specific difficulty
        const difficultyQuestions = await db.select({
          count: sql<number>`count(*)`
        })
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.difficulty, currentDifficulty.toString()));
        
        console.log(`Questions at difficulty ${currentDifficulty}: ${difficultyQuestions[0]?.count}`);
        
        // Select a question based on current difficulty and domain coverage
        // For now, get any available question from the pool - in production this would use the selection algorithm
        const availableQuestions = await db.select()
          .from(assessmentQuestions)
          .where(and(
            eq(assessmentQuestions.isApproved, true),
            eq(assessmentQuestions.isEnabled, true),
            eq(assessmentQuestions.difficulty, currentDifficulty.toString())
          ))
          .limit(10);

        console.log(`Found ${availableQuestions.length} available questions matching criteria`);

        if (availableQuestions && availableQuestions.length > 0) {
          // For now, pick a random question - in production this would use proper selection
          const randomIndex = Math.floor(Math.random() * availableQuestions.length);
          const selectedQuestion = availableQuestions[randomIndex];
          
          console.log(`Selected question: ${selectedQuestion.id}`);
          
          // Get domain name for the question
          let domainName = 'Unknown Domain';
          const domainIdAsNumber = parseInt(selectedQuestion.domainId);
          
          if (!isNaN(domainIdAsNumber)) {
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
            tags: selectedQuestion.tags ? JSON.parse(selectedQuestion.tags) : []
          };
          
          console.log(`Successfully created current question object`);
        } else {
          console.log(`No questions found matching criteria - trying fallback`);
          
          // Fallback: try to get any approved and enabled question
          const fallbackQuestions = await db.select()
            .from(assessmentQuestions)
            .where(and(
              eq(assessmentQuestions.isApproved, true),
              eq(assessmentQuestions.isEnabled, true)
            ))
            .limit(5);
            
          console.log(`Fallback found ${fallbackQuestions.length} questions`);
          
          if (fallbackQuestions.length > 0) {
            const selectedQuestion = fallbackQuestions[0];
            console.log(`Using fallback question: ${selectedQuestion.id}`);
            
            let domainName = 'Unknown Domain';
            const domainIdAsNumber = parseInt(selectedQuestion.domainId);
            
            if (!isNaN(domainIdAsNumber)) {
              try {
                const domain = await db.select()
                  .from(assessmentDomains)
                  .where(eq(assessmentDomains.id, domainIdAsNumber))
                  .limit(1);
                
                domainName = domain.length > 0 ? domain[0].name : 'Unknown Domain';
              } catch (domainError) {
                console.error('Error fetching domain in fallback:', domainError);
                domainName = `Domain ${selectedQuestion.domainId}`;
              }
            } else {
              console.log(`Fallback - Domain ID '${selectedQuestion.domainId}' is not a valid number, using as-is`);
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
              tags: selectedQuestion.tags ? JSON.parse(selectedQuestion.tags) : []
            };
          }
        }
      } catch (questionError) {
        console.error('Error loading current question:', questionError);
        // Continue without question - frontend will handle gracefully
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
router.post('/answer', requireTeacherRole, async (req: Request, res: Response) => {
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

    // Check if assessment is complete
    const user = req.user as User;
    const config = await loadAssessmentConfig(user.schoolId);
    
    if (currentSequence >= (config.questionCount || 40)) {
      // Assessment complete - will be handled by completion endpoint
      return res.status(200).json({
        success: true,
        message: "Answer recorded successfully",
        response: {
          questionSequence: currentSequence,
          isCorrect: isCorrect,
          pointsEarned: pointsEarned,
          timedOut: timedOut
        },
        assessment: {
          completed: true,
          totalQuestions: config.questionCount || 40,
          questionsAnswered: currentSequence
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
 */
router.post('/complete', requireTeacherRole, async (req: Request, res: Response) => {
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

    // Calculate domain-specific scores and identify growth areas
    const domainScores: Record<string, { score: number; maxDifficulty: number; questionsAnswered: number; correctAnswers: number }> = {};
    const domainCorrectness: Record<string, boolean[]> = {};
    const incorrectQuestions: Record<string, string[]> = {};
    
    let totalPoints = 0;
    let totalCorrect = 0;

    // Process responses by domain
    for (const response of responses) {
      const domainId = response.domainId;
      
      if (!domainScores[domainId]) {
        domainScores[domainId] = {
          score: 0,
          maxDifficulty: 0,
          questionsAnswered: 0,
          correctAnswers: 0
        };
        domainCorrectness[domainId] = [];
        incorrectQuestions[domainId] = [];
      }

      domainScores[domainId].questionsAnswered++;
      domainScores[domainId].score += response.pointsEarned || 0;
      totalPoints += response.pointsEarned || 0;

      if (response.isCorrect) {
        domainScores[domainId].correctAnswers++;
        totalCorrect++;
        domainCorrectness[domainId].push(true);
        
        // Update max difficulty reached in this domain
        const difficultyLevel = parseInt(response.difficulty);
        if (difficultyLevel > domainScores[domainId].maxDifficulty) {
          domainScores[domainId].maxDifficulty = difficultyLevel;
        }
      } else {
        domainCorrectness[domainId].push(false);
        incorrectQuestions[domainId].push(response.questionId);
      }
    }

    // Get domain names for result presentation
    const domains = await db.select()
      .from(assessmentDomains)
      .where(eq(assessmentDomains.isActive, true));

    const domainMap = new Map(domains.map(d => [d.id.toString(), d.name]));

    // Identify strengths and growth areas
    const strengthAreas: string[] = [];
    const growthAreas: string[] = [];

    for (const [domainId, stats] of Object.entries(domainScores)) {
      const domainName = domainMap.get(domainId) || `Domain ${domainId}`;
      const accuracyRate = stats.correctAnswers / stats.questionsAnswered;
      
      if (accuracyRate >= 0.8) {
        strengthAreas.push(domainName);
      } else if (accuracyRate < 0.6) {
        growthAreas.push(domainName);
      }
    }

    // Calculate overall score
    const overallScore = Math.round((totalCorrect / responses.length) * 100);

    // Update assessment with final results
    await db.update(assessments)
      .set({
        completed: true,
        completedAt: new Date(),
        overallScore: overallScore,
        domainScores: domainScores,
        strengthAreas: strengthAreas,
        growthAreas: growthAreas,
        incorrectAnswers: incorrectQuestions,
        results: {
          totalPoints: totalPoints.toString(),
          totalCorrect: totalCorrect.toString(),
          totalQuestions: responses.length.toString(),
          accuracyRate: `${overallScore}%`
        }
      })
      .where(eq(assessments.id, assessmentId));

    console.log(`Assessment ${assessmentId} completed for user ${userId}. Score: ${overallScore}%`);

    // Return results (strengths and growth areas only for Teachers)
    res.status(200).json({
      success: true,
      message: "Assessment completed successfully",
      results: {
        assessmentId: assessmentId,
        completed: true,
        completedAt: new Date(),
        overallScore: overallScore,
        totalQuestions: responses.length,
        totalCorrect: totalCorrect,
        accuracyRate: overallScore,
        strengthAreas: strengthAreas,
        growthAreas: growthAreas,
        summary: {
          message: strengthAreas.length > 0 
            ? `Great work! You showed strength in ${strengthAreas.join(', ')}.`
            : "Thank you for completing your assessment.",
          nextSteps: growthAreas.length > 0
            ? `Consider focusing on: ${growthAreas.join(', ')}.`
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
 * GET /api/assessment/session/abandon
 * 
 * Handles session abandonment (user leaves assessment incomplete).
 * Marks session as abandoned but preserves data for potential analysis.
 */
router.get('/abandon', requireTeacherRole, async (req: Request, res: Response) => {
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

export default router; 