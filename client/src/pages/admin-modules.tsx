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
import { ArrowLeft, Search, CheckCircle2, XCircle, Edit, AlertTriangle, Save, Loader2, Plus, PlusCircle, Trash2, Video, Image } from 'lucide-react';

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  
  // Fetch all modules including hidden ones
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules/management'],
    onError: (err) => {
      toast({
        title: 'Error fetching modules',
        description: 'There was a problem retrieving modules. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
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
  
  // Handle visibility toggle
  const handleVisibilityChange = (moduleId: number, currentVisible: boolean) => {
    updateVisibilityMutation.mutate({
      moduleId,
      visible: !currentVisible
    });
  };
  
  // Search/filter modules
  const filteredModules = modules?.filter((module) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      module.title.toLowerCase().includes(term) ||
      module.description.toLowerCase().includes(term) ||
      module.category.toLowerCase().includes(term)
    );
  });
  
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
                {!modules?.length
                  ? 'No modules found in the system.'
                  : !filteredModules?.length
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
                      <Button size="sm" variant="ghost">
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
    </div>
  );
};

export default AdminModulesPage;