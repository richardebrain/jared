import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfettiExplosion from 'react-confetti-explosion';

import { Check, Info, Star, ArrowRight, BookOpen, Lightbulb, FileText, Brain, Award } from "lucide-react";

import { 
  AssessmentQuestion, 
  fallbackQuestions,
  loadQuestionsFromServer,
  getSampleQuestions,
  getAdaptiveQuestions,
  analyzePerformanceByDomain
} from '@/utils/questionLoader';

// Component props
interface EnhancedAIAssessmentProps {
  onComplete?: (score: number, totalPoints: number, domainAnalysis: any) => void;
  onCancel?: () => void;
  maxQuestions?: number;
  adaptiveMode?: boolean;
  previousPerformance?: number;
  userName?: string;
}

// Define domain colors for visualization
const domainColors: Record<string, string> = {
  "Child Development": "bg-blue-500",
  "Cognitive Development": "bg-purple-500",
  "Social-Emotional Development": "bg-pink-500",
  "Physical Development": "bg-green-500",
  "Language Development": "bg-yellow-500",
  "Educational Theory": "bg-indigo-500",
  "Classroom Management": "bg-red-500",
  "Learning Environment": "bg-teal-500",
  "Family Engagement": "bg-orange-500",
  "Assessment": "bg-violet-500",
  "Curriculum": "bg-emerald-500",
  "DAP": "bg-cyan-500",
  "Special Needs": "bg-rose-500",
  "Health and Safety": "bg-amber-500",
};

// Domain icons mapping
const domainIcons: Record<string, React.ReactNode> = {
  "Child Development": <Brain className="h-4 w-4" />,
  "Cognitive Development": <Brain className="h-4 w-4" />,
  "Social-Emotional Development": <Award className="h-4 w-4" />,
  "Educational Theory": <BookOpen className="h-4 w-4" />,
  "Classroom Management": <FileText className="h-4 w-4" />,
  "Learning Environment": <Lightbulb className="h-4 w-4" />,
};

