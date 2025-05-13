import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightCircle, BookOpen, CheckCircle, Clock, Film, Headphones, HelpCircle, PenTool } from "lucide-react";

// Common classroom challenges that teachers might face
const commonChallenges = [
  { id: 1, category: "Behavior Management", challenge: "Managing disruptive behavior from one or more students" },
  { id: 2, category: "Behavior Management", challenge: "Handling tantrums or emotional outbursts" },
  { id: 3, category: "Behavior Management", challenge: "Addressing conflicts between students" },
  { id: 4, category: "Curriculum", challenge: "Differentiating instruction for diverse learning needs" },
  { id: 5, category: "Curriculum", challenge: "Keeping children engaged during circle time" },
  { id: 6, category: "Curriculum", challenge: "Planning age-appropriate activities that meet learning objectives" },
  { id: 7, category: "Parent Communication", challenge: "Discussing difficult topics with parents" },
  { id: 8, category: "Parent Communication", challenge: "Engaging uninvolved parents" },
  { id: 9, category: "Parent Communication", challenge: "Managing parent expectations" },
  { id: 10, category: "Special Needs", challenge: "Supporting children with speech delays" },
  { id: 11, category: "Special Needs", challenge: "Integrating children with autism into group activities" },
  { id: 12, category: "Special Needs", challenge: "Identifying signs of potential developmental delays" },
  { id: 13, category: "Classroom Management", challenge: "Transitioning smoothly between activities" },
  { id: 14, category: "Classroom Management", challenge: "Creating effective classroom routines" },
  { id: 15, category: "Classroom Management", challenge: "Managing classroom with limited resources" },
];

// Interface for the DynamicLessonGenerator component props
interface DynamicLessonGeneratorProps {
  user: User;
  moduleId: number;
  onLessonComplete: () => void;
}

