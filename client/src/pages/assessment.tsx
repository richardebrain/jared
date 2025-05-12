import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";
import { useLocation } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define assessment domains based on ITERS/ECERS and CLASS frameworks
const DOMAINS = {
  ITERS_ECERS: "iters-ecers",
  CLASS: "class",
  KNOWLEDGE: "knowledge",
  EXPERIENCE: "experience"
};

// Assessment questions organized by framework
const questions = {
  [DOMAINS.ITERS_ECERS]: [
    {
      id: "ie1",
      question: "How would you rate your understanding of creating safe and healthy learning environments for young children?",
      options: [
        { id: "a", text: "I have minimal knowledge about safety guidelines" },
        { id: "b", text: "I understand basic health and safety requirements" },
        { id: "c", text: "I can effectively implement health and safety protocols" },
        { id: "d", text: "I can design comprehensive safety plans and procedures" },
        { id: "e", text: "I can teach others about creating optimal health and safety systems" }
      ],
      category: "Space and Furnishings"
    },
    {
      id: "ie2",
      question: "How would you rate your skill in arranging classroom space to promote learning?",
      options: [
        { id: "a", text: "I struggle to organize classroom spaces effectively" },
        { id: "b", text: "I can create basic learning centers" },
        { id: "c", text: "I can design purposeful learning environments" },
        { id: "d", text: "I can create innovative spaces that maximize engagement" },
        { id: "e", text: "I can design transformative environments that inspire creativity" }
      ],
      category: "Space and Furnishings"
    },
    {
      id: "ie3",
      question: "How comfortable are you with implementing appropriate personal care routines?",
      options: [
        { id: "a", text: "I need significant guidance with care routines" },
        { id: "b", text: "I understand basic care procedures but need supervision" },
        { id: "c", text: "I can independently manage care routines" },
        { id: "d", text: "I can teach others how to implement care routines" },
        { id: "e", text: "I can develop new systems that improve care quality" }
      ],
      category: "Personal Care Routines"
    },
    {
      id: "ie4",
      question: "How would you rate your ability to facilitate language development in the classroom?",
      options: [
        { id: "a", text: "I have limited strategies for language development" },
        { id: "b", text: "I use basic language development techniques" },
        { id: "c", text: "I regularly implement effective language activities" },
        { id: "d", text: "I can design comprehensive language development plans" },
        { id: "e", text: "I can mentor others in advanced language facilitation" }
      ],
      category: "Language-Reasoning"
    },
    {
      id: "ie5",
      question: "How skilled are you at implementing developmentally appropriate activities?",
      options: [
        { id: "a", text: "I struggle to identify age-appropriate activities" },
        { id: "b", text: "I can select basic activities suited to children's ages" },
        { id: "c", text: "I regularly implement varied developmentally appropriate activities" },
        { id: "d", text: "I can design innovative curriculum aligned with development" },
        { id: "e", text: "I can lead others in creating exemplary developmentally aligned programs" }
      ],
      category: "Activities"
    }
  ],
  [DOMAINS.CLASS]: [
    {
      id: "cl1",
      question: "How would you rate your emotional support skills in the classroom?",
      options: [
        { id: "a", text: "I struggle to create positive emotional climate" },
        { id: "b", text: "I can maintain basic positive interactions" },
        { id: "c", text: "I effectively support children's emotional needs" },
        { id: "d", text: "I excel at creating nurturing emotional environments" },
        { id: "e", text: "I can train others in creating optimal emotional support" }
      ],
      category: "Emotional Support"
    },
    {
      id: "cl2",
      question: "How would you rate your classroom organization skills?",
      options: [
        { id: "a", text: "I struggle with behavior management and transitions" },
        { id: "b", text: "I can maintain basic classroom organization" },
        { id: "c", text: "I effectively organize classroom flow and activities" },
        { id: "d", text: "I create highly productive learning environments" },
        { id: "e", text: "I can mentor others in advanced classroom organization" }
      ],
      category: "Classroom Organization"
    },
    {
      id: "cl3",
      question: "How comfortable are you with providing instructional support?",
      options: [
        { id: "a", text: "I provide minimal instructional guidance" },
        { id: "b", text: "I offer basic instructional support" },
        { id: "c", text: "I provide effective concept development support" },
        { id: "d", text: "I excel at fostering higher-order thinking" },
        { id: "e", text: "I can train others in advanced instructional techniques" }
      ],
      category: "Instructional Support"
    },
    {
      id: "cl4",
      question: "How would you rate your ability to provide quality feedback to children?",
      options: [
        { id: "a", text: "I provide minimal feedback to children" },
        { id: "b", text: "I give basic positive and corrective feedback" },
        { id: "c", text: "I regularly provide specific, growth-oriented feedback" },
        { id: "d", text: "I excel at scaffolding learning through feedback" },
        { id: "e", text: "I can mentor others in advanced feedback techniques" }
      ],
      category: "Instructional Support"
    },
    {
      id: "cl5",
      question: "How skilled are you at facilitating language modeling in the classroom?",
      options: [
        { id: "a", text: "I use limited language modeling techniques" },
        { id: "b", text: "I employ basic language modeling strategies" },
        { id: "c", text: "I regularly implement effective language modeling" },
        { id: "d", text: "I excel at advanced language development facilitation" },
        { id: "e", text: "I can train others in optimal language modeling techniques" }
      ],
      category: "Instructional Support"
    }
  ],
  [DOMAINS.KNOWLEDGE]: [
    {
      id: "kn1",
      question: "How would you rate your knowledge of child development milestones?",
      options: [
        { id: "a", text: "I have minimal knowledge of developmental milestones" },
        { id: "b", text: "I understand basic developmental stages" },
        { id: "c", text: "I have solid knowledge of developmental progression" },
        { id: "d", text: "I have advanced understanding of development variations" },
        { id: "e", text: "I have expert knowledge that allows me to train others" }
      ],
      category: "Child Development"
    },
    {
      id: "kn2",
      question: "How familiar are you with play-based learning approaches?",
      options: [
        { id: "a", text: "I have minimal understanding of play-based learning" },
        { id: "b", text: "I understand basic principles of learning through play" },
        { id: "c", text: "I effectively implement play-based curriculum" },
        { id: "d", text: "I can design innovative play-based learning experiences" },
        { id: "e", text: "I can mentor others in advanced play-based pedagogies" }
      ],
      category: "Curriculum"
    },
    {
      id: "kn3",
      question: "How would you rate your understanding of positive behavior guidance?",
      options: [
        { id: "a", text: "I have limited knowledge of behavior guidance" },
        { id: "b", text: "I understand basic positive discipline techniques" },
        { id: "c", text: "I effectively implement positive guidance strategies" },
        { id: "d", text: "I excel at managing challenging behaviors" },
        { id: "e", text: "I can train others in advanced behavior management" }
      ],
      category: "Behavior Management"
    },
    {
      id: "kn4",
      question: "How familiar are you with early literacy development?",
      options: [
        { id: "a", text: "I have minimal knowledge about early literacy" },
        { id: "b", text: "I understand basic early reading and writing concepts" },
        { id: "c", text: "I effectively support literacy development" },
        { id: "d", text: "I excel at implementing comprehensive literacy programs" },
        { id: "e", text: "I can mentor others in advanced literacy approaches" }
      ],
      category: "Literacy"
    },
    {
      id: "kn5",
      question: "How would you rate your understanding of mindfulness practices for children?",
      options: [
        { id: "a", text: "I have minimal knowledge about mindfulness for children" },
        { id: "b", text: "I understand basic mindfulness techniques" },
        { id: "c", text: "I regularly implement mindfulness activities" },
        { id: "d", text: "I excel at integrating mindfulness throughout the day" },
        { id: "e", text: "I can train others in comprehensive mindfulness approaches" }
      ],
      category: "Social-Emotional"
    }
  ],
  [DOMAINS.EXPERIENCE]: [
    {
      id: "ex1",
      question: "How much experience do you have working with young children?",
      options: [
        { id: "a", text: "Less than 1 year" },
        { id: "b", text: "1-2 years" },
        { id: "c", text: "3-5 years" },
        { id: "d", text: "6-10 years" },
        { id: "e", text: "More than 10 years" }
      ],
      category: "Experience Level"
    },
    {
      id: "ex2",
      question: "What is your educational background in early childhood education?",
      options: [
        { id: "a", text: "No formal ECE education" },
        { id: "b", text: "Some coursework or certificates" },
        { id: "c", text: "Associate's degree in ECE or related field" },
        { id: "d", text: "Bachelor's degree in ECE or related field" },
        { id: "e", text: "Master's degree or higher in ECE or related field" }
      ],
      category: "Education"
    },
    {
      id: "ex3",
      question: "How much professional development have you completed in the past year?",
      options: [
        { id: "a", text: "None" },
        { id: "b", text: "1-5 hours" },
        { id: "c", text: "6-15 hours" },
        { id: "d", text: "16-30 hours" },
        { id: "e", text: "More than 30 hours" }
      ],
      category: "Professional Development"
    },
    {
      id: "ex4",
      question: "What age groups do you have the most experience working with?",
      options: [
        { id: "a", text: "Infants (0-12 months)" },
        { id: "b", text: "Toddlers (1-2 years)" },
        { id: "c", text: "Preschool (3-4 years)" },
        { id: "d", text: "Pre-K (4-5 years)" },
        { id: "e", text: "Mixed age groups" }
      ],
      category: "Age Group Experience"
    },
    {
      id: "ex5",
      question: "What area of professional growth are you most interested in?",
      options: [
        { id: "a", text: "Classroom management and organization" },
        { id: "b", text: "Curriculum development and implementation" },
        { id: "c", text: "Child development and assessment" },
        { id: "d", text: "Family engagement and communication" },
        { id: "e", text: "Leadership and administrative skills" }
      ],
      category: "Professional Goals"
    }
  ]
};

