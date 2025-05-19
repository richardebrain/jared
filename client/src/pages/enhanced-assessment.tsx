import { useState } from 'react';
import EnhancedAssessment from '@/components/EnhancedAssessment';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { LearningPathResponse } from '@/services/assessmentService';

// Note: In a real application, we would get the user ID from context or auth state
const TEMP_USER_ID = 5; // This would come from auth context in a real app

export default function EnhancedAssessmentPage() {
  const [, setLocation] = useLocation();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<LearningPathResponse | null>(null);

  const handleStart = () => {
    setStarted(true);
  };

  const handleComplete = (result: LearningPathResponse) => {
    setCompleted(true);
    setResult(result);
    
    // In a production app, we would also:
    // 1. Award points to the user
    // 2. Update the user's learning progress
    // 3. Update any achievements
  };

  const handleReturnToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Helmet>
        <title>Enhanced Assessment | MentorMe</title>
        <meta name="description" content="Take the enhanced adaptive assessment to discover your personalized learning journey." />
      </Helmet>

      {!started ? (
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Enhanced Adaptive Assessment</h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover your strengths and areas for growth with our AI-powered assessment.
            </p>
            <div className="flex justify-center">
              <img 
                src="/images/assessment-illustration.svg" 
                alt="Assessment Illustration" 
                className="w-52 h-52"
              />
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="border-l-4 border-primary p-4 bg-primary/5 rounded">
              <h3 className="font-semibold mb-2">What to Expect</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Questions adapt to your skill level</li>
                <li>Covers key domains of early childhood education</li>
                <li>Takes approximately 15-20 minutes to complete</li>
                <li>Receive a personalized learning path based on your results</li>
                <li>Earn points for completing the assessment</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-amber-500 p-4 bg-amber-50 rounded">
              <h3 className="font-semibold mb-2">Tips for Success</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Find a quiet space without distractions</li>
                <li>Read each question carefully</li>
                <li>Answer thoughtfully - this helps personalize your learning path</li>
                <li>Don't worry if questions get harder - that means you're doing well!</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStart}
              className="px-8 py-6 text-lg"
            >
              Start Assessment
            </Button>
          </div>
        </Card>
      ) : (
        <EnhancedAssessment 
          userId={TEMP_USER_ID} 
          onComplete={handleComplete} 
        />
      )}
    </div>
  );
}