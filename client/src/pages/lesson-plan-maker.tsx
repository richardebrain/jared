import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import LessonPlanMaker from "@/components/LessonPlanMaker";
import { useLocation } from "wouter";

export default function LessonPlanMakerPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    setLocation("/");
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title>Lesson Plan Maker | MentorMe by Raising Arizona</title>
        <meta name="description" content="Create comprehensive, age-appropriate weekly lesson plans for your preschool classroom with AI assistance." />
      </Helmet>
      
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lesson Plan Maker</h1>
          <p className="text-muted-foreground">
            Create detailed, age-appropriate weekly lesson plans for your classroom
            with a theme of your choice. Your plans will include daily activities,
            learning objectives, and materials needed.
          </p>
        </div>
        
        <LessonPlanMaker />
      </div>
    </>
  );
}