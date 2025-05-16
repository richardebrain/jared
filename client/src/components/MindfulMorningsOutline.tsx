import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Wind,
  Heart,
  SunMedium,
  Sparkles,
  Brain,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  ArrowRightCircle,
  BookOpen,
  FileText,
  Award,
  PenSquare,
  ExternalLink,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

interface Module {
  id: string;
  title: string;
  time: string;
  objective: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  sections: ModuleSection[];
}

interface ModuleSection {
  id: string;
  title: string;
  type: "video" | "practice" | "journal" | "quiz" | "plan" | "read";
  content: React.ReactNode;
  duration?: string;
}

export function MindfulMorningsOutline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState("module0");
  const [activeSection, setActiveSection] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<string, any>>({});
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({});
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [lastPointsAwarded, setLastPointsAwarded] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get user progress
  const { data: userProgress } = useQuery({
    queryKey: ['/api/progress/by-user'],
    enabled: !!user,
  });

  // Find the Mindful Mornings module IDs
  const { data: modules } = useQuery({
    queryKey: ['/api/modules'],
    enabled: !!user,
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (data: { moduleId: number, progress: number, completed: boolean, pointsEarned?: number }) => {
      return apiRequest(`/api/progress`, {
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress/by-user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update progress: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: (points: number) => {
      return apiRequest(`/api/users/add-points`, {
        method: "POST",
        data: { points }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add points: " + error.message,
        variant: "destructive"
      });
    }
  });
  
  const addPoints = (points: number) => {
    setLastPointsAwarded(points);
    setPointsEarned(prev => prev + points);
    setShowPointsAnimation(true);
    
    // Hide the animation after 3 seconds
    setTimeout(() => {
      setShowPointsAnimation(false);
    }, 3000);
    
    // Call the API to add points
    addPointsMutation.mutate(points);
  };

  // Quiz questions for each module
  const quizQuestions: Record<string, QuizQuestion[]> = {
    module0: [
      {
        id: "q0-1",
        question: "By age 5, the majority of our neural connections are formed.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" }
        ],
        correctOptionId: "true",
        explanation: "Research shows that by age 5, approximately 90% of a child's brain development is complete, forming most of the neural connections they'll have throughout life."
      }
    ],
    module1: [
      {
        id: "q1-1",
        question: "Which brain region benefits most from paced breathing?",
        options: [
          { id: "prefrontal", text: "Prefrontal cortex" },
          { id: "occipital", text: "Occipital lobe" },
          { id: "cerebellum", text: "Cerebellum" },
          { id: "brainstem", text: "Brainstem" }
        ],
        correctOptionId: "prefrontal",
        explanation: "The prefrontal cortex, responsible for executive functions like attention, impulse control, and emotional regulation, benefits most from paced breathing techniques."
      }
    ],
    module2: [
      {
        id: "q2-1",
        question: "Which of the following benefits is associated with regular affirmation practice?",
        options: [
          { id: "neural", text: "Strengthens positive neural circuits" },
          { id: "cortisol", text: "Reduces cortisol spikes" },
          { id: "creative", text: "Increases creative problem-solving" },
          { id: "all", text: "All of the above" }
        ],
        correctOptionId: "all",
        explanation: "Regular affirmation practice has been shown to strengthen positive neural circuits, reduce stress hormone (cortisol) levels, and enhance creative problem-solving abilities."
      }
    ],
    module3: [
      {
        id: "q3-1",
        question: "Practicing gratitude regularly has been scientifically proven to reduce levels of cortisol (the stress hormone) in the body.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" }
        ],
        correctOptionId: "true",
        explanation: "Research shows that regular gratitude practice reduces cortisol levels (the stress hormone), improving overall stress management and emotional wellbeing."
      },
      {
        id: "q3-2",
        question: "Gratitude practice is linked to improved sleep quality.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" }
        ],
        correctOptionId: "true",
        explanation: "Multiple studies have demonstrated that people who practice gratitude regularly report better sleep quality, including falling asleep faster and staying asleep longer."
      }
    ]
  };

  // Modules data structure
  const courseModules: Module[] = [
    {
      id: "module0",
      title: "Welcome & Why It Matters",
      time: "5 min",
      objective: "Ignite passion for the power of ages 0–5",
      description: "Understand the critical importance of early childhood development",
      icon: <Brain />,
      color: "bg-purple-500",
      sections: [
        {
          id: "m0-video",
          title: "Brain Development Time-lapse",
          type: "video",
          duration: "2 min",
          content: (
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
                  {!videoPlaying ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 z-10"></div>
                      <div className="z-20 text-white">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-16 w-16 rounded-full bg-white/10 backdrop-blur"
                          onClick={() => {
                            setVideoPlaying(true);
                            // Auto-mark as complete after 5 seconds to ensure progression
                            setTimeout(() => {
                              markSectionComplete(`${activeModule}-${activeSection}`);
                            }, 5000);
                          }}
                        >
                          <PlayCircle className="h-10 w-10 text-white" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/ItCU1rCuumA?autoplay=1&rel=0"
                      title="90% of a Child's Brain Develops By Age 5"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                  {!videoPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-purple-500" style={{ width: '0%', transition: 'width 0.5s linear' }}></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  "90% of Brain Development Happens by Age 5" - Dr. Lyndy Jones (Pediatrician)
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                <h3 className="font-medium text-purple-800 mb-1">Key Facts</h3>
                <ul className="list-disc pl-5 text-sm text-purple-700 space-y-1">
                  <li>A child's brain forms more than 1 million new neural connections every second during the first five years.</li>
                  <li>By age 5, approximately 90% of a child's brain is developed.</li>
                  <li>Early experiences directly affect the way the brain gets wired and create the foundation for all future learning.</li>
                </ul>
              </div>
              <Button 
                onClick={() => {
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(2);
                }}
                className="w-full"
              >
                I've watched the video
              </Button>
            </div>
          )
        },
        {
          id: "m0-journal",
          title: "Reflect on Your Early Years",
          type: "journal",
          duration: "2 min",
          content: (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="font-medium text-slate-800 mb-2">Journal Prompt</h3>
                <p className="text-slate-700 mb-4">
                  In your journal, write one word that describes your own early-years narrative. 
                  How does your early childhood experience influence your approach to teaching?
                </p>
                <Textarea 
                  placeholder="Write your reflection here..."
                  className="min-h-[120px]"
                  value={userResponses[`${activeModule}-journal`] || ''}
                  onChange={(e) => setUserResponses({
                    ...userResponses,
                    [`${activeModule}-journal`]: e.target.value
                  })}
                />
              </div>
              <Button 
                onClick={() => {
                  if ((userResponses[`${activeModule}-journal`] || '').length < 10) {
                    toast({
                      title: "Journal Entry Too Short",
                      description: "Please write at least a few words in your reflection.",
                      variant: "destructive"
                    });
                    return;
                  }
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(3);
                }}
                className="w-full"
                disabled={(userResponses[`${activeModule}-journal`] || '').length < 10}
              >
                Save My Reflection
              </Button>
            </div>
          )
        },
        {
          id: "m0-quiz",
          title: "Quick Quiz",
          type: "quiz",
          duration: "1 min",
          content: (
            <div className="space-y-4">
              {quizQuestions.module0.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-800 mb-3">{q.question}</h3>
                  <RadioGroup 
                    value={quizResponses[q.id] || ''} 
                    onValueChange={(value) => {
                      setQuizResponses({
                        ...quizResponses,
                        [q.id]: value
                      });
                    }}
                  >
                    {q.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 my-2">
                        <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                        <Label htmlFor={`${q.id}-${option.id}`}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {quizResponses[q.id] && (
                    <div className={`mt-3 p-3 rounded-md ${
                      quizResponses[q.id] === q.correctOptionId 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      {quizResponses[q.id] === q.correctOptionId ? (
                        <p className="text-green-800 text-sm flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{q.explanation}</span>
                        </p>
                      ) : (
                        <p className="text-red-800 text-sm">
                          Incorrect. {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={() => {
                  const allAnswered = quizQuestions.module0.every(q => quizResponses[q.id]);
                  const allCorrect = quizQuestions.module0.every(q => quizResponses[q.id] === q.correctOptionId);
                  
                  if (!allAnswered) {
                    toast({
                      title: "Quiz Incomplete",
                      description: "Please answer all questions before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  
                  if (allCorrect) {
                    addPoints(5);
                    toast({
                      title: "Perfect Score!",
                      description: "You answered all questions correctly.",
                      variant: "default"
                    });
                  } else {
                    addPoints(3);
                  }
                }}
                className="w-full"
                disabled={!quizQuestions.module0.every(q => quizResponses[q.id])}
              >
                Submit Quiz
              </Button>
            </div>
          )
        }
      ]
    },
    {
      id: "module1",
      title: "Grounding with Breath",
      time: "15 min",
      objective: "Learn a simple daily breath routine to regulate emotion",
      description: "Master breathing techniques that help calm your nervous system",
      icon: <Wind />,
      color: "bg-blue-500",
      sections: [
        {
          id: "m1-video",
          title: "Morning Coherence Breathwork",
          type: "video",
          duration: "4 min",
          content: (
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
                  {!videoPlaying ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 z-10"></div>
                      <div className="z-20 text-white">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-16 w-16 rounded-full bg-white/10 backdrop-blur"
                          onClick={() => {
                            setVideoPlaying(true);
                            // Auto-mark as complete after 5 seconds to ensure progression
                            setTimeout(() => {
                              markSectionComplete(`${activeModule}-${activeSection}`);
                            }, 5000);
                          }}
                        >
                          <PlayCircle className="h-10 w-10 text-white" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/GtMciuKYI5Y?autoplay=1&rel=0"
                      title="Achieve Heart Coherence in 5 Minutes | Dr. Joe Dispenza"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  "Achieve Heart Coherence in 5 Minutes" - Dr. Joe Dispenza (HeartMath Institute)
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-1">About Coherent Breathing</h3>
                <p className="text-sm text-blue-700 mb-3">
                  This technique synchronizes your heart rhythm, respiratory system, and brain activity, 
                  creating a state of physiological coherence that improves focus, emotional regulation, 
                  and energy levels.
                </p>
              </div>
              <Button 
                onClick={() => {
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(2);
                }}
                className="w-full"
              >
                I've watched the video
              </Button>
            </div>
          )
        },
        {
          id: "m1-practice",
          title: "Practice Breathing",
          type: "practice",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                <h3 className="font-medium text-blue-900 text-center mb-6">4-7-8 Breathing Practice</h3>
                
                <div className="relative h-60 w-60 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-8 border-blue-100"></div>
                  <div className="absolute inset-4 rounded-full border-8 border-blue-200 flex items-center justify-center">
                    <div className={`h-32 w-32 bg-blue-400 rounded-full flex items-center justify-center transition-all duration-1000 ${
                      videoPlaying 
                        ? 'scale-100 opacity-100' 
                        : 'scale-50 opacity-30'
                    }`}>
                      <span className="text-white font-bold text-4xl">
                        {!videoPlaying ? "Start" : userResponses[`${activeModule}-breath-phase`]}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <p className="text-slate-700">Complete 3 rounds of 4-7-8 breathing:</p>
                  <ol className="text-sm text-slate-600 space-y-1">
                    <li>Inhale quietly through your nose for 4 seconds</li>
                    <li>Hold your breath for 7 seconds</li>
                    <li>Exhale completely through your mouth for 8 seconds</li>
                  </ol>
                  
                  <Button 
                    onClick={() => {
                      if (!videoPlaying) {
                        setVideoPlaying(true);
                        // Simulate breathing phases
                        let phase = "Inhale";
                        let count = 0;
                        let round = 1;
                        
                        setUserResponses({
                          ...userResponses,
                          [`${activeModule}-breath-phase`]: "Inhale"
                        });
                        
                        const timer = setInterval(() => {
                          count++;
                          
                          if (phase === "Inhale" && count >= 4) {
                            phase = "Hold";
                            count = 0;
                            setUserResponses({
                              ...userResponses,
                              [`${activeModule}-breath-phase`]: "Hold"
                            });
                          } else if (phase === "Hold" && count >= 7) {
                            phase = "Exhale";
                            count = 0;
                            setUserResponses({
                              ...userResponses,
                              [`${activeModule}-breath-phase`]: "Exhale"
                            });
                          } else if (phase === "Exhale" && count >= 8) {
                            phase = "Inhale";
                            count = 0;
                            round++;
                            setUserResponses({
                              ...userResponses,
                              [`${activeModule}-breath-phase`]: "Inhale"
                            });
                            
                            if (round > 3) {
                              clearInterval(timer);
                              setVideoPlaying(false);
                              setUserResponses({
                                ...userResponses,
                                [`${activeModule}-breathing-complete`]: true
                              });
                            }
                          }
                        }, 1000);
                        
                        timerRef.current = timer;
                      } else {
                        // Stop breathing exercise
                        if (timerRef.current) {
                          clearInterval(timerRef.current);
                        }
                        setVideoPlaying(false);
                      }
                    }}
                    variant={videoPlaying ? "destructive" : "default"}
                    size="lg"
                    className="mt-4"
                  >
                    {videoPlaying ? "Stop Exercise" : "Start Breathing Exercise"}
                  </Button>
                  
                  {userResponses[`${activeModule}-breathing-complete`] && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
                      <p className="text-green-800 text-sm flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        You've completed the breathing exercise!
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  if (!userResponses[`${activeModule}-breathing-complete`]) {
                    toast({
                      title: "Exercise Incomplete",
                      description: "Please complete the breathing exercise before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-breathing-complete`]}
              >
                Complete Exercise
              </Button>
            </div>
          )
        },
        {
          id: "m1-journal",
          title: "Reflect on Your Experience",
          type: "journal",
          duration: "3 min",
          content: (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="font-medium text-slate-800 mb-2">Journal Prompt</h3>
                <p className="text-slate-700 mb-4">
                  How did your heart, mind, and body feel before vs. after the breathing exercise?
                </p>
                <Textarea 
                  placeholder="Write your reflection here..."
                  className="min-h-[120px]"
                  value={userResponses[`${activeModule}-journal`] || ''}
                  onChange={(e) => setUserResponses({
                    ...userResponses,
                    [`${activeModule}-journal`]: e.target.value
                  })}
                />
              </div>
              <Button 
                onClick={() => {
                  if ((userResponses[`${activeModule}-journal`] || '').length < 10) {
                    toast({
                      title: "Journal Entry Too Short",
                      description: "Please write at least a few words in your reflection.",
                      variant: "destructive"
                    });
                    return;
                  }
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(3);
                }}
                className="w-full"
                disabled={(userResponses[`${activeModule}-journal`] || '').length < 10}
              >
                Save My Reflection
              </Button>
            </div>
          )
        },
        {
          id: "m1-quiz",
          title: "Knowledge Check",
          type: "quiz",
          duration: "3 min",
          content: (
            <div className="space-y-4">
              {quizQuestions.module1.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-800 mb-3">{q.question}</h3>
                  <RadioGroup 
                    value={quizResponses[q.id] || ''} 
                    onValueChange={(value) => {
                      setQuizResponses({
                        ...quizResponses,
                        [q.id]: value
                      });
                    }}
                  >
                    {q.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 my-2">
                        <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                        <Label htmlFor={`${q.id}-${option.id}`}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {quizResponses[q.id] && (
                    <div className={`mt-3 p-3 rounded-md ${
                      quizResponses[q.id] === q.correctOptionId 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      {quizResponses[q.id] === q.correctOptionId ? (
                        <p className="text-green-800 text-sm flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{q.explanation}</span>
                        </p>
                      ) : (
                        <p className="text-red-800 text-sm">
                          Incorrect. {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={() => {
                  const allAnswered = quizQuestions.module1.every(q => quizResponses[q.id]);
                  const allCorrect = quizQuestions.module1.every(q => quizResponses[q.id] === q.correctOptionId);
                  
                  if (!allAnswered) {
                    toast({
                      title: "Quiz Incomplete",
                      description: "Please answer all questions before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  
                  if (allCorrect) {
                    addPoints(5);
                    toast({
                      title: "Perfect Score!",
                      description: "You answered all questions correctly.",
                      variant: "default"
                    });
                  } else {
                    addPoints(3);
                  }
                }}
                className="w-full"
                disabled={!quizQuestions.module1.every(q => quizResponses[q.id])}
              >
                Submit Quiz
              </Button>
            </div>
          )
        }
      ]
    },
    {
      id: "module2",
      title: "Building Your Narrative with Affirmations",
      time: "20 min",
      objective: "Harness 'I am...' statements to rewire self-image",
      description: "Create powerful affirmations that shape your inner dialogue",
      icon: <Sparkles />,
      color: "bg-amber-500",
      sections: [
        {
          id: "m2-read",
          title: "The Power of Affirmations",
          type: "read",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-amber-100 shadow-sm">
                <h3 className="font-medium text-amber-900 text-lg mb-3">Neuroplasticity & Affirmations</h3>
                
                <div className="prose prose-sm max-w-none text-slate-700">
                  <p>
                    Affirmations are positive statements that can help you challenge and overcome self-sabotaging and negative thoughts. 
                    When repeated regularly, affirmations can reprogram your thinking patterns and begin to change how you feel about yourself and your environment.
                  </p>
                  
                  <h4 className="text-amber-800 mt-4 mb-2">The Science Behind Affirmations</h4>
                  
                  <p>
                    Neuroscience research shows that certain neural pathways are strengthened through repetition. 
                    When you repeat positive affirmations, you're creating and reinforcing new pathways that support your desired beliefs.
                  </p>
                  
                  <ul className="list-disc pl-5 space-y-1 my-3">
                    <li><strong>Neuroplasticity</strong>: Your brain forms new neural connections throughout life, allowing you to adapt your thoughts and behaviors.</li>
                    <li><strong>Reticular Activating System (RAS)</strong>: Affirmations help program your RAS to notice opportunities aligned with your goals.</li>
                    <li><strong>Stress Reduction</strong>: Regular affirmation practice decreases cortisol levels and activates the parasympathetic nervous system.</li>
                  </ul>
                  
                  <p>
                    Studies have shown that teacher affirmations can significantly impact classroom atmosphere, 
                    teacher-child relationships, and ultimately influence children's learning experiences.
                  </p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-md mt-4 border border-amber-100">
                  <h4 className="text-amber-800 text-sm font-medium mb-1">Research Highlight</h4>
                  <p className="text-xs text-amber-700">
                    A 2016 Carnegie Mellon University study found that self-affirmation activates brain circuits associated with self-related processing and reward. 
                    Participants who practiced affirmations showed increased activity in the ventral striatum and ventromedial prefrontal cortex—regions linked to positive valuation and self-related information processing.
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
                  {!videoPlaying ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 z-10"></div>
                      <div className="z-20 text-white">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-16 w-16 rounded-full bg-white/10 backdrop-blur"
                          onClick={() => setVideoPlaying(true)}
                        >
                          <PlayCircle className="h-10 w-10 text-white" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/9lUSi4nRtig?autoplay=1"
                      title="Transform Your Health with Powerful Daily Affirmations"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}
                  {!videoPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-amber-500" style={{ width: '0%', transition: 'width 0.5s linear' }}></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  "Transform Your Health with Powerful Daily Affirmations" - Self-Improvement HQ
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(2);
                }}
                className="w-full"
              >
                I've read the material
              </Button>
            </div>
          )
        },
        {
          id: "m2-practice",
          title: "Create Your Affirmations",
          type: "practice",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-amber-100 shadow-sm">
                <h3 className="font-medium text-amber-900 text-lg mb-3">Create Your 3 Affirmations</h3>
                
                <p className="text-slate-700 mb-4">
                  Choose three "I am..." statements that resonate with you. These should reflect qualities 
                  you want to embody as an educator.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Affirmation 1</label>
                    <Textarea 
                      placeholder="I am..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-affirmation1`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-affirmation1`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Affirmation 2</label>
                    <Textarea 
                      placeholder="I am..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-affirmation2`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-affirmation2`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Affirmation 3</label>
                    <Textarea 
                      placeholder="I am..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-affirmation3`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-affirmation3`]: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="mt-5 bg-amber-50 p-3 rounded-md border border-amber-100">
                  <h4 className="text-amber-800 text-sm font-medium mb-1">Tips for Effective Affirmations</h4>
                  <ul className="list-disc text-xs text-amber-700 pl-4 space-y-1">
                    <li>Use present tense, not future ("I am" not "I will be")</li>
                    <li>Keep them positive (what you want, not what you don't want)</li>
                    <li>Make them specific and meaningful to you</li>
                    <li>Choose affirmations that feel slightly aspirational but believable</li>
                  </ul>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const affirmation1 = userResponses[`${activeModule}-affirmation1`] || '';
                  const affirmation2 = userResponses[`${activeModule}-affirmation2`] || '';
                  const affirmation3 = userResponses[`${activeModule}-affirmation3`] || '';
                  
                  if (!affirmation1 || !affirmation2 || !affirmation3) {
                    toast({
                      title: "Incomplete Affirmations",
                      description: "Please create all three affirmations before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  if (!affirmation1.toLowerCase().includes('i am') || 
                      !affirmation2.toLowerCase().includes('i am') || 
                      !affirmation3.toLowerCase().includes('i am')) {
                    toast({
                      title: "Invalid Format",
                      description: "Each affirmation should start with or include 'I am'.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-affirmation1`] || 
                          !userResponses[`${activeModule}-affirmation2`] || 
                          !userResponses[`${activeModule}-affirmation3`]}
              >
                Save My Affirmations
              </Button>
            </div>
          )
        },
        {
          id: "m2-worksheet",
          title: "Classroom Application",
          type: "practice",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-amber-100 shadow-sm">
                <h3 className="font-medium text-amber-900 text-lg mb-3">Classroom Application</h3>
                
                <p className="text-slate-700 mb-4">
                  For each affirmation, identify a specific classroom scenario where you'll use it.
                </p>
                
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800">{userResponses[`${activeModule}-affirmation1`] || 'Affirmation 1'}</h4>
                    <p className="text-xs text-slate-500 mb-2">When will you use this affirmation in your classroom?</p>
                    <Textarea 
                      placeholder="I will use this affirmation when..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-scenario1`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-scenario1`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800">{userResponses[`${activeModule}-affirmation2`] || 'Affirmation 2'}</h4>
                    <p className="text-xs text-slate-500 mb-2">When will you use this affirmation in your classroom?</p>
                    <Textarea 
                      placeholder="I will use this affirmation when..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-scenario2`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-scenario2`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800">{userResponses[`${activeModule}-affirmation3`] || 'Affirmation 3'}</h4>
                    <p className="text-xs text-slate-500 mb-2">When will you use this affirmation in your classroom?</p>
                    <Textarea 
                      placeholder="I will use this affirmation when..."
                      className="h-[60px]"
                      value={userResponses[`${activeModule}-scenario3`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-scenario3`]: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const scenario1 = userResponses[`${activeModule}-scenario1`] || '';
                  const scenario2 = userResponses[`${activeModule}-scenario2`] || '';
                  const scenario3 = userResponses[`${activeModule}-scenario3`] || '';
                  
                  if (!scenario1 || !scenario2 || !scenario3) {
                    toast({
                      title: "Incomplete Scenarios",
                      description: "Please describe all three classroom scenarios before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-scenario1`] || 
                          !userResponses[`${activeModule}-scenario2`] || 
                          !userResponses[`${activeModule}-scenario3`]}
              >
                Submit Classroom Applications
              </Button>
            </div>
          )
        },
        {
          id: "m2-quiz",
          title: "Knowledge Check",
          type: "quiz",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              {quizQuestions.module2.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-800 mb-3">{q.question}</h3>
                  <RadioGroup 
                    value={quizResponses[q.id] || ''} 
                    onValueChange={(value) => {
                      setQuizResponses({
                        ...quizResponses,
                        [q.id]: value
                      });
                    }}
                  >
                    {q.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 my-2">
                        <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                        <Label htmlFor={`${q.id}-${option.id}`}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {quizResponses[q.id] && (
                    <div className={`mt-3 p-3 rounded-md ${
                      quizResponses[q.id] === q.correctOptionId 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      {quizResponses[q.id] === q.correctOptionId ? (
                        <p className="text-green-800 text-sm flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{q.explanation}</span>
                        </p>
                      ) : (
                        <p className="text-red-800 text-sm">
                          Incorrect. {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={() => {
                  const allAnswered = quizQuestions.module2.every(q => quizResponses[q.id]);
                  const allCorrect = quizQuestions.module2.every(q => quizResponses[q.id] === q.correctOptionId);
                  
                  if (!allAnswered) {
                    toast({
                      title: "Quiz Incomplete",
                      description: "Please answer all questions before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  
                  if (allCorrect) {
                    addPoints(5);
                    toast({
                      title: "Perfect Score!",
                      description: "You answered all questions correctly.",
                      variant: "default"
                    });
                  } else {
                    addPoints(3);
                  }
                }}
                className="w-full"
                disabled={!quizQuestions.module2.every(q => quizResponses[q.id])}
              >
                Submit Quiz
              </Button>
            </div>
          )
        }
      ]
    },
    {
      id: "module3",
      title: "Cultivating Daily Gratitude",
      time: "15 min",
      objective: "Build an evidence-based gratitude habit that lowers stress",
      description: "Establish a gratitude practice to improve wellbeing",
      icon: <Heart />,
      color: "bg-red-500",
      sections: [
        {
          id: "m3-video",
          title: "The Science of Gratitude",
          type: "video",
          duration: "2 min",
          content: (
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
                  {!videoPlaying ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-pink-900/20 z-10"></div>
                      <div className="z-20 text-white">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-16 w-16 rounded-full bg-white/10 backdrop-blur"
                          onClick={() => {
                            setVideoPlaying(true);
                            window.open("https://www.ncesd.org/behavior-health/video-science-of-gratitude/", "_blank");
                          }}
                        >
                          <PlayCircle className="h-10 w-10 text-white" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-white text-center p-4">
                        <ExternalLink className="h-8 w-8 mx-auto mb-2" />
                        <p>Video opened in new tab</p>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setVideoPlaying(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                  {!videoPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-red-500" style={{ width: '0%', transition: 'width 0.5s linear' }}></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  "The Science of Gratitude" - North Central Educational Service District
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <h3 className="font-medium text-red-800 mb-1">Research Findings on Gratitude</h3>
                <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                  <li>Regular gratitude practice has been shown to reduce cortisol levels by up to 23%</li>
                  <li>Grateful people sleep an average of 30 minutes more per night and wake up feeling more refreshed</li>
                  <li>Teachers who practice gratitude report higher job satisfaction and lower burnout rates</li>
                  <li>Gratitude increases prosocial behaviors and strengthens classroom community</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => {
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(2);
                }}
                className="w-full"
              >
                I've watched the video
              </Button>
            </div>
          )
        },
        {
          id: "m3-journal",
          title: "Gratitude Journal",
          type: "journal",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-red-100 shadow-sm">
                <h3 className="font-medium text-red-900 text-lg mb-3">Gratitude Journal</h3>
                
                <p className="text-slate-700 mb-4">
                  Write three things you're grateful for today. They can be big or small.
                </p>
                
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 text-sm">I'm grateful for...</h4>
                    <Textarea 
                      placeholder="Something in your personal life..."
                      className="h-[60px] mt-2"
                      value={userResponses[`${activeModule}-gratitude1`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-gratitude1`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 text-sm">I'm grateful for...</h4>
                    <Textarea 
                      placeholder="Something related to your work as an educator..."
                      className="h-[60px] mt-2"
                      value={userResponses[`${activeModule}-gratitude2`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-gratitude2`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 text-sm">I'm grateful for...</h4>
                    <Textarea 
                      placeholder="Something about yourself..."
                      className="h-[60px] mt-2"
                      value={userResponses[`${activeModule}-gratitude3`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-gratitude3`]: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="mt-5 bg-red-50 p-3 rounded-md border border-red-100">
                  <h4 className="text-red-800 text-sm font-medium mb-1">Reflection Tip</h4>
                  <p className="text-xs text-red-700">
                    For maximum benefit, try to be specific about why you're grateful for each item. Research shows that detailed gratitude reflections create stronger positive emotions.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const gratitude1 = userResponses[`${activeModule}-gratitude1`] || '';
                  const gratitude2 = userResponses[`${activeModule}-gratitude2`] || '';
                  const gratitude3 = userResponses[`${activeModule}-gratitude3`] || '';
                  
                  if (!gratitude1 || !gratitude2 || !gratitude3) {
                    toast({
                      title: "Incomplete Journal",
                      description: "Please complete all three gratitude entries before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-gratitude1`] || 
                          !userResponses[`${activeModule}-gratitude2`] || 
                          !userResponses[`${activeModule}-gratitude3`]}
              >
                Save My Gratitude Journal
              </Button>
            </div>
          )
        },
        {
          id: "m3-practice",
          title: "Thank You Note",
          type: "practice",
          duration: "3 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-red-100 shadow-sm">
                <h3 className="font-medium text-red-900 text-lg mb-3">Draft a Thank You Note</h3>
                
                <p className="text-slate-700 mb-4">
                  Write a quick thank-you note to someone—a colleague, friend, or family member. 
                  You don't have to send it now (though that would be wonderful), but drafting it helps 
                  cultivate an attitude of expressed gratitude.
                </p>
                
                <div className="bg-red-50 p-3 rounded-md border border-red-100 mb-4">
                  <h4 className="text-red-800 text-sm font-medium mb-1">Why This Matters</h4>
                  <p className="text-xs text-red-700">
                    Research shows that expressing gratitude to others strengthens social bonds and creates a positive feedback loop 
                    of appreciation and connection. For teachers, this practice helps build supportive professional relationships.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">To:</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Who are you thanking?"
                      value={userResponses[`${activeModule}-thankyou-to`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-thankyou-to`]: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Your Message:</label>
                    <Textarea 
                      placeholder="Dear _____, I wanted to thank you for..."
                      className="h-[120px]"
                      value={userResponses[`${activeModule}-thankyou-message`] || ''}
                      onChange={(e) => setUserResponses({
                        ...userResponses,
                        [`${activeModule}-thankyou-message`]: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const to = userResponses[`${activeModule}-thankyou-to`] || '';
                  const message = userResponses[`${activeModule}-thankyou-message`] || '';
                  
                  if (!to || !message) {
                    toast({
                      title: "Incomplete Thank You Note",
                      description: "Please complete both recipient and message fields.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-thankyou-to`] || 
                          !userResponses[`${activeModule}-thankyou-message`]}
              >
                Save My Thank You Note
              </Button>
            </div>
          )
        },
        {
          id: "m3-quiz",
          title: "Science Check",
          type: "quiz",
          duration: "5 min",
          content: (
            <div className="space-y-4">
              {quizQuestions.module3.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <h3 className="font-medium text-gray-800 mb-3">{q.question}</h3>
                  <RadioGroup 
                    value={quizResponses[q.id] || ''} 
                    onValueChange={(value) => {
                      setQuizResponses({
                        ...quizResponses,
                        [q.id]: value
                      });
                    }}
                  >
                    {q.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 my-2">
                        <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                        <Label htmlFor={`${q.id}-${option.id}`}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {quizResponses[q.id] && (
                    <div className={`mt-3 p-3 rounded-md ${
                      quizResponses[q.id] === q.correctOptionId 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-red-50 border border-red-100'
                    }`}>
                      {quizResponses[q.id] === q.correctOptionId ? (
                        <p className="text-green-800 text-sm flex items-start">
                          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{q.explanation}</span>
                        </p>
                      ) : (
                        <p className="text-red-800 text-sm">
                          Incorrect. {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={() => {
                  const allAnswered = quizQuestions.module3.every(q => quizResponses[q.id]);
                  const allCorrect = quizQuestions.module3.every(q => quizResponses[q.id] === q.correctOptionId);
                  
                  if (!allAnswered) {
                    toast({
                      title: "Quiz Incomplete",
                      description: "Please answer all questions before proceeding.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextModule();
                  
                  if (allCorrect) {
                    addPoints(5);
                    toast({
                      title: "Perfect Score!",
                      description: "You answered all questions correctly.",
                      variant: "default"
                    });
                  } else {
                    addPoints(3);
                  }
                }}
                className="w-full"
                disabled={!quizQuestions.module3.every(q => quizResponses[q.id])}
              >
                Submit Quiz
              </Button>
            </div>
          )
        }
      ]
    },
    {
      id: "module4",
      title: "Your Mindful Morning Plan & Badge",
      time: "5 min",
      objective: "Commit to bringing these practices into your classroom",
      description: "Create a personal implementation plan and earn your badge",
      icon: <Award />,
      color: "bg-green-500",
      sections: [
        {
          id: "m4-plan",
          title: "Your Mindful Morning Plan",
          type: "plan",
          duration: "3 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm">
                <h3 className="font-medium text-green-900 text-lg mb-3">Your Mindful Morning Plan</h3>
                
                <p className="text-slate-700 mb-4">
                  Create your personal plan for implementing these mindful practices in your classroom.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">Choose one breathing exercise</h4>
                    <RadioGroup 
                      value={userResponses[`${activeModule}-breathing-choice`] || ''} 
                      onValueChange={(value) => {
                        setUserResponses({
                          ...userResponses,
                          [`${activeModule}-breathing-choice`]: value
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="4-7-8" id="4-7-8" />
                        <Label htmlFor="4-7-8">4-7-8 Breathing</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="box" id="box" />
                        <Label htmlFor="box">Box Breathing</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="belly" id="belly" />
                        <Label htmlFor="belly">Belly Breathing</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">Choose one affirmation to focus on first</h4>
                    <RadioGroup 
                      value={userResponses[`${activeModule}-affirmation-choice`] || ''} 
                      onValueChange={(value) => {
                        setUserResponses({
                          ...userResponses,
                          [`${activeModule}-affirmation-choice`]: value
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="affirmation1" id="affirmation1" />
                        <Label htmlFor="affirmation1">{userResponses[`module2-affirmation1`] || "Your first affirmation"}</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="affirmation2" id="affirmation2" />
                        <Label htmlFor="affirmation2">{userResponses[`module2-affirmation2`] || "Your second affirmation"}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="affirmation3" id="affirmation3" />
                        <Label htmlFor="affirmation3">{userResponses[`module2-affirmation3`] || "Your third affirmation"}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">Choose one gratitude ritual</h4>
                    <RadioGroup 
                      value={userResponses[`${activeModule}-gratitude-choice`] || ''} 
                      onValueChange={(value) => {
                        setUserResponses({
                          ...userResponses,
                          [`${activeModule}-gratitude-choice`]: value
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="journal" id="journal" />
                        <Label htmlFor="journal">Morning Gratitude Journal (personal practice)</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="circle" id="circle" />
                        <Label htmlFor="circle">Gratitude Circle with the Children</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="notes" id="notes" />
                        <Label htmlFor="notes">Weekly Thank You Notes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="mt-5 bg-green-50 p-3 rounded-md border border-green-100">
                  <h4 className="text-green-800 text-sm font-medium mb-1">Implementation Tip</h4>
                  <p className="text-xs text-green-700">
                    Start with a small, consistent practice rather than trying to do everything at once. 
                    Choose one time of day (like first thing in the morning) to establish your mindful routine, 
                    then gradually expand as it becomes habitual.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const breathingChoice = userResponses[`${activeModule}-breathing-choice`] || '';
                  const affirmationChoice = userResponses[`${activeModule}-affirmation-choice`] || '';
                  const gratitudeChoice = userResponses[`${activeModule}-gratitude-choice`] || '';
                  
                  if (!breathingChoice || !affirmationChoice || !gratitudeChoice) {
                    toast({
                      title: "Incomplete Plan",
                      description: "Please complete all sections of your Mindful Morning plan.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  moveToNextSection();
                  addPoints(5);
                }}
                className="w-full"
                disabled={!userResponses[`${activeModule}-breathing-choice`] || 
                          !userResponses[`${activeModule}-affirmation-choice`] || 
                          !userResponses[`${activeModule}-gratitude-choice`]}
              >
                Save My Plan
              </Button>
            </div>
          )
        },
        {
          id: "m4-badge",
          title: "Your Digital Badge",
          type: "practice",
          duration: "2 min",
          content: (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm">
                <h3 className="font-medium text-green-900 text-lg mb-3">Earn Your Digital Badge</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-1" />
                          <h3 className="font-bold text-slate-800 text-lg">Mindful Morning</h3>
                          <p className="text-xs text-slate-600">Practitioner</p>
                        </div>
                      </div>
                    </div>
                    {earnedBadge && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-6">
                  <h4 className="text-green-800 font-medium mb-2">Badge Earned!</h4>
                  <p className="text-sm text-green-700">
                    Congratulations on completing the Mindful Morning course! This badge recognizes your commitment 
                    to bringing mindfulness practices into your classroom and creating a positive 
                    learning environment for your students.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h4 className="font-medium text-slate-800 mb-2">Final Reflection</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    In 1–2 sentences, answer: "Why does leading a mindful morning matter for our little learners—and for our world?"
                  </p>
                  <Textarea 
                    placeholder="Your reflection..."
                    className="h-[80px]"
                    value={userResponses[`${activeModule}-final-reflection`] || ''}
                    onChange={(e) => setUserResponses({
                      ...userResponses,
                      [`${activeModule}-final-reflection`]: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const reflection = userResponses[`${activeModule}-final-reflection`] || '';
                  
                  if (reflection.length < 10) {
                    toast({
                      title: "Reflection Too Short",
                      description: "Please write a brief reflection before completing the course.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  setEarnedBadge(true);
                  markSectionComplete(`${activeModule}-${activeSection}`);
                  
                  // Add a completion bonus
                  addPoints(20);
                  
                  toast({
                    title: "🎉 Course Completed!",
                    description: "You've earned the Mindful Morning Practitioner badge and 20 bonus points!",
                    variant: "default"
                  });
                  
                  // Update module progress in the database
                  completeAllModules();
                }}
                className="w-full"
                disabled={(userResponses[`${activeModule}-final-reflection`] || '').length < 10}
              >
                Complete Course & Earn Badge
              </Button>
            </div>
          )
        }
      ]
    }
  ];
  
  // Function to mark a section as complete
  const markSectionComplete = (sectionId: string) => {
    setCompletedSections({
      ...completedSections,
      [sectionId]: true
    });
    updateOverallProgress();
  };
  
  // Function to move to the next section, with auto-transition to next module when needed
  const moveToNextSection = () => {
    const currentModule = courseModules.find(m => m.id === activeModule);
    if (!currentModule) return;
    
    if (activeSection < currentModule.sections.length - 1) {
      // Move to the next section in the same module
      setActiveSection(activeSection + 1);
    } else {
      // We've reached the end of sections in this module, move to the next module
      const currentModuleIndex = courseModules.findIndex(m => m.id === activeModule);
      if (currentModuleIndex < courseModules.length - 1) {
        // There is a next module to move to
        setActiveModule(courseModules[currentModuleIndex + 1].id);
        setActiveSection(0); // Start at the first section of the next module
        
        // Show transition message
        toast({
          title: "Module Complete",
          description: `Moving to ${courseModules[currentModuleIndex + 1].title} module`,
        });
      }
    }
  };
  
  // Function to move to the next module
  const moveToNextModule = () => {
    const currentModuleIndex = courseModules.findIndex(m => m.id === activeModule);
    if (currentModuleIndex < courseModules.length - 1) {
      setActiveModule(courseModules[currentModuleIndex + 1].id);
      setActiveSection(0);
    }
  };
  
  // Function to calculate overall progress
  const updateOverallProgress = () => {
    // Count total sections across all modules
    const totalSections = courseModules.reduce((count, module) => count + module.sections.length, 0);
    
    // Count completed sections
    const completedCount = Object.values(completedSections).filter(Boolean).length;
    
    // Calculate percentage
    const progress = Math.round((completedCount / totalSections) * 100);
    setOverallProgress(progress);
  };
  
  // Function to complete all mindful morning modules in the database
  const completeAllModules = () => {
    if (!modules || !Array.isArray(modules)) return;
    
    // Find all mindful morning modules
    const mindfulModules = modules.filter(m => 
      m.category === 'mindful-mornings' || 
      (m.title.toLowerCase().includes('mindful') && m.title.toLowerCase().includes('morning'))
    );
    
    // Update progress for each module
    mindfulModules.forEach(module => {
      updateProgressMutation.mutate({
        moduleId: module.id,
        progress: 100,
        completed: true,
        pointsEarned: 5
      });
    });
  };
  
  // Get current module and section
  const currentModule = courseModules.find(m => m.id === activeModule);
  const currentSection = currentModule ? currentModule.sections[activeSection] : null;
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);
  
  useEffect(() => {
    updateOverallProgress();
  }, [completedSections]);
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mindful Morning Training</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A comprehensive 60-minute course to help you integrate mindfulness practices into your daily classroom routine.
          </p>
          
          {/* Progress bar */}
          <div className="mt-6 mb-2">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
              <span>Course Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>
        
        {/* Points animation */}
        {showPointsAnimation && (
          <div className="fixed top-16 right-4 bg-green-100 border border-green-300 text-green-800 font-medium px-4 py-2 rounded-md shadow-md animate-bounce z-50">
            +{lastPointsAwarded} points earned!
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Module navigation sidebar */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Course Modules</h2>
              </div>
              
              <div className="p-2">
                {courseModules.map((module, index) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      // Only allow navigation to modules the user has already encountered
                      const currentModuleIndex = courseModules.findIndex(m => m.id === activeModule);
                      if (index <= currentModuleIndex) {
                        setActiveModule(module.id);
                        setActiveSection(0);
                      } else {
                        toast({
                          title: "Complete Current Module First",
                          description: "Please complete the current module before moving ahead.",
                          variant: "destructive"
                        });
                      }
                    }}
                    className={cn(
                      "w-full text-left rounded-md p-3 mb-1 flex items-start transition-colors",
                      activeModule === module.id
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white",
                      module.color
                    )}>
                      {module.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{module.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{module.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-9">
            {currentModule && currentSection && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900">{currentModule.title}</h2>
                      <Badge variant="outline" className="text-xs font-normal">
                        {currentModule.time}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{currentModule.objective}</p>
                  </div>
                  
                  <div className="px-4 pb-2">
                    <TabsList className="w-full grid grid-flow-col justify-start gap-4 overflow-x-auto pb-0.5">
                      {currentModule.sections.map((section, index) => (
                        <TabsTrigger
                          key={section.id}
                          value={index.toString()}
                          disabled={index > activeSection}
                          onClick={() => {
                            if (index <= activeSection) {
                              setActiveSection(index);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-2 whitespace-nowrap",
                            completedSections[`${activeModule}-${index}`] && "text-green-600"
                          )}
                        >
                          {completedSections[`${activeModule}-${index}`] && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span>{section.title}</span>
                          {section.duration && (
                            <span className="text-xs text-slate-500 ml-1">({section.duration})</span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
                
                <div className="p-6">
                  {currentSection.content}
                </div>
                
                <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (activeSection > 0) {
                        setActiveSection(activeSection - 1);
                      } else {
                        // Go to previous module if at first section
                        const currentModuleIndex = courseModules.findIndex(m => m.id === activeModule);
                        if (currentModuleIndex > 0) {
                          const prevModule = courseModules[currentModuleIndex - 1];
                          setActiveModule(prevModule.id);
                          setActiveSection(prevModule.sections.length - 1);
                        }
                      }
                    }}
                    disabled={activeModule === courseModules[0].id && activeSection === 0}
                  >
                    Previous
                  </Button>
                  
                  {activeSection < currentModule.sections.length - 1 ? (
                    <Button 
                      onClick={() => moveToNextSection()}
                      disabled={!completedSections[`${activeModule}-${activeSection}`]}
                      className="gap-2"
                    >
                      Next
                      <ArrowRightCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => moveToNextModule()}
                      disabled={!completedSections[`${activeModule}-${activeSection}`] || 
                                activeModule === courseModules[courseModules.length - 1].id}
                      className="gap-2"
                    >
                      Next Module
                      <ArrowRightCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}