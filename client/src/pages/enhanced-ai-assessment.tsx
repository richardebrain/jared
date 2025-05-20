import React, { useState } from 'react';
import EnhancedAIAssessment from '@/components/EnhancedAIAssessment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'wouter';

const assessmentIntroText = `
  This enhanced assessment adapts to your knowledge level. As you answer correctly, 
  the questions will increase in difficulty. Your performance will determine your strengths
  and areas for growth across different early childhood education domains.
  
  The assessment includes:
  • 3 difficulty levels with progressively challenging questions
  • 10 questions per level (up to 30 total questions)
  • Immediate feedback with explanations
  • Domain-specific performance analytics
  • Points rewards that contribute to your overall teacher level
  
  Ready to test your early childhood education knowledge?
`;

const EnhancedAIAssessmentPage: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartAssessment = () => {
    setStarted(true);
  };

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results);
    setCompleted(true);
    
    // Show completion notification
    toast({
      title: "Assessment Completed!",
      description: `You earned ${results.pointsEarned} points and achieved a score of ${results.score}%`,
    });
    
    // Update user points in the database (would require API call in a real implementation)
    // This is just simulated for now
    console.log('Points earned:', results.pointsEarned);
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const renderDomainAnalysis = () => {
    if (!assessmentResults) return null;
    
    const { domainStrengths, domainWeaknesses } = assessmentResults;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600">Strengths</CardTitle>
            <CardDescription>Domains where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(domainStrengths).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(domainStrengths).map(([domain, percentage]: [string, any]) => (
                  <li key={domain} className="flex justify-between">
                    <span className="font-medium">{domain}</span>
                    <span className="text-green-600 font-bold">{Math.round(percentage)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">Keep practicing to discover your strengths</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-600">Growth Areas</CardTitle>
            <CardDescription>Domains to focus on improving</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(domainWeaknesses).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(domainWeaknesses).map(([domain, percentage]: [string, any]) => (
                  <li key={domain} className="flex justify-between">
                    <span className="font-medium">{domain}</span>
                    <span className="text-amber-600 font-bold">{Math.round(percentage)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">Great work! Focus on maintaining your knowledge</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!started) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Enhanced AI Assessment</CardTitle>
            <CardDescription className="text-white/90">
              Test your early childhood education knowledge
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg font-medium mb-4">Welcome, {user?.firstName || 'Teacher'}!</p>
              
              <p className="mb-4">
                This assessment will evaluate your knowledge across multiple ECE domains
                including child development, classroom management, and teaching practices.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-blue-800 font-medium mb-2">How It Works</h3>
                <p className="text-blue-700 whitespace-pre-line">{assessmentIntroText}</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-6">
                <h3 className="text-amber-800 font-medium mb-2">Important Note</h3>
                <p className="text-amber-700">
                  You can exit the assessment at any time, but your progress won't be saved.
                  Make sure you have 15-30 minutes available to complete the assessment.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <Button 
                size="lg" 
                onClick={handleStartAssessment}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Begin Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed && assessmentResults) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Assessment Completed!</CardTitle>
            <CardDescription className="text-white/90">
              Great job on completing the enhanced assessment
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
                  <p className="text-xl font-bold">{Math.round((assessmentResults.correctAnswers / assessmentResults.totalQuestions) * 100)}%</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Domain Analysis</h3>
            {renderDomainAnalysis()}
            
            <div className="flex justify-center mt-8">
              <Button 
                size="lg" 
                onClick={handleReturnToDashboard}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <EnhancedAIAssessment 
        teacherId={user?.id || 1}
        teacherName={user?.firstName || 'Teacher'}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
};

export default EnhancedAIAssessmentPage;