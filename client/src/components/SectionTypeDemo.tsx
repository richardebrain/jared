import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionRendererManager, SECTION_TYPE_CONFIG } from './SectionRendererManager';
import {
  Users, Presentation, Lightbulb, Link2,
  Brain, Zap, Gamepad2, FileText, Play,
  HelpCircle, BookOpen, Eye, RotateCcw
} from 'lucide-react';

interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  type: string;
  duration: number;
  activities: Array<{
    type: string;
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

const ICON_MAP: { [key: string]: React.ComponentType<any> } = {
  Users,
  Presentation,
  Lightbulb,
  Link2,
  Brain,
  Zap,
  Gamepad2,
  FileText,
  Play,
  HelpCircle,
  BookOpen
};

const createDefaultSection = (type: string): ModuleSection => {
  const baseSection: ModuleSection = {
    title: `Sample ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
    content: '',
    videoUrl: '',
    imageUrl: '',
    type,
    duration: 5,
    activities: [],
    scenarios: [],
    slides: [],
    questions: []
  };

  // Set type-specific defaults
  switch (type) {
    case 'scenario-match':
      baseSection.scenarios = [
        { scenario: 'A child is having difficulty sharing toys during playtime', response: 'Guide the child through turn-taking exercises and model sharing behavior' },
        { scenario: 'Two children are arguing over the same book', response: 'Facilitate a discussion about compromise and introduce a reading schedule' }
      ];
      break;
    case 'slide':
      baseSection.slides = [
        { title: 'Introduction to Early Childhood Development', content: 'Understanding the fundamental principles of child development in educational settings.' },
        { title: 'Key Developmental Milestones', content: 'Physical, cognitive, social, and emotional milestones for ages 3-6.' }
      ];
      break;
    case 'example':
      baseSection.content = JSON.stringify([
        {
          id: 1,
          title: 'Positive Reinforcement in Action',
          description: 'A teacher notices a shy child helping a classmate and immediately acknowledges the kindness, leading to increased prosocial behavior.',
          keyLearning: 'Immediate positive reinforcement strengthens desired behaviors',
          category: 'practical'
        },
        {
          id: 2,
          title: 'Creating Safe Learning Spaces',
          description: 'Arranging classroom furniture to create cozy reading corners and clear pathways for movement.',
          keyLearning: 'Physical environment directly impacts learning outcomes',
          category: 'best-practice'
        }
      ]);
      break;
    case 'matching':
      baseSection.content = JSON.stringify([
        { id: 1, left: 'Scaffolding', right: 'Providing temporary support to help children achieve goals' },
        { id: 2, left: 'Zone of Proximal Development', right: 'The gap between what a child can do alone and with guidance' },
        { id: 3, left: 'Emergent Curriculum', right: 'Planning that responds to children\'s interests and needs' }
      ]);
      break;
    case 'scenario':
      baseSection.scenarios = [
        { scenario: 'During circle time, a 4-year-old repeatedly interrupts the story by making loud noises', response: 'Acknowledge the child\'s energy, provide a specific role in the story, and set clear expectations for listening time' }
      ];
      break;
    case 'triage':
      baseSection.content = JSON.stringify([
        { id: 1, situation: 'Child with severe allergic reaction showing difficulty breathing', priority: 'high', rationale: 'Life-threatening emergency requiring immediate medical attention' },
        { id: 2, situation: 'Two children having a disagreement over playground equipment', priority: 'low', rationale: 'Normal social conflict that can be addressed through guidance' },
        { id: 3, situation: 'Child showing signs of emotional distress after parent drop-off', priority: 'medium', rationale: 'Requires attention to prevent escalation but not immediately dangerous' }
      ]);
      break;
    case 'mnemonic':
      baseSection.content = JSON.stringify({
        technique: 'acronym',
        content: 'PLAY - Positive, Loving, Affirming, Yourself',
        keyPoints: ['Be Positive in interactions', 'Show Loving care', 'Provide Affirming feedback', 'Be Yourself authentically'],
        practiceExercise: 'Practice using PLAY in daily interactions with children for one week'
      });
      break;
    case 'simulation':
      baseSection.content = JSON.stringify({
        title: 'Handling a Playground Conflict',
        description: 'Practice mediating between two children who both want to use the same swing',
        objectives: ['Learn conflict resolution techniques', 'Practice active listening with children', 'Develop fair solution strategies'],
        steps: ['Observe the situation', 'Approach calmly', 'Listen to both children', 'Guide them to a solution', 'Follow up'],
        resources: ['Playground equipment', 'Conflict resolution guidelines', 'Documentation forms'],
        assessment: 'Peer observation and self-reflection on mediation effectiveness',
        duration: 15
      });
      break;
    default:
      baseSection.content = `This is sample content for the ${type} section type.`;
  }

  return baseSection;
};

export const SectionTypeDemo: React.FC = () => {
  const [selectedType, setSelectedType] = useState('scenario-match');
  const [demoSection, setDemoSection] = useState<ModuleSection>(createDefaultSection('scenario-match'));
  const [previewMode, setPreviewMode] = useState(false);

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setDemoSection(createDefaultSection(newType));
    setPreviewMode(false);
  };

  const handleSectionUpdate = (updatedSection: ModuleSection) => {
    setDemoSection(updatedSection);
  };

  const resetSection = () => {
    setDemoSection(createDefaultSection(selectedType));
    setPreviewMode(false);
  };

  const newSectionTypes = ['scenario-match', 'slide', 'example', 'matching', 'scenario', 'triage', 'mnemonic', 'simulation'];
  const existingTypes = ['text', 'video', 'quiz', 'story'];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Module Section Types Demo</h1>
        <p className="text-gray-600">Interactive demonstration of all available section types for educational module creation</p>
      </div>

      <Tabs value={selectedType} onValueChange={handleTypeChange} className="w-full">
        <div className="space-y-6">
          {/* Section Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Choose Section Type to Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">✨ New Interactive Section Types</h3>
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2">
                    {newSectionTypes.map((type) => {
                      const config = SECTION_TYPE_CONFIG[type as keyof typeof SECTION_TYPE_CONFIG];
                      const IconComponent = ICON_MAP[config?.icon] || FileText;
                      
                      return (
                        <TabsTrigger
                          key={type}
                          value={type}
                          className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="text-xs text-center">{config?.title || type}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">📚 Existing Section Types</h3>
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2">
                    {existingTypes.map((type) => {
                      const IconComponent = type === 'text' ? FileText : 
                                          type === 'video' ? Play :
                                          type === 'quiz' ? HelpCircle : BookOpen;
                      
                      return (
                        <TabsTrigger
                          key={type}
                          value={type}
                          className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="text-xs text-center">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Current: {selectedType}
              </Badge>
              {SECTION_TYPE_CONFIG[selectedType as keyof typeof SECTION_TYPE_CONFIG] && (
                <span className="text-sm text-gray-600">
                  {SECTION_TYPE_CONFIG[selectedType as keyof typeof SECTION_TYPE_CONFIG].description}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetSection}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Demo
              </Button>
              <Button
                variant={previewMode ? "default" : "outline"}
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
            </div>
          </div>

          {/* Section Editor/Preview */}
          <Card className="min-h-96">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {previewMode ? 'Preview: ' : 'Editor: '}
                  {demoSection.title}
                </span>
                <Badge className={`${previewMode ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {previewMode ? 'Preview Mode' : 'Edit Mode'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-sm text-gray-600 mb-4">
                    This is how learners would see this section
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">{demoSection.title}</h3>
                    <div className="space-y-4">
                      {demoSection.type === 'scenario-match' && demoSection.scenarios && (
                        <div className="space-y-3">
                          {demoSection.scenarios.map((scenario, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="font-medium text-blue-700 mb-2">Scenario {index + 1}:</div>
                              <div className="mb-3">{scenario.scenario}</div>
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Response:</strong> {scenario.response}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {demoSection.type === 'slide' && demoSection.slides && (
                        <div className="space-y-4">
                          {demoSection.slides.map((slide, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                              <h4 className="font-semibold text-lg mb-2">{slide.title}</h4>
                              <p>{slide.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {['example', 'matching', 'triage', 'mnemonic', 'simulation'].includes(demoSection.type) && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-800">
                            Content would be rendered as interactive components for learners
                          </div>
                          <pre className="text-xs mt-2 text-blue-600 whitespace-pre-wrap">
                            {demoSection.content.substring(0, 200)}...
                          </pre>
                        </div>
                      )}
                      {demoSection.type === 'scenario' && demoSection.scenarios && (
                        <div className="space-y-3">
                          {demoSection.scenarios.map((scenario, index) => (
                            <div key={index} className="border-l-4 border-indigo-500 pl-4">
                              <div className="font-medium mb-2">Practice Scenario:</div>
                              <div className="mb-3">{scenario.scenario}</div>
                              <div className="text-sm bg-indigo-50 p-3 rounded">
                                <strong>Guided Response:</strong> {scenario.response}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <TabsContent value={selectedType} className="mt-0">
                    <SectionRendererManager
                      section={demoSection}
                      onUpdate={handleSectionUpdate}
                    />
                  </TabsContent>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Information */}
          <Card>
            <CardHeader>
              <CardTitle>Section Type Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Duration</h4>
                  <p className="text-sm text-gray-600">{demoSection.duration} minutes</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Activities</h4>
                  <p className="text-sm text-gray-600">{demoSection.activities.length} activities</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content Size</h4>
                  <p className="text-sm text-gray-600">
                    {demoSection.content.length} characters
                  </p>
                </div>
                {demoSection.scenarios && demoSection.scenarios.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Scenarios</h4>
                    <p className="text-sm text-gray-600">{demoSection.scenarios.length} scenarios</p>
                  </div>
                )}
                {demoSection.slides && demoSection.slides.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Slides</h4>
                    <p className="text-sm text-gray-600">{demoSection.slides.length} slides</p>
                  </div>
                )}
                {demoSection.questions && demoSection.questions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Questions</h4>
                    <p className="text-sm text-gray-600">{demoSection.questions.length} questions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default SectionTypeDemo;