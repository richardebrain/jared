import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  hasCompletedTutorial?: boolean;
  isAdmin?: boolean;
  isSchoolAdmin?: boolean;
  createdAt: string;
}

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Determine user role for tutorial customization
  const getUserRole = (user: User | undefined) => {
    if (!user) return 'teacher';
    if (user.isAdmin && !user.isSchoolAdmin) return 'admin';
    if (user.isSchoolAdmin) return 'school_admin';
    return 'teacher';
  };

  // Check if user should see tutorial
  useEffect(() => {
    if (user) {
      // Show tutorial if:
      // 1. User hasn't completed tutorial yet
      // 2. User was created recently (within last 7 days)
      // 3. User explicitly hasn't dismissed it
      const isNewUser = new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const shouldShowTutorial = !user.hasCompletedTutorial && isNewUser;
      
      // Add small delay to avoid showing immediately on login
      if (shouldShowTutorial) {
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const openTutorial = () => setShowTutorial(true);
  const closeTutorial = () => setShowTutorial(false);

  return {
    showTutorial,
    openTutorial,
    closeTutorial,
    userRole: getUserRole(user),
    isNewUser: user ? new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false
  };
}