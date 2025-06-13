import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  Gamepad, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  GripVertical
} from 'lucide-react';

interface Activity {
  title: string;
  activityType: string;
  instructions: string;
  promptItems: string[];
  answerKey: string[];
  preview: string;
  uiHints: {
    leftColumnTitle: string;
    rightColumnTitle: string;
    dragInstruction: string;
  };
  imageSupport: boolean;
}

interface InteractiveActivityBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activities: Activity[]) => void;
  moduleTitle?: string;
  sectionTitle?: string;
  learningObjective?: string;
}

export default function InteractiveActivityBuilder({
  isOpen,
  onClose,
  onSave,
  moduleTitle = '',
  sectionTitle = '',
  learningObjective = ''
}: InteractiveActivityBuilderProps) {
  const { toast } = useToast();
  
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    title: '',
    activityType: 'drag-and-match',
    instructions: '',
    promptItems: ['', '', '', ''],
    answerKey: ['', '', '', ''],
    preview: '',
    uiHints: {
      leftColumnTitle: 'Items to Match',
      rightColumnTitle: 'Categories',
      dragInstruction: 'Drag items to their matching categories'
    },
    imageSupport: false
  });

  const [builtActivities, setBuiltActivities] = useState<Activity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activityDifficulty, setActivityDifficulty] = useState('medium');

  const updateActivityField = (field: keyof Activity, value: any) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateActivityItem = (field: 'promptItems' | 'answerKey', index: number, value: string) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addActivityItem = () => {
    setCurrentActivity(prev => ({
      ...prev,
      promptItems: [...prev.promptItems, ''],
      answerKey: [...prev.answerKey, '']
    }));
  };

  const removeActivityItem = (index: number) => {
    setCurrentActivity(prev => ({
      ...prev,
      promptItems: prev.promptItems.filter((_, i) => i !== index),
      answerKey: prev.answerKey.filter((_, i) => i !== index)
    }));
  };

  const addActivityToList = () => {
    if (!currentActivity.title.trim() || !currentActivity.instructions.trim()) {
      toast({
        title: "Incomplete Activity",
        description: "Please provide both title and instructions for the activity.",
        variant: "destructive",
      });
      return;
    }

    const validItems = currentActivity.promptItems.filter(item => item.trim());
    const validAnswers = currentActivity.answerKey.filter(answer => answer.trim());

    if (validItems.length < 2 || validAnswers.length < 2) {
      toast({
        title: "Insufficient Content",
        description: "Please provide at least 2 items and 2 answer options.",
        variant: "destructive",
      });
      return;
    }

    const newActivity = {
      ...currentActivity,
      promptItems: validItems,
      answerKey: validAnswers,
      preview: `${currentActivity.activityType}: ${currentActivity.title}`
    };

    setBuiltActivities(prev => [...prev, newActivity]);
    
    // Reset current activity
    setCurrentActivity({
      title: '',
      activityType: 'drag-and-match',
      instructions: '',
      promptItems: ['', '', '', ''],
      answerKey: ['', '', '', ''],
      preview: '',
      uiHints: {
        leftColumnTitle: 'Items to Match',
        rightColumnTitle: 'Categories',
        dragInstruction: 'Drag items to their matching categories'
      },
      imageSupport: false
    });

    toast({
      title: "Activity Added",
      description: `Activity builder now has ${builtActivities.length + 1} activities`,
    });
  };

  const removeActivityFromList = (index: number) => {
    setBuiltActivities(prev => prev.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtActivities.length === 0) {
      toast({
        title: "No Activities",
        description: "Please add at least one activity.",
        variant: "destructive",
      });
      return;
    }

    onSave(builtActivities);
    onClose();
    
    toast({
      title: "Activities Created Successfully",
      description: `Created ${builtActivities.length} interactive activities`,
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Gamepad className="h-5 w-5" />
          Interactive Activity Builder
        </CardTitle>
        <CardDescription className="text-blue-700">
          Build interactive activities like drag-and-match, sorting, and categorization exercises.
        </CardDescription>
        
        {/* Context Information */}
        <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Activity Context</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-blue-700">
              <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
            </div>
            <div className="text-blue-700">
              <strong>Section:</strong> {sectionTitle || 'Current Section'}
            </div>
            <div className="text-blue-700">
              <strong>Learning Objective:</strong> {learningObjective || 'Building effective teaching strategies'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Activity Progress */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
              {builtActivities.length}
            </div>
            <span className="text-sm font-medium">Activities Built</span>
          </div>
          {builtActivities.length > 0 && (
            <Button
              size="sm"
              onClick={finishAndSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Finish & Save Activities
            </Button>
          )}
        </div>

        {/* Current Activity Builder */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Activity {builtActivities.length + 1}</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isGenerating}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Activity Type Selection */}
          <div>
            <Label className="text-sm font-medium">Activity Type</Label>
            <Select 
              value={currentActivity.activityType} 
              onValueChange={(value) => updateActivityField('activityType', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drag-and-match">Drag and Match</SelectItem>
                <SelectItem value="categorization">Categorization</SelectItem>
                <SelectItem value="sorting">Sorting Exercise</SelectItem>
                <SelectItem value="labeling">Labeling Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Title */}
          <div>
            <Label className="text-sm font-medium">Activity Title</Label>
            <Input
              value={currentActivity.title}
              onChange={(e) => updateActivityField('title', e.target.value)}
              placeholder="Enter activity title..."
              className="mt-1"
            />
          </div>

          {/* Instructions */}
          <div>
            <Label className="text-sm font-medium">Instructions</Label>
            <Textarea
              value={currentActivity.instructions}
              onChange={(e) => updateActivityField('instructions', e.target.value)}
              placeholder="Provide clear instructions for learners..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Activity Items */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Items to Match</Label>
              <div className="space-y-2 mt-1">
                {currentActivity.promptItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateActivityItem('promptItems', index, e.target.value)}
                      placeholder={`Item ${index + 1}`}
                    />
                    {currentActivity.promptItems.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActivityItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addActivityItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Categories/Answers</Label>
              <div className="space-y-2 mt-1">
                {currentActivity.answerKey.map((answer, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={answer}
                      onChange={(e) => updateActivityItem('answerKey', index, e.target.value)}
                      placeholder={`Category ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Activity Button */}
          <Button
            onClick={addActivityToList}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!currentActivity.title.trim() || !currentActivity.instructions.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity to List
          </Button>
        </div>

        {/* Built Activities List */}
        {builtActivities.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Built Activities ({builtActivities.length})</h4>
            {builtActivities.map((activity, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Type: {activity.activityType} | Items: {activity.promptItems.length}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeActivityFromList(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-blue-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel Activity Builder
          </Button>
          
          {builtActivities.length > 0 && (
            <Button
              onClick={finishAndSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Activities & Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}