import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";

// Ultra simplified business signup form with direct submit
export default function BusinessDirectSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // School information
  const [schoolName, setSchoolName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // User (owner) information
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!schoolName || !contactEmail || !adminPassword) {
      toast({
        title: "Missing School Information",
        description: "Please fill in all required school information fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (!username || !password || !firstName || !lastName || !email) {
      toast({
        title: "Missing Account Information",
        description: "Please fill in all required account information fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    // Proceed with registration
    setIsLoading(true);
    
    try {
      console.log("Starting business registration");
      
      // Create payload with all necessary data
      const payload = {
        // School information
        schoolName,
        adminPassword,
        contactEmail,
        
        // User information
        username,
        password,
        firstName,
        lastName,
        email
      };
      
      // Use fetch directly with improved error handling
      const response = await fetch("/api/business-signup/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (err) {
          console.error("Error parsing error response:", err);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Show success message
      toast({
        title: "Registration Successful!",
        description: `Welcome to MentorMe, ${firstName}! Your school "${schoolName}" has been registered.`,
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not complete your registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <Header />
      
      <div className="container pt-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <Card className="w-full shadow-lg border-2 border-primary/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-bold">
                Register Your School
              </CardTitle>
              <CardDescription className="text-lg">
                Get started with MentorMe professional development
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-medium text-lg mb-4">School Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="schoolName" className="text-sm font-medium">
                          School Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="schoolName"
                          type="text"
                          placeholder="Enter your school name"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactEmail" className="text-sm font-medium">
                          School Contact Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          placeholder="contact@yourschool.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="adminPassword" className="text-sm font-medium">
                          School Admin Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="Create a secure password for school administration"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="mt-1"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This password is used for school-level administration and is separate from your personal account password.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-medium text-lg mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Your first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-1"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Your last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium">
                          Username <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a secure password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">
                          Confirm Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 text-center">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading} 
                    className="w-full md:w-auto px-8 py-2 text-lg font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        Registering...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <a 
                        href="/login" 
                        className="text-primary underline underline-offset-4 hover:opacity-80"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/login");
                        }}
                      >
                        Login
                      </a>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              
              <div className="text-xs text-muted-foreground text-right max-w-[280px]">
                By completing registration, you agree to our Terms of Service and Privacy Policy.
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}