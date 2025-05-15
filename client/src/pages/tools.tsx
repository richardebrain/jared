import React, { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { SuessifyGenerator } from "@/components/SuessifyGenerator";
import { VideoResourceLibrary } from "@/components/VideoResourceLibrary";
import { MeetingScheduler } from "@/components/MeetingScheduler";
import LessonPlanMaker from "@/components/LessonPlanMaker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, BookOpen, Heart, ThumbsUp, SendHorizonal, Video, CalendarDays, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define a type for parent scenarios
interface ParentScenario {
  title: string;
  description: string;
  prompt: string;
}

// Example scenarios for parent communication
const PARENT_SCENARIOS: ParentScenario[] = [
  {
    title: "Biting Incident",
    description: "How to communicate with a parent about their child biting another student",
    prompt: "I need to inform a parent that their 3-year-old bit another child today. I want to be honest but supportive."
  },
  {
    title: "Developmental Concerns", 
    description: "Discussing potential developmental delays with sensitivity",
    prompt: "I've noticed some potential speech delays in a 4-year-old and need to bring this up with the parents who might not be aware."
  },
  {
    title: "Toilet Training Challenges",
    description: "Addressing toilet training consistency between school and home",
    prompt: "We're having difficulty with toilet training consistency at school, but the parents insist their child is fully trained at home."
  },
  {
    title: "Screen Time Concerns",
    description: "Discussing excessive screen time at home affecting classroom behavior",
    prompt: "A child is regularly talking about extended screen time and shows signs of difficulty focusing. I need to discuss this tactfully with the parents."
  },
  {
    title: "Aggressive Behavior",
    description: "Addressing recurring aggressive behavior in a supportive way",
    prompt: "A child has been showing aggressive behavior toward peers for two weeks. I need to discuss this with parents in a way that focuses on solutions."
  }
];

function ParentResponseGenerator() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateResponse = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a situation to generate a response.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiRequest("/api/ai/parent-response", {
        method: "POST",
        data: { prompt }
      });
      
      setResponse(result.response);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
      console.error("Error generating parent response:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const useScenario = (scenario: ParentScenario): void => {
    setPrompt(scenario.prompt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Parent Response Generator
          </CardTitle>
          <CardDescription>
            Generate thoughtful, professional responses for parent communications in challenging situations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe the situation or concern you need to communicate:
              </label>
              <Textarea
                placeholder="E.g., I need to inform a parent that their child pushed another student today..."
                className="min-h-[120px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Common Scenarios:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PARENT_SCENARIOS.map((scenario, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="justify-start h-auto text-left py-2"
                    onClick={() => useScenario(scenario)}
                  >
                    <div>
                      <div className="font-medium">{scenario.title}</div>
                      <div className="text-xs text-muted-foreground">{scenario.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={generateResponse}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>Generating Response...</>
              ) : (
                <>
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  Generate Response
                </>
              )}
            </Button>

            {response && (
              <div className="mt-4 p-4 border rounded-md bg-primary/5">
                <h3 className="font-medium mb-2 flex items-center">
                  <Heart className="h-4 w-4 text-primary mr-2" />
                  Suggested Parent Response:
                </h3>
                <div className="whitespace-pre-wrap text-sm">
                  {response}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <p className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Remember to personalize this response for your specific situation and relationship with the parent.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Teacher Tools</h1>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
        
        <Tabs defaultValue="parent-responses" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="parent-responses" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Parent Responses
            </TabsTrigger>
            <TabsTrigger value="lesson-plan" className="flex items-center">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Lesson Plan Maker
            </TabsTrigger>
            <TabsTrigger value="suessify" className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Suessify Generator
            </TabsTrigger>
            <TabsTrigger value="video-library" className="flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Video Library
            </TabsTrigger>
            <TabsTrigger value="meeting-scheduler" className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              Scheduler
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="parent-responses" className="space-y-4">
            <ParentResponseGenerator />
          </TabsContent>
          
          <TabsContent value="lesson-plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Lesson Plan Maker
                </CardTitle>
                <CardDescription>
                  Create detailed, age-appropriate weekly lesson plans for your classroom with a theme of your choice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LessonPlanMaker />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="suessify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Suessify Generator
                </CardTitle>
                <CardDescription>
                  Transform your text into Dr. Seuss-inspired rhymes perfect for engaging children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SuessifyGenerator />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="video-library" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Video Resource Library
                </CardTitle>
                <CardDescription>
                  Browse our extensive collection of high-quality educational videos for professional development
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <VideoResourceLibrary showFilters={true} compactMode={true} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="meeting-scheduler" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Schedule a Meeting with Your Director
                </CardTitle>
                <CardDescription>
                  Request a 15-minute meeting with your school director to discuss professional development, classroom concerns, or other topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeetingScheduler />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}