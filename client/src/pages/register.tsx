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
  
  // School registration fields (optional)
  isSchoolOwner: z.boolean().default(false),
  schoolName: z.string().optional(),
  adminPassword: z.string().optional(),
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // State for showing/hiding school owner fields
  const [isSchoolOwner, setIsSchoolOwner] = useState(false);
  
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
      // School registration fields
      isSchoolOwner: false,
      schoolName: "",
      adminPassword: "",
    },
  });

  // State for file upload
  const [schoolLogo, setSchoolLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSchoolLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
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
        
        // If this is a school owner registration
        if (data.isSchoolOwner && data.schoolName && data.adminPassword) {
          console.log("Registering as school owner");
          
          // First create the school - simple JSON request
          const schoolData = {
            name: data.schoolName.trim(),
            adminPasswordHash: data.adminPassword.trim(),
            contactEmail: data.email.trim(),
            contactPhone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            customization: {
              primaryColor: "#1e88e5",
              secondaryColor: "#ffca28",
              accentColor: "#ff5722"
            }
          };
          
          // Create school with simple JSON request
          const schoolResponse = await apiRequest("/api/schools/create", {
            method: "POST",
            data: schoolData
          });
          
          // Then register the user with the new school ID
          const userRegData = {
            ...cleanData,
            schoolId: schoolResponse.id,
            isSchoolAdmin: true
          };
          
          // If we had logo, we can update it after user registration in a separate step
          const logoPromise = schoolLogo ? Promise.resolve() : null;
          
          // Register the user
          const userResponse = await apiRequest("/api/auth/register", {
            method: "POST",
            data: userRegData
          });
          
          // Upload logo if we have one, after user is created
          if (schoolLogo && logoPromise) {
            const formData = new FormData();
            formData.append('logo', schoolLogo);
            formData.append('schoolId', schoolResponse.id.toString());
            
            await fetch('/api/schools/logo', {
              method: 'POST',
              body: formData
            });
          }
          
          return userResponse;
        } else {
          // Regular user registration
          console.log("Sending registration data:", { 
            ...cleanData, 
            password: "***" // Don't log actual password
          });
          
          return await apiRequest("/api/auth/register", {
            method: "POST",
            data: cleanData
          });
        }
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
              
              {/* School owner checkbox */}
              <div className="mt-8 border-t pt-6">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isSchoolOwner"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={isSchoolOwner}
                    onChange={(e) => {
                      setIsSchoolOwner(e.target.checked);
                      form.setValue('isSchoolOwner', e.target.checked);
                    }}
                  />
                  <label 
                    htmlFor="isSchoolOwner" 
                    className="text-sm font-medium"
                  >
                    I am a school owner or director
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  School owners can create and manage accounts for their teachers and staff
                </p>
              </div>
              
              {/* Conditional school fields */}
              {isSchoolOwner && (
                <div className="mt-6 p-4 border rounded-md bg-gray-50 animate-fadeIn space-y-6">
                  <h3 className="font-bold text-center mb-2">School Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your school or center name" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Create an admin password" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-1">
                          You'll need this password to access admin features
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  {/* School Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      School Logo <span className="text-xs text-gray-500">(optional)</span>
                    </label>
                    
                    <div className="flex items-center gap-4">
                      {/* Logo Preview */}
                      {logoPreview ? (
                        <div className="w-24 h-24 rounded overflow-hidden border">
                          <img 
                            src={logoPreview} 
                            alt="School logo preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded border flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs text-center">Logo Preview</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-center w-full">
                          <label 
                            htmlFor="school-logo-upload" 
                            className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                              </svg>
                              <p className="mb-1 text-xs text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">SVG, PNG, or JPG (max. 2MB)</p>
                            </div>
                            <input 
                              id="school-logo-upload" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Your logo will replace the Raising Arizona logo for your teachers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 hover-pop hover-glow mt-6" disabled={isPending}>
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
