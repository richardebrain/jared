import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Login from './login';

/**
 * Index page that handles redirects properly
 * In the deployed version, we'll always show the login page first
 */
export default function IndexPage() {
  const [_, setLocation] = useLocation();
  
  // On mount, check if we need to redirect
  useEffect(() => {
    const isDeployed = window.location.href.includes('.replit.app') || 
                       window.location.href.includes('replit.dev');
                       
    // In production, always go to login
    if (isDeployed) {
      setLocation('/login');
    }
  }, [setLocation]);
  
  // Render the login page directly
  return <Login />;
}