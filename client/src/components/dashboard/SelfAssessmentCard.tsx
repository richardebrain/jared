import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ArrowRight, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Assessment } from "@shared/schema";

interface SelfAssessmentCardProps {
  latestAssessment?: Assessment | null;
  showAsSelfAssessment?: boolean;
}

export function SelfAssessmentCard({ latestAssessment, showAsSelfAssessment = true }: SelfAssessmentCardProps) {
  const [location, setLocation] = useLocation();
  
  // Check if there's a self-assessment in the assessment data
  const hasSelfAssessment = !!latestAssessment && latestAssessment.type === 'self';
  
  // Calculate time since last assessment to display
  const getTimeAgo = (date: string) => {
    const assessmentDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };
  
  const timeAgo = hasSelfAssessment && latestAssessment?.completedAt ? 
    getTimeAgo(latestAssessment.completedAt) : null;
  
  return (
    <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
        <CardTitle className="text-xl font-bold text-white mb-0 flex justify-between items-center">
          <span>
            <BrainCircuit className="h-5 w-5 mr-2 inline-block" />
            Teacher Self-Assessment
          </span>
          {hasSelfAssessment && <CheckCircle className="h-5 w-5 text-white" />}
        </CardTitle>
        <CardDescription className="text-white font-medium opacity-90 m-0">
          Evaluate your teaching skills
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          {hasSelfAssessment ? (
            <div className="text-sm">
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Last completed:</span> {timeAgo}
              </p>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Teacher level:</span> {latestAssessment.teacherLevel || 'Beginner'}
              </p>
              <p className="text-gray-700 mb-1">
                <span className="font-medium">Overall score:</span> {latestAssessment.overallScore}%
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mb-2">
              Complete a self-assessment to discover your teaching strengths and areas for growth.
            </p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <Badge 
            variant={hasSelfAssessment ? "success" : "outline"} 
            className="font-normal"
          >
            {hasSelfAssessment ? "Completed" : "Recommended"}
          </Badge>
          <Button 
            variant="link" 
            className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setLocation('/self-assessment')}
          >
            {hasSelfAssessment ? "Reassess" : "Start Assessment"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SelfAssessmentCard;