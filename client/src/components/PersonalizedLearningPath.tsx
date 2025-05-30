import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { BookOpen, Star, ArrowUpRight, Award, Calendar, Timer, Zap, AlertCircle } from 'lucide-react';

interface AssessmentScore {
  category: string;
  score: number;
  level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery';
  description: string;
}

interface Assessment {
  id: number;
  userId: number;
  overallScore: number;
  completedAt: string;
  scores: AssessmentScore[];
  teacherLevel: string;
}

interface LearningPathItem {
  domainId: string;
  domainName: string;
  priority: 'high' | 'medium' | 'low' | 'suggested';
  recommendation: string;
  score?: number;
  level?: string;
  reason: string;
}

interface LearningModule {
  id: number;
  title: string;
  category: string;
  description: string;
  // other module properties
}

interface PersonalizedLearningPathProps {
  assessments: Assessment[];
  user: any;
  modules: LearningModule[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'suggested':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getLevelColor = (level: string): string => {
  switch (level) {
    case 'mastery': return '#22c55e'; // Green
    case 'accomplished': return '#3b82f6'; // Blue
    case 'proficient': return '#f59e0b'; // Amber
    case 'developing': return '#ec4899'; // Pink
    case 'beginner': return '#9333ea'; // Purple
    default: return '#6b7280'; // Gray
  }
};

// Return recommended module type based on proficiency level
const getRecommendedModuleType = (level: string): string => {
  switch (level) {
    case 'beginner': return 'foundational';
    case 'developing': return 'foundational';
    case 'proficient': return 'intermediate';
    case 'accomplished': return 'advanced';
    case 'mastery': return 'mastery';
    default: return 'foundational';
  }
};

// Return appropriate recommendation text based on score
const getRecommendationText = (category: string, score: number): string => {
  if (score < 40) {
    return `Focus on building fundamental knowledge in ${category}. Start with introductory modules.`;
  } else if (score < 60) {
    return `Strengthen your developing skills in ${category} with guided practice modules.`;
  } else if (score < 75) {
    return `Enhance your proficient understanding of ${category} with application-focused modules.`;
  } else if (score < 90) {
    return `Refine your accomplished abilities in ${category} with advanced techniques.`;
  } else {
    return `Continue your mastery of ${category} while supporting others' growth in this area.`;
  }
};

const getModuleTypeIcon = (level: string) => {
  const moduleType = getRecommendedModuleType(level);
  
  switch (moduleType) {
    case 'foundational':
      return <BookOpen className="h-4 w-4 mr-1" />;
    case 'intermediate':
      return <Timer className="h-4 w-4 mr-1" />;
    case 'advanced':
      return <Zap className="h-4 w-4 mr-1" />;
    case 'mastery':
      return <Award className="h-4 w-4 mr-1" />;
    default:
      return <BookOpen className="h-4 w-4 mr-1" />;
  }
};

const PersonalizedLearningPath: React.FC<PersonalizedLearningPathProps> = ({ assessments, user, modules }) => {
  const [location, setLocation] = useLocation();

  // Get the most recent assessment
  const latestAssessment = assessments && assessments.length > 0 
    ? assessments.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0] 
    : null;

  // If no assessment found, show prompt to take assessment
  if (!latestAssessment) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Assessment Needed</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Complete an assessment to receive your personalized learning path based on your specific strengths and growth areas.
            </p>
            <Button onClick={() => setLocation('/initial-assessment')}>
              Take Initial Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where scores might not be an array or might be null
  const scores = latestAssessment.scores && Array.isArray(latestAssessment.scores) 
    ? latestAssessment.scores 
    : [];
    
  // Sort scores from lowest to highest
  const sortedScores = [...scores].sort((a, b) => a.score - b.score);
  
  // If no scores, provide default guidance
  if (sortedScores.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Assessment Incomplete</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your assessment needs to be completed to generate personalized learning recommendations.
            </p>
            <Button onClick={() => setLocation('/initial-assessment')}>
              Take Initial Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Generate learning path from the 3 lowest scoring categories
  const learningPath: LearningPathItem[] = sortedScores.slice(0, 3).map((score, index) => {
    // Determine priority based on position (lowest score = highest priority)
    const priority = index === 0 ? 'high' : index === 1 ? 'medium' : 'low';
    
    return {
      domainId: score.category.toLowerCase().replace(/\s+/g, '-'),
      domainName: score.category,
      priority,
      score: score.score,
      level: score.level,
      recommendation: getRecommendationText(score.category, score.score),
      reason: score.description
    };
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Your Growth Priorities
            </CardTitle>
            <CardDescription>
              Based on your assessment results, focus on these key areas to improve your teaching skills
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPath.map((item, index) => (
            <div key={index} 
              className="border rounded-lg p-4 hover:bg-neutral-50 transition-all"
              style={{ borderLeftWidth: '4px', borderLeftColor: getLevelColor(item.level || 'beginner') }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg">{item.domainName}</h4>
                <Badge className={`${getPriorityColor(item.priority)} capitalize`}>
                  {item.priority === 'high' ? 'Focus Area' : 
                   item.priority === 'medium' ? 'Important' : 
                   item.priority === 'low' ? 'Recommended' : 'Optional'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-full bg-secondary/30 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{ 
                      width: `${item.score}%`,
                      backgroundColor: getLevelColor(item.level || 'beginner')
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{item.score}%</span>
              </div>
              
              <p className="text-neutral-700 mb-3">{item.recommendation}</p>
              
              <div className="flex items-center text-sm text-neutral-500 mb-3">
                <div className="flex items-center mr-4">
                  {getModuleTypeIcon(item.level || 'beginner')}
                  <span className="capitalize">{getRecommendedModuleType(item.level || 'beginner')}</span>
                </div>
                <span className="text-sm italic">{item.reason}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary hover:text-primary-dark hover:bg-primary-50"
                onClick={() => setLocation(`/modules?domain=${item.domainId}`)}
              >
                View Related Modules
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedLearningPath;