import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Star, Award, Trophy, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import ConfettiExplosion from 'react-confetti-explosion';

interface AssessmentCelebrationProps {
  pointsEarned: number;
  onViewResults: () => void;
}

const AssessmentCelebration = ({ pointsEarned, onViewResults }: AssessmentCelebrationProps) => {
  const [, navigate] = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessment-results'],
    retry: 1,
  });

  useEffect(() => {
    // Stagger the animations for a more engaging experience
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  // Format domain names for user display
  const formatDomain = (domain: string): string => {
    const displayMap: Record<string, string> = {
      'language': 'Language & Literacy',
      'reasoning': 'Reasoning & Math',
      'social': 'Social & Emotional',
      'classroom': 'Classroom Management',
      'ages': 'Ages & Stages',
      'inclusion': 'Inclusion & Diversity',
      'health': 'Health & Safety'
    };
    
    return displayMap[domain] || domain;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading your assessment results...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-10">
      {showConfetti && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <ConfettiExplosion 
            force={0.8}
            duration={3000}
            particleCount={100}
            width={1200}
          />
        </div>
      )}

      <div className={`transform transition-all duration-700 ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gradient">Assessment Complete!</h1>
          <p className="text-xl text-muted-foreground">Great job completing your teaching assessment</p>
        </div>

        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center justify-center bg-primary/10 rounded-full p-5 w-28 h-28">
            <div className="text-center">
              <Trophy className="w-10 h-10 mx-auto mb-1 text-primary" />
              <span className="block text-2xl font-bold text-primary">+{pointsEarned}</span>
              <span className="text-xs text-muted-foreground">points</span>
            </div>
          </div>
        </div>

        {assessment && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-3 flex items-center">
                <Award className="w-6 h-6 mr-2 text-yellow-500" />
                Your Teacher Level
              </h2>
              <p className="text-xl mb-4 font-medium">{assessment.teacherLevel || 'Teacher in Training'}</p>
              <Progress value={assessment.overallScore} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                Overall Score: {assessment.overallScore}%
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Your Strengths
                </h2>
                {assessment.strengthAreas && assessment.strengthAreas.length > 0 ? (
                  <ul className="space-y-2 text-left">
                    {assessment.strengthAreas.map((area: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="mt-1 mr-2 text-green-500">•</div>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Complete more questions to reveal your strengths</p>
                )}
              </Card>

              <Card className="p-6 shadow-md">
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-blue-500" />
                  Growth Areas
                </h2>
                {assessment.growthAreas && assessment.growthAreas.length > 0 ? (
                  <ul className="space-y-2 text-left">
                    {assessment.growthAreas.map((area: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="mt-1 mr-2 text-blue-500">•</div>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Complete more questions to identify growth areas</p>
                )}
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={onViewResults} 
                className="flex items-center"
              >
                View Detailed Results
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleViewDashboard}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {!assessment && (
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Your assessment results are being processed. 
              You've earned {pointsEarned} points!
            </p>
            <Button onClick={handleViewDashboard} size="lg">
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentCelebration;