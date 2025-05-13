import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import BuildingChildTraining from '@/components/BuildingChildTraining';
import Header from '@/components/Header';

export default function BuildingChildPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const [, setLocation] = useLocation();
  
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-6">
        <BuildingChildTraining />
      </main>
    </div>
  );
}