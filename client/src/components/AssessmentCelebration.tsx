import { useState } from 'react';
import { useLocation } from 'wouter';
import { User } from '@shared/schema';
import { Confetti } from './Confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Sparkles, GraduationCap, ArrowRight, Map, Undo } from 'lucide-react';

interface AssessmentCelebrationProps {
  user: User | null;
  assessmentResults: any;
  resetAssessment: () => void;
  totalAnswers: number;
  correctAnswers: number;
}

export const AssessmentCelebration = ({ 
  user, 
  assessmentResults, 
  resetAssessment, 
  totalAnswers,
  correctAnswers
}: AssessmentCelebrationProps) => {
  const [location, setLocation] = useLocation();
  
  // Teacher progression levels information
  const progressionLevels = [
    { level: "Teacher in Training", pointRange: "0-299", current: false },
    { level: "Assistant Teacher", pointRange: "300-799", current: false },
    { level: "Associate Teacher", pointRange: "800-1499", current: false },
    { level: "Lead Teacher", pointRange: "1500-2499", current: false },
    { level: "Master Lead Teacher", pointRange: "2500-3499", current: false },
    { level: "Mentor Teacher", pointRange: "3500+", current: false }
  ];
  
  // Get the latest assessment
  const latestAssessment = assessmentResults || {};
  
  // Calculate percentage correct
  const percentageCorrect = Math.round((correctAnswers / totalAnswers) * 100) || 0;
  
  // Default values for strength/growth areas if not available
  const strengthAreas = latestAssessment.strengthAreas || ["Classroom Management", "Child Development"];
  const growthAreas = latestAssessment.growthAreas || ["Language & Literacy", "Special Needs Support"];
  const teacherLevel = latestAssessment.teacherLevel || "Teacher in Training";
  
  // Mark the current level in progression
  progressionLevels.forEach(level => {
    level.current = level.level === teacherLevel;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Confetti />
      
      <main className="container max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            <Sparkles className="inline-block mr-2 text-yellow-500" /> 
            Assessment Complete!
          </h1>
          <p className="text-xl text-muted-foreground">
            Great job! You've earned <span className="font-bold text-green-600">+10 points</span> for completing the assessment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Results Summary Card */}
          <Card className="shadow-md border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-2xl">
                <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                Your Results
              </CardTitle>
              <CardDescription>
                Here's how you did on the assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Questions Answered</span>
                    <span className="font-semibold">{totalAnswers}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Correct Answers</span>
                    <span className="font-semibold text-green-600">{correctAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Score</span>
                    <span className="font-semibold text-primary">
                      {percentageCorrect}%
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Your Strengths</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {strengthAreas.map((area: string, i: number) => (
                      <li key={i} className="text-green-700">{area}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4">
                  <h4 className="font-semibold mb-2">Areas for Growth</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {growthAreas.map((area: string, i: number) => (
                      <li key={i} className="text-amber-700">{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Teacher Progression Card */}
          <Card className="shadow-md border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-2xl">
                <GraduationCap className="mr-2 h-6 w-6 text-primary" />
                Teacher Progression
              </CardTitle>
              <CardDescription>
                Your current level and progression path
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-center font-medium pb-2">
                  You are currently a: <span className="text-lg font-bold text-primary">{teacherLevel}</span>
                </p>
                
                <div className="space-y-2">
                  {progressionLevels.map((level, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-all ${
                        level.current 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {level.current && (
                            <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></div>
                          )}
                          <span className={level.current ? 'font-bold' : ''}>{level.level}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{level.pointRange} points</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 text-center text-sm text-muted-foreground">
                  Earn points through training modules and daily activities to advance your teaching level
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <Button 
            variant="default" 
            size="lg"
            className="gap-2" 
            onClick={() => setLocation('/dashboard')}
          >
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="gap-2" 
            onClick={() => setLocation('/progression-map')}
          >
            View Progression Map <Map className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="lg"
            className="gap-2" 
            onClick={resetAssessment}
          >
            Retake Assessment <Undo className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};