import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Users, 
  CheckCircle, 
  RotateCcw, 
  ShieldAlert, 
  BookOpen, 
  Heart, 
  Crown, 
  Medal,
  Star,
  ChevronRight,
  Search,
  UserX,
  Briefcase,
  BarChart2,
  AreaChart,
  Database,
  School,
  FileEdit,
  UserPlus,
  Settings,
  Coins,
  TrendingUp,
  RefreshCw,
  Plus,
  Save,
  Image,
  Video,
  X,
  Trash2,
  PlusCircle,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Admin Dashboard Component
 * 
 * This page provides administrators with tools to:
 * - View all users and their progress
 * - Reset points and progress for users
 * - View aggregate statistics and metrics
 * - Manage Core Values shout-outs
 */
export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [eosData, setEosData] = useState<any[]>([]);
  const [eosLoading, setEosLoading] = useState(false);
  
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

  // Fetch EOS data function
  const fetchEOSData = async () => {
    setEosLoading(true);
    try {
      // In a real implementation, this would fetch from Google Sheets API
      // For now we'll use sample data
      const sampleEOSData = [
        { 
          Metric: "Enrollment Rate", 
          Target: "90%", 
          Current: "87%", 
          Status: "🟡 Near Target",
          Owner: "Lisa M."
        },
        { 
          Metric: "Teacher Retention", 
          Target: "85%", 
          Current: "92%", 
          Status: "🟢 Above Target",
          Owner: "Jared C."
        },
        { 
          Metric: "Parent Satisfaction", 
          Target: "4.5/5", 
          Current: "4.7/5", 
          Status: "🟢 Above Target",
          Owner: "Maria L."
        },
        { 
          Metric: "Budget Variance", 
          Target: "<2%", 
          Current: "1.8%", 
          Status: "🟢 On Target",
          Owner: "Robbie D."
        },
        { 
          Metric: "Staff Training", 
          Target: "100%", 
          Current: "78%", 
          Status: "🔴 Below Target",
          Owner: "Lisa M."
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setEosData(sampleEOSData);
      
      toast({
        title: "EOS Data Refreshed",
        description: "Successfully loaded the latest EOS metrics",
      });
    } catch (error) {
      console.error("Error fetching EOS data:", error);
      toast({
        title: "Error Loading EOS Data",
        description: "Failed to fetch the latest EOS metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEosLoading(false);
    }
  };

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Fetch all core values shout-outs
  const { data: shoutOuts = [], isLoading: shoutOutsLoading } = useQuery({
    queryKey: ['/api/core-values/all'],
    enabled: !!user,
  });

  // Reset user points mutation
  const resetPointsMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('/api/admin/reset-user-points', {
        method: 'POST',
        data: { userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Points Reset",
        description: "User points have been reset successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error resetting points:', error);
      toast({
        title: "Error",
        description: "Failed to reset user points. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Reset user progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('/api/admin/reset-user-progress', {
        method: 'POST',
        data: { userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Progress Reset",
        description: "User progress has been reset successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error resetting progress:', error);
      toast({
        title: "Error",
        description: "Failed to reset user progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
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
    }
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate statistics
  const totalUsers = users.length;
  const totalPoints = users.reduce((sum: number, user: any) => sum + (user.points || 0), 0);
  const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
  const totalShoutOuts = shoutOuts.length;

  // Get top users by points
  const topUsers = [...users]
    .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  // Handle reset confirmations
  const handleResetPoints = (userId: number) => {
    resetPointsMutation.mutate(userId);
    setSelectedUser(null);
  };

  const handleResetProgress = (userId: number) => {
    resetProgressMutation.mutate(userId);
    setSelectedUser(null);
  };
  
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
  
  // Fetch EOS data when component mounts
  useEffect(() => {
    if (user?.isAdmin) {
      fetchEOSData();
    }
  }, [user]);

  // Function to fetch EOS data from Google Sheets
  const fetchEOSData = async () => {
    try {
      setEosLoading(true);
      // Google Sheets URL as provided by the user
      const googleSheetsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWfTtWjkrs64yp_BglYDBl0HCUrnSoCJiVrGueitr0GJ8mXhsXi2d7WG_6LsouKo8ISnuUuNiVl3On/pubhtml";
      
      // Parse it to get the raw data
      const response = await fetch(googleSheetsUrl);
      const htmlText = await response.text();
      
      // Process the HTML to extract the table data
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const tables = doc.querySelectorAll('table');
      
      if (tables.length > 0) {
        const mainTable = tables[0];
        const rows = mainTable.querySelectorAll('tr');
        const data = [];
        
        // Extract header from first row
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('td')).map(cell => cell.textContent?.trim() || '');
        
        // Extract data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const cells = row.querySelectorAll('td');
          const rowData = {};
          
          for (let j = 0; j < headers.length; j++) {
            if (j < cells.length) {
              rowData[headers[j]] = cells[j].textContent?.trim() || '';
            }
          }
          
          data.push(rowData);
        }
        
        setEosData(data);
      }
      
      toast({
        title: "EOS Data Updated",
        description: "The EOS data has been successfully updated from Google Sheets.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error fetching EOS data:', error);
      toast({
        title: "Error",
        description: "Failed to load EOS data from Google Sheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEosLoading(false);
    }
  };

  if (usersLoading) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <ShieldAlert className="h-12 w-12 text-muted-foreground animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Loading Admin Dashboard</h3>
                <p className="text-muted-foreground">Please wait while we load the dashboard data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, track progress, and monitor system health.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-1">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Return to Teacher Dashboard
          </Button>
        </Link>
      </div>

      {/* Owner Toolkit Section */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Owner Toolkit
            </CardTitle>
            <CardDescription>
              Quick access to owner-specific tools and resources
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                const tabElement = document.querySelector('[value="eos"]');
                if (tabElement) {
                  (tabElement as HTMLElement).click();
                } else {
                  console.log("EOS tab element not found");
                }
              }}
            >
              <BarChart2 className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-medium">EOS Tools</div>
                <div className="text-xs text-muted-foreground">Access Entrepreneurial Operating System metrics</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2"
            >
              <AreaChart className="h-8 w-8 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">Business Analytics</div>
                <div className="text-xs text-muted-foreground">View school performance metrics</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2"
            >
              <Database className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Connect Data Sources</div>
                <div className="text-xs text-muted-foreground">Add external systems integration</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                const tabElement = document.querySelector('[value="module-creator"]');
                if (tabElement) {
                  (tabElement as HTMLElement).click();
                } else {
                  console.log("Module Creator tab element not found");
                }
              }}
            >
              <FileEdit className="h-8 w-8 text-orange-600" />
              <div className="text-center">
                <div className="font-medium">Module Creator</div>
                <div className="text-xs text-muted-foreground">Create custom training modules</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active teachers in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Points earned across all users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePoints}</div>
            <p className="text-xs text-muted-foreground">
              Average points per teacher
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shout-outs</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShoutOuts}</div>
            <p className="text-xs text-muted-foreground">
              Core Values recognitions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="shoutouts">Core Values Shout-outs</TabsTrigger>
          <TabsTrigger value="eos">EOS Tools</TabsTrigger>
          <TabsTrigger value="module-creator">Module Creator</TabsTrigger>
          <TabsTrigger value="director">Director View</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">User</th>
                      <th className="p-2 text-left font-medium">Points</th>
                      <th className="p-2 text-left font-medium">Level</th>
                      <th className="p-2 text-left font-medium">Assessment</th>
                      <th className="p-2 text-left font-medium">Bear Bucks</th>
                      <th className="p-2 text-left font-medium">Access</th>
                      <th className="p-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.profilePicture || undefined} alt={user.firstName} />
                              <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-primary">
                            {user.points || 0} pts
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge>
                            Level {user.level || 1}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={
                            user.teacherLevel === "Master Lead Teacher" ? "default" :
                            user.teacherLevel === "Lead Teacher" ? "secondary" :
                            user.teacherLevel === "Assistant Teacher" ? "outline" : "outline"
                          } className={
                            user.teacherLevel === "Master Lead Teacher" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                            user.teacherLevel === "Lead Teacher" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                            user.teacherLevel === "Assistant Teacher" ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : ""
                          }>
                            {user.teacherLevel || "Not Assessed"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-amber-600">
                            {user.bearBucks || 0} Bear Bucks
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id={`director-${user.id}`} 
                                checked={user.isAdmin} 
                                onCheckedChange={() => console.log('Toggle director access for', user.id)}
                              />
                              <Label htmlFor={`director-${user.id}`} className="text-sm text-muted-foreground">
                                Director
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                id={`owner-${user.id}`} 
                                checked={user.isOwner} 
                                onCheckedChange={() => console.log('Toggle owner access for', user.id)}
                              />
                              <Label htmlFor={`owner-${user.id}`} className="text-sm text-muted-foreground">
                                Owner
                              </Label>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reset Points
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Points</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset points for {user.firstName} {user.lastName}? 
                                    This will set their points to zero.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetPoints(user.id)}
                                  >
                                    Reset Points
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <Coins className="h-3.5 w-3.5" />
                                  Reset Bear Bucks
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Bear Bucks</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset Bear Bucks for {user.firstName} {user.lastName}? 
                                    This will set their Bear Bucks to zero.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => console.log('Reset Bear Bucks for', user.id)}
                                  >
                                    Reset Bear Bucks
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  Assign Modules
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Training Modules</DialogTitle>
                                  <DialogDescription>
                                    Assign specific training modules to {user.firstName} {user.lastName}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid gap-4">
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={`core-module-${user.id}`} defaultChecked />
                                      <label htmlFor={`core-module-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Raising Arizona's CORE Values
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={`chapter-one-${user.id}`} defaultChecked />
                                      <label htmlFor={`chapter-one-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Chapter 1: Building a Human
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={`mindful-morning-${user.id}`} />
                                      <label htmlFor={`mindful-morning-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Mindful Morning
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Checkbox id={`classroom-mgmt-${user.id}`} />
                                      <label htmlFor={`classroom-mgmt-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Classroom Management
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" onClick={() => toast({ description: "Modules assigned successfully" })}>Save Assignments</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <FileEdit className="h-3.5 w-3.5" />
                                  Assign Modules
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Assign Modules</DialogTitle>
                                  <DialogDescription>
                                    Select modules to assign to {user.firstName} {user.lastName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`core-module-${user.id}`}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <label htmlFor={`core-module-${user.id}`}>
                                        Raising Arizona's CORE
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`chapter-one-${user.id}`}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <label htmlFor={`chapter-one-${user.id}`}>
                                        Chapter 1: Building a Human
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`mindful-mornings-${user.id}`}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <label htmlFor={`mindful-mornings-${user.id}`}>
                                        Mindful Mornings
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" onClick={() => console.log('Assigned modules to', user.id)}>
                                    Assign Modules
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  Reset Progress
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset All Progress</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset all progress for {user.firstName} {user.lastName}? 
                                    This will remove all module progress, reset points to zero, and reset their streak.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetProgress(user.id)}
                                  >
                                    Reset All Progress
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Top teachers by points earned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topUsers.map((user: any, index: number) => (
                  <div key={user.id} className="flex items-center">
                    <div className="flex items-center justify-center w-10">
                      {index === 0 ? (
                        <Crown className="h-6 w-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-6 w-6 text-slate-400" />
                      ) : index === 2 ? (
                        <Medal className="h-6 w-6 text-amber-700" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profilePicture || undefined} alt={user.firstName} />
                            <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium leading-none">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Sparkles className="mr-1 h-4 w-4 text-primary" />
                          <p className="text-sm font-bold">{user.points || 0}</p>
                        </div>
                      </div>
                      <Progress value={(user.points / (topUsers[0]?.points || 100)) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Core Values Shout-outs Tab */}
        <TabsContent value="shoutouts">
          <Card>
            <CardHeader>
              <CardTitle>Core Values Shout-outs</CardTitle>
              <CardDescription>
                Review all Core Values recognitions in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shoutOutsLoading ? (
                <div className="py-8 text-center">
                  <p>Loading shout-outs...</p>
                </div>
              ) : shoutOuts.length === 0 ? (
                <Alert>
                  <AlertTitle>No shout-outs yet</AlertTitle>
                  <AlertDescription>
                    There are no Core Values shout-outs in the system yet. Users can recognize each other for demonstrating core values.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {shoutOuts.map((shoutOut: any) => {
                    const nominator = users.find((u: any) => u.id === shoutOut.nominatorId);
                    const nominee = users.find((u: any) => u.id === shoutOut.nomineeId);
                    
                    return (
                      <Card key={shoutOut.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={nominee?.profilePicture || undefined} alt={nominee?.firstName} />
                                <AvatarFallback>{nominee?.firstName?.charAt(0) || '?'}{nominee?.lastName?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Badge className="mb-2">{shoutOut.coreValue}</Badge>
                                  <h4 className="text-sm font-semibold">
                                    {nominee?.firstName} {nominee?.lastName} was recognized by {nominator?.firstName} {nominator?.lastName}
                                  </h4>
                                </div>
                                <div>
                                  <Badge variant="outline" className="text-primary">
                                    +{shoutOut.pointsAwarded} pts
                                  </Badge>
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {shoutOut.description}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {new Date(shoutOut.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* EOS Tools Tab */}
        <TabsContent value="eos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span>EOS Tools Dashboard</span>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={fetchEOSData}
                  disabled={eosLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${eosLoading ? 'animate-spin' : ''}`} />
                  {eosLoading ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </CardTitle>
              <CardDescription>
                Access and manage your Entrepreneurial Operating System (EOS) tools and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eosLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <BarChart2 className="h-8 w-8 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground">Loading EOS data...</p>
                  </div>
                </div>
              ) : eosData.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <AreaChart className="h-5 w-5 text-green-600" />
                      Raising Arizona EOS Metrics
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            {Object.keys(eosData[0] || {}).map((header, index) => (
                              <th key={index} className="text-left p-2 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {eosData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b">
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="p-2">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 flex-col md:flex-row">
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">EOS Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button className="w-full justify-start" variant="outline">
                            <span className="mr-2">📋</span> Weekly L10 Meeting
                          </Button>
                          <Button className="w-full justify-start" variant="outline">
                            <span className="mr-2">🎯</span> Rocks Dashboard
                          </Button>
                          <Button className="w-full justify-start" variant="outline">
                            <span className="mr-2">💡</span> Issues List
                          </Button>
                          <Button className="w-full justify-start" variant="outline">
                            <span className="mr-2">📊</span> Scorecard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button className="w-full justify-start">
                            <span className="mr-2">📥</span> Export EOS Data
                          </Button>
                          <Button className="w-full justify-start">
                            <span className="mr-2">📤</span> Import Scorecard
                          </Button>
                          <Button className="w-full justify-start">
                            <span className="mr-2">📆</span> Schedule L10 Meeting
                          </Button>
                          <Button className="w-full justify-start">
                            <span className="mr-2">🔍</span> Review Core Values
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <BarChart2 className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No EOS Data Available</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Click the refresh button to load your EOS data from Google Sheets.
                  </p>
                  <Button onClick={fetchEOSData} className="mx-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load EOS Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Creator Tab */}
        <TabsContent value="module-creator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-orange-500" />
                  <span>Custom Module Creator</span>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleCreateModule}
                  disabled={isCreatingModule}
                  className="flex items-center gap-1"
                >
                  {isCreatingModule ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Module</span>
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Create custom training modules for your teachers. These modules will appear in their dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Module Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Module Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-title">Module Title</Label>
                      <Input 
                        id="module-title" 
                        placeholder="Enter a concise, descriptive title" 
                        value={newModule.title}
                        onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="module-category">Category</Label>
                      <Select 
                        value={newModule.category}
                        onValueChange={(value) => setNewModule({...newModule, category: value})}
                      >
                        <SelectTrigger id="module-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classroom-management">Classroom Management</SelectItem>
                          <SelectItem value="child-development">Child Development</SelectItem>
                          <SelectItem value="curriculum-planning">Curriculum Planning</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="family-engagement">Family Engagement</SelectItem>
                          <SelectItem value="health-safety">Health & Safety</SelectItem>
                          <SelectItem value="inclusion">Inclusion & Diversity</SelectItem>
                          <SelectItem value="professional-development">Professional Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="module-difficulty">Difficulty Level</Label>
                      <Select 
                        value={newModule.difficulty}
                        onValueChange={(value) => setNewModule({...newModule, difficulty: value})}
                      >
                        <SelectTrigger id="module-difficulty">
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
                      <Label htmlFor="module-time">Estimated Time (minutes)</Label>
                      <Input 
                        id="module-time" 
                        type="number" 
                        placeholder="15" 
                        value={newModule.estimatedTime}
                        onChange={(e) => setNewModule({...newModule, estimatedTime: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="module-description">Description</Label>
                    <Textarea 
                      id="module-description" 
                      placeholder="Provide a brief description of what teachers will learn in this module"
                      className="min-h-[100px]"
                      value={newModule.description}
                      onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Module Sections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Module Sections</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addModuleSection}
                      className="gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Section
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {newModule.sections.map((section, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                              <Input
                                id={`section-title-${index}`}
                                value={section.title}
                                onChange={(e) => updateModuleSection(index, 'title', e.target.value)}
                                placeholder="Section Title"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => removeModuleSection(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`section-content-${index}`}>Content</Label>
                            <Textarea
                              id={`section-content-${index}`}
                              value={section.content}
                              onChange={(e) => updateModuleSection(index, 'content', e.target.value)}
                              placeholder="Enter the content for this section (Markdown formatting supported)"
                              className="min-h-[150px]"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`section-video-${index}`} className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-blue-500" />
                                Video URL (YouTube)
                              </Label>
                              <Input
                                id={`section-video-${index}`}
                                value={section.videoUrl}
                                onChange={(e) => updateModuleSection(index, 'videoUrl', e.target.value)}
                                placeholder="e.g., https://www.youtube.com/watch?v=..."
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`section-image-${index}`} className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-green-500" />
                                Image URL
                              </Label>
                              <Input
                                id={`section-image-${index}`}
                                value={section.imageUrl}
                                onChange={(e) => updateModuleSection(index, 'imageUrl', e.target.value)}
                                placeholder="e.g., https://example.com/image.jpg"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* Preview Section */}
                <Card className="bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Module Preview</CardTitle>
                    <CardDescription>
                      This is how your module will appear to teachers in their dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{newModule.title || "Module Title"}</h3>
                          <p className="text-sm text-gray-500">{newModule.description || "Module description will appear here."}</p>
                          
                          <div className="flex items-center gap-2 my-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {newModule.category === 'classroom-management' ? 'Classroom Management' :
                               newModule.category === 'child-development' ? 'Child Development' :
                               newModule.category === 'curriculum-planning' ? 'Curriculum Planning' :
                               newModule.category === 'assessment' ? 'Assessment' :
                               newModule.category === 'family-engagement' ? 'Family Engagement' :
                               newModule.category === 'health-safety' ? 'Health & Safety' :
                               newModule.category === 'inclusion' ? 'Inclusion & Diversity' :
                               'Professional Development'}
                            </Badge>
                            <Badge variant="outline" className={
                              newModule.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                              newModule.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }>
                              {newModule.difficulty === 'beginner' ? 'Beginner' :
                               newModule.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {newModule.estimatedTime} min
                            </span>
                          </div>
                        </div>
                        <div className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md text-sm">
                          {calculatePoints(newModule.estimatedTime, newModule.difficulty)} points
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Sections:</p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {newModule.sections.map((section, index) => (
                            <li key={index}>{section.title || `Section ${index + 1}`}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Director View Tab */}
        <TabsContent value="director" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Director Dashboard</CardTitle>
              <CardDescription>
                Limited access dashboard for directors showing only essential tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <Alert className="bg-yellow-50 border-yellow-100">
                  <AlertTitle className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Director Access Mode
                  </AlertTitle>
                  <AlertDescription>
                    This view shows what directors will see when they log in with director privileges. 
                    Directors only have access to teacher data and EOS tools.
                  </AlertDescription>
                </Alert>

                {/* Teacher Overview Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Teacher Overview</h3>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">Teacher</th>
                          <th className="p-2 text-left font-medium">Assessment Level</th>
                          <th className="p-2 text-left font-medium">Last Active</th>
                          <th className="p-2 text-left font-medium">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user: any) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.profilePicture || undefined} alt={user.firstName} />
                                  <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant={
                                user.teacherLevel === "Master Lead Teacher" ? "default" :
                                user.teacherLevel === "Lead Teacher" ? "secondary" :
                                user.teacherLevel === "Assistant Teacher" ? "outline" : "outline"
                              } className={
                                user.teacherLevel === "Master Lead Teacher" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                user.teacherLevel === "Lead Teacher" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                                user.teacherLevel === "Assistant Teacher" ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : ""
                              }>
                                {user.teacherLevel || "Not Assessed"}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="text-sm">
                                {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "Never"}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Progress value={user.level * 20} className="h-2 w-24" />
                                <span className="text-sm">Level {user.level || 1}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* EOS Data Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <AreaChart className="h-5 w-5 text-green-600" />
                    EOS Metrics Dashboard
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium">Enrollment</div>
                              <div className="text-sm text-green-600 font-medium">87%</div>
                            </div>
                            <Progress value={87} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium">Teacher Retention</div>
                              <div className="text-sm text-green-600 font-medium">92%</div>
                            </div>
                            <Progress value={92} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium">Parent Satisfaction</div>
                              <div className="text-sm text-green-600 font-medium">94%</div>
                            </div>
                            <Progress value={94} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium">Staff Training</div>
                              <div className="text-sm text-red-600 font-medium">78%</div>
                            </div>
                            <Progress value={78} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BarChart2 className="h-4 w-4 text-blue-600" />
                          Weekly Rocks Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm pb-1 border-b">
                            <div className="font-medium">Rock</div>
                            <div className="font-medium">Status</div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>Complete teacher onboarding</div>
                            <Badge variant="outline" className="bg-green-100 text-green-800">On Track</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>Launch parent portal</div>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">At Risk</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>Summer curriculum update</div>
                            <Badge variant="outline" className="bg-green-100 text-green-800">On Track</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div>Staff EOS training program</div>
                            <Badge variant="outline" className="bg-red-100 text-red-800">Off Track</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={fetchEOSData}
                        disabled={eosLoading}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className={`h-4 w-4 ${eosLoading ? 'animate-spin' : ''}`} />
                        {eosLoading ? 'Refreshing...' : 'Refresh Data'}
                      </Button>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left p-2 font-medium">Metric</th>
                            <th className="text-left p-2 font-medium">Target</th>
                            <th className="text-left p-2 font-medium">Current</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-left p-2 font-medium">Owner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eosData.length > 0 ? eosData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b">
                              <td className="p-2">{row.Metric}</td>
                              <td className="p-2">{row.Target}</td>
                              <td className="p-2">{row.Current}</td>
                              <td className="p-2">{row.Status}</td>
                              <td className="p-2">{row.Owner}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                Click "Refresh Data" to load the latest EOS metrics
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}