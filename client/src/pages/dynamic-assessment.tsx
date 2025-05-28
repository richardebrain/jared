import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedAssessment from '@/components/EnhancedAssessment';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface AssessmentResult {
  teacherId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  domainStrengths: Record<string, number>;
  domainWeaknesses: Record<string, number>;
  difficulty: number;
  pointsEarned: number;
  timeTaken: number;
  completedAt: Date;
}

const DynamicAssessmentPage: React.FC = () => {
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null);
  const { toast } = useToast();

  // Fetch user data for the assessment
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Start the assessment
  const startAssessment = () => {
    setIsAssessing(true);
    setAssessmentResults(null);
  };

  // Handle assessment completion
  const handleAssessmentComplete = async (results: AssessmentResult) => {
    setAssessmentResults(results);
    setIsAssessing(false);

    // Add points to the user's account
    try {
      const response = await fetch('/api/users/add-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?.id,
          points: results.pointsEarned,
          source: 'assessment',
          sourceId: new Date().getTime().toString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Points Added!',
          description: `You earned ${results.pointsEarned} points from this assessment!`,
        });

        // Play celebratory confetti
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b'],
        });
      }
    } catch (error) {
      console.error('Error adding points:', error);
      // Still show results even if points update fails
    }
  };

  if (userLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not logged in, use demo mode with default values
  if (!userData?.id) {
    const demoUser = {
      id: 999,
      firstName: "Demo Teacher",
      username: "demo_teacher"
    };
    
    return (
      <div className="container mx-auto py-8">
        {!isAssessing && !assessmentResults && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-center text-2xl">Dynamic ECE Knowledge Assessment</CardTitle>
              <CardDescription className="text-center text-white/90">
                Test your early childhood education knowledge with our adaptive assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-lg font-medium mb-4">
                  Welcome, {demoUser.firstName}!
                </p>
                
                <p className="mb-4">
                  This assessment will evaluate your knowledge across multiple ECE domains
                  including child development, classroom management, and teaching practices.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <h3 className="text-blue-800 font-medium mb-2">How It Works</h3>
                  <p className="text-blue-700">
                    This assessment includes:<br/>
                    • Questions that adapt to your skill level<br/>
                    • Immediate feedback with explanations<br/>
                    • Domain-specific performance analysis<br/>
                    • Points rewards for your teacher profile
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-6">
                  <h3 className="text-amber-800 font-medium mb-2">Demo Mode</h3>
                  <p className="text-amber-700">
                    You're using the demo version of our assessment. In this mode, your results won't be saved to a profile.
                    Log in for the full experience with personalized learning paths!
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={startAssessment}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 text-lg"
                >
                  Begin Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isAssessing && (
          <EnhancedAssessment 
            teacherId={demoUser.id}
            teacherName={demoUser.firstName}
            onComplete={handleAssessmentComplete}
          />
        )}

        {assessmentResults && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-center text-2xl">Assessment Complete!</CardTitle>
              <CardDescription className="text-center text-white/90">
                Great job on completing your assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your Score: {assessmentResults.score}%</h2>
                <p className="text-lg text-slate-600">
                  You earned <span className="font-bold text-green-600">{assessmentResults.pointsEarned} points</span>
                </p>
                <p className="text-slate-500 mt-1">
                  Time taken: {Math.floor(assessmentResults.timeTaken / 60)} minutes {assessmentResults.timeTaken % 60} seconds
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-blue-800 font-medium mb-2">Assessment Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-slate-600">Questions Answered</p>
                    <p className="text-xl font-bold">{assessmentResults.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Correct Answers</p>
                    <p className="text-xl font-bold text-green-600">{assessmentResults.correctAnswers}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Highest Difficulty</p>
                    <p className="text-xl font-bold">{assessmentResults.difficulty}/3</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Accuracy</p>
                    <p className="text-xl font-bold">{assessmentResults.score}%</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-4">Domain Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h4 className="text-green-600 font-bold mb-1">Strengths</h4>
                  <p className="text-sm text-slate-500 mb-3">Domains where you excel</p>
                  <div className="space-y-2">
                    {Object.entries(assessmentResults.domainStrengths).length > 0 ? (
                      Object.entries(assessmentResults.domainStrengths).map(([domain, percentage]) => (
                        <div key={domain} className="flex justify-between">
                          <span className="font-medium">{domain}</span>
                          <span className="text-green-600 font-bold">{Math.round(percentage)}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">Keep practicing to discover your strengths</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h4 className="text-amber-600 font-bold mb-1">Growth Areas</h4>
                  <p className="text-sm text-slate-500 mb-3">Domains to focus on improving</p>
                  <div className="space-y-2">
                    {Object.entries(assessmentResults.domainWeaknesses).length > 0 ? (
                      Object.entries(assessmentResults.domainWeaknesses).map(([domain, percentage]) => (
                        <div key={domain} className="flex justify-between">
                          <span className="font-medium">{domain}</span>
                          <span className="text-amber-600 font-bold">{Math.round(percentage)}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">Great work! Focus on maintaining your knowledge</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8 space-x-4">
                <Button 
                  onClick={startAssessment}
                  variant="outline"
                >
                  Take Another Assessment
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {!isAssessing && !assessmentResults && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-2xl">Dynamic ECE Knowledge Assessment</CardTitle>
            <CardDescription className="text-center text-white/90">
              Test your early childhood education knowledge with our adaptive assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="prose max-w-none">
              <p className="text-lg font-medium mb-4">
                Welcome, {userData.firstName || userData.username}!
              </p>
              
              <p className="mb-4">
                This assessment will evaluate your knowledge across multiple ECE domains
                including child development, classroom management, and teaching practices.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-blue-800 font-medium mb-2">How It Works</h3>
                <p className="text-blue-700">
                  This assessment includes:<br/>
                  • Questions that adapt to your skill level<br/>
                  • Immediate feedback with explanations<br/>
                  • Domain-specific performance analysis<br/>
                  • Points rewards for your teacher profile
                </p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-6">
                <h3 className="text-amber-800 font-medium mb-2">Important Note</h3>
                <p className="text-amber-700">
                  The assessment takes approximately 10-15 minutes to complete.
                  Your results will help create a personalized learning path just for you!
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <Button 
                onClick={startAssessment}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 text-lg"
              >
                Begin Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAssessing && userData && (
        <EnhancedAssessment 
          teacherId={userData.id}
          teacherName={userData.firstName || userData.username}
          onComplete={handleAssessmentComplete}
        />
      )}

      {assessmentResults && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-2xl">Assessment Complete!</CardTitle>
            <CardDescription className="text-center text-white/90">
              Great job on completing your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Your Score: {assessmentResults.score}%</h2>
              <p className="text-lg text-slate-600">
                You earned <span className="font-bold text-green-600">{assessmentResults.pointsEarned} points</span>
              </p>
              <p className="text-slate-500 mt-1">
                Time taken: {Math.floor(assessmentResults.timeTaken / 60)} minutes {assessmentResults.timeTaken % 60} seconds
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-blue-800 font-medium mb-2">Assessment Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-slate-600">Questions Answered</p>
                  <p className="text-xl font-bold">{assessmentResults.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-slate-600">Correct Answers</p>
                  <p className="text-xl font-bold text-green-600">{assessmentResults.correctAnswers}</p>
                </div>
                <div>
                  <p className="text-slate-600">Highest Difficulty</p>
                  <p className="text-xl font-bold">{assessmentResults.difficulty}/3</p>
                </div>
                <div>
                  <p className="text-slate-600">Accuracy</p>
                  <p className="text-xl font-bold">{assessmentResults.score}%</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Domain Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-green-600 font-bold mb-1">Strengths</h4>
                <p className="text-sm text-slate-500 mb-3">Domains where you excel</p>
                <div className="space-y-2">
                  {Object.entries(assessmentResults.domainStrengths).length > 0 ? (
                    Object.entries(assessmentResults.domainStrengths).map(([domain, percentage]) => (
                      <div key={domain} className="flex justify-between">
                        <span className="font-medium">{domain}</span>
                        <span className="text-green-600 font-bold">{Math.round(percentage)}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">Keep practicing to discover your strengths</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-amber-600 font-bold mb-1">Growth Areas</h4>
                <p className="text-sm text-slate-500 mb-3">Domains to focus on improving</p>
                <div className="space-y-2">
                  {Object.entries(assessmentResults.domainWeaknesses).length > 0 ? (
                    Object.entries(assessmentResults.domainWeaknesses).map(([domain, percentage]) => (
                      <div key={domain} className="flex justify-between">
                        <span className="font-medium">{domain}</span>
                        <span className="text-amber-600 font-bold">{Math.round(percentage)}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">Great work! Focus on maintaining your knowledge</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 space-x-4">
              <Button 
                onClick={startAssessment}
                variant="outline"
              >
                Take Another Assessment
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicAssessmentPage;