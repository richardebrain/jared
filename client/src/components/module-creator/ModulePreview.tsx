import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Link,
  Zap,
  Brain,
  Gamepad,
  ArrowLeft,
  CheckCircle
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

interface Module {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  customPoints?: string;
  pointValue: number;
  sections: ModuleSection[];
  shareWithCommunity?: boolean;
}

interface ModulePreviewProps {
  module: Module;
  onBack: () => void;
  onPublish?: () => void;
  onSaveDraft?: () => void;
  isPublishing?: boolean;
  isSavingDraft?: boolean;
}

const SECTION_TYPE_ICONS: Record<string, any> = {
  text: FileText,
  video: Play,
  quiz: HelpCircle,
  story: BookOpen,
  example: Lightbulb,
  matching: Link,
  scenario: Users,
  triage: Zap,
  mnemonic: Brain,
  simulation: Gamepad,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

const CATEGORY_COLORS: Record<string, string> = {
  'classroom-management': 'bg-blue-100 text-blue-800',
  'child-development': 'bg-purple-100 text-purple-800',
  'communication': 'bg-pink-100 text-pink-800',
  'safety': 'bg-red-100 text-red-800',
  'curriculum': 'bg-green-100 text-green-800',
  'professional-development': 'bg-orange-100 text-orange-800',
};

export default function ModulePreview({ 
  module, 
  onBack, 
  onPublish, 
  onSaveDraft,
  isPublishing = false,
  isSavingDraft = false
}: ModulePreviewProps) {
  const totalDuration = module.sections.reduce((total, section) => {
    const sectionDuration = section.duration + 
      section.activities.reduce((actTotal, activity) => actTotal + activity.duration, 0);
    return total + sectionDuration;
  }, 0);

  const totalQuestions = module.sections.reduce((total, section) => {
    return total + (section.questions?.length || 0);
  }, 0);

  const getSectionIcon = (type: string) => {
    const IconComponent = SECTION_TYPE_ICONS[type] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editor
        </Button>
        <div className="flex gap-2">
          {onSaveDraft && (
            <Button 
              variant="outline" 
              onClick={onSaveDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
          {onPublish && (
            <Button 
              onClick={onPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Publish Module'}
            </Button>
          )}
        </div>
      </div>

      {/* Module Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <p className="text-gray-600">{module.description}</p>
            </div>
            <Eye className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className={CATEGORY_COLORS[module.category] || 'bg-gray-100 text-gray-800'}>
              {module.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <Badge className={DIFFICULTY_COLORS[module.difficulty] || 'bg-gray-100 text-gray-800'}>
              {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(totalDuration)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {module.pointValue || module.customPoints || '10'} Points
            </Badge>
            {totalQuestions > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                {totalQuestions} Questions
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Module Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{module.sections.length}</div>
            <div className="text-sm text-gray-600">Sections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatDuration(totalDuration)}</div>
            <div className="text-sm text-gray-600">Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
            <div className="text-sm text-gray-600">Quiz Questions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {module.sections.reduce((total, section) => total + section.activities.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Activities</div>
          </CardContent>
        </Card>
      </div>

      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Module Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {module.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    {getSectionIcon(section.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{section.title || `Section ${index + 1}`}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline" className="text-xs">
                        {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {section.duration}m
                      </span>
                      {section.activities.length > 0 && (
                        <span>{section.activities.length} activities</span>
                      )}
                      {section.questions && section.questions.length > 0 && (
                        <span>{section.questions.length} questions</span>
                      )}
                    </div>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              {/* Section Content Preview */}
              {section.content && (
                <div className="pl-11">
                  <p className="text-sm text-gray-600 line-clamp-3">{section.content}</p>
                </div>
              )}

              {/* Activities Preview */}
              {section.activities.length > 0 && (
                <div className="pl-11">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Activities:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {section.activities.map((activity, actIndex) => (
                        <div key={actIndex} className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border">
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                          <span className="flex-1 truncate">{activity.title}</span>
                          <span className="text-xs">{activity.duration}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Preview */}
              {section.questions && section.questions.length > 0 && (
                <div className="pl-11">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Quiz Questions:</h5>
                    <div className="space-y-2">
                      {section.questions.slice(0, 2).map((question, qIndex) => (
                        <div key={qIndex} className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium">{question.question}</p>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                            {question.answers.map((answer, aIndex) => (
                              <div key={aIndex} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${
                                  aIndex === question.correctAnswer ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                                <span className={aIndex === question.correctAnswer ? 'font-medium' : ''}>
                                  {answer}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {section.questions.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{section.questions.length - 2} more questions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {index < module.sections.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Publishing Options */}
      {module.shareWithCommunity && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Community Sharing Enabled</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              This module will be shared with the community and available for other educators to use.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}