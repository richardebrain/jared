import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Users, Settings, Award, BarChart3, User, School, UserPlus } from "lucide-react";

// Teacher form schema
const teacherFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  language: z.string().optional(),
  nativeLanguage: z.string().optional(),
});

// School settings form schema
const schoolSettingsSchema = z.object({
  name: z.string().min(1, "School name is required"),
  contactEmail: z.string().email("Invalid email address").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  adminPassword: z.string().optional(),
  customization: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    welcomeMessage: z.string().optional(),
  }).optional(),
});

export default function SchoolDashboard() {
  // For Bob's Daycare direct admin access (using the special route)
  const params = useParams();
  
  // If we're on the bobs-daycare-admin route, use Bob's Daycare school ID (2) directly
  const isSpecialRoute = window.location.pathname === '/bobs-daycare-admin';
  
  // Use school ID 2 for Bob's Daycare special route
  const schoolId = isSpecialRoute ? "2" : params.schoolId;
  
  // Make sure we have a valid admin key for the special route
  useEffect(() => {
    if (isSpecialRoute) {
      localStorage.setItem('adminKey', 'Bigsurf99');
      localStorage.setItem('adminAccessGranted', 'true');
    }
  }, [isSpecialRoute]);
  
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Check if admin access was granted via localStorage
  const checkAdminAccess = () => {
    const isGranted = localStorage.getItem('adminAccessGranted') === 'true';
    const storedKey = localStorage.getItem('adminKey') || '';
    return { isGranted, adminKey: isGranted ? storedKey : '' };
  };
  
  const { isGranted, adminKey: initialAdminKey } = checkAdminAccess();
  const [adminKey, setAdminKey] = useState(initialAdminKey);
  const [showAdminAuth, setShowAdminAuth] = useState(!isGranted);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Get school data with admin key
  const { 
    data: schoolData, 
    isLoading: schoolLoading,
    refetch: refetchSchool
  } = useQuery({
    queryKey: ["/api/schools", schoolId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${schoolId}?adminKey=${encodeURIComponent(adminKey)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch school data");
      }
      return res.json();
    },
    enabled: !!schoolId && !!adminKey && isAuthenticated,
    retry: false,
  });
  
  // Get school teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading,
    refetch: refetchTeachers
  } = useQuery({
    queryKey: ["/api/schools", schoolId, "teachers"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${schoolId}/teachers?adminKey=${encodeURIComponent(adminKey)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch teachers");
      }
      return res.json();
    },
    enabled: !!schoolId && !!adminKey && isAuthenticated && !showAdminAuth,
    retry: false,
  });
  
  // Get teacher progress
  const { 
    data: progressData, 
    isLoading: progressLoading,
    refetch: refetchProgress
  } = useQuery({
    queryKey: ["/api/schools", schoolId, "progress"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${schoolId}/teacher-progress?adminKey=${encodeURIComponent(adminKey)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch progress data");
      }
      return res.json();
    },
    enabled: !!schoolId && !!adminKey && isAuthenticated && !showAdminAuth,
    retry: false,
  });
  
  // Get EOS data
  const { 
    data: eosData, 
    isLoading: eosLoading,
    refetch: refetchEOS 
  } = useQuery({
    queryKey: ["/api/schools", schoolId, "eos"],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/schools/${schoolId}/eos?adminKey=${encodeURIComponent(adminKey)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch EOS data");
      }
      return res.json();
    },
    enabled: !!schoolId && !!adminKey && isAuthenticated && !showAdminAuth,
    retry: false,
  });
  
  // Form for admin authentication
  const adminForm = useForm({
    defaultValues: {
      adminKey: ""
    }
  });
  
  // Teacher registration form
  const teacherForm = useForm({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      language: "English",
      nativeLanguage: "English"
    }
  });
  
  // School settings form
  const settingsForm = useForm({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      adminPassword: "",
      customization: {
        primaryColor: "#1e40af",
        secondaryColor: "#3b82f6",
        welcomeMessage: ""
      }
    }
  });
  
  // Fill settings form with school data when available
  useEffect(() => {
    if (schoolData?.school) {
      const school = schoolData.school;
      settingsForm.reset({
        name: school.name || "",
        contactEmail: school.contactEmail || "",
        contactPhone: school.contactPhone || "",
        address: school.address || "",
        city: school.city || "",
        state: school.state || "",
        zipCode: school.zipCode || "",
        adminPassword: "", // Don't prefill password
        customization: {
          primaryColor: school.customization?.primaryColor || "#1e40af",
          secondaryColor: school.customization?.secondaryColor || "#3b82f6",
          welcomeMessage: school.customization?.welcomeMessage || ""
        }
      });
    }
  }, [schoolData, settingsForm]);
  
  // Handle submitting admin key
  const handleAdminSubmit = async (data) => {
    try {
      // For owner accounts, bypass admin verification
      if (user?.isOwner) {
        setAdminKey(data.adminKey);
        setShowAdminAuth(false);
        return;
      }
      
      // First make a test API call to verify the password works before setting it
      const res = await apiRequest(
        "GET", 
        `/api/schools/${schoolId}/verify-admin?adminKey=${encodeURIComponent(data.adminKey)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        toast({
          title: "Access Denied",
          description: errorData.message || "Invalid admin password. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Password verified successfully
      setAdminKey(data.adminKey);
      setShowAdminAuth(false);
      toast({
        title: "Access Granted",
        description: "Admin password verified successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while verifying the password. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle adding a new teacher
  const handleAddTeacher = async (data) => {
    try {
      const res = await apiRequest(
        "POST", 
        `/api/schools/${schoolId}/teachers?adminKey=${encodeURIComponent(adminKey)}`,
        data
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add teacher");
      }
      
      const result = await res.json();
      
      toast({
        title: "Teacher Added",
        description: `${data.firstName} ${data.lastName} has been added to your school.`,
      });
      
      // Reset form and refetch teachers
      teacherForm.reset();
      setAddTeacherOpen(false);
      refetchTeachers();
      refetchSchool();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Handle updating school settings
  const handleUpdateSettings = async (data) => {
    try {
      const res = await apiRequest(
        "PATCH", 
        `/api/schools/${schoolId}/settings?adminKey=${encodeURIComponent(adminKey)}`,
        data
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update settings");
      }
      
      const result = await res.json();
      
      toast({
        title: "Settings Updated",
        description: "Your school settings have been updated successfully.",
      });
      
      // Close dialog and refetch school data
      setSettingsOpen(false);
      refetchSchool();
      
      // Update admin key if it was changed
      if (data.adminPassword) {
        setAdminKey(data.adminPassword);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  if (authLoading || (isAuthenticated && !schoolId)) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If we need admin authentication
  if (showAdminAuth) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>School Admin Access</CardTitle>
            <CardDescription>
              Enter the administrator password for this school to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="adminKey">Admin Password</label>
                  <Input 
                    id="adminKey" 
                    type="password" 
                    placeholder="Enter admin password" 
                    {...adminForm.register("adminKey")}
                  />
                </div>
                <Button type="submit">Access Dashboard</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {schoolData?.school?.name || "School"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your school's training program and teachers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                School Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>School Settings</DialogTitle>
                <DialogDescription>
                  Update your school's information and settings
                </DialogDescription>
              </DialogHeader>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(handleUpdateSettings)} className="space-y-4 py-4">
                  <FormField
                    control={settingsForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={settingsForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={settingsForm.control}
                    name="customization.welcomeMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="Welcome message for your teachers"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            {...field} 
                            placeholder="Leave blank to keep current password" 
                          />
                        </FormControl>
                        <FormDescription>
                          This password is required to access your school's admin dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account for your school
                </DialogDescription>
              </DialogHeader>
              <Form {...teacherForm}>
                <form onSubmit={teacherForm.handleSubmit(handleAddTeacher)} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={teacherForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teacherForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={teacherForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={teacherForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={teacherForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddTeacherOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Teacher</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachersLoading ? "..." : teachersData?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active staff in your school
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressLoading ? "..." : 
                progressData?.progressData?.length > 0 
                  ? Math.round(progressData.progressData.reduce((sum, t) => sum + t.completionPercentage, 0) / progressData.progressData.length) + "%" 
                  : "0%"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average module completion
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shout Outs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eosLoading ? "..." : eosData?.shoutOuts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Core values recognitions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolLoading ? "..." : 
                schoolData?.school?.subscriptionActive ? "Active" : 
                schoolData?.school?.isFreeAccess ? "Free Access" : "Inactive"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {schoolData?.school?.subscriptionType || "Not subscribed"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teachers">
            <Users className="h-4 w-4 mr-2" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart3 className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="eos">
            <Award className="h-4 w-4 mr-2" />
            Core Values
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="teachers" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {teachersLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : teachersData?.teachers?.length > 0 ? (
              teachersData.teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={teacher.profilePicture || undefined} alt={teacher.username} />
                      <AvatarFallback>
                        {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle>{teacher.firstName} {teacher.lastName}</CardTitle>
                      <CardDescription>@{teacher.username}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-medium">{teacher.level}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bear Bucks:</span>
                        <span className="font-medium">{teacher.bearBucks}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-medium">{teacher.points}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Active:</span>
                        <span className="font-medium">
                          {teacher.lastActive 
                            ? new Date(teacher.lastActive).toLocaleDateString() 
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <h3 className="text-lg font-medium">No Teachers Found</h3>
                <p className="text-muted-foreground mt-1">
                  Add teachers to your school to get started
                </p>
                <Button className="mt-4" onClick={() => setAddTeacherOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          {progressLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : progressData?.progressData?.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Teacher</th>
                    <th className="h-10 px-4 text-left font-medium">Progress</th>
                    <th className="h-10 px-4 text-left font-medium">Modules</th>
                    <th className="h-10 px-4 text-left font-medium">Last Assessment</th>
                    <th className="h-10 px-4 text-left font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {progressData.progressData.map((progress) => (
                    <tr key={progress.userId} className="border-b">
                      <td className="p-4 align-middle">{progress.fullName}</td>
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <Progress value={progress.completionPercentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">{progress.completionPercentage}%</div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">{progress.modulesCompleted} / {progress.totalModules}</td>
                      <td className="p-4 align-middle">
                        {progress.lastAssessment ? (
                          new Date(progress.lastAssessment.createdAt).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {progress.lastActive ? (
                          new Date(progress.lastActive).toLocaleDateString()
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <h3 className="text-lg font-medium">No Progress Data</h3>
              <p className="text-muted-foreground mt-1">
                Teachers need to start completing modules to show progress data
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="eos" className="space-y-4">
          {eosLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : eosData?.shoutOuts?.length > 0 ? (
            <div className="space-y-4">
              {eosData.shoutOuts.map((shoutOut) => (
                <Card key={shoutOut.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Core Value: <span className="text-primary">{shoutOut.coreValue}</span>
                      </CardTitle>
                      <Badge>{new Date(shoutOut.createdAt).toLocaleDateString()}</Badge>
                    </div>
                    <CardDescription>
                      From {shoutOut.nominator?.fullName || "Unknown"} to {shoutOut.nominee?.fullName || "Unknown"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{shoutOut.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <h3 className="text-lg font-medium">No Core Values Shout Outs</h3>
              <p className="text-muted-foreground mt-1">
                Encourage your teachers to recognize each other for demonstrating core values
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}