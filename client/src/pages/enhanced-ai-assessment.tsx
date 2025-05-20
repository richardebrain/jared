import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedAIAssessment from '@/components/EnhancedAIAssessment';
import { Link, useLocation } from 'wouter';
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Brain, Trophy, Award, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function EnhancedAIAssessmentPage() {
  const [, setLocation] = useLocation();
  const [isStarted, setIsStarted] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{ 
    score: number; 
    totalPoints: number;
    domainAnalysis: any;
  } | null>(null);
  const { toast } = useToast();
  
  // Get user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  // Get previous performance for adaptive mode
  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/assessment-progress"],
    enabled: !!user,
  });
  
  // Calculate previous performance if available
  const getPreviousPerformance = () => {
    if (!userProgress || !Array.isArray(userProgress) || userProgress.length === 0) {
      return 0.5; // Default to 50% for new users
    }
    
    // Calculate average of last 3 assessments, if available
    const recentAssessments = userProgress.slice(0, 3);
    const avgScore = recentAssessments.reduce((sum, assessment) => {
      return sum + (assessment.score / assessment.totalPoints);
    }, 0) / recentAssessments.length;
    
    return avgScore;
  };
  
  const handleComplete = (score: number, totalPoints: number, domainAnalysis: any) => {
    setCompletedAssessment(true);
    setAssessmentResults({ score, totalPoints, domainAnalysis });
    
    // Save to user's profile through API
    if (user?.id) {
      saveAssessmentResults(user.id, score, totalPoints, domainAnalysis);
    }
  };
  
  const saveAssessmentResults = async (userId: number, score: number, totalPoints: number, domainAnalysis: any) => {
    try {
      // Just log the results since we're keeping them locally
      console.log("Assessment results:", { userId, score, totalPoints, domainAnalysis });
      
      // Show success toast
      toast({
        title: "Assessment completed!",
        description: `You earned ${score} points! Great job!`,
        variant: "default",
      });
      
      // Normally we would save to API here
      // await fetch('/api/assessment/save-results', {...})
    } catch (error) {
      console.error("Error saving assessment results:", error);
    }
  };
  
  const handleStartAssessment = () => {
    setIsStarted(true);
  };
  
  const handleRestartAssessment = () => {
    setIsStarted(true);
    setCompletedAssessment(false);
    setAssessmentResults(null);
  };
  
  if (!isStarted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-3xl font-bold mb-2 flex items-center justify-center">
              <Brain className="h-6 w-6 mr-2" />
              Enhanced AI Assessment
            </CardTitle>
            <CardDescription className="text-gray-100 text-lg">
              Test your early childhood education knowledge with our adaptive assessment system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <Tabs defaultValue="about" className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="py-4">
                <h3 className="text-xl font-semibold mb-3">What is the Enhanced AI Assessment?</h3>
                <p className="text-gray-700 mb-4">
                  This assessment draws from our comprehensive database of early childhood education questions 
                  to evaluate your professional knowledge. The system adapts to your performance, 
                  providing a personalized learning experience that identifies your strengths and areas for growth.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Adaptive Difficulty</h4>
                      <p className="text-sm text-gray-600">Questions adjust based on your performance</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Trophy className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Point System</h4>
                      <p className="text-sm text-gray-600">Earn points based on question difficulty</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="benefits" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Why Take This Assessment?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Identify Knowledge Gaps</h4>
                      <p className="text-gray-700">Discover specific areas where you can improve your ECE knowledge.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Track Your Progress</h4>
                      <p className="text-gray-700">See how your knowledge improves over time with detailed analytics.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Learn As You Go</h4>
                      <p className="text-gray-700">Each question includes detailed explanations and scientific background information.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      Domain Analysis
                    </h4>
                    <p className="text-sm text-gray-600">Visualize your performance across different ECE domains.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      Personalized Feedback
                    </h4>
                    <p className="text-sm text-gray-600">Get tailored recommendations based on your responses.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      Scientific Background
                    </h4>
                    <p className="text-sm text-gray-600">Understand the research behind early childhood education principles.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      Practical Applications
                    </h4>
                    <p className="text-sm text-gray-600">Learn how to apply concepts in your classroom.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex flex-col items-center justify-center space-y-4 mt-8">
              <Button 
                size="lg" 
                onClick={handleStartAssessment}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 text-lg"
              >
                Start Assessment
              </Button>
              <p className="text-sm text-gray-500">
                This assessment has 10 questions and takes approximately 15 minutes to complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {!completedAssessment && (
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setIsStarted(false)} 
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Description
          </Button>
        </div>
      )}
      
      <EnhancedAIAssessment 
        onComplete={handleComplete}
        onCancel={() => setLocation('/dashboard')}
        maxQuestions={10}
        adaptiveMode={true}
        previousPerformance={getPreviousPerformance()}
        userName={user?.firstName || ''}
      />
    </div>
  );
}