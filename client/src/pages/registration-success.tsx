import React from "react";
import Header from "@/components/Header";

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <Header />
      <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-white shadow-lg rounded-lg p-8 border-2 border-green-500/30">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-green-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h1 className="text-3xl font-bold text-center mb-4">Registration Successful!</h1>
          <p className="text-lg text-center mb-8">
            Your school has been registered and your account has been created.
          </p>
          <div>
            <a 
              href="/login" 
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-primary/90"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}