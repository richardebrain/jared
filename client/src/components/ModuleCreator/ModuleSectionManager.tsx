import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Video, BookOpen, FileQuestion, Brain, Eye, MessageSquare } from 'lucide-react';

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

interface ModuleSectionManagerProps {
  sections: ModuleSection[];
  onSectionsChange: (sections: ModuleSection[]) => void;
  currentSection: ModuleSection | null;
  onCurrentSectionChange: (section: ModuleSection | null) => void;
  isEditingSection: boolean;
  onEditingSectionChange: (editing: boolean) => void;
}

export default function ModuleSectionManager({
  sections,
  onSectionsChange,
  currentSection,
  onCurrentSectionChange,
  isEditingSection,
  onEditingSectionChange
}: ModuleSectionManagerProps) {
  const sectionTypes = [
    { value: 'text', label: 'Text Content', icon: BookOpen },
    { value: 'video', label: 'Video Content', icon: Video },
    { value: 'quiz', label: 'Quiz', icon: FileQuestion },
    { value: 'scenario', label: 'Scenario Practice', icon: MessageSquare },
    { value: 'simulation', label: 'Interactive Simulation', icon: Brain },
    { value: 'story', label: 'Story/Case Study', icon: BookOpen },
    { value: 'example', label: 'Real Example', icon: Eye },
    { value: 'slide', label: 'Slide Presentation', icon: BookOpen }
  ];

  const activityTypes = [
    'watch', 'read', 'practice', 'reflect', 'quiz', 'journal', 'breathing', 'recording'
  ];

  const handleAddSection = () => {
    const newSection: ModuleSection = {
      title: '',
      content: '',
      videoUrl: '',
      imageUrl: '',
      type: 'text',
      duration: 5,
      activities: [],
      questions: [],
      scenarios: [],
      audioUrl: '',
      slides: []
    };
    onCurrentSectionChange(newSection);
    onEditingSectionChange(true);
  };

  const handleEditSection = (index: number) => {
    onCurrentSectionChange({ ...sections[index] });
    onEditingSectionChange(true);
  };

  const handleSaveSection = () => {
    if (!currentSection) return;

    const existingIndex = sections.findIndex(s => s.title === currentSection.title);
    if (existingIndex >= 0) {
      const updatedSections = [...sections];
      updatedSections[existingIndex] = currentSection;
      onSectionsChange(updatedSections);
    } else {
      onSectionsChange([...sections, currentSection]);
    }
    
    onCurrentSectionChange(null);
    onEditingSectionChange(false);
  };

  const handleDeleteSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    onSectionsChange(updatedSections);
  };

  const updateCurrentSection = (updates: Partial<ModuleSection>) => {
    if (!currentSection) return;
    onCurrentSectionChange({ ...currentSection, ...updates });
  };

  const addActivity = () => {
    if (!currentSection) return;
    const newActivity = {
      type: 'read' as const,
      title: '',
      duration: 2,
      content: '',
      interactionType: 'form'
    };
    updateCurrentSection({
      activities: [...currentSection.activities, newActivity]
    });
  };

  const updateActivity = (index: number, updates: any) => {
    if (!currentSection) return;
    const updatedActivities = [...currentSection.activities];
    updatedActivities[index] = { ...updatedActivities[index], ...updates };
    updateCurrentSection({ activities: updatedActivities });
  };

  const removeActivity = (index: number) => {
    if (!currentSection) return;
    const updatedActivities = currentSection.activities.filter((_, i) => i !== index);
    updateCurrentSection({ activities: updatedActivities });
  };

  const addQuestion = () => {
    if (!currentSection) return;
    const newQuestion = {
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0
    };
    updateCurrentSection({
      questions: [...(currentSection.questions || []), newQuestion]
    });
  };

  const updateQuestion = (index: number, updates: any) => {
    if (!currentSection) return;
    const updatedQuestions = [...(currentSection.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    updateCurrentSection({ questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    if (!currentSection) return;
    const updatedQuestions = (currentSection.questions || []).filter((_, i) => i !== index);
    updateCurrentSection({ questions: updatedQuestions });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Module Sections ({sections.length})
          </span>
          <Button onClick={handleAddSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardTitle>
        <CardDescription>
          Create and manage the sections that make up your training module
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sections added yet. Click "Add Section" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{section.title || `Section ${index + 1}`}</h4>
                    <Badge variant="outline">{section.type}</Badge>
                    <Badge variant="secondary">{section.duration}min</Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {section.content || 'No content added'}
                  </p>
                  {section.activities.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {section.activities.length} activities
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSection(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSection(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Editor Dialog */}
        <Dialog open={isEditingSection} onOpenChange={onEditingSectionChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentSection && sections.some(s => s.title === currentSection.title) ? 'Edit Section' : 'Add New Section'}
              </DialogTitle>
              <DialogDescription>
                Configure the section details, activities, and content
              </DialogDescription>
            </DialogHeader>
            
            {currentSection && (
              <div className="space-y-6">
                {/* Basic Section Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input
                      placeholder="Enter section title..."
                      value={currentSection.title}
                      onChange={(e) => updateCurrentSection({ title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Section Type</Label>
                    <Select 
                      value={currentSection.type} 
                      onValueChange={(value: any) => updateCurrentSection({ type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Enter section content..."
                    value={currentSection.content}
                    onChange={(e) => updateCurrentSection({ content: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentSection.duration}
                      onChange={(e) => updateCurrentSection({ duration: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Video URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={currentSection.videoUrl}
                      onChange={(e) => updateCurrentSection({ videoUrl: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Image URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={currentSection.imageUrl}
                      onChange={(e) => updateCurrentSection({ imageUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* Activities Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Activities</h4>
                    <Button onClick={addActivity} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                  
                  {currentSection.activities.map((activity, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Activity {index + 1}</h5>
                        <Button
                          onClick={() => removeActivity(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Activity Type</Label>
                          <Select
                            value={activity.type}
                            onValueChange={(value: any) => updateActivity(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activityTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            placeholder="Activity title..."
                            value={activity.title}
                            onChange={(e) => updateActivity(index, { title: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Duration (min)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={activity.duration}
                            onChange={(e) => updateActivity(index, { duration: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          placeholder="Activity content..."
                          value={activity.content}
                          onChange={(e) => updateActivity(index, { content: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quiz Questions (if section type is quiz) */}
                {currentSection.type === 'quiz' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Quiz Questions</h4>
                      <Button onClick={addQuestion} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                    
                    {(currentSection.questions || []).map((question, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Question {index + 1}</h5>
                          <Button
                            onClick={() => removeQuestion(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Textarea
                            placeholder="Enter your question..."
                            value={question.question}
                            onChange={(e) => updateQuestion(index, { question: e.target.value })}
                            rows={2}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Answer Options</Label>
                          {question.answers.map((answer, answerIndex) => (
                            <div key={answerIndex} className="flex items-center gap-2">
                              <Input
                                placeholder={`Option ${answerIndex + 1}...`}
                                value={answer}
                                onChange={(e) => {
                                  const newAnswers = [...question.answers];
                                  newAnswers[answerIndex] = e.target.value;
                                  updateQuestion(index, { answers: newAnswers });
                                }}
                              />
                              <input
                                type="radio"
                                name={`correct-${index}`}
                                checked={question.correctAnswer === answerIndex}
                                onChange={() => updateQuestion(index, { correctAnswer: answerIndex })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => onEditingSectionChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSection}>
                    Save Section
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}