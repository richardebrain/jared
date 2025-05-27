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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema for business registration
const businessSignupSchema = z.object({
  // School information
  schoolName: z.string().min(2, {
    message: "School name must be at least 2 characters.",
  }),
  contactEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contactPhone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  address: z.string().min(5, {
    message: "Please enter the school address.",
  }),
  city: z.string().min(2, {
    message: "City is required.",
  }),
  state: z.string().min(2, {
    message: "State is required.",
  }),
  zipCode: z.string().min(5, {
    message: "ZIP code is required.",
  }),
  
  // Subscription plan
  subscriptionPlan: z.enum(["trial", "monthly", "yearly"], {
    required_error: "Please select a subscription plan.",
  }),
  
  // Owner account information
  firstName: z.string().min(1, {
    message: "First name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  
  // Defaults
  language: z.string().default("English"),
  nativeLanguage: z.string().default("English"),
  timeZone: z.string().default("UTC-05:00"),
});

export default function BusinessSignup() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Create form for business registration
  const form = useForm<z.infer<typeof businessSignupSchema>>({
    resolver: zodResolver(businessSignupSchema),
    defaultValues: {
      schoolName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      subscriptionPlan: "trial",
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      language: "English",
      nativeLanguage: "English",
      timeZone: "UTC-05:00",
    },
  });

  // Business registration mutation
  const { mutate: registerBusiness, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof businessSignupSchema>) => {
      try {
        const cleanData = {
          ...data,
          schoolName: data.schoolName.trim(),
          contactEmail: data.contactEmail.trim(),
          contactPhone: data.contactPhone.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          zipCode: data.zipCode.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          username: data.username.trim(),
          password: data.password.trim(),
        };
        
        console.log("Sending business registration data:", { 
          ...cleanData, 
          password: "***" // Don't log actual password
        });
        
        return await apiRequest("/api/auth/register-business", {
          method: "POST",
          data: cleanData
        });
      } catch (error) {
        console.error("Business registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "School Registration Successful!",
        description: "Your school has been registered and you can now log in as the school administrator.",
      });
      
      // Redirect to login page
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Business registration failed:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register school. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof businessSignupSchema>) {
    registerBusiness(values);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={raisingArizonaLogo} 
                alt="MentorMe Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Register Your School</CardTitle>
            <CardDescription>
              Start using MentorMe at your preschool to help your teachers grow and succeed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* School Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">School Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your School Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="school@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Phoenix" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="AZ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="85001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Administrator Account Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Administrator Account</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input placeholder="admin_username" {...field} />
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
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a secure password" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 hover-pop hover-glow" 
                  disabled={isPending}
                  size="lg"
                >
                  {isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating School Account...
                    </div>
                  ) : (
                    "Register School & Create Admin Account"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Log in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}