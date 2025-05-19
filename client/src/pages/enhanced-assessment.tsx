import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EnhancedAssessment } from '@/components/EnhancedAssessment';
import { LearningPathResponse } from '@/services/assessmentService';
import { apiRequest } from '@/lib/queryClient';

const EnhancedAssessmentPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [results, setResults] = useState<LearningPathResponse | null>(null);

  // Get authenticated user
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Handle assessment completion
  const handleAssessmentComplete = (results: LearningPathResponse) => {
    setResults(results);
    setAssessmentCompleted(true);
    toast({
      title: 'Assessment Completed',
      description: 'Your personalized learning path is ready!',
    });
  };

  // Handle points earned from assessment
  const handlePointsEarned = async (points: number) => {
    try {
      // Update user points in the system
      await apiRequest('POST', '/api/users/add-points', { 
        userId: user?.id, 
        points,
        source: 'assessment'
      });
      
      toast({
        title: 'Points Added',
        description: `You earned ${points} points from the assessment!`,
      });
    } catch (error) {
      console.error('Failed to add points:', error);
    }
  };

  // Go to dashboard
  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  // Return to assessment if it's not completed yet
  const returnToAssessment = () => {
    setAssessmentCompleted(false);
    setResults(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to access the enhanced assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation('/login')}>Go to Login</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Enhanced Assessment | MentorMe</title>
        <meta name="description" content="Complete your early childhood education assessment to create a personalized learning path." />
      </Helmet>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Enhanced Early Childhood Education Assessment
        </h1>
        
        {assessmentCompleted && results ? (
          <div className="space-y-8">
            <div className="bg-primary/10 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">Assessment Completed</h2>
              <p className="mb-4">
                You've successfully completed your assessment. Your personalized learning path is ready!
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={returnToAssessment} variant="outline">
                  View Results Again
                </Button>
                <Button onClick={goToDashboard}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EnhancedAssessment 
            userId={user.id}
            onComplete={handleAssessmentComplete}
            onPointsEarned={handlePointsEarned}
          />
        )}
      </div>
    </>
  );
};

export default EnhancedAssessmentPage;