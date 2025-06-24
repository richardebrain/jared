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
  Save,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    // Navigate to the comprehensive module creator in edit mode
    setLocation(`/comprehensive-module-creator?edit=${moduleId}`);
  };

  const handleViewModule = (moduleId: number) => {
    setLocation(`/modules/${moduleId}`);
  };

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return apiRequest(`/api/modules/${moduleId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/modules/user/${user?.id}`] });
      toast({
        title: "Module Deleted",
        description: "The module has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete module",
        variant: "destructive",
      });
    }
  });

  const handleDeleteModule = (moduleId: number) => {
    deleteModuleMutation.mutate(moduleId);
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
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <FileEdit className="h-6 w-6 text-blue-600" />
          My Modules
        </h2>
        {modulesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading your modules...</span>
          </div>
        ) : modules && modules.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Your recently created modules - click to view or edit
            </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.slice(0, 6).map((module: any) => (
              <Card 
                key={module.id} 
                className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105 transform relative overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border-2 border-purple-200 hover:border-purple-300"
              >
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Floating animation circle */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150"></div>
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">{module.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-0">
                          {module.duration} min
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                          {module.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-yellow-700 font-medium">{module.average_rating ? Math.round(module.average_rating * 10) / 10 : 'New'}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(module.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewModule(module.id)}
                      className="text-xs flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditModule(module.id)}
                      className="text-xs flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          disabled={deleteModuleMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the module "{module.title}" and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteModule(module.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Module
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-dashed border-blue-200">
              <FileEdit className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-600 mb-4">Start creating your first module using one of the methods below</p>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <span>Get started by choosing a creation method</span>
                <span className="animate-bounce">↓</span>
              </div>
            </div>
          </div>
        )}
      </div>

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