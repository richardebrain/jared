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
  Users,
  MessageSquare,
  FileText
} from 'lucide-react';

interface ScenarioOption {
  text: string;
  feedback: string;
  isCorrect: boolean;
  consequence?: string;
}

interface Scenario {
  title: string;
  context: string;
  situation: string;
  challenge: string;
  options: ScenarioOption[];
  learningObjective: string;
  category: 'classroom-management' | 'communication' | 'safety' | 'curriculum' | 'assessment' | 'ethics' | 'general';
}

interface ScenarioData {
  title: string;
  instructions: string;
  scenarios: Scenario[];
  allowMultipleAttempts: boolean;
  showImmediateFeedback: boolean;
  branchingEnabled: boolean;
}

interface ScenarioBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: ScenarioData) => void;
  onCancel: () => void;
  initialData?: ScenarioData;
}

export default function ScenarioBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: ScenarioBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<ScenarioData>(initialData || {
    title: `${sectionTitle} - Scenario-Based Learning`,
    instructions: 'Read each scenario carefully and choose the best response. Consider the consequences of your actions.',
    scenarios: [],
    allowMultipleAttempts: true,
    showImmediateFeedback: true,
    branchingEnabled: false
  });

  const [currentScenario, setCurrentScenario] = useState<Scenario>({
    title: '',
    context: '',
    situation: '',
    challenge: '',
    options: [
      { text: '', feedback: '', isCorrect: false },
      { text: '', feedback: '', isCorrect: false },
      { text: '', feedback: '', isCorrect: false }
    ],
    learningObjective: '',
    category: 'general'
  });

  const generateAIScenarios = async () => {
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
      const response = await apiRequest('/api/ai/generate-scenarios', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          scenarioCount: 4,
          includeContext: true,
          branchingEnabled: data.branchingEnabled,
          targetAudience: 'early-childhood-educators',
          complexity: 'intermediate'
        }
      });

      if (response.scenarios && response.scenarios.length > 0) {
        setData(prev => ({
          ...prev,
          scenarios: [...prev.scenarios, ...response.scenarios]
        }));
        
        toast({
          title: "Scenarios Generated",
          description: `Added ${response.scenarios.length} new learning scenarios.`,
        });
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate scenarios. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addOption = () => {
    setCurrentScenario(prev => ({
      ...prev,
      options: [...prev.options, { text: '', feedback: '', isCorrect: false }]
    }));
  };

  const updateOption = (index: number, field: keyof ScenarioOption, value: string | boolean) => {
    setCurrentScenario(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeOption = (index: number) => {
    if (currentScenario.options.length > 2) {
      setCurrentScenario(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const addScenario = () => {
    if (!currentScenario.title.trim() || !currentScenario.situation.trim()) {
      toast({
        title: "Incomplete Scenario",
        description: "Please add at least a title and situation description.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = currentScenario.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Need More Options",
        description: "Please add at least 2 response options.",
        variant: "destructive",
      });
      return;
    }

    const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      toast({
        title: "No Correct Answer",
        description: "Please mark at least one option as correct.",
        variant: "destructive",
      });
      return;
    }

    setData(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, { ...currentScenario, options: validOptions }]
    }));

    setCurrentScenario({
      title: '',
      context: '',
      situation: '',
      challenge: '',
      options: [
        { text: '', feedback: '', isCorrect: false },
        { text: '', feedback: '', isCorrect: false },
        { text: '', feedback: '', isCorrect: false }
      ],
      learningObjective: '',
      category: 'general'
    });

    toast({
      title: "Scenario Added",
      description: `Collection now has ${data.scenarios.length + 1} scenarios.`,
    });
  };

  const removeScenario = (index: number) => {
    setData(prev => ({
      ...prev,
      scenarios: prev.scenarios.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (data.scenarios.length === 0) {
      toast({
        title: "No Scenarios",
        description: "Please add at least one scenario.",
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
            <Users className="h-5 w-5" />
            Scenario-Based Learning Builder
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
                placeholder="Enter title for scenario collection"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowMultipleAttempts"
                  checked={data.allowMultipleAttempts}
                  onChange={(e) => setData(prev => ({ ...prev, allowMultipleAttempts: e.target.checked }))}
                />
                <Label htmlFor="allowMultipleAttempts">Multiple attempts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showImmediateFeedback"
                  checked={data.showImmediateFeedback}
                  onChange={(e) => setData(prev => ({ ...prev, showImmediateFeedback: e.target.checked }))}
                />
                <Label htmlFor="showImmediateFeedback">Immediate feedback</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should approach these scenarios"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAIScenarios}
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

      {/* Manual Scenario Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scenarioTitle">Scenario Title</Label>
              <Input
                id="scenarioTitle"
                value={currentScenario.title}
                onChange={(e) => setCurrentScenario(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter scenario title"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={currentScenario.category}
                onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classroom-management">Classroom Management</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="ethics">Ethics</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={currentScenario.context}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, context: e.target.value }))}
              placeholder="Provide background information or setting"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="situation">Situation Description</Label>
            <Textarea
              id="situation"
              value={currentScenario.situation}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, situation: e.target.value }))}
              placeholder="Describe what is happening in this scenario"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="challenge">Challenge/Decision Point</Label>
            <Textarea
              id="challenge"
              value={currentScenario.challenge}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, challenge: e.target.value }))}
              placeholder="What decision does the learner need to make?"
              rows={2}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Response Options</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            {currentScenario.options.map((option, index) => (
              <div key={index} className="border rounded p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                    />
                    <Label className="text-sm">Correct response</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={currentScenario.options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  placeholder={`Response option ${index + 1}`}
                  rows={2}
                />
                <Textarea
                  value={option.feedback}
                  onChange={(e) => updateOption(index, 'feedback', e.target.value)}
                  placeholder="Feedback for this choice"
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="learningObjective">Learning Objective</Label>
            <Textarea
              id="learningObjective"
              value={currentScenario.learningObjective}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, learningObjective: e.target.value }))}
              placeholder="What should learners gain from this scenario?"
              rows={2}
            />
          </div>

          <Button onClick={addScenario} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Scenario
          </Button>
        </CardContent>
      </Card>

      {/* Current Scenarios List */}
      {data.scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Scenarios ({data.scenarios.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.scenarios.map((scenario, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="outline">{scenario.category}</Badge>
                      <h4 className="font-medium mt-1">{scenario.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScenario(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scenario.situation.substring(0, 150)}...</p>
                  <div className="text-sm">
                    <strong>Options:</strong> {scenario.options.length} ({scenario.options.filter(o => o.isCorrect).length} correct)
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
          Save Scenario Collection
        </Button>
      </div>
    </div>
  );
}