import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Award, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import useSoundEffects from '@/hooks/use-sound-effects';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Define interfaces for quiz questions
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; 
}

// Implementation questions require free-text responses
export interface ImplementationQuestion {
  id: string;
  question: string;
}

// Props for the VideoQuiz component
interface VideoQuizProps {
  videoId: string;
  videoTitle: string;
  onComplete: (points: number) => void;
  onClose: () => void;
}

export default function VideoQuiz({ videoId, videoTitle, onComplete, onClose }: VideoQuizProps) {
  // State for quiz UI and logic
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);
  const [implementationQuestion, setImplementationQuestion] = useState<ImplementationQuestion | null>(null);
  const [implementationAnswer, setImplementationAnswer] = useState('');
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);
  const { toast } = useToast();
  const { playCorrectSound, playIncorrectSound, playCompletionSound } = useSoundEffects();
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate progress percentage
  const progress = Math.round(((showImplementation ? questions.length + 1 : currentQuestionIndex) / (questions.length + 1)) * 100);

  // Load questions when component mounts
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        const response = await apiRequest('GET', `/api/videos/questions/${videoId}`);
        const data = await response.json();
        
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          // Generate content-based questions if API fails or returns empty
          const contentQuestions = generateContentBasedQuestions(videoTitle);
          setQuestions(contentQuestions);
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
        // Fallback to generated questions
        const contentQuestions = generateContentBasedQuestions(videoTitle);
        setQuestions(contentQuestions);
      } finally {
        setLoading(false);
      }
    };

    generateQuestions();
  }, [videoId, videoTitle]);

  // Handle selection of an answer
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    
    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
    
    // Play sound effect based on correctness
    if (isCorrect) {
      playCorrectSound();
      setCorrectAnswers(prev => prev + 1);
    } else {
      playIncorrectSound();
    }
    
    // Move to next question or show final feedback
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowFinalFeedback(true);
    }
  };

  // Handle completing the quiz
  const handleFinishQuiz = async () => {
    // Calculate points based on correct answers and implementation
    const implementationPoints = implementationAnswer.length >= 50 ? 2 : 0;
    const quizPoints = Math.round((correctAnswers / questions.length) * 6); // Max 6 points from quiz
    
    // Ensure a minimum of 5 points for completing any video quiz
    const totalPoints = Math.max(5, quizPoints + implementationPoints);
    
    setEarnedPoints(totalPoints);
    setQuizCompleted(true);
    setAllCorrect(correctAnswers === questions.length);
    
    // Play completion sound
    playCompletionSound();
    
    // Trigger confetti if all answers are correct
    if (correctAnswers === questions.length) {
      if (confettiCanvasRef.current) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
    
    // Log completion for debugging
    console.log(`Quiz completed for video: ${videoId}, earned ${totalPoints} points`);
    
    // Call the onComplete callback with the earned points
    onComplete(totalPoints);
  };

  // Standard layout for both desktop and mobile
  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle>
          {showImplementation ? "Practical Implementation" : "Content Quiz"}
        </DialogTitle>
        <p className="text-muted-foreground text-sm">{videoTitle}</p>
      </DialogHeader>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>
            {showImplementation ? "Final Question" : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
          </span>
          <span className="text-muted-foreground">{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Main content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-muted-foreground">Loading quiz questions...</p>
        </div>
      ) : quizCompleted ? (
        <div className="py-4 text-center">
          <div className="mb-4 relative">
            <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none"></canvas>
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quiz Completed!</h3>
            <p className="text-muted-foreground mb-4">
              You got {correctAnswers} out of {questions.length} questions correct.
            </p>
            <div className="mb-4">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-sm px-3 py-1">
                <Award className="h-4 w-4 mr-1" />
                {earnedPoints} points earned
              </Badge>
            </div>
            {allCorrect && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                <p className="font-medium">Perfect score! You've mastered this content completely.</p>
              </div>
            )}
            <Button onClick={onClose} size="sm">
              Continue Learning
            </Button>
          </div>
        </div>
      ) : showImplementation ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-2">{implementationQuestion?.question}</h3>
            <p className="text-muted-foreground text-sm mb-3">
              Describe how you would apply this concept in your teaching practice.
            </p>
            <Textarea 
              placeholder="Share your ideas here... (minimum 50 characters)" 
              className="min-h-[120px]"
              value={implementationAnswer}
              onChange={(e) => setImplementationAnswer(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <span className={`text-xs ${implementationAnswer.length < 50 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {implementationAnswer.length}/50 characters
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImplementation(false)} size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button 
              onClick={() => handleFinishQuiz()} 
              disabled={implementationAnswer.length < 50}
              size="sm"
              title={implementationAnswer.length < 50 ? "Please enter at least 50 characters" : "Complete the quiz"}
            >
              {implementationAnswer.length < 50 ? `${50-implementationAnswer.length} more chars needed` : "Complete Quiz"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </div>
      ) : showFinalFeedback ? (
        <div className="py-4 text-center">
          <h3 className="text-lg font-medium mb-2">All Questions Answered!</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            You've completed all multiple-choice questions.
            Ready for the implementation question?
          </p>
          <Button onClick={() => {
            // Generate the implementation question based on video type
            let implQuestion: ImplementationQuestion;
            
            if (questions[0]?.options.some(opt => 
              opt.toLowerCase().includes("yoga") || 
              opt.toLowerCase().includes("mindfulness") ||
              opt.toLowerCase().includes("breath"))) {
              implQuestion = {
                id: 'impl-1',
                question: 'How would you integrate mindfulness practices in your classroom routine?'
              };
            } 
            else if (questions[0]?.options.some(opt => 
              opt.toLowerCase().includes("emotion") || 
              opt.toLowerCase().includes("social") || 
              opt.toLowerCase().includes("feeling"))) {
              implQuestion = {
                id: 'impl-2',
                question: 'How would you support a child who is struggling to manage their emotions in your classroom?'
              };
            }
            else {
              implQuestion = {
                id: 'impl-3',
                question: 'How would you apply the key concepts from this video in your teaching practice?'
              };
            }
            
            setImplementationQuestion(implQuestion);
            setShowImplementation(true);
            setShowFinalFeedback(false);
          }} size="sm">
            Continue to Implementation
          </Button>
        </div>
      ) : currentQuestionIndex < questions.length ? (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-3">{questions[currentQuestionIndex]?.question}</h3>
              
              <RadioGroup 
                value={selectedAnswer || ""} 
                onValueChange={handleSelectAnswer}
                className="space-y-2"
              >
                {questions[currentQuestionIndex]?.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-grow cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer}
              size="sm"
            >
              Next Question
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </>
      ) : null}
    </>
  );
}

// Simple hash function for strings
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Function to generate context-based questions
function generateContentBasedQuestions(videoTitle: string): QuizQuestion[] {
  // First, generate a video hash ID to ensure consistent yet unique questions per video
  const videoHash = stringToHash(videoTitle);
  
  // Define different question sets based on video content
  const categories = {
    mindfulness: videoTitle.toLowerCase().includes('mindful') || 
                videoTitle.toLowerCase().includes('yoga') || 
                videoTitle.toLowerCase().includes('meditation') ||
                videoTitle.toLowerCase().includes('breath'),
    
    socialEmotional: videoTitle.toLowerCase().includes('emotion') || 
                    videoTitle.toLowerCase().includes('social') ||
                    videoTitle.toLowerCase().includes('feeling') ||
                    videoTitle.toLowerCase().includes('trauma'),
    
    development: videoTitle.toLowerCase().includes('develop') || 
                videoTitle.toLowerCase().includes('growth') ||
                videoTitle.toLowerCase().includes('brain') ||
                videoTitle.toLowerCase().includes('science'),
    
    literacy: videoTitle.toLowerCase().includes('phonics') || 
              videoTitle.toLowerCase().includes('read') ||
              videoTitle.toLowerCase().includes('literacy') ||
              videoTitle.toLowerCase().includes('language'),
    
    leadership: videoTitle.toLowerCase().includes('lead') || 
                videoTitle.toLowerCase().includes('champion') ||
                videoTitle.toLowerCase().includes('school') ||
                videoTitle.toLowerCase().includes('classroom'),
    
    pedagogy: videoTitle.toLowerCase().includes('teach') || 
              videoTitle.toLowerCase().includes('learn') ||
              videoTitle.toLowerCase().includes('education') ||
              videoTitle.toLowerCase().includes('pedagogy') ||
              videoTitle.toLowerCase().includes('UDL')
  };
  
  // Find which category this video belongs to
  let primaryCategory = 'general';
  for (const [category, matches] of Object.entries(categories)) {
    if (matches) {
      primaryCategory = category;
      break;
    }
  }
  
  // Create distinct question sets with options - unique for each video based on hash
  const questionSets = {
    mindfulness: [
      {
        id: `mind-${videoHash % 1000}-1`,
        question: 'What is the primary benefit of mindfulness practices for young children?',
        options: [
          'Improving academic skills exclusively',
          'Enhancing self-regulation and emotional awareness',
          'Increasing physical fitness only',
          'Developing mathematical thinking'
        ],
        correctAnswer: 'Enhancing self-regulation and emotional awareness'
      },
      {
        id: `mind-${videoHash % 1000}-2`,
        question: 'How can mindfulness be integrated into daily classroom routines?',
        options: [
          'Only during designated yoga sessions',
          'As punishment when children misbehave',
          'Through breathing exercises, body awareness, and attention activities',
          'By requiring perfect stillness for long periods'
        ],
        correctAnswer: 'Through breathing exercises, body awareness, and attention activities'
      },
      {
        id: `mind-${videoHash % 1000}-3`,
        question: 'What impact can consistent mindfulness practice have on classroom behavior?',
        options: [
          'No impact on behavior management',
          'It typically makes children more hyperactive',
          'Reduced stress and improved emotional regulation',
          'Increased dependency on teacher guidance'
        ],
        correctAnswer: 'Reduced stress and improved emotional regulation'
      },
      {
        id: `mind-${videoHash % 1000}-4`,
        question: 'What physical space considerations are important for mindfulness activities?',
        options: [
          'Rooms must be completely silent and dark',
          'Comfortable, quiet spaces with minimal distractions',
          'Only outdoors is suitable for mindfulness',
          'Bright lights and stimulating decorations are essential'
        ],
        correctAnswer: 'Comfortable, quiet spaces with minimal distractions'
      },
      {
        id: `mind-${videoHash % 1000}-5`,
        question: 'How can mindfulness support children who have experienced trauma?',
        options: [
          'It has no effect on trauma responses',
          'By helping regulate emotions and build self-awareness',
          'By removing all memories of traumatic events',
          'By replacing therapeutic interventions entirely'
        ],
        correctAnswer: 'By helping regulate emotions and build self-awareness'
      }
    ],
    socialEmotional: [
      {
        id: `socemo-${videoHash % 1000}-1`,
        question: 'Which strategy best supports children in identifying their emotions?',
        options: [
          'Telling children how they should feel',
          'Using emotion vocabulary and providing mirrors for facial expressions',
          'Discouraging emotional expression in the classroom',
          'Limiting emotional vocabulary to "happy" and "sad" only'
        ],
        correctAnswer: 'Using emotion vocabulary and providing mirrors for facial expressions'
      },
      {
        id: `socemo-${videoHash % 1000}-2`,
        question: 'How can teachers help children develop empathy?',
        options: [
          'By emphasizing competition between children',
          'By modeling empathetic responses and perspective-taking',
          'By discouraging emotional discussions',
          'By treating empathy as an innate trait that cannot be taught'
        ],
        correctAnswer: 'By modeling empathetic responses and perspective-taking'
      },
      {
        id: `socemo-${videoHash % 1000}-3`,
        question: 'What is a key component of social-emotional learning in early childhood?',
        options: [
          'Academic achievement exclusively',
          'Self-regulation and relationship skills',
          'Athletic performance',
          'Advanced mathematics'
        ],
        correctAnswer: 'Self-regulation and relationship skills'
      },
      {
        id: `socemo-${videoHash % 1000}-4`,
        question: 'When a child is experiencing intense emotions, what approach is most effective?',
        options: [
          'Immediately punishing disruptive emotional expressions',
          'Acknowledging feelings and providing calming strategies',
          'Ignoring the behavior completely',
          'Telling the child to "stop feeling that way"'
        ],
        correctAnswer: 'Acknowledging feelings and providing calming strategies'
      },
      {
        id: `socemo-${videoHash % 1000}-5`,
        question: 'How can teachers promote positive peer relationships in the classroom?',
        options: [
          'By emphasizing individual achievement only',
          'Through collaborative activities and modeling respectful interactions',
          'By separating children who don\'t get along',
          'By avoiding discussions about feelings'
        ],
        correctAnswer: 'Through collaborative activities and modeling respectful interactions'
      }
    ],
    development: [
      {
        id: `dev-${videoHash % 1000}-1`,
        question: 'How does brain development in early childhood affect learning?',
        options: [
          'It has no significant impact until adolescence',
          'Early experiences create neural pathways that form lifelong foundations',
          'Brain development only affects physical coordination',
          'Early childhood is too early for meaningful brain development'
        ],
        correctAnswer: 'Early experiences create neural pathways that form lifelong foundations'
      },
      {
        id: `dev-${videoHash % 1000}-2`,
        question: 'What is a developmentally appropriate practice for preschoolers?',
        options: [
          'Workbooks and formal academic instruction for extended periods',
          'Eliminating all physical movement during learning',
          'Play-based learning with hands-on exploration',
          'Teaching advanced academic concepts beyond their cognitive stage'
        ],
        correctAnswer: 'Play-based learning with hands-on exploration'
      },
      {
        id: `dev-${videoHash % 1000}-3`,
        question: 'What role does responsive caregiving play in child development?',
        options: [
          "It's unnecessary as children develop independently",
          "It creates dependency and should be minimized",
          "It builds secure attachment and social-emotional health",
          "It only matters for physical development"
        ],
        correctAnswer: 'It builds secure attachment and social-emotional health'
      },
      {
        id: `dev-${videoHash % 1000}-4`,
        question: 'What is a key principle of child development theory?',
        options: [
          'Development occurs in a fixed, universal sequence for all children',
          'Environmental factors have no influence on development',
          'Development is an interaction between biology and environment',
          'All developmental domains function independently'
        ],
        correctAnswer: 'Development is an interaction between biology and environment'
      },
      {
        id: `dev-${videoHash % 1000}-5`,
        question: 'What is the significance of "serve and return" interactions for infant development?',
        options: [
          'They are mainly important for language development only',
          'They build foundational brain architecture and emotional security',
          'They only matter for social skills after age 3',
          'They have no significant impact on development'
        ],
        correctAnswer: 'They build foundational brain architecture and emotional security'
      }
    ],
    literacy: [
      {
        id: `lit-${videoHash % 1000}-1`,
        question: 'What is an effective strategy for supporting early literacy?',
        options: [
          'Focusing exclusively on letter recognition worksheets',
          'Creating a language-rich environment with books, songs, and conversation',
          'Discouraging drawing and scribbling',
          'Starting formal reading instruction at age 3'
        ],
        correctAnswer: 'Creating a language-rich environment with books, songs, and conversation'
      },
      {
        id: `lit-${videoHash % 1000}-2`,
        question: 'How can teachers support phonological awareness?',
        options: [
          'Through flash cards only',
          'By discouraging rhyming games',
          'Through games with rhymes, syllable counting, and sound play',
          'By teaching formal grammar rules'
        ],
        correctAnswer: 'Through games with rhymes, syllable counting, and sound play'
      },
      {
        id: `lit-${videoHash % 1000}-3`,
        question: "What's the relationship between oral language development and reading success?",
        options: [
          "They are unrelated skills",
          "Strong oral language skills provide a foundation for reading",
          "Oral language interferes with reading development",
          "Reading should be taught before oral language is developed"
        ],
        correctAnswer: "Strong oral language skills provide a foundation for reading"
      },
      {
        id: `lit-${videoHash % 1000}-4`,
        question: "What role does storytelling play in early literacy development?",
        options: [
          "It has minimal educational value",
          "It helps children understand narrative structure and comprehension",
          "It should be replaced with direct letter instruction",
          "It only matters for children who already know how to read"
        ],
        correctAnswer: "It helps children understand narrative structure and comprehension"
      },
      {
        id: `lit-${videoHash % 1000}-5`,
        question: "How can the classroom environment support emergent writing?",
        options: [
          "By providing only pencils and lined paper",
          "By discouraging drawing as it delays writing development",
          "By offering varied writing tools and meaningful purposes for writing",
          "By focusing exclusively on correct letter formation"
        ],
        correctAnswer: "By offering varied writing tools and meaningful purposes for writing"
      }
    ],
    leadership: [
      {
        id: `lead-${videoHash % 1000}-1`,
        question: 'What quality is most important for effective educational leadership?',
        options: [
          'Focusing exclusively on test scores',
          'Maintaining strict hierarchies with staff',
          'Creating a positive school culture with shared vision',
          'Minimizing parent involvement'
        ],
        correctAnswer: 'Creating a positive school culture with shared vision'
      },
      {
        id: `lead-${videoHash % 1000}-2`,
        question: 'How can classroom teachers demonstrate leadership?',
        options: [
          'By maintaining rigid control',
          'By modeling reflective practice and collaboration',
          'By working in isolation',
          'By focusing exclusively on academic content'
        ],
        correctAnswer: 'By modeling reflective practice and collaboration'
      },
      {
        id: `lead-${videoHash % 1000}-3`,
        question: 'What is the impact of effective leadership on student outcomes?',
        options: [
          'Leadership has minimal impact on students',
          'Leadership only affects staff morale',
          'Effective leadership creates conditions that support learning and development',
          'Leadership only matters for budget management'
        ],
        correctAnswer: 'Effective leadership creates conditions that support learning and development'
      },
      {
        id: `lead-${videoHash % 1000}-4`,
        question: 'What is the role of mentorship in early childhood education settings?',
        options: [
          "It's unnecessary once teachers complete their formal education",
          "It supports professional growth and improved teaching practice",
          "It should focus only on administrative tasks",
          "It's only needed for struggling teachers"
        ],
        correctAnswer: 'It supports professional growth and improved teaching practice'
      },
      {
        id: `lead-${videoHash % 1000}-5`,
        question: 'How can educational leaders effectively support teacher development?',
        options: [
          'By focusing exclusively on performance evaluations',
          'Through observation, feedback, and professional learning opportunities',
          'By maintaining distance from classroom practices',
          'By implementing strict standardization of all teaching practices'
        ],
        correctAnswer: 'Through observation, feedback, and professional learning opportunities'
      }
    ],
    pedagogy: [
      {
        id: `ped-${videoHash % 1000}-1`,
        question: 'What is the key principle of Universal Design for Learning (UDL)?',
        options: [
          'Teaching all children in exactly the same way',
          'Providing multiple means of engagement, representation, and action/expression',
          'Focusing only on high-achieving students',
          'Standardizing all curriculum materials'
        ],
        correctAnswer: 'Providing multiple means of engagement, representation, and action/expression'
      },
      {
        id: `ped-${videoHash % 1000}-2`,
        question: "How does play-based learning benefit children's development?",
        options: [
          "It has no educational value",
          "It only develops physical skills",
          "It integrates cognitive, social, emotional, and physical development",
          "It should be replaced with direct instruction"
        ],
        correctAnswer: "It integrates cognitive, social, emotional, and physical development"
      },
      {
        id: `ped-${videoHash % 1000}-3`,
        question: "What is the role of assessment in early childhood education?",
        options: [
          "To rank and sort children by ability",
          "To inform teaching practices and support individual development",
          "To compare children to each other",
          "To determine which children should be held back"
        ],
        correctAnswer: "To inform teaching practices and support individual development"
      },
      {
        id: `ped-${videoHash % 1000}-4`,
        question: "What approach best supports children with diverse learning needs?",
        options: [
          "Treating all children exactly the same",
          "Differentiating instruction based on individual strengths and needs",
          "Separating children by ability level for all activities",
          "Using the same assessment methods for all children"
        ],
        correctAnswer: "Differentiating instruction based on individual strengths and needs"
      },
      {
        id: `ped-${videoHash % 1000}-5`,
        question: "What is the importance of culturally responsive teaching?",
        options: [
          "It's unnecessary in early childhood settings",
          "It only applies to classrooms with diverse populations",
          "It helps children develop positive identities and respects diverse experiences",
          "It should focus only on celebrations and holidays"
        ],
        correctAnswer: "It helps children develop positive identities and respects diverse experiences"
      }
    ],
    general: [
      {
        id: `gen-${videoHash % 1000}-1`,
        question: "What is a key principle of developmentally appropriate practice?",
        options: [
          "All children should learn the same things in the same way",
          "Teaching should be responsive to each child's age, experience, and needs",
          "Academic learning is the only goal of early education",
          "Children should be pushed to learn advanced concepts as early as possible"
        ],
        correctAnswer: "Teaching should be responsive to each child's age, experience, and needs"
      },
      {
        id: `gen-${videoHash % 1000}-2`,
        question: "How do positive teacher-child relationships impact learning?",
        options: [
          "They have no impact on learning outcomes",
          "They create dependency and limit independence",
          "They provide a secure foundation for exploration and learning",
          "They should be minimized to focus on academics"
        ],
        correctAnswer: "They provide a secure foundation for exploration and learning"
      },
      {
        id: `gen-${videoHash % 1000}-3`,
        question: "What role does family engagement play in early childhood education?",
        options: [
          "It interferes with professional teaching",
          "It's essential for children's development and learning",
          "It's unnecessary until elementary school",
          "It should be limited to fundraising activities"
        ],
        correctAnswer: "It's essential for children's development and learning"
      },
      {
        id: `gen-${videoHash % 1000}-4`,
        question: "How can teachers create an inclusive classroom environment?",
        options: [
          "By treating all children exactly the same way",
          "By recognizing and adapting to diverse needs and backgrounds",
          "By separating children based on ability levels",
          "By focusing primarily on children who need the most help"
        ],
        correctAnswer: "By recognizing and adapting to diverse needs and backgrounds"
      },
      {
        id: `gen-${videoHash % 1000}-5`,
        question: "What role should reflection play in teaching practice?",
        options: [
          "It's unnecessary once a teacher has several years of experience",
          "It should be done only when problems arise",
          "It should be an ongoing process to improve teaching quality",
          "It should focus only on student academic performance"
        ],
        correctAnswer: "It should be an ongoing process to improve teaching quality"
      }
    ]
  };
  
  // Select questions from appropriate category based on the video's content
  // Only pick 2-3 questions to keep quiz short but meaningful
  const selectedQuestions = questionSets[primaryCategory as keyof typeof questionSets] || questionSets.general;
  
  // Use the video hash to ensure consistent selection for the same video
  // But different videos will have different questions
  const startIndex = videoHash % (selectedQuestions.length - 2);
  
  // Return 3 questions for the quiz
  return selectedQuestions.slice(startIndex, startIndex + 3);
}