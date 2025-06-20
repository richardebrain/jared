import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';

interface AssessmentStatus {
  hasCompletedAssessment: boolean;
  hasResults: boolean;
  routeTo: string;
  lastCompletedAt: string | null;
  canRetake: boolean;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  schoolAdminOnly?: boolean;
  ownerOnly?: boolean;
  requiresAssessment?: boolean;
}

/**
 * ProtectedRoute component
 * 
 * Wraps a route component and ensures the user is authenticated
 * Optionally checks if the user is an admin or owner
 * Can also check if user has completed required assessment
 */
export function ProtectedRoute({ 
  children,
  adminOnly = false,
  schoolAdminOnly = false,
  ownerOnly = false,
  requiresAssessment = false
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, isAdmin, isSchoolAdmin, isOwner, user } = useAuth();
  
  // Check assessment status if required
  const { data: assessmentStatus, isLoading: assessmentLoading } = useQuery<AssessmentStatus>({
    queryKey: ['/api/assessment/session/status'],
    enabled: !!user && isAuthenticated && requiresAssessment && !isSchoolAdmin && !isAdmin,
    retry: false,
  });
  
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
  
  // Check assessment requirement for regular teachers (not admins)
  if (requiresAssessment && !isSchoolAdmin && !isAdmin) {
    if (assessmentLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (assessmentStatus && !assessmentStatus.hasCompletedAssessment && !assessmentStatus.hasResults) {
      return <Redirect to="/assessment-required" />;
    }
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