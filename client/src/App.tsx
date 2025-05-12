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
  console.log("Authentication state:", { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Simple routing solution - if authenticated, show appropriate component; if not, redirect to login
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? 
          (() => { 
            console.log("Redirecting to dashboard from /login");
            window.location.replace("/dashboard");
            return <div>Redirecting to dashboard...</div>;
          })() : 
          <Login />
        }
      </Route>
      
      <Route path="/register">
        {isAuthenticated ? 
          (() => { 
            console.log("Redirecting to dashboard from /register");
            window.location.replace("/dashboard");
            return <div>Redirecting to dashboard...</div>;
          })() : 
          <Register />
        }
      </Route>
      
      <Route path="/dashboard">
        {isAuthenticated ? 
          <Dashboard /> : 
          (() => { 
            console.log("Redirecting to login from /dashboard");
            window.location.replace("/login");
            return <div>Redirecting to login...</div>;
          })()
        }
      </Route>
      
      <Route path="/schedule">
        {isAuthenticated ? 
          <Schedule /> : 
          (() => { 
            console.log("Redirecting to login from /schedule");
            window.location.replace("/login");
            return <div>Redirecting to login...</div>;
          })()
        }
      </Route>
      
      <Route path="/assessment">
        {isAuthenticated ? 
          <Assessment /> : 
          (() => { 
            console.log("Redirecting to login from /assessment");
            window.location.replace("/login");
            return <div>Redirecting to login...</div>;
          })()
        }
      </Route>
      
      <Route path="/modules/:id">
        {isAuthenticated ? 
          <LearningModulePage /> : 
          (() => { 
            console.log("Redirecting to login from /modules/:id");
            window.location.replace("/login");
            return <div>Redirecting to login...</div>;
          })()
        }
      </Route>
      
      <Route path="/" exact>
        {isAuthenticated ? 
          (() => { 
            console.log("Redirecting to dashboard from /");
            window.location.replace("/dashboard");
            return <div>Redirecting to dashboard...</div>;
          })() : 
          <Login />
        }
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
