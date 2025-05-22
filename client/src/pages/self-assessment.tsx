import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherSelfAssessment } from "@/components/TeacherSelfAssessment";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SelfAssessmentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-md mb-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-center mt-2">
              Teacher Self-Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                This self-assessment will help us customize your learning experience
                based on your own perception of your teaching skills.
              </p>
            </div>
            
            <TeacherSelfAssessment />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}