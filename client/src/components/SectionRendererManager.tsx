import React from 'react';
import {
  ScenarioMatchRenderer,
  SlideRenderer,
  ExampleRenderer,
  MatchingRenderer,
  ScenarioRenderer,
  TriageRenderer,
  MnemonicRenderer,
  SimulationRenderer
} from './SectionTypeRenderers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Play, 
  HelpCircle, 
  BookOpen,
  AlertTriangle
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

interface SectionRendererManagerProps {
  section: ModuleSection;
  onUpdate: (section: ModuleSection) => void;
}

// Basic renderers for existing types that don't have custom renderers yet
const TextRenderer: React.FC<SectionRendererManagerProps> = ({ section, onUpdate }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <FileText className="h-5 w-5 text-blue-500" />
      <div>
        <h3 className="font-semibold">Text Content</h3>
        <p className="text-sm text-gray-600">Written educational content</p>
      </div>
    </div>
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <Label>Content</Label>
            <Textarea
              value={section.content}
              onChange={(e) => onUpdate({ ...section, content: e.target.value })}
              placeholder="Enter your text content here..."
              rows={8}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={section.duration}
                onChange={(e) => onUpdate({ ...section, duration: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={section.imageUrl}
                onChange={(e) => onUpdate({ ...section, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const VideoRenderer: React.FC<SectionRendererManagerProps> = ({ section, onUpdate }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <Play className="h-5 w-5 text-red-500" />
      <div>
        <h3 className="font-semibold">Video Content</h3>
        <p className="text-sm text-gray-600">Video resources with optional questions</p>
      </div>
    </div>
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <Label>Video URL</Label>
            <Input
              value={section.videoUrl}
              onChange={(e) => onUpdate({ ...section, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={section.content}
              onChange={(e) => onUpdate({ ...section, content: e.target.value })}
              placeholder="Describe what learners will see in this video..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={section.duration}
                onChange={(e) => onUpdate({ ...section, duration: parseInt(e.target.value) || 10 })}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Thumbnail URL (optional)</Label>
              <Input
                value={section.imageUrl}
                onChange={(e) => onUpdate({ ...section, imageUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const QuizRenderer: React.FC<SectionRendererManagerProps> = ({ section, onUpdate }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <HelpCircle className="h-5 w-5 text-green-500" />
      <div>
        <h3 className="font-semibold">Knowledge Quiz</h3>
        <p className="text-sm text-gray-600">Assessment questions for learning verification</p>
      </div>
    </div>
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <Label>Quiz Instructions</Label>
            <Textarea
              value={section.content}
              onChange={(e) => onUpdate({ ...section, content: e.target.value })}
              placeholder="Instructions for the quiz..."
              rows={3}
            />
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={section.duration}
              onChange={(e) => onUpdate({ ...section, duration: parseInt(e.target.value) || 5 })}
              placeholder="5"
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Quiz questions are managed through the quiz builder interface. 
              Current questions: {section.questions?.length || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const StoryRenderer: React.FC<SectionRendererManagerProps> = ({ section, onUpdate }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <BookOpen className="h-5 w-5 text-purple-500" />
      <div>
        <h3 className="font-semibold">Story/Narrative</h3>
        <p className="text-sm text-gray-600">Engaging stories and case studies</p>
      </div>
    </div>
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <Label>Story Content</Label>
            <Textarea
              value={section.content}
              onChange={(e) => onUpdate({ ...section, content: e.target.value })}
              placeholder="Tell your story or case study here..."
              rows={8}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={section.duration}
                onChange={(e) => onUpdate({ ...section, duration: parseInt(e.target.value) || 5 })}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={section.imageUrl}
                onChange={(e) => onUpdate({ ...section, imageUrl: e.target.value })}
                placeholder="https://example.com/story-image.jpg"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const UnsupportedRenderer: React.FC<SectionRendererManagerProps & { type: string }> = ({ type }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="h-5 w-5 text-orange-500" />
      <div>
        <h3 className="font-semibold">Unsupported Section Type</h3>
        <p className="text-sm text-gray-600">The section type "{type}" doesn't have a renderer yet</p>
      </div>
    </div>
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-4">
        <p className="text-orange-800">
          This section type is not yet supported in the editor. Please choose a different section type 
          or contact support for assistance.
        </p>
      </CardContent>
    </Card>
  </div>
);

export const SectionRendererManager: React.FC<SectionRendererManagerProps> = ({ section, onUpdate }) => {
  const renderSection = () => {
    switch (section.type) {
      case 'text':
        return <TextRenderer section={section} onUpdate={onUpdate} />;
      case 'video':
        return <VideoRenderer section={section} onUpdate={onUpdate} />;
      case 'quiz':
        return <QuizRenderer section={section} onUpdate={onUpdate} />;
      case 'story':
        return <StoryRenderer section={section} onUpdate={onUpdate} />;
      case 'scenario-match':
        return <ScenarioMatchRenderer section={section} onUpdate={onUpdate} />;
      case 'slide':
        return <SlideRenderer section={section} onUpdate={onUpdate} />;
      case 'example':
        return <ExampleRenderer section={section} onUpdate={onUpdate} />;
      case 'matching':
        return <MatchingRenderer section={section} onUpdate={onUpdate} />;
      case 'scenario':
        return <ScenarioRenderer section={section} onUpdate={onUpdate} />;
      case 'triage':
        return <TriageRenderer section={section} onUpdate={onUpdate} />;
      case 'mnemonic':
        return <MnemonicRenderer section={section} onUpdate={onUpdate} />;
      case 'simulation':
        return <SimulationRenderer section={section} onUpdate={onUpdate} />;
      default:
        return <UnsupportedRenderer section={section} onUpdate={onUpdate} type={section.type} />;
    }
  };

  return (
    <div className="w-full">
      {renderSection()}
    </div>
  );
};

export default SectionRendererManager;

// Export section type configuration for easy reference
export const SECTION_TYPE_CONFIG = {
  'scenario-match': {
    title: 'Scenario Matching',
    description: 'Create scenario-response pairs for practice',
    icon: 'Users',
    color: 'blue',
    category: 'interactive'
  },
  'slide': {
    title: 'Slide Presentation',
    description: 'Create visual presentation slides with content',
    icon: 'Presentation',
    color: 'purple',
    category: 'visual'
  },
  'example': {
    title: 'Real-World Examples',
    description: 'Provide practical examples and case studies',
    icon: 'Lightbulb',
    color: 'yellow',
    category: 'content'
  },
  'matching': {
    title: 'Matching Exercise',
    description: 'Create pairs for learners to match concepts',
    icon: 'Link2',
    color: 'green',
    category: 'interactive'
  },
  'scenario': {
    title: 'Scenario Practice',
    description: 'Create practice scenarios with guided responses',
    icon: 'Users',
    color: 'indigo',
    category: 'practice'
  },
  'triage': {
    title: 'Decision Triage',
    description: 'Create priority-based decision exercises',
    icon: 'Zap',
    color: 'orange',
    category: 'assessment'
  },
  'mnemonic': {
    title: 'Memory Aid',
    description: 'Create memorable learning devices',
    icon: 'Brain',
    color: 'purple',
    category: 'learning'
  },
  'simulation': {
    title: 'Interactive Simulation',
    description: 'Create hands-on practice experiences',
    icon: 'Gamepad2',
    color: 'blue',
    category: 'simulation'
  }
};