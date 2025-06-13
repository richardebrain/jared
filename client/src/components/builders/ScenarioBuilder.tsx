import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Clock,
  TreePine
} from 'lucide-react';

interface ScenarioBuilderProps {
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

export default function ScenarioBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: ScenarioBuilderProps) {
  const { toast } = useToast();
  const [builtScenarios, setBuiltScenarios] = useState<Array<{ title: string; context: string; options: Array<{ text: string; outcome: string }> }>>([]);
  const [currentScenario, setCurrentScenario] = useState({ title: '', context: '', options: [{ text: '', outcome: '' }, { text: '', outcome: '' }] });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.scenarios) {
      setBuiltScenarios(initialData.scenarios);
    }
  }, [initialData]);

  const generateSingleScenario = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingScenarios: builtScenarios
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scenarios && data.scenarios.length > 0) {
          setCurrentScenario(data.scenarios[0]);
          toast({
            title: "AI Content Generated",
            description: "Scenario has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate scenario content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addOptionToScenario = () => {
    setCurrentScenario(prev => ({
      ...prev,
      options: [...prev.options, { text: '', outcome: '' }]
    }));
  };

  const removeOptionFromScenario = (index: number) => {
    if (currentScenario.options.length > 2) {
      setCurrentScenario(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, field: 'text' | 'outcome', value: string) => {
    setCurrentScenario(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addScenarioToBuilder = () => {
    if (!currentScenario.title.trim() || !currentScenario.context.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and context fields.",
        variant: "destructive"
      });
      return;
    }

    const validOptions = currentScenario.options.filter(option => option.text.trim() && option.outcome.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please provide at least 2 complete options.",
        variant: "destructive"
      });
      return;
    }

    setBuiltScenarios([...builtScenarios, { ...currentScenario, options: validOptions }]);
    setCurrentScenario({ title: '', context: '', options: [{ text: '', outcome: '' }, { text: '', outcome: '' }] });
    
    toast({
      title: "Scenario Added",
      description: "Scenario has been added to the builder.",
    });
  };

  const removeScenarioFromBuilder = (index: number) => {
    setBuiltScenarios(builtScenarios.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtScenarios.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one scenario before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ scenarios: builtScenarios });
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
          {/* Interactive Scenario Builder */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <TreePine className="h-5 w-5" />
                Interactive Scenario Builder
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Build your decision scenarios one at a time. Add as many scenarios as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Scenario Topic Context</span>
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
                    AI will generate decision scenarios specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-semibold">
                    {builtScenarios.length}
                  </div>
                  <span className="text-sm font-medium">Scenarios Built</span>
                </div>
                {builtScenarios.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Scenarios Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Scenario Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Scenario {builtScenarios.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleScenario}
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

                {/* Title Input */}
                <div>
                  <Label className="text-sm font-medium">Scenario Title</Label>
                  <Input
                    value={currentScenario.title}
                    onChange={(e) => setCurrentScenario(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter scenario title..."
                    className="mt-1"
                  />
                </div>

                {/* Context Input */}
                <div>
                  <Label className="text-sm font-medium">Scenario Context</Label>
                  <Textarea
                    value={currentScenario.context}
                    onChange={(e) => setCurrentScenario(prev => ({ ...prev, context: e.target.value }))}
                    placeholder="Describe the scenario situation..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Decision Options</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addOptionToScenario}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  {currentScenario.options.map((option, index) => (
                    <div key={index} className="border rounded p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Option {index + 1}</span>
                        {currentScenario.options.length > 2 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOptionFromScenario(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder="Decision option text..."
                        />
                        <Input
                          value={option.outcome}
                          onChange={(e) => updateOption(index, 'outcome', e.target.value)}
                          placeholder="What happens with this choice..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Scenario Button */}
                <Button
                  onClick={addScenarioToBuilder}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                  disabled={!currentScenario.title.trim() || !currentScenario.context.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scenario to Activity
                </Button>
              </div>

              {/* Built Scenarios List */}
              {builtScenarios.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Decision Scenarios ({builtScenarios.length})</h4>
                  {builtScenarios.map((scenario, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{scenario.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {scenario.context}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            <strong>Options:</strong> {scenario.options.length}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeScenarioFromBuilder(index)}
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
              <div className="flex justify-between pt-4 border-t border-yellow-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentScenario({ title: '', context: '', options: [{ text: '', outcome: '' }, { text: '', outcome: '' }] });
                    setBuiltScenarios([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtScenarios.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-yellow-600 hover:bg-yellow-700"
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