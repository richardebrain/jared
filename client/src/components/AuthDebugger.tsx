import React from 'react';
import { useAuth } from '@/lib/auth-context';

interface AuthDebuggerProps {
  show?: boolean;
}

export function AuthDebugger({ show = false }: AuthDebuggerProps) {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  
  // Only show in development or when explicitly requested
  if (!show && process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User ID: {user?.id || 'None'}</div>
        <div>Username: {user?.username || 'None'}</div>
        <div>Current Path: {window.location.pathname}</div>
        <div>Error: {error?.message || 'None'}</div>
        <div>Timestamp: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

export default AuthDebugger; 