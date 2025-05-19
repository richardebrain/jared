import React from 'react';
import { useQuery } from '@tanstack/react-query';
import EnhancedAssessment from '../components/EnhancedAssessment';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: any;
}

const EnhancedAssessmentPage: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch current user data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6">Please log in to access the enhanced assessment system.</p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Adaptive Assessment System</h1>
      <p className="text-center text-muted-foreground mb-8">
        Test your knowledge and skills with our adaptive assessment system
      </p>
      
      <EnhancedAssessment userId={user.id} />
    </div>
  );
};

export default EnhancedAssessmentPage;