import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  Brain,
  BookMarked
} from 'lucide-react';

interface MnemonicItem {
  term: string;
  definition: string;
  mnemonic: string;
  explanation: string;
  memoryTip: string;
}

interface MnemonicBuilderProps {
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

export default function MnemonicBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: MnemonicBuilderProps) {
  const { toast } = useToast();
  const [mnemonicSets, setMnemonicSets] = useState<Array<{
    title: string;
    description: string;
    items: MnemonicItem[];
  }>>([]);
  const [currentSet, setCurrentSet] = useState({
    title: '',
    description: '',
    items: [] as MnemonicItem[]
  });
  const [currentItem, setCurrentItem] = useState<MnemonicItem>({
    term: '',
    definition: '',
    mnemonic: '',
    explanation: '',
    memoryTip: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.sets) {
      setMnemonicSets(initialData.sets);
    }
  }, [initialData]);

  const generateMnemonics = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate mnemonics.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-mnemonics', {
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
      
      setCurrentSet({
        title: data.title || `${moduleTitle} - Key Terms`,
        description: data.description || 'Important terminology and concepts',
        items: data.items || []
      });

      toast({
        title: "Mnemonics Generated!",
        description: "AI has created memory aids for key terms."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate mnemonic content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addItem = () => {
    if (currentItem.term && currentItem.definition) {
      if (editingItemIndex !== null) {
        setCurrentSet(prev => ({
          ...prev,
          items: prev.items.map((item, index) => 
            index === editingItemIndex ? currentItem : item
          )
        }));
        setEditingItemIndex(null);
      } else {
        setCurrentSet(prev => ({
          ...prev,
          items: [...prev.items, currentItem]
        }));
      }
      
      setCurrentItem({
        term: '',
        definition: '',
        mnemonic: '',
        explanation: '',
        memoryTip: ''
      });
      
      toast({
        title: "Term Added",
        description: "Mnemonic item has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Item",
        description: "Please provide at least a term and definition.",
        variant: "destructive"
      });
    }
  };

  const editItem = (index: number) => {
    setCurrentItem(currentSet.items[index]);
    setEditingItemIndex(index);
  };

  const removeItem = (index: number) => {
    setCurrentSet(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addSet = () => {
    if (currentSet.title && currentSet.items.length > 0) {
      if (editingSetIndex !== null) {
        setMnemonicSets(prev => 
          prev.map((set, index) => 
            index === editingSetIndex ? currentSet : set
          )
        );
        setEditingSetIndex(null);
      } else {
        setMnemonicSets(prev => [...prev, currentSet]);
      }
      
      setCurrentSet({
        title: '',
        description: '',
        items: []
      });
      
      toast({
        title: "Set Added",
        description: "Mnemonic set has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Set",
        description: "Please provide a title and at least one term.",
        variant: "destructive"
      });
    }
  };

  const editSet = (index: number) => {
    setCurrentSet(mnemonicSets[index]);
    setEditingSetIndex(index);
  };

  const removeSet = (index: number) => {
    setMnemonicSets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (mnemonicSets.length === 0) {
      toast({
        title: "No Sets",
        description: "Please create at least one mnemonic set before saving.",
        variant: "destructive"
      });
      return;
    }

    const builderData = {
      type: 'mnemonic',
      sets: mnemonicSets,
      metadata: {
        totalSets: mnemonicSets.length,
        totalTerms: mnemonicSets.reduce((sum, set) => sum + set.items.length, 0),
        topic: moduleTitle
      }
    };

    onSave(builderData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Mnemonic & Key Terms Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Set Builder */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="set-title">Set Title</Label>
                <Input
                  id="set-title"
                  value={currentSet.title}
                  onChange={(e) => setCurrentSet(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter set title..."
                />
              </div>
              <div>
                <Label htmlFor="set-description">Description</Label>
                <Input
                  id="set-description"
                  value={currentSet.description}
                  onChange={(e) => setCurrentSet(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this set..."
                />
              </div>
            </div>

            {/* Current Item Builder */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Add Term</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    value={currentItem.term}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, term: e.target.value }))}
                    placeholder="Enter key term..."
                  />
                </div>
                <div>
                  <Label htmlFor="definition">Definition</Label>
                  <Textarea
                    id="definition"
                    value={currentItem.definition}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, definition: e.target.value }))}
                    placeholder="Define the term..."
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mnemonic">Mnemonic Device</Label>
                <Input
                  id="mnemonic"
                  value={currentItem.mnemonic}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, mnemonic: e.target.value }))}
                  placeholder="Memory aid or acronym..."
                />
              </div>

              <div>
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={currentItem.explanation}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="How the mnemonic helps remember the term..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="memory-tip">Memory Tip</Label>
                <Input
                  id="memory-tip"
                  value={currentItem.memoryTip}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, memoryTip: e.target.value }))}
                  placeholder="Additional memory strategy..."
                />
              </div>

              <Button onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {editingItemIndex !== null ? 'Update Term' : 'Add Term'}
              </Button>
            </div>

            {/* Current Items Display */}
            {currentSet.items.length > 0 && (
              <div className="space-y-2">
                <Label>Current Terms ({currentSet.items.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentSet.items.map((item, index) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{item.term}</div>
                          <div className="text-xs text-gray-600 mt-1">{item.definition}</div>
                          {item.mnemonic && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {item.mnemonic}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editItem(index)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={generateMnemonics} 
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
              
              <Button onClick={addSet} className="flex-1">
                {editingSetIndex !== null ? 'Update Set' : 'Add Set'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Created Sets */}
      {mnemonicSets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              Created Sets ({mnemonicSets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mnemonicSets.map((set, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{set.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        {set.items.length} terms
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editSet(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSet(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {set.items.slice(0, 4).map((item, itemIndex) => (
                      <div key={itemIndex} className="text-xs p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.term}:</span> {item.definition.substring(0, 50)}...
                      </div>
                    ))}
                    {set.items.length > 4 && (
                      <div className="text-xs p-2 bg-gray-100 rounded text-center">
                        +{set.items.length - 4} more terms
                      </div>
                    )}
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
          Save Mnemonic Sets
        </Button>
      </div>
    </div>
  );
}