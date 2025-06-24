import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { useSimpleAuth } from "@/lib/simple-auth";
import "@/lib/sessionUtils";

// Import pages
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import EnhancedDashboard from "@/pages/dashboard-enhanced";
import Login from "@/pages/login";
import LoginSimple from "@/pages/login-simple";
import Register from "@/pages/register";
import BusinessSignup from "@/pages/business-signup";
import LandingPage from "@/pages/landing";
import ProgressionMap from "@/pages/progression-map";
import InitialAssessment from "@/pages/initial-assessment";
import AssessmentQuestions from "@/pages/assessment-questions";
import AssessmentResults from "@/pages/assessment-results";
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
import ContentPage from "@/pages/settings/content";
import OwnerDashboardPage from "@/pages/settings/owner-dashboard";
import OwnerDashboardStandalone from "@/pages/owner-dashboard-standalone";
import PlatformIntegrationsPage from "@/pages/platform-integrations";
import AccountPage from "@/pages/settings/account";
import TestPage from "@/pages/test-page";
import EmergencyLogin from "@/pages/emergency-login";

// Import other components
import { AuthValidator } from "@/lib/auth-validator";

// Main App component
function App() {
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const isAdmin = user?.isAdmin || user?.is_admin || false;
  const isOwner = user?.isOwner || user?.is_owner || false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <ErrorBoundary>
        <Switch>
          {/* Public routes */}
          <Route path="/login">
            <Login />
          </Route>
          
          <Route path="/login-simple">
            <LoginSimple />
          </Route>

          <Route path="/register">
            <Register />
          </Route>

          <Route path="/business-signup">
            <BusinessSignup />
          </Route>

          <Route path="/emergency">
            <EmergencyLogin />
          </Route>

          <Route path="/test-page">
            <TestPage />
          </Route>

          {/* Root path - show landing page or dashboard based on auth */}
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

          <Route path="/initial-assessment">
            <ProtectedRoute>
              <InitialAssessment />
            </ProtectedRoute>
          </Route>

          <Route path="/assessment-questions">
            <ProtectedRoute>
              <AssessmentQuestions />
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
            <ProtectedRoute requiresAssessment={true}>
              <LearningModulePage />
            </ProtectedRoute>
          </Route>

          <Route path="/learning-module/:id">
            <ProtectedRoute requiresAssessment={true}>
              <LearningModulePage />
            </ProtectedRoute>
          </Route>

          <Route path="/core-values-module">
            <ProtectedRoute requiresAssessment={true}>
              <CoreValuesModulePage />
            </ProtectedRoute>
          </Route>

          <Route path="/core-values-module-new">
            <ProtectedRoute requiresAssessment={true}>
              <CoreValuesModuleNew />
            </ProtectedRoute>
          </Route>

          <Route path="/mindful-mornings-module">
            <ProtectedRoute requiresAssessment={true}>
              <MindfulMorningsModulePage />
            </ProtectedRoute>
          </Route>

          <Route path="/micro-module/:id">
            <ProtectedRoute requiresAssessment={true}>
              <MicroModulePage />
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

          <Route path="/storytelling-demo">
            <ProtectedRoute>
              <StorytellingDemoPage />
            </ProtectedRoute>
          </Route>

          <Route path="/classroom-music">
            <ProtectedRoute>
              <ClassroomMusic />
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

          <Route path="/settings/data-sources">
            <ProtectedRoute adminOnly={true}>
              <DataSourcesPage />
            </ProtectedRoute>
          </Route>

          <Route path="/settings/content">
            <ProtectedRoute adminOnly={true}>
              <ContentPage />
            </ProtectedRoute>
          </Route>

          <Route path="/settings/owner-dashboard">
            <ProtectedRoute adminOnly={true}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          </Route>

          <Route path="/owner-dashboard">
            <ProtectedRoute adminOnly={true}>
              <OwnerDashboardStandalone />
            </ProtectedRoute>
          </Route>

          <Route path="/platform-integrations">
            <ProtectedRoute adminOnly={true}>
              <PlatformIntegrationsPage />
            </ProtectedRoute>
          </Route>

          <Route path="/settings/account">
            <ProtectedRoute>
              <AccountPage />
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

          {/* Catch all route */}
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </ErrorBoundary>
    </div>
  );
}

export default App;