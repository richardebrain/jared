import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Search, CheckCircle2, XCircle, Edit, AlertTriangle, Save, Loader2, Plus, PlusCircle, Trash2, Video, Image, Brain } from 'lucide-react';

// Interface for module data
interface ModuleSection {
  title: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  customPoints?: string;
  pointValue: number;
  is_visible: boolean;
  sections: ModuleSection[];
}

const AdminModulesPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  // Default value for a new section when adding
  const defaultNewSection = {
    title: 'New Section',
    content: '',
    videoUrl: '',
    imageUrl: ''
  };
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  
  // Fetch all modules including hidden ones
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules/management']
  });
  
  // Fetch a single module for editing
  const getModuleQuery = useQuery({
    queryKey: ['/api/modules', editingModule?.id],
    enabled: !!editingModule?.id,
  });

  // Handle module data when it's fetched
  React.useEffect(() => {
    if (getModuleQuery.data) {
      setEditingModule(getModuleQuery.data);
    }
  }, [getModuleQuery.data]);
  
  // Update module visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ moduleId, visible }: { moduleId: number, visible: boolean }) => {
      try {
        return await apiRequest('PATCH', `/api/modules/${moduleId}/visibility`, { visible });
      } catch (error) {
        console.error('Error updating module visibility:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      toast({
        title: 'Module Updated',
        description: 'Module visibility has been successfully updated.',
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the module. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Update module content mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (module: Module) => {
      try {
        return await apiRequest('PATCH', `/api/modules/${module.id}`, module);
      } catch (error) {
        console.error('Error updating module:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] });
      setIsEditDialogOpen(false);
      setEditingModule(null);
      setIsUpdatingModule(false);
      toast({
        title: 'Module Updated Successfully',
        description: 'Module content has been updated.',
      });
    },
    onError: (error) => {
      setIsUpdatingModule(false);
      console.error('Update module error:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the module. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle visibility toggle
  const handleVisibilityChange = (moduleId: number, currentVisible: boolean) => {
    updateVisibilityMutation.mutate({
      moduleId,
      visible: !currentVisible
    });
  };
  
  // Handle opening the edit dialog
  const handleEditClick = (module: Module) => {
    // Create a deep copy to avoid referencing the same object
    const moduleCopy = JSON.parse(JSON.stringify(module));
    
    // Ensure all required fields are present
    if (!moduleCopy.customPoints) {
      moduleCopy.customPoints = "0";
    }
    
    // Ensure sections array exists
    if (!moduleCopy.sections || !Array.isArray(moduleCopy.sections)) {
      moduleCopy.sections = [{ 
        title: 'New Section',
        content: '',
        videoUrl: '',
        imageUrl: ''
      }];
    }
    
    setEditingModule(moduleCopy);
    setIsEditDialogOpen(true);
  };
  
  // Handle saving module changes
  const handleSaveModuleChanges = () => {
    if (editingModule) {
      setIsUpdatingModule(true);
      updateModuleMutation.mutate(editingModule);
    }
  };
  
  // Handle updating module fields
  const updateModuleField = (field: string, value: string) => {
    if (editingModule) {
      setEditingModule({
        ...editingModule,
        [field]: value
      });
    }
  };
  
  // Handle updating section fields
  const updateSectionField = (sectionIndex: number, field: string, value: string) => {
    if (editingModule) {
      const currentSections = editingModule.sections || [];
      
      if (currentSections[sectionIndex]) {
        const updatedSections = [...currentSections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          [field]: value
        };
        
        setEditingModule({
          ...editingModule,
          sections: updatedSections
        });
      }
    }
  };
  
  // Add a new section
  const addNewSection = () => {
    if (editingModule) {
      // Make sure sections exists, if not create an empty array
      const currentSections = editingModule.sections || [];
      
      setEditingModule({
        ...editingModule,
        sections: [...currentSections, defaultNewSection]
      });
    }
  };
  
  // Remove a section
  const removeSection = (index: number) => {
    if (editingModule) {
      const currentSections = editingModule.sections || [];
      
      if (currentSections.length > 1) {
        const updatedSections = currentSections.filter((_, i) => i !== index);
        
        setEditingModule({
          ...editingModule,
          sections: updatedSections
        });
      } else {
        toast({
          title: "Cannot Remove Section",
          description: "A module must have at least one section.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Search/filter modules
  const filteredModules = (modules && Array.isArray(modules)) ? modules.filter((module: Module) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      module.title.toLowerCase().includes(term) ||
      module.description.toLowerCase().includes(term) ||
      module.category.toLowerCase().includes(term)
    );
  }) : [];
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loading Module Management</h3>
                <p className="text-muted-foreground">Please wait while we fetch all modules...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Modules</h3>
                <p className="text-muted-foreground">
                  There was a problem fetching the modules. Please try again later.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/modules/management'] })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-auto"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">Control which modules are visible to teachers</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Admin Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Module Visibility Controls</CardTitle>
          <CardDescription>
            Toggle modules on or off to control what content is available to your teachers.
            Hidden modules won't appear in the learning dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search modules by title, description, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                {!modules || !Array.isArray(modules) || modules.length === 0
                  ? 'No modules found in the system.'
                  : filteredModules.length === 0
                    ? 'No modules match your search criteria.'
                    : `Showing ${filteredModules.length} of ${modules.length} total modules.`
                }
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules?.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-mono">{module.id}</TableCell>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell>{module.category}</TableCell>
                    <TableCell>
                      <Badge variant={
                        module.difficulty === 'beginner' ? 'default' : 
                        module.difficulty === 'intermediate' ? 'secondary' : 
                        'destructive'
                      }>
                        {module.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{module.pointValue}</TableCell>
                    <TableCell className="text-center">
                      {module.is_visible ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> 
                          Visible
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" /> 
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={module.is_visible}
                        onCheckedChange={() => handleVisibilityChange(module.id, module.is_visible)}
                        disabled={updateVisibilityMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditClick(module)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Note: Changes to module visibility take effect immediately for all users.
          </div>
        </CardFooter>
      </Card>
      
      {/* Module Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingModule(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Module
            </DialogTitle>
            <DialogDescription>
              Make changes to the module content. These changes will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          
          {editingModule ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-module-title">Module Title</Label>
                  <Input 
                    id="edit-module-title" 
                    value={editingModule.title}
                    onChange={(e) => updateModuleField('title', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-module-category">Category</Label>
                  <Select 
                    value={editingModule.category}
                    onValueChange={(value) => updateModuleField('category', value)}
                  >
                    <SelectTrigger id="edit-module-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom-management">Classroom Management</SelectItem>
                      <SelectItem value="child-development">Child Development</SelectItem>
                      <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="family-engagement">Family Engagement</SelectItem>
                      <SelectItem value="professional-development">Professional Development</SelectItem>
                      <SelectItem value="health-safety">Health & Safety</SelectItem>
                      <SelectItem value="special-needs">Special Needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-module-difficulty">Difficulty Level</Label>
                  <Select 
                    value={editingModule.difficulty}
                    onValueChange={(value) => updateModuleField('difficulty', value)}
                  >
                    <SelectTrigger id="edit-module-difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-module-time">Estimated Time (minutes)</Label>
                  <Input 
                    id="edit-module-time" 
                    type="number" 
                    value={editingModule.estimatedTime}
                    onChange={(e) => updateModuleField('estimatedTime', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-module-points">Custom Points</Label>
                  <Input 
                    id="edit-module-points" 
                    type="number" 
                    value={editingModule.customPoints || "0"}
                    onChange={(e) => updateModuleField('customPoints', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-module-description">Description</Label>
                  <Textarea 
                    id="edit-module-description" 
                    value={editingModule.description}
                    onChange={(e) => updateModuleField('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Module Sections</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addNewSection}
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Section
                  </Button>
                </div>
                
                <Accordion type="multiple" className="w-full">
                  {editingModule.sections.map((section, index) => (
                    <AccordionItem value={`section-${index}`} key={index}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex w-full items-center justify-between pr-4">
                          <span className="text-sm font-medium">
                            {section.title || `Section ${index + 1}`}
                          </span>
                          {editingModule.sections.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSection(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor={`section-${index}-title`}>Section Title</Label>
                            <Input 
                              id={`section-${index}-title`} 
                              value={section.title}
                              onChange={(e) => updateSectionField(index, 'title', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`section-${index}-content`}>Content</Label>
                            <Textarea 
                              id={`section-${index}-content`} 
                              value={section.content}
                              onChange={(e) => updateSectionField(index, 'content', e.target.value)}
                              rows={6}
                              placeholder="Module content - supports Markdown formatting"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label 
                                htmlFor={`section-${index}-video`}
                                className="flex items-center gap-1"
                              >
                                <Video className="h-4 w-4 text-blue-500" />
                                Video URL
                              </Label>
                              <Input 
                                id={`section-${index}-video`} 
                                value={section.videoUrl}
                                onChange={(e) => updateSectionField(index, 'videoUrl', e.target.value)}
                                placeholder="YouTube URL or video ID"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label 
                                htmlFor={`section-${index}-image`}
                                className="flex items-center gap-1"
                              >
                                <Image className="h-4 w-4 text-blue-500" />
                                Image URL
                              </Label>
                              <Input 
                                id={`section-${index}-image`} 
                                value={section.imageUrl}
                                onChange={(e) => updateSectionField(index, 'imageUrl', e.target.value)}
                                placeholder="Image URL"
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdatingModule}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveModuleChanges}
              disabled={isUpdatingModule}
              className="ml-2"
            >
              {isUpdatingModule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModulesPage;