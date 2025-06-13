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
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface Example {
  title: string;
  scenario: string;
  explanation: string;
  keyPoints: string[];
}

interface ExampleBuilderProps {
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

export default function ExampleBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: ExampleBuilderProps) {
  const { toast } = useToast();
  const [examples, setExamples] = useState<Example[]>([]);
  const [currentExample, setCurrentExample] = useState<Example>({
    title: '',
    scenario: '',
    explanation: '',
    keyPoints: []
  });
  const [currentKeyPoint, setCurrentKeyPoint] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.examples) {
      setExamples(initialData.examples);
    }
  }, [initialData]);

  const generateExamples = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate examples.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-examples', {
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
      
      setCurrentExample({
        title: data.title || `${moduleTitle} - Example`,
        scenario: data.scenario || '',
        explanation: data.explanation || '',
        keyPoints: data.keyPoints || []
      });

      toast({
        title: "Example Generated!",
        description: "AI has created a practical example for your topic."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate example content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addKeyPoint = () => {
    if (currentKeyPoint.trim()) {
      setCurrentExample(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, currentKeyPoint.trim()]
      }));
      setCurrentKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setCurrentExample(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };

  const addExample = () => {
    if (currentExample.title && currentExample.scenario && currentExample.explanation) {
      if (editingIndex !== null) {
        setExamples(prev => 
          prev.map((example, index) => 
            index === editingIndex ? currentExample : example
          )
        );
        setEditingIndex(null);
      } else {
        setExamples(prev => [...prev, currentExample]);
      }
      
      setCurrentExample({
        title: '',
        scenario: '',
        explanation: '',
        keyPoints: []
      });
      
      toast({
        title: "Example Added",
        description: "Example has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Example",
        description: "Please provide a title, scenario, and explanation.",
        variant: "destructive"
      });
    }
  };

  const editExample = (index: number) => {
    setCurrentExample(examples[index]);
    setEditingIndex(index);
  };

  const removeExample = (index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (examples.length === 0) {
      toast({
        title: "No Examples",
        description: "Please create at least one example before saving.",
        variant: "destructive"
      });
      return;
    }

    const builderData = {
      type: 'example',
      examples: examples,
      metadata: {
        totalExamples: examples.length,
        totalKeyPoints: examples.reduce((sum, example) => sum + example.keyPoints.length, 0),
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
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Topic-Focused Example Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Example Builder */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="example-title">Example Title</Label>
              <Input
                id="example-title"
                value={currentExample.title}
                onChange={(e) => setCurrentExample(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter example title..."
              />
            </div>

            <div>
              <Label htmlFor="example-scenario">Scenario Description</Label>
              <Textarea
                id="example-scenario"
                value={currentExample.scenario}
                onChange={(e) => setCurrentExample(prev => ({ ...prev, scenario: e.target.value }))}
                placeholder="Describe a realistic scenario related to the topic..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="example-explanation">Explanation & Analysis</Label>
              <Textarea
                id="example-explanation"
                value={currentExample.explanation}
                onChange={(e) => setCurrentExample(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain how this example demonstrates the key concepts..."
                rows={4}
              />
            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <Label>Key Learning Points</Label>
              <div className="flex gap-2">
                <Input
                  value={currentKeyPoint}
                  onChange={(e) => setCurrentKeyPoint(e.target.value)}
                  placeholder="Add a key learning point..."
                  onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                />
                <Button onClick={addKeyPoint} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {currentExample.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {currentExample.keyPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {point}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeKeyPoint(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={generateExamples} 
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
              
              <Button onClick={addExample} className="flex-1">
                {editingIndex !== null ? 'Update Example' : 'Add Example'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Created Examples */}
      {examples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Created Examples ({examples.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{example.title}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {example.keyPoints.length} key points
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editExample(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Scenario:</h5>
                      <p className="text-sm text-gray-600">{example.scenario}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Explanation:</h5>
                      <p className="text-sm text-gray-600">{example.explanation}</p>
                    </div>

                    {example.keyPoints.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-gray-700 mb-1">Key Points:</h5>
                        <div className="flex flex-wrap gap-1">
                          {example.keyPoints.map((point, pointIndex) => (
                            <Badge key={pointIndex} variant="outline" className="text-xs">
                              {point}
                            </Badge>
                          ))}
                        </div>
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
          Save Examples
        </Button>
      </div>
    </div>
  );
}