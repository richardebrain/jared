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
import { Video, Link2, BookOpen } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Admin passwords
  const ADMIN_PASSWORD = 'BIGSURF55';
  const SCHOOL_ADMIN_PASSWORD = 'Bigsurf99';

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
    // Check both admin password and school admin password
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } else if (password === SCHOOL_ADMIN_PASSWORD) {
      // If it's Bigsurf99, redirect to the dedicated school admin dashboard route
      localStorage.setItem('adminAccessGranted', 'true');
      localStorage.setItem('adminKey', 'Bigsurf99');
      
      // Store the school ID in localStorage for the dashboard to use
      const schoolId = user?.schoolId || 2; // Default to school ID 2 if not found
      localStorage.setItem('currentSchoolId', schoolId.toString());
      
      toast({
        title: "School Admin Access Granted",
        description: "Redirecting to your school dashboard...",
      });
      
      // Set admin credentials and directly go to the dedicated route
      // First, set admin access in localStorage
      localStorage.setItem('adminKey', 'Bigsurf99');
      localStorage.setItem('adminAccessGranted', 'true');
      localStorage.setItem('currentSchoolId', '2'); // Bob's Daycare ID
      
      // Then navigate
      setTimeout(() => {
        // Navigate to the Bob's Daycare admin page
        window.location.href = '/schools/2';
      }, 1000);
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="management">
        <TabsList className="mb-6">
          <TabsTrigger value="management">Content Management</TabsTrigger>
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