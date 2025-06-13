import { Badge } from './badge';
import { Clock, Target, Calendar, AlertCircle } from 'lucide-react';

interface AssessmentResults {
  completed: boolean;
  completedAt?: string;
  accuracyRate?: number;
  totalTimeMinutes?: number;
  topGrowthAreas?: string[];
  overallScore?: number;
  totalQuestions?: number;
  totalCorrect?: number;
}

interface TeacherAssessmentSummaryProps {
  assessmentResults?: AssessmentResults;
}

export function TeacherAssessmentSummary({ assessmentResults }: TeacherAssessmentSummaryProps) {
  if (!assessmentResults) {
    return null;
  }

  if (!assessmentResults.completed) {
    return (
      <div className="mt-3 pt-3 border-t border-muted">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Initial Assessment not completed yet</span>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-muted space-y-2">
      {/* Core metrics row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Completed:</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Accuracy:</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Time:</span>
        </div>
        
        <div className="font-medium text-xs">
          {assessmentResults.completedAt && formatDate(assessmentResults.completedAt)}
        </div>
        <div className="font-medium text-xs">
          {assessmentResults.accuracyRate ? `${Math.round(assessmentResults.accuracyRate)}%` : 'N/A'}
        </div>
        <div className="font-medium text-xs">
          {assessmentResults.totalTimeMinutes ? `${assessmentResults.totalTimeMinutes}min` : 'N/A'}
        </div>
      </div>

      {/* Growth areas row */}
      {assessmentResults.topGrowthAreas && assessmentResults.topGrowthAreas.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Growth Areas:</div>
          <div className="flex flex-wrap gap-1">
            {assessmentResults.topGrowthAreas.slice(0, 3).map((area, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs py-0 px-2 h-5 bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 