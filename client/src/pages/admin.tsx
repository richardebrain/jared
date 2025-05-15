import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'wouter';
import AdminTools from '@/components/AdminTools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useNavigate();
  const { toast } = useToast();

  // Redirect if not admin
  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin page.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [user, isLoading, navigate, toast]);

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
              <CardDescription>Manage system users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">This section is under development. Coming soon!</p>
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
              <CardTitle>Admin Tools</CardTitle>
              <CardDescription>System validation and maintenance tools</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTools />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}