import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
// Using text-based MentorMe logo for now

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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Eye, EyeOff } from "lucide-react";

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
  
  // Custom branding add-on
  customBranding: z.boolean().default(false),
  
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
  const [showPassword, setShowPassword] = useState(false);

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
      customBranding: false,
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
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold tracking-wide">MentorMe</h1>
                <p className="text-xs text-blue-100 text-center mt-1">Professional Development Platform</p>
              </div>
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

                {/* Subscription Plan Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary border-b pb-2">Choose Your Plan</h3>
                  
                  <FormField
                    control={form.control}
                    name="subscriptionPlan"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            {/* 30-Day Trial */}
                            <div className="relative">
                              <RadioGroupItem
                                value="trial"
                                id="trial"
                                className="peer sr-only"
                              />
                              <label
                                htmlFor="trial"
                                className="flex flex-col items-start space-y-2 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-lg">30-Day Free Trial</span>
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                      Recommended
                                    </span>
                                  </div>
                                  <span className="text-2xl font-bold text-green-600">FREE</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Full access to all features for 30 days. No credit card required.
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• Unlimited teacher accounts</li>
                                  <li>• Complete module library</li>
                                  <li>• Progress tracking</li>
                                  <li>• Admin dashboard</li>
                                </ul>
                              </label>
                            </div>

                            {/* Monthly Plan */}
                            <div className="relative">
                              <RadioGroupItem
                                value="monthly"
                                id="monthly"
                                className="peer sr-only"
                              />
                              <label
                                htmlFor="monthly"
                                className="flex flex-col items-start space-y-2 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-semibold text-lg">Monthly Plan</span>
                                  <div className="text-right">
                                    <span className="text-xl font-bold">$89<span className="text-sm font-normal">/month</span></span>
                                    <p className="text-sm text-gray-600">+ $7 per teacher</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Perfect for getting started with flexible monthly billing.
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• $89 base monthly fee</li>
                                  <li>• $7 per active teacher account</li>
                                  <li>• Complete module library</li>
                                  <li>• Progress tracking & admin dashboard</li>
                                </ul>
                                <p className="text-xs text-amber-600 font-medium">
                                  * You agree to pay $7/month for each active teacher. Update your account when teachers leave.
                                </p>
                              </label>
                            </div>

                            {/* Annual Plan */}
                            <div className="relative">
                              <RadioGroupItem
                                value="yearly"
                                id="yearly"
                                className="peer sr-only"
                              />
                              <label
                                htmlFor="yearly"
                                className="flex flex-col items-start space-y-2 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-lg">Annual Plan</span>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                      Save 2 months
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xl font-bold">$89<span className="text-sm font-normal">/month</span></span>
                                    <p className="text-sm text-gray-600">+ $7 per teacher</p>
                                    <p className="text-xs text-gray-500">($890 billed annually)</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Best value! Pay for 10 months, get 12 months of service.
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• Save $178 annually (2 months free)</li>
                                  <li>• $7 per active teacher account</li>
                                  <li>• Priority support included</li>
                                </ul>
                                <p className="text-xs text-amber-600 font-medium">
                                  * You agree to pay $7/month for each active teacher. Update your account when teachers leave.
                                </p>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Custom Branding Add-on */}
                <div className="border-2 border-orange-200 rounded-lg p-6 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">
                        Premium Custom Branding Package
                      </h3>
                      <p className="text-orange-700 mb-4">
                        Transform your school with a complete custom brand experience designed specifically for your values and vision.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-1">🎵 Custom Core Values Song</h4>
                          <p className="text-sm text-orange-600">Professional recording tailored to your school's values</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-1">🎓 Core Values Training</h4>
                          <p className="text-sm text-orange-600">Specialized training module for your team</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-1">🎨 Custom Logo Design</h4>
                          <p className="text-sm text-orange-600">Professional logo reflecting your school's identity</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-800 mb-1">🚀 Personalized Onboarding</h4>
                          <p className="text-sm text-orange-600">Custom training program for your staff</p>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="customBranding"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-orange-400 data-[state=checked]:bg-orange-500"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-lg font-semibold text-orange-800">
                                Add Custom Branding Package - $1,999 one-time fee
                              </FormLabel>
                              <p className="text-sm text-orange-600">
                                Complete brand transformation including song, training, logo, and onboarding
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
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
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Create a secure password" 
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
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