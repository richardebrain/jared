import React from 'react';
import { Redirect } from 'wouter';

// Loading spinner component for authentication checks
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

interface AuthWrapperProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresAdmin?: boolean;
  requiresOwner?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  loginRedirect?: string;
  unauthorizedRedirect?: string;
}

/**
 * AuthWrapper component
 * 
 * Handles authentication logic for wrapped routes
 */
export function AuthWrapper({
  children,
  isAuthenticated,
  isLoading,
  requiresAdmin = false,
  requiresOwner = false,
  isAdmin = false,
  isOwner = false,
  loginRedirect = '/login',
  unauthorizedRedirect = '/dashboard'
}: AuthWrapperProps) {
  // Show loading state while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to={loginRedirect} />;
  }

  // Check for admin access if required
  if (requiresAdmin && !isAdmin) {
    return <Redirect to={unauthorizedRedirect} />;
  }

  // Check for owner access if required
  if (requiresOwner && !isOwner) {
    return <Redirect to={unauthorizedRedirect} />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
}