import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Target, 
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface AssessmentProgressProps {
  current: number;
  total: number;
  percentage: number;
  domain: string;
  difficulty: number;
}

export default function AssessmentProgress({
  current,
  total,
  percentage,
  domain,
  difficulty
}: AssessmentProgressProps) {

  // Calculate progress stages
  const getProgressStage = () => {
    if (percentage < 25) return { stage: 'Getting Started', color: 'text-blue-600' };
    if (percentage < 50) return { stage: 'Making Progress', color: 'text-green-600' };
    if (percentage < 75) return { stage: 'Well Underway', color: 'text-orange-600' };
    if (percentage < 90) return { stage: 'Almost Done', color: 'text-purple-600' };
    return { stage: 'Final Questions', color: 'text-red-600' };
  };

  const progressStage = getProgressStage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Assessment Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question Counter */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {current} <span className="text-lg text-muted-foreground">of</span> {total}
          </div>
          <p className="text-sm text-muted-foreground">Questions Completed</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {progressStage.stage}
            </span>
            <span className={`text-sm font-medium ${progressStage.color}`}>
              {Math.round(percentage)}%
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Current Domain */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900 text-sm">Current Domain</h4>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm text-blue-800 font-medium">{domain}</p>
        </div>

        {/* Progress Milestones */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Milestones</h4>
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((milestone, index) => (
              <div
                key={milestone}
                className={`text-center p-2 rounded text-xs ${
                  percentage >= milestone
                    ? 'bg-green-100 text-green-800'
                    : percentage >= milestone - 12.5
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <div className="font-medium">{milestone}%</div>
                <div className="text-xs">
                  {milestone === 25 && 'Quarter'}
                  {milestone === 50 && 'Halfway'}
                  {milestone === 75 && 'Most Done'}
                  {milestone === 100 && 'Complete'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            {percentage < 25 && "You're off to a great start! Keep going."}
            {percentage >= 25 && percentage < 50 && "Excellent progress! You're doing well."}
            {percentage >= 50 && percentage < 75 && "Great work! You're over halfway there."}
            {percentage >= 75 && percentage < 90 && "Almost finished! Keep up the momentum."}
            {percentage >= 90 && "Final stretch! You're almost done!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 