import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit3, Save, Move, ArrowRight } from 'lucide-react';

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface MatchingSectionBuilderProps {
  content: any;
  onContentChange: (content: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function MatchingSectionBuilder({ content, onContentChange, isEditing, onEditToggle }: MatchingSectionBuilderProps) {
  const [pairs, setPairs] = useState<MatchingPair[]>([]);
  const [instructions, setInstructions] = useState('Match each item on the left with its corresponding item on the right.');

  useEffect(() => {
    if (content?.blocks?.[0]?.content) {
      try {
        const aiContent = content.blocks[0].content;
        const parsedPairs = parseAIContentToPairs(aiContent);
        setPairs(parsedPairs);
        
        // Extract instructions if present
        if (aiContent.toLowerCase().includes('match') || aiContent.toLowerCase().includes('connect')) {
          const instructionMatch = aiContent.match(/^([^:]+):/);
          if (instructionMatch) {
            setInstructions(instructionMatch[1].trim());
          }
        }
      } catch (error) {
        console.error('Error parsing matching content:', error);
        setPairs([createEmptyPair()]);
      }
    } else {
      setPairs([createEmptyPair()]);
    }
  }, [content]);

  const parseAIContentToPairs = (aiContent: string): MatchingPair[] => {
    const pairs: MatchingPair[] = [];
    const lines = aiContent.split('\n').filter(line => line.trim());
    
    let currentPairIndex = 0;
    
    lines.forEach(line => {
      // Look for various matching patterns
      const dashMatch = line.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      const colonMatch = line.match(/^(.+?)\s*:\s*(.+)$/);
      const arrowMatch = line.match(/^(.+?)\s*[→->]\s*(.+)$/);
      const numberedMatch = line.match(/^\d+\.\s*(.+?)\s*[-–—:→->]\s*(.+)$/);
      
      let leftItem = '';
      let rightItem = '';
      
      if (dashMatch) {
        leftItem = dashMatch[1].trim();
        rightItem = dashMatch[2].trim();
      } else if (colonMatch) {
        leftItem = colonMatch[1].trim();
        rightItem = colonMatch[2].trim();
      } else if (arrowMatch) {
        leftItem = arrowMatch[1].trim();
        rightItem = arrowMatch[2].trim();
      } else if (numberedMatch) {
        leftItem = numberedMatch[1].trim();
        rightItem = numberedMatch[2].trim();
      } else if (line.includes('=')) {
        const equalMatch = line.split('=');
        if (equalMatch.length === 2) {
          leftItem = equalMatch[0].trim();
          rightItem = equalMatch[1].trim();
        }
      }
      
      if (leftItem && rightItem) {
        pairs.push({
          id: `pair-${currentPairIndex + 1}`,
          left: leftItem,
          right: rightItem
        });
        currentPairIndex++;
      }
    });
    
    return pairs.length > 0 ? pairs : [createEmptyPair()];
  };

  const createEmptyPair = (): MatchingPair => ({
    id: `pair-${Date.now()}`,
    left: '',
    right: ''
  });

  const addPair = () => {
    setPairs(prev => [...prev, createEmptyPair()]);
  };

  const removePair = (pairId: string) => {
    setPairs(prev => prev.filter(p => p.id !== pairId));
  };

  const updatePair = (pairId: string, field: 'left' | 'right', value: string) => {
    setPairs(prev => prev.map(p => 
      p.id === pairId ? { ...p, [field]: value } : p
    ));
  };

  const saveChanges = () => {
    const updatedContent = {
      blocks: [{
        type: 'matching',
        title: 'Matching Activity',
        content: JSON.stringify({ pairs, instructions }),
        preview: `${pairs.length} matching pairs ready`,
        pairs: pairs,
        instructions: instructions
      }]
    };
    onContentChange(updatedContent);
    onEditToggle();
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Matching Activity</Badge>
            <span className="text-sm text-gray-600">{pairs.length} pairs</span>
          </div>
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            <Edit3 className="h-4 w-4 mr-1" />
            Edit Activity
          </Button>
        </div>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Move className="h-5 w-5 text-purple-600" />
              Drag and Drop Matching
            </CardTitle>
            <p className="text-sm text-gray-600">{instructions}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Items to Match</h4>
                {pairs.map((pair, index) => (
                  <div key={`left-${pair.id}`} className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pair.left}</span>
                      <Move className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Right Column */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Match With</h4>
                {pairs.map((pair, index) => (
                  <div key={`right-${pair.id}`} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{pair.right}</span>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <ArrowRight className="h-3 w-3" />
                        Correct Match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
              <strong>Activity Preview:</strong> Students will drag items from the left column to match with the correct items on the right. This creates an interactive learning experience for concept reinforcement.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matching Activity Builder</h3>
          <p className="text-sm text-gray-600">Create drag-and-drop matching pairs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditToggle}>Cancel</Button>
          <Button onClick={saveChanges}>
            <Save className="h-4 w-4 mr-1" />
            Save Activity
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="instructions">Instructions for Students</Label>
          <Input
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter instructions for the matching activity..."
            className="mt-1"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="font-medium">Matching Pairs</h4>
        {pairs.map((pair, pairIndex) => (
          <Card key={pair.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pair {pairIndex + 1}</CardTitle>
                {pairs.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePair(pair.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`left-${pair.id}`}>Left Item (to be matched)</Label>
                  <Input
                    id={`left-${pair.id}`}
                    value={pair.left}
                    onChange={(e) => updatePair(pair.id, 'left', e.target.value)}
                    placeholder="Enter item to match..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`right-${pair.id}`}>Right Item (correct match)</Label>
                  <Input
                    id={`right-${pair.id}`}
                    value={pair.right}
                    onChange={(e) => updatePair(pair.id, 'right', e.target.value)}
                    placeholder="Enter matching item..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-2">
                <ArrowRight className="h-3 w-3" />
                Students will drag "{pair.left || 'Left Item'}" to match with "{pair.right || 'Right Item'}"
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={addPair} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Matching Pair
      </Button>
    </div>
  );
}