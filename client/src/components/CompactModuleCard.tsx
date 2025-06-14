import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, CheckCircle, Clock, Coins } from "lucide-react";
import type { LearningModule, UserProgress } from "@shared/schema";

interface CompactModuleCardProps {
  module: LearningModule;
  progress?: UserProgress;
  onClick: (moduleId: number) => void;
}

export function CompactModuleCard({ module, progress, onClick }: CompactModuleCardProps) {
  // Calculate progress percentage
  const progressPercentage = progress?.progress || 0;
  const isCompleted = progress?.completed || false;
  
  // Background gradient based on module category
  const getCategoryColor = (category?: string) => {
    switch(category?.toLowerCase()) {
      case 'classroom management':
        return 'from-blue-500 to-blue-600';
      case 'child development':
        return 'from-green-500 to-green-600';
      case 'curriculum':
        return 'from-purple-500 to-purple-600';
      case 'communication':
        return 'from-pink-500 to-pink-600';
      case 'health & safety':
        return 'from-red-500 to-red-600';
      default:
        return 'from-amber-500 to-amber-600';
    }
  };

  return (
    <div 
      className="relative rounded-lg border p-3 hover:shadow-md transition-shadow bg-white"
      key={module.id}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">
          {module.title}
        </h3>
        {module.featured && (
          <Badge variant="secondary" className="ml-1 text-xs">Featured</Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{module.duration} min</span>
        </div>
        <div className="flex items-center bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
          <Coins className="w-3 h-3 mr-1" />
          <span className="font-medium">{module.pointValue || 10} pts</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center text-xs">
          <span>{progressPercentage}% complete</span>
          {isCompleted && (
            <span className="text-green-600 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Done
            </span>
          )}
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
      </div>
      
      <Button 
        className={`w-full text-xs h-8 bg-gradient-to-r ${getCategoryColor(module.category)}`}
        onClick={() => onClick(module.id)}
      >
        {isCompleted ? (
          <>
            <BookOpen className="mr-1 h-3 w-3" />
            Review
          </>
        ) : progressPercentage > 0 ? (
          <>
            <Play className="mr-1 h-3 w-3" />
            Continue
          </>
        ) : (
          <>
            <Play className="mr-1 h-3 w-3" />
            Start
          </>
        )}
      </Button>
    </div>
  );
}