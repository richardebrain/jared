import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import * as assessmentService from '@/services/assessmentService';

interface AssessmentState {
  assessmentId: number | null;
  currentQuestion: assessmentService.QuestionResponse | null;
  history: assessmentService.AssessmentHistoryItem[];
  selectedAnswer: string | null;
  answerResult: assessmentService.AnswerResult | null;
  learningPath: assessmentService.LearningPathResponse | null;
  loading: boolean;
  completed: boolean;
  startTime: number | null;
}

const EnhancedAssessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState<AssessmentState>({
    assessmentId: null,
    currentQuestion: null,
    history: [],
    selectedAnswer: null,
    answerResult: null,
    learningPath: null,
    loading: true,
    completed: false,
    startTime: null
  });

  // Sound effects for feedback
  const correctSound = new Audio("/sounds/correct-answer.mp3");
  const incorrectSound = new Audio("/sounds/incorrect-answer.mp3");
  const completionSound = new Audio("/sounds/assessment-complete.mp3");

  // Start assessment when component mounts
  useEffect(() => {
    startAssessment();
  }, []);

  // Start a new assessment
  const startAssessment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to take the assessment.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await assessmentService.startAssessment(user.id);
      
      setState(prev => ({ 
        ...prev, 
        assessmentId: result.assessment_id,
        history: [],
        answerResult: null,
        learningPath: null,
        completed: false,
        loading: false
      }));
      
      // Get first question
      await getNextQuestion(result.assessment_id, []);
    } catch (error) {
      console.error("Error starting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Get the next question
  const getNextQuestion = async (assessmentId: number, history: assessmentService.AssessmentHistoryItem[]) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const question = await assessmentService.getNextQuestion(assessmentId, history);
      
      setState(prev => ({ 
        ...prev, 
        currentQuestion: question,
        selectedAnswer: null,
        answerResult: null,
        loading: false,
        startTime: Date.now()
      }));
    } catch (error: any) {
      console.error("Error getting next question:", error);
      
      // Check if this is the "All sections completed" message (status 200)
      if (error.message && error.message.includes("All sections completed")) {
        finishAssessment();
        return;
      }

      toast({
        title: "Error",
        description: "Failed to get the next question. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Submit an answer
  const submitAnswer = async (answer: string) => {
    if (!state.assessmentId || !state.currentQuestion) return;

    setState(prev => ({ 
      ...prev, 
      selectedAnswer: answer,
      loading: true 
    }));

    const timeTaken = state.startTime ? Date.now() - state.startTime : undefined;
    
    try {
      const result = await assessmentService.submitAnswer(
        state.assessmentId, 
        state.currentQuestion.id, 
        answer,
        timeTaken
      );

      // Play sound based on result
      if (result.is_correct) {
        correctSound.play();
      } else {
        incorrectSound.play();
      }

      setState(prev => ({ 
        ...prev, 
        answerResult: result,
        loading: false
      }));

      // Add to history
      const historyItem: assessmentService.AssessmentHistoryItem = {
        question_id: state.currentQuestion.id,
        domain: state.currentQuestion.domain,
        difficulty: state.currentQuestion.difficulty,
        correct: result.is_correct
      };

      // Update history
      const updatedHistory = [...state.history, historyItem];
      setState(prev => ({ ...prev, history: updatedHistory }));

      // Automatically move to next question after delay
      setTimeout(() => {
        getNextQuestion(state.assessmentId!, updatedHistory);
      }, 3000);

    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Finish the assessment
  const finishAssessment = async () => {
    if (!state.assessmentId) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await assessmentService.finishAssessment(state.assessmentId);
      
      // Play completion sound
      completionSound.play();

      setState(prev => ({ 
        ...prev, 
        learningPath: result,
        completed: true,
        loading: false
      }));

      // Award points for completing the assessment
      // This should be handled by the backend in a production app
      // Here we're just showing a toast for demonstration
      toast({
        title: "Assessment Completed! +10 points",
        description: "Great job completing the assessment! You've earned 10 points.",
        variant: "default",
      });

    } catch (error) {
      console.error("Error finishing assessment:", error);
      toast({
        title: "Error",
        description: "Failed to complete the assessment. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // View assessment results and learning path
  const viewResults = () => {
    // In a real app, this would navigate to a detailed results page
    navigate('/dashboard');
  };

  // Render functions
  const renderQuestion = () => {
    const { currentQuestion, selectedAnswer, answerResult, loading } = state;
    
    if (!currentQuestion) return null;
    
    return (
      <Card className="p-6 shadow-lg max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {currentQuestion.domain}
          </span>
          <span className="text-sm font-medium bg-secondary/10 text-secondary px-3 py-1 rounded-full">
            Difficulty: {currentQuestion.difficulty}
          </span>
        </div>
        
        <h2 className="text-xl font-bold mb-6">{currentQuestion.question}</h2>
        
        <div className="space-y-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => (
            <Button
              key={key}
              variant={selectedAnswer === key ? "default" : "outline"}
              className={`w-full justify-start text-left p-4 h-auto ${
                answerResult && answerResult.correct_answer === key
                  ? "border-green-500 bg-green-50"
                  : answerResult && selectedAnswer === key && selectedAnswer !== answerResult.correct_answer
                  ? "border-red-500 bg-red-50"
                  : ""
              }`}
              disabled={loading || selectedAnswer !== null}
              onClick={() => submitAnswer(key)}
            >
              <span className="font-semibold mr-2">{key}.</span> {value}
              {answerResult && answerResult.correct_answer === key && (
                <CheckCircle className="ml-auto text-green-500" />
              )}
              {answerResult && selectedAnswer === key && selectedAnswer !== answerResult.correct_answer && (
                <XCircle className="ml-auto text-red-500" />
              )}
            </Button>
          ))}
        </div>
        
        {answerResult && (
          <div className={`mt-6 p-4 rounded-md ${
            answerResult.is_correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <h3 className={`font-bold ${
              answerResult.is_correct ? "text-green-700" : "text-red-700"
            }`}>
              {answerResult.is_correct 
                ? "Correct!" 
                : `Incorrect. The correct answer is ${answerResult.correct_answer}.`}
            </h3>
            <p className="mt-2">{answerResult.explanation}</p>
            
            {answerResult.extended_content && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <details>
                  <summary className="font-medium cursor-pointer">Learn More</summary>
                  <div className="mt-2 space-y-2">
                    {Object.entries(answerResult.extended_content).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="font-medium capitalize">{key.replace(/_/g, ' ')}</h4>
                        <p className="text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderCompletionScreen = () => {
    const { learningPath } = state;
    
    if (!learningPath) return null;
    
    return (
      <Card className="p-6 shadow-lg max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Assessment Completed!</h2>
          <p className="text-muted-foreground">
            You answered {learningPath.questions_correct} out of {learningPath.questions_asked} questions correctly.
          </p>
        </div>
        
        <Separator className="my-4" />
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Your Strengths and Areas for Growth</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 border rounded-md bg-green-50">
              <span className="block text-sm font-medium text-muted-foreground">Strongest Area</span>
              <span className="font-semibold">{learningPath.strongest_domain}</span>
            </div>
            <div className="p-3 border rounded-md bg-amber-50">
              <span className="block text-sm font-medium text-muted-foreground">Area for Growth</span>
              <span className="font-semibold">{learningPath.weakest_domain}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Recommended Learning Path</h3>
          <div className="space-y-2">
            {learningPath.learning_path.recommended_modules.map((module, index) => (
              <div key={index} className="p-3 border rounded-md flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                  {index + 1}
                </div>
                <span>{module}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
          <div className="space-y-2">
            {learningPath.learning_path.focus_areas.map((area, index) => (
              <div key={index} className="p-3 border rounded-md">
                {area}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={viewResults} size="lg">
            Take Me to My Learning Dashboard
          </Button>
        </div>
      </Card>
    );
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (state.loading) {
    return renderLoading();
  }

  if (state.completed) {
    return renderCompletionScreen();
  }

  return renderQuestion();
};

export default EnhancedAssessment;