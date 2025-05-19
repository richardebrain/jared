import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Simple success page with no complexity
export default function RegistrationSuccess() {
  const [_, navigate] = useLocation();
  const [schoolName, setSchoolName] = useState<string>("");
  const [countdownValue, setCountdownValue] = useState<number>(5);
  
  useEffect(() => {
    // Parse school name from URL if present
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    
    if (nameParam) {
      setSchoolName(decodeURIComponent(nameParam));
    }
    
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <Header />
      
      <div className="container max-w-3xl mx-auto py-8 px-4 text-center">
        <div className="bg-white shadow-lg rounded-lg p-8 border-2 border-primary/10">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-24 w-24 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Registration Successful!</h1>
          
          {schoolName ? (
            <p className="text-xl mb-6">
              <span className="font-medium">{schoolName}</span> has been successfully registered.
            </p>
          ) : (
            <p className="text-xl mb-6">
              Your school has been successfully registered.
            </p>
          )}
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
            <p className="text-blue-700">
              The school owner account has been created. You can now log in with your username and password.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button asChild className="w-full py-6 text-lg">
              <Link href="/login">
                Continue to Login
              </Link>
            </Button>
            
            <p className="text-muted-foreground">
              You will be automatically redirected to the login page in {countdownValue} seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}