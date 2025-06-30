import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star } from 'lucide-react';

interface AIAnalysis {
  children: {
    detectedChildren: string[];
    confidence: number;
  };
  activity: {
    activityType: string;
    recognizedObjects: string[];
    learningIndicators: string[];
    emotions: string[];
    confidence: number;
  };
  standards: {
    naeyc_standards: string[];
    custom_standards: string[];
    reasoning: string;
  };
  aiSummary: string;
  confidence: number;
  suggestedTitle: string;
  targetChild?: any;
  intelligentAssignment?: boolean;
  childAssignment?: {
    assignedChildren: string[];
    reasoning: string;
    confidence: number;
  };
  assignedChildObjects?: any[];
}

interface AIAnalysisPanelProps {
  photoAnalysis: AIAnalysis | null;
  isLoading?: boolean;
}

export default function AIAnalysisPanel({ photoAnalysis, isLoading }: AIAnalysisPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Analyzing...</h3>
          <p className="text-gray-500 text-center">
            AI is analyzing the photo and learning activity.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (!photoAnalysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
          <p className="text-gray-500 text-center">
            Upload a photo to see AI analysis of learning activities, emotions, and educational standards.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Analysis Results
        </CardTitle>
        <CardDescription>
          Confidence: {Math.round(photoAnalysis.confidence * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Activity Detected</h4>
          <Badge variant="outline">{photoAnalysis.activity.activityType}</Badge>
        </div>
        {photoAnalysis.intelligentAssignment && photoAnalysis.childAssignment && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Smart Child Assignment
            </h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {photoAnalysis.childAssignment.assignedChildren.map((childName: string, index: number) => (
                  <Badge key={index} variant="default" className="bg-green-100 text-green-800 border-green-300">
                    {childName}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {photoAnalysis.childAssignment.reasoning}
              </p>
              <div className="text-xs text-muted-foreground">
                Confidence: {Math.round((photoAnalysis.childAssignment.confidence || 0) * 100)}%
              </div>
            </div>
          </div>
        )}
        <div>
          <h4 className="font-medium mb-2">Learning Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {photoAnalysis.activity.learningIndicators.map((indicator: string, index: number) => (
              <Badge key={index} variant="secondary">{indicator}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Emotional States</h4>
          <div className="flex flex-wrap gap-2">
            {photoAnalysis.activity.emotions.map((emotion: string, index: number) => (
              <Badge key={index} variant="outline">{emotion}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">NAEYC Standards</h4>
          <div className="space-y-2">
            {photoAnalysis.standards.naeyc_standards.map((standard: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{standard}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">AI Summary</h4>
          <p className="text-sm text-gray-700">{photoAnalysis.aiSummary}</p>
        </div>
      </CardContent>
    </Card>
  );
} 