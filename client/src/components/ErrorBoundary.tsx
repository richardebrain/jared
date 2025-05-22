import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to gracefully handle React errors.
 * When a component error occurs, this will display a fallback UI
 * instead of crashing the entire application.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error("React error boundary triggered - using simple fallback", error, errorInfo);
  }

  handleReset = (): void => {
    // Clear all local storage data that might be causing issues
    localStorage.removeItem('isAuthenticated');
    // Reload the app
    window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Something Went Wrong</CardTitle>
              <CardDescription className="text-center">
                We're sorry, but there was an error loading this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                The application encountered an unexpected error. Try refreshing the page or click the button below to reset the application.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" onClick={this.handleReset}>
                Reset App
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;