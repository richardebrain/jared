import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import SchoolDashboard from './school-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Component specifically for Bob's Daycare admin access
export default function BobsAdmin() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Check if admin access was already granted
  useEffect(() => {
    const storedAdminKey = localStorage.getItem('adminKey');
    const storedSchoolId = localStorage.getItem('currentSchoolId');
    const accessGranted = localStorage.getItem('adminAccessGranted') === 'true';
    
    if (accessGranted && storedAdminKey === 'Bigsurf99' && storedSchoolId === '2') {
      setIsAuthorized(true);
    }
  }, []);
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (adminPassword === 'Bigsurf99') {
      // Set up the admin access credentials in localStorage
      localStorage.setItem('adminKey', 'Bigsurf99');
      localStorage.setItem('adminAccessGranted', 'true');
      localStorage.setItem('currentSchoolId', '2');
      setIsAuthorized(true);
      
      toast({
        title: "Access Granted",
        description: "You now have admin access to Bob's Daycare dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password for Bob's Daycare admin dashboard.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Setting up Bob's Daycare admin dashboard...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Please log in to access the Bob's Daycare admin dashboard</p>
      </div>
    );
  }
  
  // If the user isn't authorized yet, show login form
  if (!isAuthorized) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Bob's Daycare Admin</CardTitle>
            <CardDescription>
              Enter the administrator password to access the Bob's Daycare dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
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
  
  // Force a direct redirect to the school dashboard for Bob's Daycare
  useEffect(() => {
    if (isAuthorized) {
      // This approach ensures the SchoolDashboard receives fresh credentials each time
      localStorage.setItem('adminKey', 'Bigsurf99');
      localStorage.setItem('adminAccessGranted', 'true');
      localStorage.setItem('currentSchoolId', '2');
    }
  }, [isAuthorized]);

  // Directly embed the SchoolDashboard component with explicit props
  return (
    <div className="w-full h-full">
      <SchoolDashboard 
        forcedSchoolId={2} 
        forcedAdminKey="Bigsurf99" 
      />
    </div>
  );
}