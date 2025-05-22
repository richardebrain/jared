import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrainCircuit, CheckCircle, ArrowLeft, ArrowRight, Award } from "lucide-react";

// Assessment questions by category
const ASSESSMENT_QUESTIONS = [
  {
    id: "classroom_management_1",
    category: "Classroom Management",
    question: "How effectively do you establish clear expectations and routines for classroom behavior?",
    description: "Consider your consistency in communicating and enforcing expectations."
  },
  {
    id: "classroom_management_2",
    category: "Classroom Management",
    question: "How well do you respond to challenging behaviors in a positive and constructive manner?",
    description: "Think about your strategies for addressing disruptions while maintaining a positive atmosphere."
  },
  {
    id: "instruction_1",
    category: "Instructional Strategies",
    question: "How effectively do you differentiate instruction to meet the diverse needs of all students?",
    description: "Consider how you adapt activities and materials for different learning styles and abilities."
  },
  {
    id: "instruction_2",
    category: "Instructional Strategies",
    question: "How well do you incorporate hands-on and experiential learning into your lessons?",
    description: "Think about opportunities you provide for active exploration and discovery."
  },
  {
    id: "assessment_1",
    category: "Assessment",
    question: "How consistently do you use observation and documentation to assess children's learning?",
    description: "Consider your methods for collecting and analyzing evidence of student progress."
  },
  {
    id: "assessment_2",
    category: "Assessment",
    question: "How effectively do you use assessment data to guide your instructional planning?",
    description: "Think about how assessment results inform your teaching decisions."
  },
  {
    id: "environment_1",
    category: "Learning Environment",
    question: "How intentionally do you arrange your classroom to support learning and independence?",
    description: "Consider the organization of materials, centers, and spaces."
  },
  {
    id: "environment_2",
    category: "Learning Environment",
    question: "How effectively do you create a warm, inclusive classroom community?",
    description: "Think about strategies you use to foster belonging and respect."
  },
  {
    id: "family_1",
    category: "Family Engagement",
    question: "How regularly do you communicate with families about their child's progress?",
    description: "Consider the frequency and quality of your family communications."
  },
  {
    id: "family_2",
    category: "Family Engagement",
    question: "How successfully do you involve families as partners in their child's education?",
    description: "Think about opportunities you provide for meaningful family participation."
  },
  {
    id: "professional_1",
    category: "Professional Growth",
    question: "How actively do you seek out professional development opportunities?",
    description: "Consider your commitment to continuous learning."
  },
  {
    id: "professional_2",
    category: "Professional Growth",
    question: "How effectively do you reflect on your teaching practice and set growth goals?",
    description: "Think about your process for self-assessment and improvement."
  }
];

// Rating scale definitions
const RATING_SCALE = [
  { value: "1", label: "Beginning", description: "I'm just starting to develop this skill" },
  { value: "2", label: "Developing", description: "I'm working on improving this skill" },
  { value: "3", label: "Proficient", description: "I consistently demonstrate this skill" },
  { value: "4", label: "Advanced", description: "I excel in this area and can support others" },
  { value: "5", label: "Mentor", description: "I model exemplary practice in this area" }
];

// Teacher level thresholds based on average scores
const TEACHER_LEVELS = [
  { level: "beginner", threshold: 0, description: "You're starting your teaching journey. Focus on building foundational skills." },
  { level: "intermediate", threshold: 2.8, description: "You're developing solid teaching skills. Continue refining your practice." },
  { level: "advanced", threshold: 3.7, description: "You demonstrate strong teaching abilities. Deepen your expertise and mentor others." },
  { level: "mentor", threshold: 4.5, description: "You exemplify excellence in teaching. Share your knowledge and lead others." }
];

