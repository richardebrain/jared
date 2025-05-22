import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  const [location, setLocation] = useLocation();
  
  // Force login page only once when app starts
  useEffect(() => {
    // Set a more specific flag to prevent repeated redirects
    const visitedKey = 'initial_visit_handled';
    const hasVisited = sessionStorage.getItem(visitedKey);
    
    // Only check on initial page load
    if (!hasVisited) {
      const isDeployed = window.location.href.includes('.replit.app') || 
                      window.location.href.includes('replit.dev');
      
      // Mark that we've handled the initial visit check
      sessionStorage.setItem(visitedKey, 'true');
      
      // In production, ensure proper starting page
      if (isDeployed && location !== '/login' && location !== '/register') {
        console.log("First visit - redirecting to login page");
        setLocation('/login');
      }
    }
  }, []);
  
  // Simplified auth check
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000
  });
  
  // Simple authentication state
  const isAuthenticated = !!user;

  // We'll handle redirects in a simpler way
  
  // Handle public routes vs. protected routes
  return (
    <Switch>
      {/* Public routes - accessible when logged out */}
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/register">
        {isAuthenticated ? <Dashboard /> : <Register />}
      </Route>

      <Route path="/business-signup">
        <BusinessSignup />
      </Route>
      
      {/* Protected routes - redirect to login when not authenticated */}
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/dashboard-enhanced">
        {isAuthenticated ? <EnhancedDashboard /> : <Login />}
      </Route>
      
      <Route path="/progression-map">
        {isAuthenticated ? <ProgressionMap /> : <Login />}
      </Route>
      
      <Route path="/assessment">
        {isAuthenticated ? <Assessment /> : <Login />}
      </Route>
      
      <Route path="/assessment-results">
        {isAuthenticated ? <AssessmentResults /> : <Login />}
      </Route>
      
      <Route path="/learning-style">
        {isAuthenticated ? <LearningStylePage /> : <Login />}
      </Route>
      
      <Route path="/modules/:id">
        {isAuthenticated ? <LearningModulePage /> : <Login />}
      </Route>
      
      <Route path="/core-values-module">
        {isAuthenticated ? <CoreValuesModulePage /> : <Login />}
      </Route>
      
      <Route path="/core-values-module-new">
        {isAuthenticated ? <CoreValuesModuleNew /> : <Login />}
      </Route>
      
      <Route path="/micro-modules/:id">
        {isAuthenticated ? <MicroModulePage /> : <Login />}
      </Route>
      
      <Route path="/discussions/:id">
        {isAuthenticated ? <DiscussionsPage /> : <Login />}
      </Route>

      <Route path="/discussions">
        {isAuthenticated ? <DiscussionsPage /> : <Login />}
      </Route>
      
      <Route path="/modules">
        {isAuthenticated ? <AllModules /> : <Login />}
      </Route>
      
      <Route path="/core-values">
        {isAuthenticated ? <CoreValuesPage /> : <Login />}
      </Route>
      
      <Route path="/chapter-one">
        {isAuthenticated ? <ChapterOnePage /> : <Login />}
      </Route>
      
      <Route path="/mindful-mornings">
        {isAuthenticated ? <MindfulMorningsPage /> : <Login />}
      </Route>
      
      <Route path="/mindful-mornings-module">
        {isAuthenticated ? <MindfulMorningsModulePage /> : <Login />}
      </Route>
      
      <Route path="/classroom-music">
        {isAuthenticated ? <ClassroomMusic /> : <Login />}
      </Route>
      
      <Route path="/storytelling-demo">
        {isAuthenticated ? <StorytellingDemoPage /> : <Login />}
      </Route>
      
      <Route path="/core-values-shout-out">
        {isAuthenticated ? <CoreValuesShoutOutPage /> : <Login />}
      </Route>
      
      <Route path="/building-child">
        {isAuthenticated ? <BuildingChildPage /> : <Login />}
      </Route>
      
      <Route path="/video-resources">
        {isAuthenticated ? <VideoResourcesPage /> : <Login />}
      </Route>
      
      <Route path="/tools">
        {isAuthenticated ? <ToolsPage /> : <Login />}
      </Route>
      
      <Route path="/settings/account">
        {isAuthenticated ? <AccountPage /> : <Login />}
      </Route>
      
      <Route path="/settings/owner-dashboard">
        {isAuthenticated ? <OwnerDashboardPage /> : <Login />}
      </Route>
      
      <Route path="/owner-dashboard">
        {isAuthenticated ? <OwnerDashboardStandalone /> : <Login />}
      </Route>
      
      <Route path="/settings/data-sources">
        {isAuthenticated ? <DataSourcesPage /> : <Login />}
      </Route>
      
      <Route path="/settings/platform-integrations">
        {isAuthenticated ? <PlatformIntegrationsPage /> : <Login />}
      </Route>
      
      <Route path="/beary-ai">
        {isAuthenticated ? <BearyAIPage /> : <Login />}
      </Route>
      
      <Route path="/games">
        {isAuthenticated ? <GamesPage /> : <Login />}
      </Route>
      
      <Route path="/casino">
        {isAuthenticated ? <CasinoPage /> : <Login />}
      </Route>
      
      <Route path="/lesson-plan-maker">
        {isAuthenticated ? <LessonPlanMakerPage /> : <Login />}
      </Route>
      
      <Route path="/admin">
        {isAuthenticated ? <AdminPage /> : <Login />}
      </Route>
      
      <Route path="/admin-dashboard">
        {isAuthenticated ? <AdminPage skipPasswordCheck={true} /> : <Login />}
      </Route>
      
      <Route path="/admin/modules">
        {isAuthenticated ? <AdminModulesPage /> : <Login />}
      </Route>
      
      <Route path="/transition-timer">
        {isAuthenticated ? <TransitionTimer /> : <Login />}
      </Route>
      
      <Route path="/test-assessment-graph">
        {isAuthenticated ? <TestAssessmentGraph /> : <Login />}
      </Route>
      
      <Route path="/enhanced-assessment">
        {isAuthenticated ? <EnhancedAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/simple-assessment">
        {isAuthenticated ? <SimpleAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/ai-assessment">
        {isAuthenticated ? <AIAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/simple-ai-assessment">
        {isAuthenticated ? <SimpleAIAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/enhanced-ai-assessment">
        {isAuthenticated ? <EnhancedAIAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/basic-ai-assessment">
        {isAuthenticated ? <BasicAIAssessmentPage /> : <Login />}
      </Route>
      
      <Route path="/dynamic-assessment">
        <DynamicAssessmentPage />
      </Route>
      
      <Route path="/standalone-assessment">
        {isAuthenticated ? <StandaloneAssessment /> : <Login />}
      </Route>
      
      <Route path="/simple-standalone-assessment">
        {isAuthenticated ? <SimpleStandaloneAssessment /> : <Login />}
      </Route>
      
      <Route path="/self-assessment">
        {isAuthenticated ? <SelfAssessment /> : <Login />}
      </Route>
      
      <Route path="/assessment-launcher">
        {isAuthenticated ? <AssessmentLauncher /> : <Login />}
      </Route>
      
      <Route path="/schools/:schoolId">
        {isAuthenticated ? <SchoolDashboard /> : <Login />}
      </Route>
      
      <Route path="/profile">
        {isAuthenticated ? <ProfilePage /> : <Login />}
      </Route>
      
      <Route path="/app-owner-dashboard">
        {isAuthenticated ? <AppOwnerDashboard /> : <Login />}
      </Route>
      
      <Route path="/edutok">
        {isAuthenticated ? <EduTokPage /> : <Login />}
      </Route>
      
      <Route path="/">
        <Login />
      </Route>
      
      {/* Additional copy of login and register routes without conditional rendering for direct access */}
      <Route path="/direct/login">
        <Login />
      </Route>
      
      <Route path="/direct/register">
        <Register />
      </Route>
      
      {/* These routes have already been defined earlier */}
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
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
