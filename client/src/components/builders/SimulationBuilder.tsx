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
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingSteps: builtSteps
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.steps && data.steps.length > 0) {
          setCurrentStep(data.steps[0]);
          toast({
            title: "AI Content Generated",
            description: "Simulation step has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate simulation content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
          {/* Interactive Simulation Builder */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Play className="h-5 w-5" />
                Interactive Simulation Builder
              </CardTitle>
              <CardDescription className="text-orange-700">
                Build your interactive simulation one step at a time. Add as many steps as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Simulation Topic Context</span>
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
                    AI will generate simulation steps specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-semibold">
                    {builtSteps.length}
                  </div>
                  <span className="text-sm font-medium">Steps Built</span>
                </div>
                {builtSteps.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Steps Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Step Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Step {builtSteps.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleStep}
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
                  <Label className="text-sm font-medium">Step Title</Label>
                  <Input
                    value={currentStep.title}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter step title..."
                    className="mt-1"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <Label className="text-sm font-medium">Step Description</Label>
                  <Textarea
                    value={currentStep.description}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what happens in this step..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Action Input */}
                <div>
                  <Label className="text-sm font-medium">User Action</Label>
                  <Input
                    value={currentStep.action}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="What action should the user take..."
                    className="mt-1"
                  />
                </div>

                {/* Outcome Input */}
                <div>
                  <Label className="text-sm font-medium">Expected Outcome</Label>
                  <Textarea
                    value={currentStep.outcome}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, outcome: e.target.value }))}
                    placeholder="What should happen as a result..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Feedback Input */}
                <div>
                  <Label className="text-sm font-medium">Feedback</Label>
                  <Textarea
                    value={currentStep.feedback}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Feedback or explanation for this step..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Add Step Button */}
                <Button
                  onClick={addStepToBuilder}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!currentStep.title.trim() || !currentStep.description.trim() || !currentStep.action.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step to Simulation
                </Button>
              </div>

              {/* Built Steps List */}
              {builtSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Simulation Steps ({builtSteps.length})</h4>
                  {builtSteps.map((step, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">Step {index + 1}: {step.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {step.description.substring(0, 100)}...
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            <strong>Action:</strong> {step.action}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStepFromBuilder(index)}
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
              <div className="flex justify-between pt-4 border-t border-orange-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep({ title: '', description: '', action: '', outcome: '', feedback: '' });
                    setBuiltSteps([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtSteps.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Finish Simulation & Continue
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