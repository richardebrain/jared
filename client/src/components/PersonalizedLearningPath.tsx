import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { BookOpen, Star, ArrowUpRight, Award, Calendar, Timer, Zap } from 'lucide-react';

interface LearningPathItem {
  domainId: string;
  domainName: string;
  priority: 'high' | 'medium' | 'low' | 'suggested';
  recommendation: string;
  moduleType: 'foundational' | 'intermediate' | 'advanced' | 'mastery';
  reason: string;
}

interface PersonalizedLearningPathProps {
  learningPath: LearningPathItem[];
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

const getModuleTypeIcon = (moduleType: string) => {
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

const PersonalizedLearningPath: React.FC<PersonalizedLearningPathProps> = ({ learningPath }) => {
  const [, setLocation] = useLocation();

  if (!learningPath || learningPath.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Your Personalized Learning Path
            </CardTitle>
            <CardDescription>
              Based on your assessment results, we've created a customized path for your growth
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPath.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-neutral-50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg">{item.domainName}</h4>
                <Badge className={`${getPriorityColor(item.priority)} capitalize`}>
                  {item.priority === 'high' ? 'Focus Area' : 
                   item.priority === 'medium' ? 'Important' : 
                   item.priority === 'low' ? 'Recommended' : 'Optional'}
                </Badge>
              </div>
              
              <p className="text-neutral-700 mb-3">{item.recommendation}</p>
              
              <div className="flex items-center text-sm text-neutral-500 mb-3">
                <div className="flex items-center mr-4">
                  {getModuleTypeIcon(item.moduleType)}
                  <span className="capitalize">{item.moduleType}</span>
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