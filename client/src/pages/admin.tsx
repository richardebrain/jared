import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import AdminTools from '@/components/AdminTools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Video, 
  Link2, 
  BookOpen, 
  ArrowLeft, 
  FileEdit, 
  Save, 
  PlusCircle, 
  Trash2, 
  Image, 
  Loader2 
} from 'lucide-react';

export default function AdminPage({ skipPasswordCheck = false }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if already authenticated from sessionStorage or if skipPasswordCheck is true
    return sessionStorage.getItem('adminAuthenticated') === 'true' || skipPasswordCheck;
  });
  
  // Module Creator state
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    category: 'classroom-management',
    difficulty: 'beginner',
    estimatedTime: '15',
    sections: [
      {
        title: 'Introduction',
        content: '',
        videoUrl: '',
        imageUrl: ''
      }
    ]
  });
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  
  // Admin password
  const ADMIN_PASSWORD = 'BIGSURF55';

  // User must be logged in to access admin page
  React.useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Login Required",
        description: "Please log in to access the admin page.",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [user, isLoading, navigate, toast]);

  const verifyPassword = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store authentication state in session storage
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
      setPassword('');
    }
  };

  const updateChildDevelopmentModule = async () => {
    try {
      await apiRequest('/api/modules/update-child-development', {
        method: 'POST'
      });
      
      toast({
        title: "Success",
        description: "Child Development module updated successfully",
      });
    } catch (error) {
      console.error("Error updating Child Development module:", error);
      toast({
        title: "Error",
        description: "Failed to update the Child Development module",
        variant: "destructive",
      });
    }
  };
  
  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return await apiRequest('/api/modules', {
        method: 'POST',
        data: moduleData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setNewModule({
        title: '',
        description: '',
        category: 'classroom-management',
        difficulty: 'beginner',
        estimatedTime: '15',
        sections: [
          {
            title: 'Introduction',
            content: '',
            videoUrl: '',
            imageUrl: ''
          }
        ]
      });
      setIsCreatingModule(false);
      toast({
        title: "Module Created",
        description: "Your custom module has been created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: "Failed to create the module. Please try again.",
        variant: "destructive",
      });
      setIsCreatingModule(false);
    }
  });
  
  // Handle module creation
  const handleCreateModule = () => {
    // Validate module data
    if (!newModule.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!newModule.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Module description is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check if at least one section has content
    const hasContent = newModule.sections.some(section => 
      section.content.trim() || section.videoUrl.trim() || section.imageUrl.trim()
    );
    
    if (!hasContent) {
      toast({
        title: "Validation Error",
        description: "At least one section must have content, video, or image",
        variant: "destructive",
      });
      return;
    }
    
    // Create the module
    setIsCreatingModule(true);
    const moduleData = {
      ...newModule,
      schoolId: user?.schoolId,
      createdBy: user?.id,
      // Add tags based on category
      tags: [newModule.category, newModule.difficulty],
      // Add points based on estimated time and difficulty
      points: calculatePoints(newModule.estimatedTime, newModule.difficulty),
      createdAt: new Date().toISOString()
    };
    
    createModuleMutation.mutate(moduleData);
  };
  
  // Add a new section to the module
  const addModuleSection = () => {
    setNewModule(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          title: `Section ${prev.sections.length + 1}`,
          content: '',
          videoUrl: '',
          imageUrl: ''
        }
      ]
    }));
  };
  
  // Remove a section from the module
  const removeModuleSection = (index: number) => {
    if (newModule.sections.length <= 1) {
      toast({
        title: "Cannot Remove Section",
        description: "A module must have at least one section",
        variant: "destructive",
      });
      return;
    }
    
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };
  
  // Update a section in the module
  const updateModuleSection = (index: number, field: string, value: string) => {
    setNewModule(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };
  
  // Calculate module points based on time and difficulty
  const calculatePoints = (timeEstimate: string, difficulty: string): number => {
    const basePoints = parseInt(timeEstimate) || 15;
    const difficultyMultiplier = 
      difficulty === 'advanced' ? 2 :
      difficulty === 'intermediate' ? 1.5 : 1;
    
    return Math.round(basePoints * difficultyMultiplier);
  };

  if (isLoading || !user) return <div>Loading...</div>;
  
  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {if (e.key === 'Enter') verifyPassword()}}
                  placeholder="Enter admin password"
                />
              </div>
              <Button onClick={verifyPassword} className="w-full">
                Access Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Teacher Dashboard
        </Button>
      </div>
      
      <Tabs defaultValue="management">
        <TabsList className="mb-6">
          <TabsTrigger value="management">Content Management</TabsTrigger>
          <TabsTrigger value="module-creator">Module Creator</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="tools">System Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Management</CardTitle>
                <CardDescription>Update and fix learning module content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={updateChildDevelopmentModule}
                    className="w-full"
                  >
                    Update Child Development Module
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/modules');
                    }}
                  >
                    Manage All Modules
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Core Values Management</CardTitle>
                <CardDescription>Manage Core Values and Shout-Out system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/core-values');
                    }}
                  >
                    Manage Core Values System
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/shoutouts');
                    }}
                  >
                    View All Shout-Outs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage teacher accounts, progress, and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTools />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>View system analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">This section is under development. Coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>System validation and maintenance tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Content Validation</h3>
                  <p className="text-muted-foreground mb-4">
                    Validate links, videos, and learning content across the platform
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <Video className="h-8 w-8 mb-2" />
                      <span>Validate Videos</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <Link2 className="h-8 w-8 mb-2" />
                      <span>Check Links</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center">
                      <BookOpen className="h-8 w-8 mb-2" />
                      <span>Validate Module Content</span>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Database Maintenance</h3>
                  <p className="text-muted-foreground mb-4">
                    Database tools for system maintenance and optimization
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Database tools will be available in a future update."
                      });
                    }}
                  >
                    Database Maintenance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}