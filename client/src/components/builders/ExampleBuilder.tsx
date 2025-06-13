import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Clock,
  BookOpen
} from 'lucide-react';

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
  const [builtExamples, setBuiltExamples] = useState<Array<{ title: string; description: string; type: 'good' | 'poor'; explanation: string }>>([]);
  const [currentExample, setCurrentExample] = useState({ title: '', description: '', type: 'good' as 'good' | 'poor', explanation: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.examples) {
      setBuiltExamples(initialData.examples);
    }
  }, [initialData]);

  const generateSingleExample = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingExamples: builtExamples
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.examples && data.examples.length > 0) {
          setCurrentExample(data.examples[0]);
          toast({
            title: "AI Content Generated",
            description: "Example has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate example content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addExampleToBuilder = () => {
    if (!currentExample.title.trim() || !currentExample.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltExamples([...builtExamples, { ...currentExample }]);
    setCurrentExample({ title: '', description: '', type: 'good', explanation: '' });
    
    toast({
      title: "Example Added",
      description: "Example has been added to the builder.",
    });
  };

  const removeExampleFromBuilder = (index: number) => {
    setBuiltExamples(builtExamples.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtExamples.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one example before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ examples: builtExamples });
  };

  return (
    <div className="space-y-6">
      {/* Module Context Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <div className="flex-1">
              <CardTitle className="text-lg text-blue-900">
                {moduleTitle || 'Professional Development Module'}
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                <strong>Topic:</strong> {moduleDescription || 'Building effective teaching strategies'}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {category}
                </Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  {difficulty} level
                </Badge>
                <span className="text-blue-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {estimatedTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Section: {sectionTitle}</CardTitle>
          <CardDescription>
            AI will use the module topic above to generate relevant content for this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Example Builder */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <BookOpen className="h-5 w-5" />
                Interactive Example Builder
              </CardTitle>
              <CardDescription className="text-green-700">
                Build your examples one at a time. Add both good and poor practice examples.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Example Topic Context</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-blue-700">
                    <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Learning Objective:</strong> {moduleDescription || 'Building effective teaching strategies'}
                  </div>
                  <div className="text-blue-700">
                    <strong>Section:</strong> {sectionTitle}
                  </div>
                  <div className="text-blue-600 text-xs mt-2">
                    AI will generate examples specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                    {builtExamples.length}
                  </div>
                  <span className="text-sm font-medium">Examples Built</span>
                </div>
                {builtExamples.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Examples Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Example Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Example {builtExamples.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleExample}
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

                {/* Example Type */}
                <div>
                  <Label className="text-sm font-medium">Example Type</Label>
                  <Select value={currentExample.type} onValueChange={(value: 'good' | 'poor') => setCurrentExample(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select example type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good Practice</SelectItem>
                      <SelectItem value="poor">Poor Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Input */}
                <div>
                  <Label className="text-sm font-medium">Example Title</Label>
                  <Input
                    value={currentExample.title}
                    onChange={(e) => setCurrentExample(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter example title..."
                    className="mt-1"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <Label className="text-sm font-medium">Example Description</Label>
                  <Textarea
                    value={currentExample.description}
                    onChange={(e) => setCurrentExample(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the example scenario..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Explanation */}
                <div>
                  <Label className="text-sm font-medium">Explanation (Optional)</Label>
                  <Textarea
                    value={currentExample.explanation}
                    onChange={(e) => setCurrentExample(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain why this is a good or poor practice..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Add Example Button */}
                <Button
                  onClick={addExampleToBuilder}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!currentExample.title.trim() || !currentExample.description.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Example to Activity
                </Button>
              </div>

              {/* Built Examples List */}
              {builtExamples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Examples ({builtExamples.length})</h4>
                  {builtExamples.map((example, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm">{example.title}</div>
                            <Badge variant={example.type === 'good' ? 'default' : 'destructive'}>
                              {example.type === 'good' ? 'Good Practice' : 'Poor Practice'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            {example.description}
                          </div>
                          {example.explanation && (
                            <div className="text-xs text-blue-600 mt-1">
                              <strong>Explanation:</strong> {example.explanation}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExampleFromBuilder(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exit Builder */}
              <div className="flex justify-between pt-4 border-t border-green-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentExample({ title: '', description: '', type: 'good', explanation: '' });
                    setBuiltExamples([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtExamples.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Finish Activity & Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}