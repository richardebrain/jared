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
 * Simple wrapper component for protected routes
 */
export function ProtectedRoute({ children, adminOnly = false, ownerOnly = false }: ProtectedRouteProps): JSX.Element {
  // Simply return the children - auth is handled by the parent context
  return <>{children}</>;
}