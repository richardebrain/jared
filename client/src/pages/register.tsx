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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import GoogleAuthButton from "@/components/GoogleAuthButton";


// Form schema for registration - email is used as username
const registerSchema = z.object({
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
  schoolId: z.string().min(1, {
    message: "Please select a school.",
  }),
  // Using defaults for removed fields to maintain compatibility with backend
  language: z.string().default("English"),
  nativeLanguage: z.string().default("English"),
  timeZone: z.string().default("UTC-05:00"), // Default to Eastern Time
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch available schools
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['/api/schools'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: false, // Temporarily disable to fix the issue
  });

  // Create form with simplified fields - email is used as username
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      schoolId: "1", // Default to Raising Arizona
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
        // Make sure all form data is clean and trimmed - use email as username
        const cleanData = {
          ...data,
          username: data.email.trim(), // Use email as username
          password: data.password.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          schoolId: parseInt(data.schoolId), // Convert string to number
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
    onError: (error: any) => {
      console.error("Registration error details:", error);
      
      // Extract more detailed error information if available
      let errorDetails = error.message || "There was an error creating your account.";
      
      // Check if there's a more detailed message in the response data
      if (error.response?.data?.details) {
        errorDetails = error.response.data.details;
      } else if (error.response?.data?.message) {
        // Handle common registration errors
        const message = error.response.data.message;
        if (message === "Username already exists") {
          errorDetails = "This username is already taken. Please try a different username.";
        } else if (message === "Required fields are missing") {
          errorDetails = "Please fill in all required fields (username, password, first name, last name, email).";
        }
      }
      
      toast({
        title: "Registration failed",
        description: errorDetails,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof registerSchema>) {
    // Trim values at submission time and use email as username
    const trimmedValues = {
      ...values,
      password: values.password.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim()
    };
    register(trimmedValues);
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
          
          {/* Direct email signup */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-primary">Create Account</h3>
              <p className="text-sm text-gray-600">Sign up with your email to get started</p>
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
                          // Allow the field to work with password managers
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
                          // Allow the field to work with password managers
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              

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
                        // Allow the field to work with password managers
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
                        // Allow the field to work with password managers
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your school" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schoolsLoading ? (
                          <SelectItem value="loading" disabled>Loading schools...</SelectItem>
                        ) : Array.isArray(schools) && schools.length > 0 ? (
                          schools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name} {school.isFreeAccess && "(Free)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="1">Raising Arizona Preschool (Free)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
              Already have an account? <Link href="/login" className="text-primary hover:underline hover-rotate font-bold">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
