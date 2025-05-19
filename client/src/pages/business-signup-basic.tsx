import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function BusinessSignupBasic() {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Simple form state - no complex validations or schemas
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    schoolName: "",
    adminPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.trim()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Basic validation
    if (!formData.username || !formData.password || !formData.firstName || 
        !formData.lastName || !formData.email || !formData.schoolName || 
        !formData.adminPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    console.log("Starting simple business registration process");
    
    try {
      // Step 1: Register as regular user
      console.log("Step 1: Creating user account");
      const userResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          schoolId: 1, // Default to Raising Arizona
          isSchoolAdmin: false // Will update this after school creation
        })
      });
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || "Failed to create user account");
      }
      
      const userData = await userResponse.json();
      console.log("User created successfully:", userData.id);
      
      // Step 2: Create school
      console.log("Step 2: Creating school");
      const schoolResponse = await fetch("/api/schools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.schoolName,
          adminPasswordHash: formData.adminPassword,
          contactEmail: formData.email
        })
      });
      
      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json();
        console.error("School creation error:", errorData);
        // Continue anyway - user was created
        toast({
          title: "Partial success",
          description: "Your account was created but there was an issue setting up your school. Please contact support.",
        });
        navigate("/dashboard");
        return;
      }
      
      const schoolData = await schoolResponse.json();
      console.log("School created successfully:", schoolData.id);
      
      // Step 3: Update user's school
      console.log("Step 3: Updating user's school association");
      const updateResponse = await fetch(`/api/users/${userData.id}/update-school`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schoolId: schoolData.id,
          isSchoolAdmin: true
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("User update error:", errorData);
        // Continue anyway - user and school were created
      } else {
        console.log("User successfully associated with new school");
      }
      
      toast({
        title: "Registration successful!",
        description: "Your school and account have been created successfully.",
      });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-accent bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2">
            Business Owner Registration
          </h1>
          <p className="text-neutral-700">
            Create your school account to start managing your team's professional development
          </p>
        </div>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Your Account</h2>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <h2 className="text-xl font-bold">School Information</h2>
              
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  placeholder="Your school's name"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  placeholder="Create a school admin password"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  This password will be used to access your school's administration panel
                </p>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create School Account"}
            </Button>
            
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center mb-2">
                If you encounter any issues with this page, try our standard registration:
              </p>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => navigate("/register")}
              >
                Use Regular Registration
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-neutral-500">Already have an account? </span>
              <a 
                href="/login" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Log in
              </a>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}