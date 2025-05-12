import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  mode?: 'signin' | 'signup';
}

export default function GoogleAuthButton({ 
  onSuccess, 
  onError,
  mode = 'signin'
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      
      if (!result.success) {
        throw new Error('Google authentication failed');
      }
      
      const user = result.user;
      
      if (!user) {
        throw new Error('No user information returned from Google');
      }
      
      // Extract user info from Google profile
      const userInfo = {
        email: user.email || '',
        firstName: user.displayName ? user.displayName.split(' ')[0] : '',
        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
        profilePicture: user.photoURL || null,
        // These would require input from user, providing defaults
        username: user.email ? user.email.split('@')[0] : '',
        password: '', // Will be set by backend
        language: 'English',
        nativeLanguage: 'English',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Phoenix'
      };
      
      // Send user data to our backend to register or login
      const endpoint = mode === 'signup' ? '/api/auth/register-google' : '/api/auth/login-google';
      const response = await apiRequest('POST', endpoint, userInfo);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      toast({
        title: mode === 'signup' ? 'Account created!' : 'Welcome back!',
        description: mode === 'signup' 
          ? 'Your account has been created successfully.'
          : 'You have been signed in successfully.',
      });
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: 'Authentication failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
      
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className="w-full"
      onClick={handleGoogleAuth}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
        </span>
      )}
    </Button>
  );
}