import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';
import AssessmentIntroduction from '@/components/assessment/AssessmentIntroduction';
import AssessmentEligibilityCheck from '@/components/assessment/AssessmentEligibilityCheck';
import AssessmentOverview from '@/components/assessment/AssessmentOverview';
import AssessmentCommitment from '@/components/assessment/AssessmentCommitment';

type AssessmentStep = 'eligibility' | 'introduction' | 'overview' | 'commitment' | 'starting';

export default function InitialAssessment() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('eligibility');
  const [isStartingAssessment, setIsStartingAssessment] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has already completed an assessment
  const { data: existingAssessments, isLoading: assessmentLoading } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: !!user && isAuthenticated,
  });

  // Check authentication and user data
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (user) {
      // Check if user is eligible (teachers, school directors, and owners can take initial assessment)
      const isEligible = !user.isAdmin || user.isSchoolAdmin || user.isOwner;
      setIsEligible(Boolean(isEligible));
      
      if (!isEligible) {
        setError("Initial assessments are available for teachers, school directors, and platform owners.");
      }
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  // Check if user has completed assessment already
  const hasCompletedAssessment = Array.isArray(existingAssessments) 
    ? existingAssessments.some((assessment: any) => 
        assessment.completed && assessment.type === 'initial'
      )
    : false;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Handle session start
  const startAssessmentSession = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User information not available. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsStartingAssessment(true);

    try {
      const response = await fetch('/api/assessment/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to start assessment session');
      }

      if (result.success) {
        toast({
          title: "Assessment Started",
          description: "Your initial assessment session has begun. Good luck!",
        });
        
        // Navigate to the assessment question page
        setLocation('/assessment-questions');
      } else {
        throw new Error(result.message || 'Failed to start assessment');
      }
    } catch (error: any) {
      console.error('Error starting assessment:', error);
      
      // Handle specific error cases
      if (error.message.includes('already completed')) {
        toast({
          title: "Assessment Already Completed",
          description: "You have already completed the initial assessment. Check your results on the dashboard.",
          variant: "destructive",
        });
        setLocation('/dashboard');
      } else if (error.message.includes('Assessment access restricted') || error.message.includes('Teacher role')) {
        toast({
          title: "Access Restricted",
          description: "Initial assessments are available for teachers, school directors, and platform owners.",
          variant: "destructive",
        });
        setError("Initial assessments are available for teachers, school directors, and platform owners.");
      } else {
        toast({
          title: "Error Starting Assessment",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsStartingAssessment(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking assessments
  if (assessmentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking assessment status...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle step navigation
  const goToNextStep = () => {
    switch (currentStep) {
      case 'eligibility':
        setCurrentStep('introduction');
        break;
      case 'introduction':
        setCurrentStep('overview');
        break;
      case 'overview':
        setCurrentStep('commitment');
        break;
      case 'commitment':
        startAssessmentSession();
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'introduction':
        setCurrentStep('eligibility');
        break;
      case 'overview':
        setCurrentStep('introduction');
        break;
      case 'commitment':
        setCurrentStep('overview');
        break;
    }
  };

  // Render appropriate step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'eligibility':
        return (
          <AssessmentEligibilityCheck 
            user={user}
            isTeacher={isEligible}
            hasCompletedAssessment={hasCompletedAssessment}
            onContinue={goToNextStep}
            onViewResults={() => setLocation('/assessment-results')}
          />
        );
      case 'introduction':
        return (
          <AssessmentIntroduction 
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'overview':
        return (
          <AssessmentOverview 
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'commitment':
        return (
          <AssessmentCommitment 
            onStartAssessment={goToNextStep}
            onBack={goToPreviousStep}
            isStarting={isStartingAssessment}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
} 