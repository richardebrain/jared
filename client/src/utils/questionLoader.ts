// Define the question interface to match the master question format
export interface MasterQuestion {
  question: string;
  domain: string;
  sub_domain: string;
  difficulty: number;
  q_type: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  science_behind_it?: string;
  practical_application?: string;
  why_behind_it?: string;
  story?: string;
  points_value: number;
}

// Simplified question format for the assessment component
export interface AssessmentQuestion {
  id: number;
  text: string;
  domain: string;
  subDomain: string;
  difficulty: number;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  scienceExplanation?: string;
  practicalApplication?: string;
  whyBehindIt?: string;
  story?: string;
  points: number;
}

// Function to convert master questions to assessment format
export function convertToAssessmentQuestion(
  masterQuestion: MasterQuestion, 
  id: number
): AssessmentQuestion {
  // Convert options object to array format
  const options = Object.entries(masterQuestion.options).map(([id, text]) => ({
    id,
    text
  }));
  
  return {
    id,
    text: masterQuestion.question,
    domain: masterQuestion.domain,
    subDomain: masterQuestion.sub_domain,
    difficulty: masterQuestion.difficulty,
    options,
    correctAnswer: masterQuestion.correct_answer,
    explanation: masterQuestion.explanation,
    scienceExplanation: masterQuestion.science_behind_it,
    practicalApplication: masterQuestion.practical_application,
    whyBehindIt: masterQuestion.why_behind_it,
    story: masterQuestion.story,
    points: masterQuestion.points_value || getDifficultyPoints(masterQuestion.difficulty)
  };
}

// Helper to assign points based on difficulty if not specified
function getDifficultyPoints(difficulty: number): number {
  switch (difficulty) {
    case 1: return 10;
    case 2: return 15;
    case 3: return 20;
    default: return 10;
  }
}

// Function to load questions from the file system
export async function loadQuestionsFromServer(): Promise<AssessmentQuestion[]> {
  try {
    // Fetch questions from the server
    const response = await fetch('/api/assessment/questions');
    
    if (!response.ok) {
      throw new Error('Failed to load questions from server');
    }
    
    const questions = await response.json();
    return questions.map((q: MasterQuestion, idx: number) => 
      convertToAssessmentQuestion(q, idx + 1)
    );
  } catch (error) {
    console.error("Error loading questions from server:", error);
    return fallbackQuestions;
  }
}

// Filter questions by domain
export function getQuestionsByDomain(questions: AssessmentQuestion[], domain: string): AssessmentQuestion[] {
  return questions.filter(q => q.domain.toLowerCase() === domain.toLowerCase());
}

// Filter questions by difficulty
export function getQuestionsByDifficulty(questions: AssessmentQuestion[], difficulty: number): AssessmentQuestion[] {
  return questions.filter(q => q.difficulty === difficulty);
}

// Get a sample of questions with mixed difficulty
export function getSampleQuestions(questions: AssessmentQuestion[], count: number = 10): AssessmentQuestion[] {
  // Shuffle all questions
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  
  // Take requested number of questions
  return shuffled.slice(0, count);
}

// Get adaptive sample based on performance
export function getAdaptiveQuestions(
  questions: AssessmentQuestion[],
  previousPerformance: number, // 0-1 score from previous assessment
  count: number = 10
): AssessmentQuestion[] {
  // Define target difficulty distribution based on performance
  let easyRatio, mediumRatio, hardRatio;
  
  if (previousPerformance < 0.4) {
    // Focus more on easy questions for struggling users
    easyRatio = 0.7;
    mediumRatio = 0.3;
    hardRatio = 0;
  } else if (previousPerformance < 0.7) {
    // Balance of questions for average performers
    easyRatio = 0.3;
    mediumRatio = 0.6;
    hardRatio = 0.1;
  } else {
    // More challenging questions for high performers
    easyRatio = 0.1;
    mediumRatio = 0.5;
    hardRatio = 0.4;
  }
  
  // Filter and shuffle questions by difficulty
  const easyQuestions = questions
    .filter(q => q.difficulty === 1)
    .sort(() => 0.5 - Math.random());
    
  const mediumQuestions = questions
    .filter(q => q.difficulty === 2)
    .sort(() => 0.5 - Math.random());
    
  const hardQuestions = questions
    .filter(q => q.difficulty === 3)
    .sort(() => 0.5 - Math.random());
  
  // Calculate counts for each difficulty
  const easyCount = Math.round(count * easyRatio);
  const mediumCount = Math.round(count * mediumRatio);
  const hardCount = count - easyCount - mediumCount;
  
  // Combine selected questions
  const selectedQuestions = [
    ...easyQuestions.slice(0, easyCount),
    ...mediumQuestions.slice(0, mediumCount),
    ...hardQuestions.slice(0, hardCount)
  ];
  
  // Final shuffle and return
  return selectedQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
}

