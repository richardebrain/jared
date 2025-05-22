import { Router } from "express";
import { storage } from "../storage";
import { checkAuth } from "../middleware/auth";
import { InsertAssessment } from "@shared/schema";

const router = Router();

/**
 * Submit a teacher self-assessment
 * Adds the assessment results to the user's profile and learning path
 */
router.post("/self-assessment", checkAuth, async (req, res) => {
  try {
    const { userId, results, strengthAreas, growthAreas, notes } = req.body;
    
    if (!userId || !results) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Validate that the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate the overall score as an average of all answers
    const values = Object.values(results).map((v) => parseInt(v as string));
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const overallScore = Math.round(average * 20); // Convert to percentage (1-5 scale to 20-100%)
    
    // Determine teacher level based on average score
    let teacherLevel = "beginner";
    if (average >= 4.5) {
      teacherLevel = "mentor";
    } else if (average >= 3.7) {
      teacherLevel = "advanced";
    } else if (average >= 2.8) {
      teacherLevel = "intermediate";
    }
    
    // Calculate scores by category
    const categories = new Set<string>();
    const categoryScores: Array<{
      category: string;
      score: number;
      level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery';
      description: string;
      questionsAnswered: number;
      correctAnswers: number;
    }> = [];
    
    // Process category data from answers
    Object.entries(results).forEach(([questionId, score]) => {
      const [category] = questionId.split('_');
      if (!categories.has(category)) {
        categories.add(category);
        
        // Create level based on score
        let level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery' = 'beginner';
        const numericScore = parseInt(score as string);
        
        if (numericScore >= 5) {
          level = 'mastery';
        } else if (numericScore >= 4) {
          level = 'accomplished'; 
        } else if (numericScore >= 3) {
          level = 'proficient';
        } else if (numericScore >= 2) {
          level = 'developing';
        }
        
        // Generate description based on level
        let description = '';
        switch (level) {
          case 'mastery':
            description = "Expert level - can mentor others";
            break;
          case 'accomplished':
            description = "Advanced skills - consistently exceeds expectations";
            break;
          case 'proficient':
            description = "Solid performance - meets all expectations";
            break;
          case 'developing':
            description = "Building skills - working toward proficiency";
            break;
          case 'beginner':
            description = "Emerging skills - needs support and development";
            break;
        }
        
        categoryScores.push({
          category,
          score: numericScore,
          level,
          description,
          questionsAnswered: 1,
          correctAnswers: 1
        });
      }
    });
    
    // Create a new assessment
    const assessment: InsertAssessment = {
      userId,
      type: "self", // Indicate this is a self-assessment
      overallScore,
      completed: true,
      results,
      categoryScores,
      strengthAreas,
      growthAreas,
      notes,
      teacherLevel
    };
    
    // Save the assessment
    const savedAssessment = await storage.createAssessment(assessment);
    
    // Award points to the user for completing the assessment
    const pointsEarned = 50; // Points for completing a self-assessment
    
    // Update user points
    await storage.addUserPoints(userId, pointsEarned);
    
    // Update teacher level
    await storage.updateUserTeacherLevel(userId, teacherLevel);
    
    res.status(201).json({
      message: "Self-assessment completed successfully",
      assessment: savedAssessment,
      pointsEarned
    });
  } catch (error) {
    console.error("Error submitting self-assessment:", error);
    res.status(500).json({ message: "Failed to submit self-assessment" });
  }
});

/**
 * Get a user's latest self-assessment
 */
router.get("/self-assessment/:userId", checkAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get all assessments for the user
    const assessments = await storage.getAssessmentsByUserId(userId);
    
    // Find the most recent self-assessment
    const selfAssessments = assessments.filter(assessment => assessment.type === 'self');
    
    if (selfAssessments.length === 0) {
      return res.status(404).json({ message: "No self-assessments found for this user" });
    }
    
    // Sort by creation date (newest first)
    selfAssessments.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Return the most recent self-assessment
    res.json(selfAssessments[0]);
  } catch (error) {
    console.error("Error retrieving self-assessment:", error);
    res.status(500).json({ message: "Failed to retrieve self-assessment" });
  }
});

export default router;