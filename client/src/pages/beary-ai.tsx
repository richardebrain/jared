import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";
import VoiceEnabledBearyAI from "@/components/VoiceEnabledBearyAI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function BearyAIPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    
    try {
      // Make a real API call to our backend BearyAI service
      const response = await fetch("/api/bear-assistant/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: prompt })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.message || data.content || `I received your question about "${prompt}" but I'm currently having trouble generating a specific answer. Please try a different question about early childhood education topics like classroom management or child development.`);
      
      toast({
        title: "Response generated",
        description: "BearyAI has responded to your prompt!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setLocation("/"), 300);
          }}
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="bear" className="text-4xl">🐻</span>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-2">BearyAI Assistant</h1>
              <p className="text-gray-600">
                Your friendly AI teaching assistant powered by Raising Arizona Preschool
              </p>
            </div>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ask BearyAI</CardTitle>
              <CardDescription>
                Get help with lesson planning, activities, classroom management, or any teaching question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="What would you like help with today? E.g., 'Suggest sensory activities for 3-year-olds'"
                  className="min-h-[120px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={isLoading || !prompt.trim()}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                      Generating response...
                    </>
                  ) : "Ask BearyAI"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {response && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-800">
                  <span role="img" aria-label="bear" className="text-lg mr-2">🐻</span>
                  BearyAI Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap bg-white p-4 rounded-md border border-amber-100">
                  {response}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">What can BearyAI help with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-700 mb-2">Lesson Planning</h3>
                <p className="text-sm text-gray-600">Get creative ideas for your next lesson or activity based on your classroom's interests and learning goals.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-700 mb-2">Classroom Management</h3>
                <p className="text-sm text-gray-600">Learn strategies for handling challenging behaviors, transitions, or creating positive classroom environments.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-700 mb-2">Parent Communication</h3>
                <p className="text-sm text-gray-600">Get guidance on effectively communicating with parents about progress, challenges, or events.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-700 mb-2">Child Development</h3>
                <p className="text-sm text-gray-600">Understand age-appropriate behaviors, milestones, and how to support children's growth across all domains.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <ChatbotSupport />
    </div>
  );
}