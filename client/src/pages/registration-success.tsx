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
            <h3 className="text-lg font-semibold text-blue-800 mb-2">What's next?</h3>
            <ul className="text-blue-700 text-left space-y-2">
              <li className="flex items-start">
                <span className="inline-block mr-2">1.</span>
                <span>Log in with your new owner account credentials</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block mr-2">2.</span>
                <span>Access your School Admin Dashboard by clicking on your profile picture and selecting "School Dashboard"</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block mr-2">3.</span>
                <span>Use the password <strong>"Bigsurf99"</strong> if prompted when accessing your school dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block mr-2">4.</span>
                <span>Customize your school settings and add teachers through the admin panel</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block mr-2">5.</span>
                <span>Monitor teacher progress, points, and achievements from your dashboard</span>
              </li>
            </ul>
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