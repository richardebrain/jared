import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
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

// Simple auth check component to avoid deep nesting in router
function AuthRequired({ children }) {
  const [location, setLocation] = useLocation();
  
  // Use a static auth check to prevent loops
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 120000,
    gcTime: 300000,
    enabled: !sessionStorage.getItem('auth_redirect_in_progress') // Prevent query while redirecting
  });
  
  // Set a flag when we're redirecting to prevent more auth checks
  useEffect(() => {
    if (!isLoading && !user && !isError) {
      sessionStorage.setItem('auth_redirect_in_progress', 'true');
      
      // Use a simple navigation approach to avoid update loops
      window.location.href = '/login';
      return;
    }
    
    // Clear flag when loaded successfully 
    if (!isLoading && user) {
      sessionStorage.removeItem('auth_redirect_in_progress');
    }
  }, [user, isLoading, isError, setLocation]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Show login page if not authenticated
  if (!user && !isLoading) {
    return null; // We're redirecting via useEffect
  }
  
  // User is authenticated
  return <>{children}</>;
}

function PublicRoute({ children }) {
  // Check if the user is already authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 120000,
    gcTime: 300000,
  });
  
  // If we already know the user is logged in and trying to access a login page,
  // redirect to dashboard
  useEffect(() => {
    if (!isLoading && user && window.location.pathname === '/login') {
      // Use regular location change to avoid loops
      window.location.href = '/dashboard';
    }
  }, [user, isLoading]);
  
  return <>{children}</>;
}

