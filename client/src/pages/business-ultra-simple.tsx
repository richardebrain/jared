import React from "react";
import Header from "@/components/Header";

// Ultra simple business registration with minimal React complexity
export default function BusinessUltraSimple() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <Header />
      
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-primary/10">
          <h1 className="text-2xl font-bold text-center mb-2">Register Your School</h1>
          <p className="text-center text-muted-foreground mb-6">Get started with MentorMe professional development</p>
          
          <form 
            action="/api/business-signup/complete"
            method="POST" 
            className="space-y-6"
          >
            <div className="space-y-4 bg-gray-50 p-4 rounded-md">
              <h2 className="font-medium text-lg">School Information</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  School Name <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="schoolName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  School Contact Email <span className="text-red-500">*</span>
                  <input
                    type="email"
                    name="contactEmail"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  School Admin Password <span className="text-red-500">*</span>
                  <input
                    type="password"
                    name="adminPassword"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </label>
                <p className="text-xs text-gray-500">
                  This password is used for school-level administration.
                </p>
              </div>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-md">
              <h2 className="font-medium text-lg">School Owner Account</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="firstName"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      required
                    />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="lastName"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      required
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Username <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="username"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                    <input
                      type="password"
                      name="password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      required
                    />
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                      required
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 text-center">
              <button 
                type="submit" 
                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Register School & Create Account
              </button>
              
              <p className="mt-4 text-sm text-muted-foreground">
                Already have an account? <a href="/login" className="text-primary underline">Sign in</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}