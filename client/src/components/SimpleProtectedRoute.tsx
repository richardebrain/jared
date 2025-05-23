import React from 'react';
import { Redirect } from 'wouter';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
  redirectTo?: string;
}

/**
 * A simplified protected route component that handles authentication
 * without relying on context hooks directly
 */
export function SimpleProtectedRoute({ 
  children, 
  isAuthenticated,
  isLoading,
  redirectTo = '/login'
}: SimpleProtectedRouteProps): JSX.Element {
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }
  
  // If authenticated, render children
  return <>{children}</>;
}