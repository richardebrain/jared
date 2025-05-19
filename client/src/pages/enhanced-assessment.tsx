import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import EnhancedAssessment from '@/components/EnhancedAssessment';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useNavigate } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { LearningPath } from '../services/assessmentService';

const EnhancedAssessmentPage: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  
  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Handle assessment completion
  const handleComplete = (results: LearningPath) => {
    setAssessmentCompleted(true);
    setLearningPath(results);
    
    // Update user points (would normally be handled by backend)
    toast({
      title: "Points Awarded!",
      description: "You've earned 10 points for completing the assessment.",
    });
  };
  
  // Render introduction screen with instructions
  const renderIntro = () => {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Enhanced Teacher Assessment</CardTitle>
          <CardDescription className="text-center">
            Test your knowledge of early childhood education concepts and receive personalized learning recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-primary/5">
            <h3 className="font-semibold mb-2">How It Works:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>You'll be presented with multiple-choice questions covering various ECE domains</li>
              <li>Questions adapt to your skill level, becoming more challenging as you demonstrate mastery</li>
              <li>Special sections like Core Values and Mindful Morning have a fixed set of questions</li>
              <li>The assessment takes approximately 15-20 minutes to complete</li>
              <li>Your results will generate a personalized learning path</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold mb-2 text-green-700">Benefits:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Identify your strengths and areas for growth</li>
              <li>Receive tailored learning recommendations</li>
              <li>Earn 10 points upon completion</li>
              <li>Track your professional development progress</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => setAssessmentCompleted(false)}
          >
            Start Assessment
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Render the page content
  const renderContent = () => {
    if (userLoading) {
      return (
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }
    
    if (!user || !user.id) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please log in to access the assessment.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/login')}>
              Log In
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    if (assessmentCompleted && learningPath) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Assessment Completed!</CardTitle>
            <CardDescription className="text-center">
              You've successfully completed the enhanced assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="mb-4">
                Your personalized learning path has been created based on your results.
              </p>
              <div className="border rounded-lg p-4 bg-green-50 mb-4">
                <h3 className="font-semibold">Your Results:</h3>
                <p>Correct Answers: {learningPath.questions_correct} / {learningPath.questions_asked}</p>
                <p>Strongest Domain: {learningPath.strongest_domain}</p>
                <p>Area for Growth: {learningPath.weakest_domain}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => setAssessmentCompleted(false)}
            >
              Take Assessment Again
            </Button>
            <Button onClick={() => setLocation('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    return <EnhancedAssessment userId={user.id} onComplete={handleComplete} />;
  };
  
  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Enhanced Assessment | MentorMe Teacher Training</title>
        <meta name="description" content="Take our enhanced assessment to identify your strengths and areas for growth in early childhood education." />
      </Helmet>
      {renderContent()}
    </div>
  );
};

export default EnhancedAssessmentPage;