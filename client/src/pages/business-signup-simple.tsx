import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";

export default function BusinessSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic form fields
  const [schoolName, setSchoolName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schoolName || !contactEmail || !adminPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    console.log("Starting simplified business registration process");
    
    try {
      // Create school first
      console.log("Step 1: Creating school");
      const schoolResponse = await fetch("/api/schools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: schoolName,
          adminPasswordHash: adminPassword,
          contactEmail: contactEmail
        })
      });
      
      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json();
        console.error("School creation error:", errorData);
        throw new Error(errorData.message || "Failed to create school");
      }
      
      const schoolData = await schoolResponse.json();
      console.log("School created successfully:", schoolData.id);
      
      toast({
        title: "School Registration Successful",
        description: "Your school has been registered! You can now create a teacher account."
      });
      
      // Navigate to register page so they can create a teacher account associated with their school
      setTimeout(() => {
        navigate("/register", { 
          state: { 
            schoolId: schoolData.id,
            schoolName: schoolName
          } 
        });
      }, 2000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error?.message || "There was an error registering your school.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container max-w-md px-4 pt-8">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Register Your School</CardTitle>
            <CardDescription>
              Create an account for your preschool or childcare center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">
                  School Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="school-name"
                  placeholder="Your School Name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@yourschool.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">
                  Admin Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Set a secure password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register School"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}