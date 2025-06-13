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
  Eye,
  CheckCircle2,
  XCircle,
  Lightbulb
} from 'lucide-react';

interface Example {
  title: string;
  description: string;
  scenario: string;
  goodExample: {
    content: string;
    explanation: string;
  };
  badExample: {
    content: string;
    explanation: string;
  };
  keyTakeaways: string[];
  category: 'behavior-management' | 'communication' | 'safety' | 'curriculum' | 'assessment' | 'general';
}

interface ExampleData {
  title: string;
  instructions: string;
  examples: Example[];
  showComparisons: boolean;
  interactiveMode: boolean;
}

interface ExampleBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: ExampleData) => void;
  onCancel: () => void;
  initialData?: ExampleData;
}

export default function ExampleBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: ExampleBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<ExampleData>(initialData || {
    title: `${sectionTitle} - Examples & Case Studies`,
    instructions: 'Review these examples to understand best practices and common mistakes.',
    examples: [],
    showComparisons: true,
    interactiveMode: false
  });

  const [currentExample, setCurrentExample] = useState<Example>({
    title: '',
    description: '',
    scenario: '',
    goodExample: { content: '', explanation: '' },
    badExample: { content: '', explanation: '' },
    keyTakeaways: [''],
    category: 'general'
  });

  const generateAIExamples = async () => {
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
      const response = await apiRequest('/api/ai/generate-examples', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          exampleType: 'comparative',
          includeScenarios: true,
          count: 4,
          targetAudience: 'early-childhood-educators'
        }
      });

      if (response.examples && response.examples.length > 0) {
        setData(prev => ({
          ...prev,
          examples: [...prev.examples, ...response.examples]
        }));
        
        toast({
          title: "Examples Generated",
          description: `Added ${response.examples.length} new examples with comparisons.`,
        });
      }
    } catch (error) {
      console.error('Error generating examples:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate examples. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addExample = () => {
    if (!currentExample.title.trim() || !currentExample.scenario.trim()) {
      toast({
        title: "Incomplete Example",
        description: "Please add at least a title and scenario.",
        variant: "destructive",
      });
      return;
    }

    if (!currentExample.goodExample.content.trim()) {
      toast({
        title: "Missing Good Example",
        description: "Please provide a good example with explanation.",
        variant: "destructive",
      });
      return;
    }

    const validTakeaways = currentExample.keyTakeaways.filter(t => t.trim());
    
    setData(prev => ({
      ...prev,
      examples: [...prev.examples, { ...currentExample, keyTakeaways: validTakeaways }]
    }));

    setCurrentExample({
      title: '',
      description: '',
      scenario: '',
      goodExample: { content: '', explanation: '' },
      badExample: { content: '', explanation: '' },
      keyTakeaways: [''],
      category: 'general'
    });

    toast({
      title: "Example Added",
      description: `Collection now has ${data.examples.length + 1} examples.`,
    });
  };

  const removeExample = (index: number) => {
    setData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addTakeaway = () => {
    setCurrentExample(prev => ({
      ...prev,
      keyTakeaways: [...prev.keyTakeaways, '']
    }));
  };

  const updateTakeaway = (index: number, value: string) => {
    setCurrentExample(prev => ({
      ...prev,
      keyTakeaways: prev.keyTakeaways.map((takeaway, i) => 
        i === index ? value : takeaway
      )
    }));
  };

  const removeTakeaway = (index: number) => {
    setCurrentExample(prev => ({
      ...prev,
      keyTakeaways: prev.keyTakeaways.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (data.examples.length === 0) {
      toast({
        title: "No Examples",
        description: "Please add at least one example.",
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
            <Lightbulb className="h-5 w-5" />
            Examples & Case Studies Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Collection Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title for examples collection"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showComparisons"
                  checked={data.showComparisons}
                  onChange={(e) => setData(prev => ({ ...prev, showComparisons: e.target.checked }))}
                />
                <Label htmlFor="showComparisons">Show good vs bad comparisons</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should use these examples"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAIExamples}
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

      {/* Manual Example Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Example
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exampleTitle">Example Title</Label>
              <Input
                id="exampleTitle"
                value={currentExample.title}
                onChange={(e) => setCurrentExample(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter example title"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentExample.category}
                onValueChange={(value) => setCurrentExample(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavior-management">Behavior Management</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="scenario">Scenario Context</Label>
            <Textarea
              id="scenario"
              value={currentExample.scenario}
              onChange={(e) => setCurrentExample(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="Describe the situation or context for this example"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Good Example
              </Label>
              <Textarea
                value={currentExample.goodExample.content}
                onChange={(e) => setCurrentExample(prev => ({ 
                  ...prev, 
                  goodExample: { ...prev.goodExample, content: e.target.value }
                }))}
                placeholder="Describe the effective approach"
                rows={3}
              />
              <Textarea
                value={currentExample.goodExample.explanation}
                onChange={(e) => setCurrentExample(prev => ({ 
                  ...prev, 
                  goodExample: { ...prev.goodExample, explanation: e.target.value }
                }))}
                placeholder="Explain why this approach works well"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Poor Example (Optional)
              </Label>
              <Textarea
                value={currentExample.badExample.content}
                onChange={(e) => setCurrentExample(prev => ({ 
                  ...prev, 
                  badExample: { ...prev.badExample, content: e.target.value }
                }))}
                placeholder="Describe the ineffective approach"
                rows={3}
              />
              <Textarea
                value={currentExample.badExample.explanation}
                onChange={(e) => setCurrentExample(prev => ({ 
                  ...prev, 
                  badExample: { ...prev.badExample, explanation: e.target.value }
                }))}
                placeholder="Explain why this approach doesn't work"
                rows={2}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Key Takeaways</Label>
              <Button variant="outline" size="sm" onClick={addTakeaway}>
                <Plus className="h-4 w-4 mr-1" />
                Add Takeaway
              </Button>
            </div>
            {currentExample.keyTakeaways.map((takeaway, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={takeaway}
                  onChange={(e) => updateTakeaway(index, e.target.value)}
                  placeholder={`Key takeaway ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTakeaway(index)}
                  disabled={currentExample.keyTakeaways.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={addExample} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Example
          </Button>
        </CardContent>
      </Card>

      {/* Current Examples List */}
      {data.examples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Examples ({data.examples.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.examples.map((example, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="outline">{example.category}</Badge>
                      <h4 className="font-medium mt-1">{example.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExample(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{example.scenario}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-green-600">
                      <strong>Good:</strong> {example.goodExample.content.substring(0, 100)}...
                    </div>
                    {example.badExample.content && (
                      <div className="text-red-600">
                        <strong>Poor:</strong> {example.badExample.content.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  {example.keyTakeaways.length > 0 && (
                    <div className="mt-2 text-sm">
                      <strong>Takeaways:</strong> {example.keyTakeaways.join(', ')}
                    </div>
                  )}
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
          Save Examples Collection
        </Button>
      </div>
    </div>
  );
}