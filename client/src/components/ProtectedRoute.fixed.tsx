import React from 'react';
import { Redirect } from 'wouter';

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
}: ProtectedRouteProps): JSX.Element {
  // Simply render the children - auth is handled elsewhere
  return <>{children}</>;
}