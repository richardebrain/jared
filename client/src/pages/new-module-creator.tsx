import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Brain,
  FileEdit,
  Upload,
  Sparkles,
  Users,
  FileText,
  Video,
  Mic,
  MessageSquare,
  Wand2,
  CheckCircle2,
  Edit3,
  Star,
  Calendar,
  Eye,
  Save
} from 'lucide-react';

const creationMethods = [
  {
    id: 'ai',
    title: 'AI-Powered Creation',
    description: 'Let AI build your module based on your topic and requirements',
    icon: Brain,
    color: 'bg-blue-50 border-blue-200',
    features: ['Instant content generation', 'Professional templates', 'Smart recommendations', 'Auto-formatted lessons'],
    route: '/module-creator/ai'
  },
  {
    id: 'manual',
    title: 'Manual Builder',
    description: 'Build your module step-by-step with full control over content',
    icon: FileEdit,
    color: 'bg-green-50 border-green-200',
    features: ['Complete customization', 'Drag & drop interface', 'Rich content tools', 'Preview mode'],
    route: '/module-creator/manual'
  },
  {
    id: 'import',
    title: 'PowerPoint Import',
    description: 'Transform your existing PowerPoint presentations into interactive modules',
    icon: Upload,
    color: 'bg-purple-50 border-purple-200',
    features: ['Easy file upload', 'Auto-conversion', 'Preserve formatting', 'Add interactions'],
    route: '/module-creator/import'
  }
];

const moduleTemplates = [
  {
    id: 'mini-video',
    title: 'Mini Video Lessons',
    description: 'Short, focused video content with key takeaways',
    icon: Video,
    duration: '5-10 minutes'
  },
  {
    id: 'interactive-scenario',
    title: 'Interactive Scenarios',
    description: 'Real-world situations with decision-making branches',
    icon: Users,
    duration: '10-15 minutes'
  },
  {
    id: 'slide-storyboard',
    title: 'Slide/GIF Storyboards',
    description: 'Visual learning with animated content',
    icon: FileText,
    duration: '8-12 minutes'
  },
  {
    id: 'quiz-teachback',
    title: 'Quick Quiz + Teachback',
    description: 'Knowledge check with teaching reinforcement',
    icon: CheckCircle2,
    duration: '6-10 minutes'
  },
  {
    id: 'podcast-audio',
    title: 'Podcast-Style Audio',
    description: 'AI-generated engaging conversations',
    icon: Mic,
    duration: '3-8 minutes'
  },
  {
    id: 'roleplay-reels',
    title: 'Roleplay Reels',
    description: 'Short practice scenarios with role-playing',
    icon: MessageSquare,
    duration: '5-8 minutes'
  }
];

export default function NewModuleCreator() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);


  // Fetch user's modules
  const { data: userModules, isLoading: modulesLoading, error } = useQuery({
    queryKey: [`/api/modules/user/${user?.id}`],
    enabled: !!user?.id,
  });

  // Type the modules data properly
  const modules = Array.isArray(userModules) ? userModules : [];



  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const handleMethodSelect = (methodId: string, route: string) => {
    setSelectedMethod(methodId);
    setLocation(route);
  };

  const handleEditModule = (moduleId: number) => {
    console.log(`[EDIT CLICK] Navigating to edit module ${moduleId}`);
    // Navigate to the full module builder in edit mode
    setLocation(`/new-module-manual?edit=${moduleId}`);
  };

  const handleViewModule = (moduleId: number) => {
    setLocation(`/modules/${moduleId}`);
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Module</h1>
            <p className="text-gray-600 mt-2">Choose how you'd like to build your educational content</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* My Modules Section */}
      {modules && modules.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-blue-600" />
            My Modules
          </h2>
          <p className="text-gray-600 mb-4">
            Your recently created modules - click to view or edit
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.slice(0, 6).map((module: any) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">{module.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {module.duration} min
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {module.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{module.average_rating ? Math.round(module.average_rating * 10) / 10 : 'New'}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(module.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewModule(module.id)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditModule(module.id)}
                        className="text-xs"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {modules.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setLocation('/modules')}>
                View All My Modules ({modules.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Creation Methods */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Choose Your Creation Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creationMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${method.color} hover:scale-105`}
                onClick={() => handleMethodSelect(method.id, method.route)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-white rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription className="text-center">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {method.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Choose {method.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available Templates */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Module Templates</h2>
        <p className="text-gray-600 mb-6">
          All templates are available with AI assistance, manual building, or PowerPoint import
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <Card key={template.id} className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {template.duration}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-blue-600" />
          Quick Start Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
            <h4 className="font-medium mb-1">Choose Method</h4>
            <p className="text-sm text-gray-600">Select AI, Manual, or Import based on your needs</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
            <h4 className="font-medium mb-1">Select Template</h4>
            <p className="text-sm text-gray-600">Pick the format that best fits your content</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
            <h4 className="font-medium mb-1">Build & Publish</h4>
            <p className="text-sm text-gray-600">Create your content and share with your team</p>
          </div>
        </div>
      </div>


    </div>
  );
}