// Main component
export default function DynamicLessonGenerator({ user, moduleId, onLessonComplete }: DynamicLessonGeneratorProps) {
  const { toast } = useToast();
  
  // State for the selected challenge and custom challenge
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  const [customChallenge, setCustomChallenge] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [completionStep, setCompletionStep] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<"visual" | "auditory" | "reading" | "kinesthetic" | null>(
    user.learningStyle?.preferred || null
  );

  // Get module details
  const { data: module } = useQuery({
    queryKey: ['/api/modules', moduleId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/modules/${moduleId}`);
      return response.json();
    }
  });

  // Update progress mutation
  const { mutate: updateProgress } = useMutation({
    mutationFn: async (data: { moduleId: number; progress: number; completed?: boolean }) => {
      const response = await apiRequest('POST', '/api/progress', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Your learning progress has been saved.",
      });
    },
  });

  // Function to generate a personalized lesson based on learning style and selected challenge
  const generatePersonalizedLesson = async () => {
    setIsGenerating(true);
    
    try {
      // Determine the challenge to use (either selected or custom)
      const challenge = isCustom ? customChallenge : selectedChallenge;
      
      if (!selectedLearningStyle) {
        toast({
          title: "Learning Style Required",
          description: "Please select a learning style to personalize your lesson.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
      
      // Call the API to generate lesson content
      const response = await apiRequest('POST', '/api/lesson/generate', {
        moduleId,
        userId: user.id,
        challenge,
        learningStyle: selectedLearningStyle,
      });
      
      const data = await response.json();
      setLessonContent(data);
      
      // Update progress to indicate lesson has started
      updateProgress({
        moduleId,
        progress: 25,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate personalized lesson content. Please try again.",
        variant: "destructive",
      });
      console.error("Error generating lesson:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to handle completing a lesson section
  const completeSection = () => {
    const newStep = completionStep + 1;
    setCompletionStep(newStep);
    
    // Calculate progress based on completion step
    const progressPercent = Math.min(25 + (newStep * 25), 100);
    
    // Update progress in the database
    updateProgress({
      moduleId,
      progress: progressPercent,
      completed: progressPercent >= 100,
    });
    
    // If the lesson is complete, call the onLessonComplete callback
    if (progressPercent >= 100) {
      onLessonComplete();
    }
  };

  // Function to handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // If there's no module data yet, show a loading state
  if (!module) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading module content...</span>
      </div>
    );
  }

  // If the lesson content is not generated yet, show the challenge selection
  if (!lessonContent) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Personalize Your Learning</CardTitle>
          <CardDescription>
            Tell us what classroom challenges you'd like to address in this lesson, and we'll tailor the content to your learning style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Select a challenge you face in the classroom:</h3>
              
              <Select
                onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustom(true);
                    setSelectedChallenge("");
                  } else {
                    setIsCustom(false);
                    setSelectedChallenge(value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a classroom challenge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {commonChallenges.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.challenge}>
                        {challenge.challenge}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">I have a different challenge (custom)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <div>
                <Label htmlFor="custom-challenge">Describe your challenge:</Label>
                <Textarea
                  id="custom-challenge"
                  placeholder="E.g., I struggle with getting children to clean up after center time..."
                  value={customChallenge}
                  onChange={(e) => setCustomChallenge(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <HelpCircle className="w-4 h-4 mr-2 text-primary" />
                Select Your Learning Style
              </h4>
              <p className="text-sm mb-3">
                Choose how you'd like your lesson to be tailored:
              </p>
              
              <RadioGroup 
                value={selectedLearningStyle || ''}
                onValueChange={(value) => setSelectedLearningStyle(value as "visual" | "auditory" | "reading" | "kinesthetic")}
                className="space-y-2 mb-3"
              >
                <div className={`flex items-center space-x-2 rounded-md border p-3 
                  ${selectedLearningStyle === 'visual' ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
                  <RadioGroupItem value="visual" id="visual" />
                  <Label htmlFor="visual" className="flex items-center cursor-pointer">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" /> 
                    <div>
                      <span className="font-medium">Visual</span>
                      <p className="text-xs text-muted-foreground">Learn with images, diagrams, and visual demonstrations</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-2 rounded-md border p-3 
                  ${selectedLearningStyle === 'auditory' ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
                  <RadioGroupItem value="auditory" id="auditory" />
                  <Label htmlFor="auditory" className="flex items-center cursor-pointer">
                    <Headphones className="w-4 h-4 mr-2 text-primary" /> 
                    <div>
                      <span className="font-medium">Auditory</span>
                      <p className="text-xs text-muted-foreground">Learn through discussion, verbal explanations, and sound</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-2 rounded-md border p-3 
                  ${selectedLearningStyle === 'reading' ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
                  <RadioGroupItem value="reading" id="reading" />
                  <Label htmlFor="reading" className="flex items-center cursor-pointer">
                    <PenTool className="w-4 h-4 mr-2 text-primary" /> 
                    <div>
                      <span className="font-medium">Reading/Writing</span>
                      <p className="text-xs text-muted-foreground">Learn through reading text and writing notes</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-2 rounded-md border p-3 
                  ${selectedLearningStyle === 'kinesthetic' ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
                  <RadioGroupItem value="kinesthetic" id="kinesthetic" />
                  <Label htmlFor="kinesthetic" className="flex items-center cursor-pointer">
                    <ArrowRightCircle className="w-4 h-4 mr-2 text-primary" /> 
                    <div>
                      <span className="font-medium">Hands-on</span>
                      <p className="text-xs text-muted-foreground">Learn by doing, practicing, and physical activities</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              
              <p className="text-sm text-muted-foreground">
                Your content will be tailored to your selected learning style to make learning fun and effective!
              </p>
            </div>

          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={generatePersonalizedLesson}
            disabled={isGenerating || (!selectedChallenge && !customChallenge)}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                Personalizing Your Lesson...
              </>
            ) : (
              <>
                Create My Personalized Lesson <ArrowRightCircle className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render the lesson content if it's been generated
  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="text-2xl flex items-center">
          <span className="mr-2">🎮</span> 
          {module.title}
        </CardTitle>
        <CardDescription>
          Personalized for your {selectedLearningStyle} learning style
          {!isCustom && <span> - Quest: Conquer {selectedChallenge}</span>}
          {isCustom && <span> - Quest: Solve Your Custom Challenge</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content" className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" /> Main Quest
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center">
              <ArrowRightCircle className="w-4 h-4 mr-2" /> Mini-Games
            </TabsTrigger>
            <TabsTrigger value="gameElements" className="flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" /> Power-Ups
            </TabsTrigger>
            <TabsTrigger value="reflection" className="flex items-center">
              <PenTool className="w-4 h-4 mr-2" /> Level-Up
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center">
              <Headphones className="w-4 h-4 mr-2" /> Treasure
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="p-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-primary mr-2">🚀</span> Your Quest Begins!
                </h3>
                <p className="text-muted-foreground">
                  {lessonContent.introduction || "In this adventure, you'll discover strategies to overcome your classroom challenge..."}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-primary mr-2">🏆</span> Achievements to Unlock
                </h3>
                <div className="space-y-3">
                  {lessonContent.keyConcepts?.map((concept: string, index: number) => (
                    <div key={index} className="bg-muted/20 p-3 rounded-lg border-l-4 border-primary/60 hover:bg-muted/30 transition-colors">
                      <p>{concept}</p>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">Loading achievements...</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="text-primary mr-2">⚔️</span> Teaching Toolkit
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {lessonContent.strategies?.map((strategy: any, index: number) => (
                    <div key={index} className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
                      <h4 className="font-medium mb-1 text-primary">{strategy.title}</h4>
                      <p className="text-sm">{strategy.description}</p>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">Loading strategies...</p>
                  )}
                </div>
              </div>
              
              {lessonContent.funFacts && (
                <>
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center">
                      <span className="text-primary mr-2">💡</span> Secret Knowledge
                    </h3>
                    <div className="space-y-3">
                      {lessonContent.funFacts.map((fact: any, index: number) => (
                        <div key={index} className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <h4 className="font-medium text-primary mb-1">{fact.title}</h4>
                          <p className="text-sm">{fact.fact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <Button onClick={completeSection} disabled={completionStep > 0} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                  {completionStep > 0 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Main Quest Completed
                    </>
                  ) : (
                    <>
                      Complete Main Quest <ArrowRightCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activities" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <span className="text-primary mr-2">🎲</span> Interactive Challenges
                </h3>
                <p className="text-muted-foreground mb-4">
                  These fun activities will help you master the skills needed to complete your quest!
                </p>
                
                <div className="space-y-6">
                  {lessonContent.activities?.map((activity: any, index: number) => (
                    <div key={index} className="border-2 border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-colors">
                      <h4 className="font-medium mb-2 text-lg text-primary">{activity.title}</h4>
                      <p className="mb-3">{activity.description}</p>
                      
                      <div className="bg-muted/30 p-3 rounded-lg mb-3">
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 mr-2 mt-1 text-primary" />
                          <span className="text-sm">Play time: {activity.timeEstimate || "10-15 minutes"}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Adventure Steps:</h5>
                        <ol className="space-y-1">
                          {activity.steps?.map((step: string, stepIndex: number) => (
                            <li key={stepIndex} className="text-sm flex items-start">
                              <div className="bg-primary/20 text-primary w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 mt-0.5">
                                {stepIndex + 1}
                              </div>
                              <div>{step}</div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">Loading activities...</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={completeSection} disabled={completionStep > 1 || completionStep < 1} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                  {completionStep > 1 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Mini-Games Completed
                    </>
                  ) : (
                    <>
                      Complete Mini-Games <ArrowRightCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="gameElements" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <span className="text-primary mr-2">🧙‍♂️</span> Game Elements
                </h3>
                <p className="text-muted-foreground mb-4">
                  Turn your classroom challenges into fun adventures with these game-like systems!
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {lessonContent.gameElements?.map((element: any, index: number) => (
                    <div key={index} className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-colors">
                      <h4 className="font-medium mb-2 text-primary">{element.title}</h4>
                      <p className="text-sm">{element.description}</p>
                    </div>
                  )) || (
                    <div>
                      <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent mb-4">
                        <h4 className="font-medium mb-2 text-primary">Bear Badges</h4>
                        <p className="text-sm">Award digital badges to students for specific achievements, creating a sense of accomplishment. Example: "Helper Bear" for students who assist classmates.</p>
                      </div>
                      <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent mb-4">
                        <h4 className="font-medium mb-2 text-primary">Level-Up Chart</h4>
                        <p className="text-sm">Create a visual progression system where students "level up" through different ranks by mastering skills. Example: "Cub" → "Scout Bear" → "Ranger Bear" → "Master Bear"</p>
                      </div>
                      <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent mb-4">
                        <h4 className="font-medium mb-2 text-primary">Adventure Points</h4>
                        <p className="text-sm">Award points for positive behaviors that can be redeemed for small privileges. Example: 10 points = choosing a special book for story time.</p>
                      </div>
                      <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent">
                        <h4 className="font-medium mb-2 text-primary">Mystery Treasure</h4>
                        <p className="text-sm">Hide small surprises or special activities that are "unlocked" when classroom goals are achieved. Example: A special outdoor activity revealed only after reaching a group goal.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={completeSection} disabled={completionStep > 2 || completionStep < 2} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                  {completionStep > 2 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Power-Ups Collected
                    </>
                  ) : (
                    <>
                      Collect Power-Ups <ArrowRightCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reflection" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center">
                  <span className="text-primary mr-2">🔮</span> Level-Up Reflections
                </h3>
                <p className="text-muted-foreground mb-4">
                  Answer these questions to gain XP and level up your teaching skills!
                </p>
                
                <div className="space-y-6">
                  {lessonContent.reflectionQuestions?.map((question: any, index: number) => (
                    <div key={index} className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                      <Label htmlFor={`question-${index}`} className="block mb-3 text-primary font-medium">
                        {question.text}
                      </Label>
                      <Textarea
                        id={`question-${index}`}
                        placeholder="Record your wisdom here..."
                        value={userAnswers[`question-${index}`] || ""}
                        onChange={(e) => handleAnswerChange(`question-${index}`, e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )) || (
                    <p className="text-muted-foreground">Loading reflection questions...</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={completeSection} 
                  disabled={completionStep > 3 || completionStep < 3 || Object.keys(userAnswers).length < (lessonContent.reflectionQuestions?.length || 0)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                >
                  {completionStep > 3 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Level-Up Complete
                    </>
                  ) : (
                    <>
                      Level-Up Now <ArrowRightCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Additional Resources</h3>
                <p className="text-muted-foreground mb-4">
                  Explore these resources to deepen your understanding.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {lessonContent.resources?.map((resource: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 flex">
                      {resource.type === 'video' && <Film className="w-5 h-5 mr-3 text-primary" />}
                      {resource.type === 'article' && <BookOpen className="w-5 h-5 mr-3 text-primary" />}
                      {resource.type === 'audio' && <Headphones className="w-5 h-5 mr-3 text-primary" />}
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          View Resource
                        </a>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">Loading resources...</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={completeSection} disabled={completionStep > 3}>
                  {completionStep > 3 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Resources Explored
                    </>
                  ) : (
                    "Mark Resources as Explored"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${Math.min(25 + (completionStep * 25), 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between w-full text-sm">
          <span>Progress: {Math.min(25 + (completionStep * 25), 100)}%</span>
          {completionStep >= 4 && (
            <span className="text-primary font-medium">Module Completed!</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}