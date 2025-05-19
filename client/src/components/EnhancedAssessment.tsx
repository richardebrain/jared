import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  startAssessment, 
  getNextQuestion, 
  submitAnswer, 
  finishAssessment,
  type Question,
  type AssessmentHistoryItem,
  type AnswerResult,
  type LearningPath
} from '../services/assessmentService';

// Sound effects
const correctAnswerSound = new Audio('/sounds/correct-answer.mp3');
const wrongAnswerSound = new Audio('/sounds/wrong-answer.mp3');
const completionSound = new Audio('/sounds/assessment-complete.mp3');

interface EnhancedAssessmentProps {
  userId: number;
  onComplete?: (results: LearningPath) => void;
}

const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({ userId, onComplete }) => {
  const { toast } = useToast();
  
  // Assessment state
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [questionHistory, setQuestionHistory] = useState<AssessmentHistoryItem[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState<boolean>(false);
  const [assessmentResults, setAssessmentResults] = useState<LearningPath | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [contentTab, setContentTab] = useState<string>('explanation');
  
  // Start the assessment
  useEffect(() => {
    const initAssessment = async () => {
      try {
        setLoading(true);
        const id = await startAssessment(userId);
        setAssessmentId(id);
        
        // Get the first question
        await loadNextQuestion(id, []);
      } catch (error) {
        console.error('Error initializing assessment:', error);
        toast({
          title: "Assessment Error",
          description: "Failed to start the assessment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && !assessmentId) {
      initAssessment();
    }
  }, [userId, toast]);
  
  // Load the next question
  const loadNextQuestion = async (id: number, history: AssessmentHistoryItem[]) => {
    try {
      setLoading(true);
      setSelectedAnswer(null);
      setAnswerResult(null);
      
      const result = await getNextQuestion(id, history);
      
      // Check if assessment is complete
      if ('complete' in result) {
        setAssessmentComplete(true);
        await handleAssessmentCompletion(id);
        return;
      }
      
      setCurrentQuestion(result);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error loading next question:', error);
      toast({
        title: "Question Error",
        description: "Failed to load the next question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle answer selection
  const handleAnswerSelect = async (answer: string) => {
    if (selectedAnswer || !assessmentId || !currentQuestion) return;
    
    try {
      setSelectedAnswer(answer);
      const timeTaken = Date.now() - questionStartTime;
      
      const result = await submitAnswer(assessmentId, currentQuestion.id, answer, timeTaken);
      setAnswerResult(result);
      
      // Play sound based on result
      if (result.is_correct) {
        correctAnswerSound.play();
      } else {
        wrongAnswerSound.play();
      }
      
      // Update question history
      const newHistoryItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: result.is_correct,
        difficulty: currentQuestion.difficulty
      };
      
      const updatedHistory = [...questionHistory, newHistoryItem];
      setQuestionHistory(updatedHistory);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Answer Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
      setSelectedAnswer(null);
    }
  };
  
  // Continue to next question
  const handleContinue = () => {
    if (assessmentId) {
      loadNextQuestion(assessmentId, questionHistory);
    }
  };
  
  // Handle assessment completion
  const handleAssessmentCompletion = async (id: number) => {
    try {
      setLoading(true);
      
      // Play completion sound
      completionSound.play();
      
      const results = await finishAssessment(id);
      setAssessmentResults(results);
      
      toast({
        title: "Assessment Complete!",
        description: "Your personalized learning path is ready.",
      });
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(results);
      }
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: "Completion Error",
        description: "Failed to complete the assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get a personalized compliment for correct answers
  const getPersonalizedCompliment = (): string => {
    const compliments = [
      "Great job!",
      "Amazing work!",
      "You're doing great!",
      "Fantastic answer!",
      "Excellent knowledge!",
      "You nailed it!",
      "Impressive understanding!",
      "Perfect response!",
      "Brilliant thinking!",
      "Wonderful answer!"
    ];
    
    return compliments[Math.floor(Math.random() * compliments.length)];
  };
  
  // Calculate progress through the assessment
  const calculateProgress = (): number => {
    // Aim for about 40 questions total (Core Values: 5, Mindful Morning: 5, Others: ~10 each)
    const estimatedTotalQuestions = 40;
    return Math.min(100, Math.round((questionHistory.length / estimatedTotalQuestions) * 100));
  };
  
  // Render assessment questions
  const renderQuestion = () => {
    if (loading && !currentQuestion) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (!currentQuestion) {
      return null;
    }
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{currentQuestion.domain}</span>
            <span className="text-sm text-muted-foreground">Difficulty: {currentQuestion.difficulty}</span>
          </CardTitle>
          <CardDescription>
            <Progress value={calculateProgress()} className="h-2 mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          
          <div className="grid gap-2">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedAnswer === key 
                  ? (answerResult?.is_correct ? "success" : "destructive") 
                  : selectedAnswer && answerResult?.correct_answer === key 
                    ? "outline" 
                    : "outline"
                }
                className={`justify-start text-left h-auto py-3 ${
                  selectedAnswer && answerResult?.correct_answer === key && answerResult?.correct_answer !== selectedAnswer
                    ? "border-green-500 border-2"
                    : ""
                }`}
                disabled={!!selectedAnswer}
                onClick={() => handleAnswerSelect(key)}
              >
                <span className="font-bold mr-2">{key}:</span> {value}
              </Button>
            ))}
          </div>
          
          {answerResult && (
            <div className={`mt-6 p-4 rounded-md ${answerResult.is_correct ? 'bg-green-50' : 'bg-red-50'}`}>
              <h4 className={`font-semibold ${answerResult.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                {answerResult.is_correct 
                  ? `${getPersonalizedCompliment()} That's correct!` 
                  : `The correct answer is ${answerResult.correct_answer}`
                }
              </h4>
              
              {answerResult.extended_content && (
                <Tabs value={contentTab} onValueChange={setContentTab} className="mt-4">
                  <TabsList className="mb-2">
                    <TabsTrigger value="explanation">Explanation</TabsTrigger>
                    {answerResult.extended_content.story_why && (
                      <TabsTrigger value="story">Story</TabsTrigger>
                    )}
                    {answerResult.extended_content.implementation_how && (
                      <TabsTrigger value="implementation">Implementation</TabsTrigger>
                    )}
                    {answerResult.extended_content.science_behind_it && (
                      <TabsTrigger value="science">Science</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="explanation" className="mt-0">
                    <p>{answerResult.explanation}</p>
                  </TabsContent>
                  
                  {answerResult.extended_content.story_why && (
                    <TabsContent value="story" className="mt-0">
                      <p>{answerResult.extended_content.story_why}</p>
                    </TabsContent>
                  )}
                  
                  {answerResult.extended_content.implementation_how && (
                    <TabsContent value="implementation" className="mt-0">
                      <p>{answerResult.extended_content.implementation_how}</p>
                    </TabsContent>
                  )}
                  
                  {answerResult.extended_content.science_behind_it && (
                    <TabsContent value="science" className="mt-0">
                      <p>{answerResult.extended_content.science_behind_it}</p>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {selectedAnswer && (
            <Button 
              className="ml-auto" 
              onClick={handleContinue}
            >
              Next Question
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  // Render assessment results
  const renderResults = () => {
    if (!assessmentResults) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="ml-3">Preparing your results...</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            Assessment Complete!
          </CardTitle>
          <CardDescription className="text-center">
            You answered {assessmentResults.questions_correct} out of {assessmentResults.questions_asked} questions correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Your Domain Scores</h3>
            <div className="space-y-3">
              {Object.entries(assessmentResults.domain_scores).map(([domain, score]) => (
                <div key={domain}>
                  <div className="flex justify-between items-center mb-1">
                    <span>{domain}</span>
                    <span>{Math.round(score)}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Areas of Strength</h3>
            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">{assessmentResults.strongest_domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {assessmentResults.learning_path[assessmentResults.strongest_domain]?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Areas for Growth</h3>
            <Card className="bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">{assessmentResults.weakest_domain}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {assessmentResults.learning_path[assessmentResults.weakest_domain]?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Complete Learning Path</h3>
            <div className="space-y-4">
              {Object.entries(assessmentResults.learning_path)
                .filter(([domain]) => domain !== assessmentResults.strongest_domain && domain !== assessmentResults.weakest_domain)
                .map(([domain, recommendations]) => (
                  <Card key={domain}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{domain}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {recommendations.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <div className="bg-primary-foreground text-primary font-semibold rounded-lg p-4 w-full text-center mb-2">
            You've earned 10 points for completing this assessment!
          </div>
          <Button 
            className="w-full" 
            onClick={() => {
              if (onComplete && assessmentResults) {
                onComplete(assessmentResults);
              }
            }}
          >
            Take Me to My Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      {assessmentComplete ? renderResults() : renderQuestion()}
    </div>
  );
};

export default EnhancedAssessment;