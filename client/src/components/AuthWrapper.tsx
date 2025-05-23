import React from 'react';
import { Redirect } from 'wouter';

interface AuthWrapperProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  redirectPath?: string;
}

/**
 * AuthWrapper component
 * 
 * A simple wrapper that handles authentication state and redirects
 * Used for both protected routes and public routes with authenticated redirects
 */
export function AuthWrapper({ 
  children, 
  isAuthenticated,
  isLoading,
  adminOnly = false,
  ownerOnly = false,
  isAdmin = false,
  isOwner = false,
  redirectPath = '/login'
}: AuthWrapperProps): JSX.Element {
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
    return <Redirect to={redirectPath} />;
  }
  
  // Check if user is admin when adminOnly is true
  if (adminOnly && !isAdmin) {
    return <Redirect to="/dashboard" />;
  }
  
  // Check if user is owner when ownerOnly is true
  if (ownerOnly && !isOwner) {
    return <Redirect to="/dashboard" />;
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
}