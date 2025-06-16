import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Save, X } from "lucide-react";

interface ModuleEditButtonProps {
  module: any;
  className?: string;
}

export function ModuleEditButton({ module, className }: ModuleEditButtonProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedModule, setEditedModule] = useState(module);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if current user is the creator of this module
  const isCreator = user && module && (module.creatorId === user.id || user.isAdmin);

  // Save module mutation
  const saveModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      return apiRequest(`/api/modules/${module.id}`, {
        method: 'PATCH',
        data: {
          title: moduleData.title,
          description: moduleData.description,
          content: moduleData.content,
          category: moduleData.category,
          difficulty: moduleData.difficulty,
          duration: moduleData.duration
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Module Updated",
        description: "Your module has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules', module.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update module. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleOpenEdit = () => {
    setEditedModule({ ...module });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    saveModuleMutation.mutate(editedModule);
  };

  const updateField = (field: string, value: any) => {
    setEditedModule((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Don't render the button if user is not the creator
  if (!isCreator) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpenEdit}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        <Edit className="h-4 w-4" />
        Edit My Module
      </Button>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Module: {module.title}
            </DialogTitle>
            <DialogDescription>
              Make changes to your module content. These changes will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Module Title</Label>
                <Input 
                  id="module-title" 
                  value={editedModule.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-category">Category</Label>
                <Input 
                  id="module-category" 
                  value={editedModule.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module-description">Description</Label>
              <Textarea 
                id="module-description" 
                value={editedModule.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module-difficulty">Difficulty</Label>
                <select 
                  id="module-difficulty"
                  value={editedModule.difficulty || 'beginner'}
                  onChange={(e) => updateField('difficulty', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-duration">Duration (minutes)</Label>
                <Input 
                  id="module-duration"
                  type="number"
                  value={editedModule.duration || 15}
                  onChange={(e) => updateField('duration', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module-content">Module Content</Label>
              <Textarea 
                id="module-content" 
                value={editedModule.content || ''}
                onChange={(e) => updateField('content', e.target.value)}
                rows={10}
                placeholder="Enter your module content here..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saveModuleMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveModuleMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saveModuleMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}