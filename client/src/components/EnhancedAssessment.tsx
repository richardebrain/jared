import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "wouter";
import { 
  startAssessment, 
  getNextQuestion, 
  submitAnswer, 
  finishAssessment,
  type Question,
  type AnswerResult,
  type AssessmentHistoryItem,
  type AssessmentResult
} from "@/services/assessmentService";

// Sound effects URLs
const correctSoundUrl = "/sounds/correct.mp3";
const incorrectSoundUrl = "/sounds/incorrect.mp3";
const completeSoundUrl = "/sounds/complete.mp3";

const EnhancedAssessment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Assessment state
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExtendedContent, setShowExtendedContent] = useState(false);
  
  // Timer state
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  
  // Sound effect references
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);
  const completeSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize sounds
  useEffect(() => {
    correctSoundRef.current = new Audio(correctSoundUrl);
    incorrectSoundRef.current = new Audio(incorrectSoundUrl);
    completeSoundRef.current = new Audio(completeSoundUrl);
  }, []);

  // Start the assessment when component mounts
  useEffect(() => {
    if (user) {
      initAssessment();
    }
  }, [user]);

  // Handle assessment initialization
  const initAssessment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to take the assessment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await startAssessment(user.id);
      setAssessmentId(response.assessment_id);
      await loadNextQuestion(response.assessment_id, []);
    } catch (error) {
      console.error("Failed to start assessment:", error);
      toast({
        title: "Error",
        description: "Failed to start the assessment. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load the next question
  const loadNextQuestion = async (assessmentId: number, history: AssessmentHistoryItem[]) => {
    try {
      setIsLoading(true);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setAnswerSubmitted(false);
      setShowExtendedContent(false);
      
      const question = await getNextQuestion(assessmentId, history);
      
      if (!question) {
        // Assessment is complete
        completeAssessment();
        return;
      }
      
      setCurrentQuestion(question);
      setTimeStarted(Date.now());
    } catch (error) {
      console.error("Failed to load next question:", error);
      toast({
        title: "Error",
        description: "Failed to load the next question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submitting an answer
  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !assessmentId || !currentQuestion || answerSubmitted) return;
    
    const timeTaken = timeStarted ? Date.now() - timeStarted : 0;
    
    try {
      setIsLoading(true);
      const result = await submitAnswer(assessmentId, {
        question_id: currentQuestion.id,
        user_answer: selectedAnswer,
        time_taken_ms: timeTaken
      });
      
      setAnswerResult(result);
      setAnswerSubmitted(true);
      
      // Play sound effect
      if (result.is_correct) {
        correctSoundRef.current?.play();
      } else {
        incorrectSoundRef.current?.play();
      }
      
      // Add to history
      const historyItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: result.is_correct,
        difficulty: currentQuestion.difficulty
      };
      
      setHistory(prev => [...prev, historyItem]);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle completing the assessment
  const completeAssessment = async () => {
    if (!assessmentId) return;
    
    try {
      setIsLoading(true);
      const result = await finishAssessment(assessmentId);
      
      setAssessmentResult(result);
      setAssessmentComplete(true);
      
      // Play completion sound
      completeSoundRef.current?.play();
      
      // Award points for completing assessment
      // This would be handled by the backend as well
      
      toast({
        title: "Assessment Complete!",
        description: `Great job! You answered ${result.questions_correct} out of ${result.questions_asked} questions correctly.`,
      });
    } catch (error) {
      console.error("Failed to complete assessment:", error);
      toast({
        title: "Error",
        description: "Failed to complete the assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Proceed to the next question
  const handleNextQuestion = () => {
    if (!assessmentId) return;
    loadNextQuestion(assessmentId, history);
  };

  // View assessment results
  const handleViewResults = () => {
    navigate("/assessment-results");
  };

  // Render the progress indicator
  const renderProgress = () => {
    if (!assessmentComplete) {
      const correctCount = history.filter(item => item.correct).length;
      return (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Questions: {history.length}</span>
            <span className="text-sm text-muted-foreground">Correct: {correctCount}</span>
          </div>
          <Progress value={(correctCount / Math.max(1, history.length)) * 100} className="h-2" />
        </div>
      );
    }
    return null;
  };

  // Generate personalized feedback
  const getPersonalizedFeedback = () => {
    if (!answerResult || !user) return "";
    
    if (answerResult.is_correct) {
      const praises = [
        `Great job, ${user.firstName}!`,
        `Excellent work, ${user.firstName}!`,
        `You're right, ${user.firstName}!`,
        `Well done, ${user.firstName}!`,
        `Fantastic, ${user.firstName}!`
      ];
      return praises[Math.floor(Math.random() * praises.length)];
    } else {
      const encouragements = [
        `Not quite, ${user.firstName}, but that's okay!`,
        `Let's review this one, ${user.firstName}.`,
        `Keep going, ${user.firstName}, you're still learning!`,
        `That's not correct, ${user.firstName}, but let's learn why.`,
        `Don't worry, ${user.firstName}, learning is a journey!`
      ];
      return encouragements[Math.floor(Math.random() * encouragements.length)];
    }
  };

  // Render the assessment completion screen
  if (assessmentComplete && assessmentResult) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-primary/10 border-b">
          <CardTitle className="text-2xl text-center">Assessment Complete!</CardTitle>
          <CardDescription className="text-center">
            Congratulations on completing your assessment!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Your Results</h3>
            <p className="mb-4">
              You answered <span className="font-bold text-primary">{assessmentResult.questions_correct}</span> out 
              of <span className="font-bold">{assessmentResult.questions_asked}</span> questions correctly!
            </p>
            <div className="mb-4">
              <Progress 
                value={(assessmentResult.questions_correct / assessmentResult.questions_asked) * 100} 
                className="h-3"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Strengths and Areas for Growth</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Strongest Area</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{assessmentResult.strongest_domain}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 dark:bg-amber-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Area for Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{assessmentResult.weakest_domain}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recommended Learning Path</h3>
            <div className="space-y-2">
              {assessmentResult.learning_path.recommended_modules.map((module, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="p-3 bg-muted rounded-md flex-grow">
                    {module}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {assessmentResult.learning_path.focus_areas.map((area, index) => (
                <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <Button onClick={handleViewResults} size="lg">
            View Detailed Results
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render the question card
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="bg-primary/10 border-b">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="px-3 py-1">
            {currentQuestion?.domain || "Loading..."}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Difficulty: {currentQuestion?.difficulty || 1}
          </Badge>
        </div>
        <CardTitle className="text-xl">Assessment Question</CardTitle>
        {renderProgress()}
      </CardHeader>
      
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {currentQuestion && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-md border-2 cursor-pointer transition-colors ${
                        selectedAnswer === key 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-muted-foreground"
                      } ${
                        answerSubmitted && answerResult
                          ? answerResult.correct_answer === key
                            ? "bg-green-100 dark:bg-green-900/20 border-green-500"
                            : selectedAnswer === key && answerResult.correct_answer !== key
                              ? "bg-red-100 dark:bg-red-900/20 border-red-500"
                              : ""
                          : ""
                      }`}
                      onClick={() => !answerSubmitted && setSelectedAnswer(key)}
                    >
                      <div className="flex gap-3 items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedAnswer === key 
                            ? "bg-primary text-white" 
                            : "bg-muted"
                        }`}>
                          {key}
                        </div>
                        <div>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {answerSubmitted && answerResult && (
                  <div className={`p-4 rounded-md ${
                    answerResult.is_correct 
                      ? "bg-green-100 dark:bg-green-900/20 border border-green-500" 
                      : "bg-red-100 dark:bg-red-900/20 border border-red-500"
                  }`}>
                    <h4 className="font-bold mb-2">{getPersonalizedFeedback()}</h4>
                    <p>{answerResult.explanation}</p>
                    
                    {answerResult.extended_content && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowExtendedContent(!showExtendedContent)}
                          className="w-full"
                        >
                          {showExtendedContent ? "Hide" : "Show"} Additional Information
                        </Button>
                        
                        {showExtendedContent && (
                          <div className="mt-4 space-y-4">
                            {answerResult.extended_content.story_why && (
                              <div>
                                <h5 className="font-bold mb-1">Why This Matters:</h5>
                                <p>{answerResult.extended_content.story_why}</p>
                              </div>
                            )}
                            
                            {answerResult.extended_content.implementation_how && (
                              <div>
                                <h5 className="font-bold mb-1">How To Implement:</h5>
                                <p>{answerResult.extended_content.implementation_how}</p>
                              </div>
                            )}
                            
                            {answerResult.extended_content.science_behind_it && (
                              <div>
                                <h5 className="font-bold mb-1">The Science Behind It:</h5>
                                <p>{answerResult.extended_content.science_behind_it}</p>
                              </div>
                            )}
                            
                            {answerResult.extended_content.practical_application && (
                              <div>
                                <h5 className="font-bold mb-1">Practical Application:</h5>
                                <p>{answerResult.extended_content.practical_application}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        {!answerSubmitted ? (
          <Button 
            onClick={handleAnswerSubmit} 
            disabled={!selectedAnswer || isLoading}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={handleNextQuestion}
            disabled={isLoading}
            className="w-full"
          >
            Next Question
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EnhancedAssessment;