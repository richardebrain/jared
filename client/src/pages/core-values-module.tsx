import { useEffect } from "react";
import { useLocation } from "wouter";

// This is a redirect component to the new CORE Values module

export default function CoreValuesModulePage() {
  const [_, setLocation] = useLocation();
  
  // Redirect to the new implementation
  useEffect(() => {
    setLocation('/core-values-module-new');
  }, [setLocation]);
  
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Redirecting to updated CORE Values module...</p>
      </div>
    </div>
  );
}