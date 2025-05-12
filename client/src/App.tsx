import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Schedule from "@/pages/schedule";
import Assessment from "@/pages/assessment";
import LearningModulePage from "@/pages/learning-module";
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
      
      <Route path="/schedule">
        {isAuthenticated ? <Schedule /> : <Login />}
      </Route>
      
      <Route path="/assessment">
        {isAuthenticated ? <Assessment /> : <Login />}
      </Route>
      
      <Route path="/modules/:id">
        {isAuthenticated ? <LearningModulePage /> : <Login />}
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
