import React, { useEffect } from 'react';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
  redirectPath?: string;
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

/**
 * PublicRoute component
 * 
 * For routes that don't require authentication
 * Optionally redirects authenticated users elsewhere
 */
export function PublicRoute({ 
  children, 
  redirectAuthenticated = false,
  redirectPath = '/dashboard',
  isAuthenticated = false,
  isLoading = false
}: PublicRouteProps): JSX.Element {

  useEffect(() => {
    // Only redirect if we're sure the user is authenticated
    if (!isLoading && isAuthenticated && redirectAuthenticated) {
      // Clear any auth redirect flags since we're authenticated
      sessionStorage.removeItem('auth_redirect_in_progress');
      
      // Use clean navigation
      window.location.href = redirectPath;
    }
  }, [isAuthenticated, isLoading, redirectAuthenticated, redirectPath]);

  // Show loading state if redirecting authenticated users
  if (isLoading && redirectAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Always render children for public routes
  return <>{children}</>;
}