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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
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
      
      <div className="container max-w-lg mx-auto flex flex-col items-center justify-center h-screen text-center px-4">
        <div className="mb-6">
          <Loader2 className="h-16 w-16 text-amber-400 animate-spin mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-white mb-4">EduTok Coming Soon</h1>
          <div className="inline-block py-2 px-4 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-sm font-medium mb-6">
            In Development
          </div>
          <p className="text-slate-300 mb-8">
            We're currently enhancing our EduTok feature to provide you with the best possible experience. 
            Soon you'll be able to swipe through bite-sized teaching wisdom in a fun and intuitive format.
          </p>
          <Button 
            onClick={() => navigate("/tools")} 
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Return to Teacher Tools
          </Button>
        </div>
      </div>
    </div>
  );
}