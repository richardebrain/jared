import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BadgeCheck, Brain, BrainCircuit, Lightbulb, Sparkles } from "lucide-react";
import AIAssessment from "@/components/AIAssessment";

export default function AIAssessmentPage() {
  const [, setLocation] = useLocation();
  const [isStarted, setIsStarted] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{ score: number; totalPoints: number } | null>(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const handleComplete = (score: number, totalPoints: number) => {
    setCompletedAssessment(true);
    setAssessmentResults({ score, totalPoints });
    
    // Update user points on the server
    try {
      fetch('/api/user/add-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          points: totalPoints,
        }),
      }).catch(err => console.log("Failed to add points but continuing"));
    } catch (error) {
      console.error('Failed to update points:', error);
    }
  };

  const handleStartAssessment = () => {
    setIsStarted(true);
  };

  const handleReturnToDashboard = () => {
    setLocation('/dashboard');
  };

  const handleReset = () => {
    setIsStarted(false);
    setCompletedAssessment(false);
    setAssessmentResults(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-tight">AI-Powered Assessment</h1>
            <Button 
              variant="outline" 
              onClick={handleReturnToDashboard}
              className="flex items-center"
            >
              Back to Dashboard
            </Button>
          </div>

          {completedAssessment && assessmentResults ? (
            <Card className="mb-8">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl font-bold">Assessment Results</CardTitle>
                <CardDescription className="text-white opacity-90">
                  Great job completing the assessment!
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">
                    <BadgeCheck className="h-12 w-12 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Congratulations!</h2>
                  <p className="text-gray-500 mb-4">You've earned {assessmentResults.totalPoints} points</p>
                </div>
                
                <div className="grid gap-6 mb-8 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Performance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Questions:</span>
                          <span className="font-medium">5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Correct Answers:</span>
                          <span className="font-medium">{assessmentResults.score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="font-medium">{Math.round((assessmentResults.score / 5) * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points Earned:</span>
                          <span className="font-medium">{assessmentResults.totalPoints}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">What's Next?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-gray-600">Based on your performance, we recommend:</p>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                            <span>Check the personalized learning path on your dashboard</span>
                          </li>
                          <li className="flex items-start">
                            <Brain className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                            <span>Explore mini-lessons in your areas of opportunity</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                  >
                    Take Another Assessment
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    onClick={handleReturnToDashboard}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isStarted ? (
            <AIAssessment 
              onComplete={handleComplete} 
              onCancel={handleReturnToDashboard}
              maxQuestions={5}
            />
          ) : (
            <Card className="mb-8 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl font-bold">Knowledge Assessment</CardTitle>
                <CardDescription className="text-white opacity-90">
                  Test your understanding of early childhood education concepts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">
                    <BrainCircuit className="h-12 w-12 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Assessment</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Our AI-powered assessment system adapts to your knowledge level and provides personalized feedback.
                  </p>
                </div>
                
                <div className="grid gap-6 mb-8 md:grid-cols-2">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                      How It Works
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-amber-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-amber-700 mr-2 mt-0.5 text-xs font-medium">1</span>
                        <span>Answer 5 questions from our database</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-amber-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-amber-700 mr-2 mt-0.5 text-xs font-medium">2</span>
                        <span>Get immediate feedback on your answers</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-amber-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-amber-700 mr-2 mt-0.5 text-xs font-medium">3</span>
                        <span>Earn points based on question difficulty</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-amber-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-amber-700 mr-2 mt-0.5 text-xs font-medium">4</span>
                        <span>Learn from detailed explanations</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Brain className="h-5 w-5 text-blue-500 mr-2" />
                      Benefits
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-blue-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-blue-700 mr-2 mt-0.5 text-xs font-medium">✓</span>
                        <span>Identifies your knowledge strengths and gaps</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-blue-700 mr-2 mt-0.5 text-xs font-medium">✓</span>
                        <span>Provides personalized learning recommendations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-blue-700 mr-2 mt-0.5 text-xs font-medium">✓</span>
                        <span>Earn points to advance your teacher level</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 rounded-full w-5 h-5 inline-flex items-center justify-center text-blue-700 mr-2 mt-0.5 text-xs font-medium">✓</span>
                        <span>Track your progress over time</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 text-lg"
                    onClick={handleStartAssessment}
                  >
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}