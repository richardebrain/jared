import React from 'react';
import { Redirect } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
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
  ownerOnly = false,
  isAuthenticated = false,
  isLoading = false,
  isAdmin = false,
  isOwner = false
}: ProtectedRouteProps): JSX.Element {
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
    return <Redirect to="/login" />;
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