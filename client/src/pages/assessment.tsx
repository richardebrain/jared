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
import { AlertCircle, Award, Check, ChevronRight, ClipboardList, Star } from "lucide-react";

// Define assessment question types
type QuestionType = 'multiple-choice' | 'rating' | 'yes-no' | 'checkbox' | 'open-ended';

interface Question {
  id: string;
  text: string;
  domain: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

// Early childhood education domains
const domains = [
  { id: 'classroom-organization', name: 'Classroom Organization', icon: ClipboardList },
  { id: 'instructional-support', name: 'Instructional Support', icon: Award },
  { id: 'emotional-support', name: 'Emotional Support', icon: Star },
  { id: 'health-safety', name: 'Health & Safety', icon: AlertCircle },
];

// Define the ITERS/ECERS and CLASS-based assessment questions
const assessmentQuestions: Question[] = [
  // ITERS/ECERS Questions - Classroom Organization
  {
    id: 'co-1',
    text: 'How often do you create clearly defined learning centers in your classroom?',
    domain: 'classroom-organization',
    type: 'rating',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    required: true
  },
  {
    id: 'co-2',
    text: 'Do you have a consistent daily schedule with minimal transitions?',
    domain: 'classroom-organization',
    type: 'yes-no',
    required: true
  },
  {
    id: 'co-3',
    text: 'Which of the following learning centers do you regularly maintain in your classroom?',
    domain: 'classroom-organization',
    type: 'checkbox',
    options: ['Dramatic play', 'Blocks', 'Art', 'Sensory/sand-water', 'Science/discovery', 'Math/manipulatives', 'Language/literacy', 'Music'],
    required: true
  },
  
  // CLASS Questions - Instructional Support
  {
    id: 'is-1',
    text: 'How confident are you in your ability to use open-ended questions to extend children\'s thinking?',
    domain: 'instructional-support',
    type: 'rating',
    options: ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Extremely confident'],
    required: true
  },
  {
    id: 'is-2',
    text: 'How often do you provide specific feedback on children\'s work and ideas?',
    domain: 'instructional-support',
    type: 'rating',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    required: true
  },
  {
    id: 'is-3',
    text: 'Which concept development strategies do you regularly use?',
    domain: 'instructional-support',
    type: 'checkbox',
    options: ['Making connections to previous learning', 'Relating concepts to children\'s lives', 'Using why and how questions', 'Creating opportunities for analysis and reasoning', 'Planning hands-on experiences'],
    required: true
  },
  
  // CLASS Questions - Emotional Support
  {
    id: 'es-1',
    text: 'How would you rate your ability to create a positive classroom climate?',
    domain: 'emotional-support',
    type: 'rating',
    options: ['Needs significant improvement', 'Needs some improvement', 'Adequate', 'Good', 'Excellent'],
    required: true
  },
  {
    id: 'es-2',
    text: 'How often do you get down to children\'s eye level when interacting with them?',
    domain: 'emotional-support',
    type: 'rating',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    required: true
  },
  {
    id: 'es-3',
    text: 'Which strategies do you use to acknowledge children\'s feelings?',
    domain: 'emotional-support',
    type: 'checkbox',
    options: ['Labeling emotions', 'Validating feelings', 'Providing comfort', 'Teaching emotional regulation', 'Using books to discuss feelings', 'Role-playing emotional situations'],
    required: true
  },
  
  // ITERS/ECERS Questions - Health & Safety
  {
    id: 'hs-1',
    text: 'How confident are you in implementing proper handwashing procedures for children and staff?',
    domain: 'health-safety',
    type: 'rating',
    options: ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Extremely confident'],
    required: true
  },
  {
    id: 'hs-2',
    text: 'Do you regularly check your classroom for safety hazards?',
    domain: 'health-safety',
    type: 'yes-no',
    required: true
  },
  {
    id: 'hs-3',
    text: 'Which health and safety practices do you implement daily?',
    domain: 'health-safety',
    type: 'checkbox',
    options: ['Disinfecting surfaces', 'Monitoring children\'s handwashing', 'Conducting safety checks', 'Practicing emergency drills', 'Following food safety guidelines', 'Documenting incidents/accidents'],
    required: true
  }
];

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentDomain, setCurrentDomain] = useState(domains[0].id);
  
  // Get the currently authenticated user
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"]
  });
  
  // Filter questions by current domain
  const domainQuestions = assessmentQuestions.filter(q => q.domain === currentDomain);
  
  // Calculate overall progress
  const overallProgress = Math.round(
    (Object.keys(answers).length / assessmentQuestions.length) * 100
  );
  
  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Handle checkbox answers
  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentSelections = prev[questionId] || [];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentSelections, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentSelections.filter((item: string) => item !== option)
        };
      }
    });
  };
  
  // Handle domain navigation
  const handleDomainChange = (domainId: string) => {
    setCurrentDomain(domainId);
    setCurrentQuestionIndex(0);
  };
  
  // Calculate domain progress
  const calculateDomainProgress = (domainId: string) => {
    const domainQs = assessmentQuestions.filter(q => q.domain === domainId);
    const answeredQs = domainQs.filter(q => answers[q.id] !== undefined);
    return Math.round((answeredQs.length / domainQs.length) * 100);
  };
  
  // Check if the current question has been answered
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = domainQuestions[currentQuestionIndex];
    return answers[currentQuestion.id] !== undefined;
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
      navigate("/dashboard");
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
    
    // Calculate strength areas and growth areas based on answers
    const domainScores: Record<string, number> = {};
    const allDomainQuestions = domains.map(d => d.id);
    
    allDomainQuestions.forEach(domain => {
      const domainQs = assessmentQuestions.filter(q => q.domain === domain);
      const domainProgress = calculateDomainProgress(domain);
      domainScores[domain] = domainProgress;
    });
    
    // Determine strengths and growth areas
    const strengthThreshold = 80;
    const strengthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain] >= strengthThreshold
    );
    
    const growthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain] < strengthThreshold
    );
    
    // Calculate overall score
    const overallScore = Math.round(
      Object.values(domainScores).reduce((sum, score) => sum + score, 0) / 
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
  
  // Check if all required questions have been answered
  const canSubmitAssessment = assessmentQuestions
    .filter(q => q.required)
    .every(q => answers[q.id] !== undefined);
  
  // Render the current question
  const renderQuestion = () => {
    if (domainQuestions.length === 0) return null;
    
    const question = domainQuestions[currentQuestionIndex];
    
    switch (question.type) {
      case 'multiple-choice':
      case 'rating':
        return (
          <RadioGroup 
            value={answers[question.id] || ""} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <div className="grid gap-3">
              {question.options?.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroupItem id={`option-${i}`} value={option} />
                  <Label htmlFor={`option-${i}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );
        
      case 'yes-no':
        return (
          <RadioGroup 
            value={answers[question.id] || ""} 
            onValueChange={(value) => handleAnswerChange(question.id, value === "yes")}
          >
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="yes" value="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="no" value="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </div>
          </RadioGroup>
        );
        
      case 'checkbox':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options?.map((option, i) => {
              const isChecked = Array.isArray(answers[question.id]) && 
                answers[question.id]?.includes(option);
                
              return (
                <div key={i} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`option-${i}`} 
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(question.id, option, checked === true)
                    }
                  />
                  <Label className="leading-tight" htmlFor={`option-${i}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );
        
      default:
        return null;
    }
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
                  Progress: {overallProgress}%
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
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {domains.find(d => d.id === currentDomain)?.name}
                </CardTitle>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {domainQuestions.length}
                </CardDescription>
                <Progress 
                  value={((currentQuestionIndex + 1) / domainQuestions.length) * 100} 
                  className="h-2" 
                />
              </CardHeader>
              
              <CardContent>
                {domainQuestions.length > 0 && (
                  <div className="space-y-6">
                    <div className="text-lg font-medium">
                      {domainQuestions[currentQuestionIndex].text}
                      {domainQuestions[currentQuestionIndex].required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </div>
                    
                    {renderQuestion()}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <div>
                  {currentQuestionIndex === domainQuestions.length - 1 && 
                   calculateDomainProgress(currentDomain) === 100 && (
                    <Button
                      variant="default"
                      className="ml-2"
                      onClick={handleSubmitAssessment}
                      disabled={!canSubmitAssessment || submitAssessmentMutation.isPending}
                    >
                      {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                    </Button>
                  )}
                  
                  {currentQuestionIndex < domainQuestions.length - 1 && (
                    <Button
                      variant="default"
                      onClick={() => setCurrentQuestionIndex(i => i + 1)}
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
                  <h3 className="font-semibold">Ready to Complete Your Assessment?</h3>
                  <p className="text-sm text-muted-foreground">
                    You've answered all required questions! Navigate through all domains to review your answers, 
                    then click "Submit Assessment" on the final question to receive your personalized learning path.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}