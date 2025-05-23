import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
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
  ownerOnly = false 
}: ProtectedRouteProps): JSX.Element | null {
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if authentication check is complete (not loading)
    if (!isLoading) {
      if (!isAuthenticated) {
        // Prevent redirect loops by using sessionStorage flag
        if (!sessionStorage.getItem('auth_redirect_in_progress')) {
          sessionStorage.setItem('auth_redirect_in_progress', 'true');
          
          // Navigate to login using window.location for a clean redirect
          window.location.href = '/login';
        }
      } else if (adminOnly && !isAdmin) {
        // User is authenticated but not an admin
        setLocation('/dashboard');
      } else if (ownerOnly && !isOwner) {
        // User is authenticated but not an owner
        setLocation('/dashboard');
      } else {
        // Clear redirect flag when successfully authenticated
        sessionStorage.removeItem('auth_redirect_in_progress');
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, isOwner, adminOnly, ownerOnly, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authentication failed, return null (redirect happens in useEffect)
  if (!isAuthenticated || (adminOnly && !isAdmin) || (ownerOnly && !isOwner)) {
    return null;
  }

  // User is authenticated with appropriate permissions, render children
  return <>{children}</>;
}