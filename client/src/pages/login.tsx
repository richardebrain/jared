import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { loginUser, saveAuthState } from "../lib/authHelpers";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GoogleAuthButton from "@/components/GoogleAuthButton";

// Import logo
import raisingArizonaLogo from '../assets/images/raising-arizona-logo.jpg';

// Form schema for login
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Create form
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Login mutation
  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      console.log("Attempting login with:", { username: data.username, password: "***" });
      
      try {
        // Trim inputs for consistency
        const cleanData = {
          username: data.username.trim(),
          password: data.password.trim()
        };
        
        console.log("Sending cleaned login data:", { username: cleanData.username, password: "***" });
        
        // Handle special demo case directly in client
        if (cleanData.username === 'jlcookie20' && cleanData.password !== 'password') {
          console.log("Demo user detected but with incorrect password, providing hint");
          throw new Error("For the demo user 'jlcookie20', please use password: 'password'");
        }
        
        // Use our improved loginUser function from authHelpers
        const responseData = await loginUser(cleanData);
        
        console.log("Login response:", responseData);
        return responseData;
      } catch (error: any) {
        console.error("Login error:", error);
        
        // Enhanced error handling with specific messages
        if (error.code === "ECONNABORTED") {
          throw new Error("Login request timed out. Please try again.");
        }
        
        if (error.response?.status === 401) {
          const message = error.response.data?.details || "Invalid username or password";
          throw new Error(message);
        }
        
        // Pass through any already formatted errors
        if (error.message) {
          throw error;
        }
        
        throw new Error("An unexpected error occurred. Please try again later.");
      }
    },
    onSuccess: (data) => {
      console.log("Login successful, user data:", data);
      
      // Use our improved saveAuthState function from authHelpers
      saveAuthState(data);
      
      // Update the auth cache with the new user data
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Set a more personal greeting
      const greeting = data.firstName 
        ? `Welcome back, ${data.firstName}!` 
        : "Welcome back!";
      
      toast({
        title: "Login successful!",
        description: greeting,
        variant: "default",
      });
      
      // Add a slight delay before redirect to ensure toast is seen
      setTimeout(() => {
        // Redirect to dashboard using direct window location for more reliable navigation
        window.location.href = "/dashboard";
      }, 800);
    },
    onError: (error: any) => {
      console.error("Login error in mutation:", error);
      
      // Extract more detailed error information if available
      let errorDetails = error.message || "Please check your credentials and try again.";
      
      // Check if there's a more detailed message in the response data
      if (error.response?.data?.details) {
        errorDetails = error.response.data.details;
      }
      
      // Special case for network errors
      if (error.message && error.message.includes("Network Error")) {
        errorDetails = "Can't connect to the server. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Login failed",
        description: errorDetails,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof loginSchema>) {
    login(values);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/90 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto w-48 h-48 mb-4 animate-float">
            <img 
              src={raisingArizonaLogo} 
              alt="Raising Arizona Preschool" 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-4xl font-accent bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2 animate-pulse-slow">MentorMe</h1>
          <p className="text-neutral-800 animate-pop font-bold">School sucks, mentors rule</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-6">Log In</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field} 
                        onChange={(e) => {
                          // Trim whitespace when user types
                          field.onChange(e.target.value.trim());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Username is case-sensitive (e.g., "jlcookie20")
                    </p>
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
                        placeholder="Enter your password" 
                        {...field} 
                        onChange={(e) => {
                          // Trim whitespace when user types
                          field.onChange(e.target.value.trim());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 hover-pop hover-glow" disabled={isPending}>
                {isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="my-6 flex items-center">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          
          <GoogleAuthButton 
            mode="signin"
            onSuccess={() => {
              // Redirect will happen automatically from the server
              console.log("Google authentication successful");
            }}
            onError={(error) => {
              console.error("Google auth error:", error);
              toast({
                title: "Authentication failed",
                description: "Please try logging in with username/password instead.",
                variant: "destructive",
              });
            }}
          />
          
          <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-100">
            <p className="text-sm text-amber-800">
              <span className="font-semibold block mb-1">Note:</span>
              For testing, please use username: <strong>jlcookie20</strong> password: <strong>password</strong>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-800">
              Don't have an account? <Link href="/register" className="text-primary hover:underline hover-rotate font-bold">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
