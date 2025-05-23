import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Switch, Route, Redirect } from 'wouter';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import EnhancedDashboard from '@/pages/dashboard-enhanced';
import Login from '@/pages/login';
import Register from '@/pages/register';
import BusinessSignup from '@/pages/business-signup';
import LandingPage from '@/pages/landing';
import ProgressionMap from '@/pages/progression-map';
import Assessment from '@/pages/assessment';
import AssessmentResults from '@/pages/assessment-results';
import EnhancedAssessmentPage from '@/pages/enhanced-assessment';
import SimpleAssessmentPage from '@/pages/simple-assessment';
import AIAssessmentPage from '@/pages/ai-assessment';
import SimpleAIAssessmentPage from '@/pages/simple-ai-assessment';
import EnhancedAIAssessmentPage from '@/pages/enhanced-ai-assessment';
import BasicAIAssessmentPage from '@/pages/basic-ai-assessment';
import DynamicAssessmentPage from '@/pages/dynamic-assessment';
import StandaloneAssessment from '@/pages/standalone-assessment';
import SimpleStandaloneAssessment from '@/pages/simple-standalone-assessment';
import AssessmentLauncher from '@/pages/assessment-launcher';
import SelfAssessment from '@/pages/self-assessment';
import LearningModulePage from '@/pages/learning-module';
import CoreValuesModulePage from '@/pages/core-values-module';
import CoreValuesModuleNew from '@/pages/core-values-module-new';
import MindfulMorningsModulePage from '@/pages/mindful-mornings-module';
import MicroModulePage from '@/pages/micro-module';
import LearningStylePage from '@/pages/learning-style';
import DiscussionsPage from '@/pages/discussions';
import AllModules from '@/pages/modules';
import CoreValuesPage from '@/pages/core-values';
import MindfulMorningsPage from '@/pages/mindful-mornings';
import StorytellingDemoPage from '@/pages/storytelling-demo';
import ClassroomMusic from '@/pages/classroom-music';
import CoreValuesShoutOutPage from '@/pages/core-values-shout-out';
import BuildingChildPage from '@/pages/building-child';
import ChapterOnePage from '@/pages/chapter-one';
import VideoResourcesPage from '@/pages/video-resources';
import ToolsPage from '@/pages/tools';
import DataSourcesPage from '@/pages/settings/data-sources';
import OwnerDashboardPage from '@/pages/settings/owner-dashboard';
import OwnerDashboardStandalone from '@/pages/owner-dashboard-standalone';
import PlatformIntegrationsPage from '@/pages/platform-integrations';
import GameLibraryPage from '@/pages/game-library';
import AIToolsPage from '@/pages/ai-tools';
import ExportToolsPage from '@/pages/export-tools';
import ImportToolsPage from '@/pages/import-tools';
import SchoolDashboardPage from '@/pages/school-dashboard';
import SchoolSettingsPage from '@/pages/school-settings';
import AdminDashboardPage from '@/pages/admin-dashboard';
import TeacherListPage from '@/pages/teacher-list';
import AccountPage from '@/pages/account';
import ModuleBuilderPage from '@/pages/module-builder';
import ModuleEditorPage from '@/pages/module-editor';
import AssessmentBuilderPage from '@/pages/assessment-builder';
import GamePage from '@/pages/game';
import UserProgressPage from '@/pages/user-progress';
import UserAchievementsPage from '@/pages/user-achievements';
import RewardsPage from '@/pages/rewards';
import AvatarCustomizationPage from '@/pages/avatar-customization';
import AvatarShopPage from '@/pages/avatar-shop';
import MyGameStats from '@/pages/my-game-stats';

/**
 * AuthWrapper component that handles the application routing
 * with proper authentication checks
 */
