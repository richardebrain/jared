import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import ErrorBoundary component
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { useAuth, AuthProvider } from "@/lib/auth-context";
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

// Create a wrapper component that uses AuthProvider internally
function AuthenticatedRouter() {
  const [initialSessionCleared, setInitialSessionCleared] = useState(false);

  // Effect to clear server-side session on initial page load
  useEffect(() => {
    const clearInitialSession = async () => {
      if (window.location.pathname === "/" && !initialSessionCleared) {
        try {
          // Clear any client-side storage
          sessionStorage.removeItem("laura_login_success");
          localStorage.removeItem("isAuthenticated");

          // Call server endpoint to clear any existing session
          await fetch("/api/auth/clear-session");
          console.log("Initial session cleared on page load");
        } catch (err) {
          console.warn("Error clearing initial session:", err);
        } finally {
          setInitialSessionCleared(true);
        }
      }
    };

    clearInitialSession();
  }, [initialSessionCleared]);

  try {
    // This component safely uses useAuth inside the AuthProvider
    const { isAuthenticated, isLoading, user, isAdmin, isOwner } = useAuth();

    return (
      <Router
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        user={user}
        isAdmin={isAdmin}
        isOwner={isOwner}
      />
    );
  } catch (error) {
    console.error("Auth router error:", error);
    // Fallback to a simplified router with no auth
    // Clear any stored auth data to ensure fresh login
    sessionStorage.removeItem("laura_login_success");
    localStorage.removeItem("isAuthenticated");

    return (
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/register">
          <Register />
        </Route>
        <Route path="/">
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }
}

// Router component takes auth state as props
function Router(props: {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  isAdmin: boolean;
  isOwner: boolean;
}) {
  const { isAuthenticated, isLoading, user, isAdmin, isOwner } = props;
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/register">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Register />}
      </Route>

      <Route path="/business-signup">
        <BusinessSignup />
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
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Assessment />
        )}
      </Route>

      <Route path="/assessment-results">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AssessmentResults />
        )}
      </Route>

      <Route path="/learning-style">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <LearningStylePage />
        )}
      </Route>

      <Route path="/modules/:id">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <LearningModulePage />
        )}
      </Route>

      <Route path="/core-values-module">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <CoreValuesModulePage />
        )}
      </Route>

      <Route path="/core-values-module-new">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <CoreValuesModuleNew />
        )}
      </Route>

      <Route path="/micro-modules/:id">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MicroModulePage />
        )}
      </Route>

      <Route path="/discussions/:id">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <DiscussionsPage />
        )}
      </Route>

      <Route path="/discussions">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <DiscussionsPage />
        )}
      </Route>

      <Route path="/modules">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AllModules />
        )}
      </Route>

      <Route path="/core-values">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <CoreValuesPage />
        )}
      </Route>

      <Route path="/chapter-one">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ChapterOnePage />
        )}
      </Route>

      <Route path="/mindful-mornings">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MindfulMorningsPage />
        )}
      </Route>

      <Route path="/mindful-mornings-module">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MindfulMorningsModulePage />
        )}
      </Route>

      <Route path="/classroom-music">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ClassroomMusic />
        )}
      </Route>

      <Route path="/storytelling-demo">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <StorytellingDemoPage />
        )}
      </Route>

      <Route path="/core-values-shout-out">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <CoreValuesShoutOutPage />
        )}
      </Route>

      <Route path="/building-child">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <BuildingChildPage />
        )}
      </Route>

      <Route path="/video-resources">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <VideoResourcesPage />
        )}
      </Route>

      <Route path="/tools">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ToolsPage />
        )}
      </Route>

      <Route path="/settings/account">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AccountPage />
        )}
      </Route>

      <Route path="/settings/owner-dashboard">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <OwnerDashboardPage />
        )}
      </Route>

      <Route path="/owner-dashboard">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <OwnerDashboardStandalone />
        )}
      </Route>

      <Route path="/settings/data-sources">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <DataSourcesPage />
        )}
      </Route>

      <Route path="/settings/platform-integrations">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <PlatformIntegrationsPage />
        )}
      </Route>

      <Route path="/beary-ai">
        <ProtectedRoute adminOnly={false}>
          <BearyAIPage />
        </ProtectedRoute>
      </Route>

      <Route path="/games">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <GamesPage />
        )}
      </Route>

      <Route path="/casino">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <CasinoPage />
        )}
      </Route>

      <Route path="/lesson-plan-maker">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <LessonPlanMakerPage />
        )}
      </Route>

      <Route path="/admin">
        <ProtectedRoute adminOnly={true}>
          <AdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin-dashboard">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !isAuthenticated ? (
          <Redirect to="/login" />
        ) : !isAdmin ? (
          <Redirect to="/dashboard" />
        ) : (
          <AdminPage skipPasswordCheck={true} />
        )}
      </Route>

      <Route path="/admin/modules">
        <ProtectedRoute adminOnly={true}>
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
        <ProtectedRoute adminOnly={true}>
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

      {/* Direct access routes for emergency use - simplified to avoid auth context issues */}
      <Route path="/direct/login">
        <Login />
      </Route>

      <Route path="/direct/register">
        <Register />
      </Route>

      {/* Fallback route */}
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
        <AuthProvider>
          <AuthenticatedRouter />
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
