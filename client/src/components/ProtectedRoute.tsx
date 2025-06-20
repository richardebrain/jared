import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  schoolAdminOnly?: boolean;
  ownerOnly?: boolean;
}

/**
 * ProtectedRoute component
 * 
 * Wraps a route component and ensures the user is authenticated
 * Optionally checks if the user is an admin or owner
 */
export function ProtectedRoute({ 
  children,
  adminOnly = false,
  schoolAdminOnly = false,
  ownerOnly = false
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, isAdmin, isSchoolAdmin, isOwner } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Redirect to="/dashboard" />;
  }
  
  if (schoolAdminOnly && !isSchoolAdmin) {
    return <Redirect to="/dashboard" />;
  }
  
  if (ownerOnly && !isOwner) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
}

/**
 * PublicRoute component
 * 
 * Route component for public pages
 * Optionally redirects authenticated users
 */
export function PublicRoute({ 
  children,
  redirectAuthenticated = false 
}: PublicRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check for force login parameter to bypass auto-login
  const urlParams = new URLSearchParams(window.location.search);
  const forceLogin = urlParams.get('force') === 'true';
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If force login is enabled, always show the login page
  if (forceLogin) {
    return <>{children}</>;
  }
  
  if (redirectAuthenticated && isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}