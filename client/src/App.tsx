import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import ErrorBoundary component
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { useAuth, AuthProvider } from "@/lib/auth-context";
// Import session utilities for debugging
import "@/lib/sessionUtils";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import EnhancedDashboard from "@/pages/dashboard-enhanced";
import Login from "@/pages/login";
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
import OwnerDashboardPage from "@/pages/settings/owner-dashboard";
import OwnerDashboardStandalone from "@/pages/owner-dashboard-standalone";
import PlatformIntegrationsPage from "@/pages/platform-integrations";
import AccountPage from "@/pages/settings/account";
import BearyAIPage from "@/pages/beary-ai";
import GamesPage from "@/pages/games";
import EnhancedFroggerGame from "@/components/games/EnhancedFroggerGame";
import AdminPage from "@/pages/admin";
import LessonPlanMakerPage from "@/pages/lesson-plan-maker";
import LessonPlanCreator from "@/pages/lesson-plan-creator";
import LessonPlanViewer from "@/pages/lesson-plan-viewer";
import CasinoPage from "@/pages/casino";
import TransitionTimer from "@/pages/transition-timer";
import SchoolDashboard from "@/pages/school-dashboard";
import ProfilePage from "@/pages/profile";
import AppOwnerDashboard from "@/pages/app-owner-dashboard";
import EduTokPage from "@/pages/edutok";
import AdminModulesPage from "@/pages/admin-modules";
import InviteTeachersPage from "@/pages/invite-teachers";
import AvatarCustomizationPage from "@/pages/avatar-customization";
import DirectorMessages from "@/pages/director-messages";
import ComprehensiveModuleCreator from "@/pages/comprehensive-module-creator";
import EnhancedModuleBuilder from "@/pages/enhanced-module-builder";
import ModuleWizard from "@/pages/module-wizard";
import ModuleCreationWorkflow from "@/components/ModuleCreationWorkflow";
import EmailServiceDemo from "@/pages/EmailServiceDemo";
import DirectorToolkit from "@/pages/director-toolkit";
import AdminTeachersPage from "@/pages/admin-teachers";
import AdminAssignModulesPage from "@/pages/admin-assign-modules";
import AdminMessagingPage from "@/pages/admin-messaging";
import AdminBearBucksPage from "@/pages/admin-bear-bucks";
import AdminMeetingCreator from "@/pages/admin-meeting-creator";
import AdminVideoLibraryPage from "@/pages/admin-video-library";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import CertificateManager from "@/pages/certificate-manager";
import NewsletterManager from "@/pages/newsletter-manager";
import MessagesPage from "@/pages/messages";
import SchoolSettingsPage from "@/pages/school-settings";
import AdvancedVoiceFeatures from "@/components/AdvancedVoiceFeatures";
import PersonalizedStories from "@/pages/personalized-stories";
import ModuleFlowTest from "@/pages/module-flow-test";
import PodcastGenerator from "@/pages/podcast-generator";
import MusicMaker from "@/pages/music-maker";

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
        <Route path="/business-signup">
          <BusinessSignup />
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
  const [location] = useLocation();
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
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

      <Route path="/initial-assessment">
        {!isAuthenticated && !isLoading ? (
          location !== "/login" ? <Redirect to="/login" /> : <Login />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <InitialAssessment />
        )}
      </Route>

      <Route path="/assessment-questions">
        {!isAuthenticated && !isLoading ? (
          location !== "/login" ? <Redirect to="/login" /> : <Login />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AssessmentQuestions />
        )}
      </Route>

      <Route path="/assessment-results">
        {!isAuthenticated && !isLoading ? (
          location !== "/login" ? <Redirect to="/login" /> : <Login />
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

      <Route path="/learning-module/:id">
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

      <Route path="/personalized-stories">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <PersonalizedStories />
        )}
      </Route>

      <Route path="/module-flow-test">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ModuleFlowTest />
        )}
      </Route>

      <Route path="/voice-features-demo">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AdvancedVoiceFeatures />
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

      <Route path="/voice-features-demo">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AdvancedVoiceFeatures />
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

      <Route path="/enhanced-frogger">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <EnhancedFroggerGame />
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

      <Route path="/lesson-plan-creator">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <LessonPlanCreator />
        )}
      </Route>

      <Route path="/lesson-plan/:id">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <LessonPlanViewer />
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

      <Route path="/director-messages">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <DirectorMessages />
        )}
      </Route>

      <Route path="/director-toolkit">
        <ProtectedRoute adminOnly={true}>
          <DirectorToolkit />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/teachers">
        <ProtectedRoute adminOnly={true}>
          <AdminTeachersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/assign-modules">
        <ProtectedRoute adminOnly={true}>
          <AdminAssignModulesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/messaging">
        <ProtectedRoute adminOnly={true}>
          <AdminMessagingPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/video-library">
        <ProtectedRoute adminOnly={true}>
          <AdminVideoLibraryPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/analytics">
        <ProtectedRoute adminOnly={true}>
          <AdminAnalyticsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/school-settings">
        <ProtectedRoute adminOnly={true}>
          <SchoolSettingsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/certificate-manager">
        <ProtectedRoute adminOnly={true}>
          <CertificateManager />
        </ProtectedRoute>
      </Route>

      <Route path="/newsletter-manager">
        <ProtectedRoute adminOnly={true}>
          <NewsletterManager />
        </ProtectedRoute>
      </Route>

      <Route path="/module-creator">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ComprehensiveModuleCreator />
        )}
      </Route>

      <Route path="/comprehensive-module-creator">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ComprehensiveModuleCreator />
        )}
      </Route>

      <Route path="/enhanced-module-builder">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <EnhancedModuleBuilder />
        )}
      </Route>

      <Route path="/messages">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <MessagesPage />
        )}
      </Route>

      <Route path="/admin-bear-bucks">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AdminBearBucksPage />
        )}
      </Route>

      <Route path="/admin-meeting-creator">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AdminMeetingCreator />
        )}
      </Route>

      <Route path="/module-wizard">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ModuleWizard />
        )}
      </Route>

      <Route path="/podcast-generator">
        <ProtectedRoute adminOnly={true}>
          <PodcastGenerator />
        </ProtectedRoute>
      </Route>

      <Route path="/music-maker">
        <ProtectedRoute adminOnly={true}>
          <MusicMaker />
        </ProtectedRoute>
      </Route>

      <Route path="/step-by-step-creator">
        {!isAuthenticated && !isLoading ? (
          <Redirect to="/login" />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ModuleCreationWorkflow />
        )}
      </Route>

      <Route path="/admin/modules">
        <ProtectedRoute adminOnly={true}>
          <AdminModulesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/email-demo">
        <ProtectedRoute adminOnly={true}>
          <EmailServiceDemo />
        </ProtectedRoute>
      </Route>

      <Route path="/transition-timer">
        <ProtectedRoute>
          <TransitionTimer />
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
