import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "next-themes";
import Login from "./pages/login";

// Add error boundary to prevent white screens
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Just show a simple error message with redirect
      console.log("React error boundary triggered - using simple fallback");
      return (
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h2>Something went wrong</h2>
          <p>Please try reloading the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '8px 16px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a fallback component in case React can't load
window.addEventListener('load', () => {
  // If root element doesn't have children after 3 seconds, show emergency fallback
  setTimeout(() => {
    const rootEl = document.getElementById('root');
    if (rootEl && !rootEl.hasChildNodes()) {
      console.error("React failed to render - using emergency fallback");
      rootEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif;">
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">MentorMe Login</h1>
          <a href="/login" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none;">
            Go to Login Page
          </a>
          <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; background: transparent;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }, 3000);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
