import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import NotebookSourcesConfig from '@/components/NotebookSourcesConfig';
import SettingsLayout from '@/components/SettingsLayout';

export default function DataSourcesPage() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin === true;

  return (
    <SettingsLayout
      title="Data Sources"
      description="Configure approved data sources for AI-generated content"
    >
      <NotebookSourcesConfig isAdmin={isAdmin} />
    </SettingsLayout>
  );
}