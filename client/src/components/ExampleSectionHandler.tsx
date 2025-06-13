import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Sparkles, Loader2, Plus, X, Edit2 } from 'lucide-react';

interface ExampleItem {
  scenario: string;
  practicalApplication: string;
  keyTakeaway: string;
  relevanceScore: number;
}

interface ExampleSection {
  title: string;
  content: string;
  type: 'example';
  duration: number;
  examples: ExampleItem[];
  learningObjectives: string[];
  practicalTips: string[];
}

interface ExampleSectionHandlerProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (section: ExampleSection) => void;
  initialData?: Partial<ExampleSection>;
}

export default function ExampleSectionHandler({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  initialData
}: ExampleSectionHandlerProps) {
  const { toast } = useToast();
  const [section, setSection] = useState<ExampleSection>({
    title: initialData?.title || sectionTitle || 'Examples',
    content: initialData?.content || '',
    type: 'example',
    duration: initialData?.duration || 10,
    examples: initialData?.examples || [],
    learningObjectives: initialData?.learningObjectives || [],
    practicalTips: initialData?.practicalTips || []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newTip, setNewTip] = useState('');
  const [editingExample, setEditingExample] = useState<number | null>(null);

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
          sectionTitle: sectionTitle,
          type: 'example'
        })
      });

      if (!response.ok) throw new Error('Failed to generate examples');
      
      const data = await response.json();
      
      setSection(prev => ({
        ...prev,
        content: data.content || `Real-world examples for ${moduleTitle}`,
        examples: data.examples || [],
        learningObjectives: data.learningObjectives || [],
        practicalTips: data.practicalTips || []
      }));

      toast({
        title: "Examples Generated!",
        description: "AI has created practical examples with insights."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate examples. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setSection(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setSection(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const addTip = () => {
    if (newTip.trim()) {
      setSection(prev => ({
        ...prev,
        practicalTips: [...prev.practicalTips, newTip.trim()]
      }));
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setSection(prev => ({
      ...prev,
      practicalTips: prev.practicalTips.filter((_, i) => i !== index)
    }));
  };

  const addExample = () => {
    const newExample: ExampleItem = {
      scenario: '',
      practicalApplication: '',
      keyTakeaway: '',
      relevanceScore: 5
    };

    setSection(prev => ({
      ...prev,
      examples: [...prev.examples, newExample]
    }));
    setEditingExample(section.examples.length);
  };

  const updateExample = (index: number, field: keyof ExampleItem, value: string | number) => {
    setSection(prev => ({
      ...prev,
      examples: prev.examples.map((example, i) => 
        i === index ? { ...example, [field]: value } : example
      )
    }));
  };

  const removeExample = (index: number) => {
    setSection(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
    if (editingExample === index) {
      setEditingExample(null);
    }
  };

  const handleSave = () => {
    if (!section.title || section.examples.length === 0) {
      toast({
        title: "Incomplete Section",
        description: "Please provide a title and at least one example.",
        variant: "destructive"
      });
      return;
    }

    onSave(section);
    toast({
      title: "Examples Saved",
      description: "Example section has been saved successfully."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            Real-World Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              Generate AI Examples
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={section.title}
                onChange={(e) => setSection(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter section title..."
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={section.duration}
                onChange={(e) => setSection(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                min="5"
                max="30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="content">Section Overview</Label>
            <Textarea
              id="content"
              value={section.content}
              onChange={(e) => setSection(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Provide an overview of the examples in this section..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add learning objective..."
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
              />
              <Button onClick={addObjective} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {section.learningObjectives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {section.learningObjectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {objective}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeObjective(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Practical Tips</Label>
            <div className="flex gap-2">
              <Input
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                placeholder="Add practical tip..."
                onKeyPress={(e) => e.key === 'Enter' && addTip()}
              />
              <Button onClick={addTip} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {section.practicalTips.length > 0 && (
              <div className="space-y-1">
                {section.practicalTips.map((tip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{tip}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTip(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Examples ({section.examples.length})</CardTitle>
            <Button onClick={addExample} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Example
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {section.examples.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No examples yet. Click "Add Example" or generate AI examples to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {section.examples.map((example, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  {editingExample === index ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Scenario</Label>
                        <Textarea
                          value={example.scenario}
                          onChange={(e) => updateExample(index, 'scenario', e.target.value)}
                          placeholder="Describe the real-world scenario..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Practical Application</Label>
                        <Textarea
                          value={example.practicalApplication}
                          onChange={(e) => updateExample(index, 'practicalApplication', e.target.value)}
                          placeholder="How this applies in practice..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Key Takeaway</Label>
                        <Input
                          value={example.keyTakeaway}
                          onChange={(e) => updateExample(index, 'keyTakeaway', e.target.value)}
                          placeholder="Main lesson from this example..."
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingExample(null)}
                        >
                          Done Editing
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => removeExample(index)}
                        >
                          Remove Example
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">Example {index + 1}</h4>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-sm text-gray-600">Scenario:</span>
                              <p className="text-sm mt-1">{example.scenario || 'No scenario provided'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-sm text-gray-600">Application:</span>
                              <p className="text-sm mt-1">{example.practicalApplication || 'No application provided'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-sm text-gray-600">Key Takeaway:</span>
                              <p className="text-sm mt-1">{example.keyTakeaway || 'No takeaway provided'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExample(index)}
                          >
                            <Edit2 className="h-4 w-4" />
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save Examples Section
        </Button>
      </div>
    </div>
  );
}