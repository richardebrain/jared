import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function UltraSimpleRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const schoolName = formData.get("schoolName") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const adminUsername = formData.get("adminUsername") as string;
    const adminPassword = formData.get("adminPassword") as string;
    const adminName = formData.get("adminName") as string;
    
    // Validate required fields
    if (!schoolName || !email || !adminUsername || !adminPassword || !adminName) {
      setError("All fields marked with * are required");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/register-business-simplified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolName,
          email,
          phoneNumber,
          adminUsername,
          adminPassword,
          adminName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to register school");
      }
      
      setSuccess(true);
      toast({
        title: "Registration Successful",
        description: "Your school has been registered successfully!",
      });
      
      // Redirect to success page
      window.location.href = "/registration-success";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to register school",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Registration Successful!</h1>
            <p className="mt-2 text-gray-600">
              Your school has been registered. Redirecting to success page...
            </p>
          </div>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/registration-success">Continue</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Register Your School</h1>
          <p className="mt-2 text-gray-600">
            Join MentorMe's professional development platform
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <Input
              id="schoolName"
              name="schoolName"
              placeholder="Raising Arizona Preschool"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@yourschool.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div className="pt-4 border-t">
            <h2 className="text-lg font-medium mb-2">Admin Account Details</h2>
            <p className="text-sm text-gray-500 mb-4">
              Create an owner account to manage your school's subscription
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Full Name *</Label>
              <Input
                id="adminName"
                name="adminName"
                placeholder="Jane Smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminUsername">Admin Username *</Label>
              <Input
                id="adminUsername"
                name="adminUsername"
                placeholder="jane_smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password *</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters
              </p>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full py-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                Registering...
              </>
            ) : (
              "Register School"
            )}
          </Button>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already registered?</span>{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}