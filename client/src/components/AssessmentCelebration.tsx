import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

interface AssessmentCelebrationProps {
  assessmentData: {
    totalQuestions: number;
    questionsAnswered: number;
    overallScore?: number;
    completedAt?: string;
  };
  onViewResults: () => void;
  onContinue?: () => void;
}

export default function AssessmentCelebration({ 
  assessmentData, 
  onViewResults,
  onContinue 
}: AssessmentCelebrationProps) {
  const { totalQuestions, questionsAnswered, overallScore, completedAt } = assessmentData;
  
  // Calculate completion time estimate
  const estimatedTime = Math.round((questionsAnswered * 60) / 60); // Assume 60 seconds per question
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Congratulations! 🎉
          </CardTitle>
          
          <p className="text-xl text-muted-foreground mt-2">
            You've successfully completed your initial assessment
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Achievement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-700">Questions Completed</div>
              <div className="text-2xl font-bold text-green-800">{questionsAnswered}/{totalQuestions}</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-700">Time Invested</div>
              <div className="text-2xl font-bold text-blue-800">~{estimatedTime} min</div>
            </div>
            
            {overallScore !== undefined && (
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-700">Overall Score</div>
                <div className="text-2xl font-bold text-purple-800">{overallScore}%</div>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <div className="text-center p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-xl border border-amber-200">
            <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Outstanding Commitment to Professional Growth!
            </h3>
            <p className="text-gray-600 leading-relaxed">
              You've just taken a significant step in your early childhood education journey. 
              Your responses will help us create a personalized learning path tailored specifically 
              to your professional development needs.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">What's Next?</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Review your personalized assessment results
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Explore your strength areas and growth opportunities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Access your customized learning path and mini-lessons
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Begin your professional development journey
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onViewResults}
              size="lg"
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Trophy className="w-5 h-5 mr-2" />
              View My Results
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {onContinue && (
              <Button 
                onClick={onContinue}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Continue to Dashboard
              </Button>
            )}
          </div>

          {/* Completion Timestamp */}
          {completedAt && (
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              Completed on {new Date(completedAt).toLocaleDateString()} at {new Date(completedAt).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}