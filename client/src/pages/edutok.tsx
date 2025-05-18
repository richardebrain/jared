import React from "react";
import Header from "@/components/Header";
import EduTokFeed from "@/components/EduTokFeed";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function EduTokPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="fixed top-0 left-0 z-50 p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/tools")} 
          className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <EduTokFeed />
    </div>
  );
}