function Router() {
  // We don't need location or auth in the main router component
  // This simplifies the component and reduces potential update loops
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>

      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      <Route path="/business-signup">
        <PublicRoute>
          <BusinessSignup />
        </PublicRoute>
      </Route>

      {/* Root path - check for auth but allow public landing page */}
      <Route path="/">
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <AuthRequired>
          <Dashboard />
        </AuthRequired>
      </Route>

      <Route path="/dashboard-enhanced">
        <AuthRequired>
          <EnhancedDashboard />
        </AuthRequired>
      </Route>

      <Route path="/progression-map">
        <AuthRequired>
          <ProgressionMap />
        </AuthRequired>
      </Route>

      <Route path="/assessment">
        <AuthRequired>
          <Assessment />
        </AuthRequired>
      </Route>

      <Route path="/assessment-results">
        <AuthRequired>
          <AssessmentResults />
        </AuthRequired>
      </Route>

      <Route path="/learning-style">
        <AuthRequired>
          <LearningStylePage />
        </AuthRequired>
      </Route>

      <Route path="/modules/:id">
        <AuthRequired>
          <LearningModulePage />
        </AuthRequired>
      </Route>

      <Route path="/core-values-module">
        <AuthRequired>
          <CoreValuesModulePage />
        </AuthRequired>
      </Route>

      <Route path="/core-values-module-new">
        <AuthRequired>
          <CoreValuesModuleNew />
        </AuthRequired>
      </Route>

      <Route path="/micro-modules/:id">
        <AuthRequired>
          <MicroModulePage />
        </AuthRequired>
      </Route>

      <Route path="/discussions/:id">
        <AuthRequired>
          <DiscussionsPage />
        </AuthRequired>
      </Route>

      <Route path="/discussions">
        <AuthRequired>
          <DiscussionsPage />
        </AuthRequired>
      </Route>

      <Route path="/modules">
        <AuthRequired>
          <AllModules />
        </AuthRequired>
      </Route>

      <Route path="/core-values">
        <AuthRequired>
          <CoreValuesPage />
        </AuthRequired>
      </Route>

      <Route path="/mindful-mornings">
        <AuthRequired>
          <MindfulMorningsPage />
        </AuthRequired>
      </Route>

      <Route path="/mindful-mornings-module">
        <AuthRequired>
          <MindfulMorningsModulePage />
        </AuthRequired>
      </Route>

      <Route path="/storytelling-demo">
        <AuthRequired>
          <StorytellingDemoPage />
        </AuthRequired>
      </Route>

      <Route path="/classroom-music">
        <AuthRequired>
          <ClassroomMusic />
        </AuthRequired>
      </Route>

      <Route path="/core-values-shout-out">
        <AuthRequired>
          <CoreValuesShoutOutPage />
        </AuthRequired>
      </Route>

      <Route path="/building-child">
        <AuthRequired>
          <BuildingChildPage />
        </AuthRequired>
      </Route>

      <Route path="/chapter-one">
        <AuthRequired>
          <ChapterOnePage />
        </AuthRequired>
      </Route>

      <Route path="/video-resources">
        <AuthRequired>
          <VideoResourcesPage />
        </AuthRequired>
      </Route>

      <Route path="/tools">
        <AuthRequired>
          <ToolsPage />
        </AuthRequired>
      </Route>

      <Route path="/settings/data-sources">
        <AuthRequired>
          <DataSourcesPage />
        </AuthRequired>
      </Route>

      <Route path="/settings/owner-dashboard">
        <AuthRequired>
          <OwnerDashboardPage />
        </AuthRequired>
      </Route>

      <Route path="/owner-dashboard">
        <AuthRequired>
          <OwnerDashboardStandalone />
        </AuthRequired>
      </Route>

      <Route path="/platform-integrations">
        <AuthRequired>
          <PlatformIntegrationsPage />
        </AuthRequired>
      </Route>

      <Route path="/settings/account">
        <AuthRequired>
          <AccountPage />
        </AuthRequired>
      </Route>

      <Route path="/games">
        <AuthRequired>
          <GamesPage />
        </AuthRequired>
      </Route>

      <Route path="/admin">
        <AuthRequired>
          <AdminPage />
        </AuthRequired>
      </Route>

      <Route path="/admin-modules">
        <AuthRequired>
          <AdminModulesPage />
        </AuthRequired>
      </Route>

      <Route path="/invite-teachers">
        <AuthRequired>
          <InviteTeachersPage />
        </AuthRequired>
      </Route>

      <Route path="/lesson-plan-maker">
        <AuthRequired>
          <LessonPlanMakerPage />
        </AuthRequired>
      </Route>

      <Route path="/casino">
        <AuthRequired>
          <CasinoPage />
        </AuthRequired>
      </Route>

      <Route path="/transition-timer">
        <AuthRequired>
          <TransitionTimer />
        </AuthRequired>
      </Route>

      <Route path="/test-assessment-graph">
        <AuthRequired>
          <TestAssessmentGraph />
        </AuthRequired>
      </Route>

      <Route path="/school-dashboard">
        <AuthRequired>
          <SchoolDashboard />
        </AuthRequired>
      </Route>

      <Route path="/profile">
        <AuthRequired>
          <ProfilePage />
        </AuthRequired>
      </Route>

      <Route path="/app-owner-dashboard">
        <AuthRequired>
          <AppOwnerDashboard />
        </AuthRequired>
      </Route>

      <Route path="/edutok">
        <AuthRequired>
          <EduTokPage />
        </AuthRequired>
      </Route>

      <Route path="/avatar-customization">
        <AuthRequired>
          <AvatarCustomizationPage />
        </AuthRequired>
      </Route>

      <Route path="/beary-ai">
        <AuthRequired>
          <BearyAIPage />
        </AuthRequired>
      </Route>

      {/* Additional assessment routes */}
      <Route path="/enhanced-assessment">
        <AuthRequired>
          <EnhancedAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/simple-assessment">
        <AuthRequired>
          <SimpleAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/ai-assessment">
        <AuthRequired>
          <AIAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/simple-ai-assessment">
        <AuthRequired>
          <SimpleAIAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/enhanced-ai-assessment">
        <AuthRequired>
          <EnhancedAIAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/basic-ai-assessment">
        <AuthRequired>
          <BasicAIAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/dynamic-assessment">
        <AuthRequired>
          <DynamicAssessmentPage />
        </AuthRequired>
      </Route>

      <Route path="/standalone-assessment">
        <AuthRequired>
          <StandaloneAssessment />
        </AuthRequired>
      </Route>

      <Route path="/simple-standalone-assessment">
        <AuthRequired>
          <SimpleStandaloneAssessment />
        </AuthRequired>
      </Route>

      <Route path="/assessment-launcher">
        <AuthRequired>
          <AssessmentLauncher />
        </AuthRequired>
      </Route>

      <Route path="/self-assessment">
        <AuthRequired>
          <SelfAssessment />
        </AuthRequired>
      </Route>

      {/* Direct access routes - no conditional rendering */}
      <Route path="/direct/login">
        <Login />
      </Route>

      <Route path="/direct/register">
        <Register />
      </Route>

      {/* Catch-all route */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}