const AuthWrapper: React.FC = () => {
  // We still need these since the app is in transition
  const { isAuthenticated, isLoading, isAdmin, isOwner } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <PublicRoute redirectAuthenticated>
          <Login />
        </PublicRoute>
      </Route>

      <Route path="/register">
        <PublicRoute redirectAuthenticated>
          <Register />
        </PublicRoute>
      </Route>

      <Route path="/business-signup">
        <PublicRoute>
          <BusinessSignup />
        </PublicRoute>
      </Route>

      {/* Root path shows landing page for public users or dashboard for authenticated users */}
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <LandingPage />}
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard-enhanced">
        <ProtectedRoute>
          <EnhancedDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/progression-map">
        <ProtectedRoute>
          <ProgressionMap />
        </ProtectedRoute>
      </Route>

      <Route path="/assessment">
        <ProtectedRoute>
          <Assessment />
        </ProtectedRoute>
      </Route>

      <Route path="/assessment-results">
        <ProtectedRoute>
          <AssessmentResults />
        </ProtectedRoute>
      </Route>

      <Route path="/enhanced-assessment">
        <ProtectedRoute>
          <EnhancedAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/simple-assessment">
        <ProtectedRoute>
          <SimpleAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/ai-assessment">
        <ProtectedRoute>
          <AIAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/simple-ai-assessment">
        <ProtectedRoute>
          <SimpleAIAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/enhanced-ai-assessment">
        <ProtectedRoute>
          <EnhancedAIAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/basic-ai-assessment">
        <ProtectedRoute>
          <BasicAIAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/dynamic-assessment">
        <ProtectedRoute>
          <DynamicAssessmentPage />
        </ProtectedRoute>
      </Route>

      <Route path="/standalone-assessment">
        <ProtectedRoute>
          <StandaloneAssessment />
        </ProtectedRoute>
      </Route>

      <Route path="/simple-standalone-assessment">
        <ProtectedRoute>
          <SimpleStandaloneAssessment />
        </ProtectedRoute>
      </Route>

      <Route path="/assessment-launcher">
        <ProtectedRoute>
          <AssessmentLauncher />
        </ProtectedRoute>
      </Route>

      <Route path="/self-assessment">
        <ProtectedRoute>
          <SelfAssessment />
        </ProtectedRoute>
      </Route>

      <Route path="/learning-module">
        <ProtectedRoute>
          <LearningModulePage />
        </ProtectedRoute>
      </Route>

      <Route path="/core-values-module">
        <ProtectedRoute>
          <CoreValuesModulePage />
        </ProtectedRoute>
      </Route>

      <Route path="/core-values-module-new">
        <ProtectedRoute>
          <CoreValuesModuleNew />
        </ProtectedRoute>
      </Route>

      <Route path="/mindful-mornings-module">
        <ProtectedRoute>
          <MindfulMorningsModulePage />
        </ProtectedRoute>
      </Route>

      <Route path="/micro-module">
        <ProtectedRoute>
          <MicroModulePage />
        </ProtectedRoute>
      </Route>

      <Route path="/learning-style">
        <ProtectedRoute>
          <LearningStylePage />
        </ProtectedRoute>
      </Route>

      <Route path="/discussions">
        <ProtectedRoute>
          <DiscussionsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/modules">
        <ProtectedRoute>
          <AllModules />
        </ProtectedRoute>
      </Route>

      <Route path="/core-values">
        <ProtectedRoute>
          <CoreValuesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/mindful-mornings">
        <ProtectedRoute>
          <MindfulMorningsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/classroom-music">
        <ProtectedRoute>
          <ClassroomMusic />
        </ProtectedRoute>
      </Route>

      <Route path="/storytelling-demo">
        <ProtectedRoute>
          <StorytellingDemoPage />
        </ProtectedRoute>
      </Route>

      <Route path="/core-values-shout-out">
        <ProtectedRoute>
          <CoreValuesShoutOutPage />
        </ProtectedRoute>
      </Route>

      <Route path="/building-child">
        <ProtectedRoute>
          <BuildingChildPage />
        </ProtectedRoute>
      </Route>

      <Route path="/chapter-one">
        <ProtectedRoute>
          <ChapterOnePage />
        </ProtectedRoute>
      </Route>

      <Route path="/video-resources">
        <ProtectedRoute>
          <VideoResourcesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/tools">
        <ProtectedRoute>
          <ToolsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/game-library">
        <ProtectedRoute>
          <GameLibraryPage />
        </ProtectedRoute>
      </Route>

      <Route path="/game/:id">
        <ProtectedRoute>
          <GamePage />
        </ProtectedRoute>
      </Route>

      <Route path="/ai-tools">
        <ProtectedRoute>
          <AIToolsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/export-tools">
        <ProtectedRoute>
          <ExportToolsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/import-tools">
        <ProtectedRoute>
          <ImportToolsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/school-dashboard">
        <ProtectedRoute adminOnly>
          <SchoolDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/school-settings">
        <ProtectedRoute adminOnly>
          <SchoolSettingsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin-dashboard">
        <ProtectedRoute ownerOnly>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings/data-sources">
        <ProtectedRoute adminOnly>
          <DataSourcesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings/owner-dashboard">
        <ProtectedRoute ownerOnly>
          <OwnerDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/owner-dashboard-standalone">
        <ProtectedRoute ownerOnly>
          <OwnerDashboardStandalone />
        </ProtectedRoute>
      </Route>

      <Route path="/platform-integrations">
        <ProtectedRoute adminOnly>
          <PlatformIntegrationsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/teacher-list">
        <ProtectedRoute adminOnly>
          <TeacherListPage />
        </ProtectedRoute>
      </Route>

      <Route path="/account">
        <ProtectedRoute>
          <AccountPage />
        </ProtectedRoute>
      </Route>

      <Route path="/module-builder">
        <ProtectedRoute adminOnly>
          <ModuleBuilderPage />
        </ProtectedRoute>
      </Route>

      <Route path="/module-editor/:id">
        <ProtectedRoute adminOnly>
          <ModuleEditorPage />
        </ProtectedRoute>
      </Route>

      <Route path="/assessment-builder">
        <ProtectedRoute adminOnly>
          <AssessmentBuilderPage />
        </ProtectedRoute>
      </Route>

      <Route path="/user-progress">
        <ProtectedRoute>
          <UserProgressPage />
        </ProtectedRoute>
      </Route>

      <Route path="/user-achievements">
        <ProtectedRoute>
          <UserAchievementsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/rewards">
        <ProtectedRoute>
          <RewardsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/avatar-customization">
        <ProtectedRoute>
          <AvatarCustomizationPage />
        </ProtectedRoute>
      </Route>

      <Route path="/avatar-shop">
        <ProtectedRoute>
          <AvatarShopPage />
        </ProtectedRoute>
      </Route>

      <Route path="/my-game-stats">
        <ProtectedRoute>
          <MyGameStats />
        </ProtectedRoute>
      </Route>

      {/* 404 route */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
};

export default AuthWrapper;