import Header from "@/components/Header";
import { MindfulMorningsOutline } from "@/components/MindfulMorningsOutline";
import { useAuth } from "@/hooks/use-auth";
import BearAssistant from "@/components/BearAssistant";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, Wind, Heart, Award, Brain, Youtube, CheckCircle, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function MindfulMorningsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("course");
  const [moduleCompleted, setModuleCompleted] = useState(false);
  
  // Add points mutation
  const { mutate: addPoints } = useMutation({
    mutationFn: async (points: number) => {
      const response = await apiRequest("POST", "/api/users/add-points", { points });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setModuleCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to award points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle completion of the module
  const handleCompleteModule = () => {
    // Award 25 points for completing Mindful Morning
    addPoints(25);
    toast({
      title: "Training Completed!",
      description: "You've earned 25 XP points for completing the Mindful Morning training!",
    });
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Mindful Mornings</h1>
          <p className="text-slate-600 mt-1">
            Transform your classroom with simple, research-backed mindfulness practices
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs defaultValue="course" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="course" className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> 
                  Complete Course (60 min)
                </TabsTrigger>
                <TabsTrigger value="modules" className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Individual Modules
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="course" className="mt-0">
                {moduleCompleted ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Training Completed!</h2>
                    <p className="text-gray-600">
                      You've successfully completed the Mindful Morning training module and earned 25 XP points!
                    </p>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 max-w-md mx-auto">
                      <p className="text-amber-800">
                        Remember to practice these mindfulness techniques daily with your students to create a calm and focused classroom environment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src="https://www.youtube.com/embed/1ZYbU82GVz4" 
                          title="Mindful Morning Training" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-2">Mindful Morning - Full Training</h3>
                        <p className="text-gray-600 mb-4">
                          This comprehensive training will guide you through implementing the Mindful Morning 
                          practice in your classroom, with techniques for breathing exercises, positive affirmations, 
                          mindful transitions, and gratitude practices.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-semibold mb-2 flex items-center text-blue-700">
                              <Brain className="h-4 w-4 mr-2" /> Learning Objectives
                            </h4>
                            <ul className="text-sm space-y-2">
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />
                                <span>Understand the neuroscience behind mindfulness practices</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />
                                <span>Learn breathing techniques appropriate for young children</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />
                                <span>Implement positive affirmations in daily routine</span>
                              </li>
                            </ul>
                          </div>
                          
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h4 className="font-semibold mb-2 flex items-center text-green-700">
                              <Award className="h-4 w-4 mr-2" /> Benefits
                            </h4>
                            <ul className="text-sm space-y-2">
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                                <span>Reduces classroom stress and anxiety</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                                <span>Improves children's focus and attention</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                                <span>Creates a positive emotional environment</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center text-gray-500 text-sm">
                            <Youtube className="h-4 w-4 mr-1" />
                            <span>60 minutes</span>
                          </div>
                          <Button onClick={handleCompleteModule} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Completed
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-bold mb-4">Module Contents</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium">1</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Introduction to Mindfulness</h4>
                              <p className="text-sm text-gray-500">Why it matters for early childhood</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">0:00 - 8:45</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium">2</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Breathing Techniques</h4>
                              <p className="text-sm text-gray-500">Kid-friendly breathing exercises</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">8:46 - 22:30</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium">3</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Positive Affirmations</h4>
                              <p className="text-sm text-gray-500">Building confidence and resilience</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">22:31 - 36:15</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium">4</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Gratitude Practices</h4>
                              <p className="text-sm text-gray-500">Fostering thankfulness daily</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">36:16 - 48:30</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium">5</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Implementation Plan</h4>
                              <p className="text-sm text-gray-500">Integrating practices into your classroom</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">48:31 - 60:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="modules" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="overflow-hidden border-blue-100 shadow-sm">
                    <div className="h-3 bg-blue-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Wind className="h-5 w-5 text-blue-500" />
                        Breathing Exercises
                      </CardTitle>
                      <CardDescription>Calming techniques for emotional regulation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">
                        Learn simple breathing exercises that help children (and teachers!) 
                        manage stress, anxiety, and develop greater emotional resilience.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = "/mindful-mornings"} 
                        className="text-blue-600"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="overflow-hidden border-amber-100 shadow-sm">
                    <div className="h-3 bg-amber-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Self-Affirmations
                      </CardTitle>
                      <CardDescription>Positive statements to build confidence</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">
                        Discover how simple affirmations can rewire neural pathways, 
                        build self-confidence, and create a positive classroom culture.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = "/mindful-mornings"} 
                        className="text-amber-600"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="overflow-hidden border-red-100 shadow-sm">
                    <div className="h-3 bg-red-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Gratitude Practices
                      </CardTitle>
                      <CardDescription>Cultivating appreciation and wellbeing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">
                        Integrate evidence-based gratitude practices to reduce stress,
                        improve wellbeing, and foster a positive classroom environment.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = "/mindful-mornings"} 
                        className="text-red-600"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="overflow-hidden border-green-100 shadow-sm">
                    <div className="h-3 bg-green-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="h-5 w-5 text-green-500" />
                        Mindful Morning Greeting
                      </CardTitle>
                      <CardDescription>Starting the day with intention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">
                        Learn quick, effective greeting rituals that welcome each child, 
                        ease transitions, and set a positive tone for the entire day.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = "/mindful-mornings"} 
                        className="text-green-600"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="col-span-1">
            {/* Bear assistant */}
            <BearAssistant user={user} />
            
            {/* Info card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 mt-6">
              <h3 className="font-bold text-lg mb-2">About Mindful Mornings</h3>
              <p className="text-neutral-600 text-sm">
                Mindful Mornings is a daily practice designed to help you start your day with intention 
                and positivity. By taking a few minutes each morning to center yourself through breathing, 
                affirmations, and gratitude, you'll be better prepared to create a nurturing environment 
                for the children in your care.
              </p>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold block mb-1">Remember:</span>
                  Completing the Mindful Mornings training awards 25 XP points and counts as one of your required onboarding modules!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}