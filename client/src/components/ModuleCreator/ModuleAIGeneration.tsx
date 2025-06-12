import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Sparkles, Wand2, Brain, RefreshCw } from 'lucide-react';
import MultilingualBearyAI from "@/components/MultilingualBearyAI";
import { VoiceNarrationPanel } from "@/components/VoiceNarrationPanel";

interface ModuleAIGenerationProps {
  aiPrompt: string;
  onAiPromptChange: (prompt: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  includeVideos: boolean;
  onIncludeVideosChange: (include: boolean) => void;
  includeQuizzes: boolean;
  onIncludeQuizzesChange: (include: boolean) => void;
  includeActivities: boolean;
  onIncludeActivitiesChange: (include: boolean) => void;
  includeScenarios: boolean;
  onIncludeScenariosChange: (include: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  generationMode: 'ai' | 'manual';
  onGenerationModeChange: (mode: 'ai' | 'manual') => void;
  showAIDialog: boolean;
  onShowAIDialogChange: (show: boolean) => void;
  aiGeneratedContent: any;
  onUseGeneratedContent: () => void;
  onRegenerateContent: () => void;
}

export default function ModuleAIGeneration({
  aiPrompt,
  onAiPromptChange,
  selectedLanguage,
  onLanguageChange,
  includeVideos,
  onIncludeVideosChange,
  includeQuizzes,
  onIncludeQuizzesChange,
  includeActivities,
  onIncludeActivitiesChange,
  includeScenarios,
  onIncludeScenariosChange,
  isGenerating,
  onGenerate,
  generationMode,
  onGenerationModeChange,
  showAIDialog,
  onShowAIDialogChange,
  aiGeneratedContent,
  onUseGeneratedContent,
  onRegenerateContent
}: ModuleAIGenerationProps) {
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
  ];

  const aiPromptTemplates = [
    {
      title: "Child Development Fundamentals",
      prompt: "Create a comprehensive training module about child development milestones for early childhood educators. Include key developmental stages, observation techniques, and practical applications for classroom settings."
    },
    {
      title: "Positive Behavior Support",
      prompt: "Design a module focused on positive behavior support strategies for preschool children. Cover prevention techniques, intervention strategies, and creating supportive classroom environments."
    },
    {
      title: "Family Engagement Best Practices",
      prompt: "Develop training content about effective family engagement in early childhood education. Include communication strategies, cultural sensitivity, and partnership building techniques."
    },
    {
      title: "Safety and Health Protocols",
      prompt: "Create a module covering essential safety and health protocols in early childhood settings. Include emergency procedures, hygiene practices, and creating safe learning environments."
    },
    {
      title: "Inclusive Education Practices",
      prompt: "Design comprehensive training on inclusive education practices for children with diverse needs. Cover adaptation strategies, individualized support, and creating accessible learning environments."
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Module Creation Method
        </CardTitle>
        <CardDescription>
          Choose how you'd like to create your training module
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Mode Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="ai-mode"
              name="generation-mode"
              checked={generationMode === 'ai'}
              onChange={() => onGenerationModeChange('ai')}
            />
            <Label htmlFor="ai-mode" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI-Generated Content
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="manual-mode"
              name="generation-mode"
              checked={generationMode === 'manual'}
              onChange={() => onGenerationModeChange('manual')}
            />
            <Label htmlFor="manual-mode" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Manual Creation
            </Label>
          </div>
        </div>

        {generationMode === 'ai' && (
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label>Content Language</Label>
              <Select value={selectedLanguage} onValueChange={onLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Prompt Templates */}
            <div className="space-y-2">
              <Label>Quick Start Templates</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiPromptTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onAiPromptChange(template.prompt)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {template.prompt.substring(0, 100)}...
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Prompt Input */}
            <div className="space-y-2">
              <Label>Describe Your Training Module</Label>
              <Textarea
                placeholder="Describe the training module you want to create. Be specific about the topic, target audience, learning objectives, and any particular focus areas..."
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                rows={4}
              />
            </div>

            {/* Content Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Include in Generated Content:</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-videos">Video Integration</Label>
                  <Switch
                    id="include-videos"
                    checked={includeVideos}
                    onCheckedChange={onIncludeVideosChange}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-quizzes">Interactive Quizzes</Label>
                  <Switch
                    id="include-quizzes"
                    checked={includeQuizzes}
                    onCheckedChange={onIncludeQuizzesChange}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-activities">Practice Activities</Label>
                  <Switch
                    id="include-activities"
                    checked={includeActivities}
                    onCheckedChange={onIncludeActivitiesChange}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-scenarios">Scenario Practice</Label>
                  <Switch
                    id="include-scenarios"
                    checked={includeScenarios}
                    onCheckedChange={onIncludeScenariosChange}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={onGenerate}
              disabled={!aiPrompt.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Module with AI
                </>
              )}
            </Button>
          </div>
        )}

        {generationMode === 'manual' && (
          <div className="text-center py-8">
            <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Manual Module Creation</h3>
            <p className="text-gray-600 mb-4">
              Create your module step by step using the sections below.
            </p>
            <div className="flex gap-2 justify-center">
              <Badge variant="outline">Custom Content</Badge>
              <Badge variant="outline">Full Control</Badge>
              <Badge variant="outline">Flexible Structure</Badge>
            </div>
          </div>
        )}

        {/* AI Generated Content Dialog */}
        <Dialog open={showAIDialog} onOpenChange={onShowAIDialogChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Generated Module Content</DialogTitle>
              <DialogDescription>
                Review the generated content and choose to use it or regenerate
              </DialogDescription>
            </DialogHeader>
            
            {aiGeneratedContent && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">{aiGeneratedContent.title}</h3>
                  <p className="text-sm text-gray-600">{aiGeneratedContent.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{aiGeneratedContent.category}</Badge>
                    <Badge variant="outline">{aiGeneratedContent.level}</Badge>
                    <Badge variant="outline">{aiGeneratedContent.estimatedDuration} min</Badge>
                  </div>
                </div>

                {aiGeneratedContent.sections && aiGeneratedContent.sections.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Generated Sections ({aiGeneratedContent.sections.length})</h4>
                    {aiGeneratedContent.sections.slice(0, 3).map((section: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{section.title}</span>
                          <Badge variant="outline" className="text-xs">{section.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {section.content}
                        </p>
                      </div>
                    ))}
                    {aiGeneratedContent.sections.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{aiGeneratedContent.sections.length - 3} more sections...
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={onRegenerateContent}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onShowAIDialogChange(false)}>
                      Cancel
                    </Button>
                    <Button onClick={onUseGeneratedContent}>
                      Use This Content
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Additional AI Tools */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Enhancement Tools
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Beary AI Integration */}
            <Card className="p-4">
              <h5 className="font-medium mb-2">Beary AI Assistant</h5>
              <p className="text-sm text-gray-600 mb-3">
                Get personalized content suggestions and improvements
              </p>
              <MultilingualBearyAI />
            </Card>

            {/* Voice Narration */}
            <Card className="p-4">
              <h5 className="font-medium mb-2">Voice Narration</h5>
              <p className="text-sm text-gray-600 mb-3">
                Add professional voice narration to your modules
              </p>
              <VoiceNarrationPanel />
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}