// Lite question loader with built-in fallback questions
// This version has no external dependencies and will always work

export interface LiteQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  domain: string;
  difficulty: number;
  pointValue: number;
}

// Backup questions if we can't load questions from the server
const FALLBACK_QUESTIONS: LiteQuestion[] = [
  {
    id: 1,
    question: "Which of the following is a key principle of developmentally appropriate practice?",
    options: [
      "Focusing on academic skills only",
      "Treating all children the same way",
      "Acknowledging children's individual development",
      "Prioritizing teacher-directed activities"
    ],
    correctAnswer: "Acknowledging children's individual development",
    explanation: "Developmentally appropriate practice recognizes each child's unique development trajectory and adapts teaching approaches accordingly.",
    domain: "Child Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 2,
    question: "What is an effective way to promote language development in preschoolers?",
    options: [
      "Correcting grammatical errors immediately",
      "Engaging in back-and-forth conversations",
      "Using simplified vocabulary only",
      "Limiting conversation to instruction time"
    ],
    correctAnswer: "Engaging in back-and-forth conversations",
    explanation: "Back-and-forth conversations (serve and return interactions) build language skills and neural connections.",
    domain: "Language Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 3,
    question: "Which strategy best supports social-emotional learning in toddlers?",
    options: [
      "Removing emotional challenges",
      "Focusing only on academic readiness",
      "Naming and validating feelings",
      "Implementing strict behavioral controls"
    ],
    correctAnswer: "Naming and validating feelings",
    explanation: "Helping toddlers identify and name their emotions supports emotional regulation development.",
    domain: "Social-Emotional Development",
    difficulty: 1,
    pointValue: 5
  },
  {
    id: 4,
    question: "What is the main purpose of the CLASS assessment tool in early childhood settings?",
    options: [
      "To evaluate physical facilities only",
      "To assess teacher-child interactions",
      "To measure children's academic achievement",
      "To ensure compliance with licensing requirements"
    ],
    correctAnswer: "To assess teacher-child interactions",
    explanation: "The Classroom Assessment Scoring System (CLASS) measures the quality of teacher-child interactions.",
    domain: "Assessment",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 5,
    question: "Which approach best represents authentic assessment in early childhood?",
    options: [
      "Weekly standardized tests",
      "Observation during natural play",
      "Workbooks completed at home",
      "Comparing children to age norms only"
    ],
    correctAnswer: "Observation during natural play",
    explanation: "Authentic assessment gathers information about children's abilities during regular activities and play.",
    domain: "Assessment",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 6,
    question: "According to Vygotsky's Zone of Proximal Development, when should teachers provide scaffolding?",
    options: [
      "Only when children ask for help",
      "For tasks children can already do independently",
      "For tasks slightly beyond current ability",
      "Only during formal instruction"
    ],
    correctAnswer: "For tasks slightly beyond current ability",
    explanation: "Scaffolding is most effective in the zone between what a child can do independently and what they cannot do yet.",
    domain: "Child Development",
    difficulty: 2,
    pointValue: 10
  },
  {
    id: 7,
    question: "What is the key difference between Piaget's and Vygotsky's theories of cognitive development?",
    options: [
      "Piaget emphasized social interaction; Vygotsky emphasized biological maturation",
      "Piaget emphasized stages; Vygotsky emphasized cultural context and social learning",
      "Piaget studied infants; Vygotsky studied only school-age children",
      "Piaget focused on language; Vygotsky ignored language development"
    ],
    correctAnswer: "Piaget emphasized stages; Vygotsky emphasized cultural context and social learning",
    explanation: "Piaget's theory focuses on universal cognitive stages, while Vygotsky emphasized the role of culture and social interaction in learning.",
    domain: "Child Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 8,
    question: "Which best describes the concept of executive function in early childhood?",
    options: [
      "The ability to follow multi-step instructions perfectly",
      "Mental processes including working memory, self-control and flexible thinking",
      "Leadership skills demonstrated among peer groups",
      "Early literacy and numeracy foundations"
    ],
    correctAnswer: "Mental processes including working memory, self-control and flexible thinking",
    explanation: "Executive function involves cognitive processes that help children manage thoughts, actions, and emotions.",
    domain: "Cognitive Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 9,
    question: "What is the significance of secure attachment in infant development?",
    options: [
      "It ensures academic success in kindergarten",
      "It prevents all behavioral problems",
      "It forms the foundation for healthy social-emotional development",
      "It guarantees advanced language acquisition"
    ],
    correctAnswer: "It forms the foundation for healthy social-emotional development",
    explanation: "Secure attachment provides a safe base that supports exploration and healthy relationship development.",
    domain: "Social-Emotional Development",
    difficulty: 3,
    pointValue: 15
  },
  {
    id: 10,
    question: "What is the primary purpose of the ECERS-R assessment tool?",
    options: [
      "To evaluate child development outcomes",
      "To assess overall program environment quality",
      "To measure teacher qualifications",
      "To determine curriculum effectiveness"
    ],
    correctAnswer: "To assess overall program environment quality",
    explanation: "The Early Childhood Environment Rating Scale-Revised (ECERS-R) evaluates the quality of the overall early childhood program environment.",
    domain: "Program Quality",
    difficulty: 3,
    pointValue: 15
  }
];

/**
 * Gets questions by difficulty level
 * @param questions Array of questions to filter
 * @param difficulty Difficulty level to filter by (1, 2, or 3)
 * @returns Array of questions at the specified difficulty level
 */
export function getQuestionsByDifficulty(questions: LiteQuestion[], difficulty: number): LiteQuestion[] {
  return questions.filter(q => q.difficulty === difficulty);
}

/**
 * Shuffles an array of questions
 * @param questions Array of questions to shuffle
 * @returns Shuffled array of questions
 */
export function shuffleQuestions(questions: LiteQuestion[]): LiteQuestion[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a set of questions for an assessment
 * @returns Promise that resolves to an array of questions
 */
export async function getAssessmentQuestions(): Promise<LiteQuestion[]> {
  // Always return the fallback questions for reliability
  return shuffleQuestions(FALLBACK_QUESTIONS);
}