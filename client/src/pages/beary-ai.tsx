import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";
import VoiceEnabledBearyAI from "@/components/VoiceEnabledBearyAI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BearyAIPage() {
  const [_, setLocation] = useLocation();
  const [responseHistory, setResponseHistory] = useState<string[]>([]);

  const handleVoiceResponse = (response: string) => {
    setResponseHistory(prev => [response, ...prev.slice(0, 4)]); // Keep last 5 responses
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-amber-800 mb-4">
              🐻 BearyAI Voice Assistant
            </h1>
            <p className="text-lg text-amber-700">
              Your AI-powered assistant with voice capabilities for early childhood education
            </p>
            <p className="text-sm text-amber-600 mt-2">
              Use voice input to ask questions hands-free, or type traditionally
            </p>
          </div>

          {/* Main Voice-Enabled BearyAI Component */}
          <VoiceEnabledBearyAI onResponse={handleVoiceResponse} />

          {/* Quick Action Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">🎯 Behavior Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Get strategies for positive behavior support and classroom management.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('beary-ai-prompt', { 
                      detail: "What are some effective positive behavior strategies for preschoolers?" 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Ask About Behavior
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">📚 Curriculum Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Discover age-appropriate activities and learning experiences.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('beary-ai-prompt', { 
                      detail: "Can you suggest some hands-on science activities for 4-year-olds?" 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Get Activities
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">👥 Parent Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Learn effective ways to communicate with families.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('beary-ai-prompt', { 
                      detail: "How can I effectively communicate with parents about their child's development?" 
                    });
                    window.dispatchEvent(event);
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Communication Tips
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Responses History */}
          {responseHistory.length > 0 && (
            <Card className="mt-8 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">Recent BearyAI Responses</CardTitle>
                <CardDescription>
                  Your recent conversation history with BearyAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseHistory.map((response, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {response.slice(0, 200)}{response.length > 200 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <ChatbotSupport />
      </div>
    </div>
  );
}