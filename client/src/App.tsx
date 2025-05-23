import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import EnhancedDashboard from "@/pages/dashboard-enhanced";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BusinessSignup from "@/pages/business-signup";
import LandingPage from "@/pages/landing";
import ProgressionMap from "@/pages/progression-map";
import Assessment from "@/pages/assessment";
import AssessmentResults from "@/pages/assessment-results";
import EnhancedAssessmentPage from "@/pages/enhanced-assessment";
import SimpleAssessmentPage from "@/pages/simple-assessment";
import AIAssessmentPage from "@/pages/ai-assessment";
import SimpleAIAssessmentPage from "@/pages/simple-ai-assessment";
import EnhancedAIAssessmentPage from "@/pages/enhanced-ai-assessment";
import BasicAIAssessmentPage from "@/pages/basic-ai-assessment";
import DynamicAssessmentPage from "@/pages/dynamic-assessment";
import StandaloneAssessment from "@/pages/standalone-assessment";
import SimpleStandaloneAssessment from "@/pages/simple-standalone-assessment";
import AssessmentLauncher from "@/pages/assessment-launcher";
import SelfAssessment from "@/pages/self-assessment";
import LearningModulePage from "@/pages/learning-module";
import CoreValuesModulePage from "@/pages/core-values-module";
import CoreValuesModuleNew from "@/pages/core-values-module-new";
import MindfulMorningsModulePage from "@/pages/mindful-mornings-module";
import MicroModulePage from "@/pages/micro-module";
import LearningStylePage from "@/pages/learning-style";
import DiscussionsPage from "@/pages/discussions";
import AllModules from "@/pages/modules";
import CoreValuesPage from "@/pages/core-values";
import MindfulMorningsPage from "@/pages/mindful-mornings";
import StorytellingDemoPage from "@/pages/storytelling-demo";
import ClassroomMusic from "@/pages/classroom-music";
import CoreValuesShoutOutPage from "@/pages/core-values-shout-out";
import BuildingChildPage from "@/pages/building-child";
import ChapterOnePage from "@/pages/chapter-one";
import VideoResourcesPage from "@/pages/video-resources";
import ToolsPage from "@/pages/tools";
import DataSourcesPage from "@/pages/settings/data-sources";
import OwnerDashboardPage from "@/pages/settings/owner-dashboard";
import OwnerDashboardStandalone from "@/pages/owner-dashboard-standalone";
import PlatformIntegrationsPage from "@/pages/platform-integrations";
import AccountPage from "@/pages/settings/account";
import BearyAIPage from "@/pages/beary-ai";
import GamesPage from "@/pages/games";
import AdminPage from "@/pages/admin";
import LessonPlanMakerPage from "@/pages/lesson-plan-maker";
import CasinoPage from "@/pages/casino";
import TransitionTimer from "@/pages/transition-timer";
import TestAssessmentGraph from "@/pages/test-assessment-graph";
import SchoolDashboard from "@/pages/school-dashboard";
import ProfilePage from "@/pages/profile";
import AppOwnerDashboard from "@/pages/app-owner-dashboard";
import EduTokPage from "@/pages/edutok";
import AdminModulesPage from "@/pages/admin-modules";
import InviteTeachersPage from "@/pages/invite-teachers";
import AvatarCustomizationPage from "@/pages/avatar-customization";

function Router() {
  // We don't need to get authentication state here anymore - 
  // it will be handled by the ProtectedRoute and PublicRoute components
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

      {/* Root path shows landing page for public users */}
      <Route path="/">
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
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

      <Route path="/learning-style">
        <ProtectedRoute>
          <LearningStylePage />
        </ProtectedRoute>
      </Route>

      <Route path="/modules/:id">
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

      <Route path="/micro-modules/:id">
        <ProtectedRoute>
          <MicroModulePage />
        </ProtectedRoute>
      </Route>

      <Route path="/discussions/:id">
        <ProtectedRoute>
          <DiscussionsPage />
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

      <Route path="/chapter-one">
        <ProtectedRoute>
          <ChapterOnePage />
        </ProtectedRoute>
      </Route>

      <Route path="/mindful-mornings">
        <ProtectedRoute>
          <MindfulMorningsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/mindful-mornings-module">
        <ProtectedRoute>
          <MindfulMorningsModulePage />
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

      <Route path="/settings/account">
        <ProtectedRoute>
          <AccountPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings/owner-dashboard">
        <ProtectedRoute>
          <OwnerDashboardPage />
        </ProtectedRoute>
      </Route>

      <Route path="/owner-dashboard">
        <ProtectedRoute>
          <OwnerDashboardStandalone />
        </ProtectedRoute>
      </Route>

      <Route path="/settings/data-sources">
        <ProtectedRoute>
          <DataSourcesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/settings/platform-integrations">
        <ProtectedRoute>
          <PlatformIntegrationsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/beary-ai">
        <ProtectedRoute>
          <BearyAIPage />
        </ProtectedRoute>
      </Route>

      <Route path="/games">
        <ProtectedRoute>
          <GamesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/casino">
        <ProtectedRoute>
          <CasinoPage />
        </ProtectedRoute>
      </Route>

      <Route path="/lesson-plan-maker">
        <ProtectedRoute>
          <LessonPlanMakerPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin-dashboard">
        <ProtectedRoute>
          <AdminPage skipPasswordCheck={true} />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/modules">
        <ProtectedRoute>
          <AdminModulesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/transition-timer">
        <ProtectedRoute>
          <TransitionTimer />
        </ProtectedRoute>
      </Route>

      <Route path="/test-assessment-graph">
        <ProtectedRoute>
          <TestAssessmentGraph />
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
        <PublicRoute>
          <DynamicAssessmentPage />
        </PublicRoute>
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

      <Route path="/self-assessment">
        <ProtectedRoute>
          <SelfAssessment />
        </ProtectedRoute>
      </Route>

      <Route path="/assessment-launcher">
        <ProtectedRoute>
          <AssessmentLauncher />
        </ProtectedRoute>
      </Route>

      <Route path="/schools/:schoolId">
        <ProtectedRoute>
          <SchoolDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>

      <Route path="/app-owner-dashboard">
        <ProtectedRoute>
          <AppOwnerDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/invite-teachers">
        <ProtectedRoute>
          <InviteTeachersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/edutok">
        <ProtectedRoute>
          <EduTokPage />
        </ProtectedRoute>
      </Route>

      <Route path="/avatar-customization">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>

      {/* Root path handled earlier (showing Dashboard for authenticated users, LandingPage for others) */}

      {/* Direct access routes for emergency use */}
      <Route path="/direct/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>

      <Route path="/direct/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      {/* Fallback route */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const { isLoading } = useAuth();
  
  // Show a loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/90">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Toaster />
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
