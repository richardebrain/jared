import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Target, Puzzle, ChevronRight } from 'lucide-react';

interface ActivityBlockComponentProps {
  block: {
    type: string;
    preview: string;
    content: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

interface ParsedActivity {
  activityType?: string;
  title?: string;
  preview?: string;
  instructions?: string;
  promptItems?: string[];
  answerKey?: Record<string, any>;
  uiHints?: string;
  imageSupport?: string;
}

const ActivityBlockComponent: React.FC<ActivityBlockComponentProps> = ({ 
  block, 
  onEdit, 
  onDelete,
  isDragging = false 
}) => {
  
  const parseActivityContent = (content: string): ParsedActivity => {
    const lines = content.split('\n').filter(line => line.trim());
    const parsed: ParsedActivity = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('activityType:')) {
        parsed.activityType = trimmed.replace('activityType:', '').trim();
      } else if (trimmed.startsWith('title:')) {
        parsed.title = trimmed.replace('title:', '').trim();
      } else if (trimmed.startsWith('preview:')) {
        parsed.preview = trimmed.replace('preview:', '').trim();
      } else if (trimmed.startsWith('instructions:')) {
        parsed.instructions = trimmed.replace('instructions:', '').trim();
      } else if (trimmed.startsWith('promptItems:')) {
        const itemsStr = trimmed.replace('promptItems:', '').trim();
        try {
          // Try to parse as JSON array
          if (itemsStr.startsWith('[') && itemsStr.endsWith(']')) {
            parsed.promptItems = JSON.parse(itemsStr);
          } else {
            // Parse as comma-separated string
            parsed.promptItems = itemsStr.split(',').map(item => item.trim().replace(/["\[\]]/g, ''));
          }
        } catch {
          parsed.promptItems = ['Activity items will be generated'];
        }
      } else if (trimmed.startsWith('answerKey:')) {
        const keyStr = trimmed.replace('answerKey:', '').trim();
        try {
          if (keyStr.startsWith('{') && keyStr.endsWith('}')) {
            parsed.answerKey = JSON.parse(keyStr);
          } else {
            parsed.answerKey = { note: 'Answer key will be generated' };
          }
        } catch {
          parsed.answerKey = { note: 'Answer key will be generated' };
        }
      } else if (trimmed.startsWith('uiHints:')) {
        parsed.uiHints = trimmed.replace('uiHints:', '').trim();
      } else if (trimmed.startsWith('imageSupport:')) {
        parsed.imageSupport = trimmed.replace('imageSupport:', '').trim();
      }
    });
    
    return parsed;
  };

  const getActivityIcon = (activityType: string) => {
    const type = activityType?.toLowerCase() || '';
    if (type.includes('drag') || type.includes('match')) {
      return <Puzzle className="h-5 w-5 text-purple-600" />;
    } else if (type.includes('scenario') || type.includes('challenge')) {
      return <Users className="h-5 w-5 text-blue-600" />;
    } else if (type.includes('categor')) {
      return <Target className="h-5 w-5 text-green-600" />;
    }
    return <Gamepad2 className="h-5 w-5 text-indigo-600" />;
  };

  const getActivityBadgeColor = (activityType: string) => {
    const type = activityType?.toLowerCase() || '';
    if (type.includes('drag') || type.includes('match')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (type.includes('scenario') || type.includes('challenge')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (type.includes('categor')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  const activity = parseActivityContent(block.content);
  
  return (
    <Card className={`w-full transition-all duration-200 border-l-4 border-l-purple-500 ${
      isDragging ? 'opacity-50 rotate-2' : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getActivityIcon(activity.activityType || '')}
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                {activity.title || 'Interactive Activity'}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`mt-1 ${getActivityBadgeColor(activity.activityType || '')}`}
              >
                {activity.activityType || 'Guided Activity'}
              </Badge>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Activity Preview */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Activity Preview:</p>
          <p className="text-sm text-gray-600">
            {activity.preview || block.preview || 'Interactive learning activity'}
          </p>
        </div>

        {/* Instructions */}
        {activity.instructions && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-700 mb-1">Instructions:</p>
            <p className="text-sm text-blue-600">{activity.instructions}</p>
          </div>
        )}

        {/* Activity Items Preview */}
        {activity.promptItems && activity.promptItems.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm font-medium text-green-700 mb-2">Activity Items:</p>
            <div className="flex flex-wrap gap-1">
              {activity.promptItems.slice(0, 4).map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white border-green-200 text-green-700">
                  {typeof item === 'string' ? item.substring(0, 20) + (item.length > 20 ? '...' : '') : 'Item'}
                </Badge>
              ))}
              {activity.promptItems.length > 4 && (
                <Badge variant="outline" className="text-xs bg-white border-green-200 text-green-700">
                  +{activity.promptItems.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Answer Key Preview */}
        {activity.answerKey && Object.keys(activity.answerKey).length > 0 && (
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-700 mb-1">Answer Structure:</p>
            <p className="text-xs text-amber-600">
              {Object.keys(activity.answerKey).length} answer pairs configured
            </p>
          </div>
        )}

        {/* UI Hints */}
        {activity.uiHints && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-700 mb-1">Design Notes:</p>
            <p className="text-sm text-purple-600">{activity.uiHints}</p>
          </div>
        )}

        {/* Interactive Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Interactive
            </Badge>
            <span className="text-xs text-gray-500">Hands-on learning activity</span>
          </div>
          <div className="text-xs text-gray-400">
            Will render as interactive component
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityBlockComponent;