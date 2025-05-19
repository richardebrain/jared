import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  finishAssessment,
  AssessmentQuestion,
  AnswerResult,
  AssessmentHistoryItem,
  LearningPathResponse
} from '@/services/assessmentService';

// Create audio elements for sound effects
const correctAnswerSound = new Audio('/sounds/correct-answer.mp3');
const wrongAnswerSound = new Audio('/sounds/wrong-answer.mp3');
const completionSound = new Audio('/sounds/assessment-complete.mp3');

interface EnhancedAssessmentProps {
  userId: number;
  onComplete?: (results: LearningPathResponse) => void;
  onPointsEarned?: (points: number) => void;
}

export const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({
  userId,
  onComplete,
  onPointsEarned
}) => {
  // Assessment state
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LearningPathResponse | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentTab, setCurrentTab] = useState('question');
  const [domainsCompleted, setDomainsCompleted] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();

  // Load assessment on component mount
  useEffect(() => {
    startNewAssessment();
  }, [userId]);

  // Start a new assessment
  const startNewAssessment = async () => {
    setIsLoading(true);
    setHistory([]);
    setResults(null);
    setIsComplete(false);
    setAnswerResult(null);
    
    try {
      const response = await startAssessment(userId);
      setAssessmentId(response.assessment_id);
      
      // Load first question
      const question = await getNextQuestion(response.assessment_id, []);
      setCurrentQuestion(question);
      setStartTime(Date.now());
      
      toast({
        title: 'Assessment started',
        description: 'Let\'s evaluate your early childhood education knowledge!',
      });
    } catch (error) {
      console.error('Failed to start assessment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to start assessment',
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  // Submit the answer
  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || !assessmentId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate time taken to answer
      const timeTakenMs = Date.now() - startTime;
      
      // Submit answer to API
      const result = await submitAnswer(assessmentId, {
        question_id: currentQuestion.id,
        user_answer: selectedOption,
        time_taken_ms: timeTakenMs
      });
      
      // Play sound effect
      if (result.is_correct) {
        correctAnswerSound.play().catch(e => console.log('Error playing sound:', e));
      } else {
        wrongAnswerSound.play().catch(e => console.log('Error playing sound:', e));
      }
      
      // Update answer result
      setAnswerResult(result);
      
      // Update history
      const historyItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: result.is_correct,
        difficulty: currentQuestion.difficulty
      };
      
      const newHistory = [...history, historyItem];
      setHistory(newHistory);
      
      // Update domains completed
      if (currentQuestion.domain) {
        const domainQuestions = newHistory.filter(item => item.domain === currentQuestion.domain);
        if (domainQuestions.length >= 10) {
          setDomainsCompleted(prev => ({
            ...prev,
            [currentQuestion.domain]: true
          }));
        }
      }
      
      // Switch to feedback tab
      setCurrentTab('feedback');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to submit answer',
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the next question
  const handleNextQuestion = async () => {
    if (!assessmentId) return;
    
    setIsLoading(true);
    setSelectedOption('');
    setAnswerResult(null);
    
    try {
      // Switch back to question tab
      setCurrentTab('question');
      
      // Get next question from API
      const question = await getNextQuestion(assessmentId, history);
      
      // If no more questions, finish assessment
      if (!question) {
        await handleFinishAssessment();
        return;
      }
      
      setCurrentQuestion(question);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to get next question:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to get next question',
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Finish the assessment
  const handleFinishAssessment = async () => {
    if (!assessmentId) return;
    
    setIsLoading(true);
    
    try {
      // Get results from API
      const finalResults = await finishAssessment(assessmentId);
      setResults(finalResults);
      setIsComplete(true);
      
      // Play completion sound
      completionSound.play().catch(e => console.log('Error playing sound:', e));
      
      // Calculate points earned (10 points for completing + 1 point per correct answer)
      const pointsEarned = 10 + finalResults.questions_correct;
      
      toast({
        title: 'Assessment completed!',
        description: `Great job! You've earned ${pointsEarned} points.`,
      });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(finalResults);
      }
      
      // Call onPointsEarned callback if provided
      if (onPointsEarned) {
        onPointsEarned(pointsEarned);
      }
    } catch (error) {
      console.error('Failed to finish assessment:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to complete assessment',
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading && !currentQuestion && !results) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <p>Loading assessment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render assessment complete view
  if (isComplete && results) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Assessment Complete!</CardTitle>
          <CardDescription className="text-center">
            You've completed the assessment. Here's your personalized learning path.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">Your Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Questions Attempted</p>
                  <p className="text-2xl font-bold">{results.questions_asked}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                  <p className="text-2xl font-bold">{results.questions_correct}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Domain Performance</h3>
              {Object.entries(results.domain_scores).map(([domain, score]) => (
                <div key={domain} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{domain}</span>
                    <span className="text-sm">{score.toFixed(1)}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Personalized Learning Path</h3>
              <div className="space-y-4">
                {Object.entries(results.learning_path).map(([domain, resources]) => (
                  <Card key={domain} className="overflow-hidden">
                    <CardHeader className="bg-muted py-3">
                      <CardTitle className="text-md">{domain}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ul className="divide-y">
                        {resources.map((resource, index) => (
                          <li key={index} className="p-4 flex items-center">
                            <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button onClick={startNewAssessment} variant="outline">
            Start New Assessment
          </Button>
          <Button onClick={() => onComplete && onComplete(results)}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render assessment in progress
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Enhanced Assessment</CardTitle>
          <div className="text-sm text-muted-foreground">
            Questions: {history.length}
          </div>
        </div>
        {currentQuestion && (
          <div className="flex items-center mt-2">
            <span className="text-sm font-medium mr-2">Domain:</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
              {currentQuestion.domain}
            </span>
            <span className="ml-4 text-sm font-medium mr-2">Difficulty:</span>
            <div className="flex">
              {[1, 2, 3, 4].map((level) => (
                <span 
                  key={level}
                  className={cn(
                    "h-2 w-2 rounded-full mx-0.5",
                    level <= currentQuestion.difficulty 
                      ? "bg-primary" 
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="question">Question</TabsTrigger>
          <TabsTrigger value="feedback" disabled={!answerResult}>Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="question">
          {currentQuestion && (
            <CardContent className="py-4">
              <div className="space-y-6">
                <div className="text-lg font-medium">
                  {currentQuestion.question}
                </div>
                
                <RadioGroup
                  value={selectedOption}
                  onValueChange={handleOptionSelect}
                  className="space-y-3"
                >
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`option-${key}`} />
                      <Label 
                        htmlFor={`option-${key}`}
                        className="flex-1 cursor-pointer py-2 px-1 rounded hover:bg-accent"
                      >
                        <span className="font-semibold mr-2">{key}.</span> {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          )}
          
          <CardFooter>
            <Button 
              className="w-full" 
              disabled={!selectedOption || isSubmitting}
              onClick={handleSubmitAnswer}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="feedback">
          {answerResult && (
            <CardContent className="py-4">
              <div className="space-y-6">
                <Alert variant={answerResult.is_correct ? "default" : "destructive"}>
                  <div className="flex items-center">
                    {answerResult.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <AlertTitle>
                      {answerResult.is_correct ? 'Correct!' : 'Incorrect'}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {answerResult.is_correct ? (
                      <p>Great job! Your answer is correct.</p>
                    ) : (
                      <p>The correct answer is: {answerResult.correct_answer}</p>
                    )}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Explanation</h3>
                  <p>{answerResult.explanation}</p>
                  
                  {answerResult.extended_content && (
                    <>
                      <Separator />
                      
                      <div className="space-y-4">
                        {answerResult.extended_content.teaching_explanation && (
                          <div>
                            <h4 className="font-semibold">Teaching Explanation</h4>
                            <p className="text-sm mt-1">{answerResult.extended_content.teaching_explanation}</p>
                          </div>
                        )}
                        
                        {answerResult.extended_content.story_why && (
                          <div>
                            <h4 className="font-semibold">Why This Matters</h4>
                            <p className="text-sm mt-1">{answerResult.extended_content.story_why}</p>
                          </div>
                        )}
                        
                        {answerResult.extended_content.implementation_how && (
                          <div>
                            <h4 className="font-semibold">How To Implement</h4>
                            <p className="text-sm mt-1">{answerResult.extended_content.implementation_how}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          )}
          
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleNextQuestion}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Next Question'}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};