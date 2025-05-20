import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Lightbulb, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useNavigate } from 'wouter';

interface Question {
  id: number;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation: string;
  points: number;
  difficulty: number;
}

// Our domains with questions directly embedded
const domains = [
  {
    id: 1,
    name: "Child Development",
    description: "Understanding how children grow and develop",
    color: "#4CAF50",
    questions: [
      {
        id: 101,
        text: "What is a key characteristic of a secure attachment in early childhood?",
        options: [
          { id: "a", text: "Children who are independent and don't need adult attention" },
          { id: "b", text: "Children who seek comfort from caregivers when distressed" },
          { id: "c", text: "Children who avoid interacting with others" },
          { id: "d", text: "Children who show no emotional reactions" }
        ],
        correctAnswer: "b",
        explanation: "Secure attachment is characterized by children who use their caregiver as a safe base, seeking comfort when distressed and feeling secure enough to explore their environment.",
        points: 10,
        difficulty: 1
      },
      {
        id: 102,
        text: "Which of the following is a fine motor skill that typically develops around age 4?",
        options: [
          { id: "a", text: "Running and jumping" },
          { id: "b", text: "Using scissors to cut along a line" },
          { id: "c", text: "Throwing a ball overhead" },
          { id: "d", text: "Climbing stairs with alternating feet" }
        ],
        correctAnswer: "b",
        explanation: "Using scissors to cut along a line is a fine motor skill that typically develops around age 4 as children gain better hand-eye coordination and finger dexterity.",
        points: 10,
        difficulty: 1
      },
      {
        id: 103,
        text: "What is an appropriate developmental expectation for a 3-year-old's social skills?",
        options: [
          { id: "a", text: "Engages primarily in parallel play alongside peers" },
          { id: "b", text: "Leads complex cooperative play with established rules" },
          { id: "c", text: "Consistently takes turns without adult prompting" },
          { id: "d", text: "Resolves conflicts with peers independently" }
        ],
        correctAnswer: "a",
        explanation: "At age 3, parallel play (playing alongside peers but not necessarily interacting) is developmentally appropriate. Cooperative play with turn-taking and rule-following typically develops more fully between ages 4-5.",
        points: 10,
        difficulty: 1
      },
      {
        id: 104,
        text: "When observing children in dramatic play, which behavior would most indicate the development of perspective-taking skills?",
        options: [
          { id: "a", text: "A child playing independently with dolls" },
          { id: "b", text: "A child organizing toys by color and size" },
          { id: "c", text: "A child pretending to be a doctor helping a sick patient" },
          { id: "d", text: "A child building a complex block tower" }
        ],
        correctAnswer: "c",
        explanation: "Taking on different roles in dramatic play, such as pretending to be a doctor helping a patient, demonstrates perspective-taking as the child is considering the thoughts, feelings, and needs of another person.",
        points: 15,
        difficulty: 2
      },
      {
        id: 105,
        text: "When implementing trauma-informed practices in early childhood, which approach is most aligned with current best practices?",
        options: [
          { id: "a", text: "Minimizing discussion of difficult emotions to avoid triggering children" },
          { id: "b", text: "Creating predictable environments while teaching emotional regulation strategies" },
          { id: "c", text: "Focusing primarily on academic readiness to help children overcome challenges" },
          { id: "d", text: "Implementing strict behavioral management systems for consistency" }
        ],
        correctAnswer: "b",
        explanation: "Trauma-informed practice emphasizes creating predictable, safe environments while explicitly teaching emotional regulation strategies to help children build resilience and coping skills.",
        points: 20,
        difficulty: 3
      }
    ]
  },
  {
    id: 2,
    name: "Classroom Management",
    description: "Strategies for effective classroom organization and management",
    color: "#2196F3",
    questions: [
      {
        id: 201,
        text: "What is the primary purpose of a daily schedule in an early childhood classroom?",
        options: [
          { id: "a", text: "To create a predictable routine that helps children feel secure" },
          { id: "b", text: "To keep children constantly engaged so they don't misbehave" },
          { id: "c", text: "To ensure teachers complete all required activities" },
          { id: "d", text: "To minimize transition times between activities" }
        ],
        correctAnswer: "a",
        explanation: "A predictable daily schedule helps children feel secure, reduces anxiety, and helps them understand expectations throughout the day.",
        points: 10,
        difficulty: 1
      },
      {
        id: 202,
        text: "Which transition strategy is most developmentally appropriate for preschoolers?",
        options: [
          { id: "a", text: "Having children sit and wait quietly until everyone is ready" },
          { id: "b", text: "Using songs, rhymes, or movement activities to signal transitions" },
          { id: "c", text: "Allowing children to move freely between activities whenever they choose" },
          { id: "d", text: "Having all children transition at exactly the same time" }
        ],
        correctAnswer: "b",
        explanation: "Songs, rhymes, and movement activities provide enjoyable, developmentally appropriate cues that help preschoolers understand and prepare for transitions.",
        points: 10,
        difficulty: 1
      },
      {
        id: 203,
        text: "Which strategy best supports dual language learners in the preschool classroom?",
        options: [
          { id: "a", text: "Speaking more slowly and loudly to ensure understanding" },
          { id: "b", text: "Including books, songs and materials that reflect their home language" },
          { id: "c", text: "Encouraging parents to only speak English at home" },
          { id: "d", text: "Separating children by language ability during group activities" }
        ],
        correctAnswer: "b",
        explanation: "Including books, songs, and materials that reflect a child's home language validates their cultural identity, supports continued development in their first language, and creates connections between languages.",
        points: 15,
        difficulty: 2
      },
      {
        id: 204,
        text: "What is the most effective approach to addressing challenging behavior in early childhood?",
        options: [
          { id: "a", text: "Implementing a consistent system of rewards and punishments" },
          { id: "b", text: "Removing privileges until behavior improves" },
          { id: "c", text: "Teaching social-emotional skills and problem-solving strategies" },
          { id: "d", text: "Using time-out consistently for all behavioral issues" }
        ],
        correctAnswer: "c",
        explanation: "Teaching social-emotional skills and problem-solving strategies addresses the root causes of challenging behavior and helps children develop important life skills rather than just managing symptoms.",
        points: 15,
        difficulty: 2
      },
      {
        id: 205,
        text: "Which assessment approach best aligns with developmentally appropriate practice in preschool?",
        options: [
          { id: "a", text: "Weekly testing to ensure children are meeting academic standards" },
          { id: "b", text: "Standardized assessments administered quarterly to measure progress" },
          { id: "c", text: "Comparing children's work to grade-level exemplars" },
          { id: "d", text: "Ongoing documentation of children's learning through observations and work samples" }
        ],
        correctAnswer: "d",
        explanation: "Ongoing documentation through observations and work samples provides authentic assessment of children's development and learning in context, supporting individualized planning and instruction.",
        points: 20,
        difficulty: 3
      }
    ]
  },
  {
    id: 3,
    name: "Curriculum & Planning",
    description: "Developing engaging learning experiences",
    color: "#FF9800",
    questions: [
      {
        id: 301,
        text: "When designing learning centers in an early childhood classroom, what is most important to consider?",
        options: [
          { id: "a", text: "That all children use each center every day" },
          { id: "b", text: "That activities reflect children's interests and developmental needs" },
          { id: "c", text: "That children remain quiet while working at centers" },
          { id: "d", text: "That centers focus primarily on academic skills" }
        ],
        correctAnswer: "b",
        explanation: "Effective learning centers reflect children's interests and developmental needs, making learning meaningful and engaging while supporting growth across domains.",
        points: 10,
        difficulty: 1
      },
      {
        id: 302,
        text: "What is the most appropriate way to integrate technology in an early childhood classroom?",
        options: [
          { id: "a", text: "Allowing children unlimited access to educational games and apps" },
          { id: "b", text: "Using technology to replace traditional hands-on activities" },
          { id: "c", text: "Using technology tools alongside other materials to enhance exploration of concepts" },
          { id: "d", text: "Focusing on teaching technical skills like coding and keyboarding" }
        ],
        correctAnswer: "c",
        explanation: "Using technology tools alongside other materials can enhance children's exploration and understanding of concepts when used intentionally as one of many learning tools.",
        points: 10,
        difficulty: 1
      },
      {
        id: 303,
        text: "When scaffolding children's learning during a science exploration, which teacher approach is most effective?",
        options: [
          { id: "a", text: "Asking open-ended questions that encourage children to test their ideas" },
          { id: "b", text: "Providing step-by-step instructions to ensure correct procedure" },
          { id: "c", text: "Demonstrating the correct method before children attempt it" },
          { id: "d", text: "Explaining scientific concepts using technical terminology" }
        ],
        correctAnswer: "a",
        explanation: "Open-ended questions encourage children to develop and test their own ideas, promoting critical thinking, problem-solving, and scientific inquiry skills.",
        points: 15,
        difficulty: 2
      },
      {
        id: 304,
        text: "Which approach to curriculum planning best supports inclusive practices?",
        options: [
          { id: "a", text: "Creating separate, specialized activities for children with different needs" },
          { id: "b", text: "Developing a standardized curriculum that all children will follow" },
          { id: "c", text: "Planning activities that can be adjusted to different levels and learning styles" },
          { id: "d", text: "Focusing on remediation for children who are behind developmental milestones" }
        ],
        correctAnswer: "c",
        explanation: "Planning activities that can be adjusted to different levels and learning styles supports Universal Design for Learning principles, allowing all children to participate meaningfully.",
        points: 15,
        difficulty: 2
      },
      {
        id: 305,
        text: "When developing inclusive environments for children with diverse abilities, which approach demonstrates the most current understanding of inclusion?",
        options: [
          { id: "a", text: "Creating separate, specialized activities for children with different needs" },
          { id: "b", text: "Focusing on remediating delays before including children in group activities" },
          { id: "c", text: "Adapting the environment and experiences so all children can participate meaningfully" },
          { id: "d", text: "Assigning peer buddies to assist children with disabilities" }
        ],
        correctAnswer: "c",
        explanation: "True inclusion involves adapting the environment and experiences so that all children can participate meaningfully, rather than expecting children to adapt to an inflexible environment or creating separate experiences.",
        points: 20,
        difficulty: 3
      }
    ]
  }
];

