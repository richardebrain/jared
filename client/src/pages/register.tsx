import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import raisingArizonaLogo from "../assets/images/raising-arizona-logo.jpg";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GoogleAuthButton from "@/components/GoogleAuthButton";


// Form schema for registration - simplified for ease of use
const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  firstName: z.string().min(1, {
    message: "First name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  // Using defaults for removed fields to maintain compatibility with backend
  language: z.string().default("English"),
  nativeLanguage: z.string().default("English"),
  timeZone: z.string().default("UTC-05:00"), // Default to Eastern Time
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Create form with simplified fields
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      // Default values for removed fields
      language: "English",
      nativeLanguage: "English",
      timeZone: "UTC-05:00",
    },
  });

  // Register mutation
  const { mutate: register, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      try {
        // Make sure all form data is clean and trimmed
        const cleanData = {
          ...data,
          username: data.username.trim(),
          password: data.password.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
        };
        
        console.log("Sending registration data:", { 
          ...cleanData, 
          password: "***" // Don't log actual password
        });
        
        return await apiRequest("/api/auth/register", {
          method: "POST",
          data: cleanData
        });
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store user data in localStorage as a fallback authentication method
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('isAuthenticated', 'true');
      
      toast({
        title: "Registration successful!",
        description: "Welcome to MentorMe. Let's start your teacher training journey!",
      });
      
      // Redirect to dashboard using direct window location for consistent navigation
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof registerSchema>) {
    register(values);
  }

  // No need to manually set defaults anymore as we're using default values

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto w-48 h-48 mb-4 animate-float">
            <img 
              src={raisingArizonaLogo} 
              alt="Raising Arizona Preschool" 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-4xl font-accent bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2 animate-pulse-slow">MentorMe</h1>
          <p className="text-neutral-800 animate-pop">Create your Raising Arizona teacher account and begin your professional development journey today!</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-6 text-center">Sign Up</h2>
          
          {/* Direct email signup is the preferred method */}
          <div className="mb-6">
            <GoogleAuthButton 
              mode="signup"
              onSuccess={() => {
                console.log("Google signup successful");
                // Redirect will happen from server
              }}
              onError={(error) => {
                console.error("Google signup error:", error);
                toast({
                  title: "Signup failed",
                  description: "Google authentication failed. Please try again or use the form below.",
                  variant: "destructive",
                });
              }}
            />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-primary font-bold">
                  Or create account with email
                </span>
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your first name" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.trim());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your last name" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value.trim());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Choose a username" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e.target.value.trim());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.trim());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.trim());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Language and timezone fields removed for simplicity */}
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 hover-pop hover-glow" disabled={isPending}>
                {isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-800">
              Already have an account? <Link href="/" className="text-primary hover:underline hover-rotate font-bold">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
