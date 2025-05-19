import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import SchoolDashboard from './school-dashboard';

// Component specifically for Bob's Daycare admin access
export default function BobsAdmin() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Direct embedded component approach instead of redirection
  // This ensures the component receives the right props and avoids client-side routing issues
  
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
  
  // Set up the admin access credentials in localStorage
  // This is important for the SchoolDashboard component to work correctly
  localStorage.setItem('adminKey', 'Bigsurf99');
  localStorage.setItem('adminAccessGranted', 'true');
  localStorage.setItem('currentSchoolId', '2');
  
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