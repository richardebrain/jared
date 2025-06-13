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
  Zap,
  Settings,
  CheckCircle
} from 'lucide-react';

interface SimulationStep {
  title: string;
  scenario: string;
  challenge: string;
  expectedAction: string;
  aiGuidance: string;
  feedback: string;
  successCriteria: string[];
}

interface Simulation {
  title: string;
  description: string;
  objective: string;
  steps: SimulationStep[];
  difficulty: string;
  estimatedTime: string;
}

interface SimulationBuilderProps {
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

export default function SimulationBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: SimulationBuilderProps) {
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [currentSimulation, setCurrentSimulation] = useState<Simulation>({
    title: '',
    description: '',
    objective: '',
    steps: [],
    difficulty: difficulty,
    estimatedTime: estimatedTime
  });
  const [currentStep, setCurrentStep] = useState<SimulationStep>({
    title: '',
    scenario: '',
    challenge: '',
    expectedAction: '',
    aiGuidance: '',
    feedback: '',
    successCriteria: []
  });
  const [currentCriterion, setCurrentCriterion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSimIndex, setEditingSimIndex] = useState<number | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.simulations) {
      setSimulations(initialData.simulations);
    }
  }, [initialData]);

  const generateSimulation = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate simulation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-simulation', {
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
      
      setCurrentSimulation({
        title: data.title || `${moduleTitle} - Simulation`,
        description: data.description || '',
        objective: data.objective || '',
        steps: data.steps || [],
        difficulty: data.difficulty || difficulty,
        estimatedTime: data.estimatedTime || estimatedTime
      });

      toast({
        title: "Simulation Generated!",
        description: "AI has created a hands-on practice scenario."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate simulation content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addCriterion = () => {
    if (currentCriterion.trim()) {
      setCurrentStep(prev => ({
        ...prev,
        successCriteria: [...prev.successCriteria, currentCriterion.trim()]
      }));
      setCurrentCriterion('');
    }
  };

  const removeCriterion = (index: number) => {
    setCurrentStep(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    if (currentStep.title && currentStep.scenario && currentStep.challenge) {
      if (editingStepIndex !== null) {
        setCurrentSimulation(prev => ({
          ...prev,
          steps: prev.steps.map((step, index) => 
            index === editingStepIndex ? currentStep : step
          )
        }));
        setEditingStepIndex(null);
      } else {
        setCurrentSimulation(prev => ({
          ...prev,
          steps: [...prev.steps, currentStep]
        }));
      }
      
      setCurrentStep({
        title: '',
        scenario: '',
        challenge: '',
        expectedAction: '',
        aiGuidance: '',
        feedback: '',
        successCriteria: []
      });
      
      toast({
        title: "Step Added",
        description: "Simulation step has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Step",
        description: "Please provide title, scenario, and challenge.",
        variant: "destructive"
      });
    }
  };

  const editStep = (index: number) => {
    setCurrentStep(currentSimulation.steps[index]);
    setEditingStepIndex(index);
  };

  const removeStep = (index: number) => {
    setCurrentSimulation(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const addSimulation = () => {
    if (currentSimulation.title && currentSimulation.steps.length > 0) {
      if (editingSimIndex !== null) {
        setSimulations(prev => 
          prev.map((sim, index) => 
            index === editingSimIndex ? currentSimulation : sim
          )
        );
        setEditingSimIndex(null);
      } else {
        setSimulations(prev => [...prev, currentSimulation]);
      }
      
      setCurrentSimulation({
        title: '',
        description: '',
        objective: '',
        steps: [],
        difficulty: difficulty,
        estimatedTime: estimatedTime
      });
      
      toast({
        title: "Simulation Added",
        description: "Simulation has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Simulation",
        description: "Please provide a title and at least one step.",
        variant: "destructive"
      });
    }
  };

  const editSimulation = (index: number) => {
    setCurrentSimulation(simulations[index]);
    setEditingSimIndex(index);
  };

  const removeSimulation = (index: number) => {
    setSimulations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (simulations.length === 0) {
      toast({
        title: "No Simulations",
        description: "Please create at least one simulation before saving.",
        variant: "destructive"
      });
      return;
    }

    const builderData = {
      type: 'simulation',
      simulations: simulations,
      metadata: {
        totalSimulations: simulations.length,
        totalSteps: simulations.reduce((sum, sim) => sum + sim.steps.length, 0),
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
            <Zap className="h-5 w-5 text-orange-600" />
            AI-Guided Hands-On Practice Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Simulation Builder */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sim-title">Simulation Title</Label>
                <Input
                  id="sim-title"
                  value={currentSimulation.title}
                  onChange={(e) => setCurrentSimulation(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter simulation title..."
                />
              </div>
              <div>
                <Label htmlFor="sim-objective">Learning Objective</Label>
                <Input
                  id="sim-objective"
                  value={currentSimulation.objective}
                  onChange={(e) => setCurrentSimulation(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="What will learners practice?"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sim-description">Description</Label>
              <Textarea
                id="sim-description"
                value={currentSimulation.description}
                onChange={(e) => setCurrentSimulation(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the overall simulation context..."
                rows={3}
              />
            </div>

            {/* Step Builder */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Add Practice Step
              </h4>
              
              <div>
                <Label htmlFor="step-title">Step Title</Label>
                <Input
                  id="step-title"
                  value={currentStep.title}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter step title..."
                />
              </div>

              <div>
                <Label htmlFor="step-scenario">Scenario Setup</Label>
                <Textarea
                  id="step-scenario"
                  value={currentStep.scenario}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, scenario: e.target.value }))}
                  placeholder="Set up the practice scenario..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="step-challenge">Challenge/Problem</Label>
                <Textarea
                  id="step-challenge"
                  value={currentStep.challenge}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, challenge: e.target.value }))}
                  placeholder="What challenge must the learner address?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected-action">Expected Action</Label>
                  <Textarea
                    id="expected-action"
                    value={currentStep.expectedAction}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, expectedAction: e.target.value }))}
                    placeholder="What should the learner do?"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="ai-guidance">AI Guidance</Label>
                  <Textarea
                    id="ai-guidance"
                    value={currentStep.aiGuidance}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, aiGuidance: e.target.value }))}
                    placeholder="How will AI guide the learner?"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="step-feedback">Success Feedback</Label>
                <Textarea
                  id="step-feedback"
                  value={currentStep.feedback}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Feedback for successful completion..."
                  rows={2}
                />
              </div>

              {/* Success Criteria */}
              <div className="space-y-2">
                <Label>Success Criteria</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentCriterion}
                    onChange={(e) => setCurrentCriterion(e.target.value)}
                    placeholder="Add success criterion..."
                    onKeyPress={(e) => e.key === 'Enter' && addCriterion()}
                  />
                  <Button onClick={addCriterion} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentStep.successCriteria.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentStep.successCriteria.map((criterion, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {criterion}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeCriterion(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={addStep} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {editingStepIndex !== null ? 'Update Step' : 'Add Step'}
              </Button>
            </div>

            {/* Current Steps Display */}
            {currentSimulation.steps.length > 0 && (
              <div className="space-y-2">
                <Label>Simulation Steps ({currentSimulation.steps.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentSimulation.steps.map((step, index) => (
                    <div key={index} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{step.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{step.scenario.substring(0, 100)}...</div>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {step.successCriteria.length} criteria
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editStep(index)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
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
                onClick={generateSimulation} 
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
              
              <Button onClick={addSimulation} className="flex-1">
                {editingSimIndex !== null ? 'Update Simulation' : 'Add Simulation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Created Simulations */}
      {simulations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Created Simulations ({simulations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {simulations.map((simulation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{simulation.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{simulation.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {simulation.steps.length} steps
                        </Badge>
                        <Badge variant="outline">
                          {simulation.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {simulation.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editSimulation(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSimulation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Objective:</h5>
                    <p className="text-sm text-gray-600">{simulation.objective}</p>
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
          Save Simulations
        </Button>
      </div>
    </div>
  );
}