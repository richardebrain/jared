import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface AssessmentResultsData {
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracyRate: number;
  totalTimeSeconds: number;
  strengthAreas: string[];
  growthAreas: string[];
  domainBreakdown?: any;
  personalizedSummary?: string;
}

interface AssessmentData {
  id: number;
  completedAt: string;
  type: string;
}

interface AssessmentResultsOverviewProps {
  assessment: AssessmentData;
  results: AssessmentResultsData;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  } else if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const AssessmentResultsOverview: React.FC<AssessmentResultsOverviewProps> = ({
  assessment,
  results
}) => {
  const [location, setLocation] = useLocation();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Initial Assessment Results
            </CardTitle>
            <CardDescription>
              Your assessment was completed successfully. Here's a summary of your performance.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Taken */}
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-blue-600 font-medium">Time Taken</div>
                <div className="text-lg font-bold text-blue-800">
                  {formatDuration(results.totalTimeSeconds)}
                </div>
              </div>
            </div>

            {/* Accuracy Percentage */}
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-green-600 font-medium">Accuracy Rate</div>
                <div className="text-lg font-bold text-green-800">
                  {results.accuracyRate}%
                </div>
              </div>
            </div>

            {/* Completion Summary */}
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-purple-600 font-medium">Completed</div>
                <div className="text-lg font-bold text-purple-800">
                  {formatDate(assessment.completedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Questions Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Questions Answered</div>
              <div className="text-2xl font-bold text-gray-800">
                {results.totalCorrect} out of {results.totalQuestions}
              </div>
            </div>
          </div>

          {/* Strengths and Growth Areas Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strength Areas */}
            {results.strengthAreas && results.strengthAreas.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Your Strengths
                </h4>
                <div className="space-y-2">
                  {results.strengthAreas.slice(0, 3).map((area, index) => (
                    <Badge 
                      key={index} 
                      className="bg-green-100 text-green-800 border-green-200 mr-2 mb-2"
                    >
                      {area}
                    </Badge>
                  ))}
                  {results.strengthAreas.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{results.strengthAreas.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Growth Areas Preview */}
            {results.growthAreas && results.growthAreas.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-amber-600" />
                  Growth Opportunities
                </h4>
                <div className="space-y-2">
                  {results.growthAreas.slice(0, 3).map((area, index) => (
                    <Badge 
                      key={index} 
                      className="bg-amber-100 text-amber-800 border-amber-200 mr-2 mb-2"
                    >
                      {area}
                    </Badge>
                  ))}
                  {results.growthAreas.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{results.growthAreas.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View Full Results CTA */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setLocation('/assessment-results')}
              className="flex items-center gap-2"
            >
              View Full Assessment Results
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentResultsOverview; 