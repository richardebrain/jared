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
  Stethoscope
} from 'lucide-react';

interface TriageBuilderProps {
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

export default function TriageBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: TriageBuilderProps) {
  const { toast } = useToast();
  const [builtCases, setBuiltCases] = useState<Array<{ title: string; symptoms: string; priority: string; action: string; explanation: string }>>([]);
  const [currentCase, setCurrentCase] = useState({ title: '', symptoms: '', priority: '', action: '', explanation: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData?.cases) {
      setBuiltCases(initialData.cases);
    }
  }, [initialData]);

  const generateSingleCase = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          moduleDescription,
          sectionTitle,
          count: 1,
          existingCases: builtCases
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cases && data.cases.length > 0) {
          setCurrentCase(data.cases[0]);
          toast({
            title: "AI Content Generated",
            description: "Triage case has been generated successfully.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate triage content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addCaseToBuilder = () => {
    if (!currentCase.title.trim() || !currentCase.symptoms.trim() || !currentCase.priority.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, symptoms, and priority fields.",
        variant: "destructive"
      });
      return;
    }

    setBuiltCases([...builtCases, { ...currentCase }]);
    setCurrentCase({ title: '', symptoms: '', priority: '', action: '', explanation: '' });
    
    toast({
      title: "Case Added",
      description: "Triage case has been added to the builder.",
    });
  };

  const removeCaseFromBuilder = (index: number) => {
    setBuiltCases(builtCases.filter((_, i) => i !== index));
  };

  const finishAndSave = () => {
    if (builtCases.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one triage case before saving.",
        variant: "destructive"
      });
      return;
    }

    onSave({ cases: builtCases });
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
          {/* Interactive Triage Builder */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Stethoscope className="h-5 w-5" />
                Interactive Triage Builder
              </CardTitle>
              <CardDescription className="text-green-700">
                Build your triage assessment one case at a time. Add as many cases as you need.
              </CardDescription>
              
              {/* Topic Context for AI */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Triage Topic Context</span>
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
                    AI will generate triage cases specifically about this topic and section
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                    {builtCases.length}
                  </div>
                  <span className="text-sm font-medium">Cases Built</span>
                </div>
                {builtCases.length > 0 && (
                  <Button
                    size="sm"
                    onClick={finishAndSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Cases Finished - Save & Move On
                  </Button>
                )}
              </div>

              {/* Current Case Builder */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Case {builtCases.length + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateSingleCase}
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
                  <Label className="text-sm font-medium">Case Title</Label>
                  <Input
                    value={currentCase.title}
                    onChange={(e) => setCurrentCase(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter case title..."
                    className="mt-1"
                  />
                </div>

                {/* Symptoms Input */}
                <div>
                  <Label className="text-sm font-medium">Symptoms/Situation</Label>
                  <Textarea
                    value={currentCase.symptoms}
                    onChange={(e) => setCurrentCase(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Describe the symptoms or situation..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Priority Input */}
                <div>
                  <Label className="text-sm font-medium">Priority Level</Label>
                  <Input
                    value={currentCase.priority}
                    onChange={(e) => setCurrentCase(prev => ({ ...prev, priority: e.target.value }))}
                    placeholder="High/Medium/Low or Immediate/Urgent/Non-urgent"
                    className="mt-1"
                  />
                </div>

                {/* Action Input */}
                <div>
                  <Label className="text-sm font-medium">Recommended Action</Label>
                  <Textarea
                    value={currentCase.action}
                    onChange={(e) => setCurrentCase(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="What action should be taken..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Explanation Input */}
                <div>
                  <Label className="text-sm font-medium">Explanation</Label>
                  <Textarea
                    value={currentCase.explanation}
                    onChange={(e) => setCurrentCase(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Why this priority and action..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Add Case Button */}
                <Button
                  onClick={addCaseToBuilder}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!currentCase.title.trim() || !currentCase.symptoms.trim() || !currentCase.priority.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Case to Assessment
                </Button>
              </div>

              {/* Built Cases List */}
              {builtCases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Triage Cases ({builtCases.length})</h4>
                  {builtCases.map((triageCase, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{triageCase.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <strong>Priority:</strong> {triageCase.priority}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {triageCase.symptoms.substring(0, 100)}...
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCaseFromBuilder(index)}
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
                    setCurrentCase({ title: '', symptoms: '', priority: '', action: '', explanation: '' });
                    setBuiltCases([]);
                    onCancel();
                  }}
                >
                  Cancel Builder
                </Button>
                
                {builtCases.length > 0 && (
                  <Button
                    onClick={finishAndSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Finish Assessment & Continue
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