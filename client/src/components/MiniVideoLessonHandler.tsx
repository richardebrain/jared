import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Video, Sparkles, Loader2, Plus, X } from 'lucide-react';

interface VideoSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  keyPoints: string[];
  discussionQuestions: string[];
  followUpActivities: string[];
  duration: number;
}

interface MiniVideoLessonHandlerProps {
  moduleTitle: string;
  moduleDescription: string;
  onSave: (sections: VideoSection[]) => void;
  initialData?: VideoSection[];
}

export default function MiniVideoLessonHandler({
  moduleTitle,
  moduleDescription,
  onSave,
  initialData = []
}: MiniVideoLessonHandlerProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<VideoSection[]>(initialData);
  const [currentSection, setCurrentSection] = useState<VideoSection>({
    title: '',
    content: '',
    videoUrl: '',
    imageUrl: '',
    keyPoints: [],
    discussionQuestions: [],
    followUpActivities: [],
    duration: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyPoint, setNewKeyPoint] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const generateVideoContent = async () => {
    if (!moduleTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a module title to generate content.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-suggestions/generate-video-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: moduleTitle,
          description: moduleDescription,
          type: 'mini-video'
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      
      const data = await response.json();
      
      setCurrentSection({
        title: data.title || `${moduleTitle} - Video Lesson`,
        content: data.script || '',
        videoUrl: '',
        imageUrl: '',
        keyPoints: data.keyPoints || [],
        discussionQuestions: data.discussionQuestions || [],
        followUpActivities: data.followUpActivities || [],
        duration: data.duration || 5
      });

      toast({
        title: "Content Generated!",
        description: "AI has created video lesson content."
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setCurrentSection(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, newKeyPoint.trim()]
      }));
      setNewKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setCurrentSection(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setCurrentSection(prev => ({
        ...prev,
        discussionQuestions: [...prev.discussionQuestions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setCurrentSection(prev => ({
      ...prev,
      discussionQuestions: prev.discussionQuestions.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setCurrentSection(prev => ({
        ...prev,
        followUpActivities: [...prev.followUpActivities, newActivity.trim()]
      }));
      setNewActivity('');
    }
  };

  const removeActivity = (index: number) => {
    setCurrentSection(prev => ({
      ...prev,
      followUpActivities: prev.followUpActivities.filter((_, i) => i !== index)
    }));
  };

  const saveSection = () => {
    if (!currentSection.title || !currentSection.content) {
      toast({
        title: "Incomplete Section",
        description: "Please provide a title and content.",
        variant: "destructive"
      });
      return;
    }

    setSections(prev => [...prev, currentSection]);
    setCurrentSection({
      title: '',
      content: '',
      videoUrl: '',
      imageUrl: '',
      keyPoints: [],
      discussionQuestions: [],
      followUpActivities: [],
      duration: 5
    });

    toast({
      title: "Section Added",
      description: "Video lesson section has been added."
    });
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (sections.length === 0) {
      toast({
        title: "No Content",
        description: "Please create at least one video section.",
        variant: "destructive"
      });
      return;
    }

    onSave(sections);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Mini Video Lesson Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button 
              onClick={generateVideoContent} 
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate AI Content
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  value={currentSection.title}
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter lesson title..."
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={currentSection.duration}
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="15"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="script">Video Script</Label>
              <Textarea
                id="script"
                value={currentSection.content}
                onChange={(e) => setCurrentSection(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter video script content..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="videoUrl">Video URL (optional)</Label>
                <Input
                  id="videoUrl"
                  value={currentSection.videoUrl}
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={currentSection.imageUrl}
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Key Takeaways</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  placeholder="Add key point..."
                  onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                />
                <Button onClick={addKeyPoint} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentSection.keyPoints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentSection.keyPoints.map((point, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {point}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeKeyPoint(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Discussion Questions</Label>
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Add discussion question..."
                  onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                />
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentSection.discussionQuestions.length > 0 && (
                <div className="space-y-1">
                  {currentSection.discussionQuestions.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{question}</span>
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

            <div className="space-y-2">
              <Label>Follow-up Activities</Label>
              <div className="flex gap-2">
                <Input
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Add follow-up activity..."
                  onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                />
                <Button onClick={addActivity} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentSection.followUpActivities.length > 0 && (
                <div className="space-y-1">
                  {currentSection.followUpActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{activity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={saveSection} className="w-full">
              Add Video Section
            </Button>
          </div>
        </CardContent>
      </Card>

      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Video Sections ({sections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{section.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{section.content.substring(0, 150)}...</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{section.duration} min</Badge>
                        <Badge variant="outline">{section.keyPoints.length} key points</Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSection(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save Video Lessons
        </Button>
      </div>
    </div>
  );
}