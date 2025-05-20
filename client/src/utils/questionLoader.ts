import axios from 'axios';

// Define the question types
export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  domain: string;
  explanation?: string;
  pointValue: number;
}

// Load questions from local storage first for faster loading and offline support
const getLocalQuestions = (): AssessmentQuestion[] => {
  try {
    const localQuestions = localStorage.getItem('cachedAssessmentQuestions');
    if (localQuestions) {
      return JSON.parse(localQuestions);
    }
  } catch (error) {
    console.error('Error retrieving cached questions:', error);
  }
  return [];
};

// Fetch questions from the master dataset
export const fetchQuestions = async (): Promise<AssessmentQuestion[]> => {
  // First check if we have locally cached questions
  const localQuestions = getLocalQuestions();
  if (localQuestions.length > 0) {
    console.log('Using cached questions', localQuestions.length);
    return localQuestions;
  }
  
  try {
    // If no cached questions, fetch from server
    const response = await axios.get('/api/assessment/questions');
    const questions = response.data;
    
    // Cache the questions locally
    localStorage.setItem('cachedAssessmentQuestions', JSON.stringify(questions));
    return questions;
  } catch (error) {
    console.error('Error fetching questions from API:', error);
    
    // If API fails, load backup questions
    return getBackupQuestions();
  }
};

// Get questions filtered by a specific domain
export const getQuestionsByDomain = async (domain: string): Promise<AssessmentQuestion[]> => {
  const allQuestions = await fetchQuestions();
  return allQuestions.filter(q => q.domain.toLowerCase() === domain.toLowerCase());
};

// Get random questions
export const getRandomQuestions = (count: number): AssessmentQuestion[] => {
  const allQuestions = getLocalQuestions();
  // Shuffle questions
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  // Return requested number
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Get questions by difficulty level
export const getQuestionsByDifficulty = async (level: number): Promise<AssessmentQuestion[]> => {
  const allQuestions = await fetchQuestions();
  return allQuestions.filter(q => q.difficulty === level);
};

// Backup questions in case API fails or is unavailable
// These are a small set of core ECE assessment questions
const getBackupQuestions = (): AssessmentQuestion[] => {
  return [
    {
      id: 1,
      question: "What is the primary purpose of developmentally appropriate practice (DAP)?",
      options: [
        "To simplify the teacher's job",
        "To meet each child at their developmental level",
        "To prepare children for standardized testing",
        "To group children by ability"
      ],
      correctAnswer: "To meet each child at their developmental level",
      difficulty: 1,
      domain: "Teaching Practices",
      explanation: "Developmentally Appropriate Practice (DAP) is an approach to teaching that considers both the age and the individual needs of each child.",
      pointValue: 10
    },
    {
      id: 2,
      question: "Which of the following is a key principle of CLASS observation?",
      options: [
        "Focus only on teacher behaviors",
        "Consider interactions between teachers and children",
        "Evaluate classroom materials only",
        "Assess children's test scores"
      ],
      correctAnswer: "Consider interactions between teachers and children",
      difficulty: 1,
      domain: "CLASS Assessment",
      explanation: "The Classroom Assessment Scoring System (CLASS) focuses primarily on the quality of interactions between teachers and children as the primary mechanism of student learning.",
      pointValue: 10
    },
    {
      id: 3,
      question: "What is scaffolding in early childhood education?",
      options: [
        "A type of outdoor playground equipment",
        "Support that helps children accomplish tasks they couldn't do independently",
        "A method of classroom discipline",
        "A technique for organizing the classroom"
      ],
      correctAnswer: "Support that helps children accomplish tasks they couldn't do independently",
      difficulty: 1,
      domain: "Child Development",
      explanation: "Scaffolding involves providing just enough assistance to help a child accomplish a task they couldn't do independently, gradually removing support as the child becomes more capable.",
      pointValue: 10
    },
    {
      id: 4,
      question: "Which of the following best describes executive function skills?",
      options: [
        "Skills needed to become a school principal",
        "Cognitive processes that enable us to plan, focus, remember instructions, and juggle multiple tasks",
        "Fine motor skills used in writing and drawing",
        "The ability to read before kindergarten"
      ],
      correctAnswer: "Cognitive processes that enable us to plan, focus, remember instructions, and juggle multiple tasks",
      difficulty: 2,
      domain: "Child Development",
      explanation: "Executive function skills are the mental processes that enable us to plan, focus attention, remember instructions, and juggle multiple tasks successfully.",
      pointValue: 15
    },
    {
      id: 5,
      question: "What is the primary goal of the ITERS-R assessment?",
      options: [
        "To evaluate teacher credentials",
        "To assess the quality of care provided to infants and toddlers",
        "To measure children's academic achievements",
        "To determine staff-to-child ratios"
      ],
      correctAnswer: "To assess the quality of care provided to infants and toddlers",
      difficulty: 2,
      domain: "ITERS/ECERS",
      explanation: "The Infant/Toddler Environment Rating Scale-Revised (ITERS-R) is designed to assess the quality of care provided in settings for children from birth to 2.5 years of age.",
      pointValue: 15
    },
    {
      id: 6,
      question: "In the ECERS-R assessment, what does the 'Personal Care Routines' subscale primarily focus on?",
      options: [
        "Teachers' self-care practices",
        "Health, safety, and caregiving routines for children",
        "Classroom cleanliness only",
        "Parent involvement in care routines"
      ],
      correctAnswer: "Health, safety, and caregiving routines for children",
      difficulty: 3,
      domain: "ITERS/ECERS",
      explanation: "The Personal Care Routines subscale in ECERS-R focuses on health practices, safety practices, and caregiving routines such as meals/snacks, nap/rest, toileting/diapering, and health practices.",
      pointValue: 20
    },
    {
      id: 7,
      question: "What is the highest scoring level in the CLASS assessment tool?",
      options: [
        "5",
        "6",
        "7",
        "10"
      ],
      correctAnswer: "7",
      difficulty: 3,
      domain: "CLASS Assessment",
      explanation: "The CLASS tool uses a 7-point scale where 1-2 indicates low quality, 3-5 indicates mid-range quality, and 6-7 indicates high quality interactions.",
      pointValue: 20
    }
  ];
};

// Pre-load and cache the questions when this module loads
fetchQuestions().catch(error => console.error('Failed to preload questions:', error));