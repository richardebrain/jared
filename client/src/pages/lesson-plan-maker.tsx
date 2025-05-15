import React from "react";
import { Helmet } from "react-helmet";
import LessonPlanMaker from "@/components/LessonPlanMaker";

export default function LessonPlanMakerPage() {
  return (
    <div>
      <Helmet>
        <title>Lesson Plan Maker | Raising Arizona Preschool</title>
        <meta 
          name="description" 
          content="Create custom, age-appropriate lesson plans for your classroom with AI assistance."
        />
      </Helmet>
      
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Lesson Plan Maker</h1>
          <p className="text-muted-foreground">
            Create custom, age-appropriate lesson plans for your classroom with AI assistance
          </p>
        </div>
        
        <LessonPlanMaker />
      </div>
    </div>
  );
}