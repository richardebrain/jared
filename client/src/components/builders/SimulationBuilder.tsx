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
  Play
} from 'lucide-react';

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
  const [builtSteps, setBuiltSteps] = useState<Array<{ title: string; description: string; action: string; outcome: string; feedback: string }>>([]);
  const [currentStep, setCurrentStep] = useState({ title: '', description: '', action: '', outcome: '', feedback: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.steps) {
      setBuiltSteps(initialData.steps);
    }
  }, [initialData]);

  const generateSingleStep = async () => {
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

  const addStepToBuilder = () => {
    if (!currentStep.title.trim() || !currentStep.description.trim() || !currentStep.action.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, description, and action fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltSteps([...builtSteps, { ...currentStep }]);
    setCurrentStep({ title: '', description: '', action: '', outcome: '', feedback: '' });
    
    toast({
      title: "Step Added",
      description: "Simulation step has been added to the builder.",
    });
  };

  const removeStepFromBuilder = (index: number) => {
    setBuiltSteps(builtSteps.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtSteps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one simulation step before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ steps: builtSteps });
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