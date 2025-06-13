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
  BookOpen,
  FileText
} from 'lucide-react';

interface Story {
  title: string;
  content: string;
  learningObjectives: string[];
  reflectionQuestions: string[];
  keyThemes: string[];
}

interface StoryBuilderProps {
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

export default function StoryBuilder({
  moduleTitle,
  moduleDescription,
  sectionTitle,
  onSave,
  onCancel,
  initialData,
  category = 'classroom-management',
  difficulty = 'intermediate',
  estimatedTime = '15 min'
}: StoryBuilderProps) {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story>({
    title: '',
    content: '',
    learningObjectives: [],
    reflectionQuestions: [],
    keyThemes: []
  });
  const [currentObjective, setCurrentObjective] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentTheme, setCurrentTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialData?.stories) {
      setStories(initialData.stories);
    }
  }, [initialData]);

  const generateStory = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate a story.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-story', {
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
      
      setCurrentStory({
        title: data.title || `${moduleTitle} - Story`,
        content: data.content || '',
        learningObjectives: data.learningObjectives || [],
        reflectionQuestions: data.reflectionQuestions || [],
        keyThemes: data.keyThemes || []
      });

      toast({
        title: "Story Generated!",
        description: "AI has created a narrative for your topic."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate story content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addObjective = () => {
    if (currentObjective.trim()) {
      setCurrentStory(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, currentObjective.trim()]
      }));
      setCurrentObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setCurrentStory(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (currentQuestion.trim()) {
      setCurrentStory(prev => ({
        ...prev,
        reflectionQuestions: [...prev.reflectionQuestions, currentQuestion.trim()]
      }));
      setCurrentQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setCurrentStory(prev => ({
      ...prev,
      reflectionQuestions: prev.reflectionQuestions.filter((_, i) => i !== index)
    }));
  };

  const addTheme = () => {
    if (currentTheme.trim()) {
      setCurrentStory(prev => ({
        ...prev,
        keyThemes: [...prev.keyThemes, currentTheme.trim()]
      }));
      setCurrentTheme('');
    }
  };

  const removeTheme = (index: number) => {
    setCurrentStory(prev => ({
      ...prev,
      keyThemes: prev.keyThemes.filter((_, i) => i !== index)
    }));
  };

  const addStory = () => {
    if (currentStory.title && currentStory.content) {
      if (editingIndex !== null) {
        setStories(prev => 
          prev.map((story, index) => 
            index === editingIndex ? currentStory : story
          )
        );
        setEditingIndex(null);
      } else {
        setStories(prev => [...prev, currentStory]);
      }
      
      setCurrentStory({
        title: '',
        content: '',
        learningObjectives: [],
        reflectionQuestions: [],
        keyThemes: []
      });
      
      toast({
        title: "Story Added",
        description: "Story has been added successfully."
      });
    } else {
      toast({
        title: "Incomplete Story",
        description: "Please provide a title and story content.",
        variant: "destructive"
      });
    }
  };

  const editStory = (index: number) => {
    setCurrentStory(stories[index]);
    setEditingIndex(index);
  };

  const removeStory = (index: number) => {
    setStories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (stories.length === 0) {
      toast({
        title: "No Stories",
        description: "Please create at least one story before saving.",
        variant: "destructive"
      });
      return;
    }

    const builderData = {
      type: 'story',
      stories: stories,
      metadata: {
        totalStories: stories.length,
        totalWordCount: stories.reduce((sum, story) => sum + story.content.split(' ').length, 0),
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
            <BookOpen className="h-5 w-5 text-green-600" />
            Text-Based Story Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Story Builder */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="story-title">Story Title</Label>
              <Input
                id="story-title"
                value={currentStory.title}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter story title..."
              />
            </div>

            <div>
              <Label htmlFor="story-content">Story Content</Label>
              <Textarea
                id="story-content"
                value={currentStory.content}
                onChange={(e) => setCurrentStory(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your story here. Make it engaging and relevant to the topic..."
                rows={12}
                className="min-h-[300px]"
              />
              <div className="text-xs text-gray-500 mt-1">
                Word count: {currentStory.content.split(' ').filter(word => word.length > 0).length}
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-2">
              <Label>Learning Objectives</Label>
              <div className="flex gap-2">
                <Input
                  value={currentObjective}
                  onChange={(e) => setCurrentObjective(e.target.value)}
                  placeholder="Add a learning objective..."
                  onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <Button onClick={addObjective} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentStory.learningObjectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentStory.learningObjectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {objective}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeObjective(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Reflection Questions */}
            <div className="space-y-2">
              <Label>Reflection Questions</Label>
              <div className="flex gap-2">
                <Input
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Add a reflection question..."
                  onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                />
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentStory.reflectionQuestions.length > 0 && (
                <div className="space-y-1">
                  {currentStory.reflectionQuestions.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span>{question}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Themes */}
            <div className="space-y-2">
              <Label>Key Themes</Label>
              <div className="flex gap-2">
                <Input
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value)}
                  placeholder="Add a key theme..."
                  onKeyPress={(e) => e.key === 'Enter' && addTheme()}
                />
                <Button onClick={addTheme} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentStory.keyThemes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentStory.keyThemes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {theme}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeTheme(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={generateStory} 
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
              
              <Button onClick={addStory} className="flex-1">
                {editingIndex !== null ? 'Update Story' : 'Add Story'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Created Stories */}
      {stories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Created Stories ({stories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stories.map((story, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{story.title}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {story.content.split(' ').filter(word => word.length > 0).length} words
                        </Badge>
                        <Badge variant="outline">
                          {story.learningObjectives.length} objectives
                        </Badge>
                        <Badge variant="outline">
                          {story.reflectionQuestions.length} questions
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editStory(index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeStory(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Preview:</h5>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {story.content.substring(0, 200)}...
                      </p>
                    </div>

                    {story.keyThemes.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-gray-700 mb-1">Themes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {story.keyThemes.map((theme, themeIndex) => (
                            <Badge key={themeIndex} variant="outline" className="text-xs">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
          Save Stories
        </Button>
      </div>
    </div>
  );
}