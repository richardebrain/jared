import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Loader2, 
  Save,
  ArrowRight,
  GripVertical,
  Link
} from 'lucide-react';

interface MatchingPair {
  left: string;
  right: string;
  explanation?: string;
}

interface MatchingData {
  title: string;
  instructions: string;
  pairs: MatchingPair[];
  matchingType: 'drag-drop' | 'click-connect' | 'multiple-choice';
  leftColumnTitle: string;
  rightColumnTitle: string;
  shuffleItems: boolean;
  showExplanations: boolean;
}

interface MatchingBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: MatchingData) => void;
  onCancel: () => void;
  initialData?: MatchingData;
}

export default function MatchingBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: MatchingBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<MatchingData>(initialData || {
    title: `${sectionTitle} - Matching Activity`,
    instructions: 'Match each item in the left column with its corresponding item in the right column.',
    pairs: [],
    matchingType: 'drag-drop',
    leftColumnTitle: 'Terms',
    rightColumnTitle: 'Definitions',
    shuffleItems: true,
    showExplanations: true
  });

  const [currentPair, setCurrentPair] = useState<MatchingPair>({
    left: '',
    right: '',
    explanation: ''
  });

  const generateAIMatching = async () => {
    if (!moduleTitle || !moduleDescription) {
      toast({
        title: "Missing Information",
        description: "Module title and description are required for AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/ai/generate-matching', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          pairCount: 8,
          matchingType: data.matchingType,
          includeExplanations: data.showExplanations,
          leftColumnType: data.leftColumnTitle.toLowerCase(),
          rightColumnType: data.rightColumnTitle.toLowerCase()
        }
      });

      if (response.pairs && response.pairs.length > 0) {
        setData(prev => ({
          ...prev,
          pairs: [...prev.pairs, ...response.pairs]
        }));
        
        toast({
          title: "Matching Pairs Generated",
          description: `Added ${response.pairs.length} new matching pairs.`,
        });
      }
    } catch (error) {
      console.error('Error generating matching pairs:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate matching pairs. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addPair = () => {
    if (!currentPair.left.trim() || !currentPair.right.trim()) {
      toast({
        title: "Incomplete Pair",
        description: "Please add both left and right items.",
        variant: "destructive",
      });
      return;
    }

    setData(prev => ({
      ...prev,
      pairs: [...prev.pairs, { ...currentPair }]
    }));

    setCurrentPair({
      left: '',
      right: '',
      explanation: ''
    });

    toast({
      title: "Pair Added",
      description: `Activity now has ${data.pairs.length + 1} matching pairs.`,
    });
  };

  const removePair = (index: number) => {
    setData(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, i) => i !== index)
    }));
  };

  const updatePair = (index: number, field: keyof MatchingPair, value: string) => {
    setData(prev => ({
      ...prev,
      pairs: prev.pairs.map((pair, i) => 
        i === index ? { ...pair, [field]: value } : pair
      )
    }));
  };

  const movePair = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.pairs.length) return;

    setData(prev => {
      const newPairs = [...prev.pairs];
      [newPairs[index], newPairs[newIndex]] = [newPairs[newIndex], newPairs[index]];
      return { ...prev, pairs: newPairs };
    });
  };

  const handleSave = () => {
    if (data.pairs.length < 3) {
      toast({
        title: "Need More Pairs",
        description: "Please add at least 3 matching pairs.",
        variant: "destructive",
      });
      return;
    }

    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Matching Activity Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Activity Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter activity title"
              />
            </div>
            <div>
              <Label htmlFor="matchingType">Interaction Type</Label>
              <Select
                value={data.matchingType}
                onValueChange={(value) => setData(prev => ({ ...prev, matchingType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drag-drop">Drag & Drop</SelectItem>
                  <SelectItem value="click-connect">Click to Connect</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should complete this matching activity"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leftTitle">Left Column Title</Label>
              <Input
                id="leftTitle"
                value={data.leftColumnTitle}
                onChange={(e) => setData(prev => ({ ...prev, leftColumnTitle: e.target.value }))}
                placeholder="e.g., Terms, Concepts"
              />
            </div>
            <div>
              <Label htmlFor="rightTitle">Right Column Title</Label>
              <Input
                id="rightTitle"
                value={data.rightColumnTitle}
                onChange={(e) => setData(prev => ({ ...prev, rightColumnTitle: e.target.value }))}
                placeholder="e.g., Definitions, Examples"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shuffleItems"
                checked={data.shuffleItems}
                onChange={(e) => setData(prev => ({ ...prev, shuffleItems: e.target.checked }))}
              />
              <Label htmlFor="shuffleItems">Shuffle items</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showExplanations"
                checked={data.showExplanations}
                onChange={(e) => setData(prev => ({ ...prev, showExplanations: e.target.checked }))}
              />
              <Label htmlFor="showExplanations">Show explanations</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAIMatching}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Pair Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Matching Pair
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="leftItem">{data.leftColumnTitle}</Label>
              <Textarea
                id="leftItem"
                value={currentPair.left}
                onChange={(e) => setCurrentPair(prev => ({ ...prev, left: e.target.value }))}
                placeholder={`Enter ${data.leftColumnTitle.toLowerCase()}`}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="rightItem">{data.rightColumnTitle}</Label>
              <Textarea
                id="rightItem"
                value={currentPair.right}
                onChange={(e) => setCurrentPair(prev => ({ ...prev, right: e.target.value }))}
                placeholder={`Enter ${data.rightColumnTitle.toLowerCase()}`}
                rows={2}
              />
            </div>
          </div>

          {data.showExplanations && (
            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={currentPair.explanation}
                onChange={(e) => setCurrentPair(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why these items match"
                rows={2}
              />
            </div>
          )}

          <Button onClick={addPair} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Matching Pair
          </Button>
        </CardContent>
      </Card>

      {/* Current Pairs List */}
      {data.pairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Pairs ({data.pairs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pairs.map((pair, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline">Pair {index + 1}</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePair(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePair(index, 'down')}
                        disabled={index === data.pairs.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePair(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{data.leftColumnTitle}</Label>
                      <Textarea
                        value={pair.left}
                        onChange={(e) => updatePair(index, 'left', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{data.rightColumnTitle}</Label>
                      <Textarea
                        value={pair.right}
                        onChange={(e) => updatePair(index, 'right', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {data.showExplanations && (
                    <div className="mt-3">
                      <Label className="text-sm font-medium">Explanation</Label>
                      <Textarea
                        value={pair.explanation || ''}
                        onChange={(e) => updatePair(index, 'explanation', e.target.value)}
                        placeholder="Explain why these items match"
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center mt-3 text-gray-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Matching Activity
        </Button>
      </div>
    </div>
  );
}