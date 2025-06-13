import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Lightbulb,
  FileText,
  Clock
} from 'lucide-react';

interface Reflection {
  title: string;
  type: 'personal' | 'guided' | 'peer' | 'video-journal';
  prompts: string[];
  guidelines: string[];
  duration: number;
  objectives: string[];
  followUpActions: string[];
  sharingInstructions: string;
}

interface ReflectionBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reflections: Reflection[]) => void;
  moduleTitle?: string;
  sectionTitle?: string;
  learningObjective?: string;
}

export default function ReflectionBuilder({
  isOpen,
  onClose,
  onSave,
  moduleTitle = '',
  sectionTitle = '',
  learningObjective = ''
}: ReflectionBuilderProps) {
  const { toast } = useToast();
  
  const [currentReflection, setCurrentReflection] = useState<Reflection>({
    title: '',
    type: 'personal',
    prompts: [''],
    guidelines: [''],
    duration: 10,
    objectives: [''],
    followUpActions: [''],
    sharingInstructions: ''
  });

  const [builtReflections, setBuiltReflections] = useState<Reflection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateReflectionField = (field: keyof Reflection, value: any) => {
    setCurrentReflection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateArrayField = (field: 'prompts' | 'guidelines' | 'objectives' | 'followUpActions', index: number, value: string) => {
    setCurrentReflection(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'prompts' | 'guidelines' | 'objectives' | 'followUpActions') => {
    setCurrentReflection(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'prompts' | 'guidelines' | 'objectives' | 'followUpActions', index: number) => {
    setCurrentReflection(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addReflectionToList = () => {
    if (!currentReflection.title.trim()) {
      toast({
        title: "Incomplete Reflection",
        description: "Please provide a title for the reflection activity.",
        variant: "destructive",
      });
      return;
    }

    const validPrompts = currentReflection.prompts.filter(p => p.trim());
    if (validPrompts.length < 1) {
      toast({
        title: "No Prompts",
        description: "Please add at least one reflection prompt.",
        variant: "destructive",
      });
      return;
    }

    const newReflection = {
      ...currentReflection,
      prompts: validPrompts,
      guidelines: currentReflection.guidelines.filter(g => g.trim()),
      objectives: currentReflection.objectives.filter(o => o.trim()),
      followUpActions: currentReflection.followUpActions.filter(a => a.trim())
    };

    setBuiltReflections(prev => [...prev, newReflection]);
    
    // Reset current reflection
    setCurrentReflection({
      title: '',
      type: 'personal',
      prompts: [''],
      guidelines: [''],
      duration: 10,
      objectives: [''],
      followUpActions: [''],
      sharingInstructions: ''
    });

    toast({
      title: "Reflection Added",
      description: `Reflection builder now has ${builtReflections.length + 1} reflections`,
    });
  };

  const removeReflectionFromList = (index: number) => {
    setBuiltReflections(prev => prev.filter((_, i) => i !== index));
  };

  const generateAIReflection = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          sectionTitle,
          learningObjective,
          reflectionType: currentReflection.type,
          context: 'early childhood education'
        })
      });

      if (response.ok) {
        const generatedReflection = await response.json();
        setCurrentReflection(prev => ({
          ...prev,
          title: generatedReflection.title || prev.title,
          prompts: generatedReflection.prompts || prev.prompts,
          guidelines: generatedReflection.guidelines || prev.guidelines,
          objectives: generatedReflection.objectives || prev.objectives,
          followUpActions: generatedReflection.followUpActions || prev.followUpActions,
          sharingInstructions: generatedReflection.sharingInstructions || prev.sharingInstructions
        }));

        toast({
          title: "AI Reflection Generated",
          description: "Review and customize the generated reflection activity",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI reflection. Please create manually.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const finishAndSave = () => {
    if (builtReflections.length === 0) {
      toast({
        title: "No Reflections",
        description: "Please add at least one reflection activity.",
        variant: "destructive",
      });
      return;
    }

    onSave(builtReflections);
    onClose();
    
    toast({
      title: "Reflections Created Successfully",
      description: `Created ${builtReflections.length} reflection activities`,
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Brain className="h-5 w-5" />
          Reflection Builder
        </CardTitle>
        <CardDescription className="text-purple-700">
          Create meaningful reflection activities to help educators process learning and plan future actions.
        </CardDescription>
        
        {/* Context Information */}
        <div className="mt-3 p-3 bg-white border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Reflection Context</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-purple-700">
              <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
            </div>
            <div className="text-purple-700">
              <strong>Section:</strong> {sectionTitle || 'Current Section'}
            </div>
            <div className="text-purple-700">
              <strong>Learning Objective:</strong> {learningObjective || 'Building effective teaching strategies'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Reflection Progress */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
              {builtReflections.length}
            </div>
            <span className="text-sm font-medium">Reflections Built</span>
          </div>
          {builtReflections.length > 0 && (
            <Button
              size="sm"
              onClick={finishAndSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Finish & Save Reflections
            </Button>
          )}
        </div>

        {/* Current Reflection Builder */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Reflection {builtReflections.length + 1}</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateAIReflection}
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

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Reflection Title</Label>
              <Input
                value={currentReflection.title}
                onChange={(e) => updateReflectionField('title', e.target.value)}
                placeholder="Enter reflection title..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Reflection Type</Label>
              <Select 
                value={currentReflection.type} 
                onValueChange={(value) => updateReflectionField('type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Reflection</SelectItem>
                  <SelectItem value="guided">Guided Reflection</SelectItem>
                  <SelectItem value="peer">Peer Reflection</SelectItem>
                  <SelectItem value="video-journal">Video Journal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration (minutes)
            </Label>
            <Select 
              value={currentReflection.duration.toString()} 
              onValueChange={(value) => updateReflectionField('duration', parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reflection Prompts */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Reflection Prompts
            </Label>
            <div className="space-y-2 mt-1">
              {currentReflection.prompts.map((prompt, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={prompt}
                    onChange={(e) => updateArrayField('prompts', index, e.target.value)}
                    placeholder={`Reflection prompt ${index + 1} (e.g., "How did this strategy change your approach to classroom management?")`}
                    rows={2}
                  />
                  {currentReflection.prompts.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeArrayItem('prompts', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => addArrayItem('prompts')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Prompt
              </Button>
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reflection Guidelines (Optional)
            </Label>
            <div className="space-y-2 mt-1">
              {currentReflection.guidelines.map((guideline, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={guideline}
                    onChange={(e) => updateArrayField('guidelines', index, e.target.value)}
                    placeholder={`Guideline ${index + 1} (e.g., "Be specific with examples")`}
                  />
                  {currentReflection.guidelines.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeArrayItem('guidelines', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => addArrayItem('guidelines')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Guideline
              </Button>
            </div>
          </div>

          {/* Sharing Instructions */}
          {(currentReflection.type === 'peer' || currentReflection.type === 'guided') && (
            <div>
              <Label className="text-sm font-medium">Sharing Instructions</Label>
              <Textarea
                value={currentReflection.sharingInstructions}
                onChange={(e) => updateReflectionField('sharingInstructions', e.target.value)}
                placeholder="How should participants share their reflections? (e.g., small groups, partners, full group discussion)"
                className="mt-1"
                rows={2}
              />
            </div>
          )}

          {/* Add Reflection Button */}
          <Button
            onClick={addReflectionToList}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!currentReflection.title.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reflection to List
          </Button>
        </div>

        {/* Built Reflections List */}
        {builtReflections.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Built Reflections ({builtReflections.length})</h4>
            {builtReflections.map((reflection, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{reflection.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Type: {reflection.type} | Duration: {reflection.duration} min | Prompts: {reflection.prompts.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {reflection.prompts[0]?.substring(0, 100)}...
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeReflectionFromList(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-purple-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel Reflection Builder
          </Button>
          
          {builtReflections.length > 0 && (
            <Button
              onClick={finishAndSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Save Reflections & Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}