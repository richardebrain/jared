import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Plus, 
  Save, 
  X, 
  Loader2, 
  FileEdit,
  GripVertical,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ActivityStep {
  id: string;
  title: string;
  activityType: 'Drag-and-Match' | 'Scenario Challenge' | 'Categorization' | 'Fill-in-Blanks' | 'Yes-No Questions' | 'Reflection' | 'Practice';
  instructions: string;
  promptItems: string[];
  answerKey: string[];
  uiHints: string;
  estimatedTime: number;
}

interface ActivityBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function ActivityBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: ActivityBuilderProps) {
  const [activities, setActivities] = useState<ActivityStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewActivityDialog, setShowNewActivityDialog] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<ActivityStep>>({
    title: '',
    activityType: 'Drag-and-Match',
    instructions: '',
    promptItems: [''],
    answerKey: [''],
    uiHints: '',
    estimatedTime: 5
  });
  const { toast } = useToast();

  useEffect(() => {
    if (initialData?.activities) {
      setActivities(initialData.activities);
    }
  }, [initialData]);

  const generateAIActivities = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${moduleTitle} - ${sectionTitle}`,
          sectionTitle: sectionTitle,
          moduleTitle: moduleTitle,
          sectionType: 'activity'
        })
      });

      if (!response.ok) throw new Error('Failed to generate activities');
      
      const data = await response.json();
      
      if (data.blocks && data.blocks.length > 0) {
        const newActivities = data.blocks.map((block: any, index: number) => {
          // Parse content if it's an object or string
          let parsedContent = '';
          let activityType = 'Drag-and-Match';
          let promptItems = ['Item 1', 'Item 2', 'Item 3'];
          let uiHints = 'Use interactive cards with drag-and-drop functionality';
          
          if (typeof block.content === 'string') {
            parsedContent = block.content;
          } else if (typeof block.content === 'object') {
            // Extract structured data from content object
            parsedContent = block.content.instructions || block.content.description || JSON.stringify(block.content, null, 2);
            activityType = block.content.activityType || 'Drag-and-Match';
            promptItems = block.content.promptItems || block.content.items || ['Item 1', 'Item 2', 'Item 3'];
            uiHints = block.content.uiHints || 'Use interactive cards with drag-and-drop functionality';
          }
          
          return {
            id: `activity-${Date.now()}-${index}`,
            title: block.preview || block.title || `Activity ${index + 1}`,
            activityType: activityType as any,
            instructions: parsedContent,
            promptItems: Array.isArray(promptItems) ? promptItems : ['Item 1', 'Item 2', 'Item 3'],
            answerKey: block.content?.answerKey || ['Answer 1', 'Answer 2', 'Answer 3'],
            uiHints: uiHints,
            estimatedTime: block.content?.estimatedTime || 5
          };
        });
        
        setActivities(prev => [...prev, ...newActivities]);
        
        toast({
          title: "Activities Generated",
          description: `Generated ${newActivities.length} interactive activities with AI`,
        });
      }
    } catch (error) {
      console.error('Error generating activities:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate activities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualActivity = () => {
    if (!newActivity.title || !newActivity.instructions) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and instructions for the activity.",
        variant: "destructive"
      });
      return;
    }

    const activity: ActivityStep = {
      id: `activity-${Date.now()}`,
      title: newActivity.title || '',
      activityType: newActivity.activityType || 'Drag-and-Match',
      instructions: newActivity.instructions || '',
      promptItems: newActivity.promptItems || [''],
      answerKey: newActivity.answerKey || [''],
      uiHints: newActivity.uiHints || '',
      estimatedTime: newActivity.estimatedTime || 5
    };

    setActivities(prev => [...prev, activity]);
    setNewActivity({
      title: '',
      activityType: 'Drag-and-Match',
      instructions: '',
      promptItems: [''],
      answerKey: [''],
      uiHints: '',
      estimatedTime: 5
    });
    setShowNewActivityDialog(false);

    toast({
      title: "Activity Added",
      description: "Your custom activity has been added successfully.",
    });
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const updateActivity = (id: string, updates: Partial<ActivityStep>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ));
  };

  const addPromptItem = (activityId: string) => {
    updateActivity(activityId, {
      promptItems: [...(activities.find(a => a.id === activityId)?.promptItems || []), '']
    });
  };

  const updatePromptItem = (activityId: string, index: number, value: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      const newItems = [...activity.promptItems];
      newItems[index] = value;
      updateActivity(activityId, { promptItems: newItems });
    }
  };

  const removePromptItem = (activityId: string, index: number) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity && activity.promptItems.length > 1) {
      const newItems = activity.promptItems.filter((_, i) => i !== index);
      updateActivity(activityId, { promptItems: newItems });
    }
  };

  const handleSave = () => {
    const builderData = {
      activities: activities,
      totalEstimatedTime: activities.reduce((sum, activity) => sum + activity.estimatedTime, 0),
      activityTypes: [...new Set(activities.map(a => a.activityType))],
      metadata: {
        moduleTitle,
        sectionTitle,
        createdAt: new Date().toISOString(),
        totalActivities: activities.length
      }
    };

    onSave(builderData);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-blue-600" />
            Interactive Activity Builder
            <Badge variant="outline" className="ml-2">
              {activities.length} Activities
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-blue-900">
                Building Activities for: {sectionTitle}
              </h3>
              <p className="text-sm text-blue-700">
                Create interactive learning activities with AI assistance and manual customization
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateAIActivities}
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
                    Generate with AI
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewActivityDialog(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Activity
              </Button>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileEdit className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No Activities Yet</p>
                <p className="text-sm">Generate activities with AI or create them manually</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <Card key={activity.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          <Input
                            value={activity.title}
                            onChange={(e) => updateActivity(activity.id, { title: e.target.value })}
                            className="font-semibold text-lg border-none p-0 h-auto"
                            placeholder="Activity title..."
                          />
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{activity.activityType}</Badge>
                          <Badge variant="outline">{activity.estimatedTime} min</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Activity Type</Label>
                      <Select
                        value={activity.activityType}
                        onValueChange={(value: any) => updateActivity(activity.id, { activityType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Drag-and-Match">Drag-and-Match</SelectItem>
                          <SelectItem value="Scenario Challenge">Scenario Challenge</SelectItem>
                          <SelectItem value="Categorization">Categorization</SelectItem>
                          <SelectItem value="Fill-in-Blanks">Fill-in-Blanks</SelectItem>
                          <SelectItem value="Yes-No Questions">Yes-No Questions</SelectItem>
                          <SelectItem value="Reflection">Reflection</SelectItem>
                          <SelectItem value="Practice">Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Instructions</Label>
                      <Textarea
                        value={activity.instructions}
                        onChange={(e) => updateActivity(activity.id, { instructions: e.target.value })}
                        placeholder="Describe how this activity works..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Activity Items</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPromptItem(activity.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {activity.promptItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => updatePromptItem(activity.id, itemIndex, e.target.value)}
                              placeholder={`Item ${itemIndex + 1}...`}
                              className="flex-1"
                            />
                            {activity.promptItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePromptItem(activity.id, itemIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">UI Hints</Label>
                        <Input
                          value={activity.uiHints}
                          onChange={(e) => updateActivity(activity.id, { uiHints: e.target.value })}
                          placeholder="Visual or interaction hints..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Estimated Time (minutes)</Label>
                        <Input
                          type="number"
                          value={activity.estimatedTime}
                          onChange={(e) => updateActivity(activity.id, { estimatedTime: parseInt(e.target.value) || 5 })}
                          className="mt-1"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {activities.length > 0 && (
                <span>
                  Total: {activities.length} activities • 
                  {activities.reduce((sum, a) => sum + a.estimatedTime, 0)} minutes
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={activities.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Activities ({activities.length})
              </Button>
            </div>
          </div>
        </div>

        {/* New Activity Dialog */}
        <Dialog open={showNewActivityDialog} onOpenChange={setShowNewActivityDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Activity Title</Label>
                <Input
                  value={newActivity.title || ''}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter activity title..."
                />
              </div>

              <div>
                <Label>Activity Type</Label>
                <Select
                  value={newActivity.activityType}
                  onValueChange={(value: any) => setNewActivity(prev => ({ ...prev, activityType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drag-and-Match">Drag-and-Match</SelectItem>
                    <SelectItem value="Scenario Challenge">Scenario Challenge</SelectItem>
                    <SelectItem value="Categorization">Categorization</SelectItem>
                    <SelectItem value="Fill-in-Blanks">Fill-in-Blanks</SelectItem>
                    <SelectItem value="Yes-No Questions">Yes-No Questions</SelectItem>
                    <SelectItem value="Reflection">Reflection</SelectItem>
                    <SelectItem value="Practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={newActivity.instructions || ''}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Describe how this activity works..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>UI Hints</Label>
                  <Input
                    value={newActivity.uiHints || ''}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, uiHints: e.target.value }))}
                    placeholder="Visual hints..."
                  />
                </div>
                <div>
                  <Label>Estimated Time (minutes)</Label>
                  <Input
                    type="number"
                    value={newActivity.estimatedTime || 5}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewActivityDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addManualActivity}>
                  Add Activity
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}