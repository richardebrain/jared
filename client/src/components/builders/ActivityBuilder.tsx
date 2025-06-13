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
          let activityData = {
            title: 'New Activity',
            activityType: 'Drag-and-Match',
            instructions: '',
            promptItems: ['New item 1', 'New item 2', 'New item 3'],
            answerKey: ['Answer 1', 'Answer 2', 'Answer 3'],
            uiHints: 'Use interactive cards with drag-and-drop functionality',
            estimatedTime: 5
          };

          // Extract title from preview or block title
          if (block.preview) {
            activityData.title = block.preview;
          } else if (block.title) {
            activityData.title = block.title;
          }

          // Parse content - handle both string and object formats
          if (typeof block.content === 'object' && block.content !== null) {
            // Use structured content object
            activityData.title = block.content.title || activityData.title;
            activityData.activityType = block.content.activityType || activityData.activityType;
            activityData.instructions = block.content.instructions || block.content.description || '';
            activityData.promptItems = Array.isArray(block.content.promptItems) 
              ? block.content.promptItems 
              : Array.isArray(block.content.items) 
                ? block.content.items 
                : activityData.promptItems;
            activityData.answerKey = Array.isArray(block.content.answerKey) 
              ? block.content.answerKey 
              : activityData.answerKey;
            activityData.uiHints = block.content.uiHints || activityData.uiHints;
            activityData.estimatedTime = block.content.estimatedTime || activityData.estimatedTime;
          } else if (typeof block.content === 'string') {
            // Parse text content to extract activity details
            activityData.instructions = block.content;
            
            // Try to extract items from content text
            const lines = block.content.split('\n').filter(line => line.trim());
            const itemLines = lines.filter(line => 
              line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')
            );
            
            if (itemLines.length > 0) {
              activityData.promptItems = itemLines.map(line => 
                line.replace(/^[\s\-\•\d\.\)]+/, '').trim()
              ).filter(item => item.length > 0);
            }
          }

          return {
            id: `activity-${Date.now()}-${index}`,
            title: activityData.title,
            activityType: activityData.activityType as any,
            instructions: activityData.instructions,
            promptItems: activityData.promptItems,
            answerKey: activityData.answerKey,
            uiHints: activityData.uiHints,
            estimatedTime: activityData.estimatedTime
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

  const getActivityItemsLabel = (activityType: string) => {
    switch (activityType) {
      case 'Drag-and-Match': return 'Items to Match';
      case 'Scenario Challenge': return 'Scenario Options';
      case 'Categorization': return 'Items to Categorize';
      case 'Fill-in-Blanks': return 'Fill-in Items';
      case 'Yes-No Questions': return 'Question Items';
      case 'Reflection': return 'Reflection Prompts';
      case 'Practice': return 'Practice Items';
      default: return 'Activity Items';
    }
  };

  const renderActivityContent = (activity: any) => {
    const baseItemClass = "flex items-center gap-2 p-3 border rounded-lg bg-gray-50";
    
    switch (activity.activityType) {
      case 'Drag-and-Match':
        return (
          <div className="space-y-3">
            <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
              🔄 Drag-and-Match Setup
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Items to Match</Label>
                <div className="space-y-2">
                  {activity.promptItems.map((item: string, itemIndex: number) => (
                    <div key={itemIndex} className={baseItemClass}>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <Input
                        value={item}
                        onChange={(e) => updatePromptItem(activity.id, itemIndex, e.target.value)}
                        placeholder={`Match item ${itemIndex + 1}...`}
                        className="flex-1 border-none bg-transparent p-0"
                      />
                      {activity.promptItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePromptItem(activity.id, itemIndex)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Correct Matches</Label>
                <div className="space-y-2">
                  {activity.answerKey.map((answer: string, answerIndex: number) => (
                    <div key={answerIndex} className={`${baseItemClass} bg-green-50`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Input
                        value={answer}
                        onChange={(e) => {
                          const newAnswers = [...activity.answerKey];
                          newAnswers[answerIndex] = e.target.value;
                          updateActivity(activity.id, { answerKey: newAnswers });
                        }}
                        placeholder={`Answer ${answerIndex + 1}...`}
                        className="flex-1 border-none bg-transparent p-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Scenario Challenge':
        return (
          <div className="space-y-3">
            <div className="text-sm text-purple-600 font-medium flex items-center gap-2">
              🎭 Scenario Challenge Setup
            </div>
            <div className="space-y-2">
              {activity.promptItems.map((item: string, itemIndex: number) => (
                <div key={itemIndex} className={`${baseItemClass} bg-purple-50`}>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <Input
                    value={item}
                    onChange={(e) => updatePromptItem(activity.id, itemIndex, e.target.value)}
                    placeholder={`Scenario option ${itemIndex + 1}...`}
                    className="flex-1 border-none bg-transparent p-0"
                  />
                  {activity.promptItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePromptItem(activity.id, itemIndex)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'Categorization':
        return (
          <div className="space-y-3">
            <div className="text-sm text-orange-600 font-medium flex items-center gap-2">
              📂 Categorization Setup
            </div>
            <div className="space-y-2">
              {activity.promptItems.map((item: string, itemIndex: number) => (
                <div key={itemIndex} className={`${baseItemClass} bg-orange-50`}>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <Input
                    value={item}
                    onChange={(e) => updatePromptItem(activity.id, itemIndex, e.target.value)}
                    placeholder={`Item to categorize ${itemIndex + 1}...`}
                    className="flex-1 border-none bg-transparent p-0"
                  />
                  {activity.promptItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePromptItem(activity.id, itemIndex)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {activity.promptItems.map((item: string, itemIndex: number) => (
              <div key={itemIndex} className={baseItemClass}>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <Input
                  value={item}
                  onChange={(e) => updatePromptItem(activity.id, itemIndex, e.target.value)}
                  placeholder={`Item ${itemIndex + 1}...`}
                  className="flex-1 border-none bg-transparent p-0"
                />
                {activity.promptItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePromptItem(activity.id, itemIndex)}
                    className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        );
    }
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

                    {/* Activity Items - Type-specific rendering */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          {getActivityItemsLabel(activity.activityType)}
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPromptItem(activity.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                      </div>
                      
                      {/* Type-specific activity content */}
                      {renderActivityContent(activity)}
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