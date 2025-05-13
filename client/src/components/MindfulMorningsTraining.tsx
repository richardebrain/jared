import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Wind,
  Heart,
  SunMedium,
  Sparkles,
  PenLine,
  Smile,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  CheckCircle,
  ArrowRightCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: number; // in seconds
  icon: React.ReactNode;
  color: string;
}

interface Affirmation {
  id: string;
  text: string;
  category: "confidence" | "positivity" | "purpose" | "resilience";
  icon: React.ReactNode;
}

export function MindfulMorningsTraining() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedBreathingExercise, setSelectedBreathingExercise] = useState<string | null>(null);
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [breathingActive, setBreathingActive] = useState(false);
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>(["", "", ""]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({
    breathing: false,
    affirmations: false,
    gratitude: false
  });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [selfAffirmation, setSelfAffirmation] = useState("");
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    addPointsMutation.mutate(points);
  };
  
  // Define the breathing exercises
  const breathingExercises: BreathingExercise[] = [
    {
      id: "478",
      name: "4-7-8 Breathing",
      description: "A calming breath technique that promotes relaxation and stress reduction",
      steps: [
        "Inhale quietly through your nose for 4 seconds",
        "Hold your breath for 7 seconds",
        "Exhale completely through your mouth for 8 seconds",
        "Repeat the cycle 3-4 times"
      ],
      duration: 76, // ~19 seconds per cycle × 4 cycles
      icon: <Wind className="h-8 w-8" />,
      color: "bg-blue-500"
    },
    {
      id: "box",
      name: "Box Breathing",
      description: "A technique used to calm the nervous system and improve focus",
      steps: [
        "Inhale slowly through your nose for 4 seconds",
        "Hold your breath for 4 seconds",
        "Exhale through your mouth for 4 seconds",
        "Hold your breath for 4 seconds",
        "Repeat the cycle 4 times"
      ],
      duration: 64, // 16 seconds per cycle × 4 cycles
      icon: <SunMedium className="h-8 w-8" />,
      color: "bg-amber-500"
    },
    {
      id: "belly",
      name: "Deep Belly Breathing",
      description: "A breathing technique that engages the diaphragm for deeper relaxation",
      steps: [
        "Place one hand on your belly and one on your chest",
        "Breathe in deeply through your nose, feeling your belly expand",
        "Exhale slowly through your mouth, feeling your belly contract",
        "Focus on the rising and falling of your belly",
        "Repeat for 5 full breaths"
      ],
      duration: 50, // ~10 seconds per breath × 5 breaths
      icon: <Heart className="h-8 w-8" />,
      color: "bg-red-500"
    }
  ];
  
  // Define affirmations
  const affirmations: Affirmation[] = [
    {
      id: "confidence1",
      text: "I am capable of creating a positive learning environment for every child.",
      category: "confidence",
      icon: <Sparkles />
    },
    {
      id: "confidence2",
      text: "I have the skills and knowledge to help children thrive.",
      category: "confidence",
      icon: <Sparkles />
    },
    {
      id: "positivity1",
      text: "Today I choose to focus on the joy and wonder in each child's development.",
      category: "positivity",
      icon: <Smile />
    },
    {
      id: "positivity2",
      text: "I bring patience, kindness, and creativity to my classroom every day.",
      category: "positivity",
      icon: <Smile />
    },
    {
      id: "purpose1",
      text: "My work as an educator makes a meaningful difference in children's lives.",
      category: "purpose",
      icon: <Heart />
    },
    {
      id: "purpose2",
      text: "I am helping build the foundation for children to become lifelong learners.",
      category: "purpose",
      icon: <Heart />
    },
    {
      id: "resilience1",
      text: "I can navigate challenges with grace and learn from every experience.",
      category: "resilience",
      icon: <SunMedium />
    },
    {
      id: "resilience2",
      text: "I am growing stronger and more skilled with each day in the classroom.",
      category: "resilience",
      icon: <SunMedium />
    }
  ];
  
  // Function to toggle audio playback
  const toggleAudio = () => {
    // Audio functionality will be added later
    setAudioPlaying(!audioPlaying);
  };
  
  // Function to start the breathing exercise
  const startBreathingExercise = () => {
    setBreathingActive(true);
    setBreathingProgress(0);
    
    const exercise = breathingExercises.find(ex => ex.id === selectedBreathingExercise);
    if (!exercise) return;
    
    const duration = exercise.duration;
    const interval = 100; // Update every 100ms
    const step = 100 / (duration * 10); // Calculate progress step per 100ms
    
    let progress = 0;
    
    // Stop any existing timer
    if (breathingTimerRef.current) {
      clearInterval(breathingTimerRef.current);
    }
    
    // Start a new timer
    breathingTimerRef.current = setInterval(() => {
      progress += step;
      setBreathingProgress(progress);
      
      if (progress >= 100) {
        if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
        setBreathingActive(false);
        setCompletedSections({...completedSections, breathing: true});
        toast({
          title: "Breathing Exercise Complete",
          description: "You've completed the breathing exercise."
        });
      }
    }, interval);
  };
  
  // Function to stop the breathing exercise
  const stopBreathingExercise = () => {
    setBreathingActive(false);
    if (breathingTimerRef.current) {
      clearInterval(breathingTimerRef.current);
    }
  };

  // Function to handle completion of the mindful mornings training
  const handleCompletion = () => {
    // Award points for completing all sections
    if (completedSections.breathing && completedSections.affirmations && completedSections.gratitude) {
      // Award 15 points for completing Mindful Mornings
      addPoints(15);
      
      toast({
        title: "Training Complete!",
        description: "You've earned 15 XP for completing the Mindful Mornings training.",
      });
    }
    
    // Redirect to dashboard or another appropriate page
    window.location.href = "/dashboard";
  };
  
  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Check if the current step can be completed
  const canProceedToNextStep = () => {
    switch (currentStepIndex) {
      case 0: // Welcome page
        return true;
      case 1: // Breathing
        return completedSections.breathing;
      case 2: // Affirmations
        return completedSections.affirmations;
      case 3: // Gratitude
        return completedSections.gratitude;
      default:
        return true;
    }
  };
  
  // Steps of the mindful mornings practice
  const steps = [
    {
      title: "Welcome to Mindful Mornings",
      description: "Start your day with intention, presence, and positivity",
      content: (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="h-32 mb-4 w-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">MM</span>
            </div>
          </div>
          
          <p className="text-center text-lg">
            Mindful Mornings is a brief daily practice to center yourself before starting your day with the children at Raising Arizona Preschool.
          </p>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 max-w-2xl mx-auto mt-4">
            <h3 className="text-indigo-800 font-medium text-lg mb-2">Shaping Their First Chapter</h3>
            <p className="text-indigo-700 text-sm">
              Every interaction with a child is writing a page in their life story. How we present ourselves—our calm, 
              our patience, our joy—becomes woven into their narrative. Through these mindful practices, 
              we prepare ourselves to help author the first chapters of their lives with intention and care.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 flex items-center">
                  <Wind className="h-5 w-5 mr-2" />
                  Breathing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  Calm your nervous system and center your attention with mindful breathing exercises.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-700 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Affirmations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700">
                  Set a positive intention and mindset for your day with empowering statements.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Gratitude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">
                  Cultivate appreciation by reflecting on the things you're grateful for in your life.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center italic text-sm text-neutral-600 mt-6">
            "Breathe, smile, be present." — This simple mantra will be our guide.
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => toggleAudio()}
              variant="outline"
              className="flex items-center"
            >
              {audioPlaying ? (
                <>
                  <PauseCircle className="h-5 w-5 mr-2" />
                  Pause Background Audio
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Play Calming Background Audio
                </>
              )}
            </Button>
          </div>
          
          {/* Audio will be added later */}
        </div>
      )
    },
    {
      title: "Mindful Breathing",
      description: "Calm your mind and body with intentional breathing",
      content: (
        <div className="space-y-6">
          <p className="text-center text-neutral-600">
            Select a breathing exercise to begin. Each exercise is designed to bring you to a calm, centered state.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h3 className="text-blue-800 font-medium text-lg mb-2">The Breath as a Storyteller</h3>
            <p className="text-blue-700 text-sm">
              When we model mindful breathing for children, we write a powerful page in their developing story. 
              Children who witness adults regulating emotions through breath learn an essential life skill that becomes 
              part of their own narrative. By demonstrating that we can pause and breathe before reacting, 
              we help write a chapter where they too can find calm in any storm throughout their lives.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {breathingExercises.map((exercise) => (
              <Card 
                key={exercise.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedBreathingExercise === exercise.id 
                    ? "ring-2 ring-primary ring-offset-2" 
                    : "hover:border-primary/50"
                )}
                onClick={() => {
                  setSelectedBreathingExercise(exercise.id);
                  setBreathingProgress(0);
                  setBreathingActive(false);
                  // Stop any running timer
                  if (breathingTimerRef.current) {
                    clearInterval(breathingTimerRef.current);
                  }
                }}
              >
                <CardHeader className={cn("text-white", exercise.color)}>
                  <div className="flex justify-center mb-2">
                    {exercise.icon}
                  </div>
                  <CardTitle className="text-center">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-center mb-3">{exercise.description}</p>
                  <div className="text-xs text-neutral-600">
                    <span className="block text-center">{exercise.duration / 4} seconds per cycle</span>
                    <span className="block text-center">4 cycles total</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedBreathingExercise && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  {breathingExercises.find(ex => ex.id === selectedBreathingExercise)?.name}
                </CardTitle>
                <CardDescription>
                  Follow the instructions below:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ol className="list-decimal pl-5 space-y-2">
                    {breathingExercises
                      .find(ex => ex.id === selectedBreathingExercise)
                      ?.steps.map((step, index) => (
                        <li key={index} className="text-neutral-700">{step}</li>
                      ))}
                  </ol>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(breathingProgress)}%</span>
                    </div>
                    <Progress value={breathingProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                {!breathingActive ? (
                  <Button onClick={() => startBreathingExercise()}>
                    Start Exercise
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => stopBreathingExercise()}>
                    Stop Exercise
                  </Button>
                )}
                
                {completedSections.breathing && (
                  <div className="ml-2 flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm">Completed</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      )
    },
    {
      title: "Positive Affirmations",
      description: "Set positive intentions for your day",
      content: (
        <div className="space-y-6">
          <p className="text-center text-neutral-600">
            Select affirmations that resonate with you, or create your own to guide your mindset today.
          </p>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
            <h3 className="text-purple-800 font-medium text-lg mb-2">Words That Shape Their Story</h3>
            <p className="text-purple-700 text-sm">
              The words we speak to children and around them become the internal dialogue of their developing minds. 
              By practicing positive affirmations, we're not just changing our own mindset—we're helping children write 
              empowering chapters in their life stories where they believe in their capabilities and worth. 
              Our affirming language today becomes their self-talk tomorrow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {affirmations.map((affirmation) => (
              <Card
                key={affirmation.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedAffirmations.includes(affirmation.id)
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:border-primary/50"
                )}
                onClick={() => {
                  if (selectedAffirmations.includes(affirmation.id)) {
                    setSelectedAffirmations(selectedAffirmations.filter(id => id !== affirmation.id));
                  } else {
                    setSelectedAffirmations([...selectedAffirmations, affirmation.id]);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {affirmation.icon}
                      <span className="capitalize">{affirmation.category}</span>
                    </CardTitle>
                    {selectedAffirmations.includes(affirmation.id) && (
                      <Badge className="bg-green-500">Selected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center">"{affirmation.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <PenLine className="h-5 w-5 mr-2" />
              Create Your Own Affirmation
            </h3>
            <p className="text-sm text-neutral-600 mb-3">
              Write a personal affirmation that reflects your teaching values and aspirations:
            </p>
            <Textarea
              placeholder="I am..."
              value={selfAffirmation}
              onChange={(e) => setSelfAffirmation(e.target.value)}
              className="h-24"
            />
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => {
                if (selectedAffirmations.length > 0 || selfAffirmation.trim().length > 0) {
                  setCompletedSections({...completedSections, affirmations: true});
                  toast({
                    title: "Affirmations Selected",
                    description: "You've completed your affirmations for today."
                  });
                } else {
                  toast({
                    title: "Please Select or Create an Affirmation",
                    description: "Choose at least one affirmation or create your own.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={selectedAffirmations.length === 0 && selfAffirmation.trim().length === 0}
            >
              Confirm My Affirmations
            </Button>
          </div>
          
          {completedSections.affirmations && (
            <div className="flex justify-center items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span>Affirmations Completed</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Gratitude Practice",
      description: "Reflect on the abundance in your life",
      content: (
        <div className="space-y-6">
          <div className="bg-amber-50 p-5 rounded-lg border border-amber-200">
            <h3 className="text-lg font-medium text-amber-800 mb-2">Perspective Reflection</h3>
            <p className="text-sm text-amber-700 mb-3">
              Before we begin, take a moment to consider: You live in Arizona, a place where many aspire to be. 
              You have meaningful work at a wonderful preschool, with resources that many educators around the world 
              can only dream of having. You're making a difference in children's lives every single day.
            </p>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm italic text-neutral-600">
                "Sometimes, our greatest wealth is in the opportunities we have and the impact we can make."
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4 mb-2">
            <h3 className="text-amber-800 font-medium text-lg mb-2">Gratitude: The Backbone of Their Story</h3>
            <p className="text-amber-700 text-sm">
              When we practice gratitude, we model for children how to appreciate life's gifts both big and small. 
              This shapes a crucial chapter in their story—one where they learn to find joy and meaning even in challenging times. 
              Children who witness adults expressing genuine gratitude develop resilience and positivity that becomes 
              woven into their own life narrative, creating a foundation for lifelong emotional wellbeing.
            </p>
          </div>
          
          <p className="text-center text-neutral-600 mt-2">
            Take a moment to identify three things you're grateful for today. Consider the aspects of your life and work 
            that bring you joy, stability, or growth opportunities.
          </p>
          
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="flex items-center text-neutral-700">
                <Heart className={cn("h-5 w-5 mr-2", gratitudeEntries[0].length > 0 ? "text-red-500" : "text-neutral-300")} />
                I am grateful for the basic necessities in my life...
              </label>
              <Textarea
                value={gratitudeEntries[0]}
                onChange={(e) => {
                  const newEntries = [...gratitudeEntries];
                  newEntries[0] = e.target.value;
                  setGratitudeEntries(newEntries);
                }}
                placeholder="Like having access to clean water, food, shelter, and healthcare that many people around the world lack..."
                className="h-20"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-neutral-700">
                <Heart className={cn("h-5 w-5 mr-2", gratitudeEntries[1].length > 0 ? "text-red-500" : "text-neutral-300")} />
                I am grateful for the community I'm part of...
              </label>
              <Textarea
                value={gratitudeEntries[1]}
                onChange={(e) => {
                  const newEntries = [...gratitudeEntries];
                  newEntries[1] = e.target.value;
                  setGratitudeEntries(newEntries);
                }}
                placeholder="Such as working at Raising Arizona Preschool, having supportive colleagues, or being able to positively influence children's lives..."
                className="h-20"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-neutral-700">
                <Heart className={cn("h-5 w-5 mr-2", gratitudeEntries[2].length > 0 ? "text-red-500" : "text-neutral-300")} />
                I am grateful for the personal growth opportunity...
              </label>
              <Textarea
                value={gratitudeEntries[2]}
                onChange={(e) => {
                  const newEntries = [...gratitudeEntries];
                  newEntries[2] = e.target.value;
                  setGratitudeEntries(newEntries);
                }}
                placeholder="Like having access to this training, being able to learn new skills, or having the chance to make a difference every day..."
                className="h-20"
              />
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => {
                if (gratitudeEntries.filter(entry => entry.trim().length > 0).length > 0) {
                  setCompletedSections({...completedSections, gratitude: true});
                  toast({
                    title: "Gratitude Practice Complete",
                    description: "You've completed your gratitude practice for the day."
                  });
                } else {
                  toast({
                    title: "Please Enter At Least One Item",
                    description: "Share at least one thing you're grateful for today.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={gratitudeEntries.filter(entry => entry.trim().length > 0).length === 0}
            >
              Complete Gratitude Practice
            </Button>
          </div>
          
          {completedSections.gratitude && (
            <div className="flex justify-center items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span>Gratitude Practice Completed</span>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Mindful Mornings Complete",
      description: "You've completed your mindful morning practice!",
      content: (
        <div className="space-y-6 text-center">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold">Practice Complete!</h3>
          
          <p className="text-lg">
            You've completed your Mindful Mornings practice. Carry this mindfulness with you throughout your day with the children.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
            <h3 className="text-green-800 font-medium text-lg mb-2">Your Role as a Co-Author</h3>
            <p className="text-green-700 text-sm">
              Remember that each day, you help write important chapters in the life stories of the children in your care. 
              The mindfulness you bring to your interactions, the calm presence you embody, and the gratitude you model 
              all become part of their developing narrative. You're not just a teacher—you're a co-author of their first 
              and most formative chapter, helping them write a story of resilience, positivity, and emotional intelligence 
              that will follow them throughout their lives.
            </p>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-100 max-w-md mx-auto">
            <h4 className="font-bold text-lg mb-3 text-blue-800">Your Daily Mantra:</h4>
            <p className="text-xl font-medium text-blue-700">
              "Breathe, smile, be present."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-center mb-3">
                <Wind className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-medium mb-1">Breathing</h4>
              <p className="text-sm text-neutral-600">
                Return to your breath throughout the day when you need to center yourself.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-center mb-3">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h4 className="font-medium mb-1">Affirmations</h4>
              <p className="text-sm text-neutral-600">
                Repeat your chosen affirmations when facing challenges or moments of doubt.
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex justify-center mb-3">
                <Heart className="h-8 w-8 text-amber-500" />
              </div>
              <h4 className="font-medium mb-1">Gratitude</h4>
              <p className="text-sm text-neutral-600">
                Remember what you're grateful for to maintain perspective during difficult moments.
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 p-5 rounded-lg border border-green-200 max-w-xl mx-auto mt-8">
            <p className="text-green-800 font-medium mb-2">You've earned 15 points for completing Mindful Mornings!</p>
            <p className="text-sm text-green-700">
              Remember: Teachers who consistently practice the "Breathe, smile, be present" mantra during lunchtime will receive an extra surprise!
            </p>
          </div>
          
          <Button onClick={() => handleCompletion()} className="mt-6">
            Return to Dashboard
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">{steps[currentStepIndex].title}</h2>
          <p className="text-neutral-600">{steps[currentStepIndex].description}</p>
        </div>
        
        <div className="mb-10">
          {steps[currentStepIndex].content}
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
          >
            Previous Step
          </Button>
          
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 w-8 rounded-full",
                  index === currentStepIndex
                    ? "bg-primary"
                    : index < currentStepIndex
                    ? "bg-primary/30"
                    : "bg-neutral-200"
                )}
              />
            ))}
          </div>
          
          <Button
            onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === steps.length - 1 || !canProceedToNextStep()}
          >
            Next Step
          </Button>
        </div>
      </div>
    </div>
  );
}