// Analyze strengths and weaknesses by domain
export function analyzePerformanceByDomain(
  questions: AssessmentQuestion[],
  answers: Record<number, string>
): Record<string, { correct: number, total: number, percentage: number }> {
  // Initialize domains object
  const domains: Record<string, { correct: number, total: number, percentage: number }> = {};
  
  // Process each question
  questions.forEach(question => {
    const domain = question.domain;
    
    // Initialize domain if not present
    if (!domains[domain]) {
      domains[domain] = { correct: 0, total: 0, percentage: 0 };
    }
    
    // If question was answered
    if (answers[question.id]) {
      domains[domain].total++;
      
      // Check if answer was correct
      if (answers[question.id] === question.correctAnswer) {
        domains[domain].correct++;
      }
    }
  });
  
  // Calculate percentages
  Object.keys(domains).forEach(domain => {
    const { correct, total } = domains[domain];
    domains[domain].percentage = total > 0 ? (correct / total) * 100 : 0;
  });
  
  return domains;
}

// Fallback questions in case the server request fails
export const fallbackQuestions: AssessmentQuestion[] = [
  {
    id: 1,
    text: "Which of the following best describes an appropriate developmental expectation for a 3-year-old child?",
    domain: "Child Development",
    subDomain: "Developmental Milestones",
    difficulty: 1,
    options: [
      { id: "A", text: "Reading simple three-letter words" },
      { id: "B", text: "Speaking in simple sentences and following two-step directions" },
      { id: "C", text: "Writing their first and last name" },
      { id: "D", text: "Tying their own shoes" }
    ],
    correctAnswer: "B",
    explanation: "At 3 years old, children typically speak in simple sentences of 3-4 words and can follow basic two-step directions. Reading words, writing names, and tying shoes are skills that develop later.",
    points: 10
  },
  {
    id: 2,
    text: "Which classroom arrangement best supports both quiet and active play for preschoolers?",
    domain: "Learning Environment",
    subDomain: "Classroom Design",
    difficulty: 1,
    options: [
      { id: "A", text: "Arranging all activities around the perimeter of the room" },
      { id: "B", text: "Creating one large open space in the center for all activities" },
      { id: "C", text: "Dividing the room into well-defined interest centers with both noisy and quiet areas" },
      { id: "D", text: "Keeping all materials in cabinets until needed for specific activities" }
    ],
    correctAnswer: "C",
    explanation: "Dividing the classroom into well-defined interest centers allows for separation of noisy and quiet activities. This arrangement helps children understand behavior expectations in different areas and supports various types of play simultaneously.",
    points: 10
  },
  {
    id: 3,
    text: "What is the primary purpose of the 'Zone of Proximal Development' in early childhood education?",
    domain: "Educational Theory",
    subDomain: "Vygotsky",
    difficulty: 2,
    options: [
      { id: "A", text: "To ensure children are always comfortable with learning activities" },
      { id: "B", text: "To identify the gap between what a child can do independently and what they can do with support" },
      { id: "C", text: "To group children with exactly the same abilities together" },
      { id: "D", text: "To keep children in their preferred learning areas" }
    ],
    correctAnswer: "B",
    explanation: "The Zone of Proximal Development (ZPD), a concept developed by Vygotsky, refers to the range of tasks that a child can perform with the guidance and assistance of adults or more skilled peers, but cannot yet accomplish independently. This concept is fundamental for scaffolding instruction.",
    points: 15
  },
  {
    id: 4,
    text: "According to attachment theory, secure attachment in early childhood is most strongly associated with:",
    domain: "Social-Emotional Development",
    subDomain: "Attachment Theory",
    difficulty: 2,
    options: [
      { id: "A", text: "Independence from caregivers at an early age" },
      { id: "B", text: "Consistent, responsive caregiving that meets the child's needs" },
      { id: "C", text: "Strict discipline and clear boundaries" },
      { id: "D", text: "Allowing children to cry it out to build resilience" }
    ],
    correctAnswer: "B",
    explanation: "Secure attachment develops when caregivers consistently respond to a child's needs in sensitive and appropriate ways. This secure base allows children to explore their environment with confidence, knowing their caregiver will be there when needed. Secure attachment is associated with positive social-emotional development and better outcomes later in life.",
    points: 15
  },
  {
    id: 5,
    text: "In the context of executive function skills, what is 'inhibitory control'?",
    domain: "Cognitive Development",
    subDomain: "Executive Function",
    difficulty: 3,
    options: [
      { id: "A", text: "The ability to remember multiple-step instructions" },
      { id: "B", text: "The ability to redirect attention as needed and resist distraction" },
      { id: "C", text: "The ability to adjust behavior based on different rules in different settings" },
      { id: "D", text: "The ability to understand that others have different thoughts and feelings" }
    ],
    correctAnswer: "B",
    explanation: "Inhibitory control is the ability to resist a strong inclination to do one thing and instead do what is most appropriate or needed. This includes resisting distractions, delaying gratification, and stopping an automatic response. It's one of the core executive function skills that develops during early childhood and is crucial for self-regulation and school readiness.",
    points: 20
  }
];