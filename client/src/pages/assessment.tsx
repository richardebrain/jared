import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Award, Check, ChevronRight, ClipboardList, Star } from "lucide-react";

// Define assessment question types
type QuestionType = 'multiple-choice';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface Question {
  id: string;
  text: string;
  domain: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: string;
  required: boolean;
  explanation?: string; // For internal reference, not shown to user
}

// Early childhood education domains
const domains = [
  { id: 'child-development', name: 'Child Development', icon: ClipboardList },
  { id: 'curriculum-planning', name: 'Curriculum & Planning', icon: Award },
  { id: 'social-emotional', name: 'Social-Emotional Learning', icon: Star },
  { id: 'health-safety', name: 'Health & Safety', icon: AlertCircle },
];

// Define adaptive assessment questions with increasing difficulty
const assessmentQuestions: Question[] = [
  // Child Development - Beginner Level
  {
    id: 'cd-b-1',
    text: 'At what age do most children begin to walk independently?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      '6-8 months', 
      '9-12 months', 
      '12-15 months', 
      '18-24 months'
    ],
    correctAnswer: '12-15 months',
    required: true,
    explanation: 'Most children take their first independent steps between 12-15 months, though the normal range can be 9-18 months.'
  },
  {
    id: 'cd-b-2',
    text: 'Which area of development is most closely associated with a child\'s ability to hold a crayon and draw?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Cognitive development', 
      'Fine motor development', 
      'Gross motor development', 
      'Language development'
    ],
    correctAnswer: 'Fine motor development',
    required: true,
    explanation: 'Fine motor skills involve the coordination of small muscles, particularly in the hands and fingers.'
  },
  
  // Child Development - Intermediate Level
  {
    id: 'cd-i-1',
    text: 'According to Piaget\'s theory of cognitive development, in which stage do children begin to use symbolic thinking?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Sensorimotor stage', 
      'Preoperational stage', 
      'Concrete operational stage', 
      'Formal operational stage'
    ],
    correctAnswer: 'Preoperational stage',
    required: true,
    explanation: 'The preoperational stage (ages 2-7) is when children develop symbolic thinking and use language to represent objects and ideas.'
  },
  {
    id: 'cd-i-2',
    text: 'Which of the following best describes Theory of Mind in early childhood development?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'A child\'s ability to count and understand numbers', 
      'A child\'s understanding that others have different thoughts and feelings', 
      'A child\'s ability to follow rules and regulations', 
      'A child\'s preference for concrete rather than abstract thinking'
    ],
    correctAnswer: 'A child\'s understanding that others have different thoughts and feelings',
    required: true,
    explanation: 'Theory of Mind develops around age 4-5 and refers to the understanding that others have their own thoughts, beliefs, and perspectives.'
  },
  
  // Child Development - Advanced Level
  {
    id: 'cd-a-1',
    text: 'Which brain structure is most responsible for emotion regulation and develops significantly during early childhood?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Cerebellum', 
      'Prefrontal cortex', 
      'Amygdala', 
      'Hippocampus'
    ],
    correctAnswer: 'Prefrontal cortex',
    required: true,
    explanation: 'The prefrontal cortex continues developing into early adulthood and is critical for emotional regulation, impulse control, and executive functions.'
  },
  {
    id: 'cd-a-2',
    text: 'Which of the following best describes the Zone of Proximal Development (ZPD) in Vygotsky\'s sociocultural theory?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'The distance between a child\'s independent problem-solving ability and their potential with adult guidance', 
      'The physical area where optimal learning takes place in a classroom', 
      'The period between birth and age 8 when development is most rapid', 
      'The gap between concrete and abstract thinking in children'
    ],
    correctAnswer: 'The distance between a child\'s independent problem-solving ability and their potential with adult guidance',
    required: true,
    explanation: 'ZPD represents the difference between what a child can do independently and what they can achieve with help from a more knowledgeable other.'
  },
  
  // Curriculum & Planning - Beginner Level
  {
    id: 'cp-b-1',
    text: 'Which of the following is a key component of developmentally appropriate practice (DAP)?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Following a strict, adult-directed curriculum', 
      'Focusing primarily on academic skills', 
      'Tailoring activities to children\'s developmental levels', 
      'Keeping all children on the same learning schedule'
    ],
    correctAnswer: 'Tailoring activities to children\'s developmental levels',
    required: true,
    explanation: 'DAP requires considering each child\'s age, individual characteristics, and cultural background when planning activities.'
  },
  {
    id: 'cp-b-2',
    text: 'What is the primary purpose of learning centers in an early childhood classroom?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'To keep children occupied while teachers complete paperwork', 
      'To provide opportunities for child-directed exploration and discovery', 
      'To separate children by ability level', 
      'To reduce the need for teacher supervision'
    ],
    correctAnswer: 'To provide opportunities for child-directed exploration and discovery',
    required: true,
    explanation: 'Learning centers allow children to explore materials, make choices, and engage in hands-on learning at their own pace.'
  },
  
  // Curriculum & Planning - Intermediate Level
  {
    id: 'cp-i-1',
    text: 'Which approach to early childhood education emphasizes the environment as the "third teacher"?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Montessori', 
      'Reggio Emilia', 
      'Waldorf', 
      'HighScope'
    ],
    correctAnswer: 'Reggio Emilia',
    required: true,
    explanation: 'The Reggio Emilia approach views the environment as a crucial teacher alongside adults and peers, with careful attention to aesthetics and organization.'
  },
  {
    id: 'cp-i-2',
    text: 'When implementing emergent curriculum, teachers should primarily:',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Follow pre-planned lessons regardless of children\'s interests', 
      'Allow children to do whatever they want without guidance', 
      'Build on children\'s interests while integrating learning objectives', 
      'Focus solely on academic skills development'
    ],
    correctAnswer: 'Build on children\'s interests while integrating learning objectives',
    required: true,
    explanation: 'Emergent curriculum responds to children\'s interests while teachers intentionally weave in learning goals and standards.'
  },
  
  // Curriculum & Planning - Advanced Level
  {
    id: 'cp-a-1',
    text: 'Which assessment approach best aligns with the principles of authentic assessment in early childhood education?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Standardized testing of specific skills', 
      'Documentation of children\'s work and learning processes over time', 
      'Weekly quizzes on taught content', 
      'Comparative rating of children against age norms'
    ],
    correctAnswer: 'Documentation of children\'s work and learning processes over time',
    required: true,
    explanation: 'Authentic assessment involves observing and documenting children in natural contexts, collecting work samples, and tracking progress over time.'
  },
  {
    id: 'cp-a-2',
    text: 'Which of the following best describes the concept of "scaffolding" in early childhood education?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Breaking skills into small, sequential steps for mastery', 
      'Providing temporary support that is gradually removed as competence increases', 
      'Building physical structures and climbing equipment in the classroom', 
      'Creating distinct learning levels within the curriculum'
    ],
    correctAnswer: 'Providing temporary support that is gradually removed as competence increases',
    required: true,
    explanation: 'Scaffolding offers just enough assistance to help children succeed at tasks they couldn\'t complete independently, gradually reducing support as they become more capable.'
  },
  
  // Social-Emotional Learning - Beginner Level
  {
    id: 'se-b-1',
    text: 'Which of the following activities best supports preschoolers\' emotional development?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Flashcards with emotion words', 
      'Quiet, independent reading time', 
      'Reading stories about feelings and discussing characters\' emotions', 
      'Memorizing rules for proper behavior'
    ],
    correctAnswer: 'Reading stories about feelings and discussing characters\' emotions',
    required: true,
    explanation: 'Story discussions help children recognize emotions, develop empathy, and connect narrative elements to their own experiences.'
  },
  {
    id: 'se-b-2',
    text: 'What is the most effective approach to helping toddlers resolve a conflict over a toy?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Removing the toy completely', 
      'Telling them to share and take turns', 
      'Getting a duplicate toy for each child', 
      'Approaching calmly, acknowledging feelings, and guiding problem-solving'
    ],
    correctAnswer: 'Approaching calmly, acknowledging feelings, and guiding problem-solving',
    required: true,
    explanation: 'This approach validates children\'s emotions while teaching social skills and modeling peaceful conflict resolution.'
  },
  
  // Social-Emotional Learning - Intermediate Level
  {
    id: 'se-i-1',
    text: 'Which of the following best describes self-regulation in early childhood?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'The ability to sit still during group time', 
      'The process of managing emotions, behavior, and attention to meet goals', 
      'Following classroom rules without reminders', 
      'Independence in self-care routines'
    ],
    correctAnswer: 'The process of managing emotions, behavior, and attention to meet goals',
    required: true,
    explanation: 'Self-regulation encompasses emotional, behavioral, and cognitive regulation and develops gradually throughout early childhood.'
  },
  {
    id: 'se-i-2',
    text: 'Which of these strategies is most effective for nurturing prosocial behavior in preschoolers?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Rewarding children with stickers when they share', 
      'Modeling kindness and explaining the impact of actions on others', 
      'Enforcing strict consequences for antisocial behavior', 
      'Separating children who struggle to get along'
    ],
    correctAnswer: 'Modeling kindness and explaining the impact of actions on others',
    required: true,
    explanation: 'This approach demonstrates prosocial behavior while helping children develop empathy by understanding how their actions affect others.'
  },
  
  // Social-Emotional Learning - Advanced Level
  {
    id: 'se-a-1',
    text: 'Which approach is most effective in supporting children who have experienced trauma?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Maintaining rigid routines with zero tolerance for behavioral issues', 
      'Creating a trauma-sensitive environment with predictable routines and emotional support', 
      'Avoiding discussions or activities that might trigger emotions', 
      'Treating all children the same regardless of background'
    ],
    correctAnswer: 'Creating a trauma-sensitive environment with predictable routines and emotional support',
    required: true,
    explanation: 'Trauma-sensitive approaches provide safety, consistency, and supportive relationships while acknowledging the impact of adverse experiences on development.'
  },
  {
    id: 'se-a-2',
    text: 'What is the primary difference between emotion coaching and behaviorist approaches to managing challenging behaviors?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Emotion coaching takes less time to implement', 
      'Behaviorist approaches focus on the underlying feelings while emotion coaching focuses on actions', 
      'Emotion coaching validates feelings while helping children learn appropriate expression; behaviorist approaches focus on changing behaviors through consequences', 
      'There is no significant difference between the approaches'
    ],
    correctAnswer: 'Emotion coaching validates feelings while helping children learn appropriate expression; behaviorist approaches focus on changing behaviors through consequences',
    required: true,
    explanation: 'Emotion coaching acknowledges emotions as valid while teaching regulation, whereas behaviorist approaches primarily target observable behaviors through reinforcement and consequences.'
  },
  
  // Health & Safety - Beginner Level
  {
    id: 'hs-b-1',
    text: 'What is the recommended hand washing procedure in early childhood settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Using hand sanitizer when soap isn\'t available', 
      'Washing with warm water for 5 seconds', 
      'Washing with soap and water for at least 20 seconds', 
      'Rinsing hands quickly under cold water'
    ],
    correctAnswer: 'Washing with soap and water for at least 20 seconds',
    required: true,
    explanation: 'Proper handwashing with soap and water for at least 20 seconds is the most effective way to prevent the spread of germs.'
  },
  {
    id: 'hs-b-2',
    text: 'Which of the following is a key component of playground safety in preschool settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Providing only equipment designed for school-aged children to challenge preschoolers', 
      'Having adequate fall surfacing under climbing equipment', 
      'Encouraging independent play without adult supervision', 
      'Allowing children to determine their own safety boundaries'
    ],
    correctAnswer: 'Having adequate fall surfacing under climbing equipment',
    required: true,
    explanation: 'Appropriate fall surfaces (like rubber mulch, pea gravel, or rubber mats) help prevent serious injuries from falls, which are the most common playground accidents.'
  },
  
  // Health & Safety - Intermediate Level
  {
    id: 'hs-i-1',
    text: 'What is the most appropriate response to a child with a known food allergy in an early childhood program?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Isolating the child at meal times to prevent exposure', 
      'Having an individualized care plan and training all staff on emergency procedures', 
      'Banning all potential allergens from the classroom', 
      'Asking parents to provide all meals and snacks'
    ],
    correctAnswer: 'Having an individualized care plan and training all staff on emergency procedures',
    required: true,
    explanation: 'An individualized plan created with medical professionals and family ensures appropriate accommodations while emergency training prepares staff to respond to reactions.'
  },
  {
    id: 'hs-i-2',
    text: 'In terms of illness policies, when should a child typically be excluded from attending an early childhood program?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'When they have any symptoms of illness, no matter how mild', 
      'Only when they have a confirmed diagnosis from a doctor', 
      'When they have symptoms that prevent participation in activities, indicate contagious disease, or require more care than staff can provide', 
      'Only when they have a fever over 100°F'
    ],
    correctAnswer: 'When they have symptoms that prevent participation in activities, indicate contagious disease, or require more care than staff can provide',
    required: true,
    explanation: 'This balanced approach considers the individual child\'s well-being, the potential for disease transmission, and the program\'s ability to provide appropriate care.'
  },
  
  // Health & Safety - Advanced Level
  {
    id: 'hs-a-1',
    text: 'Which approach to emergency preparedness is most effective in early childhood programs?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Having detailed written plans accessible only to administrators', 
      'Conducting infrequent but very realistic emergency drills with children',
      'Having comprehensive, regularly updated plans with developmentally appropriate practice drills and staff training', 
      'Focusing primarily on natural disaster preparation since these are least predictable'
    ],
    correctAnswer: 'Having comprehensive, regularly updated plans with developmentally appropriate practice drills and staff training',
    required: true,
    explanation: 'Effective emergency preparedness requires current plans for various scenarios, regular age-appropriate practice, and staff who are well-trained in emergency procedures.'
  },
  {
    id: 'hs-a-2',
    text: 'Which approach best addresses the prevention of childhood obesity in early childhood settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Implementing calorie-restricted diets for children who are overweight', 
      'Eliminating all treat foods and focusing exclusively on nutrition education', 
      'Offering weekly weigh-ins to track children\'s weight status', 
      'Integrating nutritious food options, regular physical activity, and positive food attitudes into daily routines'
    ],
    correctAnswer: 'Integrating nutritious food options, regular physical activity, and positive food attitudes into daily routines',
    required: true,
    explanation: 'This holistic approach promotes healthy habits without focusing on weight, incorporating regular movement, nutritious foods, and positive relationships with eating.'
  }
];

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get the currently authenticated user
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"]
  });
  
  // Track the current domain being assessed
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const currentDomain = domains[currentDomainIndex].id;
  
  // Track difficulty level and performance for adaptive assessment
  const [domainDifficulty, setDomainDifficulty] = useState<Record<string, DifficultyLevel>>({
    'child-development': 'beginner',
    'curriculum-planning': 'beginner',
    'social-emotional': 'beginner',
    'health-safety': 'beginner'
  });
  
  // Track correct answers by domain
  const [correctByDomain, setCorrectByDomain] = useState<Record<string, number>>({
    'child-development': 0,
    'curriculum-planning': 0,
    'social-emotional': 0,
    'health-safety': 0
  });
  
  // Track incorrect answers by domain
  const [incorrectByDomain, setIncorrectByDomain] = useState<Record<string, number>>({
    'child-development': 0,
    'curriculum-planning': 0,
    'social-emotional': 0,
    'health-safety': 0
  });
  
  // Track answered questions by ID
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Get domain questions filtered by current difficulty
  const domainQuestions = assessmentQuestions.filter(
    q => q.domain === currentDomain && q.difficulty === domainDifficulty[currentDomain]
  );
  
  // Calculate overall progress (2 questions per domain)
  const totalQuestions = domains.length * 2;
  const overallProgress = Math.round((completedQuestions.length / totalQuestions) * 100);
  
  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Function to adjust difficulty based on performance
  const adjustDifficulty = (domain: string) => {
    const correct = correctByDomain[domain];
    const incorrect = incorrectByDomain[domain];
    const currentDifficulty = domainDifficulty[domain];
    
    // After 2 correct answers at beginner level, move to intermediate
    if (currentDifficulty === 'beginner' && correct >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
    
    // After 2 correct answers at intermediate level, move to advanced
    if (currentDifficulty === 'intermediate' && correct >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'advanced'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
    
    // After 2 incorrect answers at advanced level, move to intermediate
    if (currentDifficulty === 'advanced' && incorrect >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
    
    // After 2 incorrect answers at intermediate level, move to beginner
    if (currentDifficulty === 'intermediate' && incorrect >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'beginner'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
  };
  
  // Handle domain navigation
  const handleDomainChange = (domainId: string) => {
    const newDomainIndex = domains.findIndex(d => d.id === domainId);
    setCurrentDomainIndex(newDomainIndex);
    setCurrentQuestionIndex(0);
  };
  
  // Calculate domain progress
  const calculateDomainProgress = (domainId: string) => {
    // We want to show 2 questions per domain completed
    const domainCompleted = completedQuestions.filter(qId => {
      const q = assessmentQuestions.find(aq => aq.id === qId);
      return q && q.domain === domainId;
    }).length;
    return Math.min(100, Math.round((domainCompleted / 2) * 100));
  };
  
  // Check if the current question has been answered
  const isCurrentQuestionAnswered = () => {
    if (!domainQuestions[currentQuestionIndex]) return false;
    return answers[domainQuestions[currentQuestionIndex].id] !== undefined;
  };
  
  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Completed",
        description: "Thank you for completing your assessment. Your personalized learning path is now available.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit assessment: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Submit assessment
  const handleSubmitAssessment = () => {
    if (!user) return;
    
    // Calculate scores by domain and max difficulty reached
    const domainScores: Record<string, {
      score: number,
      maxDifficulty: DifficultyLevel
    }> = {};
    
    // Calculate scores for each domain
    domains.forEach(domain => {
      const domainId = domain.id;
      const domainAnswers = Object.entries(answers).filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.domain === domainId;
      });
      
      // Calculate correct answers rate
      const correctCount = domainAnswers.filter(([qId, answer]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && answer === question.correctAnswer;
      }).length;
      
      const totalAnswers = domainAnswers.length;
      const score = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
      
      // Determine max difficulty reached
      const advancedAnswers = domainAnswers.filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.difficulty === 'advanced';
      });
      
      const intermediateAnswers = domainAnswers.filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.difficulty === 'intermediate';
      });
      
      let maxDifficulty: DifficultyLevel = 'beginner';
      if (advancedAnswers.length > 0) {
        maxDifficulty = 'advanced';
      } else if (intermediateAnswers.length > 0) {
        maxDifficulty = 'intermediate';
      }
      
      domainScores[domainId] = {
        score,
        maxDifficulty
      };
    });
    
    // Determine strengths and growth areas
    const strengthThreshold = 70;
    const strengthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain].score >= strengthThreshold
    );
    
    const growthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain].score < strengthThreshold
    );
    
    // Calculate overall score
    const overallScore = Math.round(
      Object.values(domainScores).reduce((sum, domain) => sum + domain.score, 0) / 
      Object.values(domainScores).length
    );
    
    submitAssessmentMutation.mutate({
      userId: user.id,
      overallScore,
      completed: true,
      results: answers,
      domainScores,
      strengthAreas,
      growthAreas,
      assessmentType: "ITERS_ECERS_CLASS"
    });
  };
  
  // Check if assessment can be submitted - at least 2 questions per domain
  const canSubmitAssessment = domains.every(domain => {
    const domainCompleted = completedQuestions.filter(qId => {
      const q = assessmentQuestions.find(aq => aq.id === qId);
      return q && q.domain === domain.id;
    }).length;
    return domainCompleted >= 2;
  });
  
  // Handle proceeding to next question
  const handleNextQuestion = () => {
    if (!domainQuestions[currentQuestionIndex]) return;
    
    const currentQuestion = domainQuestions[currentQuestionIndex];
    
    // Check if question is required and not answered
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      toast({
        title: "Required Question",
        description: "Please answer this question before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the answer is correct (without telling the user)
    const isCorrect = answers[currentQuestion.id] === currentQuestion.correctAnswer;
    
    // Update correct/incorrect counts
    if (isCorrect) {
      setCorrectByDomain(prev => ({
        ...prev,
        [currentDomain]: prev[currentDomain] + 1
      }));
    } else {
      setIncorrectByDomain(prev => ({
        ...prev,
        [currentDomain]: prev[currentDomain] + 1
      }));
    }
    
    // Add to completed questions list
    setCompletedQuestions(prev => [...prev, currentQuestion.id]);
    
    // Adjust difficulty based on performance after answering
    adjustDifficulty(currentDomain);
    
    // Move to next question or domain if needed
    if (currentQuestionIndex < domainQuestions.length - 1) {
      // Move to next question in current domain/difficulty
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Check if we need to move to next domain
      const domainCompleted = completedQuestions.filter(qId => {
        const q = assessmentQuestions.find(aq => aq.id === qId);
        return q && q.domain === currentDomain;
      }).length;
      
      // If we've completed at least 2 questions in this domain, move to the next domain
      if (domainCompleted >= 1) {
        if (currentDomainIndex < domains.length - 1) {
          // Move to next domain
          setCurrentDomainIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        }
      }
    }
  };
  
  // Render the current question
  const renderQuestion = () => {
    if (domainQuestions.length === 0) return null;
    
    const question = domainQuestions[currentQuestionIndex];
    
    // For this version, we only have multiple-choice questions
    return (
      <RadioGroup 
        value={answers[question.id] || ""} 
        onValueChange={(value) => handleAnswerChange(question.id, value)}
      >
        <div className="grid gap-4">
          {question.options.map((option, i) => (
            <div 
              key={i} 
              className="border rounded-lg p-4 hover:bg-accent/20 transition-colors cursor-pointer"
              onClick={() => handleAnswerChange(question.id, option)}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem id={`option-${i}`} value={option} />
                <Label 
                  htmlFor={`option-${i}`} 
                  className="text-base font-medium leading-relaxed cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    );
  };
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">Teacher Skills Assessment</h1>
        <p className="text-center text-muted-foreground mb-8">
          Based on ITERS/ECERS and CLASS standards for early childhood educators
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Domain Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Areas</CardTitle>
                <CardDescription>
                  Overall Progress: {overallProgress}%
                </CardDescription>
                <Progress value={overallProgress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {domains.map((domain, index) => {
                    const DomainIcon = domain.icon;
                    const domainProgress = calculateDomainProgress(domain.id);
                    const isActive = currentDomain === domain.id;
                    const isComplete = domainProgress === 100;
                    const difficulty = domainDifficulty[domain.id];
                    
                    // Get color based on difficulty
                    const difficultyColor = 
                      difficulty === 'beginner' ? 'text-green-500' : 
                      difficulty === 'intermediate' ? 'text-amber-500' : 
                      'text-red-500';
                    
                    return (
                      <button
                        key={index}
                        className={`w-full flex items-center justify-between p-3 rounded-md transition-colors
                          ${isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                          }`}
                        onClick={() => handleDomainChange(domain.id)}
                      >
                        <div className="flex items-center">
                          <DomainIcon className="mr-2 h-4 w-4" />
                          <span>{domain.name}</span>
                        </div>
                        <div className="flex items-center">
                          {isComplete && <Check className="h-4 w-4 mr-1" />}
                          <span className="text-xs">{domainProgress}%</span>
                          {/* Show difficulty level with color indicator */}
                          {!isActive && <span className={`ml-1 text-xs ${difficultyColor}`}>●</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Current Assessment Status */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Assessment Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Domain:</span>
                    <div className="font-medium">{domains.find(d => d.id === currentDomain)?.name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Difficulty:</span>
                    <div className={`font-medium ${
                      domainDifficulty[currentDomain] === 'beginner' ? 'text-green-500' : 
                      domainDifficulty[currentDomain] === 'intermediate' ? 'text-amber-500' : 
                      'text-red-500'
                    }`}>
                      {domainDifficulty[currentDomain].charAt(0).toUpperCase() + domainDifficulty[currentDomain].slice(1)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {domains.find(d => d.id === currentDomain)?.name}
                  </CardTitle>
                  <Badge variant="outline" className={
                    domainDifficulty[currentDomain] === 'beginner' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                    domainDifficulty[currentDomain] === 'intermediate' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                    'bg-red-100 text-red-800 hover:bg-red-100'
                  }>
                    {domainDifficulty[currentDomain]} level
                  </Badge>
                </div>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {domainQuestions.length}
                </CardDescription>
                <Progress 
                  value={((currentQuestionIndex + 1) / domainQuestions.length) * 100} 
                  className="h-2" 
                />
              </CardHeader>
              
              <CardContent>
                {domainQuestions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-lg font-medium">
                      {domainQuestions[currentQuestionIndex].text}
                      {domainQuestions[currentQuestionIndex].required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </div>
                    
                    {renderQuestion()}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-lg font-medium mb-2">Great progress!</h3>
                    <p className="text-muted-foreground">
                      You've completed all the questions in this domain at the current difficulty level.
                      Please select another domain to continue your assessment.
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0 || domainQuestions.length === 0}
                >
                  Previous
                </Button>
                
                <div>
                  {canSubmitAssessment && (
                    <Button
                      variant="default"
                      className="ml-2"
                      onClick={handleSubmitAssessment}
                      disabled={submitAssessmentMutation.isPending || !isCurrentQuestionAnswered()}
                    >
                      {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                    </Button>
                  )}
                  
                  {(!canSubmitAssessment || currentQuestionIndex < domainQuestions.length - 1) && domainQuestions.length > 0 && (
                    <Button
                      variant="default"
                      onClick={handleNextQuestion}
                      disabled={!isCurrentQuestionAnswered() && domainQuestions[currentQuestionIndex].required}
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
            
            {/* Assessment Completion Info */}
            {canSubmitAssessment && (
              <div className="mt-4 bg-accent/20 rounded-lg p-4 flex items-start">
                <div className="mr-2 mt-1 text-2xl">🎉</div>
                <div>
                  <h3 className="font-semibold">Ready to Complete Your Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    You've answered enough questions to complete your assessment! Click "Submit Assessment" 
                    to receive your personalized learning path based on your knowledge level.
                  </p>
                  <div className="text-xs mt-2 text-muted-foreground italic">
                    Note: Your answers help us determine which training modules will benefit you most. 
                    This assessment adapts to your knowledge level.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}