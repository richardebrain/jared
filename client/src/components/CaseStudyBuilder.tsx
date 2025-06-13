import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Plus, 
  X, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Target,
  Users,
  Clock
} from 'lucide-react';

interface CaseStudy {
  title: string;
  scenario: string;
  context: string;
  stakeholders: string[];
  challenges: string[];
  questions: string[];
  learningObjectives: string[];
  discussionPoints: string[];
  duration: number;
}

interface CaseStudyBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseStudies: CaseStudy[]) => void;
  moduleTitle?: string;
  sectionTitle?: string;
  learningObjective?: string;
}

export default function CaseStudyBuilder({
  isOpen,
  onClose,
  onSave,
  moduleTitle = '',
  sectionTitle = '',
  learningObjective = ''
}: CaseStudyBuilderProps) {
  const { toast } = useToast();
  
  const [currentCaseStudy, setCurrentCaseStudy] = useState<CaseStudy>({
    title: '',
    scenario: '',
    context: '',
    stakeholders: [''],
    challenges: [''],
    questions: [''],
    learningObjectives: [''],
    discussionPoints: [''],
    duration: 15
  });

  const [builtCaseStudies, setBuiltCaseStudies] = useState<CaseStudy[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateCaseStudyField = (field: keyof CaseStudy, value: any) => {
    setCurrentCaseStudy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateArrayField = (field: 'stakeholders' | 'challenges' | 'questions' | 'learningObjectives' | 'discussionPoints', index: number, value: string) => {
    setCurrentCaseStudy(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'stakeholders' | 'challenges' | 'questions' | 'learningObjectives' | 'discussionPoints') => {
    setCurrentCaseStudy(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'stakeholders' | 'challenges' | 'questions' | 'learningObjectives' | 'discussionPoints', index: number) => {
    setCurrentCaseStudy(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addCaseStudyToList = () => {
    if (!currentCaseStudy.title.trim() || !currentCaseStudy.scenario.trim()) {
      toast({
        title: "Incomplete Case Study",
        description: "Please provide both title and scenario for the case study.",
        variant: "destructive",
      });
      return;
    }

    const validQuestions = currentCaseStudy.questions.filter(q => q.trim());
    if (validQuestions.length < 1) {
      toast({
        title: "No Questions",
        description: "Please add at least one discussion question.",
        variant: "destructive",
      });
      return;
    }

    const newCaseStudy = {
      ...currentCaseStudy,
      stakeholders: currentCaseStudy.stakeholders.filter(s => s.trim()),
      challenges: currentCaseStudy.challenges.filter(c => c.trim()),
      questions: validQuestions,
      learningObjectives: currentCaseStudy.learningObjectives.filter(l => l.trim()),
      discussionPoints: currentCaseStudy.discussionPoints.filter(d => d.trim())
    };

    setBuiltCaseStudies(prev => [...prev, newCaseStudy]);
    
    // Reset current case study
    setCurrentCaseStudy({
      title: '',
      scenario: '',
      context: '',
      stakeholders: [''],
      challenges: [''],
      questions: [''],
      learningObjectives: [''],
      discussionPoints: [''],
      duration: 15
    });

    toast({
      title: "Case Study Added",
      description: `Case study builder now has ${builtCaseStudies.length + 1} case studies`,
    });
  };

  const removeCaseStudyFromList = (index: number) => {
    setBuiltCaseStudies(prev => prev.filter((_, i) => i !== index));
  };

  const generateAICaseStudy = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-case-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle,
          sectionTitle,
          learningObjective,
          context: 'early childhood education'
        })
      });

      if (response.ok) {
        const generatedCaseStudy = await response.json();
        setCurrentCaseStudy(prev => ({
          ...prev,
          title: generatedCaseStudy.title || prev.title,
          scenario: generatedCaseStudy.scenario || prev.scenario,
          context: generatedCaseStudy.context || prev.context,
          stakeholders: generatedCaseStudy.stakeholders || prev.stakeholders,
          challenges: generatedCaseStudy.challenges || prev.challenges,
          questions: generatedCaseStudy.questions || prev.questions,
          learningObjectives: generatedCaseStudy.learningObjectives || prev.learningObjectives,
          discussionPoints: generatedCaseStudy.discussionPoints || prev.discussionPoints
        }));

        toast({
          title: "AI Case Study Generated",
          description: "Review and customize the generated case study",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI case study. Please create manually.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const finishAndSave = () => {
    if (builtCaseStudies.length === 0) {
      toast({
        title: "No Case Studies",
        description: "Please add at least one case study.",
        variant: "destructive",
      });
      return;
    }

    onSave(builtCaseStudies);
    onClose();
    
    toast({
      title: "Case Studies Created Successfully",
      description: `Created ${builtCaseStudies.length} case studies`,
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <BookOpen className="h-5 w-5" />
          Case Study Builder
        </CardTitle>
        <CardDescription className="text-orange-700">
          Create realistic scenarios for educators to analyze and discuss professional challenges.
        </CardDescription>
        
        {/* Context Information */}
        <div className="mt-3 p-3 bg-white border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Case Study Context</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="text-orange-700">
              <strong>Module:</strong> {moduleTitle || 'Professional Development Module'}
            </div>
            <div className="text-orange-700">
              <strong>Section:</strong> {sectionTitle || 'Current Section'}
            </div>
            <div className="text-orange-700">
              <strong>Learning Objective:</strong> {learningObjective || 'Building effective teaching strategies'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Case Study Progress */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-semibold">
              {builtCaseStudies.length}
            </div>
            <span className="text-sm font-medium">Case Studies Built</span>
          </div>
          {builtCaseStudies.length > 0 && (
            <Button
              size="sm"
              onClick={finishAndSave}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Finish & Save Case Studies
            </Button>
          )}
        </div>

        {/* Current Case Study Builder */}
        <div className="space-y-4 p-4 bg-white rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Case Study {builtCaseStudies.length + 1}</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateAICaseStudy}
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
              <Label className="text-sm font-medium">Case Study Title</Label>
              <Input
                value={currentCaseStudy.title}
                onChange={(e) => updateCaseStudyField('title', e.target.value)}
                placeholder="Enter case study title..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (minutes)
              </Label>
              <Select 
                value={currentCaseStudy.duration.toString()} 
                onValueChange={(value) => updateCaseStudyField('duration', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scenario */}
          <div>
            <Label className="text-sm font-medium">Scenario Description</Label>
            <Textarea
              value={currentCaseStudy.scenario}
              onChange={(e) => updateCaseStudyField('scenario', e.target.value)}
              placeholder="Describe the real-world scenario educators will analyze..."
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Context */}
          <div>
            <Label className="text-sm font-medium">Additional Context</Label>
            <Textarea
              value={currentCaseStudy.context}
              onChange={(e) => updateCaseStudyField('context', e.target.value)}
              placeholder="Provide background information, setting, or relevant details..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Stakeholders */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Key Stakeholders
            </Label>
            <div className="space-y-2 mt-1">
              {currentCaseStudy.stakeholders.map((stakeholder, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={stakeholder}
                    onChange={(e) => updateArrayField('stakeholders', index, e.target.value)}
                    placeholder={`Stakeholder ${index + 1} (e.g., Teacher, Parent, Child)`}
                  />
                  {currentCaseStudy.stakeholders.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeArrayItem('stakeholders', index)}
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
                onClick={() => addArrayItem('stakeholders')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stakeholder
              </Button>
            </div>
          </div>

          {/* Discussion Questions */}
          <div>
            <Label className="text-sm font-medium">Discussion Questions</Label>
            <div className="space-y-2 mt-1">
              {currentCaseStudy.questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={question}
                    onChange={(e) => updateArrayField('questions', index, e.target.value)}
                    placeholder={`Discussion question ${index + 1}`}
                    rows={2}
                  />
                  {currentCaseStudy.questions.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeArrayItem('questions', index)}
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
                onClick={() => addArrayItem('questions')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Add Case Study Button */}
          <Button
            onClick={addCaseStudyToList}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={!currentCaseStudy.title.trim() || !currentCaseStudy.scenario.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Case Study to List
          </Button>
        </div>

        {/* Built Case Studies List */}
        {builtCaseStudies.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Built Case Studies ({builtCaseStudies.length})</h4>
            {builtCaseStudies.map((caseStudy, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{caseStudy.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Duration: {caseStudy.duration} min | Questions: {caseStudy.questions.length} | Stakeholders: {caseStudy.stakeholders.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {caseStudy.scenario.substring(0, 100)}...
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCaseStudyFromList(index)}
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
        <div className="flex justify-between pt-4 border-t border-orange-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel Case Study Builder
          </Button>
          
          {builtCaseStudies.length > 0 && (
            <Button
              onClick={finishAndSave}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Save Case Studies & Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}