// Encouraging messages for correct answers
const successMessages = [
  "Excellent work! That's correct!",
  "Great job! You got it right!",
  "Outstanding! That's the right answer!",
  "Brilliant thinking! You're correct!",
  "Fantastic! You nailed it!"
];

// Encouraging messages for incorrect answers
const encouragementMessages = [
  "Not quite right. Let's learn from this!",
  "That's not correct, but it's how we learn and grow!",
  "Good try! Let's see the correct answer and learn together.",
  "Not this time, but keep going - you're making progress!",
  "That's not it, but remember: mistakes help us improve!"
];

const SimpleAssessment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Find the selected domain
  const domainData = domains.find(d => d.id === selectedDomain);
  
  // Select a random question from the domain's questions
  const selectRandomQuestion = () => {
    if (!domainData) return;
    
    // Get all available questions
    const availableQuestions = domainData.questions.filter(q => {
      // Don't repeat questions
      const questionHistory = JSON.parse(localStorage.getItem('questionHistory') || '[]');
      return !questionHistory.includes(q.id);
    });
    
    // If no questions available, complete the assessment
    if (availableQuestions.length === 0) {
      setIsComplete(true);
      return;
    }
    
    // Select a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    setCurrentQuestion(availableQuestions[randomIndex]);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };
  
  // Handle domain selection
  const handleDomainSelect = (domainId: number) => {
    // Reset state
    setSelectedDomain(domainId);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setTotalPoints(0);
    setIsComplete(false);
    setProgress(0);
    
    // Clear question history
    localStorage.setItem('questionHistory', JSON.stringify([]));
    
    // Select a question
    selectRandomQuestion();
  };
  
  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    // Check if answer is correct
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    // Update stats
    setQuestionsAnswered(prev => prev + 1);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      setTotalPoints(prev => prev + currentQuestion.points);
      
      // Play confetti effect for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    // Update progress
    const newProgress = Math.min(100, ((questionsAnswered + 1) / 5) * 100);
    setProgress(newProgress);
    
    // Add question to history
    const questionHistory = JSON.parse(localStorage.getItem('questionHistory') || '[]');
    questionHistory.push(currentQuestion.id);
    localStorage.setItem('questionHistory', JSON.stringify(questionHistory));
    
    // Check if assessment is complete (5 questions)
    if (questionsAnswered + 1 >= 5) {
      // Save results to server
      saveResults();
      setIsComplete(true);
    }
  };
  
  // Save results to server
  const saveResults = async () => {
    if (!user) return;
    
    try {
      // Calculate accuracy
      const accuracy = correctAnswers > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
      
      // Points to add (minimum 5 points for participating)
      const pointsToAdd = Math.max(5, totalPoints);
      
      // Save assessment results
      await axios.post('/api/assessments', {
        userId: user.id,
        domain: domainData?.name || 'General Knowledge',
        questionsAnswered,
        correctAnswers,
        accuracy,
        points: pointsToAdd,
        completedAt: new Date().toISOString()
      });
      
      // Update user points
      await axios.post('/api/users/points', {
        userId: user.id,
        points: pointsToAdd,
        source: 'assessment',
        description: `Completed ${domainData?.name} assessment`
      });
      
      toast({
        title: 'Assessment Complete!',
        description: `You've earned ${pointsToAdd} points!`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving assessment results:', error);
      
      // Still show success message even if server save fails
      toast({
        title: 'Assessment Complete!',
        description: 'Your results have been recorded.',
        variant: 'default'
      });
    }
  };
  
  // Continue to next question
  const handleContinue = () => {
    if (isComplete) {
      // Return to dashboard
      navigate('/dashboard');
    } else {
      // Go to next question
      selectRandomQuestion();
    }
  };
  
  // Get random message based on answer correctness
  const getMessage = () => {
    const messages = isCorrect ? successMessages : encouragementMessages;
    const messageIndex = Math.floor(Math.random() * messages.length);
    return messages[messageIndex];
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Knowledge Assessment</h1>
      
      {!selectedDomain ? (
        // Domain selection
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {domains.map(domain => (
            <Card 
              key={domain.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderTop: `4px solid ${domain.color}` }}
              onClick={() => handleDomainSelect(domain.id)}
            >
              <CardHeader>
                <CardTitle>{domain.name}</CardTitle>
                <CardDescription>{domain.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {domain.questions.length} questions
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isComplete ? (
        // Assessment complete
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500 h-6 w-6" />
              <CardTitle>Assessment Complete!</CardTitle>
            </div>
            <CardDescription>
              Well done on completing the {domainData?.name} assessment!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold">{questionsAnswered}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-2xl font-bold">{correctAnswers}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Your Performance
              </h3>
              <p className="mb-2">
                Accuracy: <span className="font-medium">{Math.round((correctAnswers / questionsAnswered) * 100)}%</span>
              </p>
              {correctAnswers / questionsAnswered >= 0.8 ? (
                <p className="text-green-600">Excellent! You have a strong understanding of this topic.</p>
              ) : correctAnswers / questionsAnswered >= 0.6 ? (
                <p className="text-blue-600">Good work! You have a solid foundation in this area.</p>
              ) : (
                <p className="text-amber-600">Consider reviewing this topic for better understanding.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t">
            <Button onClick={handleContinue} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      ) : currentQuestion ? (
        // Question display
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{domainData?.name}</h2>
            <div className="text-sm">
              Question {questionsAnswered + 1} of 5
            </div>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isAnswered ? (
                <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
                  {currentQuestion.options.map(option => (
                    <div key={option.id} className="flex items-center space-x-2 mb-3 p-2 rounded-md hover:bg-gray-50">
                      <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                      <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div>
                  {/* Feedback display */}
                  <div className={`p-4 mb-4 rounded-md ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 ${isCorrect ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {isCorrect ? (
                          <ThumbsUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <Lightbulb className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-1">{getMessage()}</p>
                        <p className="text-sm">
                          {isCorrect ? 
                            `You earned ${currentQuestion.points} points!` : 
                            `The correct answer is: ${currentQuestion.options.find(o => o.id === currentQuestion.correctAnswer)?.text}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-medium flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-blue-600" />
                      Explanation
                    </h3>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              {!isAnswered ? (
                <Button 
                  onClick={handleAnswerSubmit} 
                  disabled={!selectedAnswer} 
                  className="w-full"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button 
                  onClick={handleContinue} 
                  className="w-full"
                >
                  Continue
                </Button>
              )}
            </CardFooter>
          </Card>
        </>
      ) : (
        <p>Loading questions...</p>
      )}
    </div>
  );
};

export default SimpleAssessment;