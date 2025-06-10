import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Building, 
  Globe, 
  Send, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  Clock,
  Target,
  Share2,
  BookOpen,
  Award,
  Heart,
  MessageSquare,
  Search,
  Filter,
  X
} from 'lucide-react';

interface PublishingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: {
    id?: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedTime: string;
    customPoints?: string;
    shareWithCommunity?: boolean;
    moduleType?: string;
    sections: any[];
    courseStructure?: any;
    interactiveElements?: any;
    certificationSystem?: any;
  };
  onPublishSuccess: () => void;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolName?: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
}

export default function ModulePublishingDialog({ 
  isOpen, 
  onClose, 
  module, 
  onPublishSuccess 
}: PublishingDialogProps) {
  const [publishingType, setPublishingType] = useState<'individual' | 'group' | 'section' | 'community'>('individual');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInLibrary, setIncludeInLibrary] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: publishingType === 'individual' && isOpen
  });

  // Fetch available groups
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    enabled: publishingType === 'group' && isOpen
  });

  const publishMutation = useMutation({
    mutationFn: async (publishData: any) => {
      return await apiRequest('/api/modules/publish', {
        method: 'POST',
        data: publishData
      });
    },
    onSuccess: () => {
      toast({
        title: "Module Published Successfully!",
        description: "Your module has been distributed to the selected recipients.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      onPublishSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Publishing Failed",
        description: error.message || "Failed to publish module. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePublish = async () => {
    setIsPublishing(true);
    
    const publishData = {
      moduleId: module.id,
      module: {
        ...module,
        moduleType: module.moduleType || "deep-dive",
        customPoints: module.customPoints || "100",
        shareWithCommunity: module.shareWithCommunity || false,
        courseStructure: module.courseStructure || { modules: [], totalDuration: 0, prerequisites: [] },
        interactiveElements: module.interactiveElements || { hasQuizzes: false, hasSimulations: false, hasDiscussions: false },
        certificationSystem: module.certificationSystem || { enabled: false, passingScore: 80, certificateTemplate: null }
      },
      type: publishingType,
      selectedTeachers,
      selectedGroups,
      customMessage,
      includeInLibrary,
      allowComments,
      publishToSection: publishingType === 'section',
      publishToCommunity: publishingType === 'community'
    };

    try {
      await publishMutation.mutateAsync(publishData);
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher: Teacher) =>
    `${teacher.firstName} ${teacher.lastName} ${teacher.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group: Group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Publish Module: {module.title}
          </DialogTitle>
          <DialogDescription>
            Choose how you want to distribute your module to educators
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={publishingType} onValueChange={(value: any) => setPublishingType(value)} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Individual Teachers
              </TabsTrigger>
              <TabsTrigger value="group" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="section" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Module Section
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Community
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 h-[calc(100%-2rem)] overflow-hidden">
              <TabsContent value="individual" className="h-full overflow-hidden">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Send to Individual Teachers
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <Input
                        placeholder="Search teachers by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {filteredTeachers.map((teacher: Teacher) => (
                          <div
                            key={teacher.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedTeachers.includes(teacher.id) ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => toggleTeacherSelection(teacher.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedTeachers.includes(teacher.id)}
                                onChange={() => toggleTeacherSelection(teacher.id)}
                              />
                              <div>
                                <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                                <div className="text-sm text-gray-500">{teacher.email}</div>
                                {teacher.schoolName && (
                                  <div className="text-xs text-gray-400">{teacher.schoolName}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="mt-4">
                      <Badge variant="outline">
                        {selectedTeachers.length} teacher{selectedTeachers.length !== 1 ? 's' : ''} selected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="group" className="h-full overflow-hidden">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Send to Groups
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <Input
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {filteredGroups.map((group: Group) => (
                          <div
                            key={group.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedGroups.includes(group.id) ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => toggleGroupSelection(group.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedGroups.includes(group.id)}
                                onChange={() => toggleGroupSelection(group.id)}
                              />
                              <div>
                                <div className="font-medium">{group.name}</div>
                                <div className="text-sm text-gray-500">{group.description}</div>
                                <div className="text-xs text-gray-400">{group.memberCount} members</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="mt-4">
                      <Badge variant="outline">
                        {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="section" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Publish to Module Section
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Make available in Module Library</div>
                          <div className="text-sm text-gray-600">
                            Your module will be added to the searchable module library where all educators can discover and use it.
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allow-comments">Allow Comments & Ratings</Label>
                          <Switch
                            id="allow-comments"
                            checked={allowComments}
                            onCheckedChange={setAllowComments}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="community" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Share with Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                        <Heart className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Community Contribution</div>
                          <div className="text-sm text-gray-600">
                            Share your expertise with the global early childhood education community. Your module will be publicly available and may be featured.
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="include-library">Include in Module Library</Label>
                          <Switch
                            id="include-library"
                            checked={includeInLibrary}
                            onCheckedChange={setIncludeInLibrary}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="community-comments">Allow Community Comments</Label>
                          <Switch
                            id="community-comments"
                            checked={allowComments}
                            onCheckedChange={setAllowComments}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Add a personal message to accompany your module..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Module: <span className="font-medium">{module.title}</span> • 
              Category: <span className="font-medium">{module.category}</span> • 
              Sections: <span className="font-medium">{module.sections.length}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isPublishing || (publishingType === 'individual' && selectedTeachers.length === 0) || (publishingType === 'group' && selectedGroups.length === 0)}
              >
                {isPublishing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Module
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}