import Header from "@/components/Header";
import LearningStyleAssessment from "@/components/LearningStyleAssessment";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";

export default function LearningStylePage() {
  const { isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      <main className="container mx-auto py-8">
        <LearningStyleAssessment />
      </main>
    </div>
  );
}