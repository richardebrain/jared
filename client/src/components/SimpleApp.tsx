import { useSimpleAuth } from "@/lib/simple-auth";
import { Toaster } from "@/components/ui/toaster";
import SimpleLoginPage from "./SimpleLoginPage";
import Dashboard from "@/pages/dashboard";

export default function SimpleApp() {
  const { isAuthenticated, isLoading, user } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <SimpleLoginPage />}
      <Toaster />
    </>
  );
}