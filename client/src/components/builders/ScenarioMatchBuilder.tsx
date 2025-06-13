import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Loader2, 
  Save,
  ArrowRight,
  Target,
  FileText
} from 'lucide-react';

interface ScenarioMatch {
  scenario: string;
  correctResponse: string;
  distractors: string[];
  explanation?: string;
}

interface ScenarioMatchData {
  title: string;
  instructions: string;
  scenarios: ScenarioMatch[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: number;
}

interface ScenarioMatchBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: ScenarioMatchData) => void;
  onCancel: () => void;
  initialData?: ScenarioMatchData;
}

export default function ScenarioMatchBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: ScenarioMatchBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<ScenarioMatchData>(initialData || {
    title: `${sectionTitle} - Scenario Matching`,
    instructions: 'Match each scenario with the most appropriate response.',
    scenarios: [],
    difficulty: 'intermediate'
  });

  const [currentScenario, setCurrentScenario] = useState<ScenarioMatch>({
    scenario: '',
    correctResponse: '',
    distractors: ['', '', ''],
    explanation: ''
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
      const response = await apiRequest('/api/ai/generate-scenario-match', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          difficulty: data.difficulty,
          existingScenarios: data.scenarios.map(s => s.scenario),
          count: 5
        }
      });

      if (response.scenarios && response.scenarios.length > 0) {
        setData(prev => ({
          ...prev,
          scenarios: [...prev.scenarios, ...response.scenarios]
        }));
        
        toast({
          title: "Scenarios Generated",
          description: `Added ${response.scenarios.length} new scenario matches.`,
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

  const addScenario = () => {
    if (!currentScenario.scenario.trim() || !currentScenario.correctResponse.trim()) {
      toast({
        title: "Incomplete Scenario",
        description: "Please add both scenario and correct response.",
        variant: "destructive",
      });
      return;
    }

    const validDistractors = currentScenario.distractors.filter(d => d.trim());
    if (validDistractors.length < 2) {
      toast({
        title: "Need More Options",
        description: "Please add at least 2 distractor responses.",
        variant: "destructive",
      });
      return;
    }

    setData(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, { ...currentScenario, distractors: validDistractors }]
    }));

    setCurrentScenario({
      scenario: '',
      correctResponse: '',
      distractors: ['', '', ''],
      explanation: ''
    });

    toast({
      title: "Scenario Added",
      description: `Activity now has ${data.scenarios.length + 1} scenarios.`,
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
        description: "Please add at least one scenario match.",
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
            <Target className="h-5 w-5" />
            Scenario Matching Builder
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
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <select
                id="difficulty"
                className="w-full p-2 border rounded"
                value={data.difficulty}
                onChange={(e) => setData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions}
              onChange={(e) => setData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Explain how learners should complete this activity"
              rows={3}
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
            Add Scenario Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="scenario">Scenario Description</Label>
            <Textarea
              id="scenario"
              value={currentScenario.scenario}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="Describe the scenario that learners need to respond to"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="correctResponse">Correct Response</Label>
            <Textarea
              id="correctResponse"
              value={currentScenario.correctResponse}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, correctResponse: e.target.value }))}
              placeholder="Enter the best response to this scenario"
              rows={2}
            />
          </div>

          <div>
            <Label>Distractor Responses (Incorrect Options)</Label>
            {currentScenario.distractors.map((distractor, index) => (
              <Input
                key={index}
                value={distractor}
                onChange={(e) => {
                  const newDistractors = [...currentScenario.distractors];
                  newDistractors[index] = e.target.value;
                  setCurrentScenario(prev => ({ ...prev, distractors: newDistractors }));
                }}
                placeholder={`Distractor option ${index + 1}`}
                className="mt-2"
              />
            ))}
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={currentScenario.explanation}
              onChange={(e) => setCurrentScenario(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explain why this is the correct response"
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
                    <Badge variant="outline">Scenario {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScenario(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm mb-2"><strong>Scenario:</strong> {scenario.scenario}</p>
                  <p className="text-sm text-green-600 mb-2"><strong>Correct:</strong> {scenario.correctResponse}</p>
                  <div className="text-sm text-gray-600">
                    <strong>Distractors:</strong> {scenario.distractors.join(', ')}
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
          Save Scenario Matching Activity
        </Button>
      </div>
    </div>
  );
}