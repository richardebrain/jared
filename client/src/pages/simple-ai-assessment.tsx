import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SimpleAIAssessment from '@/components/SimpleAIAssessment';
import { Link } from 'wouter';

export default function SimpleAIAssessmentPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{ score: number; totalPoints: number } | null>(null);
  
  const handleComplete = (score: number, totalPoints: number) => {
    setCompletedAssessment(true);
    setAssessmentResults({ score, totalPoints });
    
    // Simply log the points for now, no backend calls
    console.log(`User earned ${totalPoints} points`);
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
        <Card className="max-w-3xl mx-auto p-8 text-center">
          <h1 className="text-3xl font-bold mb-6">AI-Powered Knowledge Assessment</h1>
          <p className="text-lg mb-8">
            This assessment will measure your understanding of early childhood education principles
            and identify areas for professional growth. Ready to test your knowledge?
          </p>
          <div className="flex flex-col items-center justify-center space-y-4">
            <Button size="lg" onClick={handleStartAssessment}>
              Start Assessment
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (completedAssessment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Assessment Complete</h1>
          
          {assessmentResults && (
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-3">Your Results</h2>
              <p className="text-lg">
                You scored {assessmentResults.score} out of {assessmentResults.totalPoints} points
              </p>
              <p className="text-md mt-3">
                {assessmentResults.score === assessmentResults.totalPoints 
                  ? "Perfect score! You've demonstrated expert knowledge in early childhood education."
                  : assessmentResults.score >= assessmentResults.totalPoints * 0.8
                    ? "Excellent work! You have a strong understanding of key ECE concepts."
                    : assessmentResults.score >= assessmentResults.totalPoints * 0.6
                      ? "Good job! You have a solid foundation but there's room to expand your knowledge."
                      : "You've completed the assessment. Consider reviewing some of the key concepts to strengthen your understanding."}
              </p>
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <Button onClick={handleRestartAssessment}>
              Take Another Assessment
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <SimpleAIAssessment 
        onComplete={handleComplete}
        onCancel={() => setIsStarted(false)}
        maxQuestions={10}
      />
    </div>
  );
}