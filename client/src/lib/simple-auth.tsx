import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  firstName?: string;
  first_name?: string;
  email: string;
  isAdmin?: boolean;
  is_admin?: boolean;
  isOwner?: boolean;
  is_owner?: boolean;
  points?: number;
  bearBucks?: number;
  streak?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    await checkAuth();
  };

  useEffect(() => {
    // Only check auth once on component mount
    const authChecked = sessionStorage.getItem('auth_checked');
    if (!authChecked) {
      sessionStorage.setItem('auth_checked', 'true');
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('Auth context not available - provider not found');
    // Return a default context instead of throwing to prevent crashes
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => false,
      logout: async () => {},
      refetch: async () => {}
    };
  }
  return context;
}