import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  GripVertical,
  Shuffle,
  Target
} from 'lucide-react';

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
}

export default function MatchingBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: MatchingBuilderProps) {
  const { toast } = useToast();
  const [matchingActivities, setMatchingActivities] = useState<Array<{
    title: string;
    instructions: string;
    pairs: MatchingPair[];
  }>>([]);
  const [currentActivity, setCurrentActivity] = useState({
    title: '',
    instructions: '',
    pairs: [] as MatchingPair[]
  });
  const [currentPair, setCurrentPair] = useState({ left: '', right: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.activities) {
      setMatchingActivities(initialData.activities);
    }
  }, [initialData]);

  const generateMatchingContent = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate matching content.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: moduleTitle,
          description: moduleDescription,
          category,
          difficulty,
          estimatedTime
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      
      const data = await response.json();
      
      setCurrentActivity({
        title: data.title || `${moduleTitle} - Matching Activity`,
        instructions: data.instructions || "Match the items on the left with their corresponding items on the right.",
        pairs: data.pairs || []
      });

      toast({
        title: "Content Generated!",
        description: "AI has created matching pairs for your activity."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate matching content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addPair = () => {
    if (currentPair.left.trim() && currentPair.right.trim()) {
      setCurrentActivity(prev => ({
        ...prev,
        pairs: [...prev.pairs, { left: currentPair.left.trim(), right: currentPair.right.trim() }]
      }));
      setCurrentPair({ left: '', right: '' });
    }
  };

  const removePair = (index: number) => {
    setCurrentActivity(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (currentActivity.title && currentActivity.pairs.length >= 2) {
      if (editingIndex !== null) {
        setMatchingActivities(prev => 
          prev.map((activity, index) => 
            index === editingIndex ? currentActivity : activity
          )
        );
        setEditingIndex(null);
      } else {
        setMatchingActivities(prev => [...prev, currentActivity]);
      }
      
      setCurrentActivity({
        title: '',
        instructions: '',
        pairs: []
      });
      
      toast({
        title: "Activity Added",
        description: "Matching activity has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Activity",
        description: "Please provide a title and at least 2 matching pairs.",
        variant: "destructive"
      });
    }
  };

  const editActivity = (index: number) => {
    setCurrentActivity(matchingActivities[index]);
    setEditingIndex(index);
  };

  const removeActivity = (index: number) => {
    setMatchingActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (matchingActivities.length === 0) {
      toast({
        title: "No Activities",
        description: "Please create at least one matching activity before saving.",
        variant: "destructive"
      });
      return;
    }

    const builderData = {
      type: 'matching',
      activities: matchingActivities,
      metadata: {
        totalActivities: matchingActivities.length,
        totalPairs: matchingActivities.reduce((sum, activity) => sum + activity.pairs.length, 0)
      }
    };

    onSave(builderData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Drag & Drop Matching Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Activity Builder */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity-title">Activity Title</Label>
              <Input
                id="activity-title"
                value={currentActivity.title}
                onChange={(e) => setCurrentActivity(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter activity title..."
              />
            </div>

            <div>
              <Label htmlFor="activity-instructions">Instructions</Label>
              <Input
                id="activity-instructions"
                value={currentActivity.instructions}
                onChange={(e) => setCurrentActivity(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Enter instructions for students..."
              />
            </div>

            {/* Pair Creation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="left-item">Left Item</Label>
                <Input
                  id="left-item"
                  value={currentPair.left}
                  onChange={(e) => setCurrentPair(prev => ({ ...prev, left: e.target.value }))}
                  placeholder="Enter left item..."
                />
              </div>
              <div>
                <Label htmlFor="right-item">Right Item (Match)</Label>
                <Input
                  id="right-item"
                  value={currentPair.right}
                  onChange={(e) => setCurrentPair(prev => ({ ...prev, right: e.target.value }))}
                  placeholder="Enter matching item..."
                />
              </div>
            </div>

            <Button onClick={addPair} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Matching Pair
            </Button>

            {/* Current Pairs Display */}
            {currentActivity.pairs.length > 0 && (
              <div className="space-y-2">
                <Label>Current Pairs ({currentActivity.pairs.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {currentActivity.pairs.map((pair, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 font-medium">{pair.left}</div>
                        <div className="text-gray-400">↔</div>
                        <div className="flex-1 font-medium">{pair.right}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePair(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={generateMatchingContent} 
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
              
              <Button onClick={addActivity} className="flex-1">
                {editingIndex !== null ? 'Update Activity' : 'Add Activity'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Created Activities */}
      {matchingActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Activities ({matchingActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchingActivities.map((activity, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{activity.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{activity.instructions}</p>
                      <Badge variant="secondary" className="mt-2">
                        {activity.pairs.length} pairs
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editActivity(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeActivity(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Save Matching Activities
        </Button>
      </div>
    </div>
  );
}