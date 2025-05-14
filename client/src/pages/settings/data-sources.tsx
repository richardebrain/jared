import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import NotebookSourcesConfig from '@/components/NotebookSourcesConfig';
import SettingsLayout from '@/components/SettingsLayout';

export default function DataSourcesPage() {
  const { user } = useAuth();
  // Use role or assume admin access for testing
  const isAdmin = user?.role === 'admin' || true;

  return (
    <SettingsLayout
      title="Data Sources"
      description="Configure approved data sources for AI-generated content"
    >
      <NotebookSourcesConfig isAdmin={isAdmin} />
    </SettingsLayout>
  );
}