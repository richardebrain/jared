/**
 * Module Content Templates
 * 
 * This file defines the template structure for creating training modules.
 * Each module follows a standardized format to ensure consistency and
 * completeness across all training content.
 */

/**
 * Training Module Template Structure
 * 
 * This interface defines the standardized format for all training modules
 * with the required sections as specified in the template.
 */
export interface TrainingModuleTemplate {
  // Basic module information
  title: string;
  objective: string;
  
  // Module content sections
  introVideo: {
    title: string;
    videoUrl: string;
    duration: number; // in minutes
  };
  
  downloadableResource: {
    title: string;
    fileUrl: string;
    fileType: string; // PDF, DOCX, etc.
  };
  
  interactiveScenario: {
    title: string;
    scenario: string;
    choices: {
      text: string;
      isCorrect: boolean;
      feedback: {
        explanation: string;
        scientificBasis?: string;
      }
    }[];
  };
  
  quiz: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number; // index of correct option
      explanation?: string;
    }[];
  };
  
  reflectionPrompt: {
    prompt: string;
    allowUpload: boolean; // Allow users to upload images/videos
  };
  
  completionBadge: {
    name: string;
    imageUrl: string;
    certificateTemplate?: string; // HTML template for certificate
  };
  
  trackingMetrics: {
    requiredCompletion: boolean; // Is this module required
    estimatedDuration: number; // in minutes
    targetTeacherLevel: string; // e.g., "Lead", "All", "New"
  };
}

/**
 * Default Training Module Template
 * 
 * This provides a skeleton template with placeholder values that can be
 * used as a starting point when creating new modules.
 */
export const defaultModuleTemplate: TrainingModuleTemplate = {
  title: "New Training Module",
  objective: "By the end of this module, the learner will be able to:",
  
  introVideo: {
    title: "Why This Topic Matters",
    videoUrl: "",
    duration: 3 // Default to 3 minutes
  },
  
  downloadableResource: {
    title: "Printable Support Tool",
    fileUrl: "",
    fileType: "PDF"
  },
  
  interactiveScenario: {
    title: "Choose Your Own Response",
    scenario: "Describe a real-life preschool scenario related to this topic...",
    choices: [
      {
        text: "Option A response",
        isCorrect: false,
        feedback: {
          explanation: "This approach might not be the most effective because...",
          scientificBasis: "Research shows that..."
        }
      },
      {
        text: "Option B response",
        isCorrect: true,
        feedback: {
          explanation: "This is an effective approach because...",
          scientificBasis: "According to child development research..."
        }
      },
      {
        text: "Option C response",
        isCorrect: false,
        feedback: {
          explanation: "This approach could be challenging because..."
        }
      },
      {
        text: "Option D response",
        isCorrect: false,
        feedback: {
          explanation: "While this might work in some cases..."
        }
      }
    ]
  },
  
  quiz: {
    questions: [
      {
        question: "Question 1",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        explanation: "Option A is correct because..."
      },
      {
        question: "Question 2",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 1,
        explanation: "Option B is correct because..."
      },
      {
        question: "Question 3",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 2,
        explanation: "Option C is correct because..."
      },
      {
        question: "Question 4",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 3,
        explanation: "Option D is correct because..."
      }
    ]
  },
  
  reflectionPrompt: {
    prompt: "What's your personal approach or tip for handling this topic?",
    allowUpload: true
  },
  
  completionBadge: {
    name: "Completion Badge",
    imageUrl: "",
    certificateTemplate: ""
  },
  
  trackingMetrics: {
    requiredCompletion: false,
    estimatedDuration: 60, // Default to 60 minutes
    targetTeacherLevel: "All"
  }
};

/**
 * Convert template to database-compatible learning module
 * 
 * This function transforms our detailed template format into the format
 * expected by the database schema for learning modules.
 */
export function templateToLearningModule(template: TrainingModuleTemplate) {
  // Create a comprehensive content HTML from the template sections
  const contentHtml = `
    <div class="module-content">
      <section class="objective">
        <h2>Module Objective</h2>
        <p>${template.objective}</p>
      </section>
      
      <section class="intro-video">
        <h2>${template.introVideo.title}</h2>
        <div class="video-container" data-video-url="${template.introVideo.videoUrl}">
          <iframe 
            width="100%" 
            height="400" 
            src="${template.introVideo.videoUrl}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      </section>
      
      <section class="downloadable-resource">
        <h2>${template.downloadableResource.title}</h2>
        <a href="${template.downloadableResource.fileUrl}" class="resource-download" target="_blank">
          Download ${template.downloadableResource.fileType}
        </a>
      </section>
      
      <section class="interactive-scenario">
        <h2>${template.interactiveScenario.title}</h2>
        <div class="scenario-description">
          <p>${template.interactiveScenario.scenario}</p>
        </div>
        <div class="scenario-choices" data-scenario-json='${JSON.stringify(template.interactiveScenario.choices)}'>
          <!-- Interactive choices will be rendered by client-side JS -->
        </div>
      </section>
      
      <section class="reflection">
        <h2>Reflection</h2>
        <div class="reflection-prompt">
          <p>${template.reflectionPrompt.prompt}</p>
        </div>
        <div class="reflection-input">
          <!-- Reflection input will be rendered by client-side JS -->
        </div>
      </section>
    </div>
  `;
  
  // Return a module object compatible with our database schema
  return {
    title: template.title,
    description: template.objective,
    duration: template.trackingMetrics.estimatedDuration,
    pointValue: 10, // Default point value
    imageUrl: null, // Can be updated later
    featured: false,
    difficulty: determineModuleDifficulty(template),
    category: "Professional Development",
    content: contentHtml,
    quiz: {
      questions: template.quiz.questions
    },
    isVisible: true,
    // New fields for module ratings and community sharing
    averageRating: 0,
    ratingCount: 0,
    isSharedToCommunity: false,
    schoolId: null // Will be filled in when created
  };
}

/**
 * Determine module difficulty based on content complexity
 */
function determineModuleDifficulty(template: TrainingModuleTemplate): string {
  // Simple heuristic - can be made more sophisticated
  if (template.trackingMetrics.targetTeacherLevel === "New") {
    return "beginner";
  } else if (template.trackingMetrics.targetTeacherLevel === "Lead") {
    return "advanced";
  } else {
    return "intermediate";
  }
}

/**
 * Validate a module template to ensure it contains all required elements
 */
export function validateModuleTemplate(template: TrainingModuleTemplate): { valid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!template.title) errors.push("Module title is required");
  if (!template.objective) errors.push("Module objective is required");
  
  // Check intro video
  if (!template.introVideo.videoUrl) errors.push("Intro video URL is required");
  
  // Check downloadable resource
  if (!template.downloadableResource.fileUrl) errors.push("Downloadable resource file URL is required");
  
  // Check interactive scenario
  if (!template.interactiveScenario.scenario) errors.push("Interactive scenario description is required");
  if (template.interactiveScenario.choices.length < 2) errors.push("At least 2 scenario choices are required");
  if (!template.interactiveScenario.choices.some(choice => choice.isCorrect)) {
    errors.push("At least one correct choice is required for the interactive scenario");
  }
  
  // Check quiz
  if (template.quiz.questions.length < 4) errors.push("At least 4 quiz questions are required");
  
  // Check reflection prompt
  if (!template.reflectionPrompt.prompt) errors.push("Reflection prompt is required");
  
  // Check completion badge
  if (!template.completionBadge.name) errors.push("Completion badge name is required");
  
  return {
    valid: errors.length === 0,
    errors
  };
}