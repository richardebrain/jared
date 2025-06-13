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
  Play,
  ArrowRight,
  Clock,
  Target,
  Gamepad2
} from 'lucide-react';

interface SimulationStep {
  id: string;
  title: string;
  description: string;
  userAction: string;
  expectedOutcome: string;
  feedback: {
    correct: string;
    incorrect: string;
    hint?: string;
  };
  consequences: string[];
  nextSteps: string[];
}

interface SimulationData {
  title: string;
  instructions: string;
  scenario: string;
  learningObjectives: string[];
  steps: SimulationStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  allowReplay: boolean;
  showProgressIndicator: boolean;
  branchingPaths: boolean;
  realTimeDecisions: boolean;
}

interface SimulationBuilderProps {
  moduleTitle: string;
  moduleDescription: string;
  sectionTitle: string;
  onSave: (data: SimulationData) => void;
  onCancel: () => void;
  initialData?: SimulationData;
}

export default function SimulationBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData
}: SimulationBuilderProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [data, setData] = useState<SimulationData>(initialData || {
    title: `${sectionTitle} - Interactive Simulation`,
    instructions: 'Navigate through this realistic scenario and make decisions that reflect best practices in early childhood education.',
    scenario: '',
    learningObjectives: [''],
    steps: [],
    difficulty: 'intermediate',
    estimatedTime: 15,
    allowReplay: true,
    showProgressIndicator: true,
    branchingPaths: false,
    realTimeDecisions: false
  });

  const [currentStep, setCurrentStep] = useState<SimulationStep>({
    id: '',
    title: '',
    description: '',
    userAction: '',
    expectedOutcome: '',
    feedback: {
      correct: '',
      incorrect: '',
      hint: ''
    },
    consequences: [''],
    nextSteps: ['']
  });

  const generateAISimulation = async () => {
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
      const response = await apiRequest('/api/ai/generate-simulation', {
        method: 'POST',
        data: {
          moduleTitle,
          moduleDescription,
          sectionTitle,
          difficulty: data.difficulty,
          stepCount: 8,
          includeBranching: data.branchingPaths,
          realTimeDecisions: data.realTimeDecisions,
          targetAudience: 'early-childhood-educators',
          simulationType: 'scenario-based'
        }
      });

      if (response.scenario) {
        setData(prev => ({ ...prev, scenario: response.scenario }));
      }

      if (response.learningObjectives && response.learningObjectives.length > 0) {
        setData(prev => ({ ...prev, learningObjectives: response.learningObjectives }));
      }

      if (response.steps && response.steps.length > 0) {
        setData(prev => ({
          ...prev,
          steps: [...prev.steps, ...response.steps]
        }));
        
        toast({
          title: "Simulation Generated",
          description: `Created interactive simulation with ${response.steps.length} decision points.`,
        });
      }
    } catch (error) {
      console.error('Error generating simulation:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate simulation. Please create manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addObjective = () => {
    setData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.map((obj, i) => 
        i === index ? value : obj
      )
    }));
  };

  const removeObjective = (index: number) => {
    setData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const addConsequence = () => {
    setCurrentStep(prev => ({
      ...prev,
      consequences: [...prev.consequences, '']
    }));
  };

  const updateConsequence = (index: number, value: string) => {
    setCurrentStep(prev => ({
      ...prev,
      consequences: prev.consequences.map((cons, i) => 
        i === index ? value : cons
      )
    }));
  };

  const removeConsequence = (index: number) => {
    setCurrentStep(prev => ({
      ...prev,
      consequences: prev.consequences.filter((_, i) => i !== index)
    }));
  };

  const addNextStep = () => {
    setCurrentStep(prev => ({
      ...prev,
      nextSteps: [...prev.nextSteps, '']
    }));
  };

  const updateNextStep = (index: number, value: string) => {
    setCurrentStep(prev => ({
      ...prev,
      nextSteps: prev.nextSteps.map((step, i) => 
        i === index ? value : step
      )
    }));
  };

  const removeNextStep = (index: number) => {
    setCurrentStep(prev => ({
      ...prev,
      nextSteps: prev.nextSteps.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    if (!currentStep.title.trim() || !currentStep.description.trim()) {
      toast({
        title: "Incomplete Step",
        description: "Please add both title and description for the simulation step.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStep.userAction.trim() || !currentStep.expectedOutcome.trim()) {
      toast({
        title: "Missing Action Details",
        description: "Please specify the user action and expected outcome.",
        variant: "destructive",
      });
      return;
    }

    const newStep = {
      ...currentStep,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      consequences: currentStep.consequences.filter(c => c.trim()),
      nextSteps: currentStep.nextSteps.filter(s => s.trim())
    };

    setData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    setCurrentStep({
      id: '',
      title: '',
      description: '',
      userAction: '',
      expectedOutcome: '',
      feedback: {
        correct: '',
        incorrect: '',
        hint: ''
      },
      consequences: [''],
      nextSteps: ['']
    });

    toast({
      title: "Step Added",
      description: `Simulation now has ${data.steps.length + 1} decision points.`,
    });
  };

  const removeStep = (index: number) => {
    setData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.steps.length) return;

    setData(prev => {
      const newSteps = [...prev.steps];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return { ...prev, steps: newSteps };
    });
  };

  const handleSave = () => {
    if (data.steps.length < 3) {
      toast({
        title: "Need More Steps",
        description: "Please add at least 3 decision points for an effective simulation.",
        variant: "destructive",
      });
      return;
    }

    if (!data.scenario.trim()) {
      toast({
        title: "Missing Scenario",
        description: "Please provide a scenario description for the simulation.",
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
            <Gamepad2 className="h-5 w-5" />
            Interactive Simulation Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Simulation Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter simulation title"
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={data.difficulty}
                onValueChange={(value) => setData(prev => ({ ...prev, difficulty: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
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
              placeholder="Explain how learners should approach this simulation"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="scenario">Scenario Context</Label>
            <Textarea
              id="scenario"
              value={data.scenario}
              onChange={(e) => setData(prev => ({ ...prev, scenario: e.target.value }))}
              placeholder="Describe the overall scenario and setting for this simulation"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={data.estimatedTime}
                onChange={(e) => setData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 15 }))}
                placeholder="15"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowReplay"
                checked={data.allowReplay}
                onChange={(e) => setData(prev => ({ ...prev, allowReplay: e.target.checked }))}
              />
              <Label htmlFor="allowReplay">Allow replay</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="branchingPaths"
                checked={data.branchingPaths}
                onChange={(e) => setData(prev => ({ ...prev, branchingPaths: e.target.checked }))}
              />
              <Label htmlFor="branchingPaths">Branching paths</Label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Learning Objectives</Label>
              <Button variant="outline" size="sm" onClick={addObjective}>
                <Plus className="h-4 w-4 mr-1" />
                Add Objective
              </Button>
            </div>
            {data.learningObjectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder={`Learning objective ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(index)}
                  disabled={data.learningObjectives.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateAISimulation}
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

      {/* Manual Step Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Simulation Step
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stepTitle">Step Title</Label>
              <Input
                id="stepTitle"
                value={currentStep.title}
                onChange={(e) => setCurrentStep(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter step title"
              />
            </div>
            <div>
              <Label htmlFor="userAction">Required User Action</Label>
              <Input
                id="userAction"
                value={currentStep.userAction}
                onChange={(e) => setCurrentStep(prev => ({ ...prev, userAction: e.target.value }))}
                placeholder="What should the user do?"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="stepDescription">Step Description</Label>
            <Textarea
              id="stepDescription"
              value={currentStep.description}
              onChange={(e) => setCurrentStep(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what happens in this step of the simulation"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="expectedOutcome">Expected Outcome</Label>
            <Textarea
              id="expectedOutcome"
              value={currentStep.expectedOutcome}
              onChange={(e) => setCurrentStep(prev => ({ ...prev, expectedOutcome: e.target.value }))}
              placeholder="What should happen if the user makes the correct decision?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="correctFeedback">Correct Feedback</Label>
              <Textarea
                id="correctFeedback"
                value={currentStep.feedback.correct}
                onChange={(e) => setCurrentStep(prev => ({ 
                  ...prev, 
                  feedback: { ...prev.feedback, correct: e.target.value }
                }))}
                placeholder="Feedback for correct actions"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="incorrectFeedback">Incorrect Feedback</Label>
              <Textarea
                id="incorrectFeedback"
                value={currentStep.feedback.incorrect}
                onChange={(e) => setCurrentStep(prev => ({ 
                  ...prev, 
                  feedback: { ...prev.feedback, incorrect: e.target.value }
                }))}
                placeholder="Feedback for incorrect actions"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hint">Hint (Optional)</Label>
            <Input
              id="hint"
              value={currentStep.feedback.hint || ''}
              onChange={(e) => setCurrentStep(prev => ({ 
                ...prev, 
                feedback: { ...prev.feedback, hint: e.target.value }
              }))}
              placeholder="Provide a helpful hint"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label>Consequences</Label>
              <Button variant="outline" size="sm" onClick={addConsequence}>
                <Plus className="h-4 w-4 mr-1" />
                Add Consequence
              </Button>
            </div>
            {currentStep.consequences.map((consequence, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={consequence}
                  onChange={(e) => updateConsequence(index, e.target.value)}
                  placeholder={`Consequence ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeConsequence(index)}
                  disabled={currentStep.consequences.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {data.branchingPaths && (
            <div>
              <div className="flex justify-between items-center">
                <Label>Next Steps (Branching)</Label>
                <Button variant="outline" size="sm" onClick={addNextStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Next Step
                </Button>
              </div>
              {currentStep.nextSteps.map((nextStep, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={nextStep}
                    onChange={(e) => updateNextStep(index, e.target.value)}
                    placeholder={`Next step option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNextStep(index)}
                    disabled={currentStep.nextSteps.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addStep} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Simulation Step
          </Button>
        </CardContent>
      </Card>

      {/* Current Steps List */}
      {data.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Simulation Steps ({data.steps.length}) - Est. {data.estimatedTime} min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.steps.map((step, index) => (
                <div key={step.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step {index + 1}</Badge>
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === data.steps.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div><strong>Action:</strong> {step.userAction}</div>
                    <div><strong>Description:</strong> {step.description.substring(0, 100)}...</div>
                    <div><strong>Expected:</strong> {step.expectedOutcome.substring(0, 100)}...</div>
                    {step.consequences.length > 0 && (
                      <div><strong>Consequences:</strong> {step.consequences.length} defined</div>
                    )}
                  </div>

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
          Save Interactive Simulation
        </Button>
      </div>
    </div>
  );
}