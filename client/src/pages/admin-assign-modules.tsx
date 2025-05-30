import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  Search, 
  BookOpen,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  Send,
  CheckCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Teacher {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  points: number;
  level: number;
  lastActive: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  category: string;
  isRequired: boolean;
}

export default function AdminAssignModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/modules'],
    staleTime: 1000 * 60 * 5,
  });

  // Assignment mutation
  const assignModuleMutation = useMutation({
    mutationFn: async (assignmentData: {
      teacherIds: number[];
      moduleId: number;
      deadline?: string;
      priority: string;
    }) => {
      const response = await apiRequest('POST', '/api/admin/assign-modules', assignmentData);
      if (!response.ok) {
        throw new Error('Failed to assign modules');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Modules Assigned Successfully",
        description: `Module assigned to ${selectedTeachers.length} teacher(s)`,
      });
      setSelectedTeachers([]);
      setSelectedModule('');
      setDeadline('');
      setPriority('medium');
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the modules. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTeachers = teachers.filter((teacher: Teacher) =>
    teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(filteredTeachers.map((t: Teacher) => t.id));
    }
  };

  const handleAssignModule = () => {
    if (!selectedModule || selectedTeachers.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select both teachers and a module to assign.",
        variant: "destructive",
      });
      return;
    }

    assignModuleMutation.mutate({
      teacherIds: selectedTeachers,
      moduleId: parseInt(selectedModule),
      deadline: deadline || undefined,
      priority,
    });
  };

  const getTeacherLevelLabel = (level: number) => {
    if (level >= 5) return 'Master Lead';
    if (level >= 4) return 'Lead Teacher';
    if (level >= 3) return 'Experienced';
    if (level >= 2) return 'Teacher';
    return 'In Training';
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'bg-purple-100 text-purple-800';
    if (level >= 4) return 'bg-blue-100 text-blue-800';
    if (level >= 3) return 'bg-green-100 text-green-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/director-toolkit">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Toolkit
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Module Assigner</h1>
            <p className="text-muted-foreground">
              Assign training modules and set deadlines for your team
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teacher Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Teachers ({selectedTeachers.length} selected)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTeachers.length === filteredTeachers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            
            <CardContent className="max-h-96 overflow-y-auto">
              {teachersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="space-y-2 flex-1">
                        <div className="w-32 h-4 bg-muted rounded" />
                        <div className="w-20 h-3 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No teachers found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTeachers.map((teacher: Teacher) => (
                    <div
                      key={teacher.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeachers.includes(teacher.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleTeacherToggle(teacher.id)}
                    >
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => {}}
                      />
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.profilePicture} alt={teacher.firstName} />
                        <AvatarFallback>
                          {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                          <Badge className={`text-xs ${getLevelColor(teacher.level || 1)}`}>
                            {getTeacherLevelLabel(teacher.level || 1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{teacher.email}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActive(teacher.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Configuration */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Module Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Module</label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesLoading ? (
                      <SelectItem value="loading" disabled>Loading modules...</SelectItem>
                    ) : modules.length === 0 ? (
                      <SelectItem value="none" disabled>No modules available</SelectItem>
                    ) : (
                      modules.map((module: Module) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          <div className="flex flex-col">
                            <span>{module.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {module.duration}min • {module.difficulty}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm font-medium mb-2 block">Deadline (Optional)</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Summary */}
              {selectedTeachers.length > 0 && selectedModule && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Assignment Summary</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Teachers: {selectedTeachers.length} selected</li>
                    <li>Module: {modules.find((m: Module) => m.id.toString() === selectedModule)?.title}</li>
                    {deadline && <li>Deadline: {new Date(deadline).toLocaleDateString()}</li>}
                    <li>Priority: {priority.charAt(0).toUpperCase() + priority.slice(1)}</li>
                  </ul>
                </div>
              )}

              {/* Assign Button */}
              <Button
                onClick={handleAssignModule}
                disabled={!selectedModule || selectedTeachers.length === 0 || assignModuleMutation.isPending}
                className="w-full"
              >
                {assignModuleMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Assign Module
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}