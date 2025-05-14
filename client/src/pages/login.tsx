import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
        const responseData = await apiRequest("/api/auth/login", {
          method: "POST",
          data: data
        });
        console.log("Login response:", responseData);
        return responseData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login successful, user data:", data);
      
      // Update the auth cache with the new user data
      queryClient.setQueryData(["/api/auth/me"], data);
      
      toast({
        title: "Login successful!",
        description: `Welcome back${data.firstName ? ", " + data.firstName : ""}!`,
      });
      
      // Redirect to dashboard using direct window location for more reliable navigation
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof loginSchema>) {
    login(values);
    // Let the onSuccess handle navigation
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
