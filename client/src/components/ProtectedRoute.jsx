import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/lib/auth-context';

/**
 * ProtectedRoute component
 * 
 * Wraps a route component and ensures the user is authenticated
 * Optionally checks if the user is an admin or owner
 */
export function ProtectedRoute({ 
  children,
  adminOnly = false,
  ownerOnly = false
}) {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth();
  
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
  
  if (ownerOnly && !isOwner) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
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
}) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (redirectAuthenticated && isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}