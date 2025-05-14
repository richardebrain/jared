import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ProgressionMap from "@/pages/progression-map";
import Assessment from "@/pages/assessment";
import LearningModulePage from "@/pages/learning-module";
import MicroModulePage from "@/pages/micro-module";
import LearningStylePage from "@/pages/learning-style";
import DiscussionsPage from "@/pages/discussions";
import AllModules from "@/pages/modules";
import CoreValuesPage from "@/pages/core-values";
import MindfulMorningsPage from "@/pages/mindful-mornings";
import StorytellingDemoPage from "@/pages/storytelling-demo";
import CoreValuesShoutOutPage from "@/pages/core-values-shout-out";
import BuildingChildPage from "@/pages/building-child";
import VideoResourcesPage from "@/pages/video-resources";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Much simpler routing approach to avoid redirection loops
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/register">
        {isAuthenticated ? <Dashboard /> : <Register />}
      </Route>
      
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/progression-map">
        {isAuthenticated ? <ProgressionMap /> : <Login />}
      </Route>
      
      <Route path="/assessment">
        {isAuthenticated ? <Assessment /> : <Login />}
      </Route>
      
      <Route path="/learning-style">
        {isAuthenticated ? <LearningStylePage /> : <Login />}
      </Route>
      
      <Route path="/modules/:id">
        {isAuthenticated ? <LearningModulePage /> : <Login />}
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
      
      <Route path="/mindful-mornings">
        {isAuthenticated ? <MindfulMorningsPage /> : <Login />}
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
      
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
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
      <Router />
    </TooltipProvider>
  );
}

export default App;