export default function SelfAssessment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Get the authenticated user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    refetchOnWindowFocus: false,
  });
  
  // State for the assessment
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState<string[]>([]);
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Pre-populate answers if user has a previous self-assessment
  const { data: previousAssessment } = useQuery({
    queryKey: ["/api/self-assessment", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (previousAssessment && previousAssessment.results) {
      setAnswers(previousAssessment.results);
    }
  }, [previousAssessment]);
  
  // Handle rating selection
  const handleRatingChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Calculate progress percentage
  const progress = Object.keys(answers).length / ASSESSMENT_QUESTIONS.length * 100;
  
  // Check if all questions are answered
  const allQuestionsAnswered = Object.keys(answers).length === ASSESSMENT_QUESTIONS.length;
  
  // Calculate average score and teacher level
  const calculateResults = () => {
    if (!allQuestionsAnswered) return null;
    
    // Calculate average score
    const values = Object.values(answers).map(v => parseInt(v));
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Determine teacher level
    const teacherLevel = TEACHER_LEVELS.reduce((result, level) => {
      return average >= level.threshold ? level : result;
    }, TEACHER_LEVELS[0]);
    
    // Calculate scores by category
    const categoryScores: Record<string, { count: number, total: number, average: number }> = {};
    
    ASSESSMENT_QUESTIONS.forEach(question => {
      const score = parseInt(answers[question.id] || "0");
      if (score > 0) {
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { count: 0, total: 0, average: 0 };
        }
        categoryScores[question.category].count += 1;
        categoryScores[question.category].total += score;
      }
    });
    
    // Calculate average for each category
    Object.keys(categoryScores).forEach(category => {
      const { count, total } = categoryScores[category];
      categoryScores[category].average = count > 0 ? total / count : 0;
    });
    
    // Identify strengths and growth areas
    const strengths: string[] = [];
    const growthAreas: string[] = [];
    
    Object.entries(categoryScores).forEach(([category, data]) => {
      if (data.average >= 4) {
        strengths.push(category);
      } else if (data.average <= 3) {
        growthAreas.push(category);
      }
    });
    
    // Individual question analysis
    const questionStrengths = Object.entries(answers)
      .filter(([_, value]) => parseInt(value) >= 4)
      .map(([id, _]) => id);
      
    const questionGrowthAreas = Object.entries(answers)
      .filter(([_, value]) => parseInt(value) <= 2)
      .map(([id, _]) => id);
    
    return {
      average,
      percentageScore: Math.round(average * 20), // Convert to percentage (1-5 scale to 20-100%)
      teacherLevel: teacherLevel.level,
      teacherLevelDescription: teacherLevel.description,
      categoryScores,
      strengths: strengths.length > 0 ? strengths : ["No specific strengths identified"],
      growthAreas: growthAreas.length > 0 ? growthAreas : ["No specific growth areas identified"],
      questionStrengths,
      questionGrowthAreas
    };
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user || !allQuestionsAnswered) return;
    
    setIsSubmitting(true);
    
    try {
      const results = calculateResults();
      if (!results) {
        throw new Error("Failed to calculate results");
      }
      
      // Format strength and growth areas
      const finalStrengths = [...results.strengths, ...strengths.filter(s => s.trim() !== "")];
      const finalGrowthAreas = [...results.growthAreas, ...growthAreas.filter(g => g.trim() !== "")];
      
      // Submit to API
      const response = await apiRequest("POST", `/api/self-assessment`, {
        userId: user.id,
        results: answers,
        strengthAreas: finalStrengths,
        growthAreas: finalGrowthAreas,
        notes
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data.assessment);
        setIsComplete(true);
        
        // Invalidate queries to refresh user data (points, level)
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
        
        toast({
          title: "Self-Assessment Complete",
          description: `You earned ${data.pointsEarned} points! Your personalized learning path has been updated.`,
          duration: 5000,
        });
      } else {
        throw new Error("Failed to submit assessment");
      }
    } catch (error) {
      console.error("Error submitting self-assessment:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your self-assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Go to next step
  const nextStep = () => {
    const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
    if (!answers[currentQuestion.id]) {
      toast({
        title: "Please select a rating",
        description: "You need to rate this aspect of your teaching before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Display results page
      setCurrentStep(ASSESSMENT_QUESTIONS.length);
    }
  };
  
  // Go to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Skip to results page
  const skipToResults = () => {
    if (allQuestionsAnswered) {
      setCurrentStep(ASSESSMENT_QUESTIONS.length);
    } else {
      toast({
        title: "Please complete all questions",
        description: "You need to answer all questions before viewing results.",
        variant: "destructive",
      });
    }
  };
  
  // Return to dashboard
  const returnToDashboard = () => {
    setLocation("/dashboard");
  };
  
  // Render the assessment question
  const renderQuestion = () => {
    if (currentStep >= ASSESSMENT_QUESTIONS.length) {
      return renderResults();
    }
    
    const question = ASSESSMENT_QUESTIONS[currentStep];
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Question {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}</div>
            <div className="text-sm font-medium">{question.category}</div>
          </div>
          <CardTitle className="text-xl">{question.question}</CardTitle>
          <CardDescription className="text-white opacity-90">{question.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            value={answers[question.id] || ""} 
            onValueChange={(value) => handleRatingChange(question.id, value)}
            className="space-y-4"
          >
            {RATING_SCALE.map((rating) => (
              <div key={rating.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value={rating.value} id={`rating-${rating.value}`} />
                <Label 
                  htmlFor={`rating-${rating.value}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{rating.label} ({rating.value})</div>
                  <div className="text-sm text-gray-500">{rating.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
          >
            {currentStep < ASSESSMENT_QUESTIONS.length - 1 ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                View Results
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Render assessment results
  const renderResults = () => {
    const results = calculateResults();
    
    if (!results) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Assessment Incomplete</CardTitle>
            <CardDescription>Please answer all questions to see your results.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setCurrentStep(0)}>Return to Assessment</Button>
          </CardFooter>
        </Card>
      );
    }
    
    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Self-Assessment Results</span>
              <Award className="h-6 w-6" />
            </CardTitle>
            <CardDescription className="text-white opacity-90">
              Based on your self-rating in {ASSESSMENT_QUESTIONS.length} areas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>Overall Score</span>
                  <span>{results.percentageScore}%</span>
                </div>
                <Progress value={results.percentageScore} className="h-2.5" />
              </div>
              
              <div className="p-4 bg-purple-50 rounded-md">
                <h3 className="font-semibold text-lg text-purple-900 mb-2">Teacher Level: <span className="capitalize">{results.teacherLevel}</span></h3>
                <p className="text-purple-700">{results.teacherLevelDescription}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-md">
                  <h3 className="font-semibold text-green-700 mb-2">Your Strengths</h3>
                  <ul className="space-y-2 text-green-600">
                    {results.strengths.map((strength: string, index: number) => (
                      <li key={`strength-${index}`} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-md">
                  <h3 className="font-semibold text-amber-700 mb-2">Growth Areas</h3>
                  <ul className="space-y-2 text-amber-600">
                    {results.growthAreas.map((area: string, index: number) => (
                      <li key={`growth-${index}`} className="flex items-start">
                        <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Add Personal Reflections (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="strengths" className="mb-1 block">Additional Strengths</Label>
                    <Textarea 
                      id="strengths" 
                      placeholder="Enter additional areas where you excel..."
                      value={strengths.join('\n')}
                      onChange={(e) => setStrengths(e.target.value.split('\n').filter(Boolean))}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="growth" className="mb-1 block">Additional Growth Areas</Label>
                    <Textarea 
                      id="growth" 
                      placeholder="Enter additional areas to develop..."
                      value={growthAreas.join('\n')}
                      onChange={(e) => setGrowthAreas(e.target.value.split('\n').filter(Boolean))}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes" className="mb-1 block">General Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Add any additional thoughts or reflections..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(ASSESSMENT_QUESTIONS.length - 1)}
              disabled={isComplete}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Button>
            
            {isComplete ? (
              <Button onClick={returnToDashboard}>
                Return to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {!isComplete && (
          <Alert>
            <AlertTitle>Your results are not yet saved</AlertTitle>
            <AlertDescription>
              Please submit your assessment to save your results and update your personalized learning path.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center mb-2">
            <BrainCircuit className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Teacher Self-Assessment</h1>
          </div>
          <p className="text-gray-600 text-center max-w-2xl">
            This self-assessment will help personalize your professional development journey.
            Rate yourself honestly in each area to identify your strengths and opportunities for growth.
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-3xl mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Your progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Skip to results button (if all questions answered) */}
        {currentStep < ASSESSMENT_QUESTIONS.length && progress === 100 && (
          <div className="w-full max-w-3xl mx-auto mb-6 flex justify-end">
            <Button variant="outline" onClick={skipToResults}>
              Skip to Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Question or results card */}
        {renderQuestion()}
      </main>
    </div>
  );
}