const EnhancedAIAssessment: React.FC<EnhancedAIAssessmentProps> = ({ 
  onComplete, 
  onCancel,
  maxQuestions = 10,
  adaptiveMode = false,
  previousPerformance = 0.5,
  userName = ''
}) => {
  // State variables
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showExplanationDetails, setShowExplanationDetails] = useState(false);
  const [detailTab, setDetailTab] = useState("explanation");
  const [lastCompliments, setLastCompliments] = useState<string[]>([]);
  const [savedResults, setSavedResults] = useState<{
    date: string;
    score: number;
    totalPoints: number;
    correctAnswers: number;
    totalQuestions: number;
  }[]>([]);
  
  // Sound effect for correct answers
  const correctSound = new Audio('/sounds/correct.mp3');
  const wrongSound = new Audio('/sounds/wrong.mp3');
  const completionSound = new Audio('/sounds/completion.mp3');
  
  // Load questions from the server
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        // Get questions from server
        const allQuestions = await loadQuestionsFromServer();
        
        // Select questions based on mode
        let selectedQuestions;
        if (adaptiveMode && previousPerformance !== undefined) {
          selectedQuestions = getAdaptiveQuestions(allQuestions, previousPerformance, maxQuestions);
        } else {
          selectedQuestions = getSampleQuestions(allQuestions, maxQuestions);
        }
        
        setQuestions(selectedQuestions);
        
        // Calculate total possible points
        const total = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
        setTotalPoints(total);
      } catch (error) {
        console.error("Error loading questions:", error);
        // Use fallback questions if server request fails
        const selectedQuestions = getSampleQuestions(fallbackQuestions, maxQuestions);
        setQuestions(selectedQuestions);
        
        // Calculate total possible points for fallback questions
        const total = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
        setTotalPoints(total);
      }
      setIsLoading(false);
    };
    
    fetchQuestions();
    
    // Load any saved assessment results from localStorage
    const loadSavedResults = () => {
      try {
        const savedData = localStorage.getItem('assessmentResults');
        if (savedData) {
          setSavedResults(JSON.parse(savedData));
        }
      } catch (error) {
        console.error("Error loading saved results:", error);
      }
    };
    
    loadSavedResults();
  }, [maxQuestions, adaptiveMode, previousPerformance]);
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Handle option selection
  const handleOptionChange = (optionId: string) => {
    if (!isSubmitted) {
      setSelectedOption(optionId);
    }
  };
  
  // Generate a personalized compliment
  const getPersonalizedCompliment = () => {
    const compliments = [
      `Amazing work${userName ? ', ' + userName : ''}! You're a natural educator!`,
      `Excellent choice${userName ? ', ' + userName : ''}! Your knowledge is impressive!`,
      `Well done${userName ? ', ' + userName : ''}! You clearly understand this concept!`,
      `That's right${userName ? ', ' + userName : ''}! Your ECE knowledge is shining through!`,
      `Perfect${userName ? ', ' + userName : ''}! You're rocking this assessment!`,
      `Spot on${userName ? ', ' + userName : ''}! You're demonstrating excellent understanding!`,
      `You got it${userName ? ', ' + userName : ''}! Keep up the great work!`,
      `Brilliant${userName ? ', ' + userName : ''}! Your expertise is showing!`,
      `Fantastic${userName ? ', ' + userName : ''}! That's exactly right!`,
      `You're crushing it${userName ? ', ' + userName : ''}! Great job!`
    ];
    
    // Filter out recently used compliments to avoid repetition
    const availableCompliments = compliments.filter(c => !lastCompliments.includes(c));
    
    // If we've used up all compliments, reset the list
    if (availableCompliments.length === 0) {
      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
      setLastCompliments([randomCompliment]);
      return randomCompliment;
    }
    
    // Pick a random compliment from the available ones
    const randomIndex = Math.floor(Math.random() * availableCompliments.length);
    const selectedCompliment = availableCompliments[randomIndex];
    
    // Update the list of last used compliments (keep last 3)
    setLastCompliments(prev => {
      const updated = [...prev, selectedCompliment];
      if (updated.length > 3) {
        return updated.slice(1);
      }
      return updated;
    });
    
    return selectedCompliment;
  };
  
  // Handle answer submission
  const handleSubmit = () => {
    if (!selectedOption || isSubmitted || !currentQuestion) return;
    
    const isAnswerCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setIsSubmitted(true);
    
    // Update score if correct
    if (isAnswerCorrect) {
      setScore(prevScore => prevScore + currentQuestion.points);
      // Play correct sound
      try {
        correctSound.play();
      } catch (e) {
        console.log("Error playing sound:", e);
      }
    } else {
      // Play wrong sound
      try {
        wrongSound.play();
      } catch (e) {
        console.log("Error playing sound:", e);
      }
    }
    
    // Save user's answer
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedOption
    }));
  };
  
  // Handle moving to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowExplanationDetails(false);
    } else {
      setIsCompleted(true);
      setIsExploding(true);
      
      // Play completion sound
      try {
        completionSound.play();
      } catch (e) {
        console.log("Error playing completion sound:", e);
      }
      
      // Analyze domain performance
      const domainAnalysis = analyzePerformanceByDomain(questions, userAnswers);
      
      // Save results to localStorage
      const newResult = {
        date: new Date().toISOString(),
        score,
        totalPoints,
        correctAnswers: Object.values(userAnswers).filter((answer, index) => 
          answer === questions[index].correctAnswer
        ).length,
        totalQuestions: questions.length
      };
      
      try {
        const currentResults = localStorage.getItem('assessmentResults');
        let updatedResults = currentResults ? JSON.parse(currentResults) : [];
        updatedResults = [newResult, ...updatedResults].slice(0, 10); // Keep last 10 results
        localStorage.setItem('assessmentResults', JSON.stringify(updatedResults));
        setSavedResults(updatedResults);
      } catch (error) {
        console.error("Error saving results:", error);
      }
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(score, totalPoints, domainAnalysis);
      }
    }
  };
  
  // Handle showing detailed explanation
  const handleShowDetails = () => {
    setShowExplanationDetails(!showExplanationDetails);
  };
  
  // Calculate progress
  const progress = (currentQuestionIndex / questions.length) * 100;
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Assessment...</h2>
            <p className="text-gray-500">Preparing your personalized questions</p>
          </div>
        </Card>
      </div>
    );
  }
  
  // No questions available
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
            <p className="text-gray-500 mb-6">We couldn't load any questions at this time. Please try again later.</p>
            <Button onClick={handleCancel}>Return to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Assessment completed state
  if (isCompleted) {
    // Calculate domain performance for visualization
    const domainAnalysis = analyzePerformanceByDomain(questions, userAnswers);
    
    // Sort domains by performance (worst to best)
    const sortedDomains = Object.entries(domainAnalysis)
      .sort(([, a], [, b]) => a.percentage - b.percentage);
      
    // Determine strengths and areas for improvement
    const strengths = sortedDomains
      .filter(([, stats]) => stats.percentage >= 70)
      .map(([domain]) => domain);
      
    const improvements = sortedDomains
      .filter(([, stats]) => stats.percentage < 70)
      .map(([domain]) => domain);
    
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl p-6">
          <div className="relative mb-8">
            {isExploding && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <ConfettiExplosion />
              </div>
            )}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
              <p className="text-xl mb-4">
                Your score: {score} out of {totalPoints} points
                ({Math.round((score / totalPoints) * 100)}%)
              </p>
              <p className="text-lg text-green-600 font-semibold mb-6">
                {score === totalPoints 
                  ? "Perfect score! Amazing work!" 
                  : score >= totalPoints * 0.8 
                    ? "Excellent work! You've shown great understanding!" 
                    : score >= totalPoints * 0.6 
                      ? "Good job! Keep learning and improving." 
                      : "You've completed the assessment. Keep studying to improve your score."}
              </p>
            </div>
          </div>
          
          {/* Domain Performance Visualization */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Performance by Domain</h3>
            <div className="space-y-4">
              {Object.entries(domainAnalysis).map(([domain, stats]) => (
                <div key={domain} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full ${domainColors[domain] || 'bg-gray-500'} mr-2`}></span>
                      <span className="text-sm font-medium">{domain}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.correct}/{stats.total} ({Math.round(stats.percentage)}%)
                    </span>
                  </div>
                  <Progress 
                    value={stats.percentage} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center text-green-600">
                <Star className="h-5 w-5 mr-2" />
                Your Strengths
              </h3>
              {strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.map(domain => (
                    <li key={domain} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium">{domain}</span>
                        <p className="text-sm text-gray-600">
                          {getDomainDescription(domain)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  Keep practicing! With more study, your strengths will emerge in these areas.
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center text-orange-600">
                <Lightbulb className="h-5 w-5 mr-2" />
                Areas for Growth
              </h3>
              {improvements.length > 0 ? (
                <ul className="space-y-2">
                  {improvements.map(domain => (
                    <li key={domain} className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium">{domain}</span>
                        <p className="text-sm text-gray-600">
                          {getImprovementTip(domain)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  Excellent work! You demonstrated strong knowledge across all domains.
                </p>
              )}
            </div>
          </div>
          
          {/* Progress Over Time (if there are saved results) */}
          {savedResults.length > 1 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Your Progress Over Time</h3>
              <div className="h-64 relative">
                {/* Simple chart visualization */}
                <div className="flex h-full items-end space-x-2">
                  {savedResults.slice(0, 5).reverse().map((result, index) => {
                    const percentage = Math.round((result.score / result.totalPoints) * 100);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-primary rounded-t transition-all duration-500 ease-in-out" 
                          style={{ height: `${percentage}%` }}
                        ></div>
                        <div className="text-xs mt-2 text-center">
                          {new Date(result.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-medium">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <Button 
              onClick={handleCancel}
              className="flex-1"
              variant="outline"
            >
              Return to Dashboard
            </Button>
            <Button 
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedOption(null);
                setIsSubmitted(false);
                setIsCorrect(false);
                setScore(0);
                setUserAnswers({});
                setIsCompleted(false);
                setIsExploding(false);
                setShowExplanationDetails(false);
              }}
              className="flex-1"
            >
              Start New Assessment
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Main assessment UI
  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6">
          {/* Assessment Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">AI Assessment</h2>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Domain and Point Value */}
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="flex items-center px-3 py-1 bg-blue-50">
              {domainIcons[currentQuestion.domain] || <BookOpen className="h-4 w-4 mr-1" />}
              <span className="ml-1">{currentQuestion.domain}</span>
            </Badge>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2 bg-purple-50">
                Level {currentQuestion.difficulty}
              </Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                {currentQuestion.points} points
              </Badge>
            </div>
          </div>
          
          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.text}</h3>
            
            <RadioGroup value={selectedOption || ""} className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div 
                  key={option.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSubmitted ? (
                      option.id === currentQuestion.correctAnswer 
                        ? 'bg-green-50 border-green-200' 
                        : option.id === selectedOption 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-white'
                    ) : (
                      option.id === selectedOption 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    )
                  }`}
                  onClick={() => handleOptionChange(option.id)}
                >
                  <RadioGroupItem 
                    value={option.id} 
                    id={`option-${option.id}`} 
                    disabled={isSubmitted}
                  />
                  <Label 
                    htmlFor={`option-${option.id}`}
                    className={`flex-grow cursor-pointer ${
                      isSubmitted && option.id === currentQuestion.correctAnswer 
                        ? 'font-medium text-green-900' 
                        : isSubmitted && option.id === selectedOption && option.id !== currentQuestion.correctAnswer 
                          ? 'text-red-900'
                          : ''
                    }`}
                  >
                    <span className="font-medium mr-2">{option.id}:</span>
                    {option.text}
                  </Label>
                  {isSubmitted && option.id === currentQuestion.correctAnswer && (
                    <Check className="h-5 w-5 text-green-600 ml-2" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Feedback Area */}
          {isSubmitted && (
            <div className={`mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-amber-50'}`}>
              <h4 className={`font-bold text-lg mb-2 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                {isCorrect 
                  ? getPersonalizedCompliment()
                  : `Not quite right${userName ? ', ' + userName : ''}. Let's learn why!`
                }
              </h4>
              <p className="mb-4">
                {currentQuestion.explanation}
              </p>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowDetails}
                  className="flex items-center"
                >
                  <Info className="h-4 w-4 mr-1" />
                  {showExplanationDetails ? 'Hide Details' : 'Learn More'}
                </Button>
                
                {isCorrect && (
                  <Badge className="bg-green-100 text-green-800">
                    +{currentQuestion.points} points
                  </Badge>
                )}
              </div>
              
              {/* Detailed Explanation */}
              {showExplanationDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Tabs value={detailTab} onValueChange={setDetailTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="explanation">Background</TabsTrigger>
                      <TabsTrigger value="practical">Practical Application</TabsTrigger>
                      <TabsTrigger value="story">Classroom Example</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="explanation" className="text-sm">
                      <h5 className="font-medium mb-2">The Science Behind It</h5>
                      <p>{currentQuestion.scienceExplanation || "Additional information not available for this question."}</p>
                    </TabsContent>
                    
                    <TabsContent value="practical" className="text-sm">
                      <h5 className="font-medium mb-2">Practical Application</h5>
                      <p>{currentQuestion.practicalApplication || "Practical application information not available for this question."}</p>
                    </TabsContent>
                    
                    <TabsContent value="story" className="text-sm">
                      <h5 className="font-medium mb-2">Classroom Story</h5>
                      <p>{currentQuestion.story || "Classroom story not available for this question."}</p>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <div className="space-x-2">
              {!isSubmitted && (
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                >
                  Submit Answer
                </Button>
              )}
              {isSubmitted && (
                <Button 
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions for domain descriptions and improvement tips
function getDomainDescription(domain: string): string {
  const descriptions: Record<string, string> = {
    "Child Development": "You understand the stages and milestones of early childhood development.",
    "Cognitive Development": "You have strong knowledge of how children develop thinking and problem-solving skills.",
    "Social-Emotional Development": "You understand how children develop emotional regulation and social skills.",
    "Educational Theory": "You have a good grasp of the theoretical foundations of early childhood education.",
    "Learning Environment": "You know how to create effective learning spaces for young children.",
    "Classroom Management": "You demonstrate understanding of effective behavior management strategies.",
    "Assessment": "You understand how to observe and document children's learning.",
    "Curriculum": "You know how to plan and implement developmentally appropriate activities.",
    "DAP": "You understand developmentally appropriate practices for young children.",
  };
  
  return descriptions[domain] || "You showed good understanding in this area.";
}

function getImprovementTip(domain: string): string {
  const tips: Record<string, string> = {
    "Child Development": "Review key developmental milestones across different age groups.",
    "Cognitive Development": "Study Piaget's cognitive development stages and how they apply to classroom activities.",
    "Social-Emotional Development": "Focus on understanding attachment theory and emotional regulation strategies.",
    "Educational Theory": "Review theories by Vygotsky, Bronfenbrenner, and Gardner to deepen your understanding.",
    "Learning Environment": "Learn more about creating intentional classroom environments that support all learners.",
    "Classroom Management": "Study positive guidance techniques and proactive management strategies.",
    "Assessment": "Explore different observation methods and authentic assessment approaches.",
    "Curriculum": "Review curriculum planning principles and emergent curriculum approaches.",
    "DAP": "Deepen your understanding of developmentally appropriate practices across different domains.",
  };
  
  return tips[domain] || "Continue practicing and learning about this area.";
}

export default EnhancedAIAssessment;