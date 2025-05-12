import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import GoogleAuthButton from "@/components/GoogleAuthButton";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";


// Form schema for registration
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
  language: z.string().min(1, {
    message: "Please select your preferred teaching language.",
  }),
  nativeLanguage: z.string().min(1, {
    message: "Please select your native language.",
  }),
  timeZone: z.string().min(1, {
    message: "Please select your time zone.",
  }),
});

// Teaching languages array
const languages = [
  "English", "Spanish", "English/Spanish Bilingual"
];

// Timezones array (simplified)
const timeZones = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", 
  "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00", 
  "UTC-02:00", "UTC-01:00", "UTC+00:00", "UTC+01:00", "UTC+02:00", 
  "UTC+03:00", "UTC+04:00", "UTC+05:00", "UTC+06:00", "UTC+07:00", 
  "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00", "UTC+12:00"
];

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Create form
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      language: "",
      nativeLanguage: "",
      timeZone: "",
    },
  });

  // Register mutation
  const { mutate: register, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "Welcome to MentorMe. Let's start your teacher training journey!",
      });
      setLocation("/");
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

  // Detect user's timezone
  const getUserTimeZone = () => {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? "+" : "-";
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset).toString().padStart(2, "0");
    const minutes = ((absOffset - Math.floor(absOffset)) * 60).toString().padStart(2, "0");
    return `UTC${sign}${hours}:${minutes}`;
  };

  // Set default timezone on component mount
  useState(() => {
    const userTimeZone = getUserTimeZone();
    const closestTimeZone = timeZones.find(tz => tz.includes(userTimeZone.split(":")[0])) || "UTC+00:00";
    form.setValue("timeZone", closestTimeZone);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto w-48 h-48 mb-4">
            <img 
              src={raisingArizonaLogo} 
              alt="Raising Arizona Preschool" 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-4xl font-accent bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2">MentorMe</h1>
          <p className="text-neutral-800">Create your Raising Arizona teacher account and begin your professional development journey today!</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-6 text-center">Sign Up</h2>
          
          {/* Google Sign Up Button */}
          <div className="mb-6">
            <GoogleAuthButton 
              mode="signup"
              onSuccess={() => setLocation('/dashboard')}
              onError={(error) => {
                toast({
                  title: "Registration Failed",
                  description: "Could not sign up with Google. Please try again or use the form below.",
                  variant: "destructive"
                });
              }}
            />
            
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or sign up with email
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
                        <Input placeholder="Enter your first name" {...field} />
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
                        <Input placeholder="Enter your last name" {...field} />
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
                      <Input placeholder="Choose a username" {...field} />
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
                      <Input type="email" placeholder="Enter your email" {...field} />
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
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaching Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teaching language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map(language => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nativeLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your primary language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map(language => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="timeZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Time Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your time zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeZones.map(timeZone => (
                          <SelectItem key={timeZone} value={timeZone}>
                            {timeZone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending}>
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
              Already have an account? <Link href="/" className="text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
