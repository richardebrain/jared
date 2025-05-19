import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

// This is a very simple redirect component specifically for Bob's Daycare
export default function BobsAdmin() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Set up the admin access credentials
      localStorage.setItem('adminKey', 'Bigsurf99');
      localStorage.setItem('adminAccessGranted', 'true');
      localStorage.setItem('currentSchoolId', '2');
      
      // Redirect to the regular school dashboard with Bob's ID
      window.location.href = '/schools/2';
    }
  }, [isLoading, isAuthenticated]);
  
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Setting up Bob's Daycare admin dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Redirecting to Bob's Daycare dashboard...</p>
    </div>
  );
}