export default function Assessment() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(DOMAINS.ITERS_ECERS);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  
  // Flatten questions for progress calculation
  const allQuestions = [
    ...questions[DOMAINS.ITERS_ECERS],
    ...questions[DOMAINS.CLASS],
    ...questions[DOMAINS.KNOWLEDGE],
    ...questions[DOMAINS.EXPERIENCE]
  ];
  
  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });
  
  // Submit assessment mutation
  const { mutate: submitAssessment, isPending } = useMutation({
    mutationFn: async (data: { 
      userId: number; 
      results: Record<string, string>; 
      domainScores: Record<string, number>;
      overallScore: number;
      strengthAreas: string[];
      growthAreas: string[];
    }) => {
      const response = await apiRequest("POST", "/api/assessments", {
        userId: data.userId,
        results: data.results,
        domainScores: data.domainScores,
        overallScore: data.overallScore,
        strengthAreas: data.strengthAreas,
        growthAreas: data.growthAreas,
        completed: true
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment completed",
        description: "Your personalized learning path is ready!",
      });
      setCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving assessment",
        description: error.message || "There was an error saving your assessment results.",
        variant: "destructive",
      });
    },
  });
  
  // Get current domain questions
  const currentDomainQuestions = questions[activeTab as keyof typeof DOMAINS];
  const currentQuestion = currentDomainQuestions[activeQuestionIndex];
  
  // Handle option selection
  const handleOptionSelect = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };
  
  // Navigate to next question within a domain
  const handleNext = () => {
    if (activeQuestionIndex < currentDomainQuestions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    } else {
      // Move to next domain or complete assessment
      const domains = Object.values(DOMAINS);
      const currentDomainIndex = domains.indexOf(activeTab);
      
      if (currentDomainIndex < domains.length - 1) {
        setActiveTab(domains[currentDomainIndex + 1]);
        setActiveQuestionIndex(0);
      } else {
        // All domains completed, submit assessment
        submitCompletedAssessment();
      }
    }
  };
  
  // Navigate to previous question
  const handlePrevious = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    } else {
      // Move to previous domain if at first question
      const domains = Object.values(DOMAINS);
      const currentDomainIndex = domains.indexOf(activeTab);
      
      if (currentDomainIndex > 0) {
        setActiveTab(domains[currentDomainIndex - 1]);
        const prevDomainQuestions = questions[domains[currentDomainIndex - 1] as keyof typeof DOMAINS];
        setActiveQuestionIndex(prevDomainQuestions.length - 1);
      }
    }
  };
  
  // Calculate scores and submit assessment
  const submitCompletedAssessment = () => {
    if (!user) {
      toast({
        title: "User not found",
        description: "Please log in to save your assessment results.",
        variant: "destructive",
      });
      return;
    }
    
    const valueMap: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    
    // Calculate domain scores
    const domainScores: Record<string, number> = {};
    const categoryScores: Record<string, { total: number, count: number }> = {};
    
    Object.keys(DOMAINS).forEach(domainKey => {
      const domain = DOMAINS[domainKey as keyof typeof DOMAINS];
      let domainTotal = 0;
      let domainCount = 0;
      
      questions[domain].forEach(q => {
        if (answers[q.id]) {
          const score = valueMap[answers[q.id]] || 0;
          domainTotal += score;
          domainCount++;
          
          // Track category scores
          if (!categoryScores[q.category]) {
            categoryScores[q.category] = { total: 0, count: 0 };
          }
          categoryScores[q.category].total += score;
          categoryScores[q.category].count++;
        }
      });
      
      domainScores[domain] = domainCount > 0 
        ? Math.round((domainTotal / (domainCount * 5)) * 100) 
        : 0;
    });
    
    // Calculate overall score
    const totalAnswered = Object.keys(answers).length;
    const overallScore = totalAnswered > 0
      ? Math.round(Object.values(domainScores).reduce((sum, score) => sum + score, 0) / Object.keys(domainScores).length)
      : 0;
    
    // Identify strength and growth areas based on category scores
    const categoryAverages = Object.entries(categoryScores).map(([category, data]) => ({
      category,
      average: data.count > 0 ? data.total / data.count : 0
    }));
    
    // Sort by score to find top and bottom categories
    categoryAverages.sort((a, b) => b.average - a.average);
    
    const strengthAreas = categoryAverages
      .slice(0, 3)
      .map(item => item.category);
      
    const growthAreas = categoryAverages
      .slice(-3)
      .map(item => item.category);
    
    // Submit assessment with detailed results
    submitAssessment({
      userId: user.id,
      results: answers,
      domainScores,
      overallScore,
      strengthAreas,
      growthAreas
    });
  };
  
  // Calculate overall progress percentage
  const totalQuestions = allQuestions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = ((answeredQuestions + (completed ? 1 : 0)) / totalQuestions) * 100;
  
  // Calculate domain-specific progress
  const getDomainProgress = (domain: string) => {
    const domainQuestions = questions[domain as keyof typeof DOMAINS];
    let answered = 0;
    
    domainQuestions.forEach(q => {
      if (answers[q.id]) answered++;
    });
    
    return (answered / domainQuestions.length) * 100;
  };
  
  // Format domain name for display
  const formatDomainName = (domainKey: string) => {
    switch(domainKey) {
      case DOMAINS.ITERS_ECERS:
        return "ITERS/ECERS";
      case DOMAINS.CLASS:
        return "CLASS";
      case DOMAINS.KNOWLEDGE:
        return "ECE Knowledge";
      case DOMAINS.EXPERIENCE:
        return "Experience";
      default:
        return domainKey;
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neutral-800 mb-2">
            Teacher Development Assessment
          </h1>
          <p className="text-neutral-700 mb-6">
            This comprehensive assessment based on ITERS/ECERS and CLASS frameworks will help us create a personalized professional development path for you.
          </p>
          
          <Progress value={progressPercentage} className="mb-6" />
          
          {!completed ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Professional Development Assessment</CardTitle>
                    <CardDescription>
                      Complete all four sections to receive your personalized learning path
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{answeredQuestions}/{totalQuestions}</span>
                    <span className="text-muted-foreground">questions answered</span>
                  </div>
                </div>
              </CardHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-2 w-full">
                    {Object.values(DOMAINS).map(domain => (
                      <TabsTrigger 
                        key={domain} 
                        value={domain}
                        className="relative"
                        onClick={() => setActiveQuestionIndex(0)}
                      >
                        {formatDomainName(domain)}
                        <span 
                          className="absolute -bottom-1 left-0 h-1 bg-primary rounded-full transition-all" 
                          style={{ width: `${getDomainProgress(domain)}%` }}
                        ></span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {Object.values(DOMAINS).map(domain => (
                  <TabsContent key={domain} value={domain} className="p-0">
                    <CardContent className="pt-6">
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h2 className="text-xl font-heading font-semibold">
                            {activeQuestionIndex + 1} of {currentDomainQuestions.length}
                          </h2>
                          <div className="text-sm text-muted-foreground">
                            {questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.category}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-heading font-medium mb-6">
                          {questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.question}
                        </h3>
                        
                        <RadioGroup
                          value={answers[questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.id] || ""}
                          onValueChange={handleOptionSelect}
                          className="space-y-3"
                        >
                          {questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.options.map((option) => (
                            <div 
                              key={option.id} 
                              className={`flex items-center space-x-3 border rounded-lg p-4 hover:border-primary transition ${
                                answers[questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.id] === option.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <RadioGroupItem value={option.id} id={`${domain}-${option.id}`} />
                              <Label 
                                htmlFor={`${domain}-${option.id}`} 
                                className="flex-1 cursor-pointer"
                              >
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pb-6">
                      <Button 
                        variant="outline" 
                        onClick={handlePrevious}
                        disabled={activeQuestionIndex === 0 && Object.values(DOMAINS).indexOf(domain) === 0}
                      >
                        Previous
                      </Button>
                      <Button 
                        onClick={handleNext}
                        disabled={!answers[questions[domain as keyof typeof DOMAINS][activeQuestionIndex]?.id] || isPending}
                      >
                        {activeQuestionIndex < questions[domain as keyof typeof DOMAINS].length - 1 
                          ? "Next Question" 
                          : Object.values(DOMAINS).indexOf(domain) < Object.values(DOMAINS).length - 1
                            ? "Next Section"
                            : "Complete Assessment"
                        }
                      </Button>
                    </CardFooter>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          ) : (
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Assessment Complete!</CardTitle>
                <CardDescription>
                  Thank you for completing the teacher development assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-4xl text-primary"></i>
                  </div>
                  
                  <h3 className="text-xl font-heading font-bold mb-2">
                    Your personalized professional development path is ready
                  </h3>
                  
                  <p className="text-muted-foreground mb-6">
                    Based on your assessment, we've created a customized learning plan focusing on your growth areas while building on your strengths.
                  </p>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg text-left mb-6">
                    <h4 className="font-medium text-primary mb-2">Your Assessment Insights:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Your learning modules have been personalized based on your assessment results</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Your dashboard shows your strengths and areas for growth</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Unlock achievement levels as you progress through your customized path</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Look for the "Mindful Mornings" module which includes breathing exercises, self-affirmations, and gratitude practices</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={() => setLocation("/")} className="px-8">
                  Go to My Dashboard
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      
      <ChatbotSupport />
    </div>
  );
}
