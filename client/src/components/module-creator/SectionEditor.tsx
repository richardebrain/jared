import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Play,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Link,
  Users,
  Zap,
  Brain,
  Gamepad,
  Trash2,
  Plus,
  GripVertical,
  Wand2
} from 'lucide-react';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  type: 'text' | 'quiz' | 'scenario-match' | 'podcast' | 'slide' | 'video' | 'story' | 'example' | 'matching' | 'scenario' | 'triage' | 'mnemonic' | 'simulation';
  duration: number;
  activities: Array<{
    type: 'watch' | 'read' | 'practice' | 'reflect' | 'quiz' | 'journal' | 'breathing' | 'recording';
    title: string;
    duration: number;
    content: string;
    videoUrl?: string;
    audioUrl?: string;
    interactionType?: string;
  }>;
  questions?: Array<{
    question: string;
    answers: string[];
    correctAnswer: number;
  }>;
  scenarios?: Array<{
    scenario: string;
    response: string;
  }>;
  audioUrl?: string;
  slides?: Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>;
}

interface SectionEditorProps {
  section: ModuleSection;
  sectionIndex: number;
  onSectionChange: (index: number, field: keyof ModuleSection, value: any) => void;
  onDeleteSection: (index: number) => void;
  onGenerateContent?: (sectionIndex: number, prompt: string) => void;
  isGenerating?: boolean;
}

const SECTION_TYPES = [
  { type: 'text', icon: FileText, title: 'Text Content', description: 'Written educational content with AI assistance' },
  { type: 'video', icon: Play, title: 'Video Content', description: 'Video resources with AI-generated questions' },
  { type: 'quiz', icon: HelpCircle, title: 'Knowledge Quiz', description: 'AI-generated assessment questions' },
  { type: 'story', icon: BookOpen, title: 'Story/Scenario', description: 'Engaging narratives with AI storytelling' },
  { type: 'example', icon: Lightbulb, title: 'Examples', description: 'Real-world examples with AI insights' },
  { type: 'matching', icon: Link, title: 'Matching Exercise', description: 'Interactive matching with AI generation' },
  { type: 'scenario', icon: Users, title: 'Scenario Practice', description: 'Practice scenarios with AI feedback' },
  { type: 'triage', icon: Zap, title: 'Decision Triage', description: 'Quick decision-making exercises' },
  { type: 'mnemonic', icon: Brain, title: 'Memory Aids', description: 'AI-generated memory devices' },
  { type: 'simulation', icon: Gamepad, title: 'Interactive Simulation', description: 'Hands-on practice simulations' }
];

export default function SectionEditor({ 
  section, 
  sectionIndex, 
  onSectionChange, 
  onDeleteSection, 
  onGenerateContent,
  isGenerating = false 
}: SectionEditorProps) {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');

  const updateSection = (field: keyof ModuleSection, value: any) => {
    onSectionChange(sectionIndex, field, value);
  };

  const getSectionTypeInfo = (type: string) => {
    return SECTION_TYPES.find(st => st.type === type) || SECTION_TYPES[0];
  };

  const addQuestion = () => {
    const newQuestion = {
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0
    };
    const updatedQuestions = [...(section.questions || []), newQuestion];
    updateSection('questions', updatedQuestions);
  };

  const updateQuestion = (questionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...(section.questions || [])];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    updateSection('questions', updatedQuestions);
  };

  const deleteQuestion = (questionIndex: number) => {
    const updatedQuestions = section.questions?.filter((_, i) => i !== questionIndex) || [];
    updateSection('questions', updatedQuestions);
  };

  const addActivity = () => {
    const newActivity = {
      type: 'read' as const,
      title: '',
      duration: 5,
      content: ''
    };
    const updatedActivities = [...section.activities, newActivity];
    updateSection('activities', updatedActivities);
  };

  const updateActivity = (activityIndex: number, field: string, value: any) => {
    const updatedActivities = [...section.activities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      [field]: value
    };
    updateSection('activities', updatedActivities);
  };

  const deleteActivity = (activityIndex: number) => {
    const updatedActivities = section.activities.filter((_, i) => i !== activityIndex);
    updateSection('activities', updatedActivities);
  };

  const handleGenerateContent = () => {
    if (!aiPrompt.trim() || !onGenerateContent) return;
    
    onGenerateContent(sectionIndex, aiPrompt);
    setAiPrompt('');
  };

  const sectionTypeInfo = getSectionTypeInfo(section.type);
  const IconComponent = sectionTypeInfo.icon;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <IconComponent className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Section {sectionIndex + 1}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {sectionTypeInfo.title}
              </Badge>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteSection(sectionIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Section Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`section-title-${sectionIndex}`}>Section Title</Label>
            <Input
              id={`section-title-${sectionIndex}`}
              value={section.title}
              onChange={(e) => updateSection('title', e.target.value)}
              placeholder="Enter section title..."
            />
          </div>
          <div>
            <Label htmlFor={`section-type-${sectionIndex}`}>Section Type</Label>
            <Select 
              value={section.type} 
              onValueChange={(value) => updateSection('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Content Generation */}
        {onGenerateContent && (
          <Card className="bg-purple-50">
            <CardContent className="p-4">
              <Label className="flex items-center gap-2 mb-2">
                <Wand2 className="h-4 w-4" />
                AI Content Generation
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe what content you want to generate..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !aiPrompt.trim()}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Content */}
        <div>
          <Label htmlFor={`section-content-${sectionIndex}`}>Content</Label>
          <Textarea
            id={`section-content-${sectionIndex}`}
            value={section.content}
            onChange={(e) => updateSection('content', e.target.value)}
            placeholder="Enter section content..."
            rows={6}
          />
        </div>

        {/* Video URL */}
        <div>
          <Label htmlFor={`section-video-${sectionIndex}`}>Video URL (Optional)</Label>
          <Input
            id={`section-video-${sectionIndex}`}
            value={section.videoUrl}
            onChange={(e) => updateSection('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        {/* Quiz Questions */}
        {section.type === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Quiz Questions</Label>
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
            {section.questions?.map((question, qIndex) => (
              <Card key={qIndex} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Question {qIndex + 1}</Label>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter question..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${sectionIndex}-${qIndex}`}
                          checked={question.correctAnswer === aIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', aIndex)}
                        />
                        <Input
                          value={answer}
                          onChange={(e) => {
                            const newAnswers = [...question.answers];
                            newAnswers[aIndex] = e.target.value;
                            updateQuestion(qIndex, 'answers', newAnswers);
                          }}
                          placeholder={`Answer ${aIndex + 1}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Activities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activities</Label>
            <Button onClick={addActivity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
          {section.activities.map((activity, aIndex) => (
            <Card key={aIndex} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Activity {aIndex + 1}</Label>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteActivity(aIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={activity.title}
                    onChange={(e) => updateActivity(aIndex, 'title', e.target.value)}
                    placeholder="Activity title..."
                  />
                  <Select 
                    value={activity.type} 
                    onValueChange={(value) => updateActivity(aIndex, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watch">Watch</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="reflect">Reflect</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="journal">Journal</SelectItem>
                      <SelectItem value="breathing">Breathing</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={activity.duration}
                    onChange={(e) => updateActivity(aIndex, 'duration', parseInt(e.target.value) || 0)}
                    placeholder="Duration (min)"
                  />
                </div>
                <Textarea
                  value={activity.content}
                  onChange={(e) => updateActivity(aIndex, 'content', e.target.value)}
                  placeholder="Activity content..."
                  rows={3}
                />
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}