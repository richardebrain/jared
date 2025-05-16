import { useState, useEffect } from "react";
import { 
  Zap, 
  Trophy,
  Star,
  Award, 
  ArrowRight, 
  CheckCircle, 
  Gamepad,
  Sparkles,
  AlertTriangle,
  Brain,
  Lightbulb,
  BookOpen,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define Ultimate Escalator challenge types
interface EscalatorChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  category: string;
  points: number;
  estimatedTime: number; // in minutes
  status?: 'locked' | 'available' | 'in-progress' | 'completed';
}

// Questions for the challenges
interface ChallengeQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function UltimateEscalator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<EscalatorChallenge | null>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [challengeScore, setChallengeScore] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('beginner');

  // Mock user progress data - this would come from the API in a real app
  const { data: userProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ["/api/progress"],
  });

  // Demo challenges - these would come from the API in a real implementation
  const escalatorChallenges: EscalatorChallenge[] = [
    {
      id: 101,
      title: "Core Values Mastery",
      description: "Test your understanding of Raising Arizona's CORE values with this challenging assessment",
      difficulty: 'beginner',
      category: 'core-values',
      points: 20,
      estimatedTime: 10,
      status: 'available'
    },
    {
      id: 102,
      title: "Classroom Management Crisis",
      description: "Navigate complex classroom management scenarios with these challenging situations",
      difficulty: 'intermediate',
      category: 'classroom-management',
      points: 30,
      estimatedTime: 15,
      status: 'available'
    },
    {
      id: 103,
      title: "Child Development Deep Dive",
      description: "Advanced assessment on developmental milestones and age-appropriate expectations",
      difficulty: 'advanced',
      category: 'child-development',
      points: 40,
      estimatedTime: 20,
      status: 'available'
    },
    {
      id: 104,
      title: "The Ultimate Teacher Challenge",
      description: "Our most difficult assessment covering all aspects of early childhood education",
      difficulty: 'master',
      category: 'comprehensive',
      points: 50,
      estimatedTime: 25,
      status: 'locked'
    }
  ];

  // Filter challenges by difficulty/tab
  const filteredChallenges = escalatorChallenges.filter(
    challenge => challenge.difficulty === activeTab
  );

  // Mock complete a challenge
  const completeChallengeMutation = useMutation({
    mutationFn: async (data: { challengeId: number, score: number, earnedPoints: number }) => {
      // In a real app, this would submit to the API
      return await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      toast({
        title: "Challenge completed!",
        description: `You earned ${earnedPoints} points! Great job!`,
      });
    }
  });

  // Generate questions based on the selected challenge
  const generateChallengeQuestions = (challenge: EscalatorChallenge) => {
    const questions: ChallengeQuestion[] = [];
    
    if (challenge.category === 'core-values') {
      questions.push(
        {
          id: 1,
          question: "Which of Raising Arizona's CORE values focuses on providing stable, predictable environments?",
          options: [
            "Be Prepared",
            "Be Consistent",
            "Be Committed",
            "Be Caring"
          ],
          correctAnswer: 1,
          explanation: "Be Consistent is about providing stable, predictable environments where children can thrive."
        },
        {
          id: 2,
          question: "What does the 'Be Prepared' core value emphasize?",
          options: [
            "Having backup plans for unexpected situations",
            "Being emotionally ready for challenges",
            "Planning effectively for educational experiences",
            "All of the above"
          ],
          correctAnswer: 3,
          explanation: "Be Prepared encompasses all these aspects - having plans, backup options, and being emotionally ready."
        },
        {
          id: 3,
          question: "Which core value emphasizes dedication to each child's growth?",
          options: [
            "Be Caring",
            "Be Positive",
            "Be Committed",
            "Be Consistent"
          ],
          correctAnswer: 2,
          explanation: "Be Committed emphasizes dedication to each child's growth and development."
        },
        {
          id: 4,
          question: "How does 'Be Caring' manifest in the classroom?",
          options: [
            "Through strict discipline",
            "By showing genuine compassion and empathy",
            "By focusing primarily on academic progress",
            "By maintaining emotional distance"
          ],
          correctAnswer: 1,
          explanation: "Be Caring manifests through showing genuine compassion and empathy for every child."
        },
        {
          id: 5,
          question: "What is a key aspect of the 'Be Positive' core value?",
          options: [
            "Ignoring negative behaviors",
            "Maintaining an optimistic attitude that inspires children",
            "Focusing only on positive feedback",
            "Avoiding discussions of challenges"
          ],
          correctAnswer: 1,
          explanation: "Be Positive is about maintaining an optimistic attitude that inspires and encourages children."
        }
      );
    } else if (challenge.category === 'classroom-management') {
      questions.push(
        {
          id: 1,
          question: "What is the most effective first response to a child exhibiting challenging behavior?",
          options: [
            "Immediate time-out",
            "Assess the situation to understand why the behavior is occurring",
            "Call for assistance from another teacher",
            "Remove the child from the activity"
          ],
          correctAnswer: 1,
          explanation: "Understanding the cause of behavior is essential before deciding on an appropriate response."
        },
        {
          id: 2,
          question: "In a mixed-age classroom, what approach is most effective for transitions?",
          options: [
            "Separate children by age during transitions",
            "Have older children always go first",
            "Use visual and verbal cues with differentiated expectations",
            "Apply the same expectations to all children regardless of age"
          ],
          correctAnswer: 2,
          explanation: "Using both visual and verbal cues while adjusting expectations based on developmental levels is most effective."
        },
        {
          id: 3,
          question: "A child refuses to participate in circle time. What's the best approach?",
          options: [
            "Insist they join the group immediately",
            "Allow them to observe from a distance until ready to join",
            "Remove privileges until they comply",
            "Assign them to a different activity away from the group"
          ],
          correctAnswer: 1,
          explanation: "Allowing observation respects the child's readiness while maintaining the expectation that circle time is important."
        },
        {
          id: 4,
          question: "When multiple children are arguing over a toy, what's the most developmentally appropriate resolution?",
          options: [
            "Take the toy away completely",
            "Give the toy to whoever had it first",
            "Guide the children through conflict resolution steps",
            "Distract them with different toys"
          ],
          correctAnswer: 2,
          explanation: "Guiding children through resolving their own conflicts teaches valuable social skills."
        },
        {
          id: 5,
          question: "What classroom management approach aligns best with Raising Arizona's CORE values?",
          options: [
            "Strict behavioral management with clear consequences",
            "Relationship-based guidance with consistent boundaries",
            "Child-directed with minimal teacher intervention",
            "Reward-based systems for compliance"
          ],
          correctAnswer: 1,
          explanation: "Building strong relationships while maintaining consistent boundaries aligns with our core values of being consistent, caring, and positive."
        }
      );
    } else if (challenge.category === 'child-development') {
      questions.push(
        {
          id: 1,
          question: "Which developmental milestone typically occurs around 3-4 years of age?",
          options: [
            "Using complete sentences",
            "Understanding object permanence",
            "Beginning of cooperative play rather than parallel play",
            "Abstract mathematical reasoning"
          ],
          correctAnswer: 2,
          explanation: "Around age 3-4, children typically transition from parallel play to more cooperative play with peers."
        },
        {
          id: 2,
          question: "A 4-year-old child struggles to hop on one foot. This primarily relates to which developmental domain?",
          options: [
            "Cognitive development",
            "Language development",
            "Gross motor development",
            "Social-emotional development"
          ],
          correctAnswer: 2,
          explanation: "Hopping on one foot is a gross motor skill that typically develops around age 4."
        },
        {
          id: 3,
          question: "Which theory emphasizes the importance of scaffolding in children's learning?",
          options: [
            "Piaget's Theory of Cognitive Development",
            "Erikson's Psychosocial Development Theory",
            "Vygotsky's Sociocultural Theory",
            "Behaviorist Theory"
          ],
          correctAnswer: 2,
          explanation: "Vygotsky's theory emphasizes the role of social interaction and scaffolding in children's learning."
        },
        {
          id: 4,
          question: "What is an appropriate expectation for emotional regulation in a typical 3-year-old?",
          options: [
            "Complete emotional self-regulation in all situations",
            "Ability to identify and name complex emotions",
            "Beginning to use words instead of physical actions when upset",
            "Understanding others' perspectives consistently"
          ],
          correctAnswer: 2,
          explanation: "Around age 3, children typically begin developing the ability to use words rather than physical reactions when experiencing strong emotions."
        },
        {
          id: 5,
          question: "Which statement best describes developmentally appropriate practice?",
          options: [
            "Focusing primarily on academic readiness",
            "Matching teaching strategies to children's developmental levels and individual characteristics",
            "Following a standardized curriculum regardless of the children's interests",
            "Ensuring all children reach the same milestones at the same time"
          ],
          correctAnswer: 1,
          explanation: "Developmentally appropriate practice means matching teaching approaches to children's developmental needs and individual characteristics."
        }
      );
    } else if (challenge.category === 'comprehensive') {
      questions.push(
        {
          id: 1,
          question: "Which approach best represents Raising Arizona's philosophy on family engagement?",
          options: [
            "Limited family involvement to maintain classroom consistency",
            "Families should observe but not participate in classroom activities",
            "Partnership with families as the child's first and most important teachers",
            "Formal parent-teacher conferences are sufficient for family engagement"
          ],
          correctAnswer: 2,
          explanation: "We view families as partners and recognize them as the child's first and most important teachers."
        },
        {
          id: 2,
          question: "A new child joins your class mid-year and appears withdrawn. What approach aligns with our CORE values?",
          options: [
            "Give them space and time to adjust on their own",
            "Assign a peer buddy but otherwise maintain routine",
            "Create a specialized transition plan with extra support and comfort measures",
            "Modify all classroom activities until they adjust"
          ],
          correctAnswer: 2,
          explanation: "Creating an intentional transition plan with extra support demonstrates our caring, consistent approach."
        },
        {
          id: 3,
          question: "You notice a potential developmental concern with a child in your class. What is your FIRST step?",
          options: [
            "Document specific observations objectively over time",
            "Discuss your concerns directly with the family",
            "Consult with developmental specialists immediately",
            "Implement intervention strategies in the classroom"
          ],
          correctAnswer: 0,
          explanation: "Documenting specific, objective observations over time is the critical first step before taking further action."
        },
        {
          id: 4,
          question: "Which best demonstrates the 'Be Prepared' core value in curriculum planning?",
          options: [
            "Following a prescribed curriculum exactly as written",
            "Creating detailed plans that incorporate children's interests and developmental needs",
            "Focusing exclusively on kindergarten readiness skills",
            "Maintaining the same learning centers all year for consistency"
          ],
          correctAnswer: 1,
          explanation: "Intentional planning that balances structure with responsiveness to children's needs and interests demonstrates true preparation."
        },
        {
          id: 5,
          question: "How does Raising Arizona approach differences in developmental progress among children?",
          options: [
            "Grouping children by ability to streamline instruction",
            "Focusing primarily on areas needing improvement",
            "Celebrating each child's unique journey while providing appropriate support",
            "Setting standardized expectations for milestone achievement"
          ],
          correctAnswer: 2,
          explanation: "We recognize development is not linear and celebrate each child's unique path while providing appropriate support where needed."
        },
        {
          id: 6,
          question: "What is the Raising Arizona approach to technology in the classroom?",
          options: [
            "Maximizing technology use to prepare children for the digital world",
            "Avoiding all screen time as potentially harmful",
            "Using technology thoughtfully as one of many tools to support learning",
            "Following children's preferences regarding technology use"
          ],
          correctAnswer: 2,
          explanation: "We use technology intentionally as one of many tools, not as a primary teaching method or replacement for hands-on learning."
        },
        {
          id: 7,
          question: "Which best reflects our approach to positive guidance?",
          options: [
            "Using rewards and consequences consistently",
            "Teaching children skills to manage emotions and solve problems",
            "Removing children from the group when behavior issues arise",
            "Maintaining a quiet, orderly classroom environment"
          ],
          correctAnswer: 1,
          explanation: "We focus on teaching skills for emotional regulation and problem-solving rather than simply managing behavior."
        }
      );
    }
    
    return questions;
  };

  // Start a challenge
  const startChallenge = (challenge: EscalatorChallenge) => {
    setSelectedChallenge(challenge);
    const questions = generateChallengeQuestions(challenge);
    setCurrentQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setChallengeCompleted(false);
    setShowResults(false);
    setShowChallengeDialog(true);
  };

  // Handle selecting an answer
  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  // Go to next question or complete the challenge
  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correctAnswers = 0;
      Object.entries(selectedAnswers).forEach(([qIndex, answerIndex]) => {
        const questionIndex = parseInt(qIndex);
        const question = currentQuestions[questionIndex];
        if (question.correctAnswer === answerIndex) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / currentQuestions.length) * 100);
      setChallengeScore(score);
      
      // Calculate earned points based on score and challenge difficulty
      const pointsMultiplier = score / 100;
      const points = selectedChallenge ? Math.round(selectedChallenge.points * pointsMultiplier) : 0;
      setEarnedPoints(points);
      
      setChallengeCompleted(true);
      setShowResults(true);
      
      // Submit challenge completion
      if (selectedChallenge) {
        completeChallengeMutation.mutate({
          challengeId: selectedChallenge.id,
          score,
          earnedPoints: points
        });
      }
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              Ultimate Escalator
            </CardTitle>
            <CardDescription className="text-gray-100">
              Test your teaching knowledge with these advanced challenges
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-600 text-white border-amber-300">
            <Star className="h-3 w-3 mr-1" /> Elite Training
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="beginner" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="master">Master</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {filteredChallenges.map(challenge => (
                <Card key={challenge.id} className="overflow-hidden">
                  <div className={`p-4 ${
                    challenge.difficulty === 'beginner' ? 'bg-green-50' :
                    challenge.difficulty === 'intermediate' ? 'bg-blue-50' :
                    challenge.difficulty === 'advanced' ? 'bg-purple-50' :
                    'bg-orange-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{challenge.title}</h3>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                        
                        <div className="flex items-center mt-2 gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> 
                            {challenge.estimatedTime} min
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            <Trophy className="h-3 w-3 mr-1" /> 
                            {challenge.points} points
                          </Badge>
                          
                          <Badge variant={challenge.status === 'locked' ? "secondary" : "outline"} 
                                 className={`text-xs ${challenge.status === 'completed' ? "bg-green-500 hover:bg-green-500/80 text-white" : ""}`}>
                            {challenge.status === 'locked' ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Locked
                              </>
                            ) : challenge.status === 'completed' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Available
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant={challenge.status === 'locked' ? "secondary" : "default"}
                        size="sm"
                        disabled={challenge.status === 'locked'}
                        onClick={() => startChallenge(challenge)}
                        className="mt-1"
                      >
                        {challenge.status === 'completed' ? "Retry Challenge" : "Start Challenge"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* LOCKED MASTER CHALLENGE */}
              {activeTab === 'master' && (
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 flex items-center">
                  <div className="bg-gray-200 p-3 rounded-full mr-3">
                    <Brain className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Master Challenges Locked</h3>
                    <p className="text-sm text-gray-600">Complete all Advanced level challenges to unlock Master level</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="max-w-2xl">
          {selectedChallenge && !showResults && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {selectedChallenge.difficulty === 'beginner' ? <Gamepad className="h-5 w-5 mr-2 text-green-500" /> :
                   selectedChallenge.difficulty === 'intermediate' ? <BookOpen className="h-5 w-5 mr-2 text-blue-500" /> :
                   selectedChallenge.difficulty === 'advanced' ? <Lightbulb className="h-5 w-5 mr-2 text-purple-500" /> :
                   <Brain className="h-5 w-5 mr-2 text-orange-500" />}
                  {selectedChallenge.title}
                </DialogTitle>
                <DialogDescription>
                  Question {currentQuestionIndex + 1} of {currentQuestions.length}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-6">
                  <h3 className="font-medium text-lg mb-4">{currentQuestions[currentQuestionIndex]?.question}</h3>
                  
                  <RadioGroup 
                    value={selectedAnswers[currentQuestionIndex]?.toString()} 
                    onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, parseInt(value))}
                  >
                    {currentQuestions[currentQuestionIndex]?.options.map((option, index) => (
                      <div className="flex items-start space-x-2 mb-3 p-2 rounded-md hover:bg-slate-50" key={index}>
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              
              <DialogFooter>
                <div className="w-full flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedAnswers[currentQuestionIndex] !== undefined ? "Answer selected" : "Select an answer to continue"}
                  </div>
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  >
                    {currentQuestionIndex < currentQuestions.length - 1 ? "Next Question" : "Complete Challenge"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
          
          {selectedChallenge && showResults && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                  Challenge Results
                </DialogTitle>
                <DialogDescription>
                  {selectedChallenge.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <div className="inline-flex items-center justify-center rounded-full bg-amber-100 p-3">
                      {challengeScore >= 80 ? (
                        <Trophy className="h-8 w-8 text-amber-600" />
                      ) : challengeScore >= 60 ? (
                        <Award className="h-8 w-8 text-amber-600" />
                      ) : (
                        <Star className="h-8 w-8 text-amber-600" />
                      )}
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-1">
                    {challengeScore}% Score
                  </h2>
                  
                  <p className="text-muted-foreground mb-4">
                    {challengeScore >= 80 ? "Excellent work! You've mastered this challenge." :
                     challengeScore >= 60 ? "Good job! You're on the right track." :
                     "Keep practicing! You'll improve with more study."}
                  </p>
                  
                  <div className="bg-amber-50 p-4 rounded-lg mb-4">
                    <p className="font-medium text-amber-800">
                      <Star className="h-4 w-4 inline mr-1" />
                      You earned {earnedPoints} points!
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {currentQuestions.map((question, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      selectedAnswers[index] === question.correctAnswer ? 
                      "bg-green-50 border-green-200" : 
                      "bg-red-50 border-red-200"
                    }`}>
                      <p className="font-medium mb-1">{index + 1}. {question.question}</p>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Your answer:</span> {question.options[selectedAnswers[index] || 0]}
                        {selectedAnswers[index] !== question.correctAnswer && (
                          <span className="block mt-1">
                            <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">{question.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setShowChallengeDialog(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}