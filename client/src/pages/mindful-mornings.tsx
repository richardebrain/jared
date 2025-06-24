import Header from "@/components/Header";
import { MindfulMorningsOutline } from "@/components/MindfulMorningsOutline";
import { useSimpleAuth } from "@/lib/simple-auth";
import BearAssistant from "@/components/BearAssistant";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wind, Heart, Award, Brain } from "lucide-react";

export default function MindfulMorningsPage() {
  const { user } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState("course");
  
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
                <MindfulMorningsOutline />
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
                      <div className="mt-4 flex justify-end">
                        <a href="/modules/13" className="text-blue-600 text-sm font-medium">
                          View module →
                        </a>
                      </div>
                    </CardContent>
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
                      <div className="mt-4 flex justify-end">
                        <a href="/modules/14" className="text-amber-600 text-sm font-medium">
                          View module →
                        </a>
                      </div>
                    </CardContent>
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
                      <div className="mt-4 flex justify-end">
                        <a href="/modules/15" className="text-red-600 text-sm font-medium">
                          View module →
                        </a>
                      </div>
                    </CardContent>
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
                      <div className="mt-4 flex justify-end">
                        <a href="/modules/24" className="text-green-600 text-sm font-medium">
                          View module →
                        </a>
                      </div>
                    </CardContent>
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
                  Completing the full Mindful Mornings course awards 40 XP points and a special digital badge for your profile!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}